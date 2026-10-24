#!/usr/bin/env python3
"""
Generate 3D Production Assets for Chapter III: Realm of Patala (The Subterranean Serpent Vaults)
Produces clean glTF 2.0 binary (.glb) files with PBR materials and normals:
- naga_spitter.glb (Serpentine hooded ranger that spits venom globes)
- naga_constrictor.glb (Armored serpentine warrior with dual venomous blades)
- boss_shesha_echo.glb (Colossal 3.5m multi-headed serpent titan with jade scales)
- patala_stalagmite_cluster.glb (Basalt stalagmites with bioluminescent veins)
- bioluminescent_fungus.glb (Glowing bouncy mushroom platform for vertical traversal)
- vasuki_shrine_pedestal.glb (Ancient serpent shrine pedestal holding the Nagamani gem)
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
                'baseColorFactor': mat_def.get('base_color', [0.8, 0.8, 0.8, 1.0]),
                'metallicFactor': mat_def.get('metallic', 0.1),
                'roughnessFactor': mat_def.get('roughness', 0.7)
            },
            'emissiveFactor': mat_def.get('emissive', [0.0, 0.0, 0.0])
        })

        primitives.append({
            'attributes': {'POSITION': acc_pos_idx, 'NORMAL': acc_norm_idx},
            'indices': acc_idx_idx,
            'material': mat_idx
        })

    mesh_obj = {'name': 'PatalaMesh', 'primitives': primitives}
    nodes.append({'name': 'RootNode', 'mesh': 0})
    scene_nodes.append(0)

    gltf_dict = {
        'asset': {'version': '2.0', 'generator': 'Mythos Patala Asset Pipeline'},
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
        ca = math.cos(ang)
        sa = math.sin(ang)
        # bottom
        positions.append((offset[0] + r_bot*ca, offset[1] - half_h, offset[2] + r_bot*sa))
        normals.append((ca, 0, sa))
        # top
        positions.append((offset[0] + r_top*ca, offset[1] + half_h, offset[2] + r_top*sa))
        normals.append((ca, 0, sa))

    for s in range(segs):
        b0 = base_idx + s * 2
        t0 = b0 + 1
        b1 = base_idx + ((s + 1) % segs) * 2
        t1 = b1 + 1
        indices.extend([b0, t0, b1, b1, t0, t1])

def add_box(positions, normals, indices, size=(1,1,1), offset=(0,0,0)):
    base_idx = len(positions)
    hx, hy, hz = size[0]*0.5, size[1]*0.5, size[2]*0.5
    faces = [
        ([(-hx,-hy, hz), ( hx,-hy, hz), ( hx, hy, hz), (-hx, hy, hz)], (0, 0, 1)),
        ([( hx,-hy,-hz), (-hx,-hy,-hz), (-hx, hy,-hz), ( hx, hy,-hz)], (0, 0,-1)),
        ([(-hx, hy, hz), ( hx, hy, hz), ( hx, hy,-hz), (-hx, hy,-hz)], (0, 1, 0)),
        ([(-hx,-hy,-hz), ( hx,-hy,-hz), ( hx,-hy, hz), (-hx,-hy, hz)], (0,-1, 0)),
        ([( hx,-hy, hz), ( hx,-hy,-hz), ( hx, hy,-hz), ( hx, hy, hz)], (1, 0, 0)),
        ([(-hx,-hy,-hz), (-hx,-hy, hz), (-hx, hy, hz), (-hx, hy,-hz)], (-1, 0, 0)),
    ]
    for face_verts, n in faces:
        f_idx = len(positions)
        for v in face_verts:
            positions.append((offset[0] + v[0], offset[1] + v[1], offset[2] + v[2]))
            normals.append(n)
        indices.extend([f_idx, f_idx+1, f_idx+2, f_idx, f_idx+2, f_idx+3])

def add_cone(positions, normals, indices, r_base, height, segs=8, offset=(0,0,0)):
    base_idx = len(positions)
    tip_idx = base_idx
    positions.append((offset[0], offset[1] + height, offset[2]))
    normals.append((0, 1, 0))

    for s in range(segs):
        ang = 2.0 * math.pi * s / segs
        ca = math.cos(ang)
        sa = math.sin(ang)
        positions.append((offset[0] + r_base*ca, offset[1], offset[2] + r_base*sa))
        normals.append((ca, 0.3, sa))

    for s in range(segs):
        b0 = base_idx + 1 + s
        b1 = base_idx + 1 + ((s + 1) % segs)
        indices.extend([tip_idx, b0, b1])

def generate_naga_spitter():
    """Serpentine ranger with cobra hood, tail coil, and venomous fangs."""
    meshes = []
    # 1. Coiled Tail Base
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.45, 0.65, 0.5, segs=10, offset=(0, 0.25, 0))
    add_cylinder(pos, norm, idx, 0.35, 0.45, 0.6, segs=10, offset=(0, 0.7, 0))
    # Tail extension behind
    add_cylinder(pos, norm, idx, 0.15, 0.35, 0.9, segs=8, offset=(0, 0.15, -0.6))
    meshes.append({
        'name': 'NagaTail',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_NagaScales', 'base_color': [0.12, 0.28, 0.18, 1.0], 'metallic': 0.25, 'roughness': 0.55}
    })

    # 2. Torso and Cobra Hood
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.28, 0.35, 0.7, segs=8, offset=(0, 1.25, 0))
    # Flared Cobra Hood
    add_box(pos, norm, idx, size=(0.75, 0.65, 0.12), offset=(0, 1.6, -0.05))
    # Arms holding venom glands
    add_cylinder(pos, norm, idx, 0.08, 0.09, 0.5, segs=6, offset=(-0.35, 1.2, 0.1))
    add_cylinder(pos, norm, idx, 0.08, 0.09, 0.5, segs=6, offset=(0.35, 1.2, 0.1))
    meshes.append({
        'name': 'NagaTorsoHood',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_NagaArmor', 'base_color': [0.18, 0.38, 0.24, 1.0], 'metallic': 0.35, 'roughness': 0.45}
    })

    # 3. Serpent Head & Venom Fangs
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, size=(0.32, 0.25, 0.38), offset=(0, 1.82, 0.08))
    # Fangs & Glowing Eyes
    add_cone(pos, norm, idx, 0.03, 0.12, segs=4, offset=(-0.08, 1.68, 0.24))
    add_cone(pos, norm, idx, 0.03, 0.12, segs=4, offset=(0.08, 1.68, 0.24))
    add_box(pos, norm, idx, size=(0.06, 0.04, 0.04), offset=(-0.11, 1.86, 0.22))
    add_box(pos, norm, idx, size=(0.06, 0.04, 0.04), offset=(0.11, 1.86, 0.22))
    meshes.append({
        'name': 'NagaHeadFangs',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_VenomGlow', 'base_color': [0.2, 0.95, 0.35, 1.0], 'metallic': 0.1, 'roughness': 0.2, 'emissive': [0.2, 0.9, 0.3]}
    })

    return create_glb(meshes)

def generate_naga_constrictor():
    """Armored serpentine warrior with spiked carapace and twin venom blades."""
    meshes = []
    # 1. Muscular Serpent Body Base
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.5, 0.75, 0.6, segs=10, offset=(0, 0.3, 0))
    add_cylinder(pos, norm, idx, 0.42, 0.5, 0.7, segs=10, offset=(0, 0.85, 0))
    add_cylinder(pos, norm, idx, 0.2, 0.4, 1.1, segs=8, offset=(0, 0.2, -0.7))
    meshes.append({
        'name': 'ConstrictorBody',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_DarkScales', 'base_color': [0.1, 0.15, 0.12, 1.0], 'metallic': 0.4, 'roughness': 0.6}
    })

    # 2. Spiked Obsidian Carapace & Torso
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.38, 0.44, 0.75, segs=8, offset=(0, 1.45, 0))
    # Shoulder Spikes
    add_cone(pos, norm, idx, 0.12, 0.35, segs=5, offset=(-0.45, 1.7, 0))
    add_cone(pos, norm, idx, 0.12, 0.35, segs=5, offset=(0.45, 1.7, 0))
    # Head & Horns
    add_box(pos, norm, idx, size=(0.35, 0.32, 0.4), offset=(0, 2.05, 0.05))
    add_cone(pos, norm, idx, 0.08, 0.3, segs=5, offset=(-0.14, 2.25, -0.05))
    add_cone(pos, norm, idx, 0.08, 0.3, segs=5, offset=(0.14, 2.25, -0.05))
    meshes.append({
        'name': 'ConstrictorArmor',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_ObsidianPlates', 'base_color': [0.15, 0.18, 0.2, 1.0], 'metallic': 0.6, 'roughness': 0.35}
    })

    # 3. Dual Forearm Katar Venom Blades
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, size=(0.06, 0.75, 0.18), offset=(-0.55, 1.35, 0.25))
    add_box(pos, norm, idx, size=(0.06, 0.75, 0.18), offset=(0.55, 1.35, 0.25))
    meshes.append({
        'name': 'KatarBlades',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_VenomBlade', 'base_color': [0.15, 0.85, 0.4, 1.0], 'metallic': 0.8, 'roughness': 0.2, 'emissive': [0.1, 0.8, 0.3]}
    })

    return create_glb(meshes)

def generate_boss_shesha_echo():
    """Monumental 3.5m Multi-Headed Serpent Titan with jade scales and royal serpent crown."""
    meshes = []
    # 1. Colossal Serpentine Coil Base
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 1.1, 1.6, 0.9, segs=14, offset=(0, 0.45, 0))
    add_cylinder(pos, norm, idx, 0.9, 1.1, 1.0, segs=12, offset=(0, 1.3, 0))
    # Giant thrashing tail coil
    add_cylinder(pos, norm, idx, 0.5, 0.9, 1.8, segs=10, offset=(0, 0.4, -1.3))
    add_cone(pos, norm, idx, 0.5, 1.0, segs=8, offset=(0, 0.4, -2.6))
    meshes.append({
        'name': 'SheshaCoils',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_SheshaScales', 'base_color': [0.08, 0.24, 0.16, 1.0], 'metallic': 0.45, 'roughness': 0.5}
    })

    # 2. Titan Torso, Armor & Gold Serpent Torc
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.75, 0.9, 1.2, segs=10, offset=(0, 2.2, 0))
    # Heavy Jade Shoulder Plates
    add_box(pos, norm, idx, size=(0.6, 0.35, 0.5), offset=(-0.85, 2.65, 0))
    add_box(pos, norm, idx, size=(0.6, 0.35, 0.5), offset=(0.85, 2.65, 0))
    # Golden Torc Medallion
    add_cylinder(pos, norm, idx, 0.45, 0.48, 0.15, segs=10, offset=(0, 2.45, 0.35))
    meshes.append({
        'name': 'SheshaTorso',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_SheshaArmor', 'base_color': [0.75, 0.65, 0.22, 1.0], 'metallic': 0.85, 'roughness': 0.3}
    })

    # 3. Triple Crowned Cobra Hoods
    pos, norm, idx = [], [], []
    # Center Primary Hood
    add_box(pos, norm, idx, size=(1.2, 1.1, 0.2), offset=(0, 3.1, -0.1))
    add_box(pos, norm, idx, size=(0.55, 0.45, 0.55), offset=(0, 3.4, 0.12))
    # Left & Right Flanking Hoods
    add_box(pos, norm, idx, size=(0.8, 0.8, 0.18), offset=(-0.95, 2.9, 0.1))
    add_box(pos, norm, idx, size=(0.4, 0.35, 0.45), offset=(-0.95, 3.15, 0.25))
    add_box(pos, norm, idx, size=(0.8, 0.8, 0.18), offset=(0.95, 2.9, 0.1))
    add_box(pos, norm, idx, size=(0.4, 0.35, 0.45), offset=(0.95, 3.15, 0.25))
    # Royal Serpent Diadem Crest
    add_cone(pos, norm, idx, 0.18, 0.5, segs=6, offset=(0, 3.75, 0.1))
    meshes.append({
        'name': 'SheshaTripleHoods',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_JadeCrown', 'base_color': [0.15, 0.42, 0.3, 1.0], 'metallic': 0.5, 'roughness': 0.4}
    })

    # 4. Radiant Eyes & Nagamani Core
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, size=(0.1, 0.08, 0.08), offset=(-0.16, 3.42, 0.38))
    add_box(pos, norm, idx, size=(0.1, 0.08, 0.08), offset=(0.16, 3.42, 0.38))
    # Core jewel on chest
    add_cylinder(pos, norm, idx, 0.18, 0.18, 0.1, segs=8, offset=(0, 2.2, 0.42))
    meshes.append({
        'name': 'SheshaNagamaniCore',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_NagamaniGlow', 'base_color': [0.25, 1.0, 0.55, 1.0], 'metallic': 0.2, 'roughness': 0.1, 'emissive': [0.3, 1.0, 0.6]}
    })

    return create_glb(meshes)

def generate_patala_stalagmite_cluster():
    """Faceted basalt stalagmite cluster with crystalline bioluminescent veins."""
    meshes = []
    # 1. Main Stalagmite Spire
    pos, norm, idx = [], [], []
    add_cone(pos, norm, idx, 0.9, 4.2, segs=7, offset=(0, 0, 0))
    add_cone(pos, norm, idx, 0.55, 2.8, segs=6, offset=(-0.85, 0, 0.6))
    add_cone(pos, norm, idx, 0.45, 2.1, segs=6, offset=(0.75, 0, -0.5))
    meshes.append({
        'name': 'BasaltStalagmites',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_BasaltRock', 'base_color': [0.12, 0.14, 0.16, 1.0], 'metallic': 0.15, 'roughness': 0.85}
    })

    # 2. Glowing Crystal Veins
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.08, 0.12, 1.8, segs=5, offset=(0.15, 1.2, 0.35))
    add_cylinder(pos, norm, idx, 0.06, 0.1, 1.2, segs=5, offset=(-0.65, 0.8, 0.75))
    meshes.append({
        'name': 'CrystalVeins',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_CrystalGlow', 'base_color': [0.2, 0.85, 0.7, 1.0], 'metallic': 0.3, 'roughness': 0.2, 'emissive': [0.15, 0.9, 0.75]}
    })

    return create_glb(meshes)

def generate_bioluminescent_fungus():
    """Bouncy bioluminescent mushroom providing jump springboards."""
    meshes = []
    # 1. Stalk
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.35, 0.55, 1.6, segs=10, offset=(0, 0.8, 0))
    add_cylinder(pos, norm, idx, 0.45, 0.38, 0.2, segs=8, offset=(0, 1.3, 0))
    meshes.append({
        'name': 'FungusStalk',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_FungusStalk', 'base_color': [0.2, 0.25, 0.28, 1.0], 'metallic': 0.1, 'roughness': 0.7}
    })

    # 2. Broad Bouncy Cap
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 1.4, 0.6, 0.35, segs=12, offset=(0, 1.7, 0))
    add_cone(pos, norm, idx, 1.35, 0.45, segs=12, offset=(0, 1.85, 0))
    meshes.append({
        'name': 'FungusCap',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_BouncyCap', 'base_color': [0.18, 0.75, 0.65, 1.0], 'metallic': 0.2, 'roughness': 0.35, 'emissive': [0.2, 0.85, 0.7]}
    })

    return create_glb(meshes)

def generate_vasuki_shrine_pedestal():
    """Ancient serpent shrine pedestal holding the sacred Nagamani gem."""
    meshes = []
    # 1. Tiered Basalt Altar Base
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 1.5, 1.75, 0.4, segs=6, offset=(0, 0.2, 0))
    add_cylinder(pos, norm, idx, 1.25, 1.45, 0.6, segs=6, offset=(0, 0.7, 0))
    add_cylinder(pos, norm, idx, 0.95, 1.15, 0.5, segs=6, offset=(0, 1.25, 0))
    meshes.append({
        'name': 'AltarPlinth',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_BasaltPlinth', 'base_color': [0.15, 0.17, 0.2, 1.0], 'metallic': 0.3, 'roughness': 0.75}
    })

    # 2. Carved Coiling Serpents Support
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.75, 0.85, 0.4, segs=8, offset=(0, 1.7, 0))
    add_cylinder(pos, norm, idx, 0.5, 0.7, 0.25, segs=8, offset=(0, 2.0, 0))
    meshes.append({
        'name': 'SerpentCarvings',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_HoysalaGranite', 'base_color': [0.35, 0.32, 0.28, 1.0], 'metallic': 0.4, 'roughness': 0.65}
    })

    # 3. Radiant Nagamani Gemstone
    pos, norm, idx = [], [], []
    add_cone(pos, norm, idx, 0.3, 0.45, segs=8, offset=(0, 2.2, 0))
    add_cylinder(pos, norm, idx, 0.28, 0.28, 0.15, segs=8, offset=(0, 2.12, 0))
    meshes.append({
        'name': 'NagamaniGem',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'Mat_NagamaniJewel', 'base_color': [0.3, 1.0, 0.6, 1.0], 'metallic': 0.1, 'roughness': 0.15, 'emissive': [0.35, 1.0, 0.65]}
    })

    return create_glb(meshes)

def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    char_dir = os.path.join(repo_root, 'godot', 'assets', 'characters', 'enemies')
    env_dir = os.path.join(repo_root, 'godot', 'assets', 'environment')

    os.makedirs(char_dir, exist_ok=True)
    os.makedirs(env_dir, exist_ok=True)

    assets = [
        (os.path.join(char_dir, 'naga_spitter.glb'), generate_naga_spitter),
        (os.path.join(char_dir, 'naga_constrictor.glb'), generate_naga_constrictor),
        (os.path.join(char_dir, 'boss_shesha_echo.glb'), generate_boss_shesha_echo),
        (os.path.join(env_dir, 'patala_stalagmite_cluster.glb'), generate_patala_stalagmite_cluster),
        (os.path.join(env_dir, 'bioluminescent_fungus.glb'), generate_bioluminescent_fungus),
        (os.path.join(env_dir, 'vasuki_shrine_pedestal.glb'), generate_vasuki_shrine_pedestal),
    ]

    print("--- Generating Chapter III (Realm of Patala) 3D Production Assets ---")
    for file_path, gen_func in assets:
        glb_data = gen_func()
        with open(file_path, 'wb') as f:
            f.write(glb_data)
        size_kb = len(glb_data) / 1024.0
        print(f"  [OK] {os.path.relpath(file_path, repo_root)} ({size_kb:.1f} KB)")
    print("All Chapter III binary glTF assets successfully generated.\n")

if __name__ == '__main__':
    main()
