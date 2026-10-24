#!/usr/bin/env python3
"""
Generate 3D Production Assets for Chapter VII: Realm of Satyaloka / Brahmaloka (The Transcendent Apex & Cosmic Wheel)
Produces clean glTF 2.0 binary (.glb) files with PBR materials and normals:
- moksha_seraph.glb (Floating multi-winged celestial attendant of Brahman with radiant halo)
- dharma_sentinel.glb (Transcendent crystalline guardian with radiant spear and lotus shield)
- boss_brahma_avatara.glb (Colossal 4.5m Supreme Creator Titan with four-faced crown and Dharmachakra wheel)
- cosmic_dharmachakra.glb (Majestic 6.0m rotating golden 24-spoke Wheel of Law / Kalachakra)
- thousand_petal_lotus.glb (Expansive iridescent crystalline lotus dais with layered petals)
- moksha_mahapeetham.glb (Supreme Diamond Altar of Satyaloka holding the Primal Source Spark)
"""

import os
import sys
import math
import json
import struct

def align4(b: bytearray) -> bytearray:
    while len(b) % 4 != 0:
        b.append(0)
    return b

def create_glb(meshes_data):
    bin_buffer = bytearray()
    buffer_views = []
    accessors = []
    materials = []
    primitives = []
    nodes = []
    scene_nodes = []

    for idx, m in enumerate(meshes_data):
        pos_bytes = bytearray()
        min_p = [float('inf')]*3
        max_p = [float('-inf')]*3
        for p in m['positions']:
            pos_bytes.extend(struct.pack('<fff', p[0], p[1], p[2]))
            for i in range(3):
                min_p[i] = min(min_p[i], p[i])
                max_p[i] = max(max_p[i], p[i])
        align4(pos_bytes)
        pos_offset = len(bin_buffer)
        bin_buffer.extend(pos_bytes)

        norm_bytes = bytearray()
        for n in m['normals']:
            norm_bytes.extend(struct.pack('<fff', n[0], n[1], n[2]))
        align4(norm_bytes)
        norm_offset = len(bin_buffer)
        bin_buffer.extend(norm_bytes)

        idx_bytes = bytearray()
        min_idx = min(m['indices']) if m['indices'] else 0
        max_idx = max(m['indices']) if m['indices'] else 0
        for i in m['indices']:
            idx_bytes.extend(struct.pack('<H', i))
        align4(idx_bytes)
        idx_offset = len(bin_buffer)
        bin_buffer.extend(idx_bytes)

        # BufferViews
        bv_pos_idx = len(buffer_views)
        buffer_views.append({'buffer': 0, 'byteOffset': pos_offset, 'byteLength': len(pos_bytes), 'target': 34962})
        bv_norm_idx = len(buffer_views)
        buffer_views.append({'buffer': 0, 'byteOffset': norm_offset, 'byteLength': len(norm_bytes), 'target': 34962})
        bv_idx_idx = len(buffer_views)
        buffer_views.append({'buffer': 0, 'byteOffset': idx_offset, 'byteLength': len(idx_bytes), 'target': 34963})

        # Accessors
        acc_pos_idx = len(accessors)
        accessors.append({
            'bufferView': bv_pos_idx, 'byteOffset': 0,
            'componentType': 5126, 'count': len(m['positions']),
            'type': 'VEC3', 'min': min_p, 'max': max_p
        })
        acc_norm_idx = len(accessors)
        accessors.append({
            'bufferView': bv_norm_idx, 'byteOffset': 0,
            'componentType': 5126, 'count': len(m['normals']),
            'type': 'VEC3'
        })
        acc_idx_idx = len(accessors)
        accessors.append({
            'bufferView': bv_idx_idx, 'byteOffset': 0,
            'componentType': 5123, 'count': len(m['indices']),
            'type': 'SCALAR', 'min': [min_idx], 'max': [max_idx]
        })

        # Material
        mat_def = m.get('material', {})
        mat_idx = len(materials)
        materials.append({
            'name': mat_def.get('name', f"Mat_{m['name']}"),
            'pbrMetallicRoughness': {
                'baseColorFactor': mat_def.get('base_color', [0.95, 0.92, 0.85, 1.0]),
                'metallicFactor': mat_def.get('metallic', 0.5),
                'roughnessFactor': mat_def.get('roughness', 0.3)
            },
            'emissiveFactor': mat_def.get('emissive', [0.0, 0.0, 0.0])
        })

        primitives.append({
            'attributes': {'POSITION': acc_pos_idx, 'NORMAL': acc_norm_idx},
            'indices': acc_idx_idx,
            'material': mat_idx
        })

    mesh_obj = {'name': 'SatyaMesh', 'primitives': primitives}
    nodes.append({'name': 'RootNode', 'mesh': 0})
    scene_nodes.append(0)

    gltf_dict = {
        'asset': {'version': '2.0', 'generator': 'Mythos Satyaloka Brahmaloka Pipeline'},
        'scenes': [{'nodes': scene_nodes}],
        'scene': 0,
        'nodes': nodes,
        'meshes': [mesh_obj],
        'materials': materials,
        'accessors': accessors,
        'bufferViews': buffer_views,
        'buffers': [{'byteLength': len(bin_buffer)}]
    }

    json_bytes = bytearray(json.dumps(gltf_dict, separators=(',', ':')).encode('utf-8'))
    while len(json_bytes) % 4 != 0:
        json_bytes.extend(b' ')

    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_buffer)
    glb_header = struct.pack('<4sII', b'glTF', 2, total_len)
    json_chunk_hdr = struct.pack('<II', len(json_bytes), 0x4E4F534A)
    bin_chunk_hdr = struct.pack('<II', len(bin_buffer), 0x004E4942)

    return glb_header + json_chunk_hdr + json_bytes + bin_chunk_hdr + bin_buffer

