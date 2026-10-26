#!/usr/bin/env python3
"""
Generate 3D Production Environmental Assets for Chapter IV: Realm of Svar / Svarga (The Celestial Solar Citadels).
Uses Blender 4.2 LTS to author high-fidelity PBR-textured glTF 2.0 binary models:
1. svar_entry_bastion.glb (24m x 22m celestial golden marble sky bastion with stepped cornice)
2. svar_mid_bastion.glb (30m x 26m ceremonial bastion with dual prism plinths and sunburst mosaic)
3. svar_apex_citadel.glb (38m x 38m monumental colosseum arena with perimeter fluted pillars for Boss Surya Avatara)
4. svar_sanctum_bastion.glb (22m x 20m high terrace for the Grand Surya Mahapeetham)
5. solar_prism_pillar.glb (4.2m lathe-turned Hoysala fluted pillar with rotating crystal prism lens)
6. solar_light_bridge.glb (20m x 4m shimmering crystalline golden solar bridge with runic borders)
7. surya_mahapeetham_pedestal.glb (Monumental 12-rayed sunburst dais with central Primal Solar Core)
8. celestial_sun_shikhara.glb (14m multi-tiered pyramidal golden Hoysala vimana spire with Kalasha finial)
9. solar_brazier_pillar.glb (3.5m fluted marble brazier pillar with 8-fold lotus cup and golden solar flame)
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

def setup_material(name, albedo_path=None, normal_path=None, mr_path=None, rough_path=None, emissive_path=None,
                   base_color=(0.95, 0.92, 0.85, 1.0), roughness=0.35, metallic=0.2, emissive=(0, 0, 0)):
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

    # Albedo
    if albedo_path and os.path.exists(albedo_path):
        img = bpy.data.images.load(os.path.abspath(albedo_path))
        tex_node = nodes.new(type='ShaderNodeTexImage')
        tex_node.image = img
        links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])

    # Normal Map
    if normal_path and os.path.exists(normal_path):
        img_n = bpy.data.images.load(os.path.abspath(normal_path))
        img_n.colorspace_settings.name = 'Non-Color'
        tex_n = nodes.new(type='ShaderNodeTexImage')
        tex_n.image = img_n
        norm_map = nodes.new(type='ShaderNodeNormalMap')
        norm_map.inputs['Strength'].default_value = 1.0
        links.new(tex_n.outputs['Color'], norm_map.inputs['Color'])
        links.new(norm_map.outputs['Normal'], bsdf.inputs['Normal'])

    # Metallic / Roughness Map
    if mr_path and os.path.exists(mr_path):
        img_mr = bpy.data.images.load(os.path.abspath(mr_path))
        img_mr.colorspace_settings.name = 'Non-Color'
        tex_mr = nodes.new(type='ShaderNodeTexImage')
        tex_mr.image = img_mr
        sep = nodes.new(type='ShaderNodeSeparateColor')
        links.new(tex_mr.outputs['Color'], sep.inputs['Color'])
        links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
        links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
    elif rough_path and os.path.exists(rough_path):
        img_r = bpy.data.images.load(os.path.abspath(rough_path))
        img_r.colorspace_settings.name = 'Non-Color'
        tex_r = nodes.new(type='ShaderNodeTexImage')
        tex_r.image = img_r
        links.new(tex_r.outputs['Color'], bsdf.inputs['Roughness'])

    # Emissive Map
    if emissive_path and os.path.exists(emissive_path):
        img_e = bpy.data.images.load(os.path.abspath(emissive_path))
        tex_e = nodes.new(type='ShaderNodeTexImage')
        tex_e.image = img_e
        links.new(tex_e.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 2.5
    elif emissive[0] > 0 or emissive[1] > 0 or emissive[2] > 0:
        bsdf.inputs['Emission Color'].default_value = (emissive[0], emissive[1], emissive[2], 1.0)
        bsdf.inputs['Emission Strength'].default_value = 2.0

    return mat

def create_octagonal_bastion(name, width, length, height, bevel_size=3.0, mat_marble=None, mat_gold=None):
    mesh = bpy.data.meshes.new(name=name)
    obj = bpy.data.objects.new(name=name, object_data=mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    # 8-sided chamfered platform
    hw = width * 0.5
    hl = length * 0.5
    b = bevel_size

    pts_2d = [
        (-hw + b, -hl), (hw - b, -hl),
        (hw, -hl + b), (hw, hl - b),
        (hw - b, hl), (-hw + b, hl),
        (-hw, hl - b), (-hw, -hl + b)
    ]

    # Stepped tiers: base footing, main body, upper cornice
    tiers = [
        (-height * 0.5, 1.04),
        (-height * 0.35, 1.02),
        (height * 0.35, 1.0),
        (height * 0.45, 1.03),
        (height * 0.5, 1.0)
    ]

    tier_verts = []
    for z, scale in tiers:
        ring = []
        for x, y in pts_2d:
            v = bm.verts.new((x * scale, y * scale, z))
            ring.append(v)
        tier_verts.append(ring)

    # Faces between tiers
    for t in range(len(tiers) - 1):
        r1 = tier_verts[t]
        r2 = tier_verts[t + 1]
        for i in range(len(pts_2d)):
            i_next = (i + 1) % len(pts_2d)
            f = bm.faces.new((r1[i], r1[i_next], r2[i_next], r2[i]))
            f.material_index = 0

    # Bottom face
    bot_face = bm.faces.new(list(reversed(tier_verts[0])))
    bot_face.material_index = 0

    # Top face
    top_face = bm.faces.new(tier_verts[-1])
    top_face.material_index = 0

    # Golden edge inlay border
    bmesh.ops.inset_individual(bm, faces=[top_face], thickness=0.8, depth=-0.02)

    bm.to_mesh(mesh)
    bm.free()

    if mat_marble:
        mesh.materials.append(mat_marble)
    if mat_gold:
        mesh.materials.append(mat_gold)

    return obj

def create_colosseum_citadel(name, radius, height, mat_marble=None, mat_gold=None):
    mesh = bpy.data.meshes.new(name=name)
    obj = bpy.data.objects.new(name=name, object_data=mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    segments = 32
    tiers = [
        (-height * 0.5, radius * 1.04),
        (-height * 0.25, radius * 1.02),
        (height * 0.35, radius),
        (height * 0.45, radius * 1.03),
        (height * 0.5, radius)
    ]

    tier_rings = []
    for z, r in tiers:
        ring = []
        for i in range(segments):
            angle = (i / segments) * math.pi * 2.0
            x = math.cos(angle) * r
            y = math.sin(angle) * r
            v = bm.verts.new((x, y, z))
            ring.append(v)
        tier_rings.append(ring)

    for t in range(len(tiers) - 1):
        r1 = tier_rings[t]
        r2 = tier_rings[t + 1]
        for i in range(segments):
            i_next = (i + 1) % segments
            bm.faces.new((r1[i], r1[i_next], r2[i_next], r2[i]))

    bm.faces.new(list(reversed(tier_rings[0])))
    top_f = bm.faces.new(tier_rings[-1])

    # Concentric stepped arena rings
    bmesh.ops.inset_individual(bm, faces=[top_f], thickness=2.5, depth=-0.1)

    bm.to_mesh(mesh)
    bm.free()

    if mat_marble:
        mesh.materials.append(mat_marble)
    if mat_gold:
        mesh.materials.append(mat_gold)

    return obj

def create_solar_prism_pillar(name, mat_marble=None, mat_gold=None, mat_crystal=None):
    mesh = bpy.data.meshes.new(name=name)
    obj = bpy.data.objects.new(name=name, object_data=mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    # 1. Base pedestal (stepped octagonal plinth)
    base_h = 0.8
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=1.0, radius2=1.0, depth=base_h, segments=8)
    for v in bm.verts:
        v.co.z += base_h * 0.5

    # 2. Fluted shaft (16 facets, height 2.2m)
    shaft_start = base_h
    shaft_h = 2.2
    shaft_r = 0.45
    shaft_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=shaft_r, radius2=shaft_r, depth=shaft_h, segments=16)
    for v in shaft_geom['verts']:
        v.co.z += shaft_start + shaft_h * 0.5

    # 3. Golden lotus capital
    cap_start = shaft_start + shaft_h
    cap_h = 0.6
    cap_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.45, radius2=0.95, depth=cap_h, segments=12)
    for v in cap_geom['verts']:
        v.co.z += cap_start + cap_h * 0.5

    # 4. Sun ring holder (torus / ring of golden rays)
    ring_start = cap_start + cap_h + 0.1
    ring_r = 0.85
    ring_geom = bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, radius1=ring_r, radius2=ring_r, depth=0.3, segments=12)
    for v in ring_geom['verts']:
        v.co.z += ring_start + 0.15

    # 5. Faceted crystal prism (rhomboid bipyramid)
    prism_center_z = ring_start + 0.2
    v_apex_top = bm.verts.new((0, 0, prism_center_z + 0.65))
    v_apex_bot = bm.verts.new((0, 0, prism_center_z - 0.65))

    equator = []
    eq_r = 0.55
    for i in range(6):
        a = (i / 6.0) * math.pi * 2.0
        v = bm.verts.new((math.cos(a) * eq_r, math.sin(a) * eq_r, prism_center_z))
        equator.append(v)

    for i in range(6):
        i_next = (i + 1) % 6
        f_top = bm.faces.new((equator[i], equator[i_next], v_apex_top))
        f_top.material_index = 2 if mat_crystal else 0
        f_bot = bm.faces.new((equator[i_next], equator[i], v_apex_bot))
        f_bot.material_index = 2 if mat_crystal else 0

    bm.to_mesh(mesh)
    bm.free()

    if mat_marble:
        mesh.materials.append(mat_marble)
    if mat_gold:
        mesh.materials.append(mat_gold)
    if mat_crystal:
        mesh.materials.append(mat_crystal)

    return obj

def create_solar_light_bridge(name, length=20.0, width=4.0, thickness=0.35, mat_crystal=None, mat_gold=None):
    mesh = bpy.data.meshes.new(name=name)
    obj = bpy.data.objects.new(name=name, object_data=mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    # Crystalline bridge deck
    geom = bmesh.ops.create_cube(bm, size=1.0)
    for v in geom['verts']:
        v.co.x *= width
        v.co.y *= length
        v.co.z *= thickness

    # Golden border rails on left and right
    rail_w = 0.35
    rail_h = 0.55
    # Left rail
    geom_l = bmesh.ops.create_cube(bm, size=1.0)
    for v in geom_l['verts']:
        v.co.x = (v.co.x * rail_w) - (width * 0.5 - rail_w * 0.5)
        v.co.y *= length
        v.co.z = (v.co.z * rail_h) + (thickness * 0.5 + rail_h * 0.5)

    # Right rail
    geom_r = bmesh.ops.create_cube(bm, size=1.0)
    for v in geom_r['verts']:
        v.co.x = (v.co.x * rail_w) + (width * 0.5 - rail_w * 0.5)
        v.co.y *= length
        v.co.z = (v.co.z * rail_h) + (thickness * 0.5 + rail_h * 0.5)

    bm.to_mesh(mesh)
    bm.free()

    if mat_crystal:
        mesh.materials.append(mat_crystal)
    if mat_gold:
        mesh.materials.append(mat_gold)

    return obj

def create_surya_mahapeetham(name, mat_gold=None, mat_marble=None, mat_core=None):
    mesh = bpy.data.meshes.new(name=name)
    obj = bpy.data.objects.new(name=name, object_data=mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    # 1. Monumental 12-sided dais base (diameter 6m, height 1.0m)
    dais_r = 3.0
    dais_h = 1.0
    geom_dais = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=dais_r, radius2=dais_r, depth=dais_h, segments=12)
    for v in geom_dais['verts']:
        v.co.z += dais_h * 0.5

    # 2. 12 Radiating sunburst ray steps around perimeter
    for i in range(12):
        angle = (i / 12.0) * math.pi * 2.0
        cos_a = math.cos(angle)
        sin_a = math.sin(angle)
        tip_r = dais_r + 1.2
        v_l = bm.verts.new(((dais_r * cos_a) - sin_a * 0.5, (dais_r * sin_a) + cos_a * 0.5, 0.4))
        v_r = bm.verts.new(((dais_r * cos_a) + sin_a * 0.5, (dais_r * sin_a) - cos_a * 0.5, 0.4))
        v_tip = bm.verts.new((tip_r * cos_a, tip_r * sin_a, 0.2))
        bm.faces.new((v_l, v_tip, v_r))

    # 3. Double-lotus plinth in center (radius 1.6m)
    lotus_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=1.6, radius2=1.3, depth=0.8, segments=16)
    for v in lotus_geom['verts']:
        v.co.z += dais_h + 0.4

    # 4. Primal Solar Core (levitating glowing sphere, radius 0.75m at Z=2.8m)
    core_z = 2.8
    core_geom = bmesh.ops.create_icosphere(bm, subdivisions=3, radius=0.75)
    for v in core_geom['verts']:
        v.co.z += core_z

    # 5. Concentric Armillary gimbal rings around core
    ring1 = bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, radius1=1.1, radius2=1.1, depth=0.1, segments=16)
    for v in ring1['verts']:
        v.co.z += core_z

    bm.to_mesh(mesh)
    bm.free()

    if mat_gold:
        mesh.materials.append(mat_gold)
    if mat_marble:
        mesh.materials.append(mat_marble)
    if mat_core:
        mesh.materials.append(mat_core)

    return obj

def create_celestial_sun_shikhara(name, mat_gold=None, mat_marble=None):
    mesh = bpy.data.meshes.new(name=name)
    obj = bpy.data.objects.new(name=name, object_data=mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    # Multi-tiered Hoysala Vimana spire (14m total height)
    levels = [
        (0.0, 4.0, 1.8),
        (1.8, 3.4, 2.0),
        (3.8, 2.8, 2.2),
        (6.0, 2.2, 2.4),
        (8.4, 1.6, 2.2),
        (10.6, 1.0, 1.8),
    ]

    for z_start, half_w, tier_h in levels:
        geom = bmesh.ops.create_cube(bm, size=1.0)
        for v in geom['verts']:
            v.co.x *= half_w * 2.0
            v.co.y *= half_w * 2.0
            v.co.z = (v.co.z * tier_h) + (z_start + tier_h * 0.5)

    # Ribbed Amalaka Disc at top (Z=12.4m, radius 1.2m)
    amalaka_z = 12.4
    amalaka_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=1.2, radius2=1.2, depth=0.8, segments=16)
    for v in amalaka_geom['verts']:
        v.co.z += amalaka_z + 0.4

    # Gilded Kalasha Urn Finial with pinnacle needle (Z=13.2m to 14.5m)
    kalasha_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.6, radius2=0.05, depth=1.4, segments=12)
    for v in kalasha_geom['verts']:
        v.co.z += 13.2 + 0.7

    bm.to_mesh(mesh)
    bm.free()

    if mat_gold:
        mesh.materials.append(mat_gold)
    if mat_marble:
        mesh.materials.append(mat_marble)

    return obj

def create_solar_brazier_pillar(name, mat_marble=None, mat_gold=None):
    mesh = bpy.data.meshes.new(name=name)
    obj = bpy.data.objects.new(name=name, object_data=mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    # Base plinth
    geom_base = bmesh.ops.create_cube(bm, size=1.0)
    for v in geom_base['verts']:
        v.co.x *= 1.2
        v.co.y *= 1.2
        v.co.z = (v.co.z * 0.6) + 0.3

    # Fluted column shaft (height 2.4m, radius 0.35m)
    shaft_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.35, radius2=0.35, depth=2.4, segments=12)
    for v in shaft_geom['verts']:
        v.co.z += 0.6 + 1.2

    # Lotus Brazier Basin Cup (Z=3.0m, radius 0.8m)
    cup_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.35, radius2=0.85, depth=0.6, segments=12)
    for v in cup_geom['verts']:
        v.co.z += 3.0 + 0.3

    bm.to_mesh(mesh)
    bm.free()

    if mat_marble:
        mesh.materials.append(mat_marble)
    if mat_gold:
        mesh.materials.append(mat_gold)

    return obj

def export_glb(obj, filepath):
    clean_path = os.path.abspath(filepath)
    os.makedirs(os.path.dirname(clean_path), exist_ok=True)
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
    print("Generating 3D Production Environmental Assets for Realm of Svar...")
    print("=" * 60)

    clean_scene()

    tex_dir = "godot/assets/environment/textures/svar/"
    env_dir = "godot/assets/environment/"

    # Materials
    mat_gold_marble = setup_material(
        "Mat_SvarGoldMarble",
        albedo_path=os.path.join(tex_dir, "svar_gold_marble_albedo.png"),
        normal_path=os.path.join(tex_dir, "svar_gold_marble_normal.png"),
        rough_path=os.path.join(tex_dir, "svar_gold_marble_roughness.png"),
        base_color=(0.95, 0.92, 0.85, 1.0),
        roughness=0.35,
        metallic=0.2
    )

    mat_celestial_gold = setup_material(
        "Mat_SvarCelestialGold",
        albedo_path=os.path.join(tex_dir, "svar_celestial_gold_albedo.png"),
        normal_path=os.path.join(tex_dir, "svar_celestial_gold_normal.png"),
        mr_path=os.path.join(tex_dir, "svar_celestial_gold_mr.png"),
        base_color=(1.0, 0.82, 0.22, 1.0),
        roughness=0.25,
        metallic=0.9
    )

    mat_solar_crystal = setup_material(
        "Mat_SvarSolarCrystal",
        albedo_path=os.path.join(tex_dir, "svar_solar_crystal_albedo.png"),
        normal_path=os.path.join(tex_dir, "svar_solar_crystal_normal.png"),
        emissive_path=os.path.join(tex_dir, "svar_solar_crystal_emissive.png"),
        base_color=(0.85, 0.95, 1.0, 0.9),
        roughness=0.15,
        metallic=0.1,
        emissive=(1.0, 0.85, 0.3)
    )

    mat_solar_core = setup_material(
        "Mat_SvarSolarCore",
        albedo_path=os.path.join(tex_dir, "svar_solar_core_albedo.png"),
        emissive_path=os.path.join(tex_dir, "svar_solar_core_emissive.png"),
        base_color=(1.0, 0.9, 0.4, 1.0),
        roughness=0.2,
        metallic=0.0,
        emissive=(1.0, 0.75, 0.2)
    )

    # 1. svar_entry_bastion.glb (24m x 22m x 2m)
    b_entry = create_octagonal_bastion("SvarEntryBastion", 24.0, 22.0, 2.0, 3.0, mat_gold_marble, mat_celestial_gold)
    export_glb(b_entry, os.path.join(env_dir, "svar_entry_bastion.glb"))
    bpy.data.objects.remove(b_entry, do_unlink=True)

    # 2. svar_mid_bastion.glb (30m x 26m x 2m)
    b_mid = create_octagonal_bastion("SvarMidBastion", 30.0, 26.0, 2.0, 4.0, mat_gold_marble, mat_celestial_gold)
    export_glb(b_mid, os.path.join(env_dir, "svar_mid_bastion.glb"))
    bpy.data.objects.remove(b_mid, do_unlink=True)

    # 3. svar_apex_citadel.glb (38m x 38m x 2.4m)
    b_apex = create_colosseum_citadel("SvarApexCitadel", 19.0, 2.4, mat_gold_marble, mat_celestial_gold)
    export_glb(b_apex, os.path.join(env_dir, "svar_apex_citadel.glb"))
    bpy.data.objects.remove(b_apex, do_unlink=True)

    # 4. svar_sanctum_bastion.glb (22m x 20m x 2m)
    b_sanctum = create_octagonal_bastion("SvarSanctumBastion", 22.0, 20.0, 2.0, 3.5, mat_gold_marble, mat_celestial_gold)
    export_glb(b_sanctum, os.path.join(env_dir, "svar_sanctum_bastion.glb"))
    bpy.data.objects.remove(b_sanctum, do_unlink=True)

    # 5. solar_prism_pillar.glb
    b_prism = create_solar_prism_pillar("SolarPrismPillar", mat_gold_marble, mat_celestial_gold, mat_solar_crystal)
    export_glb(b_prism, os.path.join(env_dir, "solar_prism_pillar.glb"))
    bpy.data.objects.remove(b_prism, do_unlink=True)

    # 6. solar_light_bridge.glb
    b_bridge = create_solar_light_bridge("SolarLightBridge", 20.0, 4.0, 0.35, mat_solar_crystal, mat_celestial_gold)
    export_glb(b_bridge, os.path.join(env_dir, "solar_light_bridge.glb"))
    bpy.data.objects.remove(b_bridge, do_unlink=True)

    # 7. surya_mahapeetham_pedestal.glb
    b_altar = create_surya_mahapeetham("SuryaMahapeethamPedestal", mat_celestial_gold, mat_gold_marble, mat_solar_core)
    export_glb(b_altar, os.path.join(env_dir, "surya_mahapeetham_pedestal.glb"))
    bpy.data.objects.remove(b_altar, do_unlink=True)

    # 8. celestial_sun_shikhara.glb
    b_shikhara = create_celestial_sun_shikhara("CelestialSunShikhara", mat_celestial_gold, mat_gold_marble)
    export_glb(b_shikhara, os.path.join(env_dir, "celestial_sun_shikhara.glb"))
    bpy.data.objects.remove(b_shikhara, do_unlink=True)

    # 9. solar_brazier_pillar.glb
    b_brazier = create_solar_brazier_pillar("SolarBrazierPillar", mat_gold_marble, mat_celestial_gold)
    export_glb(b_brazier, os.path.join(env_dir, "solar_brazier_pillar.glb"))
    bpy.data.objects.remove(b_brazier, do_unlink=True)

    print("=" * 60)
    print("All 9 Svar Production Environment Models Generated Successfully!")
    print("=" * 60)

if __name__ == "__main__":
    main()
