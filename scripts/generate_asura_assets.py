"""
Mythos 3D - Production Enemy & Boss Asset Pipeline Generator
Stage E: Complete Entertaining Gameplay Vertical Slice

Generates game-ready, authentic Vedic/Asura 3D glTF/GLB models:
1. asura_warrior.glb - 1.9m tall demonic Asura foot soldier with curved scythe blade, horned brow, and obsidian plate.
2. boss_kalanemi.glb - 2.6m monumental Asura General with quad-horned helm, molten Tamas chest fissures, and giant cleaver.
"""

import os
import math
import struct
import json
import io
import numpy as np
from PIL import Image, ImageDraw

# ---------------------------------------------------------
# PBR Texture Generators
# ---------------------------------------------------------

def create_asura_skin_textures():
    size = (512, 512)
    # Dark charcoal obsidian skin with crimson demonic vein striations
    albedo = Image.new("RGBA", size, (35, 30, 36, 255))
    draw = ImageDraw.Draw(albedo)
    # Crimson demonic fissures
    for _ in range(25):
        x = np.random.randint(0, size[0])
        y = np.random.randint(0, size[1])
        length = np.random.randint(20, 80)
        angle = np.random.uniform(0, math.pi * 2)
        ex = int(x + math.cos(angle) * length)
        ey = int(y + math.sin(angle) * length)
        draw.line([(x, y), (ex, ey)], fill=(180, 20, 30, 220), width=2)
        draw.line([(x, y), (ex, ey)], fill=(255, 60, 40, 180), width=1)

    # Normal map with subtle muscle striations
    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    ndraw = ImageDraw.Draw(normal)
    for y in range(0, size[1], 16):
        ndraw.line([(0, y), (size[0], y)], fill=(128, 140, 240, 255), width=2)

    # Roughness (0.75) / Metallic (0.15)
    mr = Image.new("RGBA", size, (0, int(255 * 0.75), int(255 * 0.15), 255))

    # Emissive crimson veins
    emissive = Image.new("RGBA", size, (0, 0, 0, 255))
    edraw = ImageDraw.Draw(emissive)
    for _ in range(12):
        x = np.random.randint(30, size[0] - 30)
        y = np.random.randint(30, size[1] - 30)
        edraw.ellipse([x-4, y-4, x+4, y+4], fill=(255, 40, 20, 255))

    return albedo, normal, mr, emissive

def create_asura_armor_textures():
    size = (512, 512)
    # Rusted dark bronze / iron spiked armor
    albedo = Image.new("RGBA", size, (65, 48, 42, 255))
    draw = ImageDraw.Draw(albedo)
    for y in range(0, size[1], 32):
        draw.line([(0, y), (size[0], y)], fill=(45, 32, 28, 255), width=3)
        draw.line([(0, y+1), (size[0], y+1)], fill=(110, 80, 50, 255), width=1)
    
    # Normal map with beveled rivets
    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    ndraw = ImageDraw.Draw(normal)
    for x in range(16, size[0], 32):
        for y in range(16, size[1], 32):
            ndraw.ellipse([x-3, y-3, x+3, y+3], fill=(145, 145, 255, 255))

    # Roughness (0.50) / Metallic (0.80)
    mr = Image.new("RGBA", size, (0, int(255 * 0.50), int(255 * 0.80), 255))
    return albedo, normal, mr

def create_void_blade_textures():
    size = (512, 512)
    # Wicked serrated obsidian blade with glowing violet-red runes
    albedo = Image.new("RGBA", size, (25, 22, 28, 255))
    draw = ImageDraw.Draw(albedo)
    # Blade edge highlight
    draw.rectangle([0, 0, 64, size[1]], fill=(140, 130, 145, 255))
    draw.rectangle([size[0]-64, 0, size[0], size[1]], fill=(140, 130, 145, 255))
    
    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    mr = Image.new("RGBA", size, (0, int(255 * 0.25), int(255 * 0.90), 255))
    
    # Glowing Tamas Rune in center
    emissive = Image.new("RGBA", size, (0, 0, 0, 255))
    edraw = ImageDraw.Draw(emissive)
    cx = 256
    for y in range(40, size[1]-40, 60):
        edraw.polygon([(cx, y-15), (cx+18, y+15), (cx-18, y+15)], fill=(255, 20, 60, 255))
        edraw.line([(cx, y-20), (cx, y+25)], fill=(255, 140, 60, 255), width=3)
    
    return albedo, normal, mr, emissive

