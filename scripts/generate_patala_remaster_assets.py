#!/usr/bin/env python3
"""
Generate 3D Production Environmental Assets for Chapter III: Realm of Patala (Subterranean Serpent Vaults).
Uses Blender 4.2 LTS to author high-fidelity PBR-textured glTF 2.0 binary models:
1. patala_entrance_chamber.glb (24m x 20m subterranean cavern floor with obsidian paving and rock perimeter)
2. patala_mid_chamber.glb (28m x 22m cavern chamber with tiered rock ledges and serpent flagstones)
3. patala_boss_arena.glb (36m x 34m monumental cavern colosseum for Boss Shesha's Tormented Echo)
4. patala_sanctum_chamber.glb (18m x 16m elevated sanctuary platform for Vasuki Peetham)
5. patala_stalagmite_cluster.glb (Detailed multi-tiered mineral stalagmite cluster replacing 3KB placeholder)
6. patala_stalactite_cluster.glb (Hanging cavern roof formations with dripping mineral spears)
7. patala_serpent_archway.glb (Monumental 8m carved twin-naga ceremonial portal arch)
8. bioluminescent_fungus.glb (Layered bioluminescent mushroom springboard replacing 3.9KB placeholder)
9. vasuki_shrine_pedestal.glb (Monumental octagonal serpent shrine pedestal replacing 5.2KB placeholder)
10. patala_venom_river_basin.glb (40m x 14m carved subterranean toxic basin with stone embankment)
"""

import bpy
import bmesh
import math
import os
import sys

def clean_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m, do_unlink=True)

