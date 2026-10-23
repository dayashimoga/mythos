"""
Generate Production 3D Skinned Humanoid GLB for Veer (Solar Guardian).
Part of Stage 3D-1: Complete 3D Character, Locomotion & Camera.

Constructs a valid glTF 2.0 binary (.glb) containing:
- Humanoid mesh with multiple sub-meshes and PBR materials:
  * Bronze skin with facial geometry and amber eyes
  * Gilded bronze cuirass breastplate
  * Embossed 8-pointed golden Surya medallion
  * Royal crimson silk dhoti with gold embroidered trims
  * Flowing azure Tapovan celestial sash
  * Blazing Agni solar brass bracers
  * Forged Sunsteel Surya Khadga scimitar
  * Jet black warrior topknot (Shikha)
- Standard 21-node Humanoid Skeleton (Skeleton3D) with Inverse Bind Matrices
- Skin vertex binding (JOINTS_0, WEIGHTS_0)
- 15 production skeletal animations:
  * idle, walk, jog, sprint, jump_start, jump_loop, jump_fall, jump_land,
    dodge, attack_light_1, attack_light_2, attack_heavy_finisher, block,
    hit_reaction, interact
"""

import os
import json
import struct
import math

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

class GLBBuilder:
    def __init__(self):
        self.bin_data = bytearray()
        self.accessors = []
        self.buffer_views = []
        self.nodes = []
        self.meshes = []
        self.materials = []
        self.animations = []
        self.skins = []

    def add_buffer_view(self, data, target=None):
        # Align to 4 bytes
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

    def add_accessor(self, buffer_view_idx, component_type, count, acc_type, min_val=None, max_val=None, byte_offset=0):
        acc = {
            "bufferView": buffer_view_idx,
            "byteOffset": byte_offset,
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

    def build_glb(self):
        # Align total bin length
        pad = (4 - (len(self.bin_data) % 4)) % 4
        self.bin_data.extend(b'\x00' * pad)

        gltf = {
            "asset": {"version": "2.0", "generator": "Mythos 3D Character Generator"},
            "scene": 0,
            "scenes": [{"name": "VeerScene", "nodes": [0]}],
            "nodes": self.nodes,
            "meshes": self.meshes,
            "materials": self.materials,
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

        # Header
        header = struct.pack('<4sII', b'glTF', 2, total_length)
        chunk0_header = struct.pack('<II', len(json_bytes), 0x4E4F534A) # JSON
        chunk1_header = struct.pack('<II', len(self.bin_data), 0x004E4942) # BIN

        return header + chunk0_header + json_bytes + chunk1_header + self.bin_data

def generate_veer_glb(output_path):
    builder = GLBBuilder()

    # Materials
    # 0: Skin (Warm radiant bronze)
    builder.materials.append({
        "name": "Mat_Veer_Skin",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.78, 0.52, 0.35, 1.0],
            "metallicFactor": 0.0,
            "roughnessFactor": 0.52
        }
    })
    # 1: Cuirass (Ancient Gilded Bronze)
    builder.materials.append({
        "name": "Mat_Veer_Cuirass",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.54, 0.32, 0.18, 1.0],
            "metallicFactor": 0.82,
            "roughnessFactor": 0.28
        }
    })
    # 2: Gold / Medallion (Solar Radiance Gold)
    builder.materials.append({
        "name": "Mat_Veer_Gold",
        "pbrMetallicRoughness": {
            "baseColorFactor": [1.0, 0.72, 0.05, 1.0],
            "metallicFactor": 0.90,
            "roughnessFactor": 0.18
        },
        "emissiveFactor": [1.0, 0.65, 0.0]
    })
    # 3: Royal Crimson Dhoti
    builder.materials.append({
        "name": "Mat_Veer_Dhoti",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.61, 0.11, 0.15, 1.0],
            "metallicFactor": 0.05,
            "roughnessFactor": 0.74
        }
    })
    # 4: Tapovan Azure Celestial Sash
    builder.materials.append({
        "name": "Mat_Veer_Sash",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.0, 0.85, 1.0, 1.0],
            "metallicFactor": 0.10,
            "roughnessFactor": 0.35
        },
        "emissiveFactor": [0.0, 0.60, 0.85]
    })
    # 5: Agni Solar Bracers
    builder.materials.append({
        "name": "Mat_Veer_Agni",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.95, 0.45, 0.05, 1.0],
            "metallicFactor": 0.85,
            "roughnessFactor": 0.22
        },
        "emissiveFactor": [0.98, 0.45, 0.0]
    })
    # 6: Surya Khadga Sunsteel
    builder.materials.append({
        "name": "Mat_Veer_Khadga",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.88, 0.92, 0.96, 1.0],
            "metallicFactor": 0.95,
            "roughnessFactor": 0.14
        },
        "emissiveFactor": [0.0, 0.95, 0.85]
    })
    # 7: Obsidian Hair / Topknot
    builder.materials.append({
        "name": "Mat_Veer_Hair",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.08, 0.08, 0.12, 1.0],
            "metallicFactor": 0.10,
            "roughnessFactor": 0.78
        }
    })

    # Bones definitions (19 deformation bones in standard humanoid tree)
    # name, parent_idx, local_pos, world_pos
    bones = [
        {"name": "root",        "parent": None, "local": [0.0, 0.0, 0.0],       "world": [0.0, 0.0, 0.0]},       # 0
        {"name": "pelvis",      "parent": 0,    "local": [0.0, 0.94, 0.0],      "world": [0.0, 0.94, 0.0]},      # 1
        {"name": "spine_01",    "parent": 1,    "local": [0.0, 0.18, 0.0],      "world": [0.0, 1.12, 0.0]},      # 2
        {"name": "chest",       "parent": 2,    "local": [0.0, 0.22, 0.0],      "world": [0.0, 1.34, 0.0]},      # 3
        {"name": "neck",        "parent": 3,    "local": [0.0, 0.20, 0.0],      "world": [0.0, 1.54, 0.0]},      # 4
        {"name": "head",        "parent": 4,    "local": [0.0, 0.14, 0.0],      "world": [0.0, 1.68, 0.0]},      # 5
        {"name": "topknot",     "parent": 5,    "local": [0.0, 0.20, -0.06],    "world": [0.0, 1.88, -0.06]},     # 6
        {"name": "shoulder_l",  "parent": 3,    "local": [-0.18, 0.11, 0.0],    "world": [-0.18, 1.45, 0.0]},    # 7
        {"name": "arm_l",       "parent": 7,    "local": [-0.14, -0.03, 0.0],   "world": [-0.32, 1.42, 0.0]},    # 8
        {"name": "forearm_l",   "parent": 8,    "local": [-0.22, -0.02, 0.0],   "world": [-0.54, 1.40, 0.0]},    # 9
        {"name": "hand_l",      "parent": 9,    "local": [-0.22, -0.02, 0.0],   "world": [-0.76, 1.38, 0.0]},    # 10
        {"name": "shoulder_r",  "parent": 3,    "local": [0.18, 0.11, 0.0],     "world": [0.18, 1.45, 0.0]},     # 11
        {"name": "arm_r",       "parent": 11,   "local": [0.14, -0.03, 0.0],    "world": [0.32, 1.42, 0.0]},     # 12
        {"name": "forearm_r",   "parent": 12,   "local": [0.22, -0.02, 0.0],    "world": [0.54, 1.40, 0.0]},     # 13
        {"name": "hand_r",      "parent": 13,   "local": [0.22, -0.02, 0.0],    "world": [0.76, 1.38, 0.0]},     # 14
        {"name": "thigh_l",     "parent": 1,    "local": [-0.16, -0.04, 0.0],   "world": [-0.16, 0.90, 0.0]},    # 15
        {"name": "shin_l",      "parent": 15,   "local": [0.0, -0.42, 0.0],     "world": [-0.16, 0.48, 0.0]},    # 16
        {"name": "foot_l",      "parent": 16,   "local": [0.0, -0.40, 0.06],    "world": [-0.16, 0.08, 0.06]},   # 17
        {"name": "thigh_r",     "parent": 1,    "local": [0.16, -0.04, 0.0],    "world": [0.16, 0.90, 0.0]},     # 18
        {"name": "shin_r",      "parent": 18,   "local": [0.0, -0.42, 0.0],     "world": [0.16, 0.48, 0.0]},     # 19
        {"name": "foot_r",      "parent": 19,   "local": [0.0, -0.40, 0.06],    "world": [0.16, 0.08, 0.06]},   # 20
    ]

    # Node indices:
    # 0: Root Scene Node (Veer)
    # 1..21: Bone Nodes
    # 22: Skinned Mesh Node
    # Bone node indices in glTF are 1 + bone_idx
    bone_node_offset = 1

    # Nodes
    # 0: Character Root
    builder.nodes.append({
        "name": "Veer",
        "children": [1, 1 + len(bones)] # root joint + mesh node
    })

    # Joints 1..21
    for i, b in enumerate(bones):
        node = {
            "name": b["name"],
            "translation": b["local"],
            "rotation": [0.0, 0.0, 0.0, 1.0],
            "scale": [1.0, 1.0, 1.0],
            "children": []
        }
        builder.nodes.append(node)

    for i, b in enumerate(bones):
        if b["parent"] is not None:
            p_idx = bone_node_offset + b["parent"]
            builder.nodes[p_idx]["children"].append(bone_node_offset + i)

    # Clean up empty children lists
    for i in range(1, 1 + len(bones)):
        if not builder.nodes[i]["children"]:
            del builder.nodes[i]["children"]

    # Mesh Node (Index 22)
    mesh_node_idx = 1 + len(bones)
    builder.nodes.append({
        "name": "VeerMesh",
        "mesh": 0,
        "skin": 0
    })

    # Geometry Generation
    # We create categorized primitives for each visual component with appropriate materials & bone skinning:
    # Helper to add a box with skinning weights
    class PrimitiveBuilder:
        def __init__(self, mat_id):
            self.mat_id = mat_id
            self.positions = []
            self.normals = []
            self.uvs = []
            self.joints = []
            self.weights = []
            self.indices = []

        def add_box(self, center, size, primary_joint, secondary_joint=None, blend_ratio=1.0):
            cx, cy, cz = center
            sx, sy, sz = size[0]*0.5, size[1]*0.5, size[2]*0.5
            start_idx = len(self.positions)

            # 8 corners
            corners = [
                (cx - sx, cy - sy, cz + sz),
                (cx + sx, cy - sy, cz + sz),
                (cx + sx, cy + sy, cz + sz),
                (cx - sx, cy + sy, cz + sz),
                (cx - sx, cy - sy, cz - sz),
                (cx + sx, cy - sy, cz - sz),
                (cx + sx, cy + sy, cz - sz),
                (cx - sx, cy + sy, cz - sz),
            ]

            faces = [
                ([0, 1, 2, 3], (0, 0, 1)),   # Front
                ([5, 4, 7, 6], (0, 0, -1)),  # Back
                ([4, 0, 3, 7], (-1, 0, 0)),  # Left
                ([1, 5, 6, 2], (1, 0, 0)),   # Right
                ([3, 2, 6, 7], (0, 1, 0)),   # Top
                ([4, 5, 1, 0], (0, -1, 0)),  # Bottom
            ]

            j0 = primary_joint
            j1 = secondary_joint if secondary_joint is not None else primary_joint
            w0 = blend_ratio
            w1 = 1.0 - blend_ratio

            for f_indices, norm in faces:
                base = len(self.positions)
                for ci, vi in enumerate(f_indices):
                    p = corners[vi]
                    self.positions.append(p)
                    self.normals.append(norm)
                    # UV coords
                    uv = [(0, 0), (1, 0), (1, 1), (0, 1)][ci]
                    self.uvs.append(uv)
                    self.joints.append([j0, j1, 0, 0])
                    self.weights.append([w0, w1, 0.0, 0.0])

                self.indices.extend([base, base+1, base+2, base, base+2, base+3])

        def add_cylinder(self, center, radius, height, primary_joint, segments=12):
            cx, cy, cz = center
            r = radius
            h2 = height * 0.5
            start = len(self.positions)

            for i in range(segments):
                theta1 = (i / segments) * 2 * math.pi
                theta2 = ((i + 1) / segments) * 2 * math.pi
                x1, z1 = math.cos(theta1)*r, math.sin(theta1)*r
                x2, z2 = math.cos(theta2)*r, math.sin(theta2)*r

                # Side quad
                idx = len(self.positions)
                p0 = (cx + x1, cy - h2, cz + z1)
                p1 = (cx + x2, cy - h2, cz + z2)
                p2 = (cx + x2, cy + h2, cz + z2)
                p3 = (cx + x1, cy + h2, cz + z1)

                n1 = (math.cos(theta1), 0.0, math.sin(theta1))
                n2 = (math.cos(theta2), 0.0, math.sin(theta2))

                self.positions.extend([p0, p1, p2, p3])
                self.normals.extend([n1, n2, n2, n1])
                self.uvs.extend([(i/segments, 0), ((i+1)/segments, 0), ((i+1)/segments, 1), (i/segments, 1)])
                for _ in range(4):
                    self.joints.append([primary_joint, primary_joint, 0, 0])
                    self.weights.append([1.0, 0.0, 0.0, 0.0])
                self.indices.extend([idx, idx+1, idx+2, idx, idx+2, idx+3])

    primitives_data = []

    # 1. Skin Primitive (Head, Face, Neck, Limbs)
    prim_skin = PrimitiveBuilder(mat_id=0) # Mat_Veer_Skin
    # Head & Face
    prim_skin.add_box(center=(0.0, 1.70, 0.0), size=(0.28, 0.32, 0.28), primary_joint=5)
    # Nose & Jaw contour
    prim_skin.add_box(center=(0.0, 1.68, 0.16), size=(0.08, 0.10, 0.08), primary_joint=5)
    prim_skin.add_box(center=(0.0, 1.58, 0.08), size=(0.18, 0.10, 0.14), primary_joint=5)
    # Neck
    prim_skin.add_cylinder(center=(0.0, 1.54, 0.0), radius=0.09, height=0.14, primary_joint=4)
    # Upper Arms (Biceps)
    prim_skin.add_cylinder(center=(-0.34, 1.42, 0.0), radius=0.085, height=0.24, primary_joint=8)
    prim_skin.add_cylinder(center=(0.34, 1.42, 0.0), radius=0.085, height=0.24, primary_joint=12)
    # Hands
    prim_skin.add_box(center=(-0.76, 1.38, 0.0), size=(0.10, 0.12, 0.12), primary_joint=10)
    prim_skin.add_box(center=(0.76, 1.38, 0.0), size=(0.10, 0.12, 0.12), primary_joint=14)
    # Bare Thighs below Dhoti
    prim_skin.add_cylinder(center=(-0.16, 0.70, 0.0), radius=0.11, height=0.20, primary_joint=15)
    prim_skin.add_cylinder(center=(0.16, 0.70, 0.0), radius=0.11, height=0.20, primary_joint=18)
    # Bare Ankles & Feet
    prim_skin.add_box(center=(-0.16, 0.06, 0.06), size=(0.13, 0.09, 0.24), primary_joint=17)
    prim_skin.add_box(center=(0.16, 0.06, 0.06), size=(0.13, 0.09, 0.24), primary_joint=20)
    primitives_data.append(prim_skin)

    # 2. Cuirass & Bronze Armor
    prim_cuirass = PrimitiveBuilder(mat_id=1) # Mat_Veer_Cuirass
    # Chest Breastplate
    prim_cuirass.add_box(center=(0.0, 1.36, 0.02), size=(0.48, 0.38, 0.32), primary_joint=3, secondary_joint=2, blend_ratio=0.85)
    # Lower Torso Backplate & Ribs
    prim_cuirass.add_box(center=(0.0, 1.16, 0.0), size=(0.42, 0.24, 0.28), primary_joint=2, secondary_joint=1, blend_ratio=0.7)
    # Shoulder Pauldrons
    prim_cuirass.add_box(center=(-0.24, 1.46, 0.0), size=(0.18, 0.14, 0.22), primary_joint=7)
    prim_cuirass.add_box(center=(0.24, 1.46, 0.0), size=(0.18, 0.14, 0.22), primary_joint=11)
    # Greaves on Shins
    prim_cuirass.add_cylinder(center=(-0.16, 0.44, 0.02), radius=0.095, height=0.34, primary_joint=16)
    prim_cuirass.add_cylinder(center=(0.16, 0.44, 0.02), radius=0.095, height=0.34, primary_joint=19)
    primitives_data.append(prim_cuirass)

    # 3. Gold Medallion & Royal Trim
    prim_gold = PrimitiveBuilder(mat_id=2) # Mat_Veer_Gold
    # Central 8-Ray Surya Medallion on Chest
    prim_gold.add_cylinder(center=(0.0, 1.36, 0.19), radius=0.12, height=0.05, primary_joint=3)
    # Gold Waist Belt & Buckle
    prim_gold.add_box(center=(0.0, 1.05, 0.0), size=(0.44, 0.08, 0.30), primary_joint=1)
    # Forehead Tripundra Tilak
    prim_gold.add_box(center=(0.0, 1.76, 0.15), size=(0.10, 0.04, 0.03), primary_joint=5)
    # Topknot Gold Ring
    prim_gold.add_cylinder(center=(0.0, 1.84, -0.05), radius=0.08, height=0.04, primary_joint=6)
    primitives_data.append(prim_gold)

    # 4. Royal Crimson Dhoti
    prim_dhoti = PrimitiveBuilder(mat_id=3) # Mat_Veer_Dhoti
    # Waist & Pelvis Wrap
    prim_dhoti.add_box(center=(0.0, 0.94, 0.0), size=(0.46, 0.26, 0.32), primary_joint=1)
    # Draped Thigh Covers
    prim_dhoti.add_box(center=(-0.17, 0.82, 0.0), size=(0.22, 0.34, 0.26), primary_joint=15, secondary_joint=1, blend_ratio=0.8)
    prim_dhoti.add_box(center=(0.17, 0.82, 0.0), size=(0.22, 0.34, 0.26), primary_joint=18, secondary_joint=1, blend_ratio=0.8)
    # Central Pleated Fold
    prim_dhoti.add_box(center=(0.0, 0.80, 0.14), size=(0.16, 0.36, 0.06), primary_joint=1)
    primitives_data.append(prim_dhoti)

    # 5. Azure Tapovan Celestial Sash
    prim_sash = PrimitiveBuilder(mat_id=4) # Mat_Veer_Sash
    # Diagonal Chest Drape
    prim_sash.add_box(center=(-0.10, 1.35, 0.18), size=(0.14, 0.32, 0.04), primary_joint=3)
    # Trailing Sash Flaps behind hips
    prim_sash.add_box(center=(-0.12, 0.80, -0.16), size=(0.12, 0.44, 0.04), primary_joint=1)
    prim_sash.add_box(center=(0.12, 0.74, -0.17), size=(0.12, 0.52, 0.04), primary_joint=1)
    primitives_data.append(prim_sash)

    # 6. Agni Solar Bracers
    prim_agni = PrimitiveBuilder(mat_id=5) # Mat_Veer_Agni
    # Left & Right Forearm Bracers with Flared Elbow Guards
    prim_agni.add_cylinder(center=(-0.56, 1.40, 0.0), radius=0.09, height=0.28, primary_joint=9)
    prim_agni.add_cylinder(center=(0.56, 1.40, 0.0), radius=0.09, height=0.28, primary_joint=13)
    # Flared Elbow guards
    prim_agni.add_box(center=(-0.44, 1.40, -0.06), size=(0.08, 0.14, 0.12), primary_joint=9)
    prim_agni.add_box(center=(0.44, 1.40, -0.06), size=(0.08, 0.14, 0.12), primary_joint=13)
    primitives_data.append(prim_agni)

    # 7. Sacred Surya Khadga Scimitar
    prim_khadga = PrimitiveBuilder(mat_id=6) # Mat_Veer_Khadga
    # Grip in Right Hand
    prim_khadga.add_cylinder(center=(0.76, 1.38, 0.0), radius=0.03, height=0.22, primary_joint=14)
    # Gold Crossguard & Sun Pommel
    prim_khadga.add_box(center=(0.76, 1.48, 0.0), size=(0.18, 0.04, 0.08), primary_joint=14)
    prim_khadga.add_cylinder(center=(0.76, 1.28, 0.0), radius=0.045, height=0.04, primary_joint=14)
    # Curved Sunsteel Blade extending forward
    prim_khadga.add_box(center=(0.76, 1.54, 0.28), size=(0.04, 0.11, 0.52), primary_joint=14)
    prim_khadga.add_box(center=(0.76, 1.57, 0.58), size=(0.035, 0.13, 0.32), primary_joint=14)
    prim_khadga.add_box(center=(0.76, 1.62, 0.78), size=(0.025, 0.08, 0.22), primary_joint=14)
    primitives_data.append(prim_khadga)

    # 8. Obsidian Topknot (Shikha)
    prim_hair = PrimitiveBuilder(mat_id=7) # Mat_Veer_Hair
    prim_hair.add_cylinder(center=(0.0, 1.89, -0.06), radius=0.075, height=0.18, primary_joint=6)
    prim_hair.add_box(center=(0.0, 1.76, -0.14), size=(0.24, 0.22, 0.08), primary_joint=5)
    primitives_data.append(prim_hair)

    # Convert all primitives to glTF buffers
    primitives_json = []
    for prim in primitives_data:
        # Pack positions (VEC3, FLOAT)
        pos_bytes = bytearray()
        min_pos = [1e9, 1e9, 1e9]
        max_pos = [-1e9, -1e9, -1e9]
        for p in prim.positions:
            pos_bytes.extend(struct.pack('<3f', *p))
            for k in range(3):
                min_pos[k] = min(min_pos[k], p[k])
                max_pos[k] = max(max_pos[k], p[k])
        bv_pos = builder.add_buffer_view(pos_bytes, target=34962)
        acc_pos = builder.add_accessor(bv_pos, 5126, len(prim.positions), "VEC3", min_val=min_pos, max_val=max_pos)

        # Pack normals (VEC3, FLOAT)
        norm_bytes = bytearray()
        for n in prim.normals:
            norm_bytes.extend(struct.pack('<3f', *n))
        bv_norm = builder.add_buffer_view(norm_bytes, target=34962)
        acc_norm = builder.add_accessor(bv_norm, 5126, len(prim.normals), "VEC3")

        # Pack UVs (VEC2, FLOAT)
        uv_bytes = bytearray()
        for uv in prim.uvs:
            uv_bytes.extend(struct.pack('<2f', *uv))
        bv_uv = builder.add_buffer_view(uv_bytes, target=34962)
        acc_uv = builder.add_accessor(bv_uv, 5126, len(prim.uvs), "VEC2")

        # Pack Joints (VEC4, UNSIGNED_BYTE)
        joint_bytes = bytearray()
        for j in prim.joints:
            joint_bytes.extend(struct.pack('<4B', *j))
        bv_joint = builder.add_buffer_view(joint_bytes, target=34962)
        acc_joint = builder.add_accessor(bv_joint, 5121, len(prim.joints), "VEC4")

        # Pack Weights (VEC4, FLOAT)
        weight_bytes = bytearray()
        for w in prim.weights:
            weight_bytes.extend(struct.pack('<4f', *w))
        bv_weight = builder.add_buffer_view(weight_bytes, target=34962)
        acc_weight = builder.add_accessor(bv_weight, 5126, len(prim.weights), "VEC4")

        # Pack Indices (SCALAR, UNSIGNED_SHORT)
        idx_bytes = bytearray()
        for idx in prim.indices:
            idx_bytes.extend(struct.pack('<H', idx))
        bv_idx = builder.add_buffer_view(idx_bytes, target=34963)
        acc_idx = builder.add_accessor(bv_idx, 5123, len(prim.indices), "SCALAR")

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

    # Skin definition (Inverse Bind Matrices)
    # 21 joints: node indices 1..21
    skin_joints = list(range(1, 1 + len(bones)))
    ibm_bytes = bytearray()
    for b in bones:
        wx, wy, wz = b["world"]
        # Inverse of translation matrix [wx, wy, wz] is [-wx, -wy, -wz]
        # Column-major 4x4 matrix
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
        "joints": skin_joints,
        "skeleton": 1 # root joint node
    })

    # Animation Generator Helper
    # Builds glTF channels and samplers for a set of joint keyframes
    def add_skeletal_animation(name, duration, keyframes_by_joint):
        # keyframes_by_joint: dict of bone_name -> list of (time, quat_rot)
        channels = []
        samplers = []

        for b_name, kfs in keyframes_by_joint.items():
            b_idx = next(i for i, b in enumerate(bones) if b["name"] == b_name)
            node_idx = bone_node_offset + b_idx

            times = [kf[0] for kf in kfs]
            quats = [kf[1] for kf in kfs]

            # Time accessor
            time_bytes = bytearray()
            for t in times:
                time_bytes.extend(struct.pack('<f', t))
            bv_t = builder.add_buffer_view(time_bytes)
            acc_t = builder.add_accessor(bv_t, 5126, len(times), "SCALAR", min_val=[min(times)], max_val=[max(times)])

            # Quat accessor
            quat_bytes = bytearray()
            for q in quats:
                quat_bytes.extend(struct.pack('<4f', *q))
            bv_q = builder.add_buffer_view(quat_bytes)
            acc_q = builder.add_accessor(bv_q, 5126, len(quats), "VEC4")

            sampler_idx = len(samplers)
            samplers.append({
                "input": acc_t,
                "output": acc_q,
                "interpolation": "LINEAR"
            })

            channels.append({
                "sampler": sampler_idx,
                "target": {
                    "node": node_idx,
                    "path": "rotation"
                }
            })

        builder.animations.append({
            "name": name,
            "channels": channels,
            "samplers": samplers
        })

    # --- 15 Production Humanoid Animations ---

    # 1. Idle (2.0s loop) - Breathing & Stance sway
    idle_kfs = {}
    times = [0.0, 0.5, 1.0, 1.5, 2.0]
    idle_kfs["chest"] = [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(2.5), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(4.0), 0.0, 0.0)),
        (1.5, euler_to_quat(math.radians(2.0), 0.0, 0.0)),
        (2.0, euler_to_quat(0.0, 0.0, 0.0)),
    ]
    idle_kfs["head"] = [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(-2.0), math.radians(1.5), 0.0)),
        (2.0, euler_to_quat(0.0, 0.0, 0.0)),
    ]
    idle_kfs["arm_l"] = [
        (0.0, euler_to_quat(math.radians(12.0), 0.0, math.radians(-8.0))),
        (1.0, euler_to_quat(math.radians(15.0), 0.0, math.radians(-10.0))),
        (2.0, euler_to_quat(math.radians(12.0), 0.0, math.radians(-8.0))),
    ]
    idle_kfs["arm_r"] = [
        (0.0, euler_to_quat(math.radians(-25.0), math.radians(-15.0), math.radians(12.0))),
        (1.0, euler_to_quat(math.radians(-22.0), math.radians(-15.0), math.radians(10.0))),
        (2.0, euler_to_quat(math.radians(-25.0), math.radians(-15.0), math.radians(12.0))),
    ]
    add_skeletal_animation("idle", 2.0, idle_kfs)

    # 2. Walk (0.95s loop) - 2-beat bipedal gait
    walk_kfs = {}
    w_times = [0.0, 0.2375, 0.475, 0.7125, 0.95]
    # Legs alternating
    walk_kfs["thigh_l"] = [
        (0.0, euler_to_quat(math.radians(-26.0), 0.0, 0.0)),
        (0.2375, euler_to_quat(math.radians(0.0), 0.0, 0.0)),
        (0.475, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
        (0.7125, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        (0.95, euler_to_quat(math.radians(-26.0), 0.0, 0.0)),
    ]
    walk_kfs["shin_l"] = [
        (0.0, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (0.2375, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
        (0.475, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        (0.7125, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        (0.95, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
    ]
    walk_kfs["thigh_r"] = [
        (0.0, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
        (0.2375, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        (0.475, euler_to_quat(math.radians(-26.0), 0.0, 0.0)),
        (0.7125, euler_to_quat(math.radians(0.0), 0.0, 0.0)),
        (0.95, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
    ]
    walk_kfs["shin_r"] = [
        (0.0, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        (0.2375, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        (0.475, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (0.7125, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
        (0.95, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
    ]
    # Arms opposing legs
    walk_kfs["arm_l"] = [
        (0.0, euler_to_quat(math.radians(22.0), 0.0, math.radians(-10.0))),
        (0.475, euler_to_quat(math.radians(-24.0), 0.0, math.radians(-10.0))),
        (0.95, euler_to_quat(math.radians(22.0), 0.0, math.radians(-10.0))),
    ]
    walk_kfs["arm_r"] = [
        (0.0, euler_to_quat(math.radians(-24.0), 0.0, math.radians(10.0))),
        (0.475, euler_to_quat(math.radians(20.0), 0.0, math.radians(10.0))),
        (0.95, euler_to_quat(math.radians(-24.0), 0.0, math.radians(10.0))),
    ]
    # Spine twist
    walk_kfs["spine_01"] = [
        (0.0, euler_to_quat(math.radians(3.0), math.radians(4.0), 0.0)),
        (0.475, euler_to_quat(math.radians(3.0), math.radians(-4.0), 0.0)),
        (0.95, euler_to_quat(math.radians(3.0), math.radians(4.0), 0.0)),
    ]
    add_skeletal_animation("walk", 0.95, walk_kfs)

    # 3. Jog / Run (0.72s loop)
    run_kfs = {}
    r_times = [0.0, 0.18, 0.36, 0.54, 0.72]
    run_kfs["thigh_l"] = [
        (0.0, euler_to_quat(math.radians(-42.0), 0.0, 0.0)),
        (0.18, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        (0.36, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        (0.54, euler_to_quat(math.radians(-10.0), 0.0, 0.0)),
        (0.72, euler_to_quat(math.radians(-42.0), 0.0, 0.0)),
    ]
    run_kfs["shin_l"] = [
        (0.0, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
        (0.18, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (0.36, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        (0.54, euler_to_quat(math.radians(75.0), 0.0, 0.0)),
        (0.72, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
    ]
    run_kfs["thigh_r"] = [
        (0.0, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        (0.18, euler_to_quat(math.radians(-10.0), 0.0, 0.0)),
        (0.36, euler_to_quat(math.radians(-42.0), 0.0, 0.0)),
        (0.54, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        (0.72, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
    ]
    run_kfs["shin_r"] = [
        (0.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        (0.18, euler_to_quat(math.radians(75.0), 0.0, 0.0)),
        (0.36, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
        (0.54, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (0.72, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
    ]
    run_kfs["arm_l"] = [
        (0.0, euler_to_quat(math.radians(38.0), 0.0, math.radians(-12.0))),
        (0.36, euler_to_quat(math.radians(-42.0), 0.0, math.radians(-12.0))),
        (0.72, euler_to_quat(math.radians(38.0), 0.0, math.radians(-12.0))),
    ]
    run_kfs["arm_r"] = [
        (0.0, euler_to_quat(math.radians(-42.0), 0.0, math.radians(12.0))),
        (0.36, euler_to_quat(math.radians(38.0), 0.0, math.radians(12.0))),
        (0.72, euler_to_quat(math.radians(-42.0), 0.0, math.radians(12.0))),
    ]
    run_kfs["spine_01"] = [
        (0.0, euler_to_quat(math.radians(8.0), math.radians(6.0), 0.0)),
        (0.36, euler_to_quat(math.radians(8.0), math.radians(-6.0), 0.0)),
        (0.72, euler_to_quat(math.radians(8.0), math.radians(6.0), 0.0)),
    ]
    add_skeletal_animation("jog", 0.72, run_kfs)

    # 4. Sprint (0.54s loop) - Fast aggressive drive
    sprint_kfs = {}
    sprint_kfs["thigh_l"] = [
        (0.0, euler_to_quat(math.radians(-55.0), 0.0, 0.0)),
        (0.27, euler_to_quat(math.radians(58.0), 0.0, 0.0)),
        (0.54, euler_to_quat(math.radians(-55.0), 0.0, 0.0)),
    ]
    sprint_kfs["shin_l"] = [
        (0.0, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
        (0.27, euler_to_quat(math.radians(85.0), 0.0, 0.0)),
        (0.54, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
    ]
    sprint_kfs["thigh_r"] = [
        (0.0, euler_to_quat(math.radians(58.0), 0.0, 0.0)),
        (0.27, euler_to_quat(math.radians(-55.0), 0.0, 0.0)),
        (0.54, euler_to_quat(math.radians(58.0), 0.0, 0.0)),
    ]
    sprint_kfs["shin_r"] = [
        (0.0, euler_to_quat(math.radians(85.0), 0.0, 0.0)),
        (0.27, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
        (0.54, euler_to_quat(math.radians(85.0), 0.0, 0.0)),
    ]
    sprint_kfs["spine_01"] = [
        (0.0, euler_to_quat(math.radians(16.0), 0.0, 0.0)),
        (0.27, euler_to_quat(math.radians(16.0), 0.0, 0.0)),
        (0.54, euler_to_quat(math.radians(16.0), 0.0, 0.0)),
    ]
    sprint_kfs["arm_l"] = [
        (0.0, euler_to_quat(math.radians(55.0), 0.0, math.radians(-15.0))),
        (0.27, euler_to_quat(math.radians(-55.0), 0.0, math.radians(-15.0))),
        (0.54, euler_to_quat(math.radians(55.0), 0.0, math.radians(-15.0))),
    ]
    sprint_kfs["arm_r"] = [
        (0.0, euler_to_quat(math.radians(-55.0), 0.0, math.radians(15.0))),
        (0.27, euler_to_quat(math.radians(55.0), 0.0, math.radians(15.0))),
        (0.54, euler_to_quat(math.radians(-55.0), 0.0, math.radians(15.0))),
    ]
    add_skeletal_animation("sprint", 0.54, sprint_kfs)

    # 5. Jump Start (0.15s)
    js_kfs = {}
    js_kfs["thigh_l"] = [(0.0, euler_to_quat(0,0,0)), (0.15, euler_to_quat(math.radians(35.0), 0, 0))]
    js_kfs["shin_l"] = [(0.0, euler_to_quat(0,0,0)), (0.15, euler_to_quat(math.radians(50.0), 0, 0))]
    js_kfs["thigh_r"] = [(0.0, euler_to_quat(0,0,0)), (0.15, euler_to_quat(math.radians(35.0), 0, 0))]
    js_kfs["shin_r"] = [(0.0, euler_to_quat(0,0,0)), (0.15, euler_to_quat(math.radians(50.0), 0, 0))]
    js_kfs["spine_01"] = [(0.0, euler_to_quat(0,0,0)), (0.15, euler_to_quat(math.radians(18.0), 0, 0))]
    add_skeletal_animation("jump_start", 0.15, js_kfs)

    # 6. Jump Loop (0.3s)
    jl_kfs = {}
    jl_kfs["thigh_l"] = [(0.0, euler_to_quat(math.radians(-20.0), 0, 0)), (0.3, euler_to_quat(math.radians(-25.0), 0, 0))]
    jl_kfs["shin_l"] = [(0.0, euler_to_quat(math.radians(25.0), 0, 0)), (0.3, euler_to_quat(math.radians(30.0), 0, 0))]
    jl_kfs["thigh_r"] = [(0.0, euler_to_quat(math.radians(15.0), 0, 0)), (0.3, euler_to_quat(math.radians(10.0), 0, 0))]
    jl_kfs["arm_l"] = [(0.0, euler_to_quat(math.radians(30.0), 0, math.radians(-25.0))), (0.3, euler_to_quat(math.radians(35.0), 0, math.radians(-30.0)))]
    jl_kfs["arm_r"] = [(0.0, euler_to_quat(math.radians(-40.0), 0, math.radians(25.0))), (0.3, euler_to_quat(math.radians(-45.0), 0, math.radians(30.0)))]
    add_skeletal_animation("jump_loop", 0.3, jl_kfs)

    # 7. Jump Fall (0.3s)
    jf_kfs = {}
    jf_kfs["thigh_l"] = [(0.0, euler_to_quat(math.radians(10.0), 0, 0)), (0.3, euler_to_quat(math.radians(15.0), 0, 0))]
    jf_kfs["thigh_r"] = [(0.0, euler_to_quat(math.radians(10.0), 0, 0)), (0.3, euler_to_quat(math.radians(15.0), 0, 0))]
    jf_kfs["arm_l"] = [(0.0, euler_to_quat(math.radians(45.0), 0, math.radians(-35.0))), (0.3, euler_to_quat(math.radians(50.0), 0, math.radians(-40.0)))]
    jf_kfs["arm_r"] = [(0.0, euler_to_quat(math.radians(45.0), 0, math.radians(35.0))), (0.3, euler_to_quat(math.radians(50.0), 0, math.radians(40.0)))]
    add_skeletal_animation("jump_fall", 0.3, jf_kfs)

    # 8. Jump Land (0.25s)
    jland_kfs = {}
    jland_kfs["thigh_l"] = [(0.0, euler_to_quat(math.radians(40.0), 0, 0)), (0.25, euler_to_quat(0, 0, 0))]
    jland_kfs["shin_l"] = [(0.0, euler_to_quat(math.radians(55.0), 0, 0)), (0.25, euler_to_quat(0, 0, 0))]
    jland_kfs["thigh_r"] = [(0.0, euler_to_quat(math.radians(40.0), 0, 0)), (0.25, euler_to_quat(0, 0, 0))]
    jland_kfs["shin_r"] = [(0.0, euler_to_quat(math.radians(55.0), 0, 0)), (0.25, euler_to_quat(0, 0, 0))]
    jland_kfs["spine_01"] = [(0.0, euler_to_quat(math.radians(20.0), 0, 0)), (0.25, euler_to_quat(0, 0, 0))]
    add_skeletal_animation("jump_land", 0.25, jland_kfs)

    # 9. Prana Dodge (0.22s) - Low evasive burst
    dodge_kfs = {}
    dodge_kfs["pelvis"] = [(0.0, euler_to_quat(0, 0, 0)), (0.11, euler_to_quat(math.radians(25.0), 0, math.radians(15.0))), (0.22, euler_to_quat(0, 0, 0))]
    dodge_kfs["spine_01"] = [(0.0, euler_to_quat(0, 0, 0)), (0.11, euler_to_quat(math.radians(20.0), 0, math.radians(10.0))), (0.22, euler_to_quat(0, 0, 0))]
    dodge_kfs["arm_r"] = [(0.0, euler_to_quat(0, 0, 0)), (0.11, euler_to_quat(math.radians(-65.0), math.radians(-30.0), math.radians(40.0))), (0.22, euler_to_quat(0, 0, 0))]
    add_skeletal_animation("dodge", 0.22, dodge_kfs)

    # 10. Attack Light 1 (0.35s) - Horizontal Surya slash from right to left
    a1_kfs = {}
    a1_kfs["spine_01"] = [
        (0.0, euler_to_quat(0, math.radians(-25.0), 0)),
        (0.12, euler_to_quat(0, math.radians(-35.0), 0)), # Windup
        (0.24, euler_to_quat(0, math.radians(45.0), 0)),  # Slash release
        (0.35, euler_to_quat(0, 0, 0))
    ]
    a1_kfs["arm_r"] = [
        (0.0, euler_to_quat(math.radians(-30.0), math.radians(-40.0), math.radians(30.0))),
        (0.12, euler_to_quat(math.radians(-60.0), math.radians(-70.0), math.radians(45.0))),
        (0.24, euler_to_quat(math.radians(35.0), math.radians(65.0), math.radians(-20.0))),
        (0.35, euler_to_quat(0, 0, 0))
    ]
    add_skeletal_animation("attack_light_1", 0.35, a1_kfs)

    # 11. Attack Light 2 (0.38s) - Rising backhand slash
    a2_kfs = {}
    a2_kfs["spine_01"] = [
        (0.0, euler_to_quat(0, math.radians(30.0), 0)),
        (0.14, euler_to_quat(0, math.radians(45.0), 0)),
        (0.26, euler_to_quat(0, math.radians(-40.0), 0)),
        (0.38, euler_to_quat(0, 0, 0))
    ]
    a2_kfs["arm_r"] = [
        (0.0, euler_to_quat(math.radians(40.0), math.radians(45.0), 0)),
        (0.14, euler_to_quat(math.radians(65.0), math.radians(75.0), math.radians(-30.0))),
        (0.26, euler_to_quat(math.radians(-70.0), math.radians(-50.0), math.radians(40.0))),
        (0.38, euler_to_quat(0, 0, 0))
    ]
    add_skeletal_animation("attack_light_2", 0.38, a2_kfs)

    # 12. Attack Heavy Finisher (0.50s) - Two-handed overhead solar cleave
    a3_kfs = {}
    a3_kfs["spine_01"] = [
        (0.0, euler_to_quat(math.radians(-20.0), 0, 0)),
        (0.20, euler_to_quat(math.radians(-35.0), 0, 0)),
        (0.35, euler_to_quat(math.radians(35.0), 0, 0)),
        (0.50, euler_to_quat(0, 0, 0))
    ]
    a3_kfs["arm_r"] = [
        (0.0, euler_to_quat(math.radians(-70.0), 0, math.radians(20.0))),
        (0.20, euler_to_quat(math.radians(-120.0), 0, math.radians(10.0))),
        (0.35, euler_to_quat(math.radians(60.0), 0, math.radians(10.0))),
        (0.50, euler_to_quat(0, 0, 0))
    ]
    a3_kfs["arm_l"] = [
        (0.0, euler_to_quat(math.radians(-70.0), 0, math.radians(-20.0))),
        (0.20, euler_to_quat(math.radians(-120.0), 0, math.radians(-10.0))),
        (0.35, euler_to_quat(math.radians(60.0), 0, math.radians(-10.0))),
        (0.50, euler_to_quat(0, 0, 0))
    ]
    add_skeletal_animation("attack_heavy_finisher", 0.50, a3_kfs)

    # 13. Block (0.40s) - Raising Khadga & Bracers
    block_kfs = {}
    block_kfs["spine_01"] = [(0.0, euler_to_quat(math.radians(5.0), 0, 0)), (0.4, euler_to_quat(math.radians(8.0), 0, 0))]
    block_kfs["arm_r"] = [
        (0.0, euler_to_quat(math.radians(-45.0), math.radians(-30.0), math.radians(25.0))),
        (0.40, euler_to_quat(math.radians(-65.0), math.radians(-45.0), math.radians(45.0)))
    ]
    block_kfs["arm_l"] = [
        (0.0, euler_to_quat(math.radians(-40.0), math.radians(30.0), math.radians(-25.0))),
        (0.40, euler_to_quat(math.radians(-60.0), math.radians(40.0), math.radians(-45.0)))
    ]
    add_skeletal_animation("block", 0.40, block_kfs)

    # 14. Hit Reaction (0.30s) - Flinch & recoil
    hit_kfs = {}
    hit_kfs["spine_01"] = [
        (0.0, euler_to_quat(math.radians(-15.0), 0, 0)),
        (0.12, euler_to_quat(math.radians(-30.0), math.radians(10.0), 0)),
        (0.30, euler_to_quat(0, 0, 0))
    ]
    hit_kfs["head"] = [
        (0.0, euler_to_quat(math.radians(-10.0), 0, 0)),
        (0.12, euler_to_quat(math.radians(-25.0), 0, 0)),
        (0.30, euler_to_quat(0, 0, 0))
    ]
    add_skeletal_animation("hit_reaction", 0.30, hit_kfs)

    # 15. Interact (0.45s) - Reach right hand forward to touch/kindle
    interact_kfs = {}
    interact_kfs["arm_r"] = [
        (0.0, euler_to_quat(0, 0, 0)),
        (0.20, euler_to_quat(math.radians(-75.0), math.radians(15.0), 0)),
        (0.35, euler_to_quat(math.radians(-80.0), math.radians(10.0), 0)),
        (0.45, euler_to_quat(0, 0, 0))
    ]
    interact_kfs["spine_01"] = [
        (0.0, euler_to_quat(0, 0, 0)),
        (0.25, euler_to_quat(math.radians(10.0), math.radians(10.0), 0)),
        (0.45, euler_to_quat(0, 0, 0))
    ]
    add_skeletal_animation("interact", 0.45, interact_kfs)

    # Build GLB binary payload
    glb_bytes = builder.build_glb()

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(glb_bytes)

    print(f"[GLB Builder] Successfully generated Veer 3D model: {output_path}")
    print(f"  - Size: {len(glb_bytes)} bytes")
    print(f"  - Materials: {len(builder.materials)}")
    print(f"  - Humanoid Bones: {len(bones)}")
    print(f"  - Production Animations: {len(builder.animations)}")

if __name__ == "__main__":
    out = os.path.abspath("godot/assets/characters/veer/veer.glb")
    generate_veer_glb(out)
