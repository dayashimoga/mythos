"""
Mythos 3D - Production Asset Builder Framework
Provides DetailedMeshBuilder, PBR Texture Synthesis, and glTF 2.0 Binary Encoding
Used to produce continuous anatomical meshes for all seven realm enemies and bosses.
"""

import os
import math
import struct
import json
import io
import numpy as np
from PIL import Image, ImageDraw

def normalize_vec3(v):
    mag = math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2])
    if mag < 1e-7:
        return (0.0, 1.0, 0.0)
    return (v[0]/mag, v[1]/mag, v[2]/mag)

def cross_vec3(a, b):
    return (
        a[1]*b[2] - a[2]*b[1],
        a[2]*b[0] - a[0]*b[2],
        a[0]*b[1] - a[1]*b[0]
    )

def dot_vec3(a, b):
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]

# ---------------------------------------------------------
# glTF 2.0 Binary Builder
# ---------------------------------------------------------

class GLBBuilder:
    def __init__(self, name="Asset"):
        self.name = name
        self.bin_data = bytearray()
        self.buffer_views = []
        self.accessors = []
        self.materials = []
        self.textures = []
        self.images = []
        self.samplers = [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}]
        self.meshes = []
        self.nodes = []

    def add_buffer_view(self, data, target=None):
        pad = (4 - (len(self.bin_data) % 4)) % 4
        self.bin_data.extend(b'\x00' * pad)
        offset = len(self.bin_data)
        self.bin_data.extend(data)
        bv = {"buffer": 0, "byteOffset": offset, "byteLength": len(data)}
        if target:
            bv["target"] = target
        self.buffer_views.append(bv)
        return len(self.buffer_views) - 1

    def add_accessor(self, buffer_view_idx, component_type, count, acc_type, min_v=None, max_v=None):
        acc = {
            "bufferView": buffer_view_idx,
            "byteOffset": 0,
            "componentType": component_type,
            "count": count,
            "type": acc_type
        }
        if min_v is not None:
            acc["min"] = min_v
        if max_v is not None:
            acc["max"] = max_v
        self.accessors.append(acc)
        return len(self.accessors) - 1

    def add_image_from_pil(self, pil_image):
        buf = io.BytesIO()
        pil_image.save(buf, format="PNG")
        png_bytes = buf.getvalue()
        bv_idx = self.add_buffer_view(png_bytes)
        img_idx = len(self.images)
        self.images.append({"bufferView": bv_idx, "mimeType": "image/png"})
        tex_idx = len(self.textures)
        self.textures.append({"sampler": 0, "source": img_idx})
        return tex_idx

    def add_pbr_material(self, name, albedo_tex, normal_tex=None, mr_tex=None, emissive_tex=None, double_sided=False):
        pbr = {
            "baseColorTexture": {"index": albedo_tex},
            "metallicFactor": 1.0,
            "roughnessFactor": 1.0
        }
        if mr_tex is not None:
            pbr["metallicRoughnessTexture"] = {"index": mr_tex}

        mat = {"name": name, "pbrMetallicRoughness": pbr, "doubleSided": double_sided}
        if normal_tex is not None:
            mat["normalTexture"] = {"index": normal_tex, "scale": 1.0}
        if emissive_tex is not None:
            mat["emissiveTexture"] = {"index": emissive_tex}
            mat["emissiveFactor"] = [1.0, 1.0, 1.0]

        self.materials.append(mat)
        return len(self.materials) - 1

    def add_mesh_primitive(self, mesh_builder):
        if len(mesh_builder.positions) == 0 or len(mesh_builder.indices) == 0:
            return None

        pos_arr = np.array(mesh_builder.positions, dtype=np.float32)
        norm_arr = np.array(mesh_builder.normals, dtype=np.float32)
        uv_arr = np.array(mesh_builder.uvs, dtype=np.float32)
        idx_arr = np.array(mesh_builder.indices, dtype=np.uint16)

        pos_min = pos_arr.min(axis=0).tolist()
        pos_max = pos_arr.max(axis=0).tolist()

        bv_pos = self.add_buffer_view(pos_arr.tobytes(), 34962)
        bv_norm = self.add_buffer_view(norm_arr.tobytes(), 34962)
        bv_uv = self.add_buffer_view(uv_arr.tobytes(), 34962)
        bv_idx = self.add_buffer_view(idx_arr.tobytes(), 34963)

        acc_pos = self.add_accessor(bv_pos, 5126, len(pos_arr), "VEC3", pos_min, pos_max)
        acc_norm = self.add_accessor(bv_norm, 5126, len(norm_arr), "VEC3")
        acc_uv = self.add_accessor(bv_uv, 5126, len(uv_arr), "VEC2")
        acc_idx = self.add_accessor(bv_idx, 5123, len(idx_arr), "SCALAR")

        return {
            "attributes": {
                "POSITION": acc_pos,
                "NORMAL": acc_norm,
                "TEXCOORD_0": acc_uv
            },
            "indices": acc_idx,
            "material": mesh_builder.mat_id
        }

    def build_glb(self):
        gltf = {
            "asset": {"version": "2.0", "generator": "Mythos 3D Production Generator"},
            "scene": 0,
            "scenes": [{"name": self.name + "_Scene", "nodes": list(range(len(self.nodes)))}],
            "nodes": self.nodes,
            "meshes": self.meshes,
            "materials": self.materials,
            "textures": self.textures,
            "images": self.images,
            "samplers": self.samplers,
            "accessors": self.accessors,
            "bufferViews": self.buffer_views,
            "buffers": [{"byteLength": len(self.bin_data)}]
        }

        json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
        json_pad = (4 - (len(json_bytes) % 4)) % 4
        json_bytes += b' ' * json_pad

        total_length = 12 + 8 + len(json_bytes) + 8 + len(self.bin_data)

        header = struct.pack('<4sII', b'glTF', 2, total_length)
        chunk0_header = struct.pack('<II', len(json_bytes), 0x4E4F534A)
        chunk1_header = struct.pack('<II', len(self.bin_data), 0x004E4942)

        return header + chunk0_header + json_bytes + chunk1_header + self.bin_data