def add_cylinder(positions, normals, indices, r_top, r_bot, height, segs=8, offset=(0,0,0)):
    base_idx = len(positions)
    half_h = height * 0.5
    for s in range(segs):
        ang = 2.0 * math.pi * s / segs
        ca, sa = math.cos(ang), math.sin(ang)
        positions.append((offset[0] + r_top * ca, offset[1] + half_h, offset[2] + r_top * sa))
        normals.append((ca, 0.0, sa))
        positions.append((offset[0] + r_bot * ca, offset[1] - half_h, offset[2] + r_bot * sa))
        normals.append((ca, 0.0, sa))
    for s in range(segs):
        p0 = base_idx + s * 2
        p1 = base_idx + s * 2 + 1
        p2 = base_idx + ((s + 1) % segs) * 2
        p3 = base_idx + ((s + 1) % segs) * 2 + 1
        indices.extend([p0, p1, p2, p2, p1, p3])

def add_box(positions, normals, indices, size=(1,1,1), offset=(0,0,0)):
    hx, hy, hz = size[0]*0.5, size[1]*0.5, size[2]*0.5
    ox, oy, oz = offset

    corners = [
        # Front (+Z)
        ((ox-hx, oy-hy, oz+hz), (ox+hx, oy-hy, oz+hz), (ox+hx, oy+hy, oz+hz), (ox-hx, oy+hy, oz+hz), (0, 0, 1)),
        # Back (-Z)
        ((ox+hx, oy-hy, oz-hz), (ox-hx, oy-hy, oz-hz), (ox-hx, oy+hy, oz-hz), (ox+hx, oy+hy, oz-hz), (0, 0, -1)),
        # Top (+Y)
        ((ox-hx, oy+hy, oz+hz), (ox+hx, oy+hy, oz+hz), (ox+hx, oy+hy, oz-hz), (ox-hx, oy+hy, oz-hz), (0, 1, 0)),
        # Bottom (-Y)
        ((ox-hx, oy-hy, oz-hz), (ox+hx, oy-hy, oz-hz), (ox+hx, oy-hy, oz+hz), (ox-hx, oy-hy, oz+hz), (0, -1, 0)),
        # Right (+X)
        ((ox+hx, oy-hy, oz+hz), (ox+hx, oy-hy, oz-hz), (ox+hx, oy+hy, oz-hz), (ox+hx, oy+hy, oz+hz), (1, 0, 0)),
        # Left (-X)
        ((ox-hx, oy-hy, oz-hz), (ox-hx, oy-hy, oz+hz), (ox-hx, oy+hy, oz+hz), (ox-hx, oy+hy, oz-hz), (-1, 0, 0)),
    ]

    for face in corners:
        f_idx = len(positions)
        norm = face[4]
        for p in face[:4]:
            positions.append(p)
            normals.append(norm)
        indices.extend([f_idx, f_idx+1, f_idx+2, f_idx, f_idx+2, f_idx+3])

