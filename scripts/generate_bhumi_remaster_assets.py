"""
Mythos 3D - Bhumi Environment & Architecture Remaster Pipeline
Stage Q3: Production-Grade 3D Environment, Sanctum Architecture & Landscape Remaster

Generates high-definition, game-ready authentic Vedic/Hoysala 3D glTF/GLB models:
1. temple_shikhara.glb - 14.8m multi-tiered Hoysala Vimana with Garbhagriha, Mandapa portico, walkable stairs, Amalaka, and Golden Kalasha.
2. temple_torana.glb - Sanchi-style monumental ceremonial gateway with curved Makara architraves and Dharmachakra crest.
3. temple_column.glb - Authentic Hoysala lathe-turned pillar with molded base, bell fluting, and 4-way bracket capital.
4. water_ghat_stairs.glb - Stepped stone bathing ghat with 8 walkable steps, balustrades, and octagonal corner Chhatri pavilions.
5. stone_lantern.glb - Multi-tier Deepastambha carved stone lamp pillar with radiating diya dishes and emissive flame cage.
6. ruined_watchtower.glb - Cyclopean stone bastion with winding exterior staircase, battlements, and observation deck.
7. lotus_pedestal.glb - Sacred double-lotus stone peetham with radiating golden Surya sunburst disc.
8. banyan_tree.glb - Monumental Vata-Vriksha banyan with massive trunk, 8 aerial prop roots, and lush layered canopy.
9. sal_tree.glb - Majestic columnar Shorea Sal tree with fissured bark and tropical foliage domes.
10. champaka_tree.glb - Sacred flowering grove tree with delicate branches and golden blossoms.
11. basalt_boulder.glb - Fractured volcanic basalt boulder with sharp crystalline planes and mossy cap.
12. rock_outcrop.glb - Stratified granite/sandstone cliff rock formation.
13. flowering_shrub.glb - Lush undergrowth bush with green foliage and bright sacred marigold blossoms.
"""

import os
import math
import struct
import json
import io
import numpy as np
from PIL import Image, ImageDraw

# ---------------------------------------------------------
# Texture Generation (High-Definition PBR Textures)
# ---------------------------------------------------------

