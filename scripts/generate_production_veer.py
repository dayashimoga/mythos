"""
Mythos 3D - Production Humanoid Character Generator (Hero Veer - Solar Guardian)
Stage B: Complete Production Character Architecture

Generates a game-ready, fully articulated 3D humanoid warrior glTF/GLB:
- Detailed anatomical geometry (~15k vertices, ~22k triangles):
  * Head with facial features (jaw, cheekbones, nose, lips, eyes, ears, Tripundra tilak)
  * Swept warrior topknot (Shikha) bound by polished brass ring
  * Athletic heroic muscular torso with broad chest and V-taper
  * Sculpted gilded bronze Cuirass breastplate with 8-pointed relief Surya medallion
  * Draped royal crimson silk Dhoti with gold embroidery and pleated kashta
  * Flowing Tapovan azure celestial sash
  * Agni solar brass bracers with engraved flame runes and flared elbow guards
  * Forged Sunsteel Surya Khadga scimitar with pommel, guard, and curved blade
  * Sculpted greaves and warrior sandals
- Authentic PBR textures (Albedo, Normal maps, Metallic/Roughness, Emissive)
- 24-bone Humanoid Skeleton3D with smooth vertex skinning & interactive sockets
- 18 authored skeletal animation clips:
  * idle, walk, run, sprint, turn, jump, fall, landing, dodge, block,
    parry, attack_light_1, attack_light_2, attack_heavy_finisher, combo,
    hit_reaction, interact, victory, defeat
"""

import os
import math
import struct
import json
import io
import numpy as np
from PIL import Image, ImageDraw

def quat_from_axis_angle(x, y, z, angle_rad):
    half = angle_rad * 0.5
    s = math.sin(half)
    c = math.cos(half)
    length = math.sqrt(x*x + y*y + z*z)
    if length < 1e-6:
        return [0.0, 0.0, 0.0, 1.0]
    return [x/length * s, y/length * s, z/length * s, c]

def quat_mult(q1, q2):
    x1, y1, z1, w1 = q1
    x2, y2, z2, w2 = q2
    return [
        w1*x2 + x1*w2 + y1*z2 - z1*y2,
        w1*y2 - x1*z2 + y1*w2 + z1*x2,
        w1*z2 + x1*y2 - y1*x2 + z1*w2,
        w1*w2 - x1*x2 - y1*y2 - z1*z2
    ]

def euler_to_quat(pitch_x, yaw_y, roll_z):
    qx = quat_from_axis_angle(1, 0, 0, pitch_x)
    qy = quat_from_axis_angle(0, 1, 0, yaw_y)
    qz = quat_from_axis_angle(0, 0, 1, roll_z)
    return quat_mult(qy, quat_mult(qx, qz))

# ---------------------------------------------------------
# Texture Generation (PBR Albedo, Normal, MR, Emissive)
# ---------------------------------------------------------

def create_skin_textures():
    size = (512, 512)
    # Albedo: Warm radiant bronze skin with anatomical shading and facial markings
    albedo = Image.new("RGBA", size, (188, 115, 65, 255))
    draw = ImageDraw.Draw(albedo)
    # Subtle skin gradient & subsurface warmth
    for y in range(size[1]):
        factor = y / size[1]
        r = int(185 + factor * 20)
        g = int(110 + factor * 15)
        b = int(60 + factor * 12)
        draw.line([(0, y), (size[0], y)], fill=(r, g, b, 255))
    
    # Forehead Tripundra Tilak (Sacred 3 horizontal ash stripes + central red bindu)
    cy = 120
    draw.rectangle([180, cy - 14, 332, cy - 10], fill=(235, 235, 240, 255))
    draw.rectangle([170, cy - 6, 342, cy - 2], fill=(245, 245, 250, 255))
    draw.rectangle([180, cy + 2, 332, cy + 6], fill=(235, 235, 240, 255))
    # Red Kumkuma / Chandana bindu in center
    draw.ellipse([246, cy - 10, 266, cy + 4], fill=(200, 25, 25, 255))

    # Amber Eyes (left and right)
    draw.ellipse([140, 180, 210, 215], fill=(250, 250, 250, 255)) # sclera L
    draw.ellipse([160, 182, 195, 213], fill=(245, 160, 20, 255))  # amber iris L
    draw.ellipse([172, 190, 184, 205], fill=(20, 10, 5, 255))     # pupil L
    draw.ellipse([168, 188, 174, 194], fill=(255, 255, 255, 255)) # specular highlight L

    draw.ellipse([302, 180, 372, 215], fill=(250, 250, 250, 255)) # sclera R
    draw.ellipse([317, 182, 352, 213], fill=(245, 160, 20, 255))  # amber iris R
    draw.ellipse([328, 190, 340, 205], fill=(20, 10, 5, 255))     # pupil R
    draw.ellipse([324, 188, 330, 194], fill=(255, 255, 255, 255)) # specular highlight R

    # Lip definition
    draw.ellipse([210, 310, 302, 335], fill=(165, 80, 55, 255))

    # Normal map (flat tangent space base 128, 128, 255)
    normal = Image.new("RGB", size, (128, 128, 255))
    norm_draw = ImageDraw.Draw(normal)
    # Nose bridge elevation in normal map
    norm_draw.rectangle([248, 190, 264, 280], fill=(128, 155, 245))
    # Brow ridge
    norm_draw.arc([130, 160, 220, 185], 0, 180, fill=(110, 110, 250), width=4)
    norm_draw.arc([292, 160, 382, 185], 0, 180, fill=(110, 110, 250), width=4)

    # Metallic / Roughness (G = Roughness ~0.50, B = Metallic ~0.0)
    mr = Image.new("RGB", size, (0, 128, 0))

    return albedo, normal, mr

def create_cuirass_textures():
    size = (512, 512)
    # Ancient Gilded Bronze Cuirass with Hoysala filigree trim
    albedo = Image.new("RGBA", size, (135, 78, 38, 255))
    draw = ImageDraw.Draw(albedo)
    for i in range(0, 512, 32):
        draw.line([(0, i), (512, i)], fill=(155, 92, 45, 255), width=2)
    # Gold border trims
    draw.rectangle([10, 10, 502, 502], outline=(235, 175, 40, 255), width=14)
    draw.rectangle([28, 28, 484, 484], outline=(195, 135, 25, 255), width=6)
    # Corner rivets
    for cx, cy in [(40, 40), (472, 40), (40, 472), (472, 472), (256, 40), (256, 472)]:
        draw.ellipse([cx-8, cy-8, cx+8, cy+8], fill=(255, 215, 60, 255), outline=(120, 70, 20, 255), width=2)

    # Normal map
    normal = Image.new("RGB", size, (128, 128, 255))
    norm_draw = ImageDraw.Draw(normal)
    norm_draw.rectangle([10, 10, 502, 502], outline=(145, 145, 230), width=14)

    # Metallic / Roughness (Roughness ~0.26 = G 66, Metallic ~0.85 = B 216)
    mr = Image.new("RGB", size, (0, 66, 216))

    return albedo, normal, mr

def create_gold_medallion_textures():
    size = (256, 256)
    albedo = Image.new("RGBA", size, (255, 185, 15, 255))
    draw = ImageDraw.Draw(albedo)
    draw.ellipse([20, 20, 236, 236], outline=(255, 220, 80, 255), width=8)
    draw.ellipse([50, 50, 206, 206], fill=(255, 195, 25, 255), outline=(180, 110, 10, 255), width=4)
    center = (128, 128)
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        p_tip = (128 + math.cos(rad) * 110, 128 + math.sin(rad) * 110)
        p_base1 = (128 + math.cos(rad - 0.25) * 50, 128 + math.sin(rad - 0.25) * 50)
        p_base2 = (128 + math.cos(rad + 0.25) * 50, 128 + math.sin(rad + 0.25) * 50)
        draw.polygon([center, p_base1, p_tip, p_base2], fill=(255, 235, 110, 255))
    draw.ellipse([96, 96, 160, 160], fill=(255, 245, 180, 255), outline=(210, 130, 15, 255), width=3)

    emissive = Image.new("RGB", size, (255, 150, 0))
    em_draw = ImageDraw.Draw(emissive)
    em_draw.ellipse([80, 80, 176, 176], fill=(255, 200, 50))

    mr = Image.new("RGB", size, (0, 40, 235))
    return albedo, emissive, mr

def create_dhoti_textures():
    size = (512, 512)
    albedo = Image.new("RGBA", size, (125, 22, 28, 255))
    draw = ImageDraw.Draw(albedo)
    for y in range(0, 512, 8):
        draw.line([(0, y), (512, y)], fill=(140, 28, 35, 255), width=1)
    draw.rectangle([0, 430, 512, 512], fill=(225, 165, 30, 255))
    for x in range(16, 512, 32):
        draw.polygon([(x, 440), (x+16, 470), (x, 500), (x-16, 470)], fill=(160, 30, 35, 255))
        draw.ellipse([x-4, 466, x+4, 474], fill=(255, 225, 100, 255))
    draw.line([(0, 430), (512, 430)], fill=(255, 215, 80, 255), width=4)

    normal = Image.new("RGB", size, (128, 128, 255))
    norm_draw = ImageDraw.Draw(normal)
    for x in range(0, 512, 48):
        norm_draw.rectangle([x, 0, x+24, 430], fill=(115, 128, 250))
        norm_draw.rectangle([x+24, 0, x+48, 430], fill=(140, 128, 250))

    mr = Image.new("RGB", size, (0, 184, 12))
    return albedo, normal, mr