def create_kalanemi_molten_textures():
    size = (512, 512)
    # Black volcanic crust with cracks of blazing orange-red magma
    albedo = Image.new("RGBA", size, (22, 18, 20, 255))
    draw = ImageDraw.Draw(albedo)
    emissive = Image.new("RGBA", size, (0, 0, 0, 255))
    edraw = ImageDraw.Draw(emissive)

    # Branching magma veins
    for _ in range(18):
        x = np.random.randint(0, size[0])
        y = np.random.randint(0, size[1])
        steps = np.random.randint(6, 14)
        curr_x, curr_y = x, y
        for _s in range(steps):
            nx = int(curr_x + np.random.randint(-25, 26))
            ny = int(curr_y + np.random.randint(-25, 26))
            nx = max(0, min(size[0]-1, nx))
            ny = max(0, min(size[1]-1, ny))
            draw.line([(curr_x, curr_y), (nx, ny)], fill=(255, 80, 20, 255), width=3)
            edraw.line([(curr_x, curr_y), (nx, ny)], fill=(255, 120, 30, 255), width=4)
            edraw.line([(curr_x, curr_y), (nx, ny)], fill=(255, 240, 100, 255), width=1)
            curr_x, curr_y = nx, ny

    normal = Image.new("RGBA", size, (128, 128, 255, 255))
    mr = Image.new("RGBA", size, (0, int(255 * 0.65), int(255 * 0.40), 255))
    return albedo, normal, mr, emissive

# ---------------------------------------------------------
# glTF 2.0 Binary Builder
# ---------------------------------------------------------