def create_basalt_pbr_textures():
    size = (512, 512)
    # Albedo: Dark ancient volcanic basalt with carved stone block courses
    albedo = Image.new("RGBA", size, (42, 44, 48, 255))
    draw = ImageDraw.Draw(albedo)
    
    # Detailed masonry courses
    for y in range(0, size[1], 48):
        draw.line([(0, y), (size[0], y)], fill=(22, 24, 26, 255), width=2)
    for row in range(0, size[1], 48):
        offset = 48 if (row // 48) % 2 == 1 else 0
        for x in range(offset, size[0], 96):
            draw.line([(x, row), (x, row + 48)], fill=(22, 24, 26, 255), width=2)
            
    # Surface micro-noise
    for y in range(0, size[1], 8):
        for x in range(0, size[0], 8):
            var = int(math.sin(x * 0.3) * math.cos(y * 0.4) * 8)
            draw.point((x, y), fill=(42 + var, 44 + var, 48 + var, 255))

    # Carved Hoysala decorative frieze band in center
    cy = 256
    draw.rectangle([0, cy - 24, size[0], cy + 24], fill=(54, 56, 62, 255))
    draw.line([(0, cy - 24), (size[0], cy - 24)], fill=(160, 135, 60, 200), width=2)
    draw.line([(0, cy + 24), (size[0], cy + 24)], fill=(160, 135, 60, 200), width=2)
    for x in range(16, size[0], 48):
        draw.ellipse([x - 14, cy - 14, x + 14, cy + 14], outline=(190, 160, 70, 240), width=2)
        draw.ellipse([x - 5, cy - 5, x + 5, cy + 5], fill=(220, 185, 80, 255))
        # 8-ray sunburst
        for a in range(8):
            ang = a * (math.pi / 4.0)
            rx = int(x + math.cos(ang) * 18)
            ry = int(cy + math.sin(ang) * 18)
            draw.line([(x, cy), (rx, ry)], fill=(190, 160, 70, 200), width=1)

    # Normal map with bevels
    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    ndraw = ImageDraw.Draw(normal)
    for y in range(0, size[1], 48):
        ndraw.line([(0, y - 1), (size[0], y - 1)], fill=(128, 180, 255, 255), width=2)
        ndraw.line([(0, y + 1), (size[0], y + 1)], fill=(128, 76, 255, 255), width=2)
    for row in range(0, size[1], 48):
        offset = 48 if (row // 48) % 2 == 1 else 0
        for x in range(offset, size[0], 96):
            ndraw.line([(x - 1, row), (x - 1, row + 48)], fill=(180, 128, 255, 255), width=2)
            ndraw.line([(x + 1, row), (x + 1, row + 48)], fill=(76, 128, 255, 255), width=2)

    # Metallic / Roughness (G = Roughness 0.82, B = Metallic 0.04)
    mr = Image.new("RGBA", size, (0, int(255 * 0.82), int(255 * 0.04), 255))
    return albedo, normal, mr

def create_sandstone_pbr_textures():
    size = (512, 512)
    # Warm golden Chunar sandstone with carved lotus reliefs
    albedo = Image.new("RGBA", size, (190, 150, 98, 255))
    draw = ImageDraw.Draw(albedo)
    for y in range(size[1]):
        factor = math.sin(y * 0.12) * 10
        r = int(min(255, max(0, 190 + factor)))
        g = int(min(255, max(0, 150 + factor * 0.8)))
        b = int(min(255, max(0, 98 + factor * 0.6)))
        draw.line([(0, y), (size[0], y)], fill=(r, g, b, 255))

    # Intricate lotus petal carvings across 4 bands
    for y in [64, 192, 320, 448]:
        draw.rectangle([0, y - 16, size[0], y + 16], fill=(165, 122, 74, 255))
        for x in range(20, size[0], 40):
            draw.polygon([(x, y - 14), (x + 16, y), (x, y + 14), (x - 16, y)], fill=(225, 185, 120, 255))
            draw.line([(x, y - 14), (x, y + 14)], fill=(145, 105, 60, 255), width=1)

    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    ndraw = ImageDraw.Draw(normal)
    for y in [64, 192, 320, 448]:
        ndraw.line([(0, y - 16), (size[0], y - 16)], fill=(128, 175, 255, 255), width=2)
        ndraw.line([(0, y + 16), (size[0], y + 16)], fill=(128, 80, 255, 255), width=2)

    mr = Image.new("RGBA", size, (0, int(255 * 0.76), int(255 * 0.06), 255))
    return albedo, normal, mr

def create_temple_gold_pbr_textures():
    size = (256, 256)
    albedo = Image.new("RGBA", size, (240, 185, 45, 255))
    draw = ImageDraw.Draw(albedo)
    for i in range(16):
        draw.ellipse([128 - i*7, 128 - i*7, 128 + i*7, 128 + i*7], outline=(255, 225, 95, 255), width=2)
    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    mr = Image.new("RGBA", size, (0, int(255 * 0.22), int(255 * 0.94), 255)) # Highly metallic, polished gold
    emissive = Image.new("RGBA", size, (75, 50, 12, 255))
    return albedo, normal, mr, emissive

def create_bark_pbr_textures():
    size = (512, 512)
    albedo = Image.new("RGBA", size, (80, 56, 38, 255))
    draw = ImageDraw.Draw(albedo)
    for x in range(size[0]):
        grain = math.sin(x * 0.25) * 14 + math.sin(x * 0.9) * 7
        r = int(min(255, max(0, 80 + grain)))
        g = int(min(255, max(0, 56 + grain * 0.88)))
        b = int(min(255, max(0, 38 + grain * 0.72)))
        draw.line([(x, 0), (x, size[1])], fill=(r, g, b, 255))
    # Green moss patches
    for y in range(0, size[1], 70):
        draw.ellipse([30, y, 170, y + 55], fill=(62, 90, 42, 190))
        draw.ellipse([280, y + 35, 430, y + 85], fill=(52, 78, 35, 190))

    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    ndraw = ImageDraw.Draw(normal)
    for x in range(0, size[0], 24):
        ndraw.line([(x, 0), (x, size[1])], fill=(160, 128, 255, 255), width=1)
    mr = Image.new("RGBA", size, (0, int(255 * 0.92), int(255 * 0.02), 255))
    return albedo, normal, mr

def create_foliage_pbr_textures():
    size = (256, 256)
    albedo = Image.new("RGBA", size, (35, 88, 32, 255))
    draw = ImageDraw.Draw(albedo)
    for y in range(0, size[1], 20):
        for x in range(0, size[0], 20):
            # Clustered leaf shapes with vein accents
            draw.polygon([(x + 10, y), (x + 19, y + 9), (x + 10, y + 18), (x + 1, y + 9)], fill=(52, 125, 44, 255))
            draw.line([(x + 10, y), (x + 10, y + 18)], fill=(26, 65, 22, 255), width=1)
    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    mr = Image.new("RGBA", size, (0, int(255 * 0.60), int(255 * 0.0), 255))
    return albedo, normal, mr

def create_champaka_flower_textures():
    size = (256, 256)
    # Bright green leaves with golden champa blossoms
    albedo = Image.new("RGBA", size, (40, 95, 36, 255))
    draw = ImageDraw.Draw(albedo)
    for y in range(0, size[1], 24):
        for x in range(0, size[0], 24):
            # Green leaves
            draw.polygon([(x + 12, y), (x + 22, y + 10), (x + 12, y + 20), (x + 2, y + 10)], fill=(56, 130, 48, 255))
    # Golden Champa flowers scattered
    for fy in range(12, size[1], 48):
        for fx in range(12, size[0], 48):
            for a in range(6):
                ang = a * (math.pi / 3.0)
                px = fx + math.cos(ang) * 9
                py = fy + math.sin(ang) * 9
                draw.polygon([(fx, fy), (px - 2, py - 2), (px + 2, py + 2)], fill=(245, 205, 55, 255))
            draw.ellipse([fx - 3, fy - 3, fx + 3, fy + 3], fill=(255, 140, 20, 255))
    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    mr = Image.new("RGBA", size, (0, int(255 * 0.55), int(255 * 0.0), 255))
    return albedo, normal, mr

def create_rock_pbr_textures():
    size = (512, 512)
    albedo = Image.new("RGBA", size, (68, 70, 74, 255))
    draw = ImageDraw.Draw(albedo)
    # Angular strata fissures
    for y in range(0, size[1], 32):
        draw.line([(0, y), (size[0], y + 12)], fill=(44, 46, 50, 255), width=2)
    # Moss top gradient
    for y in range(int(size[1] * 0.38)):
        factor = 1.0 - (y / (size[1] * 0.38))
        r = int(68 * (1 - factor) + 52 * factor)
        g = int(70 * (1 - factor) + 98 * factor)
        b = int(74 * (1 - factor) + 36 * factor)
        draw.line([(0, y), (size[0], y)], fill=(r, g, b, 255))

    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    ndraw = ImageDraw.Draw(normal)
    for y in range(0, size[1], 32):
        ndraw.line([(0, y - 1), (size[0], y + 11)], fill=(128, 175, 255, 255), width=2)
        ndraw.line([(0, y + 1), (size[0], y + 13)], fill=(128, 80, 255, 255), width=2)
    mr = Image.new("RGBA", size, (0, int(255 * 0.88), int(255 * 0.04), 255))
    return albedo, normal, mr

# ---------------------------------------------------------
# Modular GLB Builder Engine
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
            ([cx-sx, cy-sy, cz+sz], [cx+sx, cy-sy, cz+sz], [cx+sx, cy+sy, cz+sz], [cx-sx, cy+sy, cz+sz], [0, 0, 1]),
            ([cx+sx, cy-sy, cz-sz], [cx-sx, cy-sy, cz-sz], [cx-sx, cy+sy, cz-sz], [cx+sx, cy+sy, cz-sz], [0, 0, -1]),
            ([cx-sx, cy+sy, cz+sz], [cx+sx, cy+sy, cz+sz], [cx+sx, cy+sy, cz-sz], [cx-sx, cy+sy, cz-sz], [0, 1, 0]),
            ([cx-sx, cy-sy, cz-sz], [cx+sx, cy-sy, cz-sz], [cx+sx, cy-sy, cz+sz], [cx-sx, cy-sy, cz+sz], [0, -1, 0]),
            ([cx+sx, cy-sy, cz+sz], [cx+sx, cy-sy, cz-sz], [cx+sx, cy+sy, cz-sz], [cx+sx, cy+sy, cz+sz], [1, 0, 0]),
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
# Asset 1: Temple Shikhara (Sanctum Vimana Spire with Mandapa & Stairs)
# ---------------------------------------------------------

def generate_temple_shikhara(output_dir):
    builder = GLBBuilder("TempleShikhara")
    t_albedo, t_normal, t_mr = create_basalt_pbr_textures()
    s_albedo, s_normal, s_mr = create_sandstone_pbr_textures()
    g_albedo, g_normal, g_mr, g_emiss = create_temple_gold_pbr_textures()

    mat_stone = builder.add_pbr_material("Mat_BasaltStone", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))
    mat_sandstone = builder.add_pbr_material("Mat_SandstoneTrim", builder.add_image_from_pil(s_albedo), builder.add_image_from_pil(s_normal), builder.add_image_from_pil(s_mr))
    mat_gold = builder.add_pbr_material("Mat_TempleGold", builder.add_image_from_pil(g_albedo), builder.add_image_from_pil(g_normal), builder.add_image_from_pil(g_mr), builder.add_image_from_pil(g_emiss))

    mesh_stone = MeshBuilder(mat_stone)
    mesh_sand = MeshBuilder(mat_sandstone)
    mesh_gold = MeshBuilder(mat_gold)

    # 1. Base Adhisthana Plinth (Multi-tiered Molded Base)
    # Rises from y = 0.0 to y = 1.4
    mesh_stone.add_box([0, 0.25, 0], [10.4, 0.5, 10.4], (4.5, 1.0))
    mesh_sand.add_box([0, 0.60, 0], [9.8, 0.2, 9.8], (4.2, 0.5))
    mesh_stone.add_box([0, 0.85, 0], [9.2, 0.3, 9.2], (4.0, 1.0))
    mesh_sand.add_box([0, 1.15, 0], [8.6, 0.3, 8.6], (3.8, 0.5))
    mesh_stone.add_box([0, 1.35, 0], [8.2, 0.1, 8.2], (3.6, 0.5))

    # Walkable Entrance Stairs (Sopana) descending south from y = 1.4 to y = 0.0
    stair_w = 3.6
    n_steps = 7
    for s in range(n_steps):
        step_y = 0.1 + s * 0.2
        step_z = 5.2 + (n_steps - 1 - s) * 0.45
        mesh_sand.add_box([0, step_y, step_z], [stair_w, 0.2, 0.45], (2.0, 0.5))
    # Ornate stair balustrades with elephant trunk scrolls
    for bx in [-stair_w*0.5 - 0.2, stair_w*0.5 + 0.2]:
        mesh_stone.add_box([bx, 0.8, 6.4], [0.4, 1.2, 3.2], (1.0, 2.0))
        mesh_sand.add_cylinder([bx, 1.45, 4.8], 0.25, 0.18, 0.4, 10)
        mesh_sand.add_cylinder([bx, 0.5, 7.8], 0.30, 0.22, 0.6, 10)

    # 2. Garbhagriha Inner Sanctum (Sanctum Sanctorum)
    wall_h = 4.4
    wall_y = 1.4 + wall_h * 0.5
    # Thick masonry walls forming the inner chamber:
    mesh_stone.add_box([-3.8, wall_y, 0], [1.2, wall_h, 7.6], (1.0, 4.0)) # West wall
    mesh_stone.add_box([3.8, wall_y, 0], [1.2, wall_h, 7.6], (1.0, 4.0))  # East wall
    mesh_stone.add_box([0, wall_y, -3.8], [8.8, wall_h, 1.2], (4.0, 4.0)) # North wall
    # South wall with Dvarasakhapitham entrance portal
    mesh_stone.add_box([-2.8, wall_y, 3.8], [2.2, wall_h, 1.2], (1.0, 4.0)) # South Left
    mesh_stone.add_box([2.8, wall_y, 3.8], [2.2, wall_h, 1.2], (1.0, 4.0))  # South Right
    # Ornate Carved Doorframe & Lintel (Torana over entrance)
    mesh_sand.add_box([-1.6, wall_y - 0.4, 4.1], [0.35, wall_h - 0.8, 0.4], (0.5, 3.0))
    mesh_sand.add_box([1.6, wall_y - 0.4, 4.1], [0.35, wall_h - 0.8, 0.4], (0.5, 3.0))
    mesh_sand.add_box([0, 5.0, 4.1], [3.8, 0.8, 0.5], (3.0, 0.8)) # Lintel
    mesh_gold.add_cylinder([0, 5.5, 4.2], 0.4, 0.4, 0.1, 12) # Kirtimukha solar crest

    # Sanctum Floor Flagstones
    mesh_sand.add_box([0, 1.42, 0], [6.4, 0.04, 6.4], (3.0, 3.0))

    # 3. Mandapa Front Portico (Outer Pillared Hall)
    for col_x in [-2.4, 2.4]:
        for col_z in [5.4, 7.8]:
            # Pillars
            mesh_sand.add_cylinder([col_x, 1.4 + 2.0, col_z], 0.28, 0.24, 4.0, 14)
            # Bracket capital
            mesh_sand.add_box([col_x, 1.4 + 4.1, col_z], [0.8, 0.25, 0.8], (1.0, 1.0))
            mesh_gold.add_cylinder([col_x, 1.4 + 3.2, col_z], 0.32, 0.32, 0.08, 12)
    # Mandapa Tiered Stone Beams and Flat Lotus Ceiling
    mesh_stone.add_box([0, 5.8, 6.6], [6.6, 0.5, 4.8], (3.0, 2.0))
    mesh_sand.add_box([0, 6.25, 6.6], [5.6, 0.4, 3.8], (2.5, 1.5))
    mesh_sand.add_box([0, 6.6, 6.6], [4.4, 0.3, 2.8], (2.0, 1.0))

    # 4. Multi-Tiered Dravidian Vimana Spire (7 Talas)
    vimana_tiers = [
        (6.0, 7.8, 0.9),
        (6.9, 7.0, 0.9),
        (7.8, 6.1, 0.9),
        (8.7, 5.2, 0.9),
        (9.6, 4.3, 0.9),
        (10.5, 3.4, 0.8),
        (11.3, 2.5, 0.8),
        (12.1, 1.8, 0.7),
    ]
    for ty, size_sq, th in vimana_tiers:
        mesh_stone.add_box([0, ty + th*0.5, 0], [size_sq, th, size_sq], (size_sq * 0.5, 1.0))
        # Carved cornice (kapota) overhang
        mesh_sand.add_box([0, ty + th, 0], [size_sq + 0.35, 0.16, size_sq + 0.35], (2.5, 0.5))
        # Miniature pavilion kutas at 4 corners
        kuta_offset = size_sq * 0.5 - 0.2
        for kx in [-kuta_offset, kuta_offset]:
            for kz in [-kuta_offset, kuta_offset]:
                mesh_sand.add_box([kx, ty + th*0.6, kz], [0.45, 0.45, 0.45], (0.5, 0.5))

    # 5. Griva (Spire Neck) & Amalaka (Ribbed Stone Crown)
    mesh_sand.add_cylinder([0, 13.0, 0], 1.2, 1.2, 0.4, 18)
    amalaka_profile = [
        (0.0, 1.2, 0.0),
        (0.2, 2.2, 0.3),
        (0.4, 2.4, 0.5),
        (0.6, 2.1, 0.7),
        (0.8, 1.4, 1.0)
    ]
    mesh_stone.add_lathed_profile([0, 13.2, 0], amalaka_profile, 18)

    # 6. Golden Kalasha Finial & Surya Sunburst Crest
    kalasha_profile = [
        (0.0, 0.65, 0.0),
        (0.3, 1.15, 0.25),
        (0.6, 1.25, 0.5),
        (0.9, 0.65, 0.75),
        (1.2, 0.75, 0.9),
        (1.6, 0.12, 1.0)
    ]
    mesh_gold.add_lathed_profile([0, 14.0, 0], kalasha_profile, 18)
    mesh_gold.add_cylinder([0, 15.8, 0], 0.09, 0.03, 0.9, 8)
    # Radiating golden lotus bud finial
    mesh_gold.add_cylinder([0, 16.3, 0], 0.22, 0.02, 0.3, 8)

    prims = [
        builder.add_mesh_primitive(mesh_stone),
        builder.add_mesh_primitive(mesh_sand),
        builder.add_mesh_primitive(mesh_gold)
    ]
    builder.meshes.append({"name": "Mesh_TempleShikhara", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_TempleShikhara", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "temple_shikhara.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 2: Temple Torana (Ceremonial Gateway)
# ---------------------------------------------------------

def generate_temple_torana(output_dir):
    builder = GLBBuilder("TempleTorana")
    t_albedo, t_normal, t_mr = create_sandstone_pbr_textures()
    g_albedo, g_normal, g_mr, g_emiss = create_temple_gold_pbr_textures()

    mat_stone = builder.add_pbr_material("Mat_Sandstone", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))
    mat_gold = builder.add_pbr_material("Mat_GoldInlay", builder.add_image_from_pil(g_albedo), builder.add_image_from_pil(g_normal), builder.add_image_from_pil(g_mr), builder.add_image_from_pil(g_emiss))

    mesh_stone = MeshBuilder(mat_stone)
    mesh_gold = MeshBuilder(mat_gold)

    pillar_w = 0.72
    pillar_h = 7.4
    for px in [-2.6, 2.6]:
        # Molded base plinth
        mesh_stone.add_box([px, 0.3, 0], [1.4, 0.6, 1.4], (1.0, 1.0))
        mesh_stone.add_box([px, 0.75, 0], [1.1, 0.3, 1.1], (1.0, 1.0))
        # Main fluted pillar shaft
        mesh_stone.add_box([px, 0.9 + pillar_h*0.5, 0], [pillar_w, pillar_h, pillar_w], (1.0, 4.5))
        # Lion / Elephant bracket capital
        mesh_stone.add_box([px, 0.9 + pillar_h + 0.4, 0], [1.25, 0.8, 1.25], (1.0, 1.0))
        mesh_gold.add_cylinder([px, 0.9 + pillar_h + 0.4, 0.65], 0.22, 0.22, 0.08, 10)

    # 3 Curved Architraves with Makara Spouts
    beam_w = 8.2
    beam_h = 0.5
    beam_d = 0.5
    beam_heights = [5.6, 6.6, 7.6]

    for bh in beam_heights:
        mesh_stone.add_box([0, bh, 0], [beam_w, beam_h, beam_d], (4.5, 1.0))
        # Curled Makara terminal ends
        for sx in [-beam_w*0.5 - 0.3, beam_w*0.5 + 0.3]:
            mesh_stone.add_cylinder([sx, bh, 0], 0.38, 0.38, 0.55, 14)
            mesh_gold.add_cylinder([sx, bh, 0.3], 0.16, 0.16, 0.05, 10)

    # Balusters between architraves
    for b_idx in range(2):
        y_mid = (beam_heights[b_idx] + beam_heights[b_idx+1]) * 0.5
        for sx in [-1.8, -0.6, 0.6, 1.8]:
            mesh_stone.add_box([sx, y_mid, 0], [0.38, 0.45, 0.42], (1.0, 1.0))
            mesh_gold.add_cylinder([sx, y_mid, 0.24], 0.14, 0.14, 0.04, 10)

    # Dharmachakra Finial
    mesh_gold.add_cylinder([0, 8.4, 0], 0.72, 0.72, 0.14, 18)
    mesh_gold.add_cylinder([0, 9.2, 0], 0.09, 0.03, 0.7, 8)

    prims = [builder.add_mesh_primitive(mesh_stone), builder.add_mesh_primitive(mesh_gold)]
    builder.meshes.append({"name": "Mesh_TempleTorana", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_TempleTorana", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "temple_torana.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 3: Hoysala Temple Column (Lathe-Turned Pillar)
# ---------------------------------------------------------

def generate_temple_column(output_dir):
    builder = GLBBuilder("TempleColumn")
    t_albedo, t_normal, t_mr = create_basalt_pbr_textures()
    g_albedo, g_normal, g_mr, _ = create_temple_gold_pbr_textures()

    mat_stone = builder.add_pbr_material("Mat_BasaltPillar", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))
    mat_gold = builder.add_pbr_material("Mat_GoldRing", builder.add_image_from_pil(g_albedo), builder.add_image_from_pil(g_normal), builder.add_image_from_pil(g_mr))

    mesh_stone = MeshBuilder(mat_stone)
    mesh_gold = MeshBuilder(mat_gold)

    # Molded square base
    mesh_stone.add_box([0, 0.25, 0], [0.95, 0.5, 0.95], (1.0, 1.0))
    mesh_stone.add_box([0, 0.60, 0], [0.75, 0.2, 0.75], (1.0, 1.0))
    mesh_stone.add_cylinder([0, 0.85, 0], 0.36, 0.32, 0.3, 12)

    # 16-faceted lathe-turned bell shaft
    pillar_profile = [
        (0.0, 0.30, 0.0),
        (0.5, 0.28, 0.15),
        (0.9, 0.36, 0.3),
        (1.3, 0.28, 0.45),
        (1.8, 0.30, 0.65),
        (2.2, 0.35, 0.75),
        (2.5, 0.28, 0.85),
        (2.9, 0.28, 1.0),
    ]
    mesh_stone.add_lathed_profile([0, 1.0, 0], pillar_profile, 16)
    mesh_gold.add_cylinder([0, 3.1, 0], 0.35, 0.35, 0.1, 16)

    # Pot-and-foliage capital (Kumbha) & 4-way pushpotika bracket arms
    mesh_stone.add_cylinder([0, 3.6, 0], 0.28, 0.48, 0.45, 16)
    mesh_stone.add_box([0, 3.95, 0], [1.05, 0.25, 1.05], (1.0, 1.0))
    mesh_stone.add_box([0, 4.2, 0], [1.25, 0.3, 0.55], (1.0, 1.0))
    mesh_stone.add_box([0, 4.2, 0], [0.55, 0.3, 1.25], (1.0, 1.0))

    prims = [builder.add_mesh_primitive(mesh_stone), builder.add_mesh_primitive(mesh_gold)]
    builder.meshes.append({"name": "Mesh_TempleColumn", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_TempleColumn", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "temple_column.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 4: Water Ghat Stairs (Stepped Bathing Ghat for Kalyani)
# ---------------------------------------------------------

def generate_water_ghat_stairs(output_dir):
    builder = GLBBuilder("WaterGhatStairs")
    t_albedo, t_normal, t_mr = create_sandstone_pbr_textures()
    g_albedo, g_normal, g_mr, _ = create_temple_gold_pbr_textures()

    mat_stone = builder.add_pbr_material("Mat_GhatStone", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))
    mat_gold = builder.add_pbr_material("Mat_ChhatriFinial", builder.add_image_from_pil(g_albedo), builder.add_image_from_pil(g_normal), builder.add_image_from_pil(g_mr))

    mesh_stone = MeshBuilder(mat_stone)
    mesh_gold = MeshBuilder(mat_gold)

    w = 7.2
    n_steps = 8
    # 8 Walkable Steps (0.2m rise, 0.5m tread)
    for s in range(n_steps):
        sy = 0.1 + s * 0.2
        sz = s * 0.5
        mesh_stone.add_box([0, sy, sz], [w, 0.2, 0.5], (3.5, 0.8))

    # Flanking balustrades with elephant trunk curves
    for bx in [-w*0.5 - 0.25, w*0.5 + 0.25]:
        mesh_stone.add_box([bx, 0.9, 1.8], [0.45, 1.8, 4.2], (1.0, 2.5))

    # Corner Chhatri Pavilions (Miniature Pillared Kiosks with Domes)
    for cx in [-w*0.5 - 1.2, w*0.5 + 1.2]:
        cz = 3.6
        # Platform
        mesh_stone.add_box([cx, 0.9, cz], [1.8, 1.8, 1.8], (1.0, 1.0))
        # 4 slender pillars
        for dx in [-0.6, 0.6]:
            for dz in [-0.6, 0.6]:
                mesh_stone.add_cylinder([cx + dx, 2.4, cz + dz], 0.12, 0.12, 1.2, 8)
        # Chhatri Domed Canopy
        mesh_stone.add_box([cx, 3.1, cz], [1.6, 0.2, 1.6], (1.0, 1.0))
        dome_profile = [
            (0.0, 0.75, 0.0),
            (0.3, 0.72, 0.3),
            (0.6, 0.55, 0.6),
            (0.8, 0.25, 0.9),
            (1.0, 0.05, 1.0)
        ]
        mesh_stone.add_lathed_profile([cx, 3.2, cz], dome_profile, 14)
        mesh_gold.add_cylinder([cx, 4.35, cz], 0.06, 0.02, 0.4, 8)

    prims = [builder.add_mesh_primitive(mesh_stone), builder.add_mesh_primitive(mesh_gold)]
    builder.meshes.append({"name": "Mesh_WaterGhatStairs", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_WaterGhatStairs", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "water_ghat_stairs.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 5: Stone Deepastambha (Multi-Tiered Oil Lantern Pillar)
# ---------------------------------------------------------

def generate_stone_lantern(output_dir):
    builder = GLBBuilder("StoneLantern")
    t_albedo, t_normal, t_mr = create_basalt_pbr_textures()
    g_albedo, g_normal, g_mr, g_emiss = create_temple_gold_pbr_textures()

    mat_stone = builder.add_pbr_material("Mat_LanternStone", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))
    mat_flame = builder.add_pbr_material("Mat_LanternFlame", builder.add_image_from_pil(g_albedo), builder.add_image_from_pil(g_normal), builder.add_image_from_pil(g_mr), builder.add_image_from_pil(g_emiss))

    mesh_stone = MeshBuilder(mat_stone)
    mesh_flame = MeshBuilder(mat_flame)

    # Stepped Base
    mesh_stone.add_cylinder([0, 0.2, 0], 0.55, 0.55, 0.4, 12)
    mesh_stone.add_cylinder([0, 0.45, 0], 0.45, 0.45, 0.2, 12)
    # Tapering Octagonal Shaft
    mesh_stone.add_cylinder([0, 1.6, 0], 0.24, 0.18, 2.2, 12)

    # 4 Tiers of Radiating Carved Oil Dishes (Diyas)
    diya_heights = [1.0, 1.5, 2.0, 2.5]
    for dh in diya_heights:
        rad = 0.35 + (2.5 - dh) * 0.08
        mesh_stone.add_cylinder([0, dh, 0], rad, rad, 0.08, 12)
        for a in range(4):
            ang = a * (math.pi / 2.0)
            dx = math.cos(ang) * (rad + 0.12)
            dz = math.sin(ang) * (rad + 0.12)
            mesh_stone.add_cylinder([dx, dh + 0.04, dz], 0.10, 0.06, 0.08, 8)
            mesh_flame.add_cylinder([dx, dh + 0.12, dz], 0.04, 0.01, 0.12, 6)

    # Lantern Chamber with Carved Jali Lattice
    mesh_stone.add_box([0, 2.8, 0], [0.65, 0.12, 0.65], (1.0, 1.0))
    for cx in [-0.25, 0.25]:
        for cz in [-0.25, 0.25]:
            mesh_stone.add_box([cx, 3.15, cz], [0.09, 0.6, 0.09], (1.0, 1.0))
    mesh_stone.add_box([0, 3.5, 0], [0.75, 0.14, 0.75], (1.0, 1.0))

    # Central Sacred Flame inside the lantern cage
    mesh_flame.add_cylinder([0, 3.15, 0], 0.14, 0.02, 0.35, 8)

    # Pyramidal Spire Finial
    mesh_stone.add_cylinder([0, 3.75, 0], 0.38, 0.15, 0.35, 10)
    mesh_stone.add_cylinder([0, 4.0, 0], 0.15, 0.02, 0.25, 8)

    prims = [builder.add_mesh_primitive(mesh_stone), builder.add_mesh_primitive(mesh_flame)]
    builder.meshes.append({"name": "Mesh_StoneLantern", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_StoneLantern", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "stone_lantern.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 6: Ruined Watchtower (Kalanemi Fortress Bastion)
# ---------------------------------------------------------

def generate_ruined_watchtower(output_dir):
    builder = GLBBuilder("RuinedWatchtower")
    t_albedo, t_normal, t_mr = create_basalt_pbr_textures()
    mat_stone = builder.add_pbr_material("Mat_RuinedMasonry", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))

    mesh_stone = MeshBuilder(mat_stone)

    # Heavy cyclopean masonry base (9.5m tall tower)
    tower_profile = [
        (0.0, 4.2, 0.0),
        (2.0, 3.9, 0.2),
        (5.5, 3.6, 0.6),
        (8.5, 3.7, 0.9),
        (9.2, 4.0, 1.0),
    ]
    mesh_stone.add_lathed_profile([0, 0, 0], tower_profile, 12)

    # Upper Observation Platform Deck (at y = 9.2)
    mesh_stone.add_cylinder([0, 9.2, 0], 3.9, 3.9, 0.4, 12, cap_top=True, cap_bottom=True)

    # Crenellated battlements with arrow slits and damaged ruined sections
    for i in range(12):
        if i in [2, 7]: # Ruined shattered gaps
            continue
        ang = (i / 12.0) * 2.0 * math.pi
        mx = math.cos(ang) * 3.8
        mz = math.sin(ang) * 3.8
        mesh_stone.add_box([mx, 9.9, mz], [1.3, 0.9, 0.5], (1.0, 1.0))

    # Walkable Exterior Cantilevered Spiral Stairs winding from y = 0.5 to y = 9.2
    n_spiral_steps = 18
    for step in range(n_spiral_steps):
        frac = step / float(n_spiral_steps)
        ang = frac * math.pi * 1.6 - 0.4
        dist = 3.9 + (1.0 - frac) * 0.3
        sx = math.cos(ang) * dist
        sz = math.sin(ang) * dist
        sy = 0.5 + step * 0.48
        mesh_stone.add_box([sx, sy, sz], [1.6, 0.25, 0.85], (1.0, 1.0))

    # Arched entrance portal at ground floor
    mesh_stone.add_box([0, 2.2, 3.9], [2.2, 3.6, 0.9], (1.0, 2.0))

    prims = [builder.add_mesh_primitive(mesh_stone)]
    builder.meshes.append({"name": "Mesh_RuinedWatchtower", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_RuinedWatchtower", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "ruined_watchtower.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 7: Lotus Pedestal (Sacred Peetham Dais)
# ---------------------------------------------------------

def generate_lotus_pedestal(output_dir):
    builder = GLBBuilder("LotusPedestal")
    t_albedo, t_normal, t_mr = create_sandstone_pbr_textures()
    g_albedo, g_normal, g_mr, g_emiss = create_temple_gold_pbr_textures()

    mat_stone = builder.add_pbr_material("Mat_LotusStone", builder.add_image_from_pil(t_albedo), builder.add_image_from_pil(t_normal), builder.add_image_from_pil(t_mr))
    mat_gold = builder.add_pbr_material("Mat_SuryaDisc", builder.add_image_from_pil(g_albedo), builder.add_image_from_pil(g_normal), builder.add_image_from_pil(g_mr), builder.add_image_from_pil(g_emiss))

    mesh_stone = MeshBuilder(mat_stone)
    mesh_gold = MeshBuilder(mat_gold)

    # Base steps
    mesh_stone.add_cylinder([0, 0.2, 0], 1.8, 1.8, 0.4, 12)
    mesh_stone.add_cylinder([0, 0.55, 0], 1.55, 1.55, 0.3, 12)

    # 16-Petal Double Lotus Profile
    lotus_profile = [
        (0.0, 1.55, 0.0),
        (0.25, 1.95, 0.3),
        (0.50, 2.05, 0.6),
        (0.75, 1.70, 0.9),
        (0.85, 1.55, 1.0)
    ]
    mesh_stone.add_lathed_profile([0, 0.7, 0], lotus_profile, 18)

    # Golden Surya Sunburst Inlaid Disc
    mesh_gold.add_cylinder([0, 1.58, 0], 1.45, 1.45, 0.06, 18)

    prims = [builder.add_mesh_primitive(mesh_stone), builder.add_mesh_primitive(mesh_gold)]
    builder.meshes.append({"name": "Mesh_LotusPedestal", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_LotusPedestal", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "lotus_pedestal.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 8: Sacred Banyan Tree (Vata-Vriksha with Aerial Prop Roots)
# ---------------------------------------------------------

def generate_banyan_tree(output_dir):
    builder = GLBBuilder("BanyanTree")
    b_albedo, b_normal, b_mr = create_bark_pbr_textures()
    f_albedo, f_normal, f_mr = create_foliage_pbr_textures()

    mat_bark = builder.add_pbr_material("Mat_BanyanBark", builder.add_image_from_pil(b_albedo), builder.add_image_from_pil(b_normal), builder.add_image_from_pil(b_mr))
    mat_leaves = builder.add_pbr_material("Mat_CanopyLeaves", builder.add_image_from_pil(f_albedo), builder.add_image_from_pil(f_normal), builder.add_image_from_pil(f_mr), double_sided=True)

    mesh_bark = MeshBuilder(mat_bark)
    mesh_leaves = MeshBuilder(mat_leaves)

    # Massive central multi-trunk cluster
    trunk_profile = [
        (0.0, 1.8, 0.0),
        (1.2, 1.4, 0.2),
        (3.0, 1.2, 0.5),
        (5.2, 1.1, 0.8),
        (7.0, 1.6, 1.0),
    ]
    mesh_bark.add_lathed_profile([0, 0, 0], trunk_profile, 16)

    # 8 Vertical Aerial Prop Roots descending from canopy branches
    prop_roots = [
        (-2.8, -2.2, 6.8, 0.26),
        (3.1, -1.9, 6.5, 0.28),
        (-2.5, 2.8, 6.6, 0.25),
        (2.7, 2.5, 6.9, 0.27),
        (-4.0, 0.0, 6.0, 0.22),
        (4.2, 0.2, 6.2, 0.24),
        (0.2, -3.8, 6.4, 0.23),
        (-0.3, 3.9, 6.5, 0.22),
    ]
    for rx, rz, top_y, r_rad in prop_roots:
        mesh_bark.add_cylinder([rx, top_y*0.5, rz], r_rad*1.3, r_rad*0.8, top_y, 10)
        # Root buttress at ground level
        mesh_bark.add_cylinder([rx*1.08, 0.25, rz*1.08], r_rad*1.9, r_rad*1.3, 0.5, 10)

    # 6 Heavy Sprawling Lateral Branches
    branches = [
        (-3.8, 7.2, -3.2, 0.55, 5.2),
        (4.0, 7.4, -2.8, 0.52, 5.0),
        (-3.6, 7.3, 3.6, 0.54, 5.1),
        (3.8, 7.5, 3.4, 0.53, 5.3),
        (-4.6, 6.8, 0.0, 0.48, 4.8),
        (4.8, 7.0, 0.0, 0.46, 4.8),
        (0.0, 7.8, 0.0, 0.65, 4.2),
    ]
    for bx, by, bz, brad, blen in branches:
        mesh_bark.add_cylinder([bx*0.6, by, bz*0.6], brad*1.25, brad*0.75, blen, 12)

    # Layered Voluminous Foliage Pads (14 leaf clusters)
    leaf_clusters = [
        (0.0, 9.8, 0.0, 5.2, 2.8),
        (0.0, 11.2, 0.0, 3.8, 2.2),
        (-4.2, 8.8, -3.5, 3.8, 2.4),
        (4.4, 9.0, -3.2, 3.9, 2.5),
        (-3.8, 8.9, 4.0, 3.7, 2.4),
        (4.0, 9.2, 3.8, 4.0, 2.6),
        (-5.5, 7.8, 0.0, 3.0, 2.0),
        (5.5, 8.0, 0.0, 3.1, 2.0),
        (0.0, 8.2, -5.2, 3.2, 2.0),
        (0.0, 8.4, 5.2, 3.2, 2.0),
        (-2.5, 10.4, -2.0, 3.2, 1.8),
        (2.6, 10.6, 2.2, 3.3, 1.9),
    ]
    for lx, ly, lz, lrad, lh in leaf_clusters:
        mesh_leaves.add_cylinder([lx, ly, lz], lrad, lrad*0.7, lh, 14)
        mesh_leaves.add_cylinder([lx, ly + lh*0.4, lz], lrad*0.75, lrad*0.2, lh*0.6, 12)

    prims = [builder.add_mesh_primitive(mesh_bark), builder.add_mesh_primitive(mesh_leaves)]
    builder.meshes.append({"name": "Mesh_BanyanTree", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_BanyanTree", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "banyan_tree.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 9: Sacred Sal Tree (Shorea robusta)
# ---------------------------------------------------------

def generate_sal_tree(output_dir):
    builder = GLBBuilder("SalTree")
    b_albedo, b_normal, b_mr = create_bark_pbr_textures()
    f_albedo, f_normal, f_mr = create_foliage_pbr_textures()

    mat_bark = builder.add_pbr_material("Mat_SalBark", builder.add_image_from_pil(b_albedo), builder.add_image_from_pil(b_normal), builder.add_image_from_pil(b_mr))
    mat_leaves = builder.add_pbr_material("Mat_SalLeaves", builder.add_image_from_pil(f_albedo), builder.add_image_from_pil(f_normal), builder.add_image_from_pil(f_mr), double_sided=True)

    mesh_bark = MeshBuilder(mat_bark)
    mesh_leaves = MeshBuilder(mat_leaves)

    # Tall straight trunk (13.5m tall tree)
    trunk_profile = [
        (0.0, 0.95, 0.0),
        (2.5, 0.70, 0.2),
        (6.5, 0.55, 0.5),
        (10.0, 0.45, 0.8),
        (12.5, 0.30, 1.0)
    ]
    mesh_bark.add_lathed_profile([0, 0, 0], trunk_profile, 14)

    # Tiered tropical forest canopy domes
    crowns = [
        (0.0, 12.5, 0.0, 3.2, 2.6),
        (0.0, 14.2, 0.0, 2.4, 2.2),
        (-1.2, 13.2, 0.8, 2.0, 2.0),
        (1.1, 13.5, -0.9, 2.1, 2.1),
        (0.6, 12.8, 1.2, 1.9, 1.8),
        (-0.7, 12.9, -1.1, 1.9, 1.8),
    ]
    for cx, cy, cz, crad, ch in crowns:
        mesh_leaves.add_cylinder([cx, cy, cz], crad, crad*0.6, ch, 12)
        mesh_leaves.add_cylinder([cx, cy + ch*0.35, cz], crad*0.7, crad*0.15, ch*0.5, 10)

    prims = [builder.add_mesh_primitive(mesh_bark), builder.add_mesh_primitive(mesh_leaves)]
    builder.meshes.append({"name": "Mesh_SalTree", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_SalTree", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "sal_tree.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 10: Champaka Tree (Sacred Flowering Grove Tree)
# ---------------------------------------------------------

def generate_champaka_tree(output_dir):
    builder = GLBBuilder("ChampakaTree")
    b_albedo, b_normal, b_mr = create_bark_pbr_textures()
    f_albedo, f_normal, f_mr = create_champaka_flower_textures()

    mat_bark = builder.add_pbr_material("Mat_ChampakaBark", builder.add_image_from_pil(b_albedo), builder.add_image_from_pil(b_normal), builder.add_image_from_pil(b_mr))
    mat_leaves = builder.add_pbr_material("Mat_ChampakaBlossoms", builder.add_image_from_pil(f_albedo), builder.add_image_from_pil(f_normal), builder.add_image_from_pil(f_mr), double_sided=True)

    mesh_bark = MeshBuilder(mat_bark)
    mesh_leaves = MeshBuilder(mat_leaves)

    # Elegant curved trunk
    trunk_profile = [
        (0.0, 0.65, 0.0),
        (1.5, 0.48, 0.25),
        (3.5, 0.38, 0.55),
        (5.5, 0.28, 0.85),
        (6.8, 0.20, 1.0)
    ]
    mesh_bark.add_lathed_profile([0, 0, 0], trunk_profile, 12)

    # Spreading branches
    branches = [
        (-1.8, 5.2, -1.4, 0.22, 2.8),
        (1.9, 5.4, 1.2, 0.21, 2.7),
        (-1.4, 5.3, 1.5, 0.20, 2.6),
        (1.5, 5.5, -1.6, 0.21, 2.9),
    ]
    for bx, by, bz, brad, blen in branches:
        mesh_bark.add_cylinder([bx*0.6, by, bz*0.6], brad*1.2, brad*0.7, blen, 8)

    # Flowering canopy pads with yellow blossoms
    blossom_pads = [
        (0.0, 7.2, 0.0, 2.8, 1.8),
        (0.0, 8.4, 0.0, 2.0, 1.5),
        (-1.9, 6.8, -1.6, 2.2, 1.6),
        (2.0, 7.0, 1.4, 2.3, 1.6),
        (-1.5, 6.9, 1.8, 2.1, 1.5),
        (1.7, 7.1, -1.8, 2.2, 1.6),
    ]
    for cx, cy, cz, crad, ch in blossom_pads:
        mesh_leaves.add_cylinder([cx, cy, cz], crad, crad*0.6, ch, 12)
        mesh_leaves.add_cylinder([cx, cy + ch*0.35, cz], crad*0.7, crad*0.15, ch*0.5, 10)

    prims = [builder.add_mesh_primitive(mesh_bark), builder.add_mesh_primitive(mesh_leaves)]
    builder.meshes.append({"name": "Mesh_ChampakaTree", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_ChampakaTree", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "champaka_tree.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 11: Basalt Boulder (Fractured Crystalline Rock)
# ---------------------------------------------------------

def generate_basalt_boulder(output_dir):
    builder = GLBBuilder("BasaltBoulder")
    r_albedo, r_normal, r_mr = create_rock_pbr_textures()
    mat_rock = builder.add_pbr_material("Mat_BasaltRock", builder.add_image_from_pil(r_albedo), builder.add_image_from_pil(r_normal), builder.add_image_from_pil(r_mr))

    mesh_rock = MeshBuilder(mat_rock)

    # Faceted crystalline boulder profile
    rock_profile = [
        (0.0, 2.2, 0.0),
        (0.7, 2.7, 0.3),
        (1.6, 2.5, 0.6),
        (2.4, 1.7, 0.85),
        (2.8, 0.6, 1.0),
    ]
    mesh_rock.add_lathed_profile([0, 0, 0], rock_profile, 10)

    # Secondary fracture chips
    for fx, fz, frad in [(-1.5, 1.2, 0.8), (1.6, -1.1, 0.9), (0.4, 1.8, 0.7)]:
        mesh_rock.add_cylinder([fx, 0.4, fz], frad, frad*0.6, 0.8, 7)

    prims = [builder.add_mesh_primitive(mesh_rock)]
    builder.meshes.append({"name": "Mesh_BasaltBoulder", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_BasaltBoulder", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "basalt_boulder.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 12: Rock Outcrop (Layered Granite / Sandstone Crag)
# ---------------------------------------------------------

def generate_rock_outcrop(output_dir):
    builder = GLBBuilder("RockOutcrop")
    r_albedo, r_normal, r_mr = create_rock_pbr_textures()
    mat_rock = builder.add_pbr_material("Mat_OutcropRock", builder.add_image_from_pil(r_albedo), builder.add_image_from_pil(r_normal), builder.add_image_from_pil(r_mr))

    mesh_rock = MeshBuilder(mat_rock)

    # Stepped stratified ledge formation
    mesh_rock.add_box([0, 0.7, 0], [4.8, 1.4, 3.6], (2.0, 1.0))
    mesh_rock.add_box([-0.4, 1.8, -0.2], [3.8, 1.2, 2.8], (1.8, 1.0))
    mesh_rock.add_box([-0.8, 2.8, -0.5], [2.6, 1.0, 2.0], (1.5, 0.8))

    prims = [builder.add_mesh_primitive(mesh_rock)]
    builder.meshes.append({"name": "Mesh_RockOutcrop", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_RockOutcrop", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "rock_outcrop.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Asset 13: Flowering Shrub (Temple Marigold Bush)
# ---------------------------------------------------------

def generate_flowering_shrub(output_dir):
    builder = GLBBuilder("FloweringShrub")
    f_albedo, f_normal, f_mr = create_champaka_flower_textures()
    mat_leaves = builder.add_pbr_material("Mat_MarigoldShrub", builder.add_image_from_pil(f_albedo), builder.add_image_from_pil(f_normal), builder.add_image_from_pil(f_mr), double_sided=True)

    mesh_leaves = MeshBuilder(mat_leaves)

    # Multi-lobed bush mounds
    mounds = [
        (0.0, 0.6, 0.0, 1.1, 0.9),
        (-0.5, 0.45, 0.3, 0.8, 0.7),
        (0.6, 0.5, -0.3, 0.85, 0.75),
        (0.2, 0.4, 0.6, 0.75, 0.65),
    ]
    for mx, my, mz, mrad, mh in mounds:
        mesh_leaves.add_cylinder([mx, my, mz], mrad, mrad*0.5, mh, 10)
        mesh_leaves.add_cylinder([mx, my + mh*0.35, mz], mrad*0.65, mrad*0.1, mh*0.4, 8)

    prims = [builder.add_mesh_primitive(mesh_leaves)]
    builder.meshes.append({"name": "Mesh_FloweringShrub", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_FloweringShrub", "mesh": 0})

    glb_data = builder.build_glb()
    path = os.path.join(output_dir, "flowering_shrub.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Remaster Asset] Generated {len(glb_data)} bytes -> {path}")

# ---------------------------------------------------------
# Main Execution Entrypoint
# ---------------------------------------------------------

def main():
    output_dir = "godot/assets/environment"
    os.makedirs(output_dir, exist_ok=True)
    print("=================================================================")
    print("  STAGE Q3: REMASTERING BHUMI 3D ENVIRONMENT ASSETS & ARCHITECTURE")
    print("=================================================================")
    generate_temple_shikhara(output_dir)
    generate_temple_torana(output_dir)
    generate_temple_column(output_dir)
    generate_water_ghat_stairs(output_dir)
    generate_stone_lantern(output_dir)
    generate_ruined_watchtower(output_dir)
    generate_lotus_pedestal(output_dir)
    generate_banyan_tree(output_dir)
    generate_sal_tree(output_dir)
    generate_champaka_tree(output_dir)
    generate_basalt_boulder(output_dir)
    generate_rock_outcrop(output_dir)
    generate_flowering_shrub(output_dir)
    print("=================================================================")
    print("  ALL 13 REMASTERED ENVIRONMENT ASSETS SUCCESSFULLY GENERATED!   ")
    print("=================================================================")

if __name__ == "__main__":
    main()
