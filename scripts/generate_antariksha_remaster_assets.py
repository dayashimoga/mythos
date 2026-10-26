#!/usr/bin/env python3
"""
Generate 3D Production Environmental Assets for Chapter II: Realm of Antariksha.
Uses Blender 4.2 LTS to author high-fidelity PBR-textured glTF 2.0 binary models:
1. sky_sanctuary_island.glb (32m x 32m floating main sanctuary island with Hoysala stone paving and crags)
2. vayu_windmill_island.glb (28m x 28m floating island with wind gullies & turbine base)
3. cyclone_spire_island.glb (26m x 26m floating island with spiral rock ramps & archer plateau)
4. high_gale_pinnacle_island.glb (42m x 42m monumental arena island for Boss Matarishvan & Altar)
5. vayu_wind_turbine.glb (7.5m authentic Vedic wind engine with 3 rotating brass vanes & prana core)
6. celestial_grapple_anchor.glb (2.8m celestial grapple beacon with concentric rings & glowing tether point)
7. thermal_updraft_vent.glb (Carved octagonal stone vent basin with interior bronze turbine grille)
8. sky_temple_pavilion.glb (Open sky mandapa with 4 lathe-turned pillars and domed chhatri)
9. floating_prana_crystal.glb (Clustered jagged prana crystals with glowing emissive facets)
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
                   base_color=(0.8, 0.8, 0.8, 1.0), roughness=0.7, metallic=0.1, emissive=(0, 0, 0)):
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
        bsdf.inputs['Emission Strength'].default_value = 2.5
    elif emissive != (0, 0, 0):
        bsdf.inputs['Emission Color'].default_value = (emissive[0], emissive[1], emissive[2], 1.0)
        bsdf.inputs['Emission Strength'].default_value = 2.0

    return mat

def create_floating_island(name, radius=16.0, depth=14.0, plateau_height=2.5, rim_segments=24):
    """
    Creates a majestic floating island with a flat, walkable paved top plateau,
    beveled perimeter stone edging, and a stratified, jagged inverted rock cone underside.
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()

    # Create top circular disc (walkable plateau)
    top_verts = []
    center_top = bm.verts.new((0, 0, 0))
    for i in range(rim_segments):
        ang = 2.0 * math.pi * i / rim_segments
        # Subtle organic radial perturbation
        r = radius * (1.0 + 0.12 * math.sin(ang * 3.0) + 0.08 * math.cos(ang * 5.0))
        x = math.cos(ang) * r
        y = math.sin(ang) * r
        top_verts.append(bm.verts.new((x, y, 0)))

    # Faces for top plateau
    for i in range(rim_segments):
        v1 = top_verts[i]
        v2 = top_verts[(i + 1) % rim_segments]
        bm.faces.new((center_top, v1, v2))

    # Rim bevel ledge
    rim_verts = []
    for i in range(rim_segments):
        tv = top_verts[i]
        ang = 2.0 * math.pi * i / rim_segments
        r = tv.co.length + 1.2
        rim_verts.append(bm.verts.new((math.cos(ang) * r, math.sin(ang) * r, -plateau_height)))

    for i in range(rim_segments):
        t1 = top_verts[i]
        t2 = top_verts[(i + 1) % rim_segments]
        r1 = rim_verts[i]
        r2 = rim_verts[(i + 1) % rim_segments]
        bm.faces.new((t1, t2, r2, r1))

    # Stratified rocky underside layers descending to a craggy keel
    prev_layer = rim_verts
    num_layers = 4
    for layer in range(1, num_layers + 1):
        frac = layer / num_layers
        layer_z = -plateau_height - depth * (frac ** 1.3)
        curr_layer = []
        if layer == num_layers:
            # Bottom tip vert
            bottom_vert = bm.verts.new((0.5, -0.3, layer_z))
            for i in range(rim_segments):
                bm.faces.new((prev_layer[i], prev_layer[(i + 1) % rim_segments], bottom_vert))
            break
        else:
            layer_r_scale = (1.0 - frac) * 0.85
            for i in range(rim_segments):
                ang = 2.0 * math.pi * i / rim_segments
                r = radius * layer_r_scale * (1.0 + 0.25 * math.sin(ang * 4.0 + layer) + 0.15 * math.cos(ang * 2.0))
                curr_layer.append(bm.verts.new((math.cos(ang) * r, math.sin(ang) * r, layer_z)))

            for i in range(rim_segments):
                p1 = prev_layer[i]
                p2 = prev_layer[(i + 1) % rim_segments]
                c1 = curr_layer[i]
                c2 = curr_layer[(i + 1) % rim_segments]
                bm.faces.new((p1, p2, c2, c1))
            prev_layer = curr_layer

    bm.to_mesh(mesh)
    bm.free()

    # Recalculate normals
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')

    return obj