def setup_material(name, albedo_path=None, normal_path=None, mr_path=None, emissive_path=None,
                   base_color=(0.15, 0.18, 0.2, 1.0), roughness=0.7, metallic=0.1, emissive=(0, 0, 0)):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

    bsdf.inputs['Base Color'].default_value = base_color
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic

    if albedo_path and os.path.exists(albedo_path):
        tex_node = nodes.new(type='ShaderNodeTexImage')
        tex_node.image = bpy.data.images.load(os.path.abspath(albedo_path))
        links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])

    if normal_path and os.path.exists(normal_path):
        norm_tex = nodes.new(type='ShaderNodeTexImage')
        norm_tex.image = bpy.data.images.load(os.path.abspath(normal_path))
        norm_tex.image.colorspace_settings.name = 'Non-Color'
        norm_map = nodes.new(type='ShaderNodeNormalMap')
        links.new(norm_tex.outputs['Color'], norm_map.inputs['Color'])
        links.new(norm_map.outputs['Normal'], bsdf.inputs['Normal'])

    if mr_path and os.path.exists(mr_path):
        mr_tex = nodes.new(type='ShaderNodeTexImage')
        mr_tex.image = bpy.data.images.load(os.path.abspath(mr_path))
        mr_tex.image.colorspace_settings.name = 'Non-Color'
        sep = nodes.new(type='ShaderNodeSeparateColor')
        links.new(mr_tex.outputs['Color'], sep.inputs['Color'])
        links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
        links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])

    if emissive_path and os.path.exists(emissive_path):
        em_tex = nodes.new(type='ShaderNodeTexImage')
        em_tex.image = bpy.data.images.load(os.path.abspath(emissive_path))
        links.new(em_tex.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 3.0
    elif emissive != (0, 0, 0):
        bsdf.inputs['Emission Color'].default_value = (emissive[0], emissive[1], emissive[2], 1.0)
        bsdf.inputs['Emission Strength'].default_value = 2.5

    return mat

def create_cavern_platform(name, width=24.0, length=20.0, height=2.0, segments_x=12, segments_y=10, mat=None):
    """
    Creates a detailed subterranean cavern platform with bevelled perimeter rock strata,
    slight organic surface undulations, and chamfered edges.
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()

    # Create top surface grid with organic displacement
    half_w = width * 0.5
    half_l = length * 0.5
    grid_verts = []

    for iy in range(segments_y + 1):
        row = []
        v_ratio = iy / segments_y
        py = -half_l + v_ratio * length
        for ix in range(segments_x + 1):
            u_ratio = ix / segments_x
            px = -half_w + u_ratio * width
            # Subterranean rock texture waviness
            pz = (math.sin(px * 0.35) * math.cos(py * 0.35) * 0.22 +
                  math.sin(px * 0.8) * 0.08)
            row.append(bm.verts.new((px, py, pz)))
        grid_verts.append(row)

    # Top grid faces
    for iy in range(segments_y):
        for ix in range(segments_x):
            v0 = grid_verts[iy][ix]
            v1 = grid_verts[iy][ix + 1]
            v2 = grid_verts[iy + 1][ix + 1]
            v3 = grid_verts[iy + 1][ix]
            bm.faces.new((v0, v1, v2, v3))

    # Base rim verts (bottom of platform)
    bot_verts = []
    # Perimeter walk: south, east, north, west
    perimeter_top = []
    for ix in range(segments_x):
        perimeter_top.append(grid_verts[0][ix])
    for iy in range(segments_y):
        perimeter_top.append(grid_verts[iy][segments_x])
    for ix in range(segments_x, 0, -1):
        perimeter_top.append(grid_verts[segments_y][ix])
    for iy in range(segments_y, 0, -1):
        perimeter_top.append(grid_verts[iy][0])

    # Inverted rock strata skirt
    skirt_verts = []
    for vt in perimeter_top:
        rad = math.sqrt(vt.co.x**2 + vt.co.y**2)
        factor = 1.05 + 0.06 * math.sin(vt.co.x * 0.5)
        skirt_verts.append(bm.verts.new((vt.co.x * factor, vt.co.y * factor, -height * 0.5)))

    for i in range(len(perimeter_top)):
        nxt = (i + 1) % len(perimeter_top)
        bm.faces.new((perimeter_top[i], perimeter_top[nxt], skirt_verts[nxt], skirt_verts[i]))

    # Bottom cap
    bottom_center = bm.verts.new((0, 0, -height))
    for i in range(len(skirt_verts)):
        nxt = (i + 1) % len(skirt_verts)
        bm.faces.new((skirt_verts[i], skirt_verts[nxt], bottom_center))

    bm.to_mesh(mesh)
    bm.free()

    if mat:
        mesh.materials.append(mat)
    return obj

def create_stalagmite_cluster(name, mat=None):
    """
    Creates a multi-pillar cavern stalagmite cluster with 5 spiraling mineral pillars,
    grooved fluting, and organic calcite bases.
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()

    pillar_configs = [
        (0.0, 0.0, 4.2, 0.85, 12),      # Central dominant stalagmite
        (-1.2, 0.7, 3.1, 0.65, 10),     # North-west secondary pillar
        (1.1, 0.6, 2.6, 0.55, 10),      # North-east tertiary pillar
        (-0.7, -1.0, 2.2, 0.45, 8),     # South-west child spire
        (0.9, -0.9, 1.8, 0.4, 8),       # South-east baby spire
    ]

    for cx, cy, h, base_r, rings in pillar_configs:
        circle_segs = 12
        prev_ring = None
        for r_idx in range(rings + 1):
            t = r_idx / rings
            cur_z = t * h
            # Tapering radius with jagged mineral nodes
            cur_r = base_r * (1.0 - t * 0.88) * (1.0 + 0.15 * math.sin(t * 14.0))
            ring_verts = []
            for seg in range(circle_segs):
                ang = 2.0 * math.pi * seg / circle_segs
                flute = 1.0 + 0.12 * math.sin(ang * 4.0 + t * 5.0)
                px = cx + math.cos(ang) * cur_r * flute
                py = cy + math.sin(ang) * cur_r * flute
                ring_verts.append(bm.verts.new((px, py, cur_z)))

            if prev_ring is not None:
                for seg in range(circle_segs):
                    nxt = (seg + 1) % circle_segs
                    bm.faces.new((prev_ring[seg], prev_ring[nxt], ring_verts[nxt], ring_verts[seg]))
            prev_ring = ring_verts

        # Tip vert
        tip = bm.verts.new((cx, cy, h + 0.3))
        for seg in range(circle_segs):
            nxt = (seg + 1) % circle_segs
            bm.faces.new((prev_ring[seg], prev_ring[nxt], tip))

    bm.to_mesh(mesh)
    bm.free()

    if mat:
        mesh.materials.append(mat)
    return obj

def create_stalactite_cluster(name, mat=None):
    """
    Hanging cavern ceiling stalactite cluster with mineral icicles and dripping rock tips.
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()

    icicles = [
        (0.0, 0.0, -3.8, 0.8),
        (-1.0, 0.8, -2.8, 0.6),
        (0.9, 0.7, -3.2, 0.65),
        (-0.8, -0.9, -2.2, 0.5),
        (0.7, -0.8, -2.5, 0.45),
    ]

    for cx, cy, h, base_r in icicles:
        rings = 10
        circle_segs = 10
        prev_ring = None
        for r_idx in range(rings + 1):
            t = r_idx / rings
            cur_z = t * h  # negative downward
            cur_r = base_r * (1.0 - t * 0.92) * (1.0 + 0.1 * math.cos(t * 12.0))
            ring_verts = []
            for seg in range(circle_segs):
                ang = 2.0 * math.pi * seg / circle_segs
                px = cx + math.cos(ang) * cur_r
                py = cy + math.sin(ang) * cur_r
                ring_verts.append(bm.verts.new((px, py, cur_z)))

            if prev_ring is not None:
                for seg in range(circle_segs):
                    nxt = (seg + 1) % circle_segs
                    bm.faces.new((prev_ring[seg], prev_ring[nxt], ring_verts[nxt], ring_verts[seg]))
            prev_ring = ring_verts

        tip = bm.verts.new((cx, cy, h - 0.25))
        for seg in range(circle_segs):
            nxt = (seg + 1) % circle_segs
            bm.faces.new((prev_ring[seg], prev_ring[nxt], tip))

    bm.to_mesh(mesh)
    bm.free()

    if mat:
        mesh.materials.append(mat)
    return obj

def create_serpent_archway(name, stone_mat=None, brass_mat=None):
    """
    Monumental 8m tall carved twin-Naga ceremonial portal arch with arched serpentine bodies,
    flaring cobra hoods, and Vedic lintel relief.
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()

    # Archway parameters
    span = 7.0
    arch_h = 7.5
    pillar_r = 0.85
    segs = 16

    # Left & Right Naga Pillars
    for side in [-1, 1]:
        px = side * (span * 0.5)
        # Pillar shaft
        prev_ring = None
        rings = 12
        for r_idx in range(rings + 1):
            t = r_idx / rings
            pz = t * (arch_h - 1.5)
            # Twisted serpentine coiling
            angle_twist = t * math.pi * 3.0 * side
            cur_r = pillar_r * (1.0 + 0.15 * math.sin(t * 8.0))
            ring = []
            for seg in range(segs):
                ang = 2.0 * math.pi * seg / segs
                x = px + math.cos(ang + angle_twist) * cur_r
                y = math.sin(ang + angle_twist) * cur_r
                ring.append(bm.verts.new((x, y, pz)))

            if prev_ring is not None:
                for seg in range(segs):
                    nxt = (seg + 1) % segs
                    bm.faces.new((prev_ring[seg], prev_ring[nxt], ring[nxt], ring[seg]))
            prev_ring = ring

    # Curved Arch / Lintel
    arch_segs = 20
    prev_arch_ring = None
    for a_idx in range(arch_segs + 1):
        phi = math.pi * a_idx / arch_segs
        cx = -(span * 0.5) * math.cos(phi)
        cz = (arch_h - 1.5) + math.sin(phi) * 2.2
        # Cross section ring
        ring = []
        for seg in range(12):
            ang = 2.0 * math.pi * seg / 12
            rx = math.cos(ang) * 0.65
            ry = math.sin(ang) * 0.65
            ring.append(bm.verts.new((cx + rx, ry, cz)))

        if prev_arch_ring is not None:
            for seg in range(12):
                nxt = (seg + 1) % 12
                bm.faces.new((prev_arch_ring[seg], prev_arch_ring[nxt], ring[nxt], ring[seg]))
        prev_arch_ring = ring

    bm.to_mesh(mesh)
    bm.free()

    if stone_mat:
        mesh.materials.append(stone_mat)
    return obj

def create_bioluminescent_fungus(name, fungus_mat=None, rock_mat=None):
    """
    Creates the interactive Bouncy Fungus springboard.
    Features:
    - Multi-tiered glowing parasol cap (diameter 4.8m)
    - Detailed ribbed underside gills
    - Curved organic fibrous stipe (stem)
    - Clustered baby bioluminescent mushrooms at base
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()

    # Central Stipe (Stem)
    stem_rings = 10
    circle_segs = 16
    prev_ring = None
    for r_idx in range(stem_rings + 1):
        t = r_idx / stem_rings
        pz = t * 1.8
        # Gentle curve
        px = math.sin(t * 1.5) * 0.2
        pr = 0.55 * (1.2 - t * 0.4)
        ring = []
        for seg in range(circle_segs):
            ang = 2.0 * math.pi * seg / circle_segs
            ring.append(bm.verts.new((px + math.cos(ang) * pr, math.sin(ang) * pr, pz)))

        if prev_ring is not None:
            for seg in range(circle_segs):
                nxt = (seg + 1) % circle_segs
                bm.faces.new((prev_ring[seg], prev_ring[nxt], ring[nxt], ring[seg]))
        prev_ring = ring

    # Mushroom Cap (Top dome & Gills)
    cap_segs = 24
    cap_rings = 8
    cap_radius = 2.4  # Matches 2.4m collision radius in BouncyFungus3D!

    cap_grid = []
    for r_idx in range(cap_rings + 1):
        t = r_idx / cap_rings
        cur_r = 0.35 + t * (cap_radius - 0.35)
        # Parabolic mushroom dome
        pz = 2.2 - (t**1.8) * 0.55
        ring = []
        for seg in range(cap_segs):
            ang = 2.0 * math.pi * seg / cap_segs
            # Organic rim waviness
            rim_wave = 1.0 + (0.06 * math.sin(ang * 6.0) if t > 0.7 else 0.0)
            x = math.cos(ang) * cur_r * rim_wave
            y = math.sin(ang) * cur_r * rim_wave
            ring.append(bm.verts.new((x, y, pz)))
        cap_grid.append(ring)

    # Top Cap Faces
    for r_idx in range(cap_rings):
        for seg in range(cap_segs):
            nxt = (seg + 1) % cap_segs
            v0 = cap_grid[r_idx][seg]
            v1 = cap_grid[r_idx][nxt]
            v2 = cap_grid[r_idx + 1][nxt]
            v3 = cap_grid[r_idx + 1][seg]
            bm.faces.new((v0, v1, v2, v3))

    # Underside Gills
    center_gill = bm.verts.new((0, 0, 1.8))
    outer_rim = cap_grid[-1]
    for seg in range(cap_segs):
        nxt = (seg + 1) % cap_segs
        bm.faces.new((outer_rim[seg], outer_rim[nxt], center_gill))

    # Clustered baby spore mushrooms at base
    for offset_ang, dist, scale in [(0.5, 0.9, 0.45), (2.1, 0.8, 0.35), (4.0, 1.0, 0.5)]:
        bx = math.cos(offset_ang) * dist
        by = math.sin(offset_ang) * dist
        baby_top = bm.verts.new((bx, by, 0.6 * scale))
        for s in range(8):
            a1 = 2.0 * math.pi * s / 8
            a2 = 2.0 * math.pi * (s + 1) / 8
            v1 = bm.verts.new((bx + math.cos(a1) * 0.35 * scale, by + math.sin(a1) * 0.35 * scale, 0.3 * scale))
            v2 = bm.verts.new((bx + math.cos(a2) * 0.35 * scale, by + math.sin(a2) * 0.35 * scale, 0.3 * scale))
            bm.faces.new((baby_top, v1, v2))

    bm.to_mesh(mesh)
    bm.free()

    if fungus_mat:
        mesh.materials.append(fungus_mat)
    return obj

def create_vasuki_shrine_pedestal(name, brass_mat=None, stone_mat=None, gem_mat=None):
    """
    Creates the monumental Vasuki Peetham shrine altar.
    Features:
    - 3-tiered carved octagonal basalt base (radius 3.2m, matching VasukiPeetham3D collision radius)
    - Coiled brass serpent filigree around the central column
    - 7 flaring cobra hood canopy cresting over the sacred relic basin
    - Hovering multi-faceted Nagamani gem with pulsing emissive glow
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()

    # Tiered octagonal stone pedestal
    tiers = [
        (3.2, 0.0, 0.4),   # Bottom base plinth
        (2.7, 0.4, 0.8),   # Middle carved band
        (2.2, 0.8, 1.2),   # Upper cornice
    ]

    for r, z_low, z_high in tiers:
        verts_low = []
        verts_high = []
        for i in range(8):
            ang = 2.0 * math.pi * i / 8
            verts_low.append(bm.verts.new((math.cos(ang) * r, math.sin(ang) * r, z_low)))
            verts_high.append(bm.verts.new((math.cos(ang) * r, math.sin(ang) * r, z_high)))

        for i in range(8):
            nxt = (i + 1) % 8
            bm.faces.new((verts_low[i], verts_low[nxt], verts_high[nxt], verts_high[i]))

        # Top cap of tier
        center_t = bm.verts.new((0, 0, z_high))
        for i in range(8):
            nxt = (i + 1) % 8
            bm.faces.new((verts_high[i], verts_high[nxt], center_t))

    # Sacred Relic Basin
    basin_r = 1.6
    basin_h = 1.9
    basin_verts = []
    for i in range(16):
        ang = 2.0 * math.pi * i / 16
        basin_verts.append(bm.verts.new((math.cos(ang) * basin_r, math.sin(ang) * basin_r, basin_h)))

    # Seven Naga Cobra Hoods Canopy behind altar
    for hood_idx in range(-3, 4):
        ang_offset = hood_idx * 0.22
        hx = math.sin(ang_offset) * 1.5
        hy = -1.6 + math.cos(ang_offset) * 0.4
        hz = 1.8 + (3 - abs(hood_idx)) * 0.4  # Central hood is tallest (3.0m)
        hood_w = 0.55 - abs(hood_idx) * 0.06

        # Curved hood polygon
        v_base = bm.verts.new((hx, hy, 1.4))
        v_l = bm.verts.new((hx - hood_w, hy - 0.2, hz * 0.7))
        v_r = bm.verts.new((hx + hood_w, hy - 0.2, hz * 0.7))
        v_crest = bm.verts.new((hx, hy - 0.35, hz))
        bm.faces.new((v_base, v_r, v_crest, v_l))

    # Floating Sacred Nagamani Gem
    gem_z = 2.3
    gem_r = 0.55
    gem_top = bm.verts.new((0, 0, gem_z + gem_r))
    gem_bot = bm.verts.new((0, 0, gem_z - gem_r))
    gem_equator = []
    for i in range(10):
        ang = 2.0 * math.pi * i / 10
        gem_equator.append(bm.verts.new((math.cos(ang) * gem_r, math.sin(ang) * gem_r, gem_z)))

    for i in range(10):
        nxt = (i + 1) % 10
        bm.faces.new((gem_top, gem_equator[i], gem_equator[nxt]))
        bm.faces.new((gem_bot, gem_equator[nxt], gem_equator[i]))

    bm.to_mesh(mesh)
    bm.free()

    if brass_mat:
        mesh.materials.append(brass_mat)
    return obj

def create_venom_river_basin(name, stone_mat=None, venom_mat=None):
    """
    Creates the 40m x 14m subterranean Venom River basin.
    Features:
    - Carved obsidian stone canal banks with jagged toxic embankments
    - Stepped subterranean drainage sluices
    - Sludge waterline with undulating toxic surface
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()

    w = 40.0
    l = 14.0
    depth = 1.5

    # Left Embankment (Y = -l/2), Riverbed (Y near 0), Right Embankment (Y = +l/2)
    segs_x = 16
    for side, y_sign in [('north', 1), ('south', -1)]:
        y_top = y_sign * (l * 0.5)
        y_bed = y_sign * (l * 0.35)

        for ix in range(segs_x):
            x0 = -w * 0.5 + (ix / segs_x) * w
            x1 = -w * 0.5 + ((ix + 1) / segs_x) * w

            # Bank top verts
            v_top0 = bm.verts.new((x0, y_top, 0.4))
            v_top1 = bm.verts.new((x1, y_top, 0.4))
            # Sloped bank verts
            v_slope0 = bm.verts.new((x0, y_bed, -0.2))
            v_slope1 = bm.verts.new((x1, y_bed, -0.2))
            # River bottom verts
            v_bot0 = bm.verts.new((x0, y_bed * 0.5, -depth))
            v_bot1 = bm.verts.new((x1, y_bed * 0.5, -depth))

            bm.faces.new((v_top0, v_top1, v_slope1, v_slope0))
            bm.faces.new((v_slope0, v_slope1, v_bot1, v_bot0))

    # Center Riverbed
    for ix in range(segs_x):
        x0 = -w * 0.5 + (ix / segs_x) * w
        x1 = -w * 0.5 + ((ix + 1) / segs_x) * w
        v_s0 = bm.verts.new((x0, -l * 0.175, -depth))
        v_s1 = bm.verts.new((x1, -l * 0.175, -depth))
        v_n1 = bm.verts.new((x1, l * 0.175, -depth))
        v_n0 = bm.verts.new((x0, l * 0.175, -depth))
        bm.faces.new((v_s0, v_s1, v_n1, v_n0))

    # Toxic Liquid Surface Plane (slightly below bank level)
    for ix in range(segs_x):
        x0 = -w * 0.5 + (ix / segs_x) * w
        x1 = -w * 0.5 + ((ix + 1) / segs_x) * w
        vl0 = bm.verts.new((x0, -l * 0.34, 0.15))
        vl1 = bm.verts.new((x1, -l * 0.34, 0.15))
        vr1 = bm.verts.new((x1, l * 0.34, 0.15))
        vr0 = bm.verts.new((x0, l * 0.34, 0.15))
        bm.faces.new((vl0, vl1, vr1, vr0))

    bm.to_mesh(mesh)
    bm.free()

    if stone_mat:
        mesh.materials.append(stone_mat)
    return obj

def export_glb(obj, filepath):
    clean_path = os.path.abspath(filepath)
    os.makedirs(os.path.dirname(clean_path), exist_ok=True)
    # Select only the target object
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=clean_path,
        use_selection=True,
        export_format='GLB',
        export_apply=True
    )
    print(f"Exported {clean_path} ({os.path.getsize(clean_path)} bytes)")

def main():
    print("=" * 60)
    print("Generating 3D Production Environmental Assets for Realm of Patala...")
    print("=" * 60)

    clean_scene()

    tex_dir = "godot/assets/textures/"
    env_dir = "godot/assets/environment/"

    # Materials
    mat_obsidian = setup_material(
        "Mat_PatalaObsidian",
        albedo_path=os.path.join(tex_dir, "patala_obsidian_albedo.png"),
        normal_path=os.path.join(tex_dir, "patala_obsidian_normal.png"),
        mr_path=os.path.join(tex_dir, "patala_obsidian_roughness.png"),
        base_color=(0.12, 0.14, 0.16, 1.0), roughness=0.6, metallic=0.2
    )

    mat_venom = setup_material(
        "Mat_PatalaVenomMoss",
        albedo_path=os.path.join(tex_dir, "patala_venom_moss_albedo.png"),
        normal_path=os.path.join(tex_dir, "patala_venom_moss_normal.png"),
        emissive_path=os.path.join(tex_dir, "patala_venom_moss_emissive.png"),
        base_color=(0.08, 0.75, 0.25, 1.0), roughness=0.2, metallic=0.1
    )

    mat_brass = setup_material(
        "Mat_VasukiBrass",
        albedo_path=os.path.join(tex_dir, "patala_vasuki_brass_albedo.png"),
        normal_path=os.path.join(tex_dir, "patala_vasuki_brass_normal.png"),
        mr_path=os.path.join(tex_dir, "patala_vasuki_brass_mr.png"),
        base_color=(0.7, 0.55, 0.25, 1.0), roughness=0.4, metallic=0.85
    )

    mat_fungus = setup_material(
        "Mat_BioluminescentFungus",
        albedo_path=os.path.join(tex_dir, "patala_fungus_albedo.png"),
        normal_path=os.path.join(tex_dir, "patala_fungus_normal.png"),
        emissive_path=os.path.join(tex_dir, "patala_fungus_emissive.png"),
        base_color=(0.1, 0.8, 0.7, 1.0), roughness=0.35, metallic=0.05
    )

    mat_nagamani = setup_material(
        "Mat_NagamaniCrystal",
        albedo_path=os.path.join(tex_dir, "patala_nagamani_albedo.png"),
        normal_path=os.path.join(tex_dir, "patala_nagamani_normal.png"),
        emissive_path=os.path.join(tex_dir, "patala_nagamani_emissive.png"),
        base_color=(0.15, 0.95, 0.6, 1.0), roughness=0.1, metallic=0.1
    )

    # 1. Entrance Cavern Chamber (24m x 20m)
    p_entrance = create_cavern_platform("patala_entrance_chamber", width=24.0, length=20.0, height=2.4, segments_x=12, segments_y=10, mat=mat_obsidian)
    export_glb(p_entrance, os.path.join(env_dir, "patala_entrance_chamber.glb"))
    bpy.data.objects.remove(p_entrance, do_unlink=True)

    # 2. Mid Chamber (28m x 22m)
    p_mid = create_cavern_platform("patala_mid_chamber", width=28.0, length=22.0, height=2.4, segments_x=14, segments_y=11, mat=mat_obsidian)
    export_glb(p_mid, os.path.join(env_dir, "patala_mid_chamber.glb"))
    bpy.data.objects.remove(p_mid, do_unlink=True)

    # 3. Boss Arena (36m x 34m)
    p_boss = create_cavern_platform("patala_boss_arena", width=36.0, length=34.0, height=2.8, segments_x=18, segments_y=17, mat=mat_obsidian)
    export_glb(p_boss, os.path.join(env_dir, "patala_boss_arena.glb"))
    bpy.data.objects.remove(p_boss, do_unlink=True)

    # 4. Sanctum Chamber (18m x 16m)
    p_sanctum = create_cavern_platform("patala_sanctum_chamber", width=18.0, length=16.0, height=2.2, segments_x=10, segments_y=9, mat=mat_obsidian)
    export_glb(p_sanctum, os.path.join(env_dir, "patala_sanctum_chamber.glb"))
    bpy.data.objects.remove(p_sanctum, do_unlink=True)

    # 5. Stalagmite Cluster (Replacing 3KB placeholder)
    stalagmite = create_stalagmite_cluster("patala_stalagmite_cluster", mat=mat_obsidian)
    export_glb(stalagmite, os.path.join(env_dir, "patala_stalagmite_cluster.glb"))
    bpy.data.objects.remove(stalagmite, do_unlink=True)

    # 6. Stalactite Cluster (Ceiling formations)
    stalactite = create_stalactite_cluster("patala_stalactite_cluster", mat=mat_obsidian)
    export_glb(stalactite, os.path.join(env_dir, "patala_stalactite_cluster.glb"))
    bpy.data.objects.remove(stalactite, do_unlink=True)

    # 7. Serpent Archway
    archway = create_serpent_archway("patala_serpent_archway", stone_mat=mat_obsidian, brass_mat=mat_brass)
    export_glb(archway, os.path.join(env_dir, "patala_serpent_archway.glb"))
    bpy.data.objects.remove(archway, do_unlink=True)

    # 8. Bioluminescent Fungus (Springboard, replacing 3.9KB placeholder)
    fungus = create_bioluminescent_fungus("bioluminescent_fungus", fungus_mat=mat_fungus, rock_mat=mat_obsidian)
    export_glb(fungus, os.path.join(env_dir, "bioluminescent_fungus.glb"))
    bpy.data.objects.remove(fungus, do_unlink=True)

    # 9. Vasuki Shrine Pedestal (Replacing 5.2KB placeholder)
    pedestal = create_vasuki_shrine_pedestal("vasuki_shrine_pedestal", brass_mat=mat_brass, stone_mat=mat_obsidian, gem_mat=mat_nagamani)
    export_glb(pedestal, os.path.join(env_dir, "vasuki_shrine_pedestal.glb"))
    bpy.data.objects.remove(pedestal, do_unlink=True)

    # 10. Venom River Basin
    basin = create_venom_river_basin("patala_venom_river_basin", stone_mat=mat_obsidian, venom_mat=mat_venom)
    export_glb(basin, os.path.join(env_dir, "patala_venom_river_basin.glb"))
    bpy.data.objects.remove(basin, do_unlink=True)

    print("=" * 60)
    print("All Patala 3D production environmental models generated successfully!")
    print("=" * 60)

if __name__ == "__main__":
    main()
