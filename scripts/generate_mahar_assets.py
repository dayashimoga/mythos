#!/usr/bin/env python3
"""
Generate 3D Production Assets for Chapter V: Realm of Maharloka (The Sage Sanctuary & Astral Libraries)
Produces clean glTF 2.0 binary (.glb) files with PBR materials and normals:
- astral_rishi.glb (Floating sage with meditation aura, flowing robes, and prayer beads)
- scripture_golem.glb (Living stone manuscript guardian with stone tablet fists and bound codices)
- boss_brihaspati.glb (Colossal 4.0m Guru of Gods / Astral Sage Titan with celestial armillary sphere)
- astral_library_shelf.glb (Towering tiered celestial library bookshelf with glowing Sanskrit codices)
- floating_scroll_altar.glb (Levitating parchment dais with inscribed glyphs)
- mahar_mandala_pedestal.glb (Sacred cosmic mandala plinth for the Sage Core)
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
                'baseColorFactor': mat_def.get('base_color', [0.3, 0.4, 0.8, 1.0]),
                'metallicFactor': mat_def.get('metallic', 0.2),
                'roughnessFactor': mat_def.get('roughness', 0.5)
            },
            'emissiveFactor': mat_def.get('emissive', [0.0, 0.0, 0.0])
        })

        primitives.append({
            'attributes': {'POSITION': acc_pos_idx, 'NORMAL': acc_norm_idx},
            'indices': acc_idx_idx,
            'material': mat_idx
        })

    mesh_obj = {'name': 'MaharMesh', 'primitives': primitives}
    nodes.append({'name': 'RootNode', 'mesh': 0})
    scene_nodes.append(0)

    gltf_dict = {
        'asset': {'version': '2.0', 'generator': 'Mythos Maharloka Astral Asset Pipeline'},
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
# Asset 1: astral_rishi.glb (Floating Sage with meditation aura & robes)
# -------------------------------------------------------------------------
def generate_astral_rishi():
    meshes = []

    # 1. Flowing Indigo/Saffron Robe & Lotus Seat Torso
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.35, 0.55, 0.8, 8, (0, 0.7, 0)) # Robed body
    add_cylinder(pos, norm, idx, 0.55, 0.6, 0.3, 8, (0, 0.25, 0))  # Crossed legs / lotus base
    add_cylinder(pos, norm, idx, 0.12, 0.1, 0.5, 6, (-0.38, 0.7, 0.15)) # Left robed arm
    add_cylinder(pos, norm, idx, 0.12, 0.1, 0.5, 6, (0.38, 0.7, 0.15))  # Right robed arm
    meshes.append({
        'name': 'RishiRobes',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'IndigoSaffronCloth', 'base_color': [0.28, 0.24, 0.55, 1.0], 'metallic': 0.1, 'roughness': 0.7}
    })

    # 2. Sage Head, Beard & Jata (Topknot)
    pos2, norm2, idx2 = [], [], []
    add_cylinder(pos2, norm2, idx2, 0.18, 0.16, 0.28, 8, (0, 1.25, 0)) # Head
    add_cylinder(pos2, norm2, idx2, 0.12, 0.16, 0.25, 6, (0, 1.5, 0))  # Jata / hair bun
    add_pyramid(pos2, norm2, idx2, 0.22, 0.15, 0.28, (0, 1.15, 0.1))    # Ascetic beard
    meshes.append({
        'name': 'SageHead',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'SageSkinHair', 'base_color': [0.75, 0.6, 0.45, 1.0], 'metallic': 0.05, 'roughness': 0.6}
    })

    # 3. Astral Aura Disk & Levitating Rosary Beads
    pos3, norm3, idx3 = [], [], []
    add_torus(pos3, norm3, idx3, 0.48, 0.035, 12, 6, (0, 1.25, -0.05)) # Astral halo ring
    add_torus(pos3, norm3, idx3, 0.22, 0.02, 10, 4, (0, 0.65, 0.28))   # Prayer beads (Rudraksha)
    add_cylinder(pos3, norm3, idx3, 0.06, 0.06, 0.15, 6, (0, 0.8, 0.35)) # Floating mantra crystal
    meshes.append({
        'name': 'AstralAura',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'AstralGlow', 'base_color': [0.55, 0.7, 1.0, 1.0], 'metallic': 0.8, 'roughness': 0.15, 'emissive': [0.4, 0.6, 1.0]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 2: scripture_golem.glb (Living Stone Manuscript Guardian)
# -------------------------------------------------------------------------
def generate_scripture_golem():
    meshes = []

    # 1. Carved Basalt / Granite Torso & Shoulders
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, (0.85, 0.95, 0.6), (0, 1.2, 0)) # Stone chest
    add_box(pos, norm, idx, (0.45, 0.35, 0.45), (-0.6, 1.45, 0)) # Left stone pauldron
    add_box(pos, norm, idx, (0.45, 0.35, 0.45), (0.6, 1.45, 0))  # Right stone pauldron
    add_cylinder(pos, norm, idx, 0.22, 0.25, 0.8, 8, (-0.28, 0.45, 0)) # Left stone leg
    add_cylinder(pos, norm, idx, 0.22, 0.25, 0.8, 8, (0.28, 0.45, 0))  # Right stone leg
    meshes.append({
        'name': 'StoneBody',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'GraniteStone', 'base_color': [0.4, 0.42, 0.48, 1.0], 'metallic': 0.3, 'roughness': 0.65}
    })

    # 2. Bound Palm-Leaf Codices & Carved Script Inlays
    pos2, norm2, idx2 = [], [], []
    add_box(pos2, norm2, idx2, (0.75, 0.25, 0.15), (0, 1.0, 0.32)) # Bound scriptures across chest
    add_box(pos2, norm2, idx2, (0.75, 0.25, 0.15), (0, 1.3, 0.32))
    add_box(pos2, norm2, idx2, (0.35, 0.35, 0.35), (0, 1.8, 0))   # Stone head
    meshes.append({
        'name': 'ScriptureInlays',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'PalmParchment', 'base_color': [0.82, 0.75, 0.52, 1.0], 'metallic': 0.1, 'roughness': 0.85}
    })

    # 3. Heavy Stone Tablet Fists with Inscribed Runes
    pos3, norm3, idx3 = [], [], []
    add_cylinder(pos3, norm3, idx3, 0.18, 0.16, 0.7, 6, (-0.62, 0.95, 0)) # Left arm
    add_cylinder(pos3, norm3, idx3, 0.18, 0.16, 0.7, 6, (0.62, 0.95, 0))  # Right arm
    add_box(pos3, norm3, idx3, (0.35, 0.45, 0.25), (-0.65, 0.5, 0.1))     # Left tablet fist
    add_box(pos3, norm3, idx3, (0.35, 0.45, 0.25), (0.65, 0.5, 0.1))      # Right tablet fist
    meshes.append({
        'name': 'TabletFists',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'RunicFists', 'base_color': [0.35, 0.38, 0.45, 1.0], 'metallic': 0.5, 'roughness': 0.4, 'emissive': [0.2, 0.4, 0.8]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 3: boss_brihaspati.glb (Guru of Gods / Astral Sage Titan 4.0m)
# -------------------------------------------------------------------------
def generate_boss_brihaspati():
    meshes = []

    # 1. Colossal Robed Astral Body
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.7, 1.1, 2.0, 10, (0, 1.5, 0)) # Broad robed torso/lower body
    add_cylinder(pos, norm, idx, 0.35, 0.3, 1.4, 8, (-0.95, 2.0, 0.2)) # Left arm
    add_cylinder(pos, norm, idx, 0.35, 0.3, 1.4, 8, (0.95, 2.0, 0.2))  # Right arm
    meshes.append({
        'name': 'TitanBody',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'RoyalAstralRobes', 'base_color': [0.18, 0.22, 0.48, 1.0], 'metallic': 0.35, 'roughness': 0.45}
    })

    # 2. Celestial Armillary Sphere (Rotating astral rings around titan)
    pos2, norm2, idx2 = [], [], []
    add_torus(pos2, norm2, idx2, 1.5, 0.05, 16, 6, (0, 2.2, 0)) # Horizontal equatorial ring
    add_torus(pos2, norm2, idx2, 1.3, 0.045, 16, 6, (0, 2.2, 0)) # Inner ring
    add_cylinder(pos2, norm2, idx2, 0.35, 0.32, 0.6, 8, (0, 2.75, 0)) # Regal sage head
    add_pyramid(pos2, norm2, idx2, 0.45, 0.35, 0.5, (0, 2.5, 0.2))    # Golden beard
    add_cylinder(pos2, norm2, idx2, 0.25, 0.3, 0.45, 6, (0, 3.2, 0))   # High Rishi Mukuta (Crown)
    meshes.append({
        'name': 'ArmillaryRingsAndCrown',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'CelestialBrassGold', 'base_color': [0.95, 0.82, 0.35, 1.0], 'metallic': 0.85, 'roughness': 0.25, 'emissive': [0.35, 0.25, 0.08]}
    })

    # 3. Radiant Sapphire Halo & Levitating Scriptural Tomes
    pos3, norm3, idx3 = [], [], []
    add_disk(pos3, norm3, idx3, 0.9, 0.05, 16, (0, 2.9, -0.3)) # Cosmic halo disc
    # 4 Levitating celestial manuscript tomes orbiting the Guru
    tome_dist = 1.35
    for k in range(4):
        ang = k * math.pi * 0.5
        tx, tz = tome_dist * math.cos(ang), tome_dist * math.sin(ang)
        add_box(pos3, norm3, idx3, (0.35, 0.45, 0.08), (tx, 2.2, tz))
    meshes.append({
        'name': 'SapphireHaloAndTomes',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'SapphireRadiance', 'base_color': [0.3, 0.6, 1.0, 1.0], 'metallic': 0.9, 'roughness': 0.1, 'emissive': [0.5, 0.8, 1.0]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 4: astral_library_shelf.glb (Tiered Celestial Library Bookshelf)
# -------------------------------------------------------------------------
def generate_astral_library_shelf():
    meshes = []

    # 1. Carved Marble & Wood Bookcase Frame (4m tall, 3m wide)
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, (3.0, 0.2, 0.7), (0, 0.1, 0)) # Base plinth
    add_box(pos, norm, idx, (3.0, 0.2, 0.7), (0, 3.9, 0)) # Top cornice
    add_box(pos, norm, idx, (0.2, 3.8, 0.65), (-1.4, 2.0, 0)) # Left upright
    add_box(pos, norm, idx, (0.2, 3.8, 0.65), (1.4, 2.0, 0))  # Right upright
    add_box(pos, norm, idx, (0.15, 3.8, 0.6), (0.0, 2.0, 0))  # Center divider
    # 3 Intermediate shelves
    add_box(pos, norm, idx, (2.8, 0.1, 0.6), (0, 1.1, 0))
    add_box(pos, norm, idx, (2.8, 0.1, 0.6), (0, 2.0, 0))
    add_box(pos, norm, idx, (2.8, 0.1, 0.6), (0, 2.9, 0))
    meshes.append({
        'name': 'ShelfFrame',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'MaharMarbleWood', 'base_color': [0.75, 0.72, 0.8, 1.0], 'metallic': 0.2, 'roughness': 0.5}
    })

    # 2. Sanskrit Codices & Illuminated Manuscripts
    pos2, norm2, idx2 = [], [], []
    # Place rows of books on shelves
    shelf_heights = [0.2 + 0.45, 1.1 + 0.45, 2.0 + 0.45, 2.9 + 0.45]
    for sh in shelf_heights:
        for side in [-0.7, 0.7]:
            for b in range(5):
                bx = side + (b - 2) * 0.22
                add_box(pos2, norm2, idx2, (0.18, 0.7, 0.45), (bx, sh, 0))
    meshes.append({
        'name': 'ManuscriptRows',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'VedicCodices', 'base_color': [0.85, 0.55, 0.25, 1.0], 'metallic': 0.1, 'roughness': 0.8}
    })

    # 3. Glowing Astral Filigree & Runes
    pos3, norm3, idx3 = [], [], []
    add_cylinder(pos3, norm3, idx3, 0.08, 0.08, 3.8, 6, (-1.35, 2.0, 0.32)) # Left glowing inlay
    add_cylinder(pos3, norm3, idx3, 0.08, 0.08, 3.8, 6, (1.35, 2.0, 0.32))  # Right glowing inlay
    add_disk(pos3, norm3, idx3, 0.4, 0.05, 12, (0, 4.2, 0)) # Top mandala medallion
    meshes.append({
        'name': 'ShelfRunes',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'AstralFiligree', 'base_color': [0.4, 0.7, 1.0, 1.0], 'metallic': 0.85, 'roughness': 0.2, 'emissive': [0.3, 0.6, 1.0]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 5: floating_scroll_altar.glb (Levitating Parchment Dais)
# -------------------------------------------------------------------------
def generate_floating_scroll_altar():
    meshes = []

    # 1. Carved Lotus Pedestal
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.65, 0.85, 0.3, 8, (0, 0.15, 0)) # Base
    add_cylinder(pos, norm, idx, 0.55, 0.6, 0.5, 8, (0, 0.55, 0))  # Stem
    add_cylinder(pos, norm, idx, 0.9, 0.6, 0.25, 8, (0, 0.92, 0))  # Flared lectern dais
    meshes.append({
        'name': 'LecternBase',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'CelestialGranite', 'base_color': [0.65, 0.68, 0.75, 1.0], 'metallic': 0.3, 'roughness': 0.5}
    })

    # 2. Levitating Unfurled Parchment Scroll
    pos2, norm2, idx2 = [], [], []
    # Angled scroll sheet
    add_box(pos2, norm2, idx2, (1.1, 0.04, 0.75), (0, 1.15, 0))
    # Scroll roller rods at sides
    add_cylinder(pos2, norm2, idx2, 0.05, 0.05, 0.85, 6, (-0.56, 1.15, 0))
    add_cylinder(pos2, norm2, idx2, 0.05, 0.05, 0.85, 6, (0.56, 1.15, 0))
    meshes.append({
        'name': 'UnfurledScroll',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'GoldenParchment', 'base_color': [0.92, 0.85, 0.62, 1.0], 'metallic': 0.1, 'roughness': 0.75}
    })

    # 3. Astral Levitation Field Rune Rings
    pos3, norm3, idx3 = [], [], []
    add_torus(pos3, norm3, idx3, 0.75, 0.03, 16, 6, (0, 1.05, 0)) # Levitating rune ring
    add_cylinder(pos3, norm3, idx3, 0.08, 0.08, 0.2, 6, (0, 1.3, 0)) # Central hovering focal crystal
    meshes.append({
        'name': 'ScrollRunes',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'ScrollGlow', 'base_color': [0.4, 0.8, 1.0, 1.0], 'metallic': 0.8, 'roughness': 0.15, 'emissive': [0.5, 0.9, 1.0]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 6: mahar_mandala_pedestal.glb (Sacred Cosmic Mandala Plinth)
# -------------------------------------------------------------------------
def generate_mahar_mandala_pedestal():
    meshes = []

    # 1. Tiered Stepped Octagonal Altar Base
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 2.4, 2.6, 0.35, 8, (0, 0.17, 0)) # Tier 1 plinth
    add_cylinder(pos, norm, idx, 1.9, 2.1, 0.35, 8, (0, 0.52, 0)) # Tier 2 plinth
    add_cylinder(pos, norm, idx, 1.4, 1.6, 0.35, 8, (0, 0.87, 0)) # Tier 3 plinth
    meshes.append({
        'name': 'AltarTiers',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'AstralPlinthStone', 'base_color': [0.45, 0.48, 0.6, 1.0], 'metallic': 0.4, 'roughness': 0.45}
    })

    # 2. Carved 8-Petal Lotus Dais & Core Socket
    pos2, norm2, idx2 = [], [], []
    for p in range(8):
        ang = p * math.pi * 0.25
        ca, sa = math.cos(ang), math.sin(ang)
        add_pyramid(pos2, norm2, idx2, 0.6, 0.4, 0.35, (ca * 1.2, 1.05, sa * 1.2))
    # Central socket
    add_cylinder(pos2, norm2, idx2, 0.65, 0.55, 0.3, 8, (0, 1.15, 0))
    meshes.append({
        'name': 'LotusPetals',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'GildedLotus', 'base_color': [0.85, 0.75, 0.4, 1.0], 'metallic': 0.75, 'roughness': 0.3}
    })

    # 3. The Sage Core (Prismatic Floating Octahedron of Maharloka)
    pos3, norm3, idx3 = [], [], []
    # Double pyramid = Octahedron
    add_pyramid(pos3, norm3, idx3, 0.6, 0.6, 0.5, (0, 1.6, 0))
    # Bottom half (inverted pyramid)
    b_idx = len(pos3)
    hw = 0.3
    top_tip = (0, 1.1, 0)
    faces = [
        ((-hw, 1.6, hw), (hw, 1.6, hw), top_tip),
        ((hw, 1.6, hw), (hw, 1.6, -hw), top_tip),
        ((hw, 1.6, -hw), (-hw, 1.6, -hw), top_tip),
        ((-hw, 1.6, -hw), (-hw, 1.6, hw), top_tip)
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

    add_torus(pos3, norm3, idx3, 0.7, 0.04, 16, 6, (0, 1.6, 0)) # Orbiting ring
    meshes.append({
        'name': 'SageCoreCrystal',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'SageCoreRadiance', 'base_color': [0.4, 0.8, 1.0, 1.0], 'metallic': 0.9, 'roughness': 0.1, 'emissive': [0.6, 0.9, 1.0]}
    })

    return create_glb(meshes)

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    enemy_dir = os.path.join(root, 'godot', 'assets', 'characters', 'enemies')
    env_dir = os.path.join(root, 'godot', 'assets', 'environment')

    os.makedirs(enemy_dir, exist_ok=True)
    os.makedirs(env_dir, exist_ok=True)

    assets = [
        ('astral_rishi.glb', enemy_dir, generate_astral_rishi),
        ('scripture_golem.glb', enemy_dir, generate_scripture_golem),
        ('boss_brihaspati.glb', enemy_dir, generate_boss_brihaspati),
        ('astral_library_shelf.glb', env_dir, generate_astral_library_shelf),
        ('floating_scroll_altar.glb', env_dir, generate_floating_scroll_altar),
        ('mahar_mandala_pedestal.glb', env_dir, generate_mahar_mandala_pedestal),
    ]

    print("Generating Chapter V: Realm of Maharloka (Astral Libraries) 3D Assets...")
    for filename, out_dir, generator in assets:
        path = os.path.join(out_dir, filename)
        glb_bytes = generator()
        with open(path, 'wb') as f:
            f.write(glb_bytes)
        print(f"  [OK] {filename} ({len(glb_bytes)} bytes) -> {os.path.relpath(path, root)}")

    print("\nAll Chapter V Maharloka glTF 2.0 assets generated successfully.")

if __name__ == '__main__':
    main()