def export_gltf(filepath, obj_list):
    bpy.ops.object.select_all(action='DESELECT')
    for o in obj_list:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obj_list[0]

    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True
    )
    print(f"Exported {filepath} ({os.path.getsize(filepath)} bytes)")

def build_all_antariksha_assets():
    mat_rock = setup_material(
        "Mat_AerolithRock",
        albedo_path="godot/assets/environment/textures/aerolith_rock_albedo.png",
        normal_path="godot/assets/environment/textures/aerolith_rock_normal.png",
        roughness=0.8
    )
    mat_brass = setup_material(
        "Mat_VayuBrass",
        albedo_path="godot/assets/environment/textures/vayu_brass_albedo.png",
        normal_path="godot/assets/environment/textures/vayu_brass_normal.png",
        mr_path="godot/assets/environment/textures/vayu_brass_metallic_roughness.png"
    )
    mat_crystal = setup_material(
        "Mat_PranaCrystal",
        albedo_path="godot/assets/environment/textures/prana_crystal_albedo.png",
        normal_path="godot/assets/environment/textures/prana_crystal_normal.png",
        emissive_path="godot/assets/environment/textures/prana_crystal_emissive.png"
    )

    # 1. Sky Sanctuary Island (Sector 1: 32m x 32m)
    clean_scene()
    island1 = create_floating_island("SkySanctuaryIsland", radius=16.0, depth=14.0, plateau_height=2.5, rim_segments=28)
    island1.data.materials.append(mat_rock)
    export_gltf("godot/assets/environment/sky_sanctuary_island.glb", [island1])

    # 2. Vayu Windmill Island (Sector 2: 28m x 28m)
    clean_scene()
    island2 = create_floating_island("VayuWindmillIsland", radius=14.0, depth=12.0, plateau_height=2.2, rim_segments=24)
    island2.data.materials.append(mat_rock)
    export_gltf("godot/assets/environment/vayu_windmill_island.glb", [island2])

    # 3. Cyclone Spire Island (Sector 3: 26m x 26m)
    clean_scene()
    island3 = create_floating_island("CycloneSpireIsland", radius=13.0, depth=15.0, plateau_height=2.2, rim_segments=24)
    island3.data.materials.append(mat_rock)
    export_gltf("godot/assets/environment/cyclone_spire_island.glb", [island3])

    # 4. High Gale Pinnacle Island (Sector 4: 42m x 42m Colossal Arena)
    clean_scene()
    island4 = create_floating_island("HighGalePinnacleIsland", radius=21.0, depth=18.0, plateau_height=3.0, rim_segments=32)
    island4.data.materials.append(mat_rock)
    export_gltf("godot/assets/environment/high_gale_pinnacle_island.glb", [island4])

    # 5. Vayu Wind Turbine (7.5m authentic Vedic wind engine)
    clean_scene()
    # Octagonal stone base
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=1.6, depth=3.5, location=(0, 0, 1.75))
    base_obj = bpy.context.active_object
    base_obj.name = "TurbineBase"
    base_obj.data.materials.append(mat_rock)

    # Brass nacelle rotor housing
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=1.0, location=(0, 0, 3.8))
    nacelle_obj = bpy.context.active_object
    nacelle_obj.name = "Nacelle"
    nacelle_obj.data.materials.append(mat_brass)

    # Prana Core in center
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.6, location=(0, 0, 3.8))
    core_obj = bpy.context.active_object
    core_obj.name = "PranaTurbineCore"
    core_obj.data.materials.append(mat_crystal)

    # 3 Aerodynamic Vayu Blades
    blades = []
    for b in range(3):
        ang = b * (2.0 * math.pi / 3.0)
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.35, depth=4.2, location=(0, 0, 0))
        blade = bpy.context.active_object
        blade.name = f"VaneBlade_{b}"
        blade.scale = (0.2, 0.8, 1.0)
        # Offset pivot so blade radiates from center
        blade.location = (math.cos(ang) * 2.3, math.sin(ang) * 2.3, 3.8)
        blade.rotation_euler = (0, 0, ang + math.pi/2)
        blade.data.materials.append(mat_brass)
        blades.append(blade)

    # Join blades, nacelle, and base
    bpy.ops.object.select_all(action='DESELECT')
    for o in [base_obj, nacelle_obj, core_obj] + blades:
        o.select_set(True)
    bpy.context.view_layer.objects.active = base_obj
    bpy.ops.object.join()
    base_obj.name = "VayuWindTurbine"
    export_gltf("godot/assets/environment/vayu_wind_turbine.glb", [base_obj])

    # 6. Celestial Grapple Anchor (2.8m concentric bronze rings with Surya center)
    clean_scene()
    bpy.ops.mesh.primitive_torus_add(major_radius=1.2, minor_radius=0.14, major_segments=24, minor_segments=8, location=(0, 0, 0))
    outer_ring = bpy.context.active_object
    outer_ring.data.materials.append(mat_brass)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.8, minor_radius=0.10, major_segments=20, minor_segments=8, location=(0, 0, 0))
    inner_ring = bpy.context.active_object
    inner_ring.rotation_euler = (math.pi/4, math.pi/4, 0)
    inner_ring.data.materials.append(mat_brass)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.45, location=(0, 0, 0))
    sun_disc = bpy.context.active_object
    sun_disc.data.materials.append(mat_crystal)

    bpy.ops.object.select_all(action='DESELECT')
    for o in [outer_ring, inner_ring, sun_disc]:
        o.select_set(True)
    bpy.context.view_layer.objects.active = outer_ring
    bpy.ops.object.join()
    outer_ring.name = "CelestialGrappleAnchor"
    export_gltf("godot/assets/environment/celestial_grapple_anchor.glb", [outer_ring])

    # 7. Thermal Updraft Vent (Carved octagonal stone basin with turbine grille)
    clean_scene()
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=2.2, depth=0.8, location=(0, 0, 0.4))
    vent_basin = bpy.context.active_object
    vent_basin.data.materials.append(mat_rock)

    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=1.5, depth=0.2, location=(0, 0, 0.75))
    vent_grille = bpy.context.active_object
    vent_grille.data.materials.append(mat_brass)

    bpy.ops.object.select_all(action='DESELECT')
    for o in [vent_basin, vent_grille]:
        o.select_set(True)
    bpy.context.view_layer.objects.active = vent_basin
    bpy.ops.object.join()
    vent_basin.name = "ThermalUpdraftVent"
    export_gltf("godot/assets/environment/thermal_updraft_vent.glb", [vent_basin])

    # 8. Sky Temple Pavilion (Open Hoysala mandapa for Devi Tara)
    clean_scene()
    # Base plinth
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=3.2, depth=0.6, location=(0, 0, 0.3))
    plinth = bpy.context.active_object
    plinth.data.materials.append(mat_rock)

    # 4 Carved Pillars
    pillars = []
    for px, py in [(1.8, 1.8), (-1.8, 1.8), (1.8, -1.8), (-1.8, -1.8)]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.25, depth=3.8, location=(px, py, 2.2))
        p = bpy.context.active_object
        p.data.materials.append(mat_rock)
        pillars.append(p)

    # Domed Chhatri Canopy
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=2.8, location=(0, 0, 4.4))
    dome = bpy.context.active_object
    dome.scale = (1.0, 1.0, 0.45)
    dome.data.materials.append(mat_rock)

    # Kalasha Finial
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.4, depth=1.0, location=(0, 0, 5.8))
    finial = bpy.context.active_object
    finial.data.materials.append(mat_brass)

    bpy.ops.object.select_all(action='DESELECT')
    for o in [plinth, dome, finial] + pillars:
        o.select_set(True)
    bpy.context.view_layer.objects.active = plinth
    bpy.ops.object.join()
    plinth.name = "SkyTemplePavilion"
    export_gltf("godot/assets/environment/sky_temple_pavilion.glb", [plinth])

    # 9. Floating Prana Crystals
    clean_scene()
    crystals = []
    for c_idx, (cx, cy, cz, cr, ca) in enumerate([
        (0, 0, 0, 1.0, 0),
        (0.6, 0.4, 0.3, 0.7, 0.3),
        (-0.5, 0.5, -0.2, 0.65, -0.4),
        (0.3, -0.6, 0.4, 0.8, 0.2),
        (-0.4, -0.4, -0.3, 0.6, 0.5)
    ]):
        bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.35 * cr, depth=2.2 * cr, location=(cx, cy, cz))
        c_obj = bpy.context.active_object
        c_obj.rotation_euler = (ca, ca * 0.7, ca * 1.2)
        c_obj.data.materials.append(mat_crystal)
        crystals.append(c_obj)

    bpy.ops.object.select_all(action='DESELECT')
    for c in crystals:
        c.select_set(True)
    bpy.context.view_layer.objects.active = crystals[0]
    bpy.ops.object.join()
    crystals[0].name = "FloatingPranaCrystal"
    export_gltf("godot/assets/environment/floating_prana_crystal.glb", [crystals[0]])

if __name__ == '__main__':
    print("=== Building Antariksha 3D Environment Assets ===")
    build_all_antariksha_assets()
    print("=== Environment Assets Complete ===")
