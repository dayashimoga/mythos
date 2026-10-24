#!/usr/bin/env python3
"""
Generate 3D Production Assets for Chapter VI: Realm of Janaloka / Tapoloka (The Ascetic Flame & Agni's Primordial Forge)
Produces clean glTF 2.0 binary (.glb) files with PBR materials and normals:
- agni_berserker.glb (Fierce armored flame-asura warrior wielding twin obsidian flame-blades)
- tapas_magma_hound.glb (Quadrupedal lava hound with magma cracks, flaming maw, and spiked obsidian spine)
- boss_agni_rudra.glb (Colossal 4.2m Primordial Fire Titan / Rudra Avatara with Trisula trident)
- primordial_anvil_forge.glb (Massive carved basalt anvil forge with glowing molten runes)
- magma_pressure_geyser.glb (Obsidian vent spout with pulsing crimson magma core)
- tapo_agni_peetham.glb (Stepped volcanic basalt altar with tri-flame eternal brazier)
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
                'baseColorFactor': mat_def.get('base_color', [0.8, 0.3, 0.1, 1.0]),
                'metallicFactor': mat_def.get('metallic', 0.4),
                'roughnessFactor': mat_def.get('roughness', 0.45)
            },
            'emissiveFactor': mat_def.get('emissive', [0.0, 0.0, 0.0])
        })

        primitives.append({
            'attributes': {'POSITION': acc_pos_idx, 'NORMAL': acc_norm_idx},
            'indices': acc_idx_idx,
            'material': mat_idx
        })

    mesh_obj = {'name': 'TapoMesh', 'primitives': primitives}
    nodes.append({'name': 'RootNode', 'mesh': 0})
    scene_nodes.append(0)

    gltf_dict = {
        'asset': {'version': '2.0', 'generator': 'Mythos Tapoloka Agni Forge Pipeline'},
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

def add_disk(positions, normals, indices, radius, height, segs=12, offset=(0,0,0)):
    add_cylinder(positions, normals, indices, radius, radius, height, segs, offset)

def add_torus(positions, normals, indices, r_major, r_minor, segs_maj=12, segs_min=6, offset=(0,0,0)):
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
# Asset 1: agni_berserker.glb (Flame-Asura Warrior with Twin Flame Blades)
# -------------------------------------------------------------------------
def generate_agni_berserker():
    meshes = []

    # 1. Dark Basalt & Obsidian Plate Armor
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, (0.75, 0.9, 0.5), (0, 1.15, 0)) # Cuirass
    add_cylinder(pos, norm, idx, 0.18, 0.14, 0.75, 8, (-0.24, 0.45, 0)) # Left leg
    add_cylinder(pos, norm, idx, 0.18, 0.14, 0.75, 8, (0.24, 0.45, 0))  # Right leg
    add_cylinder(pos, norm, idx, 0.15, 0.13, 0.65, 8, (-0.48, 1.2, 0)) # Left arm
    add_cylinder(pos, norm, idx, 0.15, 0.13, 0.65, 8, (0.48, 1.2, 0))  # Right arm
    add_cylinder(pos, norm, idx, 0.22, 0.24, 0.35, 8, (0, 1.75, 0))   # Helm
    meshes.append({
        'name': 'ObsidianArmor',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'BasaltObsidian', 'base_color': [0.15, 0.14, 0.18, 1.0], 'metallic': 0.7, 'roughness': 0.3}
    })

    # 2. Glowing Magma Seams & Horns
    pos2, norm2, idx2 = [], [], []
    add_pyramid(pos2, norm2, idx2, 0.15, 0.15, 0.45, (-0.18, 1.9, 0)) # Left horn
    add_pyramid(pos2, norm2, idx2, 0.15, 0.15, 0.45, (0.18, 1.9, 0))  # Right horn
    add_box(pos2, norm2, idx2, (0.4, 0.15, 0.05), (0, 1.2, 0.27))     # Chest magma fissure
    meshes.append({
        'name': 'MagmaSeams',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'MoltenGlow', 'base_color': [1.0, 0.4, 0.1, 1.0], 'metallic': 0.8, 'roughness': 0.2, 'emissive': [1.0, 0.35, 0.05]}
    })

    # 3. Twin Obsidian Flame Blades
    pos3, norm3, idx3 = [], [], []
    # Left blade
    add_box(pos3, norm3, idx3, (0.08, 0.9, 0.25), (-0.6, 0.9, 0.2))
    add_pyramid(pos3, norm3, idx3, 0.08, 0.25, 0.35, (-0.6, 1.35, 0.2))
    # Right blade
    add_box(pos3, norm3, idx3, (0.08, 0.9, 0.25), (0.6, 0.9, 0.2))
    add_pyramid(pos3, norm3, idx3, 0.08, 0.25, 0.35, (0.6, 1.35, 0.2))
    meshes.append({
        'name': 'FlameBlades',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'FlameBladeEdge', 'base_color': [1.0, 0.6, 0.2, 1.0], 'metallic': 0.9, 'roughness': 0.15, 'emissive': [0.9, 0.45, 0.1]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 2: tapas_magma_hound.glb (Quadrupedal Lava Hound)
# -------------------------------------------------------------------------
def generate_tapas_magma_hound():
    meshes = []

    # 1. Muscular Hound Body & Four Legs
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, (0.6, 0.55, 1.3), (0, 0.65, 0)) # Torso
    # 4 Legs
    add_cylinder(pos, norm, idx, 0.11, 0.09, 0.6, 6, (-0.28, 0.3, 0.45))
    add_cylinder(pos, norm, idx, 0.11, 0.09, 0.6, 6, (0.28, 0.3, 0.45))
    add_cylinder(pos, norm, idx, 0.11, 0.09, 0.6, 6, (-0.28, 0.3, -0.45))
    add_cylinder(pos, norm, idx, 0.11, 0.09, 0.6, 6, (0.28, 0.3, -0.45))
    meshes.append({
        'name': 'HoundBody',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'VolcanicHide', 'base_color': [0.2, 0.18, 0.22, 1.0], 'metallic': 0.5, 'roughness': 0.5}
    })

    # 2. Spiked Obsidian Ridge & Snout
    pos2, norm2, idx2 = [], [], []
    add_box(pos2, norm2, idx2, (0.35, 0.35, 0.5), (0, 0.85, 0.8)) # Head
    add_pyramid(pos2, norm2, idx2, 0.3, 0.3, 0.35, (0, 0.75, 1.05)) # Jaws
    # 3 Spines along back
    for s in range(3):
        add_pyramid(pos2, norm2, idx2, 0.16, 0.16, 0.3, (0, 0.95, -0.3 + s * 0.3))
    meshes.append({
        'name': 'SpinesAndJaws',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'ObsidianSpines', 'base_color': [0.1, 0.1, 0.12, 1.0], 'metallic': 0.8, 'roughness': 0.2}
    })

    # 3. Molten Core & Flaming Maw
    pos3, norm3, idx3 = [], [], []
    add_cylinder(pos3, norm3, idx3, 0.08, 0.08, 0.4, 6, (0, 0.75, 0.85)) # Glowing inner throat
    add_box(pos3, norm3, idx3, (0.1, 0.1, 1.1), (0, 0.65, 0)) # Glowing flank line
    meshes.append({
        'name': 'MagmaMaw',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'MagmaLava', 'base_color': [1.0, 0.5, 0.1, 1.0], 'metallic': 0.9, 'roughness': 0.1, 'emissive': [1.0, 0.4, 0.05]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 3: boss_agni_rudra.glb (Primordial Fire Titan / Rudra Avatara 4.2m)
# -------------------------------------------------------------------------
def generate_boss_agni_rudra():
    meshes = []

    # 1. Colossal Volcanic Titan Body & Limbs
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, (1.6, 1.8, 1.0), (0, 2.5, 0)) # Broad muscular torso
    add_cylinder(pos, norm, idx, 0.38, 0.32, 1.6, 8, (-0.55, 0.85, 0)) # Left leg
    add_cylinder(pos, norm, idx, 0.38, 0.32, 1.6, 8, (0.55, 0.85, 0))  # Right leg
    add_cylinder(pos, norm, idx, 0.35, 0.28, 1.5, 8, (-1.05, 2.4, 0.2)) # Left arm
    add_cylinder(pos, norm, idx, 0.35, 0.28, 1.5, 8, (1.05, 2.4, 0.2))  # Right arm
    add_cylinder(pos, norm, idx, 0.42, 0.4, 0.65, 8, (0, 3.7, 0)) # Titan head
    meshes.append({
        'name': 'TitanTorso',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'BasaltTitanSkin', 'base_color': [0.22, 0.18, 0.2, 1.0], 'metallic': 0.6, 'roughness': 0.4}
    })

    # 2. Flaming Crown, Ram Horns & Molten Veins
    pos2, norm2, idx2 = [], [], []
    # Curving horns
    add_pyramid(pos2, norm2, idx2, 0.35, 0.3, 0.9, (-0.45, 3.9, 0.1))
    add_pyramid(pos2, norm2, idx2, 0.35, 0.3, 0.9, (0.45, 3.9, 0.1))
    # Radiating Agni mandala halo behind titan
    add_torus(pos2, norm2, idx2, 1.4, 0.06, 16, 6, (0, 3.2, -0.4))
    meshes.append({
        'name': 'AgniHaloAndHorns',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'FlameHaloGold', 'base_color': [1.0, 0.65, 0.2, 1.0], 'metallic': 0.85, 'roughness': 0.2, 'emissive': [0.95, 0.4, 0.08]}
    })

    # 3. Flame Trisula (3.2m Colossal Trident)
    pos3, norm3, idx3 = [], [], []
    add_cylinder(pos3, norm3, idx3, 0.06, 0.06, 3.4, 8, (1.35, 2.2, 0.5)) # Shaft
    add_pyramid(pos3, norm3, idx3, 0.22, 0.08, 0.7, (1.35, 3.9, 0.5))     # Center prong
    add_pyramid(pos3, norm3, idx3, 0.16, 0.06, 0.5, (1.15, 3.75, 0.5))    # Left prong
    add_pyramid(pos3, norm3, idx3, 0.16, 0.06, 0.5, (1.55, 3.75, 0.5))    # Right prong
    meshes.append({
        'name': 'FlameTrisula',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'TrisulaBlade', 'base_color': [1.0, 0.85, 0.3, 1.0], 'metallic': 0.9, 'roughness': 0.15, 'emissive': [1.0, 0.5, 0.1]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 4: primordial_anvil_forge.glb (Basalt Anvil Forge with Molten Runes)
# -------------------------------------------------------------------------
def generate_primordial_anvil_forge():
    meshes = []

    # 1. Carved Basalt Anvil Base & Body (2.4m wide)
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, (2.2, 0.4, 1.6), (0, 0.2, 0)) # Pedestal plinth
    add_cylinder(pos, norm, idx, 0.7, 0.9, 0.7, 8, (0, 0.75, 0)) # Stem
    add_box(pos, norm, idx, (2.4, 0.55, 1.1), (0, 1.35, 0)) # Anvil face
    add_pyramid(pos, norm, idx, 0.9, 0.55, 0.6, (1.4, 1.35, 0)) # Anvil horn
    meshes.append({
        'name': 'AnvilBasalt',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'ForgeBasaltStone', 'base_color': [0.25, 0.24, 0.28, 1.0], 'metallic': 0.45, 'roughness': 0.55}
    })

    # 2. Molten Runic Channels
    pos2, norm2, idx2 = [], [], []
    add_box(pos2, norm2, idx2, (1.8, 0.05, 0.15), (0, 1.65, 0)) # Center rune groove
    add_box(pos2, norm2, idx2, (0.15, 0.05, 0.8), (0, 1.65, 0)) # Cross groove
    meshes.append({
        'name': 'RunicChannels',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'LavaRunes', 'base_color': [1.0, 0.45, 0.1, 1.0], 'metallic': 0.8, 'roughness': 0.2, 'emissive': [1.0, 0.4, 0.05]}
    })

    # 3. Hovering Incandescent Ingot
    pos3, norm3, idx3 = [], [], []
    add_box(pos3, norm3, idx3, (0.8, 0.25, 0.45), (0, 1.95, 0))
    add_torus(pos3, norm3, idx3, 0.65, 0.035, 14, 6, (0, 1.95, 0)) # Orbiting spark ring
    meshes.append({
        'name': 'HoveringIngot',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'IncandescentGold', 'base_color': [1.0, 0.8, 0.3, 1.0], 'metallic': 0.9, 'roughness': 0.1, 'emissive': [1.0, 0.6, 0.15]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 5: magma_pressure_geyser.glb (Obsidian Vent Spout)
# -------------------------------------------------------------------------
def generate_magma_pressure_geyser():
    meshes = []

    # 1. Jagged Obsidian Vent Rim
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 1.4, 1.8, 0.5, 8, (0, 0.25, 0)) # Base crater
    add_cylinder(pos, norm, idx, 1.0, 1.4, 0.6, 8, (0, 0.8, 0))  # Cone
    meshes.append({
        'name': 'CraterRim',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'VolcanicCrater', 'base_color': [0.18, 0.16, 0.2, 1.0], 'metallic': 0.5, 'roughness': 0.6}
    })

    # 2. Pulsing Molten Magma Core
    pos2, norm2, idx2 = [], [], []
    add_disk(pos2, norm2, idx2, 0.9, 0.1, 10, (0, 1.05, 0))
    add_cylinder(pos2, norm2, idx2, 0.4, 0.8, 0.8, 8, (0, 1.5, 0)) # Emerging fire flare
    meshes.append({
        'name': 'MagmaCore',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'MoltenGeyserCore', 'base_color': [1.0, 0.35, 0.05, 1.0], 'metallic': 0.9, 'roughness': 0.15, 'emissive': [1.0, 0.45, 0.1]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 6: tapo_agni_peetham.glb (Volcanic Basalt Altar with Tri-Flame Brazier)
# -------------------------------------------------------------------------
def generate_tapo_agni_peetham():
    meshes = []

    # 1. Stepped Volcanic Plinth
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 2.5, 2.8, 0.4, 8, (0, 0.2, 0)) # Tier 1
    add_cylinder(pos, norm, idx, 2.0, 2.3, 0.4, 8, (0, 0.6, 0)) # Tier 2
    add_cylinder(pos, norm, idx, 1.5, 1.8, 0.4, 8, (0, 1.0, 0)) # Tier 3
    meshes.append({
        'name': 'AltarPlinth',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'BasaltPlinth', 'base_color': [0.22, 0.2, 0.25, 1.0], 'metallic': 0.4, 'roughness': 0.5}
    })

    # 2. Tri-Flame Braziers (3 cauldrons around center)
    pos2, norm2, idx2 = [], [], []
    for k in range(3):
        ang = k * (2.0 * math.pi / 3.0)
        bx, bz = 1.2 * math.cos(ang), 1.2 * math.sin(ang)
        add_cylinder(pos2, norm2, idx2, 0.35, 0.25, 0.5, 6, (bx, 1.45, bz)) # Bowl
    # Center core dais
    add_cylinder(pos2, norm2, idx2, 0.7, 0.8, 0.3, 8, (0, 1.35, 0))
    meshes.append({
        'name': 'BraziersAndDais',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'CastBronzeBrazier', 'base_color': [0.85, 0.55, 0.2, 1.0], 'metallic': 0.8, 'roughness': 0.3}
    })

    # 3. Sacred Tapas Core Crystal (Floating Fire Diamond)
    pos3, norm3, idx3 = [], [], []
    # Double pyramid = Octahedral fire jewel
    add_pyramid(pos3, norm3, idx3, 0.55, 0.55, 0.5, (0, 1.85, 0))
    # Inverted lower half
    hw = 0.275
    tip = (0, 1.35, 0)
    faces = [
        ((-hw, 1.85, hw), (hw, 1.85, hw), tip),
        ((hw, 1.85, hw), (hw, 1.85, -hw), tip),
        ((hw, 1.85, -hw), (-hw, 1.85, -hw), tip),
        ((-hw, 1.85, -hw), (-hw, 1.85, hw), tip)
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

    add_torus(pos3, norm3, idx3, 0.75, 0.04, 16, 6, (0, 1.85, 0)) # Spinning flame ring
    meshes.append({
        'name': 'TapasCoreCrystal',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'TapasFlameRadiance', 'base_color': [1.0, 0.4, 0.08, 1.0], 'metallic': 0.95, 'roughness': 0.1, 'emissive': [1.0, 0.5, 0.1]}
    })

    return create_glb(meshes)

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    enemy_dir = os.path.join(root, 'godot', 'assets', 'characters', 'enemies')
    env_dir = os.path.join(root, 'godot', 'assets', 'environment')

    os.makedirs(enemy_dir, exist_ok=True)
    os.makedirs(env_dir, exist_ok=True)

    assets = [
        ('agni_berserker.glb', enemy_dir, generate_agni_berserker),
        ('tapas_magma_hound.glb', enemy_dir, generate_tapas_magma_hound),
        ('boss_agni_rudra.glb', enemy_dir, generate_boss_agni_rudra),
        ('primordial_anvil_forge.glb', env_dir, generate_primordial_anvil_forge),
        ('magma_pressure_geyser.glb', env_dir, generate_magma_pressure_geyser),
        ('tapo_agni_peetham.glb', env_dir, generate_tapo_agni_peetham),
    ]

    print("Generating Chapter VI: Realm of Janaloka / Tapoloka 3D Assets...")
    for filename, out_dir, generator in assets:
        path = os.path.join(out_dir, filename)
        glb_bytes = generator()
        with open(path, 'wb') as f:
            f.write(glb_bytes)
        print(f"  [OK] {filename} ({len(glb_bytes)} bytes) -> {os.path.relpath(path, root)}")

    print("\nAll Chapter VI Tapoloka glTF 2.0 assets generated successfully.")

if __name__ == '__main__':
    main()