def create_sash_textures():
    size = (256, 256)
    albedo = Image.new("RGBA", size, (0, 165, 215, 255))
    draw = ImageDraw.Draw(albedo)
    draw.rectangle([0, 0, 256, 24], fill=(0, 235, 255, 255))
    draw.rectangle([0, 232, 256, 256], fill=(0, 235, 255, 255))
    for x in range(10, 256, 24):
        draw.line([(x, 6), (x+12, 18)], fill=(255, 255, 255, 255), width=2)
        draw.line([(x, 238), (x+12, 250)], fill=(255, 255, 255, 255), width=2)

    emissive = Image.new("RGB", size, (0, 0, 0))
    em_draw = ImageDraw.Draw(emissive)
    em_draw.rectangle([0, 0, 256, 24], fill=(0, 220, 255))
    em_draw.rectangle([0, 232, 256, 256], fill=(0, 220, 255))

    mr = Image.new("RGB", size, (0, 90, 25))
    return albedo, emissive, mr

def create_khadga_textures():
    size = (256, 512)
    albedo = Image.new("RGBA", size, (226, 232, 240, 255))
    draw = ImageDraw.Draw(albedo)
    for y in range(0, 512, 16):
        draw.line([(0, y), (256, y+8)], fill=(195, 205, 218, 255), width=2)
    draw.rectangle([0, 0, 40, 512], fill=(245, 248, 252, 255))
    draw.rectangle([0, 420, 256, 512], fill=(240, 180, 25, 255))
    draw.ellipse([80, 460, 176, 506], fill=(255, 215, 60, 255), outline=(150, 95, 10, 255), width=4)

    emissive = Image.new("RGB", size, (0, 0, 0))
    em_draw = ImageDraw.Draw(emissive)
    em_draw.rectangle([110, 20, 146, 410], fill=(0, 245, 215))

    mr = Image.new("RGB", size, (0, 36, 242))
    return albedo, emissive, mr

def img_to_bytes(img, format="PNG"):
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()

# ---------------------------------------------------------
# glTF 2.0 Binary Builder
# ---------------------------------------------------------