def add_pyramid(positions, normals, indices, b_w, b_d, height, offset=(0,0,0)):
    hw, hd = b_w * 0.5, b_d * 0.5
    ox, oy, oz = offset
    tip = (ox, oy + height, oz)

    faces = [
        ((ox-hw, oy, oz+hd), (ox+hw, oy, oz+hd), tip),
        ((ox+hw, oy, oz+hd), (ox+hw, oy, oz-hd), tip),
        ((ox+hw, oy, oz-hd), (ox-hw, oy, oz-hd), tip),
        ((ox-hw, oy, oz-hd), (ox-hw, oy, oz+hd), tip),
    ]

    for f in faces:
        idx = len(positions)
        v0, v1, v2 = f
        ax, ay, az = v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2]
        bx, by, bz = v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]
        nx = ay*bz - az*by
        ny = az*bx - ax*bz
        nz = ax*by - ay*bx
        length = math.sqrt(nx*nx + ny*ny + nz*nz) or 1.0
        norm = (nx/length, ny/length, nz/length)

        positions.extend([v0, v1, v2])
        normals.extend([norm, norm, norm])
        indices.extend([idx, idx+1, idx+2])

def add_disk(positions, normals, indices, radius, height, segs=16, offset=(0,0,0)):
    add_cylinder(positions, normals, indices, radius, radius, height, segs, offset)

def add_torus(positions, normals, indices, r_major, r_minor, segs_maj=16, segs_min=6, offset=(0,0,0)):
    base_idx = len(positions)
    ox, oy, oz = offset
    for i in range(segs_maj):
        u = 2.0 * math.pi * i / segs_maj
        cu, su = math.cos(u), math.sin(u)
        for j in range(segs_min):
            v = 2.0 * math.pi * j / segs_min
            cv, sv = math.cos(v), math.sin(v)
            x = ox + (r_major + r_minor * cv) * cu
            y = oy + r_minor * sv
            z = oz + (r_major + r_minor * cv) * su
            positions.append((x, y, z))
            normals.append((cv * cu, sv, cv * su))
    for i in range(segs_maj):
        i_next = (i + 1) % segs_maj
        for j in range(segs_min):
            j_next = (j + 1) % segs_min
            p0 = base_idx + i * segs_min + j
            p1 = base_idx + i_next * segs_min + j
            p2 = base_idx + i_next * segs_min + j_next
            p3 = base_idx + i * segs_min + j_next
            indices.extend([p0, p1, p2, p0, p2, p3])

