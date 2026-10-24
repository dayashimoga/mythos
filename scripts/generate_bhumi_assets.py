"""
Mythos 3D - Production Environment Asset Pipeline Generator
Stage D: Complete 3D Landscape & World Architecture

Generates game-ready, authentic Vedic/Hoysala 3D glTF/GLB models:
1. temple_shikhara.glb - 14m tiered temple tower with amalaka and kalasha finial
2. temple_torana.glb - Sanchi-style ceremonial monumental gateway with 3 curved architraves
3. temple_column.glb - Carved Hoysala stone pillar with 16-faceted shaft and bracket capital
4. banyan_tree.glb - Sacred Banyan tree with sculpted aerial roots and layered canopy
5. sal_tree.glb - Tall columnar Sal tree with fissured bark and tropical dome canopy
6. basalt_boulder.glb - Natural faceted mossy basalt rock outcropping
7. stone_lantern.glb - Vedic Deepastambha carved stone oil lantern pillar
8. ruined_watchtower.glb - Ancient stone fortress watchtower with spiral stairs and parapet
9. water_ghat_stairs.glb - Stepped stone ghat module for Kalyani reservoir
10. lotus_pedestal.glb - Sacred double-lotus stone peetham dais
"""

import os
import math
import struct
import json
import io
import numpy as np
from PIL import Image, ImageDraw

# ---------------------------------------------------------
# Texture Generation (PBR Albedo, Normal, Roughness/Metallic)
# ---------------------------------------------------------

