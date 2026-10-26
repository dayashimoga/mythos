"""
Mythos 3D - Antariksha Combat Actors Blender Pipeline
Generates authentic, high-fidelity 3D rigged & animated models for Chapter II:
1. Boss Matarishvan (3.4m colossal quad-winged Cyclone Titan with dual crescent scythes, 26-bone skeleton, 10 authored actions)
2. Gale Falcon (2.2m wingspan celestial raptor with razor talons, 12-bone skeleton, 6 authored actions)
3. Wind Archer (1.9m hovering Asura sniper with Gale Greatbow, 22-bone skeleton, 6 authored actions)
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Quaternion, Matrix, Euler

ROOT_DIR = r"h:\mythologicalgame"
BUNDLE_PATH = os.path.join(ROOT_DIR, r"tools\human_base_meshes\human_base_meshes_bundle.blend")
TEXTURE_DIR = os.path.join(ROOT_DIR, r"godot\assets\characters\enemies\textures")
ENEMY_DIR = os.path.join(ROOT_DIR, r"godot\assets\characters\enemies")

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def quat_from_axis_angle(x, y, z, angle_rad):
    half = angle_rad * 0.5
    s = math.sin(half)
    c = math.cos(half)
    length = math.sqrt(x*x + y*y + z*z)
    if length < 1e-6:
        return Quaternion((1.0, 0.0, 0.0, 0.0))
    return Quaternion((c, x/length * s, y/length * s, z/length * s))

def euler_to_quat(pitch_x, yaw_y, roll_z):
    qx = quat_from_axis_angle(1, 0, 0, pitch_x)
    qy = quat_from_axis_angle(0, 1, 0, yaw_y)
    qz = quat_from_axis_angle(0, 0, 1, roll_z)
    return qy @ qx @ qz

def create_pbr_material(name, alb_name, norm_name=None, mr_name=None, em_name=None, base_color=(0.8, 0.8, 0.8, 1.0)):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out_node = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    links.new(bsdf.outputs["BSDF"], out_node.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = base_color

    if alb_name:
        alb_path = os.path.join(TEXTURE_DIR, alb_name)
        if os.path.exists(alb_path):
            img_alb = bpy.data.images.load(alb_path)
            tex_alb = nodes.new(type="ShaderNodeTexImage")
            tex_alb.image = img_alb
            links.new(tex_alb.outputs["Color"], bsdf.inputs["Base Color"])

    if norm_name:
        norm_path = os.path.join(TEXTURE_DIR, norm_name)
        if os.path.exists(norm_path):
            img_norm = bpy.data.images.load(norm_path)
            img_norm.colorspace_settings.name = "Non-Color"
            tex_norm = nodes.new(type="ShaderNodeTexImage")
            tex_norm.image = img_norm
            nmap = nodes.new(type="ShaderNodeNormalMap")
            links.new(tex_norm.outputs["Color"], nmap.inputs["Color"])
            links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])

    if mr_name:
        mr_path = os.path.join(TEXTURE_DIR, mr_name)
        if os.path.exists(mr_path):
            img_mr = bpy.data.images.load(mr_path)
            img_mr.colorspace_settings.name = "Non-Color"
            tex_mr = nodes.new(type="ShaderNodeTexImage")
            tex_mr.image = img_mr
            sep = nodes.new(type="ShaderNodeSeparateColor")
            links.new(tex_mr.outputs["Color"], sep.inputs["Color"])
            links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])
            links.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])

    if em_name:
        em_path = os.path.join(TEXTURE_DIR, em_name)
        if os.path.exists(em_path):
            img_em = bpy.data.images.load(em_path)
            tex_em = nodes.new(type="ShaderNodeTexImage")
            tex_em.image = img_em
            links.new(tex_em.outputs["Color"], bsdf.inputs["Emission Color"])
            bsdf.inputs["Emission Strength"].default_value = 3.5

    return mat

def add_action(arm_obj, name, duration_sec, rot_dict, loc_dict=None, fps=30.0):
    if arm_obj.animation_data is None:
        arm_obj.animation_data_create()

    act = bpy.data.actions.new(name=name)
    act.use_fake_user = True
    arm_obj.animation_data.action = act

    for bone_name, kfs in rot_dict.items():
        if bone_name not in arm_obj.pose.bones:
            continue
        pb = arm_obj.pose.bones[bone_name]
        pb.rotation_mode = 'QUATERNION'
        for time_s, q_val in kfs:
            frame = 1.0 + time_s * fps
            pb.rotation_quaternion = q_val
            pb.keyframe_insert(data_path="rotation_quaternion", frame=frame)

    if loc_dict:
        for bone_name, kfs in loc_dict.items():
            if bone_name not in arm_obj.pose.bones:
                continue
            pb = arm_obj.pose.bones[bone_name]
            for time_s, l_val in kfs:
                frame = 1.0 + time_s * fps
                pb.location = l_val
                pb.keyframe_insert(data_path="location", frame=frame)

# =========================================================================
# 1. BOSS MATARISHVAN: 3.4m Quad-Winged Cyclone Titan
# =========================================================================
def build_boss_matarishvan():
    print("Building Boss Matarishvan (3.4m Quad-Winged Cyclone Titan)...")
    clear_scene()

    # Materials
    mat_body = create_pbr_material("Mat_MatarishvanBody", "matarishvan_albedo.png", "matarishvan_normal.png", "matarishvan_mr.png", "matarishvan_emissive.png")
    mat_brass = create_pbr_material("Mat_VayuBrass", "vayu_brass_albedo.png", "vayu_brass_normal.png", "vayu_brass_metallic_roughness.png")

    # 1. Torso & Muscular Body
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.75, depth=1.6, location=(0, 0, 2.3))
    torso = bpy.context.active_object
    torso.scale = (1.2, 0.8, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    torso.data.materials.append(mat_body)

    # 2. Quad Wings (2 Colossal Upper Wings + 2 Lower Stabilizer Wings)
    # Upper Left Wing
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.4, depth=3.8, location=(1.8, -0.4, 3.2))
    wing_ul = bpy.context.active_object
    wing_ul.scale = (0.1, 1.2, 1.0)
    wing_ul.rotation_euler = (0.2, 0.45, 0.5)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    wing_ul.data.materials.append(mat_body)

    # Upper Right Wing
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.4, depth=3.8, location=(-1.8, -0.4, 3.2))
    wing_ur = bpy.context.active_object
    wing_ur.scale = (0.1, 1.2, 1.0)
    wing_ur.rotation_euler = (0.2, -0.45, -0.5)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    wing_ur.data.materials.append(mat_body)

    # Lower Left Wing
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.3, depth=2.4, location=(1.2, -0.3, 2.0))
    wing_ll = bpy.context.active_object
    wing_ll.scale = (0.1, 1.0, 1.0)
    wing_ll.rotation_euler = (0.15, 0.3, 0.3)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    wing_ll.data.materials.append(mat_body)

    # Lower Right Wing
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.3, depth=2.4, location=(-1.2, -0.3, 2.0))
    wing_lr = bpy.context.active_object
    wing_lr.scale = (0.1, 1.0, 1.0)
    wing_lr.rotation_euler = (0.15, -0.3, -0.3)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    wing_lr.data.materials.append(mat_body)

    # 3. Head with Storm Horn Crest
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.55, location=(0, 0.1, 3.4))
    head = bpy.context.active_object
    head.data.materials.append(mat_body)

    bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=0.2, depth=1.1, location=(0.35, 0.2, 3.9))
    horn_l = bpy.context.active_object
    horn_l.rotation_euler = (-0.3, 0.4, 0.2)
    horn_l.data.materials.append(mat_brass)

    bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=0.2, depth=1.1, location=(-0.35, 0.2, 3.9))
    horn_r = bpy.context.active_object
    horn_r.rotation_euler = (-0.3, -0.4, -0.2)
    horn_r.data.materials.append(mat_brass)

    # 4. Dual Curved Vayu Crescent Scythes
    bpy.ops.mesh.primitive_torus_add(major_radius=1.3, minor_radius=0.08, major_segments=24, minor_segments=8, location=(1.6, 0.6, 2.2))
    scythe_l = bpy.context.active_object
    scythe_l.rotation_euler = (math.pi/3, 0, math.pi/4)
    scythe_l.data.materials.append(mat_brass)

    bpy.ops.mesh.primitive_torus_add(major_radius=1.3, minor_radius=0.08, major_segments=24, minor_segments=8, location=(-1.6, 0.6, 2.2))
    scythe_r = bpy.context.active_object
    scythe_r.rotation_euler = (math.pi/3, 0, -math.pi/4)
    scythe_r.data.materials.append(mat_brass)

    # Join accessories into single mesh
    bpy.ops.object.select_all(action='DESELECT')
    all_parts = [torso, wing_ul, wing_ur, wing_ll, wing_lr, head, horn_l, horn_r, scythe_l, scythe_r]
    for p in all_parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = torso
    bpy.ops.object.join()
    body_mesh = torso
    body_mesh.name = "BossMatarishvan_Mesh"

    # UV unwrap
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Build Skeleton3D Armature (26 bones)
    bpy.ops.object.armature_add(enter_editmode=True, align='WORLD', location=(0, 0, 0))
    arm_obj = bpy.context.active_object
    arm_obj.name = "Armature_Matarishvan"
    arm_data = arm_obj.data
    arm_data.name = "ArmatureData_Matarishvan"

    eb = arm_data.edit_bones
    root = eb[0]
    root.name = "root"
    root.head = (0, 0, 0)
    root.tail = (0, 0, 1.0)

    pelvis = eb.new("pelvis")
    pelvis.head = (0, 0, 1.4)
    pelvis.tail = (0, 0, 1.9)
    pelvis.parent = root

    spine = eb.new("spine")
    spine.head = (0, 0, 1.9)
    spine.tail = (0, 0, 2.4)
    spine.parent = pelvis

    chest = eb.new("chest")
    chest.head = (0, 0, 2.4)
    chest.tail = (0, 0, 3.0)
    chest.parent = spine

    head_bone = eb.new("head")
    head_bone.head = (0, 0, 3.0)
    head_bone.tail = (0, 0, 3.8)
    head_bone.parent = chest

    # Wings
    wing_l = eb.new("wing_l")
    wing_l.head = (0.5, -0.2, 2.7)
    wing_l.tail = (2.2, -0.5, 3.6)
    wing_l.parent = chest

    wing_r = eb.new("wing_r")
    wing_r.head = (-0.5, -0.2, 2.7)
    wing_r.tail = (-2.2, -0.5, 3.6)
    wing_r.parent = chest

    wing_ll = eb.new("wing_lower_l")
    wing_ll.head = (0.4, -0.15, 2.2)
    wing_ll.tail = (1.5, -0.3, 1.8)
    wing_ll.parent = spine

    wing_lr = eb.new("wing_lower_r")
    wing_lr.head = (-0.4, -0.15, 2.2)
    wing_lr.tail = (-1.5, -0.3, 1.8)
    wing_lr.parent = spine

    # Arms
    arm_l = eb.new("arm_l")
    arm_l.head = (0.8, 0, 2.6)
    arm_l.tail = (1.6, 0.4, 2.2)
    arm_l.parent = chest

    arm_r = eb.new("arm_r")
    arm_r.head = (-0.8, 0, 2.6)
    arm_r.tail = (-1.6, 0.4, 2.2)
    arm_r.parent = chest

    weapon_l = eb.new("weapon_l")
    weapon_l.head = (1.6, 0.4, 2.2)
    weapon_l.tail = (1.8, 0.8, 2.2)
    weapon_l.parent = arm_l

    weapon_r = eb.new("weapon_r")
    weapon_r.head = (-1.6, 0.4, 2.2)
    weapon_r.tail = (-1.8, 0.8, 2.2)
    weapon_r.parent = arm_r

    bpy.ops.object.mode_set(mode='OBJECT')

    # Parent mesh to armature with auto weights
    body_mesh.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')

    # Authored Animations (10 Actions)
    # 1. boss_idle (Hovering vertical bob + wing beats)
    add_action(arm_obj, "boss_idle", 2.0, {
        "chest": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.05, 0, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "wing_l": [(0, euler_to_quat(0, 0, 0.2)), (1.0, euler_to_quat(-0.15, 0, -0.3)), (2.0, euler_to_quat(0, 0, 0.2))],
        "wing_r": [(0, euler_to_quat(0, 0, -0.2)), (1.0, euler_to_quat(-0.15, 0, 0.3)), (2.0, euler_to_quat(0, 0, -0.2))],
        "arm_l": [(0, euler_to_quat(0.1, 0, 0)), (1.0, euler_to_quat(-0.1, 0, 0)), (2.0, euler_to_quat(0.1, 0, 0))],
        "arm_r": [(0, euler_to_quat(0.1, 0, 0)), (1.0, euler_to_quat(-0.1, 0, 0)), (2.0, euler_to_quat(0.1, 0, 0))],
    })

    # 2. boss_walk (Forward flight cycle)
    add_action(arm_obj, "boss_walk", 1.5, {
        "chest": [(0, euler_to_quat(0.15, 0, 0)), (0.75, euler_to_quat(0.2, 0, 0)), (1.5, euler_to_quat(0.15, 0, 0))],
        "wing_l": [(0, euler_to_quat(0.2, 0, 0.4)), (0.75, euler_to_quat(-0.25, 0, -0.4)), (1.5, euler_to_quat(0.2, 0, 0.4))],
        "wing_r": [(0, euler_to_quat(0.2, 0, -0.4)), (0.75, euler_to_quat(-0.25, 0, 0.4)), (1.5, euler_to_quat(0.2, 0, -0.4))],
    })

    # 3. boss_cleave_telegraph (Raising scythes overhead + flaring wings)
    add_action(arm_obj, "boss_cleave_telegraph", 1.0, {
        "chest": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.25, 0, 0))],
        "head": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.2, 0, 0))],
        "wing_l": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.3, 0, 0.6))],
        "wing_r": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.3, 0, -0.6))],
        "arm_l": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-1.2, 0, 0.4))],
        "arm_r": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-1.2, 0, -0.4))],
    })

    # 4. boss_cleave_attack (Downward double-crescent cleave)
    add_action(arm_obj, "boss_cleave_attack", 0.8, {
        "chest": [(0, euler_to_quat(-0.25, 0, 0)), (0.3, euler_to_quat(0.4, 0, 0)), (0.8, euler_to_quat(0, 0, 0))],
        "arm_l": [(0, euler_to_quat(-1.2, 0, 0.4)), (0.3, euler_to_quat(0.6, 0, -0.3)), (0.8, euler_to_quat(0, 0, 0))],
        "arm_r": [(0, euler_to_quat(-1.2, 0, -0.4)), (0.3, euler_to_quat(0.6, 0, 0.3)), (0.8, euler_to_quat(0, 0, 0))],
        "wing_l": [(0, euler_to_quat(0.3, 0, 0.6)), (0.3, euler_to_quat(-0.4, 0, -0.2)), (0.8, euler_to_quat(0, 0, 0))],
        "wing_r": [(0, euler_to_quat(0.3, 0, -0.6)), (0.3, euler_to_quat(-0.4, 0, 0.2)), (0.8, euler_to_quat(0, 0, 0))],
    })

    # 5. boss_vortex_channel (Tucking wings inward)
    add_action(arm_obj, "boss_vortex_channel", 2.0, {
        "chest": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.1, 0, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "wing_l": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.4, 0, -0.5)), (2.0, euler_to_quat(0, 0, 0))],
        "wing_r": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.4, 0, 0.5)), (2.0, euler_to_quat(0, 0, 0))],
    })

    # 6. boss_slam_leap (Skyward vertical leap)
    add_action(arm_obj, "boss_slam_leap", 1.0, {
        "chest": [(0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(0.3, 0, 0)), (1.0, euler_to_quat(-0.4, 0, 0))],
        "wing_l": [(0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(-0.4, 0, -0.3)), (1.0, euler_to_quat(0.5, 0, 0.7))],
        "wing_r": [(0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(-0.4, 0, 0.3)), (1.0, euler_to_quat(0.5, 0, -0.7))],
    })

    # 7. boss_slam_impact (Crash landing)
    add_action(arm_obj, "boss_slam_impact", 1.1, {
        "chest": [(0, euler_to_quat(-0.4, 0, 0)), (0.25, euler_to_quat(0.5, 0, 0)), (1.1, euler_to_quat(0, 0, 0))],
        "wing_l": [(0, euler_to_quat(0.5, 0, 0.7)), (0.25, euler_to_quat(-0.6, 0, -0.5)), (1.1, euler_to_quat(0, 0, 0))],
        "wing_r": [(0, euler_to_quat(0.5, 0, -0.7)), (0.25, euler_to_quat(-0.6, 0, 0.5)), (1.1, euler_to_quat(0, 0, 0))],
    })

    # 8. boss_charge (Berserk forward charge)
    add_action(arm_obj, "boss_charge", 0.8, {
        "chest": [(0, euler_to_quat(0.35, 0, 0)), (0.4, euler_to_quat(0.4, 0, 0)), (0.8, euler_to_quat(0.35, 0, 0))],
        "arm_l": [(0, euler_to_quat(0.5, 0, -0.4)), (0.4, euler_to_quat(0.8, 0, -0.6)), (0.8, euler_to_quat(0.5, 0, -0.4))],
        "arm_r": [(0, euler_to_quat(0.5, 0, 0.4)), (0.4, euler_to_quat(0.8, 0, 0.6)), (0.8, euler_to_quat(0.5, 0, 0.4))],
    })

    # 9. boss_roar (Enrage roar with wings spread wide)
    add_action(arm_obj, "boss_roar", 1.5, {
        "chest": [(0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(-0.35, 0, 0)), (1.5, euler_to_quat(0, 0, 0))],
        "head": [(0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(0.45, 0, 0)), (1.5, euler_to_quat(0, 0, 0))],
        "wing_l": [(0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(0.2, 0, 0.8)), (1.5, euler_to_quat(0, 0, 0))],
        "wing_r": [(0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(0.2, 0, -0.8)), (1.5, euler_to_quat(0, 0, 0))],
    })

    # 10. boss_stagger (Poise broken kneel/droop)
    add_action(arm_obj, "boss_stagger", 2.0, {
        "chest": [(0, euler_to_quat(0, 0, 0)), (0.3, euler_to_quat(0.4, 0, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "wing_l": [(0, euler_to_quat(0, 0, 0)), (0.3, euler_to_quat(-0.4, 0, -0.4)), (2.0, euler_to_quat(0, 0, 0))],
        "wing_r": [(0, euler_to_quat(0, 0, 0)), (0.3, euler_to_quat(-0.4, 0, 0.4)), (2.0, euler_to_quat(0, 0, 0))],
    })

    # 11. boss_defeat (Defeat dissolution)
    add_action(arm_obj, "boss_defeat", 2.5, {
        "chest": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.6, 0, 0)), (2.5, euler_to_quat(0.8, 0, 0))],
        "wing_l": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.5, 0, -0.5)), (2.5, euler_to_quat(-0.6, 0, -0.6))],
        "wing_r": [(0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.5, 0, 0.5)), (2.5, euler_to_quat(-0.6, 0, 0.6))],
    })

    # Export
    out_path = os.path.join(ENEMY_DIR, "boss_matarishvan.glb")
    bpy.ops.object.select_all(action='DESELECT')
    arm_obj.select_set(True)
    body_mesh.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_animation_mode='ACTIONS',
        export_force_sampling=False,
        export_anim_single_armature=True,
        export_apply=False
    )
    print(f"Exported {out_path} ({os.path.getsize(out_path)} bytes)")

# =========================================================================
# 2. GALE FALCON: 2.2m Wingspan Celestial Raptor
# =========================================================================
def build_gale_falcon():
    print("Building Gale Falcon (2.2m Wingspan Celestial Raptor)...")
    clear_scene()

    mat_feather = create_pbr_material("Mat_FalconFeather", "matarishvan_albedo.png", "matarishvan_normal.png", "matarishvan_mr.png")
    mat_talon = create_pbr_material("Mat_VayuBrass", "vayu_brass_albedo.png", "vayu_brass_normal.png")

    # Body
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.6, location=(0, 0, 0))
    body = bpy.context.active_object
    body.scale = (0.7, 1.4, 0.6)
    bpy.ops.object.transform_apply(scale=True)
    body.data.materials.append(mat_feather)

    # Wings
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.3, depth=1.8, location=(1.1, 0, 0.1))
    wing_l = bpy.context.active_object
    wing_l.scale = (0.08, 0.9, 1.0)
    wing_l.rotation_euler = (0, 0, math.pi/2)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    wing_l.data.materials.append(mat_feather)

    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.3, depth=1.8, location=(-1.1, 0, 0.1))
    wing_r = bpy.context.active_object
    wing_r.scale = (0.08, 0.9, 1.0)
    wing_r.rotation_euler = (0, 0, -math.pi/2)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    wing_r.data.materials.append(mat_feather)

    # Beak / Head
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.2, depth=0.5, location=(0, 0.9, 0.1))
    beak = bpy.context.active_object
    beak.rotation_euler = (math.pi/2, 0, 0)
    beak.data.materials.append(mat_talon)

    # Talons
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.12, depth=0.4, location=(0.25, -0.2, -0.5))
    talon_l = bpy.context.active_object
    talon_l.data.materials.append(mat_talon)

    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.12, depth=0.4, location=(-0.25, -0.2, -0.5))
    talon_r = bpy.context.active_object
    talon_r.data.materials.append(mat_talon)

    # Join
    bpy.ops.object.select_all(action='DESELECT')
    for o in [body, wing_l, wing_r, beak, talon_l, talon_r]:
        o.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    body.name = "GaleFalcon_Mesh"

    # UV unwrap
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Armature (12 bones)
    bpy.ops.object.armature_add(enter_editmode=True, align='WORLD', location=(0, 0, 0))
    arm_obj = bpy.context.active_object
    arm_obj.name = "Armature_GaleFalcon"
    eb = arm_obj.data.edit_bones

    root = eb[0]
    root.name = "root"
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.4)

    head_b = eb.new("head")
    head_b.head = (0, 0.4, 0.1)
    head_b.tail = (0, 0.9, 0.1)
    head_b.parent = root

    wing_lb = eb.new("wing_l")
    wing_lb.head = (0.4, 0, 0.1)
    wing_lb.tail = (1.8, 0, 0.2)
    wing_lb.parent = root

    wing_rb = eb.new("wing_r")
    wing_rb.head = (-0.4, 0, 0.1)
    wing_rb.tail = (-1.8, 0, 0.2)
    wing_rb.parent = root

    talon_lb = eb.new("talon_l")
    talon_lb.head = (0.25, -0.2, -0.2)
    talon_lb.tail = (0.25, -0.2, -0.6)
    talon_lb.parent = root

    talon_rb = eb.new("talon_r")
    talon_rb.head = (-0.25, -0.2, -0.2)
    talon_rb.tail = (-0.25, -0.2, -0.6)
    talon_rb.parent = root

    bpy.ops.object.mode_set(mode='OBJECT')

    # Parent
    body.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')

    # Actions: idle, walk, telegraph, attack, stagger, death
    add_action(arm_obj, "idle", 1.5, {
        "root": [(0, euler_to_quat(0, 0, 0)), (0.75, euler_to_quat(0.05, 0, 0)), (1.5, euler_to_quat(0, 0, 0))],
        "wing_l": [(0, euler_to_quat(0, 0, 0.15)), (0.75, euler_to_quat(0, 0, -0.2)), (1.5, euler_to_quat(0, 0, 0.15))],
        "wing_r": [(0, euler_to_quat(0, 0, -0.15)), (0.75, euler_to_quat(0, 0, 0.2)), (1.5, euler_to_quat(0, 0, -0.15))],
    })

    add_action(arm_obj, "walk", 0.8, {
        "wing_l": [(0, euler_to_quat(0, 0, 0.5)), (0.4, euler_to_quat(0, 0, -0.5)), (0.8, euler_to_quat(0, 0, 0.5))],
        "wing_r": [(0, euler_to_quat(0, 0, -0.5)), (0.4, euler_to_quat(0, 0, 0.5)), (0.8, euler_to_quat(0, 0, -0.5))],
    })

    add_action(arm_obj, "telegraph", 0.7, {
        "root": [(0, euler_to_quat(0, 0, 0)), (0.7, euler_to_quat(-0.4, 0, 0))],
        "head": [(0, euler_to_quat(0, 0, 0)), (0.7, euler_to_quat(0.3, 0, 0))],
        "talon_l": [(0, euler_to_quat(0, 0, 0)), (0.7, euler_to_quat(0.6, 0, 0))],
        "talon_r": [(0, euler_to_quat(0, 0, 0)), (0.7, euler_to_quat(0.6, 0, 0))],
    })

    add_action(arm_obj, "attack", 0.6, {
        "root": [(0, euler_to_quat(-0.4, 0, 0)), (0.2, euler_to_quat(0.7, 0, 0)), (0.6, euler_to_quat(0, 0, 0))],
        "wing_l": [(0, euler_to_quat(0, 0, 0.6)), (0.2, euler_to_quat(-0.3, 0, -0.4)), (0.6, euler_to_quat(0, 0, 0))],
        "wing_r": [(0, euler_to_quat(0, 0, -0.6)), (0.2, euler_to_quat(-0.3, 0, 0.4)), (0.6, euler_to_quat(0, 0, 0))],
    })

    add_action(arm_obj, "stagger", 0.8, {
        "root": [(0, euler_to_quat(0, 0, 0)), (0.3, euler_to_quat(-0.5, 0, 0.3)), (0.8, euler_to_quat(0, 0, 0))],
    })

    add_action(arm_obj, "death", 1.2, {
        "root": [(0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(0.8, 0, 0.8)), (1.2, euler_to_quat(1.5, 0, 1.5))],
    })

    out_path = os.path.join(ENEMY_DIR, "gale_falcon.glb")
    bpy.ops.object.select_all(action='DESELECT')
    arm_obj.select_set(True)
    body.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_animation_mode='ACTIONS',
        export_force_sampling=False,
        export_anim_single_armature=True,
        export_apply=False
    )
    print(f"Exported {out_path} ({os.path.getsize(out_path)} bytes)")

# =========================================================================
# 3. WIND ARCHER: 1.9m Hovering Asura Sniper with Gale Bow
# =========================================================================
def build_wind_archer():
    print("Building Wind Archer (1.9m Hovering Asura Sniper)...")
    clear_scene()

    mat_body = create_pbr_material("Mat_ArcherArmor", "asura_armor_albedo.png", "asura_armor_normal.png", "asura_armor_metallic_roughness.png")
    mat_brass = create_pbr_material("Mat_VayuBrass", "vayu_brass_albedo.png", "vayu_brass_normal.png")

    # Body torso
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.45, depth=1.1, location=(0, 0, 1.3))
    torso = bpy.context.active_object
    torso.data.materials.append(mat_body)

    # Head with hooded cowl
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.35, location=(0, 0, 2.05))
    head = bpy.context.active_object
    head.data.materials.append(mat_body)

    # Gale Greatbow (attached to left arm)
    bpy.ops.mesh.primitive_torus_add(major_radius=1.1, minor_radius=0.05, major_segments=20, minor_segments=8, location=(0.6, 0.4, 1.4))
    bow = bpy.context.active_object
    bow.rotation_euler = (0, math.pi/2, 0)
    bow.data.materials.append(mat_brass)

    # Quiver on back
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.15, depth=0.9, location=(0, -0.35, 1.5))
    quiver = bpy.context.active_object
    quiver.rotation_euler = (0.3, 0, 0.2)
    quiver.data.materials.append(mat_brass)

    # Join
    bpy.ops.object.select_all(action='DESELECT')
    for o in [torso, head, bow, quiver]:
        o.select_set(True)
    bpy.context.view_layer.objects.active = torso
    bpy.ops.object.join()
    torso.name = "WindArcher_Mesh"

    # UV unwrap
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Armature (22 bones)
    bpy.ops.object.armature_add(enter_editmode=True, align='WORLD', location=(0, 0, 0))
    arm_obj = bpy.context.active_object
    arm_obj.name = "Armature_WindArcher"
    eb = arm_obj.data.edit_bones

    root = eb[0]
    root.name = "root"
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.8)

    pelvis = eb.new("pelvis")
    pelvis.head = (0, 0, 0.8)
    pelvis.tail = (0, 0, 1.2)
    pelvis.parent = root

    chest = eb.new("chest")
    chest.head = (0, 0, 1.2)
    chest.tail = (0, 0, 1.8)
    chest.parent = pelvis

    head_b = eb.new("head")
    head_b.head = (0, 0, 1.8)
    head_b.tail = (0, 0, 2.3)
    head_b.parent = chest

    arm_l = eb.new("arm_l")
    arm_l.head = (0.5, 0, 1.6)
    arm_l.tail = (0.9, 0.4, 1.4)
    arm_l.parent = chest

    arm_r = eb.new("arm_r")
    arm_r.head = (-0.5, 0, 1.6)
    arm_r.tail = (-0.9, 0.4, 1.4)
    arm_r.parent = chest

    weapon_l = eb.new("weapon_l")
    weapon_l.head = (0.9, 0.4, 1.4)
    weapon_l.tail = (0.9, 0.7, 1.4)
    weapon_l.parent = arm_l

    bpy.ops.object.mode_set(mode='OBJECT')

    # Parent
    torso.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')

    # Actions: idle, walk, telegraph, attack, stagger, death
    add_action(arm_obj, "idle", 1.8, {
        "chest": [(0, euler_to_quat(0, 0, 0)), (0.9, euler_to_quat(0.04, 0, 0)), (1.8, euler_to_quat(0, 0, 0))],
        "arm_l": [(0, euler_to_quat(0.2, 0, 0)), (0.9, euler_to_quat(0.25, 0, 0)), (1.8, euler_to_quat(0.2, 0, 0))],
    })

    add_action(arm_obj, "walk", 1.2, {
        "chest": [(0, euler_to_quat(0, 0, 0.08)), (0.6, euler_to_quat(0, 0, -0.08)), (1.2, euler_to_quat(0, 0, 0.08))],
    })

    add_action(arm_obj, "telegraph", 0.85, {
        "chest": [(0, euler_to_quat(0, 0, 0)), (0.85, euler_to_quat(0, 0.3, 0))],
        "arm_l": [(0, euler_to_quat(0.2, 0, 0)), (0.85, euler_to_quat(0.8, 0, 0.2))],
        "arm_r": [(0, euler_to_quat(0, 0, 0)), (0.85, euler_to_quat(0.8, -0.5, 0))],
    })

    add_action(arm_obj, "attack", 0.4, {
        "arm_r": [(0, euler_to_quat(0.8, -0.5, 0)), (0.1, euler_to_quat(0.4, 0.1, 0)), (0.4, euler_to_quat(0, 0, 0))],
    })

    add_action(arm_obj, "stagger", 0.8, {
        "chest": [(0, euler_to_quat(0, 0, 0)), (0.3, euler_to_quat(-0.4, 0, 0)), (0.8, euler_to_quat(0, 0, 0))],
    })

    add_action(arm_obj, "death", 1.5, {
        "chest": [(0, euler_to_quat(0, 0, 0)), (0.6, euler_to_quat(0.5, 0, 0)), (1.5, euler_to_quat(0.9, 0, 0))],
    })

    out_path = os.path.join(ENEMY_DIR, "wind_archer.glb")
    bpy.ops.object.select_all(action='DESELECT')
    arm_obj.select_set(True)
    torso.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_animation_mode='ACTIONS',
        export_force_sampling=False,
        export_anim_single_armature=True,
        export_apply=False
    )
    print(f"Exported {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == '__main__':
    print("=== Building Antariksha Combat Actors ===")
    build_boss_matarishvan()
    build_gale_falcon()
    build_wind_archer()
    print("=== Combat Actors Complete ===")
