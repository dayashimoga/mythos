#!/usr/bin/env python3
"""
Generate 3D Production Assets for Chapter II: Realm of Antariksha
Produces clean glTF 2.0 binary (.glb) files with PBR materials and normals:
- gale_falcon.glb (Airborne predator with talons and wind feathers)
- wind_archer.glb (Hovering Asura sniper with gale bow and aerodynamic armor)
- boss_matarishvan.glb (Colossal 3.2m winged Cyclone Titan with tempest core)
- floating_island_base.glb (Basalt floating sky island with stone platform)
- vayu_windmill.glb (Vayu wind pillar with ornamental blades)
- grapple_anchor_ring.glb (Golden celestial ring for harpoon grapple traversal)
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
    """
    meshes_data: list of dicts:
      {
        'name': str,
        'positions': list of (x,y,z),
        'normals': list of (nx,ny,nz),
        'indices': list of int,
        'material': {
            'name': str,
            'base_color': [r,g,b,a],
            'metallic': float,
            'roughness': float,
            'emissive': [r,g,b]
        }
      }
    """
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
        pbr = {
            'baseColorFactor': mat_def.get('base_color', [0.8, 0.8, 0.8, 1.0]),
            'metallicFactor': mat_def.get('metallic', 0.1),
            'roughnessFactor': mat_def.get('roughness', 0.8)
        }
        mat_obj = {
            'name': mat_def.get('name', f"Mat_{idx}"),
            'pbrMetallicRoughness': pbr,
            'doubleSided': True
        }
        if 'emissive' in mat_def:
            mat_obj['emissiveFactor'] = mat_def['emissive']
        materials.append(mat_obj)

        primitives.append({
            'attributes': {'POSITION': acc_pos_idx, 'NORMAL': acc_norm_idx},
            'indices': acc_idx_idx,
            'material': mat_idx
        })

    # Assemble GLTF document
    mesh_obj = {'primitives': primitives}
    nodes.append({'name': 'RootNode', 'mesh': 0})
    scene_nodes.append(0)

    gltf = {
        'asset': {'version': '2.0', 'generator': 'MythosAntarikshaAssetGen 1.0'},
        'scene': 0,
        'scenes': [{'nodes': scene_nodes}],
        'nodes': nodes,
        'meshes': [mesh_obj],
        'materials': materials,
        'accessors': accessors,
        'bufferViews': buffer_views,
        'buffers': [{'byteLength': len(bin_buffer)}]
    }

    json_bytes = bytearray(json.dumps(gltf, separators=(',', ':')).encode('utf-8'))
    while len(json_bytes) % 4 != 0:
        json_bytes.extend(b' ')

    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_buffer)
    glb_header = struct.pack('<4sII', b'glTF', 2, total_len)
    json_chunk_hdr = struct.pack('<II', len(json_bytes), 0x4E4F534A)
    bin_chunk_hdr = struct.pack('<II', len(bin_buffer), 0x004E4942)

    return glb_header + json_chunk_hdr + json_bytes + bin_chunk_hdr + bin_buffer

# -------------------------------------------------------------
# Primitive Geometry Helpers
# -------------------------------------------------------------
def make_box(cx, cy, cz, sx, sy, sz, mat):
    hx, hy, hz = sx*0.5, sy*0.5, sz*0.5
    faces = [
        (( 0, 0, 1), [(-hx,-hy, hz),( hx,-hy, hz),( hx, hy, hz),(-hx, hy, hz)]),
        (( 0, 0,-1), [( hx,-hy,-hz),(-hx,-hy,-hz),(-hx, hy,-hz),( hx, hy,-hz)]),
        ((-1, 0, 0), [(-hx,-hy,-hz),(-hx,-hy, hz),(-hx, hy, hz),(-hx, hy,-hz)]),
        (( 1, 0, 0), [( hx,-hy, hz),( hx,-hy,-hz),( hx, hy,-hz),( hx, hy, hz)]),
        (( 0, 1, 0), [(-hx, hy, hz),( hx, hy, hz),( hx, hy,-hz),(-hx, hy,-hz)]),
        (( 0,-1, 0), [(-hx,-hy,-hz),( hx,-hy,-hz),( hx,-hy, hz),(-hx,-hy, hz)]),
    ]
    positions, normals, indices = [], [], []
    for norm, quad in faces:
        base = len(positions)
        for vx, vy, vz in quad:
            positions.append((cx + vx, cy + vy, cz + vz))
            normals.append(norm)
        indices.extend([base, base+1, base+2, base, base+2, base+3])
    return {'positions': positions, 'normals': normals, 'indices': indices, 'material': mat}

def make_cylinder(cx, cy, cz, radius, height, segments=12, mat=None):
    positions, normals, indices = [], [], []
    half_h = height * 0.5
    top_base = len(positions)
    positions.append((cx, cy + half_h, cz))
    normals.append((0, 1, 0))
    for i in range(segments):
        th = 2.0 * math.pi * i / segments
        positions.append((cx + radius * math.cos(th), cy + half_h, cz + radius * math.sin(th)))
        normals.append((0, 1, 0))
    for i in range(segments):
        nxt = (i + 1) % segments
        indices.extend([top_base, top_base + 1 + i, top_base + 1 + nxt])

    bot_base = len(positions)
    positions.append((cx, cy - half_h, cz))
    normals.append((0, -1, 0))
    for i in range(segments):
        th = 2.0 * math.pi * i / segments
        positions.append((cx + radius * math.cos(th), cy - half_h, cz + radius * math.sin(th)))
        normals.append((0, -1, 0))
    for i in range(segments):
        nxt = (i + 1) % segments
        indices.extend([bot_base, bot_base + 1 + nxt, bot_base + 1 + i])

    side_base = len(positions)
    for i in range(segments):
        th = 2.0 * math.pi * i / segments
        c, s = math.cos(th), math.sin(th)
        positions.append((cx + radius * c, cy + half_h, cz + radius * s))
        normals.append((c, 0, s))
        positions.append((cx + radius * c, cy - half_h, cz + radius * s))
        normals.append((c, 0, s))
    for i in range(segments):
        nxt = (i + 1) % segments
        v0 = side_base + i*2
        v1 = side_base + i*2 + 1
        v2 = side_base + nxt*2
        v3 = side_base + nxt*2 + 1
        indices.extend([v0, v1, v2, v1, v3, v2])

    return {'positions': positions, 'normals': normals, 'indices': indices, 'material': mat}

def make_torus(cx, cy, cz, major_r, minor_r, maj_segs=16, min_segs=8, mat=None):
    positions, normals, indices = [], [], []
    for i in range(maj_segs):
        u = 2.0 * math.pi * i / maj_segs
        cos_u, sin_u = math.cos(u), math.sin(u)
        center_x = cx + major_r * cos_u
        center_z = cz + major_r * sin_u
        for j in range(min_segs):
            v = 2.0 * math.pi * j / min_segs
            cos_v, sin_v = math.cos(v), math.sin(v)
            px = center_x + minor_r * cos_v * cos_u
            py = cy + minor_r * sin_v
            pz = center_z + minor_r * cos_v * sin_u
            nx = cos_v * cos_u
            ny = sin_v
            nz = cos_v * sin_u
            positions.append((px, py, pz))
            normals.append((nx, ny, nz))
    for i in range(maj_segs):
        nxt_i = (i + 1) % maj_segs
        for j in range(min_segs):
            nxt_j = (j + 1) % min_segs
            v0 = i * min_segs + j
            v1 = nxt_i * min_segs + j
            v2 = i * min_segs + nxt_j
            v3 = nxt_i * min_segs + nxt_j
            indices.extend([v0, v1, v2, v1, v3, v2])
    return {'positions': positions, 'normals': normals, 'indices': indices, 'material': mat}

def make_pyramid(cx, cy, cz, base_w, height, mat=None):
    hw = base_w * 0.5
    apex = (cx, cy + height, cz)
    p0 = (cx - hw, cy, cz - hw)
    p1 = (cx + hw, cy, cz - hw)
    p2 = (cx + hw, cy, cz + hw)
    p3 = (cx - hw, cy, cz + hw)
    positions, normals, indices = [], [], []
    sides = [(p0, p1, (0, 0.45, -0.89)), (p1, p2, (0.89, 0.45, 0)),
             (p2, p3, (0, 0.45, 0.89)), (p3, p0, (-0.89, 0.45, 0))]
    for va, vb, norm in sides:
        b = len(positions)
        positions.extend([apex, va, vb])
        normals.extend([norm, norm, norm])
        indices.extend([b, b+1, b+2])
    # Base
    b = len(positions)
    positions.extend([p0, p3, p2, p1])
    normals.extend([(0,-1,0)]*4)
    indices.extend([b, b+1, b+2, b, b+2, b+3])
    return {'positions': positions, 'normals': normals, 'indices': indices, 'material': mat}

# -------------------------------------------------------------
# Asset Authors: Gale Falcon, Wind Archer, Boss Matarishvan,
# Floating Island, Vayu Windmill, Grapple Anchor Ring
# -------------------------------------------------------------

def build_gale_falcon():
    feather_mat = {'name': 'GaleFeather', 'base_color': [0.15, 0.55, 0.75, 1.0], 'metallic': 0.1, 'roughness': 0.4}
    beak_talon_mat = {'name': 'TalonGold', 'base_color': [0.95, 0.75, 0.15, 1.0], 'metallic': 0.6, 'roughness': 0.2}
    eye_prana_mat = {'name': 'PranaGlow', 'base_color': [0.2, 0.9, 1.0, 1.0], 'metallic': 0.0, 'roughness': 0.1, 'emissive': [0.4, 1.8, 2.0]}

    parts = []
    # Aerodynamic Torso
    parts.append(make_box(0, 0, 0, 0.45, 0.35, 0.95, feather_mat))
    # Crest & Head
    parts.append(make_box(0, 0.22, 0.48, 0.28, 0.28, 0.35, feather_mat))
    # Curved Golden Beak
    parts.append(make_pyramid(0, 0.14, 0.68, 0.16, 0.25, beak_talon_mat))
    # Glowing Prana Eyes
    parts.append(make_box(-0.15, 0.25, 0.52, 0.08, 0.08, 0.08, eye_prana_mat))
    parts.append(make_box( 0.15, 0.25, 0.52, 0.08, 0.08, 0.08, eye_prana_mat))
    # Left Wing Primary & Secondary Feathers
    parts.append(make_box(-0.65, 0.08, 0.05, 0.85, 0.06, 0.55, feather_mat))
    parts.append(make_box(-1.25, 0.14, 0.0, 0.55, 0.04, 0.38, feather_mat))
    # Right Wing
    parts.append(make_box( 0.65, 0.08, 0.05, 0.85, 0.06, 0.55, feather_mat))
    parts.append(make_box( 1.25, 0.14, 0.0, 0.55, 0.04, 0.38, feather_mat))
    # Tail Feathers
    parts.append(make_box(0, 0.02, -0.65, 0.5, 0.05, 0.55, feather_mat))
    # Sharp Talons
    parts.append(make_box(-0.16, -0.22, 0.1, 0.08, 0.22, 0.08, beak_talon_mat))
    parts.append(make_box( 0.16, -0.22, 0.1, 0.08, 0.22, 0.08, beak_talon_mat))
    return parts

def build_wind_archer():
    asura_armor_mat = {'name': 'WindAsuraArmor', 'base_color': [0.18, 0.22, 0.28, 1.0], 'metallic': 0.75, 'roughness': 0.3}
    sash_cyan_mat = {'name': 'VayuSash', 'base_color': [0.1, 0.7, 0.85, 1.0], 'metallic': 0.1, 'roughness': 0.5}
    gale_bow_mat = {'name': 'GaleBow', 'base_color': [0.85, 0.65, 0.2, 1.0], 'metallic': 0.8, 'roughness': 0.2, 'emissive': [0.5, 0.35, 0.1]}
    visor_glow_mat = {'name': 'VisorCyan', 'base_color': [0.0, 0.9, 0.95, 1.0], 'metallic': 0.1, 'roughness': 0.1, 'emissive': [0.3, 1.8, 1.9]}

    parts = []
    # Hovering Humanoid Torso
    parts.append(make_box(0, 1.2, 0, 0.48, 0.62, 0.32, asura_armor_mat))
    # Aerodynamic Spiked Pauldrons
    parts.append(make_box(-0.35, 1.48, 0, 0.28, 0.22, 0.36, asura_armor_mat))
    parts.append(make_box( 0.35, 1.48, 0.1, 0.28, 0.22, 0.36, asura_armor_mat))
    # Slender Horned Helm
    parts.append(make_box(0, 1.72, 0, 0.28, 0.32, 0.28, asura_armor_mat))
    parts.append(make_box(0, 1.74, 0.14, 0.22, 0.08, 0.06, visor_glow_mat))
    parts.append(make_pyramid(-0.16, 1.9, 0, 0.1, 0.35, asura_armor_mat))
    parts.append(make_pyramid( 0.16, 1.9, 0, 0.1, 0.35, asura_armor_mat))
    # Fluttering Celestial Vayu Sashes
    parts.append(make_box(0, 0.95, -0.18, 0.5, 0.08, 0.15, sash_cyan_mat))
    parts.append(make_box(-0.25, 0.55, -0.22, 0.18, 0.75, 0.06, sash_cyan_mat))
    parts.append(make_box( 0.25, 0.55, -0.22, 0.18, 0.75, 0.06, sash_cyan_mat))
    # Hovering Lower Body / Greaves
    parts.append(make_cylinder(-0.15, 0.45, 0, 0.11, 0.75, 8, asura_armor_mat))
    parts.append(make_cylinder( 0.15, 0.45, 0, 0.11, 0.75, 8, asura_armor_mat))
    # Right Arm Extended with Gale Bow
    parts.append(make_box(0.38, 1.25, 0.32, 0.14, 0.14, 0.55, asura_armor_mat))
    # Curved Crescent Gale Bow
    parts.append(make_torus(0.38, 1.25, 0.65, 0.58, 0.045, 12, 6, gale_bow_mat))
    return parts

def build_boss_matarishvan():
    obsidian_titan_mat = {'name': 'TitanObsidian', 'base_color': [0.1, 0.12, 0.16, 1.0], 'metallic': 0.85, 'roughness': 0.25}
    tempest_gold_mat = {'name': 'TempestGold', 'base_color': [0.95, 0.78, 0.22, 1.0], 'metallic': 0.9, 'roughness': 0.2}
    vortex_core_mat = {'name': 'TempestCore', 'base_color': [0.1, 0.95, 0.9, 1.0], 'metallic': 0.1, 'roughness': 0.1, 'emissive': [0.5, 2.5, 2.4]}

    parts = []
    # Monumental 3.2m Torso
    parts.append(make_box(0, 2.0, 0, 0.95, 1.1, 0.55, obsidian_titan_mat))
    # Swirling Tempest Core in Chest Fissure
    parts.append(make_cylinder(0, 2.1, 0.28, 0.28, 0.12, 12, vortex_core_mat))
    # Quad-Horned Divine Helm
    parts.append(make_box(0, 2.82, 0, 0.48, 0.52, 0.48, obsidian_titan_mat))
    parts.append(make_pyramid(-0.35, 3.05, 0.05, 0.18, 0.75, tempest_gold_mat))
    parts.append(make_pyramid( 0.35, 3.05, 0.05, 0.18, 0.75, tempest_gold_mat))
    parts.append(make_pyramid(-0.25, 3.05, -0.2, 0.14, 0.55, tempest_gold_mat))
    parts.append(make_pyramid( 0.25, 3.05, -0.2, 0.14, 0.55, tempest_gold_mat))
    # Massive Upper Wings (Span 4.2m)
    parts.append(make_box(-1.45, 2.65, -0.25, 1.85, 0.18, 0.65, tempest_gold_mat))
    parts.append(make_box( 1.45, 2.65, -0.25, 1.85, 0.18, 0.65, tempest_gold_mat))
    # Lower Secondary Wings (Span 2.8m)
    parts.append(make_box(-1.05, 1.85, -0.32, 1.35, 0.12, 0.48, obsidian_titan_mat))
    parts.append(make_box( 1.05, 1.85, -0.32, 1.35, 0.12, 0.48, obsidian_titan_mat))
    # Colossal Gale Scythe Claws
    parts.append(make_box(-0.75, 1.6, 0.4, 0.22, 0.22, 0.95, obsidian_titan_mat))
    parts.append(make_box(-0.75, 1.3, 0.95, 0.08, 0.85, 0.28, tempest_gold_mat))
    parts.append(make_box( 0.75, 1.6, 0.4, 0.22, 0.22, 0.95, obsidian_titan_mat))
    parts.append(make_box( 0.75, 1.3, 0.95, 0.08, 0.85, 0.28, tempest_gold_mat))
    # Armored Greaves & Talons
    parts.append(make_cylinder(-0.35, 0.85, 0, 0.24, 1.4, 10, obsidian_titan_mat))
    parts.append(make_cylinder( 0.35, 0.85, 0, 0.24, 1.4, 10, obsidian_titan_mat))
    parts.append(make_box(-0.35, 0.12, 0.18, 0.28, 0.22, 0.45, tempest_gold_mat))
    parts.append(make_box( 0.35, 0.12, 0.18, 0.28, 0.22, 0.45, tempest_gold_mat))
    return parts

def build_floating_island():
    stone_mat = {'name': 'CarvedBasalt', 'base_color': [0.35, 0.38, 0.42, 1.0], 'metallic': 0.1, 'roughness': 0.85}
    crag_mat = {'name': 'BottomCrags', 'base_color': [0.18, 0.19, 0.22, 1.0], 'metallic': 0.2, 'roughness': 0.95}
    trim_mat = {'name': 'GoldTrim', 'base_color': [0.85, 0.7, 0.25, 1.0], 'metallic': 0.7, 'roughness': 0.3}

    parts = []
    # Main Courtyard Platform (20m x 20m x 2.5m)
    parts.append(make_box(0, 0, 0, 20.0, 2.5, 20.0, stone_mat))
    # Golden Ornate Perimeter Rim
    parts.append(make_box(0, 1.35,  10.0, 20.4, 0.35, 0.6, trim_mat))
    parts.append(make_box(0, 1.35, -10.0, 20.4, 0.35, 0.6, trim_mat))
    parts.append(make_box( 10.0, 1.35, 0, 0.6, 0.35, 20.4, trim_mat))
    parts.append(make_box(-10.0, 1.35, 0, 0.6, 0.35, 20.4, trim_mat))
    # Under-Crags (Inverted Pyramids hanging into the sky abyss)
    parts.append(make_pyramid(0, -1.25, 0, 18.0, -12.0, crag_mat))
    parts.append(make_pyramid(-5.0, -1.25, -5.0, 8.0, -7.5, crag_mat))
    parts.append(make_pyramid( 5.0, -1.25,  5.0, 9.0, -8.5, crag_mat))
    return parts

def build_vayu_windmill():
    pillar_mat = {'name': 'PillarStone', 'base_color': [0.42, 0.44, 0.48, 1.0], 'metallic': 0.2, 'roughness': 0.75}
    turbine_mat = {'name': 'VayuBlades', 'base_color': [0.2, 0.75, 0.85, 1.0], 'metallic': 0.5, 'roughness': 0.3, 'emissive': [0.1, 0.6, 0.8]}

    parts = []
    # Main Tall Wind Pillar (Height 12m)
    parts.append(make_cylinder(0, 6.0, 0, 1.2, 12.0, 12, pillar_mat))
    # Rotating Nacelle / Hub at Top
    parts.append(make_box(0, 12.2, 0, 1.8, 1.8, 2.2, pillar_mat))
    # 3 Aerodynamic Vayu Turbine Blades
    for angle_deg in [0, 120, 240]:
        rad = math.radians(angle_deg)
        bx = math.sin(rad) * 3.5
        by = 12.2 + math.cos(rad) * 3.5
        parts.append(make_box(bx, by, 1.15, 0.65, 5.5, 0.12, turbine_mat))
    return parts

def build_grapple_anchor_ring():
    gold_ring_mat = {'name': 'GrappleRingGold', 'base_color': [0.95, 0.8, 0.25, 1.0], 'metallic': 0.85, 'roughness': 0.2}
    glow_core_mat = {'name': 'PranaGlowCore', 'base_color': [0.2, 0.95, 1.0, 1.0], 'metallic': 0.1, 'roughness': 0.1, 'emissive': [0.6, 2.4, 2.8]}

    parts = []
    # Golden Torus Ring (Radius 1.4m)
    parts.append(make_torus(0, 0, 0, 1.4, 0.18, 16, 8, gold_ring_mat))
    # Glowing Prana Lotus Core
    parts.append(make_cylinder(0, 0, 0, 0.45, 0.25, 10, glow_core_mat))
    # 4 Cardinal Anchor Prongs
    parts.append(make_pyramid(0,  1.6, 0, 0.35, 0.65, gold_ring_mat))
    parts.append(make_pyramid(0, -1.6, 0, 0.35, -0.65, gold_ring_mat))
    parts.append(make_pyramid( 1.6, 0, 0, 0.35, 0.65, gold_ring_mat))
    parts.append(make_pyramid(-1.6, 0, 0, 0.35, -0.65, gold_ring_mat))
    return parts

def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    char_enemy_dir = os.path.join(root, 'godot', 'assets', 'characters', 'enemies')
    env_dir = os.path.join(root, 'godot', 'assets', 'environment')
    os.makedirs(char_enemy_dir, exist_ok=True)
    os.makedirs(env_dir, exist_ok=True)

    assets = [
        (os.path.join(char_enemy_dir, 'gale_falcon.glb'), build_gale_falcon(), "Gale Falcon (Sky Predator)"),
        (os.path.join(char_enemy_dir, 'wind_archer.glb'), build_wind_archer(), "Wind Archer (Asura Sniper)"),
        (os.path.join(char_enemy_dir, 'boss_matarishvan.glb'), build_boss_matarishvan(), "Boss Matarishvan (Cyclone Titan)"),
        (os.path.join(env_dir, 'floating_island_base.glb'), build_floating_island(), "Floating Island Base (Basalt Citadel)"),
        (os.path.join(env_dir, 'vayu_windmill.glb'), build_vayu_windmill(), "Vayu Wind Turbine Pillar"),
        (os.path.join(env_dir, 'grapple_anchor_ring.glb'), build_grapple_anchor_ring(), "Grapple Anchor Celestial Ring"),
    ]

    for filepath, parts, desc in assets:
        glb_data = create_glb(parts)
        with open(filepath, 'wb') as f:
            f.write(glb_data)
        size_kb = len(glb_data) / 1024.0
        print(f"[Antariksha 3D Asset Gen] Generated {desc}: {os.path.basename(filepath)} ({size_kb:.1f} KB)")

if __name__ == '__main__':
    main()
