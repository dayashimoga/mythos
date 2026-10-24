#!/usr/bin/env python3
"""
Generate 3D Production Assets for Chapter IV: Realm of Svar / Svarga (The Celestial Solar Citadels)
Produces clean glTF 2.0 binary (.glb) files with PBR materials and normals:
- surya_guardian.glb (Celestial spearman with suncrest helm and radiant shield)
- solar_gryphon.glb (Majestic winged celestial beast with golden plumage)
- boss_surya_avatara.glb (Colossal 3.8m Sun Titan with radiant halo and solar greatsword)
- solar_prism_pillar.glb (Carved marble pillar with rotating crystal prism lens)
- celestial_sun_shikhara.glb (Majestic golden tiered solar temple pinnacle)
- surya_mahapeetham_pedestal.glb (Grand sunburst dais holding the Primal Solar Core)
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
                'baseColorFactor': mat_def.get('base_color', [0.9, 0.8, 0.3, 1.0]),
                'metallicFactor': mat_def.get('metallic', 0.5),
                'roughnessFactor': mat_def.get('roughness', 0.4)
            },
            'emissiveFactor': mat_def.get('emissive', [0.0, 0.0, 0.0])
        })

        primitives.append({
            'attributes': {'POSITION': acc_pos_idx, 'NORMAL': acc_norm_idx},
            'indices': acc_idx_idx,
            'material': mat_idx
        })

    mesh_obj = {'name': 'SvarMesh', 'primitives': primitives}
    nodes.append({'name': 'RootNode', 'mesh': 0})
    scene_nodes.append(0)

    gltf_dict = {
        'asset': {'version': '2.0', 'generator': 'Mythos Svar Solar Asset Pipeline'},
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
    base_idx = len(positions)
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
    base_idx = len(positions)
    hw, hd = b_w * 0.5, b_d * 0.5
    ox, oy, oz = offset
    tip = (ox, oy + height, oz)

    # 4 side faces
    faces = [
        ((ox-hw, oy, oz+hd), (ox+hw, oy, oz+hd), tip),
        ((ox+hw, oy, oz+hd), (ox+hw, oy, oz-hd), tip),
        ((ox+hw, oy, oz-hd), (ox-hw, oy, oz-hd), tip),
        ((ox-hw, oy, oz-hd), (ox-hw, oy, oz+hd), tip),
    ]

    for f in faces:
        idx = len(positions)
        v0, v1, v2 = f
        # calculate face normal
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

def add_disk(positions, normals, indices, radius, height, segs=10, offset=(0,0,0)):
    add_cylinder(positions, normals, indices, radius, radius, height, segs, offset)

# -------------------------------------------------------------------------
# Asset 1: surya_guardian.glb (Celestial Spearman with Suncrest & Shield)
# -------------------------------------------------------------------------
def generate_surya_guardian():
    meshes = []

    # 1. Golden Armor Body & Greaves
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, (0.7, 0.9, 0.45), (0, 1.1, 0)) # Cuirass
    add_cylinder(pos, norm, idx, 0.16, 0.13, 0.7, 8, (-0.22, 0.45, 0)) # Left leg
    add_cylinder(pos, norm, idx, 0.16, 0.13, 0.7, 8, (0.22, 0.45, 0))  # Right leg
    add_cylinder(pos, norm, idx, 0.14, 0.12, 0.6, 8, (-0.46, 1.15, 0)) # Left arm
    add_cylinder(pos, norm, idx, 0.14, 0.12, 0.6, 8, (0.46, 1.15, 0))  # Right arm
    meshes.append({
        'name': 'GuardianArmor',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'GoldenArmor', 'base_color': [0.92, 0.78, 0.22, 1.0], 'metallic': 0.75, 'roughness': 0.28}
    })

    # 2. Suncrest Helm & Radiance Visor
    pos2, norm2, idx2 = [], [], []
    add_cylinder(pos2, norm2, idx2, 0.22, 0.24, 0.35, 8, (0, 1.7, 0)) # Helm
    add_pyramid(pos2, norm2, idx2, 0.35, 0.08, 0.4, (0, 1.85, 0))     # Suncrest plume
    meshes.append({
        'name': 'SuncrestHelm',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'SuncrestGold', 'base_color': [1.0, 0.85, 0.3, 1.0], 'metallic': 0.85, 'roughness': 0.2, 'emissive': [0.6, 0.4, 0.1]}
    })

    # 3. Solar Spear (2.4m golden shaft with radiant diamond tip)
    pos3, norm3, idx3 = [], [], []
    add_cylinder(pos3, norm3, idx3, 0.035, 0.035, 2.4, 6, (0.55, 1.2, 0.3))
    add_pyramid(pos3, norm3, idx3, 0.14, 0.06, 0.45, (0.55, 2.4, 0.3))
    meshes.append({
        'name': 'SolarSpear',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'SpearTip', 'base_color': [1.0, 0.92, 0.4, 1.0], 'metallic': 0.9, 'roughness': 0.15, 'emissive': [0.8, 0.6, 0.1]}
    })

    # 4. Sunburst Shield (Round solar buckler on left arm)
    pos4, norm4, idx4 = [], [], []
    add_cylinder(pos4, norm4, idx4, 0.42, 0.42, 0.08, 10, (-0.55, 1.15, 0.25))
    add_cylinder(pos4, norm4, idx4, 0.18, 0.18, 0.12, 8, (-0.55, 1.15, 0.28))
    meshes.append({
        'name': 'SunShield',
        'positions': pos4, 'normals': norm4, 'indices': idx4,
        'material': {'name': 'ShieldGold', 'base_color': [0.88, 0.74, 0.2, 1.0], 'metallic': 0.8, 'roughness': 0.25, 'emissive': [0.4, 0.3, 0.05]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 2: solar_gryphon.glb (Winged Celestial Beast)
# -------------------------------------------------------------------------
def generate_solar_gryphon():
    meshes = []

    # 1. Muscular Feline Body & Limbs
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 0.45, 0.55, 1.6, 8, (0, 0.9, 0)) # Torso
    # 4 limbs
    add_cylinder(pos, norm, idx, 0.14, 0.12, 0.8, 6, (-0.35, 0.45, 0.5))
    add_cylinder(pos, norm, idx, 0.14, 0.12, 0.8, 6, (0.35, 0.45, 0.5))
    add_cylinder(pos, norm, idx, 0.15, 0.12, 0.85, 6, (-0.35, 0.45, -0.5))
    add_cylinder(pos, norm, idx, 0.15, 0.12, 0.85, 6, (0.35, 0.45, -0.5))
    # Tail
    add_cylinder(pos, norm, idx, 0.08, 0.04, 1.1, 6, (0, 0.8, -1.0))
    meshes.append({
        'name': 'GryphonBody',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'GoldenFeathers', 'base_color': [0.94, 0.82, 0.32, 1.0], 'metallic': 0.35, 'roughness': 0.5}
    })

    # 2. Avian Raptor Head & Curved Beak
    pos2, norm2, idx2 = [], [], []
    add_cylinder(pos2, norm2, idx2, 0.24, 0.3, 0.5, 6, (0, 1.4, 0.7)) # Head
    add_pyramid(pos2, norm2, idx2, 0.22, 0.16, 0.35, (0, 1.35, 0.95)) # Curved Beak
    meshes.append({
        'name': 'GryphonHead',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'SunBeak', 'base_color': [1.0, 0.7, 0.15, 1.0], 'metallic': 0.6, 'roughness': 0.3, 'emissive': [0.4, 0.25, 0.05]}
    })

    # 3. Swept Celestial Wings (2.2m wingspan)
    pos3, norm3, idx3 = [], [], []
    # Left wing
    add_box(pos3, norm3, idx3, (1.2, 0.06, 0.55), (-0.85, 1.3, -0.1))
    add_pyramid(pos3, norm3, idx3, 0.5, 0.06, 0.7, (-1.5, 1.3, -0.1))
    # Right wing
    add_box(pos3, norm3, idx3, (1.2, 0.06, 0.55), (0.85, 1.3, -0.1))
    add_pyramid(pos3, norm3, idx3, 0.5, 0.06, 0.7, (1.5, 1.3, -0.1))
    meshes.append({
        'name': 'SolarWings',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'WingsGold', 'base_color': [0.98, 0.88, 0.4, 1.0], 'metallic': 0.5, 'roughness': 0.35, 'emissive': [0.5, 0.35, 0.1]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 3: boss_surya_avatara.glb (Colossal 3.8m Sun Titan with Greatsword)
# -------------------------------------------------------------------------
def generate_boss_surya_avatara():
    meshes = []

    # 1. Colossal Golden Cuirass & Pauldrons (3.8m titan)
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, (1.4, 1.6, 0.9), (0, 2.3, 0)) # Massive Chest
    add_cylinder(pos, norm, idx, 0.36, 0.3, 1.4, 8, (-0.45, 0.9, 0)) # Left leg
    add_cylinder(pos, norm, idx, 0.36, 0.3, 1.4, 8, (0.45, 0.9, 0))  # Right leg
    add_cylinder(pos, norm, idx, 0.32, 0.28, 1.3, 8, (-0.95, 2.3, 0)) # Left arm
    add_cylinder(pos, norm, idx, 0.32, 0.28, 1.3, 8, (0.95, 2.3, 0))  # Right arm
    # Flaring shoulder pauldrons
    add_pyramid(pos, norm, idx, 0.65, 0.65, 0.5, (-1.1, 2.9, 0))
    add_pyramid(pos, norm, idx, 0.65, 0.65, 0.5, (1.1, 2.9, 0))
    meshes.append({
        'name': 'TitanCuirass',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'TitanGold', 'base_color': [0.95, 0.76, 0.18, 1.0], 'metallic': 0.85, 'roughness': 0.22}
    })

    # 2. Flaming Sunburst Halo Ring (Hovering behind head)
    pos2, norm2, idx2 = [], [], []
    add_cylinder(pos2, norm2, idx2, 0.38, 0.42, 0.6, 8, (0, 3.4, 0)) # Crowned head
    # Circular Halo Disk
    add_cylinder(pos2, norm2, idx2, 1.2, 1.2, 0.08, 12, (0, 3.5, -0.4))
    # 8 Radial Sun Flares on Halo
    for s in range(8):
        ang = 2.0 * math.pi * s / 8.0
        fx, fy = 1.35 * math.cos(ang), 1.35 * math.sin(ang)
        add_pyramid(pos2, norm2, idx2, 0.25, 0.06, 0.38, (fx, 3.5 + fy, -0.4))
    meshes.append({
        'name': 'SunburstHalo',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'RadiantHalo', 'base_color': [1.0, 0.65, 0.12, 1.0], 'metallic': 0.9, 'roughness': 0.15, 'emissive': [1.0, 0.6, 0.1]}
    })

    # 3. 2.8m Solar Greatsword (Right hand)
    pos3, norm3, idx3 = [], [], []
    add_cylinder(pos3, norm3, idx3, 0.07, 0.07, 0.9, 6, (1.2, 1.5, 0.6)) # Hilt
    add_box(pos3, norm3, idx3, (0.7, 0.12, 0.2), (1.2, 1.95, 0.6))      # Crossguard
    add_box(pos3, norm3, idx3, (0.32, 2.1, 0.08), (1.2, 3.0, 0.6))      # Heavy Blade
    add_pyramid(pos3, norm3, idx3, 0.32, 0.08, 0.45, (1.2, 4.05, 0.6))  # Blade tip
    meshes.append({
        'name': 'SolarGreatsword',
        'positions': pos3, 'normals': norm3, 'indices': idx3,
        'material': {'name': 'SolarBlade', 'base_color': [1.0, 0.88, 0.35, 1.0], 'metallic': 0.92, 'roughness': 0.18, 'emissive': [0.95, 0.7, 0.2]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 4: solar_prism_pillar.glb (Marble Pillar with Crystal Prism Lens)
# -------------------------------------------------------------------------
def generate_solar_prism_pillar():
    meshes = []

    # 1. Carved Celestial Marble Fluted Shaft
    pos, norm, idx = [], [], []
    add_box(pos, norm, idx, (1.2, 0.35, 1.2), (0, 0.18, 0)) # Base plinth
    add_cylinder(pos, norm, idx, 0.4, 0.45, 3.0, 10, (0, 1.85, 0)) # Fluted shaft
    add_box(pos, norm, idx, (1.1, 0.3, 1.1), (0, 3.5, 0))   # Capital
    meshes.append({
        'name': 'MarblePillar',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'CelestialMarble', 'base_color': [0.94, 0.94, 0.92, 1.0], 'metallic': 0.1, 'roughness': 0.4}
    })

    # 2. Golden Gimbal Armature & Prismatic Crystal Lens
    pos2, norm2, idx2 = [], [], []
    add_cylinder(pos2, norm2, idx2, 0.55, 0.55, 0.12, 8, (0, 3.8, 0)) # Gimbal Ring
    add_cylinder(pos2, norm2, idx2, 0.38, 0.38, 0.4, 6, (0, 4.15, 0))  # Hexagonal Lens
    add_pyramid(pos2, norm2, idx2, 0.38, 0.38, 0.3, (0, 4.35, 0))      # Top facet
    add_pyramid(pos2, norm2, idx2, 0.38, 0.38, -0.3, (0, 3.95, 0))     # Bottom facet
    meshes.append({
        'name': 'PrismLens',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'SolarCrystal', 'base_color': [0.75, 0.92, 1.0, 0.85], 'metallic': 0.1, 'roughness': 0.08, 'emissive': [0.3, 0.8, 0.95]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 5: celestial_sun_shikhara.glb (Majestic Golden Sun Temple Spire)
# -------------------------------------------------------------------------
def generate_celestial_sun_shikhara():
    meshes = []

    pos, norm, idx = [], [], []
    # 4 Stepped Tiered Decks
    add_box(pos, norm, idx, (4.2, 0.8, 4.2), (0, 0.4, 0))
    add_box(pos, norm, idx, (3.4, 0.8, 3.4), (0, 1.2, 0))
    add_box(pos, norm, idx, (2.6, 0.8, 2.6), (0, 2.0, 0))
    add_box(pos, norm, idx, (1.9, 0.8, 1.9), (0, 2.8, 0))

    # Tapered Nagara Spire
    add_cylinder(pos, norm, idx, 0.7, 1.3, 2.8, 8, (0, 4.6, 0))

    # Amalaka (ribbed crown disk) & Golden Kalasha Finial
    add_cylinder(pos, norm, idx, 0.95, 0.95, 0.3, 10, (0, 6.15, 0))
    add_cylinder(pos, norm, idx, 0.35, 0.55, 0.6, 8, (0, 6.6, 0))
    add_pyramid(pos, norm, idx, 0.35, 0.35, 0.7, (0, 6.9, 0))

    meshes.append({
        'name': 'SunShikhara',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'GildedSanctuary', 'base_color': [0.9, 0.75, 0.24, 1.0], 'metallic': 0.65, 'roughness': 0.32, 'emissive': [0.35, 0.25, 0.05]}
    })

    return create_glb(meshes)

# -------------------------------------------------------------------------
# Asset 6: surya_mahapeetham_pedestal.glb (Grand Sunburst Dais Altar)
# -------------------------------------------------------------------------
def generate_surya_mahapeetham_pedestal():
    meshes = []

    # 1. Octagonal Tiered Plinth
    pos, norm, idx = [], [], []
    add_cylinder(pos, norm, idx, 3.2, 3.6, 0.6, 8, (0, 0.3, 0))
    add_cylinder(pos, norm, idx, 2.5, 2.8, 0.5, 8, (0, 0.85, 0))
    add_cylinder(pos, norm, idx, 1.8, 2.0, 0.5, 8, (0, 1.35, 0))
    # 8 Sun Ray Extensions
    for s in range(8):
        ang = 2.0 * math.pi * s / 8.0
        rx, rz = 2.6 * math.cos(ang), 2.6 * math.sin(ang)
        add_pyramid(pos, norm, idx, 0.55, 0.3, 0.75, (rx, 0.6, rz))
    meshes.append({
        'name': 'MahapeethamDais',
        'positions': pos, 'normals': norm, 'indices': idx,
        'material': {'name': 'WhiteGoldDais', 'base_color': [0.94, 0.86, 0.45, 1.0], 'metallic': 0.75, 'roughness': 0.25}
    })

    # 2. Central Primal Solar Core Sphere
    pos2, norm2, idx2 = [], [], []
    add_cylinder(pos2, norm2, idx2, 0.65, 0.65, 0.6, 8, (0, 1.9, 0))
    add_pyramid(pos2, norm2, idx2, 0.65, 0.65, 0.45, (0, 2.2, 0))
    add_pyramid(pos2, norm2, idx2, 0.65, 0.65, -0.45, (0, 1.6, 0))
    meshes.append({
        'name': 'PrimalSolarCore',
        'positions': pos2, 'normals': norm2, 'indices': idx2,
        'material': {'name': 'SolarCoreFlame', 'base_color': [1.0, 0.82, 0.2, 1.0], 'metallic': 0.9, 'roughness': 0.1, 'emissive': [1.0, 0.7, 0.15]}
    })

    return create_glb(meshes)

def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    char_dir = os.path.join(repo_root, 'godot', 'assets', 'characters', 'enemies')
    env_dir = os.path.join(repo_root, 'godot', 'assets', 'environment')

    os.makedirs(char_dir, exist_ok=True)
    os.makedirs(env_dir, exist_ok=True)

    assets = [
        (os.path.join(char_dir, 'surya_guardian.glb'), generate_surya_guardian),
        (os.path.join(char_dir, 'solar_gryphon.glb'), generate_solar_gryphon),
        (os.path.join(char_dir, 'boss_surya_avatara.glb'), generate_boss_surya_avatara),
        (os.path.join(env_dir, 'solar_prism_pillar.glb'), generate_solar_prism_pillar),
        (os.path.join(env_dir, 'celestial_sun_shikhara.glb'), generate_celestial_sun_shikhara),
        (os.path.join(env_dir, 'surya_mahapeetham_pedestal.glb'), generate_surya_mahapeetham_pedestal),
    ]

    print("--- Generating Chapter IV (Realm of Svar / Svarga) 3D Production Assets ---")
    for file_path, gen_func in assets:
        glb_data = gen_func()
        with open(file_path, 'wb') as f:
            f.write(glb_data)
        size_kb = len(glb_data) / 1024.0
        print(f"  [OK] {os.path.relpath(file_path, repo_root)} ({size_kb:.1f} KB)")
    print("All Chapter IV binary glTF assets successfully generated.\n")

if __name__ == '__main__':
    main()