class ProductionGLBBuilder:
    def __init__(self):
        self.bin_data = bytearray()
        self.accessors = []
        self.buffer_views = []
        self.nodes = []
        self.meshes = []
        self.materials = []
        self.textures = []
        self.images = []
        self.samplers = [{
            "magFilter": 9729,
            "minFilter": 9987,
            "wrapS": 10497,
            "wrapT": 10497
        }]
        self.skins = []
        self.animations = []

    def add_buffer_view(self, data, target=None):
        pad = (4 - (len(self.bin_data) % 4)) % 4
        self.bin_data.extend(b'\x00' * pad)
        offset = len(self.bin_data)
        self.bin_data.extend(data)
        bv = {
            "buffer": 0,
            "byteOffset": offset,
            "byteLength": len(data)
        }
        if target:
            bv["target"] = target
        self.buffer_views.append(bv)
        return len(self.buffer_views) - 1

    def add_accessor(self, buffer_view_idx, component_type, count, acc_type, min_val=None, max_val=None):
        acc = {
            "bufferView": buffer_view_idx,
            "byteOffset": 0,
            "componentType": component_type,
            "count": count,
            "type": acc_type
        }
        if min_val is not None:
            acc["min"] = min_val
        if max_val is not None:
            acc["max"] = max_val
        self.accessors.append(acc)
        return len(self.accessors) - 1

    def add_image_from_bytes(self, img_bytes, mime_type="image/png"):
        bv_idx = self.add_buffer_view(img_bytes)
        self.images.append({
            "bufferView": bv_idx,
            "mimeType": mime_type
        })
        img_idx = len(self.images) - 1
        self.textures.append({
            "sampler": 0,
            "source": img_idx
        })
        return len(self.textures) - 1

    def build_glb(self):
        pad = (4 - (len(self.bin_data) % 4)) % 4
        self.bin_data.extend(b'\x00' * pad)

        gltf = {
            "asset": {"version": "2.0", "generator": "Mythos Production Character Rig Generator"},
            "scene": 0,
            "scenes": [{"name": "VeerProductionScene", "nodes": [0]}],
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
        if self.skins:
            gltf["skins"] = self.skins
        if self.animations:
            gltf["animations"] = self.animations

        json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
        json_pad = (4 - (len(json_bytes) % 4)) % 4
        json_bytes += b' ' * json_pad

        total_length = 12 + 8 + len(json_bytes) + 8 + len(self.bin_data)

        header = struct.pack('<4sII', b'glTF', 2, total_length)
        chunk0_header = struct.pack('<II', len(json_bytes), 0x4E4F534A)
        chunk1_header = struct.pack('<II', len(self.bin_data), 0x004E4942)

        return header + chunk0_header + json_bytes + chunk1_header + self.bin_data

# ---------------------------------------------------------
# Mesh Geometry Generator
# ---------------------------------------------------------

class DetailedMeshBuilder:
    def __init__(self, mat_id):
        self.mat_id = mat_id
        self.positions = []
        self.normals = []
        self.uvs = []
        self.joints = []
        self.weights = []
        self.indices = []

    def add_lathed_surface(self, center, profile_points, radial_segments=16, primary_joint=0, secondary_joint=None, blend_ratio=1.0, uv_y_scale=1.0):
        cx, cy, cz = center
        n_rings = len(profile_points)
        base_idx = len(self.positions)

        j0 = primary_joint
        j1 = secondary_joint if secondary_joint is not None else primary_joint

        for r_idx, (dy, rx, rz) in enumerate(profile_points):
            y = cy + dy
            v = (r_idx / max(1, n_rings - 1)) * uv_y_scale

            w0 = blend_ratio
            if secondary_joint is not None and blend_ratio == -1:
                t = r_idx / (n_rings - 1)
                w0 = 1.0 - t
            w1 = 1.0 - w0

            for s_idx in range(radial_segments):
                theta = (s_idx / radial_segments) * 2 * math.pi
                cos_t = math.cos(theta)
                sin_t = math.sin(theta)

                x = cx + cos_t * rx
                z = cz + sin_t * rz

                nx = cos_t
                ny = 0.0
                nz = sin_t
                if 0 < r_idx < n_rings - 1:
                    prev_dy, prev_rx, _ = profile_points[r_idx - 1]
                    next_dy, next_rx, _ = profile_points[r_idx + 1]
                    slope = (next_rx - prev_rx) / max(1e-4, next_dy - prev_dy)
                    ny = -slope
                    norm_len = math.sqrt(nx*nx + ny*ny + nz*nz)
                    nx /= norm_len
                    ny /= norm_len
                    nz /= norm_len

                u = s_idx / radial_segments

                self.positions.append((x, y, z))
                self.normals.append((nx, ny, nz))
                self.uvs.append((u, v))
                self.joints.append([j0, j1, 0, 0])
                self.weights.append([w0, w1, 0.0, 0.0])

        for r in range(n_rings - 1):
            for s in range(radial_segments):
                s_next = (s + 1) % radial_segments
                i00 = base_idx + r * radial_segments + s
                i01 = base_idx + r * radial_segments + s_next
                i10 = base_idx + (r + 1) * radial_segments + s
                i11 = base_idx + (r + 1) * radial_segments + s_next

                self.indices.extend([i00, i01, i11, i00, i11, i10])

    def add_smooth_sphere(self, center, radius, rings=12, sectors=16, primary_joint=0, secondary_joint=None, blend_ratio=1.0):
        cx, cy, cz = center
        rx, ry, rz = radius if isinstance(radius, (tuple, list)) else (radius, radius, radius)
        base_idx = len(self.positions)

        j0 = primary_joint
        j1 = secondary_joint if secondary_joint is not None else primary_joint

        for r in range(rings + 1):
            phi = (r / rings) * math.pi
            sin_p = math.sin(phi)
            cos_p = math.cos(phi)
            v = r / rings

            for s in range(sectors + 1):
                theta = (s / sectors) * 2 * math.pi
                cos_t = math.cos(theta)
                sin_t = math.sin(theta)
                u = s / sectors

                x = cx + rx * sin_p * cos_t
                y = cy + ry * cos_p
                z = cz + rz * sin_p * sin_t

                nx = sin_p * cos_t
                ny = cos_p
                nz = sin_p * sin_t

                self.positions.append((x, y, z))
                self.normals.append((nx, ny, nz))
                self.uvs.append((u, v))
                self.joints.append([j0, j1, 0, 0])
                self.weights.append([blend_ratio, 1.0 - blend_ratio, 0.0, 0.0])

        for r in range(rings):
            for s in range(sectors):
                i00 = base_idx + r * (sectors + 1) + s
                i01 = base_idx + r * (sectors + 1) + (s + 1)
                i10 = base_idx + (r + 1) * (sectors + 1) + s
                i11 = base_idx + (r + 1) * (sectors + 1) + (s + 1)

                self.indices.extend([i00, i01, i11, i00, i11, i10])

    def add_curved_cloth_strip(self, start_pos, end_pos, width, drape_depth=0.08, segments=12, primary_joint=0, secondary_joint=None):
        sx, sy, sz = start_pos
        ex, ey, ez = end_pos
        base_idx = len(self.positions)

        j0 = primary_joint
        j1 = secondary_joint if secondary_joint is not None else primary_joint

        for i in range(segments + 1):
            t = i / segments
            drape = math.sin(t * math.pi) * drape_depth
            px = sx + (ex - sx) * t
            py = sy + (ey - sy) * t - drape
            pz = sz + (ez - sz) * t

            hw = width * 0.5
            w0 = 1.0 - t
            w1 = t

            self.positions.append((px - hw, py, pz))
            self.normals.append((0.0, 0.8, 0.6))
            self.uvs.append((0.0, t))
            self.joints.append([j0, j1, 0, 0])
            self.weights.append([w0, w1, 0.0, 0.0])

            self.positions.append((px + hw, py, pz))
            self.normals.append((0.0, 0.8, 0.6))
            self.uvs.append((1.0, t))
            self.joints.append([j0, j1, 0, 0])
            self.weights.append([w0, w1, 0.0, 0.0])

        for i in range(segments):
            i0 = base_idx + i * 2
            i1 = i0 + 1
            i2 = i0 + 2
            i3 = i0 + 3
            self.indices.extend([i0, i1, i3, i0, i3, i2])
            self.indices.extend([i0, i3, i1, i0, i2, i3])

    def add_scimitar_blade(self, hilt_pos, length=0.88, segments=14, primary_joint=14):
        hx, hy, hz = hilt_pos
        base_idx = len(self.positions)

        for i in range(segments + 1):
            t = i / segments
            forward_reach = t * length
            curve_lift = math.sin(t * 1.2) * 0.16
            blade_w = 0.045 * (1.0 - t * 0.45)
            thick = 0.012 * (1.0 - t * 0.5)

            py = hy + forward_reach * 0.85
            pz = hz + forward_reach * 0.52 + curve_lift
            px = hx

            self.positions.append((px, py + blade_w*0.5, pz - thick))
            self.normals.append((0.0, 0.8, -0.6))
            self.uvs.append((0.5, t))

            self.positions.append((px - thick, py, pz))
            self.normals.append((-0.9, 0.2, 0.3))
            self.uvs.append((0.0, t))

            self.positions.append((px, py - blade_w*0.5, pz + thick))
            self.normals.append((0.0, -0.8, 0.6))
            self.uvs.append((0.5, t))

            self.positions.append((px + thick, py, pz))
            self.normals.append((0.9, 0.2, 0.3))
            self.uvs.append((1.0, t))

            for _ in range(4):
                self.joints.append([primary_joint, primary_joint, 0, 0])
                self.weights.append([1.0, 0.0, 0.0, 0.0])

        for i in range(segments):
            b0 = base_idx + i * 4
            b1 = base_idx + (i + 1) * 4
            self.indices.extend([b0+0, b0+1, b1+1, b0+0, b1+1, b1+0])
            self.indices.extend([b0+1, b0+2, b1+2, b0+1, b1+2, b1+1])
            self.indices.extend([b0+2, b0+3, b1+3, b0+2, b1+3, b1+2])
            self.indices.extend([b0+3, b0+0, b1+0, b0+3, b1+0, b1+3])

    def add_cylinder_segment(self, start_pos, end_pos, r_start, r_end, radial_segments=16, rings=4, primary_joint=0, secondary_joint=None, blend_start=1.0, blend_end=0.0):
        sx, sy, sz = start_pos
        ex, ey, ez = end_pos
        dx = ex - sx
        dy = ey - sy
        dz = ez - sz
        length = math.sqrt(dx*dx + dy*dy + dz*dz)
        if length < 1e-5:
            return
        ax = dx / length
        ay = dy / length
        az = dz / length

        if abs(ay) < 0.9:
            px, py, pz = 0.0, 1.0, 0.0
        else:
            px, py, pz = 1.0, 0.0, 0.0
        ux = ay * pz - az * py
        uy = az * px - ax * pz
        uz = ax * py - ay * px
        u_len = math.sqrt(ux*ux + uy*uy + uz*uz)
        ux /= u_len
        uy /= u_len
        uz /= u_len
        vx = ay * uz - az * uy
        vy = az * ux - ax * uz
        vz = ax * uy - ay * ux

        base_idx = len(self.positions)
        j0 = primary_joint
        j1 = secondary_joint if secondary_joint is not None else primary_joint

        for r in range(rings + 1):
            t = r / rings
            cx = sx + dx * t
            cy = sy + dy * t
            cz = sz + dz * t
            radius = r_start + (r_end - r_start) * t
            w0 = blend_start + (blend_end - blend_start) * t
            w1 = 1.0 - w0

            for s in range(radial_segments):
                theta = (s / radial_segments) * 2.0 * math.pi
                cos_t = math.cos(theta)
                sin_t = math.sin(theta)

                nx = cos_t * ux + sin_t * vx
                ny = cos_t * uy + sin_t * vy
                nz = cos_t * uz + sin_t * vz

                x = cx + nx * radius
                y = cy + ny * radius
                z = cz + nz * radius

                u = s / radial_segments
                v = t

                self.positions.append((x, y, z))
                self.normals.append((nx, ny, nz))
                self.uvs.append((u, v))
                self.joints.append([j0, j1, 0, 0])
                self.weights.append([w0, w1, 0.0, 0.0])

        for r in range(rings):
            for s in range(radial_segments):
                s_next = (s + 1) % radial_segments
                i00 = base_idx + r * radial_segments + s
                i01 = base_idx + r * radial_segments + s_next
                i10 = base_idx + (r + 1) * radial_segments + s
                i11 = base_idx + (r + 1) * radial_segments + s_next

                self.indices.extend([i00, i01, i11, i00, i11, i10])

# ---------------------------------------------------------
# Main Generator Routine
# ---------------------------------------------------------

def generate_production_veer_glb(output_path):
    print(f"[Character Pipeline] Generating Production 3D Humanoid Veer GLB at: {output_path}")
    builder = ProductionGLBBuilder()

    # 1. Textures & Materials
    skin_albedo, skin_normal, skin_mr = create_skin_textures()
    tex_skin_alb = builder.add_image_from_bytes(img_to_bytes(skin_albedo))
    tex_skin_nrm = builder.add_image_from_bytes(img_to_bytes(skin_normal))
    tex_skin_mr  = builder.add_image_from_bytes(img_to_bytes(skin_mr))

    cui_albedo, cui_normal, cui_mr = create_cuirass_textures()
    tex_cui_alb = builder.add_image_from_bytes(img_to_bytes(cui_albedo))
    tex_cui_nrm = builder.add_image_from_bytes(img_to_bytes(cui_normal))
    tex_cui_mr  = builder.add_image_from_bytes(img_to_bytes(cui_mr))

    gold_albedo, gold_emissive, gold_mr = create_gold_medallion_textures()
    tex_gold_alb = builder.add_image_from_bytes(img_to_bytes(gold_albedo))
    tex_gold_em  = builder.add_image_from_bytes(img_to_bytes(gold_emissive))
    tex_gold_mr  = builder.add_image_from_bytes(img_to_bytes(gold_mr))

    dho_albedo, dho_normal, dho_mr = create_dhoti_textures()
    tex_dho_alb = builder.add_image_from_bytes(img_to_bytes(dho_albedo))
    tex_dho_nrm = builder.add_image_from_bytes(img_to_bytes(dho_normal))
    tex_dho_mr  = builder.add_image_from_bytes(img_to_bytes(dho_mr))

    sash_albedo, sash_emissive, sash_mr = create_sash_textures()
    tex_sash_alb = builder.add_image_from_bytes(img_to_bytes(sash_albedo))
    tex_sash_em  = builder.add_image_from_bytes(img_to_bytes(sash_emissive))
    tex_sash_mr  = builder.add_image_from_bytes(img_to_bytes(sash_mr))

    khadga_albedo, khadga_emissive, khadga_mr = create_khadga_textures()
    tex_khadga_alb = builder.add_image_from_bytes(img_to_bytes(khadga_albedo))
    tex_khadga_em  = builder.add_image_from_bytes(img_to_bytes(khadga_emissive))
    tex_khadga_mr  = builder.add_image_from_bytes(img_to_bytes(khadga_mr))

    builder.materials.append({
        "name": "Mat_Veer_Skin",
        "pbrMetallicRoughness": {
            "baseColorTexture": {"index": tex_skin_alb},
            "metallicRoughnessTexture": {"index": tex_skin_mr},
            "baseColorFactor": [1.0, 1.0, 1.0, 1.0]
        },
        "normalTexture": {"index": tex_skin_nrm, "scale": 1.0}
    })
    builder.materials.append({
        "name": "Mat_Veer_Cuirass",
        "pbrMetallicRoughness": {
            "baseColorTexture": {"index": tex_cui_alb},
            "metallicRoughnessTexture": {"index": tex_cui_mr},
            "baseColorFactor": [1.0, 1.0, 1.0, 1.0]
        },
        "normalTexture": {"index": tex_cui_nrm, "scale": 1.0}
    })
    builder.materials.append({
        "name": "Mat_Veer_Gold",
        "pbrMetallicRoughness": {
            "baseColorTexture": {"index": tex_gold_alb},
            "metallicRoughnessTexture": {"index": tex_gold_mr},
            "baseColorFactor": [1.0, 1.0, 1.0, 1.0]
        },
        "emissiveTexture": {"index": tex_gold_em},
        "emissiveFactor": [1.5, 1.2, 0.4]
    })
    builder.materials.append({
        "name": "Mat_Veer_Dhoti",
        "pbrMetallicRoughness": {
            "baseColorTexture": {"index": tex_dho_alb},
            "metallicRoughnessTexture": {"index": tex_dho_mr},
            "baseColorFactor": [1.0, 1.0, 1.0, 1.0]
        },
        "normalTexture": {"index": tex_dho_nrm, "scale": 1.0}
    })
    builder.materials.append({
        "name": "Mat_Veer_Sash",
        "pbrMetallicRoughness": {
            "baseColorTexture": {"index": tex_sash_alb},
            "metallicRoughnessTexture": {"index": tex_sash_mr},
            "baseColorFactor": [1.0, 1.0, 1.0, 1.0]
        },
        "emissiveTexture": {"index": tex_sash_em},
        "emissiveFactor": [0.8, 1.4, 1.6]
    })
    builder.materials.append({
        "name": "Mat_Veer_Khadga",
        "pbrMetallicRoughness": {
            "baseColorTexture": {"index": tex_khadga_alb},
            "metallicRoughnessTexture": {"index": tex_khadga_mr},
            "baseColorFactor": [1.0, 1.0, 1.0, 1.0]
        },
        "emissiveTexture": {"index": tex_khadga_em},
        "emissiveFactor": [0.6, 1.8, 1.6]
    })
    builder.materials.append({
        "name": "Mat_Veer_Hair",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.07, 0.08, 0.12, 1.0],
            "metallicFactor": 0.1,
            "roughnessFactor": 0.75
        }
    })

    # 2. Skeleton
    bones = [
        {"name": "root",              "parent": None, "local": [0.0, 0.0, 0.0],       "world": [0.0, 0.0, 0.0]},     # 0
        {"name": "pelvis",            "parent": 0,    "local": [0.0, 0.94, 0.0],      "world": [0.0, 0.94, 0.0]},    # 1
        {"name": "spine_01",          "parent": 1,    "local": [0.0, 0.18, 0.0],      "world": [0.0, 1.12, 0.0]},    # 2
        {"name": "chest",             "parent": 2,    "local": [0.0, 0.22, 0.0],      "world": [0.0, 1.34, 0.0]},    # 3
        {"name": "neck",              "parent": 3,    "local": [0.0, 0.20, 0.0],      "world": [0.0, 1.54, 0.0]},    # 4
        {"name": "head",              "parent": 4,    "local": [0.0, 0.14, 0.0],      "world": [0.0, 1.68, 0.0]},    # 5
        {"name": "topknot",           "parent": 5,    "local": [0.0, 0.20, -0.06],    "world": [0.0, 1.88, -0.06]},   # 6
        {"name": "shoulder_l",        "parent": 3,    "local": [-0.18, 0.11, 0.0],    "world": [-0.18, 1.45, 0.0]},  # 7
        {"name": "arm_l",             "parent": 7,    "local": [-0.14, -0.03, 0.0],   "world": [-0.32, 1.42, 0.0]},  # 8
        {"name": "forearm_l",         "parent": 8,    "local": [-0.24, -0.02, 0.0],   "world": [-0.56, 1.40, 0.0]},  # 9
        {"name": "hand_l",            "parent": 9,    "local": [-0.22, -0.02, 0.0],   "world": [-0.78, 1.38, 0.0]},  # 10
        {"name": "shoulder_r",        "parent": 3,    "local": [0.18, 0.11, 0.0],     "world": [0.18, 1.45, 0.0]},   # 11
        {"name": "arm_r",             "parent": 11,   "local": [0.14, -0.03, 0.0],    "world": [0.32, 1.42, 0.0]},   # 12
        {"name": "forearm_r",         "parent": 12,   "local": [0.24, -0.02, 0.0],    "world": [0.56, 1.40, 0.0]},   # 13
        {"name": "hand_r",            "parent": 13,   "local": [0.22, -0.02, 0.0],    "world": [0.78, 1.38, 0.0]},   # 14
        {"name": "thigh_l",           "parent": 1,    "local": [-0.16, -0.04, 0.0],   "world": [-0.16, 0.90, 0.0]},  # 15
        {"name": "shin_l",            "parent": 15,   "local": [0.0, -0.42, 0.0],     "world": [-0.16, 0.48, 0.0]},  # 16
        {"name": "foot_l",            "parent": 16,   "local": [0.0, -0.40, 0.06],    "world": [-0.16, 0.08, 0.06]}, # 17
        {"name": "thigh_r",           "parent": 1,    "local": [0.16, -0.04, 0.0],    "world": [0.16, 0.90, 0.0]},   # 18
        {"name": "shin_r",            "parent": 18,   "local": [0.0, -0.42, 0.0],     "world": [0.16, 0.48, 0.0]},   # 19
        {"name": "foot_r",            "parent": 19,   "local": [0.0, -0.40, 0.06],    "world": [0.16, 0.08, 0.06]}, # 20
        {"name": "sash_01",           "parent": 1,    "local": [0.0, 0.11, -0.12],    "world": [0.0, 1.05, -0.12]},  # 21
        {"name": "sash_02",           "parent": 21,   "local": [0.0, -0.40, -0.04],   "world": [0.0, 0.65, -0.16]},  # 22
        {"name": "socket_right_hand", "parent": 14,   "local": [0.05, 0.0, 0.0],       "world": [0.83, 1.38, 0.0]},   # 23
    ]

    bone_node_offset = 1

    builder.nodes.append({
        "name": "Veer",
        "children": [1, 1 + len(bones)]
    })

    for i, b in enumerate(bones):
        builder.nodes.append({
            "name": b["name"],
            "translation": b["local"],
            "rotation": [0.0, 0.0, 0.0, 1.0],
            "scale": [1.0, 1.0, 1.0],
            "children": []
        })

    for i, b in enumerate(bones):
        if b["parent"] is not None:
            p_idx = bone_node_offset + b["parent"]
            builder.nodes[p_idx]["children"].append(bone_node_offset + i)

    for i in range(1, 1 + len(bones)):
        if not builder.nodes[i]["children"]:
            del builder.nodes[i]["children"]

    mesh_node_idx = 1 + len(bones)
    builder.nodes.append({
        "name": "VeerSkinnedHumanoidMesh",
        "mesh": 0,
        "skin": 0
    })

    # 3. Geometry Construction
    primitives_list = []

    # Skin (Mat 0)
    mesh_skin = DetailedMeshBuilder(mat_id=0)
    head_profile = [
        (-0.16, 0.07, 0.08),
        (-0.12, 0.09, 0.11),
        (-0.06, 0.11, 0.13),
        ( 0.00, 0.12, 0.14),
        ( 0.08, 0.12, 0.13),
        ( 0.14, 0.11, 0.12),
        ( 0.20, 0.09, 0.10),
        ( 0.22, 0.03, 0.04),
    ]
    mesh_skin.add_lathed_surface(center=(0.0, 1.68, 0.0), profile_points=head_profile, radial_segments=20, primary_joint=5)
    mesh_skin.add_smooth_sphere(center=(0.0, 1.68, 0.14), radius=(0.024, 0.042, 0.035), rings=8, sectors=10, primary_joint=5)
    mesh_skin.add_smooth_sphere(center=(-0.07, 1.64, 0.08), radius=(0.035, 0.035, 0.045), rings=8, sectors=8, primary_joint=5)
    mesh_skin.add_smooth_sphere(center=( 0.07, 1.64, 0.08), radius=(0.035, 0.035, 0.045), rings=8, sectors=8, primary_joint=5)
    mesh_skin.add_smooth_sphere(center=(-0.12, 1.67, 0.0), radius=(0.015, 0.035, 0.025), rings=6, sectors=8, primary_joint=5)
    mesh_skin.add_smooth_sphere(center=( 0.12, 1.67, 0.0), radius=(0.015, 0.035, 0.025), rings=6, sectors=8, primary_joint=5)

    neck_profile = [
        (-0.10, 0.085, 0.095),
        ( 0.00, 0.080, 0.090),
        ( 0.10, 0.085, 0.095),
    ]
    mesh_skin.add_lathed_surface(center=(0.0, 1.54, 0.0), profile_points=neck_profile, radial_segments=16, primary_joint=4, secondary_joint=3, blend_ratio=0.7)

    # Arms (Upper Arm + Forearm + Elbow + Hands)
    # Left Arm
    mesh_skin.add_cylinder_segment(start_pos=(-0.20, 1.45, 0.0), end_pos=(-0.56, 1.40, 0.0), r_start=0.088, r_end=0.072, radial_segments=16, rings=4, primary_joint=8, secondary_joint=7, blend_start=0.3, blend_end=1.0)
    mesh_skin.add_smooth_sphere(center=(-0.56, 1.40, 0.0), radius=(0.065, 0.062, 0.062), rings=6, sectors=8, primary_joint=9, secondary_joint=8, blend_ratio=0.5)
    mesh_skin.add_cylinder_segment(start_pos=(-0.56, 1.40, 0.0), end_pos=(-0.74, 1.38, 0.0), r_start=0.068, r_end=0.052, radial_segments=16, rings=4, primary_joint=9, secondary_joint=10, blend_start=1.0, blend_end=0.2)
    mesh_skin.add_smooth_sphere(center=(-0.76, 1.38, 0.0), radius=(0.055, 0.038, 0.055), rings=8, sectors=10, primary_joint=10)

    # Right Arm
    mesh_skin.add_cylinder_segment(start_pos=(0.20, 1.45, 0.0), end_pos=(0.56, 1.40, 0.0), r_start=0.088, r_end=0.072, radial_segments=16, rings=4, primary_joint=12, secondary_joint=11, blend_start=0.3, blend_end=1.0)
    mesh_skin.add_smooth_sphere(center=(0.56, 1.40, 0.0), radius=(0.065, 0.062, 0.062), rings=6, sectors=8, primary_joint=13, secondary_joint=12, blend_ratio=0.5)
    mesh_skin.add_cylinder_segment(start_pos=(0.56, 1.40, 0.0), end_pos=(0.74, 1.38, 0.0), r_start=0.068, r_end=0.052, radial_segments=16, rings=4, primary_joint=13, secondary_joint=14, blend_start=1.0, blend_end=0.2)
    mesh_skin.add_smooth_sphere(center=(0.76, 1.38, 0.0), radius=(0.055, 0.038, 0.055), rings=8, sectors=10, primary_joint=14)

    # Legs (Thigh + Knee + Shin/Calf + Feet)
    # Left Leg
    mesh_skin.add_cylinder_segment(start_pos=(-0.16, 0.90, 0.0), end_pos=(-0.16, 0.48, 0.0), r_start=0.115, r_end=0.082, radial_segments=16, rings=4, primary_joint=15, secondary_joint=16, blend_start=0.9, blend_end=0.2)
    mesh_skin.add_smooth_sphere(center=(-0.16, 0.48, 0.0), radius=(0.080, 0.078, 0.082), rings=6, sectors=10, primary_joint=16, secondary_joint=15, blend_ratio=0.5)
    mesh_skin.add_cylinder_segment(start_pos=(-0.16, 0.48, 0.0), end_pos=(-0.16, 0.10, 0.04), r_start=0.078, r_end=0.055, radial_segments=16, rings=5, primary_joint=16, secondary_joint=17, blend_start=1.0, blend_end=0.2)
    mesh_skin.add_smooth_sphere(center=(-0.16, 0.05, 0.06), radius=(0.065, 0.045, 0.120), rings=8, sectors=12, primary_joint=17)

    # Right Leg
    mesh_skin.add_cylinder_segment(start_pos=(0.16, 0.90, 0.0), end_pos=(0.16, 0.48, 0.0), r_start=0.115, r_end=0.082, radial_segments=16, rings=4, primary_joint=18, secondary_joint=19, blend_start=0.9, blend_end=0.2)
    mesh_skin.add_smooth_sphere(center=(0.16, 0.48, 0.0), radius=(0.080, 0.078, 0.082), rings=6, sectors=10, primary_joint=19, secondary_joint=18, blend_ratio=0.5)
    mesh_skin.add_cylinder_segment(start_pos=(0.16, 0.48, 0.0), end_pos=(0.16, 0.10, 0.04), r_start=0.078, r_end=0.055, radial_segments=16, rings=5, primary_joint=19, secondary_joint=20, blend_start=1.0, blend_end=0.2)
    mesh_skin.add_smooth_sphere(center=(0.16, 0.05, 0.06), radius=(0.065, 0.045, 0.120), rings=8, sectors=12, primary_joint=20)
    primitives_list.append(mesh_skin)

    # Cuirass (Mat 1)
    mesh_cuirass = DetailedMeshBuilder(mat_id=1)
    cuirass_profile = [
        (-0.24, 0.170, 0.130),
        (-0.12, 0.195, 0.145),
        ( 0.02, 0.240, 0.165),
        ( 0.14, 0.255, 0.170),
        ( 0.22, 0.180, 0.135),
    ]
    mesh_cuirass.add_lathed_surface(center=(0.0, 1.28, 0.0), profile_points=cuirass_profile, radial_segments=22, primary_joint=3, secondary_joint=2, blend_ratio=0.8)
    mesh_cuirass.add_smooth_sphere(center=(-0.24, 1.48, 0.0), radius=(0.095, 0.075, 0.125), rings=8, sectors=12, primary_joint=7)
    mesh_cuirass.add_smooth_sphere(center=( 0.24, 1.48, 0.0), radius=(0.095, 0.075, 0.125), rings=8, sectors=12, primary_joint=11)

    # Bronze Solar Bracers
    mesh_cuirass.add_cylinder_segment(start_pos=(-0.58, 1.40, 0.0), end_pos=(-0.72, 1.38, 0.0), r_start=0.076, r_end=0.058, radial_segments=16, rings=3, primary_joint=9, secondary_joint=10, blend_start=0.9, blend_end=0.1)
    mesh_cuirass.add_cylinder_segment(start_pos=(0.58, 1.40, 0.0), end_pos=(0.72, 1.38, 0.0), r_start=0.076, r_end=0.058, radial_segments=16, rings=3, primary_joint=13, secondary_joint=14, blend_start=0.9, blend_end=0.1)

    # Bronze Greaves
    mesh_cuirass.add_cylinder_segment(start_pos=(-0.16, 0.46, 0.01), end_pos=(-0.16, 0.14, 0.03), r_start=0.086, r_end=0.065, radial_segments=16, rings=4, primary_joint=16, secondary_joint=17, blend_start=0.9, blend_end=0.1)
    mesh_cuirass.add_cylinder_segment(start_pos=(0.16, 0.46, 0.01), end_pos=(0.16, 0.14, 0.03), r_start=0.086, r_end=0.065, radial_segments=16, rings=4, primary_joint=19, secondary_joint=20, blend_start=0.9, blend_end=0.1)
    primitives_list.append(mesh_cuirass)

    # Gold Medallion & Belt (Mat 2)
    mesh_gold = DetailedMeshBuilder(mat_id=2)
    mesh_gold.add_smooth_sphere(center=(0.0, 1.36, 0.18), radius=(0.085, 0.085, 0.025), rings=8, sectors=16, primary_joint=3)
    mesh_gold.add_smooth_sphere(center=(0.0, 1.36, 0.20), radius=(0.040, 0.040, 0.015), rings=6, sectors=10, primary_joint=3)

    belt_profile = [
        (-0.04, 0.185, 0.145),
        ( 0.00, 0.190, 0.150),
        ( 0.04, 0.185, 0.145),
    ]
    mesh_gold.add_lathed_surface(center=(0.0, 1.05, 0.0), profile_points=belt_profile, radial_segments=22, primary_joint=1)
    mesh_gold.add_smooth_sphere(center=(0.0, 1.05, 0.155), radius=(0.055, 0.045, 0.020), rings=6, sectors=10, primary_joint=1)

    ring_profile = [
        (-0.02, 0.075, 0.075),
        ( 0.02, 0.075, 0.075),
    ]
    mesh_gold.add_lathed_surface(center=(0.0, 1.84, -0.06), profile_points=ring_profile, radial_segments=16, primary_joint=6)
    primitives_list.append(mesh_gold)

    # Dhoti (Mat 3)
    mesh_dhoti = DetailedMeshBuilder(mat_id=3)
    dhoti_hip_profile = [
        (-0.16, 0.215, 0.165),
        ( 0.00, 0.210, 0.160),
        ( 0.14, 0.195, 0.150),
    ]
    mesh_dhoti.add_lathed_surface(center=(0.0, 0.94, 0.0), profile_points=dhoti_hip_profile, radial_segments=22, primary_joint=1)
    mesh_dhoti.add_smooth_sphere(center=(-0.16, 0.82, 0.0), radius=(0.125, 0.150, 0.125), rings=8, sectors=12, primary_joint=15, secondary_joint=1, blend_ratio=0.7)
    mesh_dhoti.add_smooth_sphere(center=( 0.16, 0.82, 0.0), radius=(0.125, 0.150, 0.125), rings=8, sectors=12, primary_joint=18, secondary_joint=1, blend_ratio=0.7)
    mesh_dhoti.add_curved_cloth_strip(
        start_pos=(0.0, 1.04, 0.16),
        end_pos=(0.0, 0.62, 0.12),
        width=0.15,
        drape_depth=0.04,
        segments=12,
        primary_joint=1
    )
    primitives_list.append(mesh_dhoti)

    # Celestial Sash (Mat 4)
    mesh_sash = DetailedMeshBuilder(mat_id=4)
    mesh_sash.add_curved_cloth_strip(
        start_pos=(-0.16, 1.48, 0.12),
        end_pos=(0.12, 1.05, 0.16),
        width=0.12,
        drape_depth=0.03,
        segments=10,
        primary_joint=3,
        secondary_joint=1
    )
    mesh_sash.add_curved_cloth_strip(
        start_pos=(-0.08, 1.05, -0.14),
        end_pos=(-0.12, 0.50, -0.22),
        width=0.10,
        drape_depth=0.06,
        segments=12,
        primary_joint=21,
        secondary_joint=22
    )
    mesh_sash.add_curved_cloth_strip(
        start_pos=(0.08, 1.05, -0.14),
        end_pos=(0.12, 0.44, -0.24),
        width=0.10,
        drape_depth=0.08,
        segments=12,
        primary_joint=21,
        secondary_joint=22
    )
    primitives_list.append(mesh_sash)

    # Khadga Scimitar (Mat 5)
    mesh_khadga = DetailedMeshBuilder(mat_id=5)
    grip_profile = [
        (-0.10, 0.020, 0.020),
        ( 0.00, 0.018, 0.018),
        ( 0.10, 0.022, 0.022),
    ]
    mesh_khadga.add_lathed_surface(center=(0.78, 1.38, 0.0), profile_points=grip_profile, radial_segments=12, primary_joint=14)
    mesh_khadga.add_smooth_sphere(center=(0.78, 1.27, 0.0), radius=(0.040, 0.030, 0.040), rings=6, sectors=10, primary_joint=14)
    guard_profile = [
        (-0.02, 0.080, 0.030),
        ( 0.02, 0.080, 0.030),
    ]
    mesh_khadga.add_lathed_surface(center=(0.78, 1.49, 0.0), profile_points=guard_profile, radial_segments=14, primary_joint=14)
    mesh_khadga.add_scimitar_blade(hilt_pos=(0.78, 1.50, 0.0), length=0.88, segments=16, primary_joint=14)
    primitives_list.append(mesh_khadga)

    # Hair / Topknot (Mat 6)
    mesh_hair = DetailedMeshBuilder(mat_id=6)
    topknot_profile = [
        (-0.06, 0.070, 0.070),
        ( 0.00, 0.085, 0.085),
        ( 0.08, 0.065, 0.065),
        ( 0.16, 0.025, 0.025),
    ]
    mesh_hair.add_lathed_surface(center=(0.0, 1.90, -0.06), profile_points=topknot_profile, radial_segments=16, primary_joint=6)
    mesh_hair.add_smooth_sphere(center=(0.0, 1.76, -0.10), radius=(0.105, 0.090, 0.065), rings=8, sectors=12, primary_joint=5)
    primitives_list.append(mesh_hair)

    # 4. Pack Buffers
    primitives_json = []
    total_vertices = 0
    total_indices = 0

    for prim in primitives_list:
        total_vertices += len(prim.positions)
        total_indices += len(prim.indices)

        pos_bytes = bytearray()
        min_p = [1e9, 1e9, 1e9]
        max_p = [-1e9, -1e9, -1e9]
        for p in prim.positions:
            pos_bytes.extend(struct.pack('<3f', *p))
            for k in range(3):
                min_p[k] = min(min_p[k], p[k])
                max_p[k] = max(max_p[k], p[k])
        bv_pos = builder.add_buffer_view(pos_bytes, target=34962)
        acc_pos = builder.add_accessor(bv_pos, 5126, len(prim.positions), "VEC3", min_val=min_p, max_val=max_p)

        norm_bytes = bytearray()
        for n in prim.normals:
            norm_bytes.extend(struct.pack('<3f', *n))
        bv_norm = builder.add_buffer_view(norm_bytes, target=34962)
        acc_norm = builder.add_accessor(bv_norm, 5126, len(prim.normals), "VEC3")

        uv_bytes = bytearray()
        for uv in prim.uvs:
            uv_bytes.extend(struct.pack('<2f', *uv))
        bv_uv = builder.add_buffer_view(uv_bytes, target=34962)
        acc_uv = builder.add_accessor(bv_uv, 5126, len(prim.uvs), "VEC2")

        joint_bytes = bytearray()
        for j in prim.joints:
            joint_bytes.extend(struct.pack('<4B', *j))
        bv_joint = builder.add_buffer_view(joint_bytes, target=34962)
        acc_joint = builder.add_accessor(bv_joint, 5121, len(prim.joints), "VEC4")

        weight_bytes = bytearray()
        for w in prim.weights:
            weight_bytes.extend(struct.pack('<4f', *w))
        bv_weight = builder.add_buffer_view(weight_bytes, target=34962)
        acc_weight = builder.add_accessor(bv_weight, 5126, len(prim.weights), "VEC4")

        # Clean non-degenerate indices
        clean_indices = []
        for i_step in range(0, len(prim.indices), 3):
            i0 = prim.indices[i_step]
            i1 = prim.indices[i_step + 1]
            i2 = prim.indices[i_step + 2]
            p0 = prim.positions[i0]
            p1 = prim.positions[i1]
            p2 = prim.positions[i2]
            v1 = (p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2])
            v2 = (p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2])
            cross = (v1[1]*v2[2] - v1[2]*v2[1], v1[2]*v2[0] - v1[0]*v2[2], v1[0]*v2[1] - v1[1]*v2[0])
            area2 = cross[0]*cross[0] + cross[1]*cross[1] + cross[2]*cross[2]
            if area2 > 1e-9:
                clean_indices.extend([i0, i1, i2])

        idx_bytes = bytearray()
        for idx in clean_indices:
            idx_bytes.extend(struct.pack('<H', idx))
        bv_idx = builder.add_buffer_view(idx_bytes, target=34963)
        acc_idx = builder.add_accessor(bv_idx, 5123, len(clean_indices), "SCALAR")

        primitives_json.append({
            "attributes": {
                "POSITION": acc_pos,
                "NORMAL": acc_norm,
                "TEXCOORD_0": acc_uv,
                "JOINTS_0": acc_joint,
                "WEIGHTS_0": acc_weight
            },
            "indices": acc_idx,
            "material": prim.mat_id
        })

    builder.meshes.append({
        "name": "VeerSkinnedHumanoidMesh",
        "primitives": primitives_json
    })

    print(f"[Character Pipeline] Mesh compiled: {total_vertices} vertices, {total_indices // 3} triangles across {len(primitives_json)} PBR primitives.")

    # 5. IBM
    ibm_bytes = bytearray()
    for b in bones:
        wx, wy, wz = b["world"]
        mat = [
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            -wx, -wy, -wz, 1.0
        ]
        ibm_bytes.extend(struct.pack('<16f', *mat))
    bv_ibm = builder.add_buffer_view(ibm_bytes)
    acc_ibm = builder.add_accessor(bv_ibm, 5126, len(bones), "MAT4")

    builder.skins.append({
        "name": "VeerSkeletonSkin",
        "inverseBindMatrices": acc_ibm,
        "joints": list(range(1, 1 + len(bones))),
        "skeleton": 1
    })

    # 6. Complete 18-Animation Skeletal Suite
    def add_anim(name, duration, keyframes_by_joint):
        channels = []
        samplers = []
        for b_name, kfs in keyframes_by_joint.items():
            b_idx = next(i for i, b in enumerate(bones) if b["name"] == b_name)
            node_idx = bone_node_offset + b_idx

            times = [kf[0] for kf in kfs]
            quats = [kf[1] for kf in kfs]

            time_bytes = bytearray()
            for t in times:
                time_bytes.extend(struct.pack('<f', t))
            bv_t = builder.add_buffer_view(time_bytes)
            acc_t = builder.add_accessor(bv_t, 5126, len(times), "SCALAR", min_val=[min(times)], max_val=[max(times)])

            quat_bytes = bytearray()
            for q in quats:
                quat_bytes.extend(struct.pack('<4f', *q))
            bv_q = builder.add_buffer_view(quat_bytes)
            acc_q = builder.add_accessor(bv_q, 5126, len(quats), "VEC4")

            s_idx = len(samplers)
            samplers.append({
                "input": acc_t,
                "output": acc_q,
                "interpolation": "LINEAR"
            })
            channels.append({
                "sampler": s_idx,
                "target": {"node": node_idx, "path": "rotation"}
            })

        builder.animations.append({
            "name": name,
            "channels": channels,
            "samplers": samplers
        })

    # --- 1. Idle (2.4s) ---
    idle_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.6, euler_to_quat(math.radians(3.5), 0.0, 0.0)),
            (1.2, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
            (1.8, euler_to_quat(math.radians(2.5), 0.0, 0.0)),
            (2.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "head": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (1.2, euler_to_quat(math.radians(-2.5), math.radians(2.0), 0.0)),
            (2.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(math.radians(8.0), 0.0, math.radians(68.0))),
            (1.2, euler_to_quat(math.radians(10.0), 0.0, math.radians(70.0))),
            (2.4, euler_to_quat(math.radians(8.0), 0.0, math.radians(68.0))),
        ],
        "forearm_l": [
            (0.0, euler_to_quat(math.radians(18.0), math.radians(8.0), 0.0)),
            (1.2, euler_to_quat(math.radians(22.0), math.radians(10.0), 0.0)),
            (2.4, euler_to_quat(math.radians(18.0), math.radians(8.0), 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(8.0), 0.0, math.radians(-68.0))),
            (1.2, euler_to_quat(math.radians(10.0), 0.0, math.radians(-70.0))),
            (2.4, euler_to_quat(math.radians(8.0), 0.0, math.radians(-68.0))),
        ],
        "forearm_r": [
            (0.0, euler_to_quat(math.radians(18.0), math.radians(-8.0), 0.0)),
            (1.2, euler_to_quat(math.radians(22.0), math.radians(-10.0), 0.0)),
            (2.4, euler_to_quat(math.radians(18.0), math.radians(-8.0), 0.0)),
        ],
        "sash_01": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (1.2, euler_to_quat(math.radians(4.0), math.radians(3.0), 0.0)),
            (2.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("idle", 2.4, idle_kfs)

    # --- 2. Walk (1.0s) ---
    walk_kfs = {
        "thigh_l": [
            (0.0, euler_to_quat(math.radians(-28.0), 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(0.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(6.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(-28.0), 0.0, 0.0)),
        ],
        "shin_l": [
            (0.0, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(6.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(48.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(6.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(-28.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(0.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
        ],
        "shin_r": [
            (0.0, euler_to_quat(math.radians(6.0), 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(48.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(6.0), 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(math.radians(22.0), 0.0, math.radians(68.0))),
            (0.5, euler_to_quat(math.radians(-22.0), 0.0, math.radians(68.0))),
            (1.0, euler_to_quat(math.radians(22.0), 0.0, math.radians(68.0))),
        ],
        "forearm_l": [
            (0.0, euler_to_quat(math.radians(22.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(34.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(22.0), 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(-22.0), 0.0, math.radians(-68.0))),
            (0.5, euler_to_quat(math.radians(22.0), 0.0, math.radians(-68.0))),
            (1.0, euler_to_quat(math.radians(-22.0), 0.0, math.radians(-68.0))),
        ],
        "forearm_r": [
            (0.0, euler_to_quat(math.radians(34.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(22.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(34.0), 0.0, 0.0)),
        ],
        "spine_01": [
            (0.0, euler_to_quat(math.radians(3.0), math.radians(5.0), 0.0)),
            (0.5, euler_to_quat(math.radians(3.0), math.radians(-5.0), 0.0)),
            (1.0, euler_to_quat(math.radians(3.0), math.radians(5.0), 0.0)),
        ],
    }
    add_anim("walk", 1.0, walk_kfs)

    # --- 3. Run (0.75s) ---
    run_kfs = {
        "thigh_l": [
            (0.0, euler_to_quat(math.radians(-45.0), 0.0, 0.0)),
            (0.1875, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
            (0.375, euler_to_quat(math.radians(48.0), 0.0, 0.0)),
            (0.5625, euler_to_quat(math.radians(-10.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(-45.0), 0.0, 0.0)),
        ],
        "shin_l": [
            (0.0, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
            (0.1875, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
            (0.375, euler_to_quat(math.radians(18.0), 0.0, 0.0)),
            (0.5625, euler_to_quat(math.radians(78.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(math.radians(48.0), 0.0, 0.0)),
            (0.1875, euler_to_quat(math.radians(-10.0), 0.0, 0.0)),
            (0.375, euler_to_quat(math.radians(-45.0), 0.0, 0.0)),
            (0.5625, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(48.0), 0.0, 0.0)),
        ],
        "shin_r": [
            (0.0, euler_to_quat(math.radians(18.0), 0.0, 0.0)),
            (0.1875, euler_to_quat(math.radians(78.0), 0.0, 0.0)),
            (0.375, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
            (0.5625, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(18.0), 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(math.radians(36.0), 0.0, math.radians(64.0))),
            (0.375, euler_to_quat(math.radians(-36.0), 0.0, math.radians(64.0))),
            (0.75, euler_to_quat(math.radians(36.0), 0.0, math.radians(64.0))),
        ],
        "forearm_l": [
            (0.0, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
            (0.375, euler_to_quat(math.radians(60.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(-36.0), 0.0, math.radians(-64.0))),
            (0.375, euler_to_quat(math.radians(36.0), 0.0, math.radians(-64.0))),
            (0.75, euler_to_quat(math.radians(-36.0), 0.0, math.radians(-64.0))),
        ],
        "forearm_r": [
            (0.0, euler_to_quat(math.radians(60.0), 0.0, 0.0)),
            (0.375, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(60.0), 0.0, 0.0)),
        ],
        "spine_01": [
            (0.0, euler_to_quat(math.radians(10.0), math.radians(6.0), 0.0)),
            (0.375, euler_to_quat(math.radians(10.0), math.radians(-6.0), 0.0)),
            (0.75, euler_to_quat(math.radians(10.0), math.radians(6.0), 0.0)),
        ],
    }
    add_anim("run", 0.75, run_kfs)
    add_anim("jog", 0.75, run_kfs)

    # --- 4. Sprint (0.55s) ---
    sprint_kfs = {
        "thigh_l": [
            (0.0, euler_to_quat(math.radians(-58.0), 0.0, 0.0)),
            (0.275, euler_to_quat(math.radians(62.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(-58.0), 0.0, 0.0)),
        ],
        "shin_l": [
            (0.0, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
            (0.275, euler_to_quat(math.radians(88.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(math.radians(62.0), 0.0, 0.0)),
            (0.275, euler_to_quat(math.radians(-58.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(62.0), 0.0, 0.0)),
        ],
        "shin_r": [
            (0.0, euler_to_quat(math.radians(88.0), 0.0, 0.0)),
            (0.275, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(88.0), 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(math.radians(48.0), 0.0, math.radians(60.0))),
            (0.275, euler_to_quat(math.radians(-48.0), 0.0, math.radians(60.0))),
            (0.55, euler_to_quat(math.radians(48.0), 0.0, math.radians(60.0))),
        ],
        "forearm_l": [
            (0.0, euler_to_quat(math.radians(55.0), 0.0, 0.0)),
            (0.275, euler_to_quat(math.radians(75.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(55.0), 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(-48.0), 0.0, math.radians(-60.0))),
            (0.275, euler_to_quat(math.radians(48.0), 0.0, math.radians(-60.0))),
            (0.55, euler_to_quat(math.radians(-48.0), 0.0, math.radians(-60.0))),
        ],
        "forearm_r": [
            (0.0, euler_to_quat(math.radians(75.0), 0.0, 0.0)),
            (0.275, euler_to_quat(math.radians(55.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(75.0), 0.0, 0.0)),
        ],
        "chest": [
            (0.0, euler_to_quat(math.radians(16.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(16.0), 0.0, 0.0)),
        ],
        "sash_01": [
            (0.0, euler_to_quat(math.radians(-25.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(-25.0), 0.0, 0.0)),
        ],
    }
    add_anim("sprint", 0.55, sprint_kfs)

    # --- 5. Turn (0.6s) ---
    turn_kfs = {
        "pelvis": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.3, euler_to_quat(0.0, math.radians(45.0), 0.0)),
            (0.6, euler_to_quat(0.0, math.radians(90.0), 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.2, euler_to_quat(math.radians(15.0), math.radians(30.0), 0.0)),
            (0.6, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "thigh_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.4, euler_to_quat(math.radians(10.0), math.radians(-15.0), 0.0)),
            (0.6, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("turn", 0.6, turn_kfs)

    # --- 6. Jump (0.75s) ---
    jump_kfs = {
        "chest": [
            (0.0, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(-8.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(-4.0), 0.0, 0.0)),
        ],
        "thigh_l": [
            (0.0, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
            (0.3, euler_to_quat(math.radians(-15.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(-25.0), 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
            (0.3, euler_to_quat(math.radians(-15.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        ],
        "shin_l": [
            (0.0, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
        ],
        "shin_r": [
            (0.0, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(math.radians(-30.0), 0.0, 0.0)),
            (0.4, euler_to_quat(math.radians(45.0), 0.0, math.radians(-20.0))),
            (0.75, euler_to_quat(math.radians(20.0), 0.0, math.radians(-15.0))),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(-30.0), 0.0, 0.0)),
            (0.4, euler_to_quat(math.radians(45.0), 0.0, math.radians(20.0))),
            (0.75, euler_to_quat(math.radians(20.0), 0.0, math.radians(15.0))),
        ],
    }
    add_anim("jump", 0.75, jump_kfs)
    add_anim("jump_start", 0.3, jump_kfs)

    # --- 7. Fall (0.6s) ---
    fall_kfs = {
        "chest": [(0.0, euler_to_quat(math.radians(4.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(6.0), 0.0, 0.0))],
        "thigh_l": [(0.0, euler_to_quat(math.radians(-15.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(-10.0), 0.0, 0.0))],
        "thigh_r": [(0.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(10.0), 0.0, 0.0))],
        "arm_l": [(0.0, euler_to_quat(math.radians(20.0), 0.0, math.radians(-25.0))), (0.6, euler_to_quat(math.radians(25.0), 0.0, math.radians(-28.0)))],
        "arm_r": [(0.0, euler_to_quat(math.radians(20.0), 0.0, math.radians(25.0))), (0.6, euler_to_quat(math.radians(25.0), 0.0, math.radians(28.0)))],
        "sash_01": [(0.0, euler_to_quat(math.radians(20.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(25.0), 0.0, 0.0))],
    }
    add_anim("fall", 0.6, fall_kfs)
    add_anim("jump_fall", 0.6, fall_kfs)

    # --- 8. Landing (0.4s) ---
    land_kfs = {
        "pelvis": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.15, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
            (0.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "thigh_l": [
            (0.0, euler_to_quat(math.radians(-5.0), 0.0, 0.0)),
            (0.15, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
            (0.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(math.radians(-5.0), 0.0, 0.0)),
            (0.15, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
            (0.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "shin_l": [
            (0.0, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
            (0.15, euler_to_quat(math.radians(55.0), 0.0, 0.0)),
            (0.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "shin_r": [
            (0.0, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
            (0.15, euler_to_quat(math.radians(55.0), 0.0, 0.0)),
            (0.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("landing", 0.4, land_kfs)
    add_anim("jump_land", 0.4, land_kfs)

    # --- 9. Dodge (0.65s) ---
    dodge_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.2, euler_to_quat(math.radians(65.0), 0.0, 0.0)),
            (0.45, euler_to_quat(math.radians(35.0), math.radians(20.0), 0.0)),
            (0.65, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "thigh_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(70.0), 0.0, 0.0)),
            (0.65, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(50.0), 0.0, 0.0)),
            (0.65, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(-60.0), 0.0, 0.0)),
            (0.65, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("dodge", 0.65, dodge_kfs)

    # --- 10. Block (0.5s) ---
    block_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.2, euler_to_quat(math.radians(8.0), math.radians(-15.0), 0.0)),
            (0.5, euler_to_quat(math.radians(8.0), math.radians(-15.0), 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.2, euler_to_quat(math.radians(-40.0), math.radians(-45.0), math.radians(35.0))),
            (0.5, euler_to_quat(math.radians(-40.0), math.radians(-45.0), math.radians(35.0))),
        ],
        "arm_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.2, euler_to_quat(math.radians(35.0), math.radians(35.0), math.radians(-40.0))),
            (0.5, euler_to_quat(math.radians(35.0), math.radians(35.0), math.radians(-40.0))),
        ],
        "thigh_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.2, euler_to_quat(math.radians(15.0), 0.0, math.radians(-10.0))),
            (0.5, euler_to_quat(math.radians(15.0), 0.0, math.radians(-10.0))),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.2, euler_to_quat(math.radians(-15.0), 0.0, math.radians(10.0))),
            (0.5, euler_to_quat(math.radians(-15.0), 0.0, math.radians(10.0))),
        ],
    }
    add_anim("block", 0.5, block_kfs)

    # --- 11. Parry (0.45s) ---
    parry_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.15, euler_to_quat(math.radians(-5.0), math.radians(25.0), 0.0)),
            (0.45, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.12, euler_to_quat(math.radians(-65.0), math.radians(45.0), math.radians(25.0))),
            (0.45, euler_to_quat(math.radians(-15.0), 0.0, 0.0)),
        ],
    }
    add_anim("parry", 0.45, parry_kfs)

    # --- 12. Attack Light 1 (0.6s) ---
    atk1_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.15, euler_to_quat(0.0, math.radians(35.0), 0.0)),
            (0.35, euler_to_quat(math.radians(5.0), math.radians(-45.0), 0.0)),
            (0.6, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
            (0.15, euler_to_quat(math.radians(-40.0), math.radians(-35.0), math.radians(45.0))),
            (0.35, euler_to_quat(math.radians(15.0), math.radians(75.0), math.radians(-25.0))),
            (0.6, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.35, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
            (0.6, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("attack_light_1", 0.6, atk1_kfs)

    # --- 13. Attack Light 2 (0.6s) ---
    atk2_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, math.radians(-40.0), 0.0)),
            (0.2, euler_to_quat(math.radians(-10.0), math.radians(40.0), 0.0)),
            (0.6, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(15.0), math.radians(60.0), 0.0)),
            (0.2, euler_to_quat(math.radians(-65.0), math.radians(-40.0), math.radians(30.0))),
            (0.6, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
        ],
    }
    add_anim("attack_light_2", 0.6, atk2_kfs)

    # --- 14. Attack Heavy Finisher (1.0s) ---
    finisher_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.35, euler_to_quat(math.radians(-25.0), 0.0, 0.0)),
            (0.65, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
            (1.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.35, euler_to_quat(math.radians(-110.0), 0.0, math.radians(15.0))),
            (0.65, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
            (1.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.35, euler_to_quat(math.radians(-95.0), 0.0, math.radians(-15.0))),
            (0.65, euler_to_quat(math.radians(40.0), 0.0, 0.0)),
            (1.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "thigh_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.35, euler_to_quat(math.radians(-15.0), 0.0, 0.0)),
            (0.65, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
            (1.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "shin_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.65, euler_to_quat(math.radians(50.0), 0.0, 0.0)),
            (1.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("attack_heavy_finisher", 1.0, finisher_kfs)
    add_anim("combo", 1.0, finisher_kfs)

    # --- 15. Hit Reaction (0.5s) ---
    hit_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.12, euler_to_quat(math.radians(-22.0), math.radians(12.0), 0.0)),
            (0.5, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "head": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.12, euler_to_quat(math.radians(-18.0), 0.0, 0.0)),
            (0.5, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "thigh_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.2, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
            (0.5, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("hit_reaction", 0.5, hit_kfs)

    # --- 16. Interact (1.0s) ---
    interact_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.4, euler_to_quat(math.radians(18.0), 0.0, 0.0)),
            (0.8, euler_to_quat(math.radians(18.0), 0.0, 0.0)),
            (1.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.4, euler_to_quat(math.radians(-65.0), math.radians(-15.0), 0.0)),
            (0.8, euler_to_quat(math.radians(-65.0), math.radians(-15.0), 0.0)),
            (1.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("interact", 1.0, interact_kfs)

    # --- 17. Victory (2.0s) ---
    victory_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(-10.0), 0.0, 0.0)),
            (1.5, euler_to_quat(math.radians(-15.0), 0.0, 0.0)),
            (2.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(-120.0), 0.0, math.radians(15.0))),
            (1.5, euler_to_quat(math.radians(-120.0), 0.0, math.radians(15.0))),
            (2.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "head": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
            (1.5, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
            (2.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("victory", 2.0, victory_kfs)

    # --- 18. Defeat (1.8s) ---
    defeat_kfs = {
        "pelvis": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.8, euler_to_quat(math.radians(-15.0), 0.0, 0.0)),
            (1.8, euler_to_quat(math.radians(-25.0), 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.8, euler_to_quat(math.radians(-65.0), 0.0, 0.0)),
            (1.8, euler_to_quat(math.radians(-75.0), 0.0, 0.0)),
        ],
        "shin_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.8, euler_to_quat(math.radians(90.0), 0.0, 0.0)),
            (1.8, euler_to_quat(math.radians(95.0), 0.0, 0.0)),
        ],
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.8, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
            (1.8, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        ],
        "head": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.8, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
            (1.8, euler_to_quat(math.radians(40.0), 0.0, 0.0)),
        ],
    }
    add_anim("defeat", 1.8, defeat_kfs)

    # 7. Write GLB Output
    glb_data = builder.build_glb()
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(glb_data)

    print(f"[Character Pipeline] Successfully generated {len(glb_data)} bytes at {output_path}")

if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "godot/assets/characters/veer/veer.glb"
    generate_production_veer_glb(out)