class GLBBuilder:
    def __init__(self, name):
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

    def add_pbr_material(self, name, albedo_tex, normal_tex=None, mr_tex=None, emissive_tex=None, base_color=(1.0, 1.0, 1.0, 1.0)):
        pbr = {
            "baseColorTexture": {"index": albedo_tex},
            "baseColorFactor": list(base_color),
            "metallicFactor": 1.0,
            "roughnessFactor": 1.0
        }
        if mr_tex is not None:
            pbr["metallicRoughnessTexture"] = {"index": mr_tex}

        mat = {"name": name, "pbrMetallicRoughness": pbr, "doubleSided": False}
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
        pad = (4 - (len(self.bin_data) % 4)) % 4
        self.bin_data.extend(b'\x00' * pad)

        gltf = {
            "asset": {"version": "2.0", "generator": "Mythos 3D Enemy Pipeline"},
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
            ([0, 0, 1], [(cx-sx, cy-sy, cz+sz), (cx+sx, cy-sy, cz+sz), (cx+sx, cy+sy, cz+sz), (cx-sx, cy+sy, cz+sz)]),
            ([0, 0, -1], [(cx+sx, cy-sy, cz-sz), (cx-sx, cy-sy, cz-sz), (cx-sx, cy+sy, cz-sz), (cx+sx, cy+sy, cz-sz)]),
            ([0, 1, 0], [(cx-sx, cy+sy, cz+sz), (cx+sx, cy+sy, cz+sz), (cx+sx, cy+sy, cz-sz), (cx-sx, cy+sy, cz-sz)]),
            ([0, -1, 0], [(cx-sx, cy-sy, cz-sz), (cx+sx, cy-sy, cz-sz), (cx+sx, cy-sy, cz+sz), (cx-sx, cy-sy, cz+sz)]),
            ([1, 0, 0], [(cx+sx, cy-sy, cz+sz), (cx+sx, cy-sy, cz-sz), (cx+sx, cy+sy, cz-sz), (cx+sx, cy+sy, cz+sz)]),
            ([-1, 0, 0], [(cx-sx, cy-sy, cz-sz), (cx-sx, cy-sy, cz+sz), (cx-sx, cy+sy, cz+sz), (cx-sx, cy+sy, cz-sz)]),
        ]

        for norm, corners in faces:
            base_idx = len(self.positions)
            for i, p in enumerate(corners):
                self.positions.append(p)
                self.normals.append(norm)
                u = (0.0 if i in [0, 3] else 1.0) * u_s
                v = (0.0 if i in [0, 1] else 1.0) * v_s
                self.uvs.append((u, v))
            self.indices.extend([base_idx, base_idx+1, base_idx+2, base_idx, base_idx+2, base_idx+3])

    def add_cylinder(self, center, radius_bottom, radius_top, height, segments=12):
        cx, cy, cz = center
        h2 = height * 0.5
        base_idx = len(self.positions)

        for i in range(segments):
            angle = i * (2.0 * math.pi / segments)
            cos_a = math.cos(angle)
            sin_a = math.sin(angle)

            # Bottom ring
            self.positions.append((cx + cos_a * radius_bottom, cy - h2, cz + sin_a * radius_bottom))
            self.normals.append((cos_a, 0.0, sin_a))
            self.uvs.append((i / segments, 0.0))

            # Top ring
            self.positions.append((cx + cos_a * radius_top, cy + h2, cz + sin_a * radius_top))
            self.normals.append((cos_a, 0.0, sin_a))
            self.uvs.append((i / segments, 1.0))

        # Side quads
        for i in range(segments):
            b1 = base_idx + i * 2
            t1 = b1 + 1
            next_i = (i + 1) % segments
            b2 = base_idx + next_i * 2
            t2 = b2 + 1
            self.indices.extend([b1, b2, t2, b1, t2, t1])

        # Caps
        top_center_idx = len(self.positions)
        self.positions.append((cx, cy + h2, cz))
        self.normals.append((0.0, 1.0, 0.0))
        self.uvs.append((0.5, 0.5))
        for i in range(segments):
            next_i = (i + 1) % segments
            t1 = base_idx + i * 2 + 1
            t2 = base_idx + next_i * 2 + 1
            self.indices.extend([top_center_idx, t1, t2])

        bot_center_idx = len(self.positions)
        self.positions.append((cx, cy - h2, cz))
        self.normals.append((0.0, -1.0, 0.0))
        self.uvs.append((0.5, 0.5))
        for i in range(segments):
            next_i = (i + 1) % segments
            b1 = base_idx + i * 2
            b2 = base_idx + next_i * 2
            self.indices.extend([bot_center_idx, b2, b1])

    def add_cone(self, base_center, radius, height, segments=12):
        bx, by, bz = base_center
        tip = (bx, by + height, bz)
        base_idx = len(self.positions)

        for i in range(segments):
            ang = i * (2.0 * math.pi / segments)
            self.positions.append((bx + math.cos(ang) * radius, by, bz + math.sin(ang) * radius))
            norm = [math.cos(ang), radius / height, math.sin(ang)]
            mag = math.sqrt(sum(c*c for c in norm))
            self.normals.append([c/mag for c in norm])
            self.uvs.append((i / segments, 0.0))

        tip_idx = len(self.positions)
        self.positions.append(tip)
        self.normals.append((0.0, 1.0, 0.0))
        self.uvs.append((0.5, 1.0))

        for i in range(segments):
            p1 = base_idx + i
            p2 = base_idx + ((i + 1) % segments)
            self.indices.extend([p1, p2, tip_idx])

# ---------------------------------------------------------
# Entity 1: Asura Warrior (Demonic Soldier)
# ---------------------------------------------------------