# -------------------------------------------------------------------------
# Asset 1: moksha_seraph.glb (Floating Multi-Winged Celestial Attendant)
# -------------------------------------------------------------------------
def generate_moksha_seraph():
    meshes = []

    # 1. Radiant Translucent Body & Robes
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.28, 0.45, 0.9, 8, (0, 0.7, 0)) # Slender robed torso
    add_cylinder(pos, norm, idx, 0.16, 0.14, 0.28, 8, (0, 1.25, 0)) # Head
    meshes.append({
        'name': 'SeraphBody',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'PearlRobes', 'base_color': [0.95, 0.96, 1.0, 1.0], 'metallic': 0.3, 'roughness': 0.2}
    })

    # 2. Four Crystalline Celestial Wings
    pos2, norm2, idx2 = [], [], []
    # Upper left wing
    add_pyramid(pos2, norm2, idx2, 0.2, 0.04, 0.9, (-0.45, 1.1, -0.1))
    # Upper right wing
    add_pyramid(pos2, norm2, idx2, 0.2, 0.04, 0.9, (0.45, 1.1, -0.1))
    # Lower left wing
    add_pyramid(pos2, norm2, idx2, 0.18, 0.04, 0.7, (-0.38, 0.5, -0.1))
    # Lower right wing
    add_pyramid(pos2, norm2, idx2, 0.18, 0.04, 0.7, (0.38, 0.5, -0.1))
    meshes.append({
        'name': 'CrystallineWings',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'PrismaticWings', 'base_color': [0.85, 0.95, 1.0, 1.0], 'metallic': 0.8, 'roughness': 0.1, 'emissive': [0.3, 0.6, 0.9]}
    })

    # 3. Golden Halo Ring & Levitating Source Gem
    pos3, norm3, idx3 = [], [], []
    add_torus(pos3, norm3, idx3, 0.38, 0.025, 12, 6, (0, 1.35, -0.05)) # Golden crown halo
    add_pyramid(pos3, norm3, idx3, 0.1, 0.1, 0.2, (0, 0.8, 0.3)) # Floating focal jewel
    meshes.append({
        'name': 'SeraphHalo',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'GoldHalo', 'base_color': [1.0, 0.9, 0.45, 1.0], 'metallic': 0.9, 'roughness': 0.15, 'emissive': [0.8, 0.7, 0.2]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 2: dharma_sentinel.glb (Transcendent Crystalline Guardian)
# -------------------------------------------------------------------------
def generate_dharma_sentinel():
    meshes = []

    # 1. White-Gold Marble Cuirass & Greaves
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, (0.75, 0.95, 0.45), (0, 1.2, 0)) # Cuirass
    add_cylinder(pos, norm, idx, 0.18, 0.14, 0.75, 8, (-0.24, 0.45, 0)) # Left leg
    add_cylinder(pos, norm, idx, 0.18, 0.14, 0.75, 8, (0.24, 0.45, 0))  # Right leg
    add_cylinder(pos, norm, idx, 0.14, 0.12, 0.65, 8, (-0.48, 1.25, 0)) # Left arm
    add_cylinder(pos, norm, idx, 0.14, 0.12, 0.65, 8, (0.48, 1.25, 0))  # Right arm
    add_cylinder(pos, norm, idx, 0.22, 0.22, 0.35, 8, (0, 1.8, 0))     # Helm
    meshes.append({
        'name': 'SentinelArmor',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'WhiteGoldMarble', 'base_color': [0.95, 0.92, 0.82, 1.0], 'metallic': 0.6, 'roughness': 0.3}
    })

    # 2. Celestial Radiant Spear (2.6m golden shaft with diamond tip)
    pos2, norm2, idx2 = [], [], []
    add_cylinder(pos2, norm2, idx2, 0.035, 0.035, 2.6, 6, (0.58, 1.3, 0.3))
    add_pyramid(pos2, norm2, idx2, 0.16, 0.06, 0.5, (0.58, 2.6, 0.3))
    meshes.append({
        'name': 'RadiantSpear',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'SpearTipGold', 'base_color': [1.0, 0.9, 0.35, 1.0], 'metallic': 0.9, 'roughness': 0.1, 'emissive': [0.7, 0.6, 0.15]}
    })

    # 3. 8-Petal Lotus Shield
    pos3, norm3, idx3 = [], [], []
    add_disk(pos3, norm3, idx3, 0.48, 0.06, 12, (-0.55, 1.2, 0.2)) # Shield disc
    for p in range(8):
        ang = p * math.pi * 0.25
        ca, sa = math.cos(ang), math.sin(ang)
        add_pyramid(pos3, norm3, idx3, 0.14, 0.08, 0.18, (-0.55 + ca * 0.38, 1.2, 0.2 + sa * 0.38))
    meshes.append({
        'name': 'LotusShield',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'LotusShieldGold', 'base_color': [0.95, 0.85, 0.4, 1.0], 'metallic': 0.85, 'roughness': 0.2, 'emissive': [0.4, 0.35, 0.1]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 3: boss_brahma_avatara.glb (Colossal 4.5m Supreme Creator Titan)
# -------------------------------------------------------------------------
def generate_boss_brahma_avatara():
    meshes = []

    # 1. Colossal Four-Faced Regal Titan Body
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.8, 1.2, 2.2, 12, (0, 1.6, 0)) # Grand majestic torso
    add_cylinder(pos, norm, idx, 0.4, 0.35, 1.6, 8, (-1.1, 2.2, 0.2)) # Left arm 1
    add_cylinder(pos, norm, idx, 0.4, 0.35, 1.6, 8, (1.1, 2.2, 0.2))  # Right arm 1
    add_cylinder(pos, norm, idx, 0.35, 0.3, 1.4, 8, (-0.95, 1.8, -0.3)) # Left arm 2
    add_cylinder(pos, norm, idx, 0.35, 0.3, 1.4, 8, (0.95, 1.8, -0.3))  # Right arm 2
    meshes.append({
        'name': 'BrahmaTorso',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'SupremeBrahmaCloth', 'base_color': [0.92, 0.88, 0.78, 1.0], 'metallic': 0.45, 'roughness': 0.35}
    })

    # 2. Four Heads & High Golden Mukuta Crowns (North, East, South, West)
    pos2, norm2, idx2 = [], [], []
    for face in range(4):
        ang = face * math.pi * 0.5
        ca, sa = math.cos(ang), math.sin(ang)
        add_cylinder(pos2, norm2, idx2, 0.24, 0.22, 0.45, 6, (ca * 0.3, 3.0, sa * 0.3)) # Head
        add_pyramid(pos2, norm2, idx2, 0.28, 0.28, 0.6, (ca * 0.3, 3.45, sa * 0.3))     # Mukuta Crown
    meshes.append({
        'name': 'FourHeadsCrown',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'DivineGoldMukuta', 'base_color': [1.0, 0.85, 0.35, 1.0], 'metallic': 0.9, 'roughness': 0.15, 'emissive': [0.5, 0.4, 0.1]}
    })

    # 3. Rotating Dharmachakra Wheel Halo & 4 Brahmic Staves
    pos3, norm3, idx3 = [], [], []
    add_torus(pos3, norm3, idx3, 1.8, 0.065, 20, 6, (0, 2.8, -0.5)) # Cosmic wheel halo
    # 8 Spokes inside halo
    for sp in range(8):
        ang = sp * math.pi * 0.25
        ca, sa = math.cos(ang), math.sin(ang)
        add_cylinder(pos3, norm3, idx3, 0.03, 0.03, 1.75, 6, (ca * 0.85, 2.8 + sa * 0.85, -0.5))
    # Brahmic Staff of Creation in primary hand
    add_cylinder(pos3, norm3, idx3, 0.05, 0.05, 3.2, 6, (1.35, 2.0, 0.4))
    add_pyramid(pos3, norm3, idx3, 0.25, 0.25, 0.45, (1.35, 3.6, 0.4))
    meshes.append({
        'name': 'DharmachakraAndStaff',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'CosmicWheelGold', 'base_color': [1.0, 0.95, 0.5, 1.0], 'metallic': 0.95, 'roughness': 0.1, 'emissive': [0.8, 0.7, 0.3]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 4: cosmic_dharmachakra.glb (Majestic 6.0m Wheel of Law)
# -------------------------------------------------------------------------
def generate_cosmic_dharmachakra():
    meshes = []

    # 1. Outer & Inner Wheel Rims
    pos, norm, idx = [], [], []
    add_torus(pos, norm, idx, 3.0, 0.12, 24, 8, (0, 3.2, 0)) # Outer tire ring
    add_torus(pos, norm, idx, 1.0, 0.08, 16, 6, (0, 3.2, 0)) # Hub ring
    add_cylinder(pos, norm, idx, 0.6, 0.6, 0.3, 10, (0, 3.2, 0)) # Central axle hub
    meshes.append({
        'name': 'WheelRim',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'WheelGildedGold', 'base_color': [0.95, 0.82, 0.3, 1.0], 'metallic': 0.85, 'roughness': 0.2}
    })

    # 2. 24 Cosmic Spokes of Dharma
    pos2, norm2, idx2 = [], [], []
    for s in range(24):
        ang = s * (2.0 * math.pi / 24.0)
        ca, sa = math.cos(ang), math.sin(ang)
        # Spoke between hub and outer ring
        add_cylinder(pos2, norm2, idx2, 0.035, 0.035, 2.0, 6, (ca * 2.0, 3.2, sa * 2.0))
    meshes.append({
        'name': 'WheelSpokes',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'SpokesGold', 'base_color': [1.0, 0.9, 0.45, 1.0], 'metallic': 0.9, 'roughness': 0.15}
    })

    # 3. Radiant Kalachakra Core & Pedestal Mount
    pos3, norm3, idx3 = [], [], []
    add_box(pos3, norm3, idx3, (1.8, 0.5, 1.2), (0, 0.25, 0)) # Pedestal plinth
    add_cylinder(pos3, norm3, idx3, 0.25, 0.35, 2.6, 8, (0, 1.6, 0)) # Axle support column
    add_disk(pos3, norm3, idx3, 0.5, 0.15, 12, (0, 3.2, 0)) # Glowing central Kalachakra core
    meshes.append({
        'name': 'WheelHubAndMount',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'KalachakraCore', 'base_color': [1.0, 0.95, 0.7, 1.0], 'metallic': 0.95, 'roughness': 0.1, 'emissive': [0.9, 0.85, 0.5]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 5: thousand_petal_lotus.glb (Crystalline Lotus Dais)
# -------------------------------------------------------------------------
def generate_thousand_petal_lotus():
    meshes = []

    # 1. Tiered Stepped Lotus Dais
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 2.8, 3.2, 0.3, 12, (0, 0.15, 0)) # Tier 1 plinth
    add_cylinder(pos, norm, idx, 2.2, 2.5, 0.3, 12, (0, 0.45, 0)) # Tier 2 plinth
    add_cylinder(pos, norm, idx, 1.6, 1.9, 0.3, 12, (0, 0.75, 0)) # Tier 3 plinth
    meshes.append({
        'name': 'LotusPlinth',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'WhiteMarbleLotus', 'base_color': [0.94, 0.94, 0.96, 1.0], 'metallic': 0.2, 'roughness': 0.3}
    })

    # 2. Concentric Lotus Petals (Inner & Outer Rings)
    pos2, norm2, idx2 = [], [], []
    # Outer ring: 12 petals
    for p in range(12):
        ang = p * (2.0 * math.pi / 12.0)
        ca, sa = math.cos(ang), math.sin(ang)
        add_pyramid(pos2, norm2, idx2, 0.6, 0.35, 0.45, (ca * 1.8, 0.9, sa * 1.8))
    # Inner ring: 8 petals
    for p in range(8):
        ang = p * (2.0 * math.pi / 8.0)
        ca, sa = math.cos(ang), math.sin(ang)
        add_pyramid(pos2, norm2, idx2, 0.5, 0.3, 0.4, (ca * 1.1, 1.05, sa * 1.1))
    meshes.append({
        'name': 'LotusPetals',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'MotherOfPearlPetals', 'base_color': [0.98, 0.92, 0.88, 1.0], 'metallic': 0.7, 'roughness': 0.25}
    })

    # 3. Radiant Center Lotus Socket
    pos3, norm3, idx3 = [], [], []
    add_cylinder(pos3, norm3, idx3, 0.6, 0.5, 0.25, 8, (0, 1.1, 0))
    add_torus(pos3, norm3, idx3, 0.75, 0.03, 16, 6, (0, 1.2, 0))
    meshes.append({
        'name': 'LotusSocket',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'LotusSocketGold', 'base_color': [1.0, 0.85, 0.3, 1.0], 'metallic': 0.9, 'roughness': 0.15, 'emissive': [0.5, 0.45, 0.15]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 6: moksha_mahapeetham.glb (Supreme Diamond Altar of Satyaloka)
# -------------------------------------------------------------------------
def generate_moksha_mahapeetham():
    meshes = []

    # 1. Octagonal Diamond Plinth Base
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 2.6, 3.0, 0.4, 8, (0, 0.2, 0)) # Base tier
    add_cylinder(pos, norm, idx, 2.0, 2.3, 0.4, 8, (0, 0.6, 0)) # Mid tier
    add_cylinder(pos, norm, idx, 1.5, 1.7, 0.4, 8, (0, 1.0, 0)) # Top tier
    meshes.append({
        'name': 'MahapeethamBase',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'CrystallineDiamondPlinth', 'base_color': [0.92, 0.96, 1.0, 1.0], 'metallic': 0.5, 'roughness': 0.25}
    })

    # 2. Four Sacred Guardians Statues around Altar
    pos2, norm2, idx2 = [], [], []
    for g in range(4):
        ang = g * math.pi * 0.5
        ca, sa = math.cos(ang), math.sin(ang)
        add_cylinder(pos2, norm2, idx2, 0.22, 0.25, 1.2, 6, (ca * 1.8, 1.6, sa * 1.8))
        add_pyramid(pos2, norm2, idx2, 0.3, 0.3, 0.4, (ca * 1.8, 2.4, sa * 1.8))
    meshes.append({
        'name': 'GuardianPillars',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'GuardianGoldPillars', 'base_color': [0.95, 0.85, 0.35, 1.0], 'metallic': 0.85, 'roughness': 0.2}
    })

    # 3. The Primal Source Spark of Brahman (Transcendent Octahedral Core)
    pos3, norm3, idx3 = [], [], []
    add_pyramid(pos3, norm3, idx3, 0.65, 0.65, 0.6, (0, 1.9, 0))
    # Inverted lower half
    hw = 0.325
    tip = (0, 1.3, 0)
    faces = [
        ((-hw, 1.9, hw), (hw, 1.9, hw), tip),
        ((hw, 1.9, hw), (hw, 1.9, -hw), tip),
        ((hw, 1.9, -hw), (-hw, 1.9, -hw), tip),
        ((-hw, 1.9, -hw), (-hw, 1.9, hw), tip)
    ]
    for f in faces:
        idx = len(pos3)
        v0, v1, v2 = f
        ax, ay, az = v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2]
        bx, by, bz = v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]
        nx = ay*bz - az*by
        ny = az*bx - ax*bz
        nz = ax*by - ay*bx
        length = math.sqrt(nx*nx + ny*ny + nz*nz) or 1.0
        norm = (nx/length, ny/length, nz/length)
        pos3.extend([v0, v1, v2])
        norm3.extend([norm, norm, norm])
        idx3.extend([idx, idx+1, idx+2])

    add_torus(pos3, norm3, idx3, 0.85, 0.04, 20, 6, (0, 1.9, 0)) # Primary aura ring
    add_torus(pos3, norm3, idx3, 1.1, 0.035, 20, 6, (0, 1.9, 0))  # Outer crown ring
    meshes.append({
        'name': 'BrahmanSourceCore',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'BrahmanSourceRadiance', 'base_color': [1.0, 1.0, 0.95, 1.0], 'metallic': 0.95, 'roughness': 0.05, 'emissive': [1.0, 1.0, 0.8]}
    })

    return create_glb(meshes)

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    enemy_dir = os.path.join(root, 'godot', 'assets', 'characters', 'enemies')
    env_dir = os.path.join(root, 'godot', 'assets', 'environment')

    os.makedirs(enemy_dir, exist_ok=True)
    os.makedirs(env_dir, exist_ok=True)

    assets = [
        ('moksha_seraph.glb', enemy_dir, generate_moksha_seraph),
        ('dharma_sentinel.glb', enemy_dir, generate_dharma_sentinel),
        ('boss_brahma_avatara.glb', enemy_dir, generate_boss_brahma_avatara),
        ('cosmic_dharmachakra.glb', env_dir, generate_cosmic_dharmachakra),
        ('thousand_petal_lotus.glb', env_dir, generate_thousand_petal_lotus),
        ('moksha_mahapeetham.glb', env_dir, generate_moksha_mahapeetham),
    ]

    print("Generating Chapter VII: Realm of Satyaloka / Brahmaloka 3D Assets...")
    for filename, out_dir, generator in assets:
        path = os.path.join(out_dir, filename)
        glb_bytes = generator()
        with open(path, 'wb') as f:
            f.write(glb_bytes)
        print(f"  [OK] {filename} ({len(glb_bytes)} bytes) -> {os.path.relpath(path, root)}")

    print("\nAll Chapter VII Satyaloka glTF 2.0 assets generated successfully.")

if __name__ == '__main__':
    main()