def create_basalt_textures():
    size = (512, 512)
    # Albedo: Dark ancient volcanic basalt with carved stone block courses
    albedo = Image.new("RGBA", size, (48, 50, 56, 255))
    draw = ImageDraw.Draw(albedo)
    # Subtle noise & paver joints
    for y in range(0, size[1], 64):
        draw.line([(0, y), (size[0], y)], fill=(28, 30, 34, 255), width=3)
    for row in range(0, size[1], 64):
        offset = 64 if (row // 64) % 2 == 1 else 0
        for x in range(offset, size[0], 128):
            draw.line([(x, row), (x, row + 64)], fill=(28, 30, 34, 255), width=3)
    
    # Carved Brahmic solar frieze band in center
    cy = 256
    draw.rectangle([0, cy - 20, size[0], cy + 20], fill=(62, 64, 72, 255))
    for x in range(16, size[0], 48):
        draw.ellipse([x - 12, cy - 12, x + 12, cy + 12], outline=(180, 150, 60, 220), width=2)
        draw.ellipse([x - 4, cy - 4, x + 4, cy + 4], fill=(210, 175, 70, 240))
        # Sun rays
        for a in range(8):
            ang = a * (math.pi / 4)
            rx = int(x + math.cos(ang) * 16)
            ry = int(cy + math.sin(ang) * 16)
            draw.line([(x, cy), (rx, ry)], fill=(180, 150, 60, 180), width=1)

    # Normal map
    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    ndraw = ImageDraw.Draw(normal)
    for y in range(0, size[1], 64):
        ndraw.line([(0, y - 1), (size[0], y - 1)], fill=(128, 170, 255, 255), width=2)
        ndraw.line([(0, y + 1), (size[0], y + 1)], fill=(128, 86, 255, 255), width=2)

    # Metallic / Roughness (G = Roughness 0.85, B = Metallic 0.05)
    mr = Image.new("RGBA", size, (0, int(255 * 0.85), int(255 * 0.05), 255))
    return albedo, normal, mr

def create_sandstone_textures():
    size = (512, 512)
    # Warm golden Chunar sandstone
    albedo = Image.new("RGBA", size, (185, 145, 95, 255))
    draw = ImageDraw.Draw(albedo)
    # Carved bands & geometric inlays
    for y in range(size[1]):
        factor = math.sin(y * 0.15) * 8
        r = int(min(255, max(0, 185 + factor)))
        g = int(min(255, max(0, 145 + factor * 0.8)))
        b = int(min(255, max(0, 95 + factor * 0.6)))
        draw.line([(0, y), (size[0], y)], fill=(r, g, b, 255))
    
    # Intricate lotus petal carvings
    for y in [64, 192, 320, 448]:
        draw.rectangle([0, y - 14, size[0], y + 14], fill=(160, 120, 75, 255))
        for x in range(20, size[0], 40):
            draw.polygon([(x, y - 12), (x + 16, y), (x, y + 12), (x - 16, y)], fill=(215, 175, 115, 255))

    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    mr = Image.new("RGBA", size, (0, int(255 * 0.75), int(255 * 0.1), 255))
    return albedo, normal, mr

def create_temple_gold_textures():
    size = (256, 256)
    albedo = Image.new("RGBA", size, (235, 180, 45, 255))
    draw = ImageDraw.Draw(albedo)
    for i in range(16):
        draw.ellipse([128 - i*7, 128 - i*7, 128 + i*7, 128 + i*7], outline=(255, 220, 90, 255), width=2)
    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    mr = Image.new("RGBA", size, (0, int(255 * 0.25), int(255 * 0.92), 255)) # Highly metallic, polished gold
    emissive = Image.new("RGBA", size, (60, 40, 10, 255))
    return albedo, normal, mr, emissive

def create_bark_textures():
    size = (512, 512)
    # Fissured warm brown tree bark with moss
    albedo = Image.new("RGBA", size, (85, 60, 42, 255))
    draw = ImageDraw.Draw(albedo)
    for x in range(size[0]):
        grain = math.sin(x * 0.2) * 12 + math.sin(x * 0.8) * 6
        r = int(min(255, max(0, 85 + grain)))
        g = int(min(255, max(0, 60 + grain * 0.9)))
        b = int(min(255, max(0, 42 + grain * 0.7)))
        draw.line([(x, 0), (x, size[1])], fill=(r, g, b, 255))
    # Green moss patches
    for y in range(0, size[1], 80):
        draw.ellipse([40, y, 160, y + 60], fill=(68, 92, 45, 180))
        draw.ellipse([300, y + 40, 440, y + 90], fill=(55, 82, 38, 180))

    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    mr = Image.new("RGBA", size, (0, int(255 * 0.90), int(255 * 0.02), 255))
    return albedo, normal, mr

def create_foliage_textures():
    size = (256, 256)
    # Dense lush tropical canopy leaves
    albedo = Image.new("RGBA", size, (38, 85, 34, 255))
    draw = ImageDraw.Draw(albedo)
    for y in range(0, size[1], 24):
        for x in range(0, size[0], 24):
            # Clustered leaf shapes
            draw.polygon([(x + 12, y), (x + 22, y + 10), (x + 12, y + 20), (x + 2, y + 10)], fill=(54, 118, 48, 255))
            draw.line([(x + 12, y), (x + 12, y + 20)], fill=(28, 62, 24, 255), width=1)
    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    mr = Image.new("RGBA", size, (0, int(255 * 0.65), int(255 * 0.0), 255))
    return albedo, normal, mr

def create_rock_textures():
    size = (512, 512)
    # Dark granite basalt with moss cap
    albedo = Image.new("RGBA", size, (72, 74, 78, 255))
    draw = ImageDraw.Draw(albedo)
    # Moss top gradient
    for y in range(int(size[1] * 0.35)):
        factor = 1.0 - (y / (size[1] * 0.35))
        r = int(72 * (1 - factor) + 55 * factor)
        g = int(74 * (1 - factor) + 95 * factor)
        b = int(78 * (1 - factor) + 38 * factor)
        draw.line([(0, y), (size[0], y)], fill=(r, g, b, 255))
    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    mr = Image.new("RGBA", size, (0, int(255 * 0.88), int(255 * 0.05), 255))
    return albedo, normal, mr

# ---------------------------------------------------------
# Modular GLB Builder
# ---------------------------------------------------------

class GLBBuilder:
    def __init__(self, name="BhumiAsset"):
        self.name = name
        self.bin_data = bytearray()
        self.buffer_views = []
        self.accessors = []
        self.images = []
        self.textures = []
        self.samplers = [{
            "magFilter": 9729, # LINEAR
            "minFilter": 9987, # LINEAR_MIPMAP_LINEAR
            "wrapS": 10497,    # REPEAT
            "wrapT": 10497
        }]
        self.materials = []
        self.meshes = []
        self.nodes = []

    def add_buffer_view(self, data_bytes, target=None):
        pad = (4 - (len(self.bin_data) % 4)) % 4
        self.bin_data.extend(b'\x00' * pad)
        offset = len(self.bin_data)
        self.bin_data.extend(data_bytes)
        bv = {
            "buffer": 0,
            "byteOffset": offset,
            "byteLength": len(data_bytes)
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

    def add_image_from_pil(self, pil_img):
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG", optimize=True)
        img_bytes = buf.getvalue()
        bv_idx = self.add_buffer_view(img_bytes)
        self.images.append({
            "bufferView": bv_idx,
            "mimeType": "image/png"
        })
        img_idx = len(self.images) - 1
        self.textures.append({
            "sampler": 0,
            "source": img_idx
        })
        return len(self.textures) - 1

    def add_pbr_material(self, name, albedo_tex_idx, normal_tex_idx=None, mr_tex_idx=None, emissive_tex_idx=None, double_sided=False):
        mat = {
            "name": name,
            "pbrMetallicRoughness": {
                "baseColorTexture": {"index": albedo_tex_idx},
                "roughnessFactor": 1.0,
                "metallicFactor": 1.0
            },
            "doubleSided": double_sided
        }
        if normal_tex_idx is not None:
            mat["normalTexture"] = {"index": normal_tex_idx, "scale": 1.0}
        if mr_tex_idx is not None:
            mat["pbrMetallicRoughness"]["metallicRoughnessTexture"] = {"index": mr_tex_idx}
        if emissive_tex_idx is not None:
            mat["emissiveTexture"] = {"index": emissive_tex_idx}
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
        pad = (4 - (len(self.bin_data) % 4)) % 4
        self.bin_data.extend(b'\x00' * pad)

        gltf = {
            "asset": {"version": "2.0", "generator": "Mythos 3D Environment Pipeline"},
            "scene": 0,
            "scenes": [{"name": self.name + "_Scene", "nodes": [0]}],
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
# Mesh Geometry Construction Helpers
# ---------------------------------------------------------

class MeshBuilder:
    def __init__(self, mat_id):
        self.mat_id = mat_id
        self.positions = []
        self.normals = []
        self.uvs = []
        self.indices = []

    def add_box(self, center, size, uv_scale=(1.0, 1.0)):
        cx, cy, cz = center
        sx, sy, sz = size[0]*0.5, size[1]*0.5, size[2]*0.5
        u_s, v_s = uv_scale

        faces = [
            # Front (+Z)
            ([cx-sx, cy-sy, cz+sz], [cx+sx, cy-sy, cz+sz], [cx+sx, cy+sy, cz+sz], [cx-sx, cy+sy, cz+sz], [0, 0, 1]),
            # Back (-Z)
            ([cx+sx, cy-sy, cz-sz], [cx-sx, cy-sy, cz-sz], [cx-sx, cy+sy, cz-sz], [cx+sx, cy+sy, cz-sz], [0, 0, -1]),
            # Top (+Y)
            ([cx-sx, cy+sy, cz+sz], [cx+sx, cy+sy, cz+sz], [cx+sx, cy+sy, cz-sz], [cx-sx, cy+sy, cz-sz], [0, 1, 0]),
            # Bottom (-Y)
            ([cx-sx, cy-sy, cz-sz], [cx+sx, cy-sy, cz-sz], [cx+sx, cy-sy, cz+sz], [cx-sx, cy-sy, cz+sz], [0, -1, 0]),
            # Right (+X)
            ([cx+sx, cy-sy, cz+sz], [cx+sx, cy-sy, cz-sz], [cx+sx, cy+sy, cz-sz], [cx+sx, cy+sy, cz+sz], [1, 0, 0]),
            # Left (-X)
            ([cx-sx, cy-sy, cz-sz], [cx-sx, cy-sy, cz+sz], [cx-sx, cy+sy, cz+sz], [cx-sx, cy+sy, cz-sz], [-1, 0, 0]),
        ]

        for p0, p1, p2, p3, norm in faces:
            b = len(self.positions)
            self.positions.extend([p0, p1, p2, p3])
            self.normals.extend([norm, norm, norm, norm])
            self.uvs.extend([[0, 0], [u_s, 0], [u_s, v_s], [0, v_s]])
            self.indices.extend([b, b+1, b+2, b, b+2, b+3])

    def add_cylinder(self, center, radius_bottom, radius_top, height, segments=16, cap_top=True, cap_bottom=True):
        cx, cy, cz = center
        y0 = cy - height * 0.5
        y1 = cy + height * 0.5
        b_idx = len(self.positions)

        for i in range(segments + 1):
            u = i / segments
            ang = u * 2.0 * math.pi
            cos_a = math.cos(ang)
            sin_a = math.sin(ang)

            p_bot = [cx + cos_a * radius_bottom, y0, cz + sin_a * radius_bottom]
            n_bot = [cos_a, 0.0, sin_a]
            self.positions.append(p_bot)
            self.normals.append(n_bot)
            self.uvs.append([u, 0.0])

            p_top = [cx + cos_a * radius_top, y1, cz + sin_a * radius_top]
            n_top = [cos_a, 0.0, sin_a]
            self.positions.append(p_top)
            self.normals.append(n_top)
            self.uvs.append([u, 1.0])

        for i in range(segments):
            i0 = b_idx + i * 2
            i1 = i0 + 1
            i2 = i0 + 2
            i3 = i0 + 3
            self.indices.extend([i0, i2, i1, i1, i2, i3])

        if cap_top and radius_top > 0:
            c_idx = len(self.positions)
            self.positions.append([cx, y1, cz])
            self.normals.append([0, 1, 0])
            self.uvs.append([0.5, 0.5])
            for i in range(segments + 1):
                ang = (i / segments) * 2.0 * math.pi
                p = [cx + math.cos(ang) * radius_top, y1, cz + math.sin(ang) * radius_top]
                self.positions.append(p)
                self.normals.append([0, 1, 0])
                self.uvs.append([0.5 + 0.5 * math.cos(ang), 0.5 + 0.5 * math.sin(ang)])
            for i in range(segments):
                self.indices.extend([c_idx, c_idx + 1 + i, c_idx + 2 + i])

        if cap_bottom and radius_bottom > 0:
            c_idx = len(self.positions)
            self.positions.append([cx, y0, cz])
            self.normals.append([0, -1, 0])
            self.uvs.append([0.5, 0.5])
            for i in range(segments + 1):
                ang = (i / segments) * 2.0 * math.pi
                p = [cx + math.cos(ang) * radius_bottom, y0, cz + math.sin(ang) * radius_bottom]
                self.positions.append(p)
                self.normals.append([0, -1, 0])
                self.uvs.append([0.5 + 0.5 * math.cos(ang), 0.5 + 0.5 * math.sin(ang)])
            for i in range(segments):
                self.indices.extend([c_idx, c_idx + 2 + i, c_idx + 1 + i])

    def add_lathed_profile(self, center, profile_rings, segments=16):
        cx, cy, cz = center
        b_idx = len(self.positions)
        n_rings = len(profile_rings)

        for r_idx, (dy, radius, v) in enumerate(profile_rings):
            y = cy + dy
            for s_idx in range(segments + 1):
                u = s_idx / segments
                ang = u * 2.0 * math.pi
                cos_a = math.cos(ang)
                sin_a = math.sin(ang)
                pos = [cx + cos_a * radius, y, cz + sin_a * radius]
                norm = [cos_a, 0.0, sin_a]
                self.positions.append(pos)
                self.normals.append(norm)
                self.uvs.append([u, v])

        for r in range(n_rings - 1):
            for s in range(segments):
                i00 = b_idx + r * (segments + 1) + s
                i01 = i00 + 1
                i10 = b_idx + (r + 1) * (segments + 1) + s
                i11 = i10 + 1
                self.indices.extend([i00, i10, i01, i01, i10, i11])

# ---------------------------------------------------------
# Asset 1: Temple Shikhara (14m curvilinear spire tower)
# ---------------------------------------------------------

def generate_temple_shikhara(output_dir):
    builder = GLBBuilder("TempleShikhara")
    t_albedo, t_normal, t_mr = create_basalt_textures()
    g_albedo, g_normal, g_mr, g_emiss = create_temple_gold_textures()

    mat_stone = builder.add_pbr_material("Mat_BasaltStone", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))
    mat_gold = builder.add_pbr_material("Mat_TempleGold", builder.add_image_from_pil(g_albedo), builder.add_image_from_pil(g_normal), builder.add_image_from_pil(g_mr), builder.add_image_from_pil(g_emiss))

    mesh_stone = MeshBuilder(mat_stone)
    mesh_gold = MeshBuilder(mat_gold)

    # 1. Base Plinth (Adhisthana)
    mesh_stone.add_box([0, 0.3, 0], [9.2, 0.6, 9.2], (4.0, 1.0))
    mesh_stone.add_box([0, 0.8, 0], [8.6, 0.4, 8.6], (4.0, 1.0))
    mesh_stone.add_box([0, 1.2, 0], [8.0, 0.4, 8.0], (4.0, 1.0))

    # 2. Garbhagriha Cella (Central Chamber Walls)
    wall_h = 4.2
    wall_y = 1.4 + wall_h * 0.5
    mesh_stone.add_box([-3.5, wall_y, 0], [1.0, wall_h, 7.0], (1.0, 4.0)) # West wall
    mesh_stone.add_box([3.5, wall_y, 0], [1.0, wall_h, 7.0], (1.0, 4.0))  # East wall
    mesh_stone.add_box([0, wall_y, -3.5], [8.0, wall_h, 1.0], (4.0, 4.0)) # North wall
    mesh_stone.add_box([-2.5, wall_y, 3.5], [2.0, wall_h, 1.0], (1.0, 4.0)) # South L
    mesh_stone.add_box([2.5, wall_y, 3.5], [2.0, wall_h, 1.0], (1.0, 4.0))  # South R
    # Lintel over entrance
    mesh_stone.add_box([0, 4.8, 3.5], [3.2, 1.2, 1.1], (2.0, 1.0))

    # 3. Mandapa Portico
    col_rad = 0.28
    for col_x in [-2.4, 2.4]:
        for col_z in [4.8, 7.2]:
            mesh_stone.add_cylinder([col_x, 1.4 + 2.0, col_z], col_rad, col_rad, 4.0, 12)
            mesh_stone.add_box([col_x, 1.4 + 4.1, col_z], [0.8, 0.25, 0.8], (1.0, 1.0))
    mesh_stone.add_box([0, 5.75, 5.8], [6.2, 0.5, 4.2], (3.0, 2.0))
    mesh_stone.add_box([0, 6.2, 5.8], [5.2, 0.4, 3.4], (2.5, 1.5))
    mesh_stone.add_box([0, 6.55, 5.8], [4.2, 0.3, 2.6], (2.0, 1.0))

    # 4. Curvilinear Shikhara Spire
    tiers = [
        (6.0, 7.4, 0.8),
        (6.8, 6.6, 0.8),
        (7.6, 5.8, 0.8),
        (8.4, 5.0, 0.8),
        (9.2, 4.2, 0.8),
        (10.0, 3.4, 0.8),
        (10.8, 2.6, 0.8),
        (11.6, 2.0, 0.8),
    ]
    for ty, size_sq, th in tiers:
        mesh_stone.add_box([0, ty, 0], [size_sq, th, size_sq], (size_sq * 0.5, 1.0))
        mesh_stone.add_box([0, ty + th*0.5, 0], [size_sq + 0.3, 0.15, size_sq + 0.3], (2.0, 0.5))

    # 5. Spire Neck (Griva) & Amalaka Spire Crown
    mesh_stone.add_cylinder([0, 12.2, 0], 1.2, 1.2, 0.4, 16)
    amalaka_profile = [
        (0.0, 1.2, 0.0),
        (0.2, 2.1, 0.3),
        (0.4, 2.3, 0.5),
        (0.6, 2.1, 0.7),
        (0.8, 1.3, 1.0)
    ]
    mesh_stone.add_lathed_profile([0, 12.4, 0], amalaka_profile, 16)

    # 6. Golden Kalasha Finial & Surya Crest
    kalasha_profile = [
        (0.0, 0.6, 0.0),
        (0.3, 1.1, 0.3),
        (0.6, 1.2, 0.5),
        (0.9, 0.6, 0.7),
        (1.2, 0.7, 0.85),
        (1.6, 0.1, 1.0)
    ]
    mesh_gold.add_lathed_profile([0, 13.2, 0], kalasha_profile, 16)
    mesh_gold.add_cylinder([0, 14.8, 0], 0.08, 0.02, 0.8, 8)

    prims = [builder.add_mesh_primitive(mesh_stone), builder.add_mesh_primitive(mesh_gold)]
    builder.meshes.append({"name": "Mesh_TempleShikhara", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_TempleShikhara", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "temple_shikhara.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Asset Generator] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 2: Temple Torana (Sanchi Ceremonial Gateway)
# ---------------------------------------------------------

def generate_temple_torana(output_dir):
    builder = GLBBuilder("TempleTorana")
    t_albedo, t_normal, t_mr = create_sandstone_textures()
    g_albedo, g_normal, g_mr, g_emiss = create_temple_gold_textures()

    mat_stone = builder.add_pbr_material("Mat_Sandstone", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))
    mat_gold = builder.add_pbr_material("Mat_GoldInlay", builder.add_image_from_pil(g_albedo), builder.add_image_from_pil(g_normal), builder.add_image_from_pil(g_mr), builder.add_image_from_pil(g_emiss))

    mesh_stone = MeshBuilder(mat_stone)
    mesh_gold = MeshBuilder(mat_gold)

    pillar_w = 0.65
    pillar_h = 7.0
    for px in [-2.4, 2.4]:
        mesh_stone.add_box([px, 0.25, 0], [1.2, 0.5, 1.2], (1.0, 1.0))
        mesh_stone.add_box([px, 0.6, 0], [0.95, 0.2, 0.95], (1.0, 1.0))
        mesh_stone.add_box([px, 0.7 + pillar_h*0.5, 0], [pillar_w, pillar_h, pillar_w], (1.0, 4.0))
        mesh_stone.add_box([px, 0.7 + pillar_h + 0.35, 0], [1.1, 0.7, 1.1], (1.0, 1.0))

    beam_w = 7.6
    beam_h = 0.45
    beam_d = 0.45
    beam_heights = [5.4, 6.2, 7.0]

    for bh in beam_heights:
        mesh_stone.add_box([0, bh, 0], [beam_w, beam_h, beam_d], (4.0, 1.0))
        for sx in [-beam_w*0.5 - 0.25, beam_w*0.5 + 0.25]:
            mesh_stone.add_cylinder([sx, bh, 0], 0.35, 0.35, 0.5, 12)
            mesh_gold.add_cylinder([sx, bh, 0.26], 0.15, 0.15, 0.04, 8)

    for b_idx in range(2):
        y_mid = (beam_heights[b_idx] + beam_heights[b_idx+1]) * 0.5
        for sx in [-1.5, 0.0, 1.5]:
            mesh_stone.add_box([sx, y_mid, 0], [0.35, 0.35, 0.38], (1.0, 1.0))
            mesh_gold.add_cylinder([sx, y_mid, 0.2], 0.12, 0.12, 0.03, 8)

    mesh_gold.add_cylinder([0, 7.8, 0], 0.65, 0.65, 0.12, 16)
    mesh_gold.add_cylinder([0, 8.55, 0], 0.08, 0.02, 0.6, 8)

    prims = [builder.add_mesh_primitive(mesh_stone), builder.add_mesh_primitive(mesh_gold)]
    builder.meshes.append({"name": "Mesh_TempleTorana", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_TempleTorana", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "temple_torana.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Asset Generator] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 3: Hoysala Temple Column (Pillar)
# ---------------------------------------------------------

def generate_temple_column(output_dir):
    builder = GLBBuilder("TempleColumn")
    t_albedo, t_normal, t_mr = create_basalt_textures()
    g_albedo, g_normal, g_mr, _ = create_temple_gold_textures()

    mat_stone = builder.add_pbr_material("Mat_BasaltPillar", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))
    mat_gold = builder.add_pbr_material("Mat_GoldRing", builder.add_image_from_pil(g_albedo), builder.add_image_from_pil(g_normal), builder.add_image_from_pil(g_mr))

    mesh_stone = MeshBuilder(mat_stone)
    mesh_gold = MeshBuilder(mat_gold)

    mesh_stone.add_box([0, 0.2, 0], [0.8, 0.4, 0.8], (1.0, 1.0))
    mesh_stone.add_box([0, 0.5, 0], [0.65, 0.2, 0.65], (1.0, 1.0))
    mesh_stone.add_cylinder([0, 0.75, 0], 0.32, 0.28, 0.3, 8)

    pillar_profile = [
        (0.0, 0.26, 0.0),
        (0.4, 0.25, 0.15),
        (0.7, 0.31, 0.3),
        (1.0, 0.24, 0.45),
        (1.5, 0.25, 0.65),
        (1.8, 0.30, 0.75),
        (2.1, 0.24, 0.85),
        (2.4, 0.24, 1.0),
    ]
    mesh_stone.add_lathed_profile([0, 0.9, 0], pillar_profile, 16)
    mesh_gold.add_cylinder([0, 2.7, 0], 0.31, 0.31, 0.08, 16)

    mesh_stone.add_cylinder([0, 3.5, 0], 0.24, 0.45, 0.4, 16)
    mesh_stone.add_box([0, 3.8, 0], [0.95, 0.2, 0.95], (1.0, 1.0))
    mesh_stone.add_box([0, 4.05, 0], [1.1, 0.3, 0.45], (1.0, 1.0))
    mesh_stone.add_box([0, 4.05, 0], [0.45, 0.3, 1.1], (1.0, 1.0))

    prims = [builder.add_mesh_primitive(mesh_stone), builder.add_mesh_primitive(mesh_gold)]
    builder.meshes.append({"name": "Mesh_TempleColumn", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_TempleColumn", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "temple_column.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Asset Generator] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 4: Sacred Banyan Tree
# ---------------------------------------------------------

def generate_banyan_tree(output_dir):
    builder = GLBBuilder("BanyanTree")
    b_albedo, b_normal, b_mr = create_bark_textures()
    f_albedo, f_normal, f_mr = create_foliage_textures()

    mat_bark = builder.add_pbr_material("Mat_BanyanBark", builder.add_image_from_pil(b_albedo), builder.add_image_from_pil(b_normal), builder.add_image_from_pil(b_mr))
    mat_leaves = builder.add_pbr_material("Mat_CanopyLeaves", builder.add_image_from_pil(f_albedo), builder.add_image_from_pil(f_normal), builder.add_image_from_pil(f_mr), double_sided=True)

    mesh_bark = MeshBuilder(mat_bark)
    mesh_leaves = MeshBuilder(mat_leaves)

    trunk_profile = [
        (0.0, 1.4, 0.0),
        (1.0, 1.1, 0.2),
        (2.5, 0.95, 0.5),
        (4.5, 0.85, 0.8),
        (6.0, 1.3, 1.0),
    ]
    mesh_bark.add_lathed_profile([0, 0, 0], trunk_profile, 14)

    roots = [
        (-2.2, -1.8, 5.5, 0.22),
        (2.4, -1.5, 5.2, 0.24),
        (-1.9, 2.3, 5.4, 0.20),
        (2.1, 2.0, 5.6, 0.23),
    ]
    for rx, rz, top_y, r_rad in roots:
        mesh_bark.add_cylinder([rx, top_y*0.5, rz], r_rad*1.3, r_rad*0.8, top_y, 10)
        mesh_bark.add_cylinder([rx*1.1, 0.2, rz*1.1], r_rad*1.8, r_rad*1.2, 0.4, 10)

    branches = [
        (-3.0, 6.2, -2.5, 0.45, 4.2),
        (3.2, 6.4, -2.2, 0.42, 4.0),
        (-2.8, 6.3, 2.8, 0.44, 4.1),
        (3.0, 6.5, 2.6, 0.43, 4.3),
        (0.0, 6.8, 0.0, 0.55, 3.5),
    ]
    for bx, by, bz, brad, blen in branches:
        mesh_bark.add_cylinder([bx*0.6, by, bz*0.6], brad*1.2, brad*0.7, blen, 10)

    leaf_clusters = [
        (0.0, 8.5, 0.0, 4.2, 2.4),
        (0.0, 9.8, 0.0, 3.2, 1.8),
        (-3.4, 7.8, -2.8, 3.2, 2.0),
        (3.6, 8.0, -2.6, 3.3, 2.1),
        (-3.2, 7.9, 3.2, 3.1, 2.0),
        (3.4, 8.1, 3.0, 3.4, 2.2),
        (-4.5, 6.8, 0.0, 2.4, 1.6),
        (4.5, 6.9, 0.0, 2.4, 1.6),
        (0.0, 7.0, -4.2, 2.5, 1.6),
        (0.0, 7.1, 4.2, 2.5, 1.6),
    ]
    for lx, ly, lz, lrad, lh in leaf_clusters:
        mesh_leaves.add_cylinder([lx, ly, lz], lrad, lrad*0.7, lh, 12)
        mesh_leaves.add_cylinder([lx, ly + lh*0.4, lz], lrad*0.75, lrad*0.2, lh*0.6, 10)

    prims = [builder.add_mesh_primitive(mesh_bark), builder.add_mesh_primitive(mesh_leaves)]
    builder.meshes.append({"name": "Mesh_BanyanTree", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_BanyanTree", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "banyan_tree.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Asset Generator] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 5: Sacred Sal Tree
# ---------------------------------------------------------

def generate_sal_tree(output_dir):
    builder = GLBBuilder("SalTree")
    b_albedo, b_normal, b_mr = create_bark_textures()
    f_albedo, f_normal, f_mr = create_foliage_textures()

    mat_bark = builder.add_pbr_material("Mat_SalBark", builder.add_image_from_pil(b_albedo), builder.add_image_from_pil(b_normal), builder.add_image_from_pil(b_mr))
    mat_leaves = builder.add_pbr_material("Mat_SalLeaves", builder.add_image_from_pil(f_albedo), builder.add_image_from_pil(f_normal), builder.add_image_from_pil(f_mr), double_sided=True)

    mesh_bark = MeshBuilder(mat_bark)
    mesh_leaves = MeshBuilder(mat_leaves)

    trunk_profile = [
        (0.0, 0.75, 0.0),
        (2.0, 0.55, 0.2),
        (5.5, 0.45, 0.5),
        (8.5, 0.38, 0.8),
        (10.5, 0.25, 1.0)
    ]
    mesh_bark.add_lathed_profile([0, 0, 0], trunk_profile, 12)

    crowns = [
        (0.0, 10.5, 0.0, 2.4, 2.2),
        (0.0, 12.0, 0.0, 1.8, 2.0),
        (-0.8, 11.2, 0.6, 1.5, 1.6),
        (0.7, 11.4, -0.7, 1.6, 1.7),
    ]
    for cx, cy, cz, crad, ch in crowns:
        mesh_leaves.add_cylinder([cx, cy, cz], crad, crad*0.6, ch, 10)

    prims = [builder.add_mesh_primitive(mesh_bark), builder.add_mesh_primitive(mesh_leaves)]
    builder.meshes.append({"name": "Mesh_SalTree", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_SalTree", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "sal_tree.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Asset Generator] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 6: Basalt Boulder
# ---------------------------------------------------------

def generate_basalt_boulder(output_dir):
    builder = GLBBuilder("BasaltBoulder")
    r_albedo, r_normal, r_mr = create_rock_textures()
    mat_rock = builder.add_pbr_material("Mat_BasaltRock", builder.add_image_from_pil(r_albedo), builder.add_image_from_pil(r_normal), builder.add_image_from_pil(r_mr))

    mesh_rock = MeshBuilder(mat_rock)

    rock_profile = [
        (0.0, 1.8, 0.0),
        (0.6, 2.3, 0.3),
        (1.4, 2.1, 0.6),
        (2.1, 1.4, 0.85),
        (2.4, 0.5, 1.0),
    ]
    mesh_rock.add_lathed_profile([0, 0, 0], rock_profile, 9)

    prims = [builder.add_mesh_primitive(mesh_rock)]
    builder.meshes.append({"name": "Mesh_BasaltBoulder", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_BasaltBoulder", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "basalt_boulder.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Asset Generator] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 7: Stone Deepastambha (Vedic Oil Lantern Pillar)
# ---------------------------------------------------------

def generate_stone_lantern(output_dir):
    builder = GLBBuilder("StoneLantern")
    t_albedo, t_normal, t_mr = create_basalt_textures()
    g_albedo, g_normal, g_mr, g_emiss = create_temple_gold_textures()

    mat_stone = builder.add_pbr_material("Mat_LanternStone", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))
    mat_flame = builder.add_pbr_material("Mat_LanternFlame", builder.add_image_from_pil(g_albedo), builder.add_image_from_pil(g_normal), builder.add_image_from_pil(g_mr), builder.add_image_from_pil(g_emiss))

    mesh_stone = MeshBuilder(mat_stone)
    mesh_flame = MeshBuilder(mat_flame)

    mesh_stone.add_cylinder([0, 0.15, 0], 0.45, 0.45, 0.3, 8)
    mesh_stone.add_cylinder([0, 0.35, 0], 0.36, 0.36, 0.2, 8)
    mesh_stone.add_cylinder([0, 1.4, 0], 0.20, 0.16, 2.0, 12)

    mesh_stone.add_box([0, 2.5, 0], [0.55, 0.1, 0.55], (1.0, 1.0))
    for cx in [-0.22, 0.22]:
        for cz in [-0.22, 0.22]:
            mesh_stone.add_box([cx, 2.8, cz], [0.08, 0.55, 0.08], (1.0, 1.0))
    mesh_stone.add_box([0, 3.1, 0], [0.65, 0.12, 0.65], (1.0, 1.0))

    mesh_stone.add_cylinder([0, 3.25, 0], 0.32, 0.12, 0.3, 8)
    mesh_stone.add_cylinder([0, 3.45, 0], 0.12, 0.02, 0.2, 8)
    mesh_flame.add_cylinder([0, 2.75, 0], 0.08, 0.01, 0.22, 8)

    prims = [builder.add_mesh_primitive(mesh_stone), builder.add_mesh_primitive(mesh_flame)]
    builder.meshes.append({"name": "Mesh_StoneLantern", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_StoneLantern", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "stone_lantern.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Asset Generator] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 8: Ruined Watchtower (Ancient Asura Fortress Bastion)
# ---------------------------------------------------------

def generate_ruined_watchtower(output_dir):
    builder = GLBBuilder("RuinedWatchtower")
    t_albedo, t_normal, t_mr = create_basalt_textures()
    mat_stone = builder.add_pbr_material("Mat_RuinedMasonry", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))

    mesh_stone = MeshBuilder(mat_stone)

    tower_profile = [
        (0.0, 3.8, 0.0),
        (1.5, 3.5, 0.2),
        (5.0, 3.3, 0.6),
        (8.0, 3.4, 0.9),
        (8.5, 3.6, 1.0),
    ]
    mesh_stone.add_lathed_profile([0, 0, 0], tower_profile, 8)

    mesh_stone.add_cylinder([0, 8.8, 0], 3.6, 3.6, 0.6, 8, cap_top=False, cap_bottom=False)
    for i in range(8):
        ang = (i / 8) * 2.0 * math.pi
        mx = math.cos(ang) * 3.4
        mz = math.sin(ang) * 3.4
        mesh_stone.add_box([mx, 9.4, mz], [1.2, 0.7, 0.45], (1.0, 1.0))

    for step in range(12):
        frac = step / 12
        ang = frac * math.pi * 1.4 - 0.2
        sx = math.cos(ang) * 3.8
        sz = math.sin(ang) * 3.8
        sy = 0.5 + step * 0.65
        mesh_stone.add_box([sx, sy, sz], [1.4, 0.25, 0.8], (1.0, 1.0))

    mesh_stone.add_box([0, 2.0, 3.5], [1.8, 3.2, 0.8], (1.0, 2.0))

    prims = [builder.add_mesh_primitive(mesh_stone)]
    builder.meshes.append({"name": "Mesh_RuinedWatchtower", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_RuinedWatchtower", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "ruined_watchtower.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Asset Generator] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 9: Water Ghat Stairs (Stepped Ghat Module for Kalyani)
# ---------------------------------------------------------

def generate_water_ghat_stairs(output_dir):
    builder = GLBBuilder("WaterGhatStairs")
    t_albedo, t_normal, t_mr = create_sandstone_textures()
    mat_stone = builder.add_pbr_material("Mat_GhatStone", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))

    mesh_stone = MeshBuilder(mat_stone)

    w = 6.0
    for s in range(6):
        sy = 0.15 + s * 0.3
        sz = s * 0.6
        mesh_stone.add_box([0, sy, sz], [w, 0.3, 0.6], (3.0, 1.0))

    mesh_stone.add_box([-w*0.5 - 0.2, 1.1, 1.5], [0.4, 2.0, 4.0], (1.0, 2.0))
    mesh_stone.add_box([w*0.5 + 0.2, 1.1, 1.5], [0.4, 2.0, 4.0], (1.0, 2.0))

    prims = [builder.add_mesh_primitive(mesh_stone)]
    builder.meshes.append({"name": "Mesh_WaterGhatStairs", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_WaterGhatStairs", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "water_ghat_stairs.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Asset Generator] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 10: Lotus Pedestal (Sacred Peetham Dais)
# ---------------------------------------------------------

def generate_lotus_pedestal(output_dir):
    builder = GLBBuilder("LotusPedestal")
    t_albedo, t_normal, t_mr = create_sandstone_textures()
    g_albedo, g_normal, g_mr, g_emiss = create_temple_gold_textures()

    mat_stone = builder.add_pbr_material("Mat_LotusStone", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))
    mat_gold = builder.add_pbr_material("Mat_SuryaDisc", builder.add_image_from_pil(g_albedo), builder.add_image_from_pil(g_normal), builder.add_image_from_pil(g_mr), builder.add_image_from_pil(g_emiss))

    mesh_stone = MeshBuilder(mat_stone)
    mesh_gold = MeshBuilder(mat_gold)

    mesh_stone.add_cylinder([0, 0.2, 0], 1.6, 1.6, 0.4, 8)
    mesh_stone.add_cylinder([0, 0.5, 0], 1.4, 1.4, 0.2, 8)

    lotus_profile = [
        (0.0, 1.4, 0.0),
        (0.2, 1.7, 0.3),
        (0.4, 1.8, 0.6),
        (0.6, 1.5, 0.9),
        (0.7, 1.4, 1.0)
    ]
    mesh_stone.add_lathed_profile([0, 0.6, 0], lotus_profile, 16)
    mesh_gold.add_cylinder([0, 1.32, 0], 1.25, 1.25, 0.05, 16)

    prims = [builder.add_mesh_primitive(mesh_stone), builder.add_mesh_primitive(mesh_gold)]
    builder.meshes.append({"name": "Mesh_LotusPedestal", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_LotusPedestal", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "lotus_pedestal.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Asset Generator] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Main Generator Orchestrator
# ---------------------------------------------------------

def main():
    output_dir = "godot/assets/environment"
    os.makedirs(output_dir, exist_ok=True)
    print("=== Generating Mythos Stage D 3D Environment Assets ===")
    generate_temple_shikhara(output_dir)
    generate_temple_torana(output_dir)
    generate_temple_column(output_dir)
    generate_banyan_tree(output_dir)
    generate_sal_tree(output_dir)
    generate_basalt_boulder(output_dir)
    generate_stone_lantern(output_dir)
    generate_ruined_watchtower(output_dir)
    generate_water_ghat_stairs(output_dir)
    generate_lotus_pedestal(output_dir)
    print("=== All 10 Environment Assets Successfully Generated! ===")

if __name__ == "__main__":
    main()