def generate_asura_warrior(output_dir):
    builder = GLBBuilder("AsuraWarrior")
    s_alb, s_nrm, s_mr, s_ems = create_asura_skin_textures()
    a_alb, a_nrm, a_mr = create_asura_armor_textures()
    b_alb, b_nrm, b_mr, b_ems = create_void_blade_textures()

    mat_skin = builder.add_pbr_material("Mat_AsuraSkin", builder.add_image_from_pil(s_alb), builder.add_image_from_pil(s_nrm), builder.add_image_from_pil(s_mr), builder.add_image_from_pil(s_ems))
    mat_armor = builder.add_pbr_material("Mat_AsuraArmor", builder.add_image_from_pil(a_alb), builder.add_image_from_pil(a_nrm), builder.add_image_from_pil(a_mr))
    mat_blade = builder.add_pbr_material("Mat_VoidBlade", builder.add_image_from_pil(b_alb), builder.add_image_from_pil(b_nrm), builder.add_image_from_pil(b_mr), builder.add_image_from_pil(b_ems))

    mesh_skin = MeshBuilder(mat_skin)
    mesh_armor = MeshBuilder(mat_armor)
    mesh_blade = MeshBuilder(mat_blade)

    # 1. Muscular Torso & Pelvis
    mesh_skin.add_cylinder([0, 1.25, 0], 0.30, 0.38, 0.55, 10) # Chest & Abdomen
    mesh_armor.add_box([0, 1.30, 0.05], [0.55, 0.40, 0.35])   # Spiked Breastplate
    mesh_armor.add_cylinder([0, 0.95, 0], 0.32, 0.32, 0.20, 10) # War Belt & Faulds

    # 2. Spiked Shoulder Pauldrons
    mesh_armor.add_box([-0.42, 1.48, 0], [0.28, 0.22, 0.32])
    mesh_armor.add_cone([-0.42, 1.58, 0], 0.08, 0.25, 6) # Left Horn Spike
    mesh_armor.add_box([0.42, 1.48, 0], [0.28, 0.22, 0.32])
    mesh_armor.add_cone([0.42, 1.58, 0], 0.08, 0.25, 6)  # Right Horn Spike

    # 3. Head & Demonic Horns
    mesh_skin.add_cylinder([0, 1.70, 0], 0.18, 0.20, 0.28, 10) # Head
    mesh_armor.add_cone([-0.14, 1.82, 0.05], 0.06, 0.35, 6)    # Left Horn
    mesh_armor.add_cone([0.14, 1.82, 0.05], 0.06, 0.35, 6)     # Right Horn
    mesh_armor.add_box([0, 1.72, 0.14], [0.22, 0.12, 0.10])    # Jaw Mask / Visor

    # 4. Arms & Claws
    # Left Arm
    mesh_skin.add_cylinder([-0.40, 1.15, 0], 0.12, 0.14, 0.40, 8)
    mesh_armor.add_cylinder([-0.40, 0.85, 0], 0.13, 0.11, 0.35, 8) # Left Bracer
    # Right Arm
    mesh_skin.add_cylinder([0.40, 1.15, 0], 0.12, 0.14, 0.40, 8)
    mesh_armor.add_cylinder([0.40, 0.85, 0], 0.13, 0.11, 0.35, 8)  # Right Bracer

    # 5. Legs & Greaves
    # Left Leg
    mesh_skin.add_cylinder([-0.18, 0.65, 0], 0.14, 0.16, 0.45, 8)
    mesh_armor.add_cylinder([-0.18, 0.25, 0], 0.13, 0.11, 0.45, 8) # Greave
    mesh_armor.add_box([-0.18, 0.06, 0.08], [0.18, 0.12, 0.32])    # Sabaton boot
    # Right Leg
    mesh_skin.add_cylinder([0.18, 0.65, 0], 0.14, 0.16, 0.45, 8)
    mesh_armor.add_cylinder([0.18, 0.25, 0], 0.13, 0.11, 0.45, 8)  # Greave
    mesh_armor.add_box([0.18, 0.06, 0.08], [0.18, 0.12, 0.32])     # Sabaton boot

    # 6. Wicked Asura Scythe-Blade (Held in Right Hand at [0.45, 0.70, 0.20])
    mesh_armor.add_cylinder([0.42, 0.70, 0.15], 0.03, 0.03, 0.45, 6) # Hilt
    mesh_armor.add_box([0.42, 0.88, 0.15], [0.12, 0.04, 0.16])       # Crossguard
    # Curved blade
    mesh_blade.add_box([0.42, 1.35, 0.25], [0.04, 0.90, 0.22])
    mesh_blade.add_cone([0.42, 1.80, 0.25], 0.10, 0.40, 4)

    prims = [
        builder.add_mesh_primitive(mesh_skin),
        builder.add_mesh_primitive(mesh_armor),
        builder.add_mesh_primitive(mesh_blade)
    ]
    builder.meshes.append({"name": "Mesh_AsuraWarrior", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_AsuraWarrior", "mesh": 0})

    glb_data = builder.build_glb()
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, "asura_warrior.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Enemy Generator] Generated Asura Warrior ({len(glb_data)} bytes) -> {path}")

# ---------------------------------------------------------
# Entity 2: Boss Kalanemi (Corrupted Asura General)
# ---------------------------------------------------------

def generate_boss_kalanemi(output_dir):
    builder = GLBBuilder("BossKalanemi")
    s_alb, s_nrm, s_mr, s_ems = create_asura_skin_textures()
    m_alb, m_nrm, m_mr, m_ems = create_kalanemi_molten_textures()
    a_alb, a_nrm, a_mr = create_asura_armor_textures()
    b_alb, b_nrm, b_mr, b_ems = create_void_blade_textures()

    mat_skin = builder.add_pbr_material("Mat_KalanemiSkin", builder.add_image_from_pil(s_alb), builder.add_image_from_pil(s_nrm), builder.add_image_from_pil(s_mr), builder.add_image_from_pil(s_ems))
    mat_molten = builder.add_pbr_material("Mat_KalanemiMolten", builder.add_image_from_pil(m_alb), builder.add_image_from_pil(m_nrm), builder.add_image_from_pil(m_mr), builder.add_image_from_pil(m_ems))
    mat_armor = builder.add_pbr_material("Mat_KalanemiArmor", builder.add_image_from_pil(a_alb), builder.add_image_from_pil(a_nrm), builder.add_image_from_pil(a_mr))
    mat_weapon = builder.add_pbr_material("Mat_KalanemiCleaver", builder.add_image_from_pil(b_alb), builder.add_image_from_pil(b_nrm), builder.add_image_from_pil(b_mr), builder.add_image_from_pil(b_ems))

    mesh_skin = MeshBuilder(mat_skin)
    mesh_molten = MeshBuilder(mat_molten)
    mesh_armor = MeshBuilder(mat_armor)
    mesh_weapon = MeshBuilder(mat_weapon)

    # Monumental 2.6m tall demonic scale (1.4x standard humanoid)
    # 1. Monumental Molten Torso
    mesh_molten.add_cylinder([0, 1.70, 0], 0.45, 0.58, 0.80, 12) # Chest & Belly with magma fissures
    mesh_armor.add_box([0, 1.80, 0.08], [0.85, 0.60, 0.52])     # Great Spiked Cuirass
    mesh_armor.add_cylinder([0, 1.25, 0], 0.48, 0.48, 0.32, 12)  # War Belt

    # 2. Quad-Spiked Heavy Pauldrons
    mesh_armor.add_box([-0.65, 2.05, 0], [0.45, 0.35, 0.50])
    mesh_armor.add_cone([-0.65, 2.22, 0.12], 0.12, 0.42, 6)
    mesh_armor.add_cone([-0.65, 2.22, -0.12], 0.10, 0.36, 6)

    mesh_armor.add_box([0.65, 2.05, 0], [0.45, 0.35, 0.50])
    mesh_armor.add_cone([0.65, 2.22, 0.12], 0.12, 0.42, 6)
    mesh_armor.add_cone([0.65, 2.22, -0.12], 0.10, 0.36, 6)

    # 3. Quad-Horned Demonic Helm & Third Eye
    mesh_skin.add_cylinder([0, 2.35, 0], 0.25, 0.28, 0.38, 12)
    mesh_armor.add_box([0, 2.38, 0.02], [0.40, 0.32, 0.38])     # Heavy Helm
    # 4 Great Curved Horns
    mesh_armor.add_cone([-0.22, 2.50, 0.08], 0.09, 0.55, 6)     # Front Left
    mesh_armor.add_cone([0.22, 2.50, 0.08], 0.09, 0.55, 6)      # Front Right
    mesh_armor.add_cone([-0.16, 2.52, -0.12], 0.07, 0.45, 6)    # Back Left
    mesh_armor.add_cone([0.16, 2.52, -0.12], 0.07, 0.45, 6)     # Back Right
    mesh_molten.add_box([0, 2.40, 0.20], [0.10, 0.10, 0.05])    # Blazing Tamas Third Eye

    # 4. Heavy Arms & Spiked Gauntlets
    # Left Arm
    mesh_skin.add_cylinder([-0.60, 1.55, 0], 0.18, 0.20, 0.55, 8)
    mesh_armor.add_cylinder([-0.60, 1.15, 0], 0.20, 0.16, 0.50, 8)
    mesh_armor.add_cone([-0.60, 1.15, 0.18], 0.06, 0.20, 4)     # Gauntlet Elbow Spike
    # Right Arm
    mesh_skin.add_cylinder([0.60, 1.55, 0], 0.18, 0.20, 0.55, 8)
    mesh_armor.add_cylinder([0.60, 1.15, 0], 0.20, 0.16, 0.50, 8)
    mesh_armor.add_cone([0.60, 1.15, 0.18], 0.06, 0.20, 4)

    # 5. Heavy Armored Legs & Iron Sabatons
    # Left Leg
    mesh_skin.add_cylinder([-0.28, 0.85, 0], 0.20, 0.22, 0.60, 8)
    mesh_armor.add_cylinder([-0.28, 0.35, 0], 0.19, 0.16, 0.60, 8)
    mesh_armor.add_box([-0.28, 0.08, 0.12], [0.26, 0.16, 0.46])
    # Right Leg
    mesh_skin.add_cylinder([0.28, 0.85, 0], 0.20, 0.22, 0.60, 8)
    mesh_armor.add_cylinder([0.28, 0.35, 0], 0.19, 0.16, 0.60, 8)
    mesh_armor.add_box([0.28, 0.08, 0.12], [0.26, 0.16, 0.46])

    # 6. Colossal Void Great-Cleaver (Length: 2.2m)
    mesh_armor.add_cylinder([0.65, 1.05, 0.25], 0.05, 0.05, 0.85, 8) # Heavy Shaft
    mesh_armor.add_box([0.65, 1.48, 0.25], [0.20, 0.08, 0.24])       # Guard
    mesh_weapon.add_box([0.65, 2.10, 0.40], [0.06, 1.25, 0.42])      # Giant Serrated Blade
    mesh_weapon.add_cone([0.65, 2.75, 0.40], 0.15, 0.50, 4)          # Tip Cleaver Spike

    prims = [
        builder.add_mesh_primitive(mesh_skin),
        builder.add_mesh_primitive(mesh_molten),
        builder.add_mesh_primitive(mesh_armor),
        builder.add_mesh_primitive(mesh_weapon)
    ]
    builder.meshes.append({"name": "Mesh_BossKalanemi", "primitives": [p for p in prims if p]})
    builder.nodes.append({"name": "Node_BossKalanemi", "mesh": 0})

    glb_data = builder.build_glb()
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, "boss_kalanemi.glb")
    with open(path, "wb") as f:
        f.write(glb_data)
    print(f"[Boss Generator] Generated Boss Kalanemi ({len(glb_data)} bytes) -> {path}")

# ---------------------------------------------------------
# Main
# ---------------------------------------------------------

def main():
    output_dir = "godot/assets/characters/enemies"
    print("=== Generating Mythos Stage E Asura & Boss 3D Models ===")
    generate_asura_warrior(output_dir)
    generate_boss_kalanemi(output_dir)
    print("=== All Stage E Character Assets Successfully Generated! ===")

if __name__ == "__main__":
    main()