# ---------------------------------------------------------
# Detailed Mesh Builder
# ---------------------------------------------------------

class DetailedMeshBuilder:
    def __init__(self, mat_id):
        self.mat_id = mat_id
        self.positions = []
        self.normals = []
        self.uvs = []
        self.indices = []

    def add_cylinder_segment(self, p_bottom, p_top, r_bottom, r_top, segments=16, uv_v_bottom=0.0, uv_v_top=1.0):
        bx, by, bz = p_bottom
        tx, ty, tz = p_top
        axis = (tx - bx, ty - by, tz - bz)
        height = math.sqrt(axis[0]**2 + axis[1]**2 + axis[2]**2)
        if height < 1e-6:
            return

        up = (axis[0]/height, axis[1]/height, axis[2]/height)
        ref = (0.0, 1.0, 0.0) if abs(up[1]) < 0.9 else (1.0, 0.0, 0.0)
        right = normalize_vec3(cross_vec3(ref, up))
        fwd = cross_vec3(up, right)

        base_idx = len(self.positions)
        for i in range(segments):
            angle = i * (2.0 * math.pi / segments)
            cos_a = math.cos(angle)
            sin_a = math.sin(angle)
            u = i / segments

            dx = right[0] * cos_a + fwd[0] * sin_a
            dy = right[1] * cos_a + fwd[1] * sin_a
            dz = right[2] * cos_a + fwd[2] * sin_a

            norm = (dx, dy, dz)

            # Bottom ring
            self.positions.append((bx + dx * r_bottom, by + dy * r_bottom, bz + dz * r_bottom))
            self.normals.append(norm)
            self.uvs.append((u, uv_v_bottom))

            # Top ring
            self.positions.append((tx + dx * r_top, ty + dy * r_top, tz + dz * r_top))
            self.normals.append(norm)
            self.uvs.append((u, uv_v_top))

        for i in range(segments):
            b1 = base_idx + i * 2
            t1 = b1 + 1
            next_i = (i + 1) % segments
            b2 = base_idx + next_i * 2
            t2 = b2 + 1
            self.indices.extend([b1, b2, t2, b1, t2, t1])

    def add_ellipsoid(self, center, radii, segments_lat=12, segments_lon=16):
        cx, cy, cz = center
        rx, ry, rz = radii
        base_idx = len(self.positions)

        for i in range(segments_lat + 1):
            theta = i * math.pi / segments_lat
            sin_t = math.sin(theta)
            cos_t = math.cos(theta)
            v = i / segments_lat

            for j in range(segments_lon):
                phi = j * 2.0 * math.pi / segments_lon
                sin_p = math.sin(phi)
                cos_p = math.cos(phi)
                u = j / segments_lon

                x = rx * sin_t * cos_p
                y = ry * cos_t
                z = rz * sin_t * sin_p

                nx = sin_t * cos_p
                ny = cos_t
                nz = sin_t * sin_p

                self.positions.append((cx + x, cy + y, cz + z))
                self.normals.append(normalize_vec3((nx, ny, nz)))
                self.uvs.append((u, v))

        for i in range(segments_lat):
            for j in range(segments_lon):
                p1 = base_idx + i * segments_lon + j
                p2 = base_idx + (i + 1) * segments_lon + j
                next_j = (j + 1) % segments_lon
                p3 = base_idx + (i + 1) * segments_lon + next_j
                p4 = base_idx + i * segments_lon + next_j
                self.indices.extend([p1, p2, p3, p1, p3, p4])

    def add_torus(self, center, major_radius, minor_radius, segments_major=24, segments_minor=12):
        cx, cy, cz = center
        base_idx = len(self.positions)

        for i in range(segments_major):
            theta = i * 2.0 * math.pi / segments_major
            cos_t = math.cos(theta)
            sin_t = math.sin(theta)
            u = i / segments_major

            center_ring = (cx + cos_t * major_radius, cy, cz + sin_t * major_radius)

            for j in range(segments_minor):
                phi = j * 2.0 * math.pi / segments_minor
                cos_p = math.cos(phi)
                sin_p = math.sin(phi)
                v = j / segments_minor

                px = center_ring[0] + cos_t * cos_p * minor_radius
                py = center_ring[1] + sin_p * minor_radius
                pz = center_ring[2] + sin_t * cos_p * minor_radius

                nx = cos_t * cos_p
                ny = sin_p
                nz = sin_t * cos_p

                self.positions.append((px, py, pz))
                self.normals.append((nx, ny, nz))
                self.uvs.append((u, v))

        for i in range(segments_major):
            next_i = (i + 1) % segments_major
            for j in range(segments_minor):
                next_j = (j + 1) % segments_minor
                p1 = base_idx + i * segments_minor + j
                p2 = base_idx + next_i * segments_minor + j
                p3 = base_idx + next_i * segments_minor + next_j
                p4 = base_idx + i * segments_minor + next_j
                self.indices.extend([p1, p2, p3, p1, p3, p4])

    def add_beveled_plate(self, center, size, thickness=0.06):
        cx, cy, cz = center
        sx, sy = size[0]*0.5, size[1]*0.5
        t2 = thickness*0.5
        base_idx = len(self.positions)

        # Front face
        corners_f = [
            (cx - sx, cy - sy, cz + t2),
            (cx + sx, cy - sy, cz + t2),
            (cx + sx, cy + sy, cz + t2),
            (cx - sx, cy + sy, cz + t2),
        ]
        # Back face
        corners_b = [
            (cx - sx, cy - sy, cz - t2),
            (cx + sx, cy - sy, cz - t2),
            (cx + sx, cy + sy, cz - t2),
            (cx - sx, cy + sy, cz - t2),
        ]

        # Front
        for p in corners_f:
            self.positions.append(p)
            self.normals.append((0.0, 0.0, 1.0))
            self.uvs.append((0.5, 0.5))
        self.indices.extend([base_idx, base_idx+1, base_idx+2, base_idx, base_idx+2, base_idx+3])

        # Back
        b_idx = base_idx + 4
        for p in corners_b:
            self.positions.append(p)
            self.normals.append((0.0, 0.0, -1.0))
            self.uvs.append((0.5, 0.5))
        self.indices.extend([b_idx, b_idx+2, b_idx+1, b_idx, b_idx+3, b_idx+2])

        # Sides
        s_idx = base_idx + 8
        for i in range(4):
            ni = (i + 1) % 4
            p1 = corners_f[i]
            p2 = corners_f[ni]
            p3 = corners_b[ni]
            p4 = corners_b[i]
            cur = len(self.positions)
            norm = normalize_vec3(cross_vec3(
                (p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]),
                (p4[0]-p1[0], p4[1]-p1[1], p4[2]-p1[2])
            ))
            for p in [p1, p2, p3, p4]:
                self.positions.append(p)
                self.normals.append(norm)
                self.uvs.append((0.0, 0.0))
            self.indices.extend([cur, cur+1, cur+2, cur, cur+2, cur+3])

    def add_curved_blade(self, spine_points, widths, thicknesses):
        base_idx = len(self.positions)
        count = len(spine_points)
        for i, pt in enumerate(spine_points):
            w = widths[i]
            t = thicknesses[i]
            px, py, pz = pt
            v = i / max(1, count - 1)

            # Left cutting edge
            self.positions.append((px - w*0.5, py, pz))
            self.normals.append((-1.0, 0.2, 0.0))
            self.uvs.append((0.0, v))

            # Center ridge front
            self.positions.append((px, py, pz + t*0.5))
            self.normals.append((0.0, 0.2, 1.0))
            self.uvs.append((0.5, v))

            # Right spine edge
            self.positions.append((px + w*0.5, py, pz))
            self.normals.append((1.0, 0.2, 0.0))
            self.uvs.append((1.0, v))

            # Center ridge back
            self.positions.append((px, py, pz - t*0.5))
            self.normals.append((0.0, 0.2, -1.0))
            self.uvs.append((0.5, v))

        for i in range(count - 1):
            r1 = base_idx + i * 4
            r2 = base_idx + (i + 1) * 4
            # Quad left-front: edge -> ridge
            self.indices.extend([r1, r2, r2+1, r1, r2+1, r1+1])
            # Quad right-front: ridge -> right
            self.indices.extend([r1+1, r2+1, r2+2, r1+1, r2+2, r1+2])
            # Quad right-back: right -> back ridge
            self.indices.extend([r1+2, r2+2, r2+3, r1+2, r2+3, r1+3])
            # Quad left-back: back ridge -> left edge
            self.indices.extend([r1+3, r2+3, r2, r1+3, r2, r1])

    def add_feathered_wing(self, root_pos, span, chord, feather_count=8, is_right=False):
        sign = 1.0 if is_right else -1.0
        rx, ry, rz = root_pos

        for i in range(feather_count):
            t = i / feather_count
            fx = rx + sign * (0.2 + t * span)
            fy = ry + math.sin(t * math.pi * 0.7) * 0.35 - t * 0.2
            fz = rz - t * chord * 0.6
            f_length = (1.0 - t * 0.3) * chord
            cur_idx = len(self.positions)

            # Feather quad with center ridge
            p_root = (fx, fy, fz)
            p_tip = (fx + sign * f_length * 0.4, fy - f_length * 0.8, fz - f_length * 0.3)
            p_left = (fx - sign * 0.08, fy - f_length * 0.4, fz + 0.04)
            p_right = (fx + sign * 0.12, fy - f_length * 0.4, fz - 0.04)

            norm = (0.0, 1.0, 0.0)
            for p in [p_root, p_left, p_tip, p_right]:
                self.positions.append(p)
                self.normals.append(norm)
                self.uvs.append((0.5, 0.5))

            self.indices.extend([cur_idx, cur_idx+1, cur_idx+2, cur_idx, cur_idx+2, cur_idx+3])

    def add_serpentine_spine(self, spline_points, radii, segments_radial=12):
        count = len(spline_points)
        base_idx = len(self.positions)

        for i in range(count):
            curr = spline_points[i]
            r = radii[i]
            v = i / max(1, count - 1)

            if i < count - 1:
                nxt = spline_points[i+1]
                fwd = normalize_vec3((nxt[0]-curr[0], nxt[1]-curr[1], nxt[2]-curr[2]))
            else:
                prv = spline_points[i-1]
                fwd = normalize_vec3((curr[0]-prv[0], curr[1]-prv[1], curr[2]-prv[2]))

            ref = (0.0, 1.0, 0.0) if abs(fwd[1]) < 0.9 else (1.0, 0.0, 0.0)
            right = normalize_vec3(cross_vec3(ref, fwd))
            up = cross_vec3(fwd, right)

            for j in range(segments_radial):
                angle = j * (2.0 * math.pi / segments_radial)
                cos_a = math.cos(angle)
                sin_a = math.sin(angle)
                u = j / segments_radial

                norm = (right[0]*cos_a + up[0]*sin_a, right[1]*cos_a + up[1]*sin_a, right[2]*cos_a + up[2]*sin_a)
                px = curr[0] + norm[0] * r
                py = curr[1] + norm[1] * r
                pz = curr[2] + norm[2] * r

                self.positions.append((px, py, pz))
                self.normals.append(norm)
                self.uvs.append((u, v))

        for i in range(count - 1):
            r1 = base_idx + i * segments_radial
            r2 = base_idx + (i + 1) * segments_radial
            for j in range(segments_radial):
                nj = (j + 1) % segments_radial
                self.indices.extend([r1 + j, r2 + j, r2 + nj, r1 + j, r2 + nj, r1 + nj])
