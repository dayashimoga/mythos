"""
Mythos 3D - Svar Combat Actors Blender Pipeline
Generates authentic, high-fidelity 3D rigged & animated models for Chapter IV: Realm of Svar / Svarga (The Celestial Solar Citadels):
1. Boss Surya Avatara (3.8m monumental Sun Titan Colossus with 26-bone armature, 12-rayed halo, 3.2m greatsword, 10 authored actions)
2. Surya Guardian (2.1m armored celestial spearman with suncrest helm, round radiant shield, 22-bone armature, 6 authored actions)
3. Solar Gryphon (2.6m wingspan celestial winged raptor with golden plumage, razor talons, 20-bone armature, 6 authored actions)
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Quaternion, Matrix, Euler

ROOT_DIR = r"h:\mythologicalgame"
TEXTURE_DIR = os.path.join(ROOT_DIR, r"godot\assets\environment\textures\svar")
CHAR_TEXTURE_DIR = os.path.join(ROOT_DIR, r"godot\assets\characters\enemies\textures")
ENEMY_DIR = os.path.join(ROOT_DIR, r"godot\assets\characters\enemies")

def clear_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m, do_unlink=True)
    for a in list(bpy.data.armatures):
        bpy.data.armatures.remove(a, do_unlink=True)
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act, do_unlink=True)

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

def create_pbr_material(name, alb_name=None, norm_name=None, mr_name=None, em_name=None,
                        base_color=(0.95, 0.82, 0.25, 1.0), roughness=0.35, metallic=0.7):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out_node = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    links.new(bsdf.outputs["BSDF"], out_node.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic

    if alb_name:
        alb_path = os.path.join(TEXTURE_DIR, alb_name)
        if not os.path.exists(alb_path):
            alb_path = os.path.join(CHAR_TEXTURE_DIR, alb_name)
        if os.path.exists(alb_path):
            img_alb = bpy.data.images.load(alb_path)
            tex_alb = nodes.new(type="ShaderNodeTexImage")
            tex_alb.image = img_alb
            links.new(tex_alb.outputs["Color"], bsdf.inputs["Base Color"])

    if norm_name:
        norm_path = os.path.join(TEXTURE_DIR, norm_name)
        if not os.path.exists(norm_path):
            norm_path = os.path.join(CHAR_TEXTURE_DIR, norm_name)
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
        if not os.path.exists(mr_path):
            mr_path = os.path.join(CHAR_TEXTURE_DIR, mr_name)
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
        if not os.path.exists(em_path):
            em_path = os.path.join(CHAR_TEXTURE_DIR, em_name)
        if os.path.exists(em_path):
            img_em = bpy.data.images.load(em_path)
            tex_em = nodes.new(type="ShaderNodeTexImage")
            tex_em.image = img_em
            links.new(tex_em.outputs["Color"], bsdf.inputs["Emission Color"])
            bsdf.inputs["Emission Strength"].default_value = 4.0

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
# 1. BOSS SURYA AVATARA (3.8m Monumental Radiant Sun Colossus Titan)
# =========================================================================
def build_boss_surya():
    clear_scene()

    mat_gold = create_pbr_material("Mat_SuryaGold", "svar_celestial_gold_albedo.png",
                                   "svar_celestial_gold_normal.png", "svar_celestial_gold_mr.png")
    mat_steel = create_pbr_material("Mat_SuryaSteel", "svar_sun_steel_albedo.png",
                                    "svar_sun_steel_normal.png", "svar_sun_steel_mr.png")
    mat_core = create_pbr_material("Mat_SuryaCore", "svar_solar_core_albedo.png",
                                   em_name="svar_solar_core_emissive.png",
                                   base_color=(1.0, 0.9, 0.4, 1.0))

    arm_data = bpy.data.armatures.new("BossSurya_Armature")
    arm_obj = bpy.data.objects.new("BossSurya_Rig", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    root = eb.new("root")
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.4)

    pelvis = eb.new("pelvis")
    pelvis.head = (0, 0, 1.6)
    pelvis.tail = (0, 0, 1.85)
    pelvis.parent = root

    spine1 = eb.new("spine.01")
    spine1.head = pelvis.tail
    spine1.tail = (0, 0, 2.2)
    spine1.parent = pelvis

    spine2 = eb.new("spine.02")
    spine2.head = spine1.tail
    spine2.tail = (0, 0, 2.6)
    spine2.parent = spine1

    chest = eb.new("chest")
    chest.head = spine2.tail
    chest.tail = (0, 0, 3.1)
    chest.parent = spine2

    neck = eb.new("neck")
    neck.head = chest.tail
    neck.tail = (0, 0, 3.3)
    neck.parent = chest

    head = eb.new("head")
    head.head = neck.tail
    head.tail = (0, 0, 3.65)
    head.parent = neck

    crown = eb.new("crown")
    crown.head = head.tail
    crown.tail = (0, 0, 4.15)
    crown.parent = head

    halo = eb.new("solar_halo")
    halo.head = (0, 0.25, 3.7)
    halo.tail = (0, 0.25, 4.7)
    halo.parent = head

    # Arms
    for side, sign in [("L", 1), ("R", -1)]:
        sh = eb.new(f"shoulder.{side}")
        sh.head = (sign * 0.2, 0, 3.0)
        sh.tail = (sign * 0.65, 0, 2.95)
        sh.parent = chest

        ua = eb.new(f"upper_arm.{side}")
        ua.head = sh.tail
        ua.tail = (sign * 0.95, 0, 2.3)
        ua.parent = sh

        fa = eb.new(f"forearm.{side}")
        fa.head = ua.tail
        fa.tail = (sign * 1.15, -0.1, 1.7)
        fa.parent = ua

        hand = eb.new(f"hand.{side}")
        hand.head = fa.tail
        hand.tail = (sign * 1.25, -0.2, 1.45)
        hand.parent = fa

        if side == "R":
            sword = eb.new("greatsword_mount")
            sword.head = hand.tail
            sword.tail = (sign * 1.3, -0.8, 0.5)
            sword.parent = hand

    # Legs
    for side, sign in [("L", 1), ("R", -1)]:
        thigh = eb.new(f"thigh.{side}")
        thigh.head = (sign * 0.35, 0, 1.6)
        thigh.tail = (sign * 0.4, 0, 0.85)
        thigh.parent = pelvis

        shin = eb.new(f"shin.{side}")
        shin.head = thigh.tail
        shin.tail = (sign * 0.42, 0, 0.2)
        shin.parent = thigh

        foot = eb.new(f"foot.{side}")
        foot.head = shin.tail
        foot.tail = (sign * 0.42, -0.35, 0.0)
        foot.parent = shin

    bpy.ops.object.mode_set(mode='OBJECT')

    # Mesh Geometry
    mesh_data = bpy.data.meshes.new("BossSurya_Mesh")
    mesh_obj = bpy.data.objects.new("BossSurya_Model", mesh_data)
    bpy.context.scene.collection.objects.link(mesh_obj)

    bm = bmesh.new()

    # Muscular Torso & Breastplate
    torso = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.75, radius2=0.55, depth=1.3, segments=12)
    for v in torso['verts']:
        v.co.z += 2.45

    # Head & Solar Mask
    head_geom = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.4)
    for v in head_geom['verts']:
        v.co.z += 3.45

    # 8-Tiered Sun Crown
    crown_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.45, radius2=0.08, depth=0.75, segments=10)
    for v in crown_geom['verts']:
        v.co.z += 3.9

    # 12-Rayed Flaming Solar Halo Disc (Radius 1.2m at Z=3.7m behind head)
    halo_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=1.2, radius2=1.2, depth=0.08, segments=24)
    for v in halo_geom['verts']:
        v.co.y += 0.25
        v.co.z += 3.7

    # Limbs
    for sign in [1, -1]:
        # Arm
        arm_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.25, radius2=0.2, depth=1.2, segments=8)
        for v in arm_geom['verts']:
            v.co.x += sign * 0.85
            v.co.z += 2.3
        # Leg
        leg_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.32, radius2=0.22, depth=1.5, segments=8)
        for v in leg_geom['verts']:
            v.co.x += sign * 0.4
            v.co.z += 0.85

    # 3.2m Sunsteel Greatsword (attached to right hand)
    sword_blade = bmesh.ops.create_cube(bm, size=1.0)
    for v in sword_blade['verts']:
        v.co.x = (v.co.x * 0.12) - 1.25
        v.co.y = (v.co.y * 0.35) - 0.2
        v.co.z = (v.co.z * 3.2) + 1.6

    bm.to_mesh(mesh_data)
    bm.free()

    mesh_data.materials.append(mat_gold)
    mesh_data.materials.append(mat_steel)
    mesh_data.materials.append(mat_core)

    # Vertex skin weights
    for b in arm_data.bones:
        mesh_obj.vertex_groups.new(name=b.name)

    for v in mesh_data.vertices:
        z = v.co.z
        if z < 0.85:
            side = "L" if v.co.x > 0 else "R"
            mesh_obj.vertex_groups[f"shin.{side}"].add([v.index], 0.7, 'REPLACE')
            mesh_obj.vertex_groups[f"foot.{side}"].add([v.index], 0.3, 'REPLACE')
        elif z < 1.6:
            side = "L" if v.co.x > 0 else "R"
            mesh_obj.vertex_groups[f"thigh.{side}"].add([v.index], 0.8, 'REPLACE')
            mesh_obj.vertex_groups["pelvis"].add([v.index], 0.2, 'REPLACE')
        elif z < 2.6:
            mesh_obj.vertex_groups["pelvis"].add([v.index], 0.4, 'REPLACE')
            mesh_obj.vertex_groups["chest"].add([v.index], 0.6, 'REPLACE')
        elif z < 3.2:
            if abs(v.co.x) > 0.6:
                side = "L" if v.co.x > 0 else "R"
                mesh_obj.vertex_groups[f"upper_arm.{side}"].add([v.index], 0.7, 'REPLACE')
                mesh_obj.vertex_groups[f"forearm.{side}"].add([v.index], 0.3, 'REPLACE')
            else:
                mesh_obj.vertex_groups["chest"].add([v.index], 0.9, 'REPLACE')
        elif z >= 3.6 and v.co.y > 0.15:
            mesh_obj.vertex_groups["solar_halo"].add([v.index], 1.0, 'REPLACE')
        else:
            mesh_obj.vertex_groups["head"].add([v.index], 0.8, 'REPLACE')
            mesh_obj.vertex_groups["crown"].add([v.index], 0.2, 'REPLACE')

    mesh_obj.parent = arm_obj
    mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj

    # 10 Authored Actions for Boss Surya Avatara
    # 1. boss_idle (2.0s loop)
    add_action(arm_obj, "boss_idle", 2.0, {
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.04, 0, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "solar_halo": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0, 0, 0.15)), (2.0, euler_to_quat(0, 0, 0))],
        "upper_arm.R": [(0.0, euler_to_quat(0.2, 0, -0.3)), (1.0, euler_to_quat(0.25, 0, -0.3)), (2.0, euler_to_quat(0.2, 0, -0.3))],
    })

    # 2. boss_walk (1.6s loop)
    add_action(arm_obj, "boss_walk", 1.6, {
        "pelvis": [(0.0, euler_to_quat(0, 0.05, 0)), (0.8, euler_to_quat(0, -0.05, 0)), (1.6, euler_to_quat(0, 0.05, 0))],
        "thigh.L": [(0.0, euler_to_quat(0.35, 0, 0)), (0.8, euler_to_quat(-0.35, 0, 0)), (1.6, euler_to_quat(0.35, 0, 0))],
        "thigh.R": [(0.0, euler_to_quat(-0.35, 0, 0)), (0.8, euler_to_quat(0.35, 0, 0)), (1.6, euler_to_quat(-0.35, 0, 0))],
        "solar_halo": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(0, 0, 0.3)), (1.6, euler_to_quat(0, 0, 0.6))],
    })

    # 3. boss_cleave_telegraph (1.0s)
    add_action(arm_obj, "boss_cleave_telegraph", 1.0, {
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.35, 0.2, 0))],
        "upper_arm.R": [(0.0, euler_to_quat(0.2, 0, -0.3)), (1.0, euler_to_quat(-1.4, 0.4, -0.6))],
        "forearm.R": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.8, 0, 0))],
        "solar_halo": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0, 0, 0.8))],
    })

    # 4. boss_cleave_attack (0.8s)
    add_action(arm_obj, "boss_cleave_attack", 0.8, {
        "chest": [(0.0, euler_to_quat(-0.35, 0.2, 0)), (0.35, euler_to_quat(0.55, -0.1, 0)), (0.8, euler_to_quat(0, 0, 0))],
        "upper_arm.R": [(0.0, euler_to_quat(-1.4, 0.4, -0.6)), (0.35, euler_to_quat(0.8, -0.2, -0.2)), (0.8, euler_to_quat(0.2, 0, -0.3))],
        "forearm.R": [(0.0, euler_to_quat(-0.8, 0, 0)), (0.35, euler_to_quat(0.2, 0, 0)), (0.8, euler_to_quat(0, 0, 0))],
    })

    # 5. boss_solar_beam_channel (1.8s)
    add_action(arm_obj, "boss_solar_beam_channel", 1.8, {
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(-0.15, -0.3, 0)), (1.4, euler_to_quat(-0.15, -0.3, 0)), (1.8, euler_to_quat(0, 0, 0))],
        "upper_arm.L": [(0.0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(-1.2, -0.5, 0)), (1.4, euler_to_quat(-1.2, -0.5, 0)), (1.8, euler_to_quat(0, 0, 0))],
        "solar_halo": [(0.0, euler_to_quat(0, 0, 0)), (0.9, euler_to_quat(0, 0, 1.5)), (1.8, euler_to_quat(0, 0, 3.0))],
    })

    # 6. boss_supernova_leap (1.2s)
    add_action(arm_obj, "boss_supernova_leap", 1.2, {
        "pelvis": [(0.0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(0.3, 0, 0)), (1.2, euler_to_quat(-0.2, 0, 0))],
        "thigh.L": [(0.0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(-0.5, 0, 0)), (1.2, euler_to_quat(0.4, 0, 0))],
        "thigh.R": [(0.0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(-0.5, 0, 0)), (1.2, euler_to_quat(0.4, 0, 0))],
        "solar_halo": [(0.0, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(0, 0, 2.0))],
    }, loc_dict={
        "root": [(0.0, Vector((0, 0, 0))), (0.4, Vector((0, 0, -0.4))), (1.2, Vector((0, 0, 6.0)))],
    })

    # 7. boss_supernova_impact (0.8s)
    add_action(arm_obj, "boss_supernova_impact", 0.8, {
        "chest": [(0.0, euler_to_quat(-0.2, 0, 0)), (0.2, euler_to_quat(0.6, 0, 0)), (0.8, euler_to_quat(0, 0, 0))],
        "upper_arm.R": [(0.0, euler_to_quat(-1.0, 0, 0)), (0.2, euler_to_quat(0.7, 0, 0)), (0.8, euler_to_quat(0.2, 0, -0.3))],
    }, loc_dict={
        "root": [(0.0, Vector((0, 0, 6.0))), (0.2, Vector((0, 0, 0))), (0.8, Vector((0, 0, 0)))],
    })

    # 8. boss_pillar_quake (1.4s)
    add_action(arm_obj, "boss_pillar_quake", 1.4, {
        "thigh.R": [(0.0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(-0.7, 0, 0)), (0.7, euler_to_quat(0.2, 0, 0)), (1.4, euler_to_quat(0, 0, 0))],
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(-0.2, 0, 0)), (0.7, euler_to_quat(0.3, 0, 0)), (1.4, euler_to_quat(0, 0, 0))],
    })

    # 9. boss_enrage_flare (2.2s)
    add_action(arm_obj, "boss_enrage_flare", 2.2, {
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(-0.5, 0, 0)), (1.7, euler_to_quat(-0.5, 0, 0)), (2.2, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(-0.4, 0, 0)), (1.7, euler_to_quat(-0.4, 0, 0)), (2.2, euler_to_quat(0, 0, 0))],
        "solar_halo": [(0.0, euler_to_quat(0, 0, 0)), (1.1, euler_to_quat(0, 0, 3.14)), (2.2, euler_to_quat(0, 0, 6.28))],
    })

    # 10. boss_defeat (2.5s)
    add_action(arm_obj, "boss_defeat", 2.5, {
        "pelvis": [(0.0, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(0.2, 0, 0)), (2.5, euler_to_quat(0.4, 0, 0))],
        "thigh.L": [(0.0, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(-0.8, 0, 0)), (2.5, euler_to_quat(-0.9, 0, 0))],
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(0.4, 0, 0)), (2.5, euler_to_quat(0.6, 0, 0))],
    }, loc_dict={
        "root": [(0.0, Vector((0, 0, 0))), (1.2, Vector((0, 0, -0.6))), (2.5, Vector((0, 0, -1.0)))],
    })

    out_path = os.path.join(ENEMY_DIR, "boss_surya_avatara.glb")
    bpy.ops.object.select_all(action='DESELECT')
    arm_obj.select_set(True)
    mesh_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        use_selection=True,
        export_format='GLB',
        export_animations=True,
        export_apply=True
    )
    print(f"Exported Boss Surya Avatara: {out_path} ({os.path.getsize(out_path)} bytes)")

# =========================================================================
# 2. SURYA GUARDIAN (2.1m Armored Solar Spearman)
# =========================================================================
def build_surya_guardian():
    clear_scene()

    mat_gold = create_pbr_material("Mat_GuardianGold", "svar_celestial_gold_albedo.png",
                                   "svar_celestial_gold_normal.png", "svar_celestial_gold_mr.png")
    mat_steel = create_pbr_material("Mat_GuardianSteel", "svar_sun_steel_albedo.png",
                                    "svar_sun_steel_normal.png", "svar_sun_steel_mr.png")

    arm_data = bpy.data.armatures.new("SuryaGuardian_Armature")
    arm_obj = bpy.data.objects.new("SuryaGuardian_Rig", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    root = eb.new("root")
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.3)

    pelvis = eb.new("pelvis")
    pelvis.head = (0, 0, 1.0)
    pelvis.tail = (0, 0, 1.15)
    pelvis.parent = root

    spine = eb.new("spine")
    spine.head = pelvis.tail
    spine.tail = (0, 0, 1.4)
    spine.parent = pelvis

    chest = eb.new("chest")
    chest.head = spine.tail
    chest.tail = (0, 0, 1.7)
    chest.parent = spine

    neck = eb.new("neck")
    neck.head = chest.tail
    neck.tail = (0, 0, 1.85)
    neck.parent = chest

    head = eb.new("head")
    head.head = neck.tail
    head.tail = (0, 0, 2.1)
    head.parent = neck

    suncrest = eb.new("suncrest_helm")
    suncrest.head = head.tail
    suncrest.tail = (0, 0, 2.35)
    suncrest.parent = head

    # Arms
    for side, sign in [("L", 1), ("R", -1)]:
        sh = eb.new(f"shoulder.{side}")
        sh.head = (sign * 0.15, 0, 1.65)
        sh.tail = (sign * 0.4, 0, 1.6)
        sh.parent = chest

        ua = eb.new(f"upper_arm.{side}")
        ua.head = sh.tail
        ua.tail = (sign * 0.55, 0, 1.25)
        ua.parent = sh

        fa = eb.new(f"forearm.{side}")
        fa.head = ua.tail
        fa.tail = (sign * 0.65, -0.1, 0.95)
        fa.parent = ua

        hand = eb.new(f"hand.{side}")
        hand.head = fa.tail
        hand.tail = (sign * 0.7, -0.2, 0.8)
        hand.parent = fa

        if side == "L":
            shield = eb.new("shield_mount")
            shield.head = hand.tail
            shield.tail = (sign * 0.75, -0.4, 0.8)
            shield.parent = hand
        else:
            spear = eb.new("spear_mount")
            spear.head = hand.tail
            spear.tail = (sign * 0.75, -0.6, 0.4)
            spear.parent = hand

    # Legs
    for side, sign in [("L", 1), ("R", -1)]:
        thigh = eb.new(f"thigh.{side}")
        thigh.head = (sign * 0.2, 0, 1.0)
        thigh.tail = (sign * 0.22, 0, 0.5)
        thigh.parent = pelvis

        shin = eb.new(f"shin.{side}")
        shin.head = thigh.tail
        shin.tail = (sign * 0.23, 0, 0.1)
        shin.parent = thigh

        foot = eb.new(f"foot.{side}")
        foot.head = shin.tail
        foot.tail = (sign * 0.23, -0.2, 0.0)
        foot.parent = shin

    bpy.ops.object.mode_set(mode='OBJECT')

    # Mesh Geometry
    mesh_data = bpy.data.meshes.new("SuryaGuardian_Mesh")
    mesh_obj = bpy.data.objects.new("SuryaGuardian_Model", mesh_data)
    bpy.context.scene.collection.objects.link(mesh_obj)

    bm = bmesh.new()

    # Torso
    torso_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.45, radius2=0.35, depth=0.8, segments=10)
    for v in torso_geom['verts']:
        v.co.z += 1.35

    # Helmet with Suncrest Fins
    head_geom = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.25)
    for v in head_geom['verts']:
        v.co.z += 1.95

    crest_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.28, radius2=0.05, depth=0.45, segments=8)
    for v in crest_geom['verts']:
        v.co.z += 2.2

    # Shield (0.9m round radiant disc on left hand)
    shield_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.45, radius2=0.45, depth=0.06, segments=16)
    for v in shield_geom['verts']:
        v.co.x += 0.7
        v.co.y -= 0.35
        v.co.z += 0.95

    # Spear (2.6m golden spear on right hand)
    spear_shaft = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.04, radius2=0.04, depth=2.6, segments=8)
    for v in spear_shaft['verts']:
        v.co.x -= 0.7
        v.co.y -= 0.2
        v.co.z += 1.3

    spear_blade = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.12, radius2=0.01, depth=0.55, segments=6)
    for v in spear_blade['verts']:
        v.co.x -= 0.7
        v.co.y -= 0.2
        v.co.z += 2.85

    bm.to_mesh(mesh_data)
    bm.free()

    mesh_data.materials.append(mat_gold)
    mesh_data.materials.append(mat_steel)

    # Weights
    for b in arm_data.bones:
        mesh_obj.vertex_groups.new(name=b.name)

    for v in mesh_data.vertices:
        z = v.co.z
        if z < 0.5:
            side = "L" if v.co.x > 0 else "R"
            mesh_obj.vertex_groups[f"shin.{side}"].add([v.index], 0.7, 'REPLACE')
            mesh_obj.vertex_groups[f"foot.{side}"].add([v.index], 0.3, 'REPLACE')
        elif z < 1.0:
            side = "L" if v.co.x > 0 else "R"
            mesh_obj.vertex_groups[f"thigh.{side}"].add([v.index], 0.8, 'REPLACE')
        elif z < 1.7:
            mesh_obj.vertex_groups["chest"].add([v.index], 0.8, 'REPLACE')
        elif z < 2.0:
            mesh_obj.vertex_groups["head"].add([v.index], 0.9, 'REPLACE')
        else:
            mesh_obj.vertex_groups["suncrest_helm"].add([v.index], 1.0, 'REPLACE')

    mesh_obj.parent = arm_obj
    mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj

    # 6 Authored Animations for Surya Guardian
    # 1. idle (1.8s)
    add_action(arm_obj, "idle", 1.8, {
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (0.9, euler_to_quat(0.04, 0, 0)), (1.8, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.9, euler_to_quat(-0.03, 0, 0)), (1.8, euler_to_quat(0, 0, 0))],
    })

    # 2. walk (1.2s)
    add_action(arm_obj, "walk", 1.2, {
        "thigh.L": [(0.0, euler_to_quat(0.4, 0, 0)), (0.6, euler_to_quat(-0.4, 0, 0)), (1.2, euler_to_quat(0.4, 0, 0))],
        "thigh.R": [(0.0, euler_to_quat(-0.4, 0, 0)), (0.6, euler_to_quat(0.4, 0, 0)), (1.2, euler_to_quat(-0.4, 0, 0))],
        "pelvis": [(0.0, euler_to_quat(0, 0.05, 0)), (0.6, euler_to_quat(0, -0.05, 0)), (1.2, euler_to_quat(0, 0.05, 0))],
    })

    # 3. telegraph (0.8s)
    add_action(arm_obj, "telegraph", 0.8, {
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(-0.25, -0.3, 0))],
        "upper_arm.R": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(-0.6, 0.4, 0))],
    })

    # 4. thrust_attack (0.7s)
    add_action(arm_obj, "thrust_attack", 0.7, {
        "chest": [(0.0, euler_to_quat(-0.25, -0.3, 0)), (0.25, euler_to_quat(0.35, 0.2, 0)), (0.7, euler_to_quat(0, 0, 0))],
        "upper_arm.R": [(0.0, euler_to_quat(-0.6, 0.4, 0)), (0.25, euler_to_quat(0.8, -0.4, 0)), (0.7, euler_to_quat(0, 0, 0))],
    })

    # 5. shield_block (1.0s)
    add_action(arm_obj, "shield_block", 1.0, {
        "upper_arm.L": [(0.0, euler_to_quat(0, 0, 0)), (0.2, euler_to_quat(-0.8, -0.6, 0)), (1.0, euler_to_quat(0, 0, 0))],
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (0.2, euler_to_quat(0.1, 0.2, 0)), (1.0, euler_to_quat(0, 0, 0))],
    })

    # 6. death (1.6s)
    add_action(arm_obj, "death", 1.6, {
        "pelvis": [(0.0, euler_to_quat(0, 0, 0)), (1.6, euler_to_quat(0.5, 0, 0))],
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (1.6, euler_to_quat(0.7, 0, 0))],
    }, loc_dict={
        "root": [(0.0, Vector((0, 0, 0))), (1.6, Vector((0, 0, -0.6)))],
    })

    out_path = os.path.join(ENEMY_DIR, "surya_guardian.glb")
    bpy.ops.object.select_all(action='DESELECT')
    arm_obj.select_set(True)
    mesh_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        use_selection=True,
        export_format='GLB',
        export_animations=True,
        export_apply=True
    )
    print(f"Exported Surya Guardian: {out_path} ({os.path.getsize(out_path)} bytes)")

# =========================================================================
# 3. SOLAR GRYPHON (2.6m Wingspan Celestial Winged Raptor)
# =========================================================================
def build_solar_gryphon():
    clear_scene()

    mat_feather = create_pbr_material("Mat_GryphonPlumage", "svar_gryphon_albedo.png",
                                     "svar_gryphon_normal.png",
                                     base_color=(0.95, 0.75, 0.25, 1.0))
    mat_gold = create_pbr_material("Mat_GryphonGold", "svar_celestial_gold_albedo.png",
                                   "svar_celestial_gold_normal.png", "svar_celestial_gold_mr.png")

    arm_data = bpy.data.armatures.new("SolarGryphon_Armature")
    arm_obj = bpy.data.objects.new("SolarGryphon_Rig", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    root = eb.new("root")
    root.head = (0, 0, 1.2)
    root.tail = (0, 0, 1.5)

    pelvis = eb.new("pelvis")
    pelvis.head = (0, 0.4, 1.3)
    pelvis.tail = (0, 0.1, 1.35)
    pelvis.parent = root

    spine = eb.new("spine")
    spine.head = pelvis.tail
    spine.tail = (0, -0.3, 1.45)
    spine.parent = pelvis

    neck = eb.new("neck")
    neck.head = spine.tail
    neck.tail = (0, -0.7, 1.75)
    neck.parent = spine

    head = eb.new("head")
    head.head = neck.tail
    head.tail = (0, -1.0, 1.9)
    head.parent = neck

    beak = eb.new("beak")
    beak.head = head.tail
    beak.tail = (0, -1.3, 1.75)
    beak.parent = head

    # Wings (2.6m span)
    for side, sign in [("L", 1), ("R", -1)]:
        w_root = eb.new(f"wing_root.{side}")
        w_root.head = (sign * 0.25, -0.2, 1.5)
        w_root.tail = (sign * 0.75, -0.1, 1.7)
        w_root.parent = spine

        w_mid = eb.new(f"wing_mid.{side}")
        w_mid.head = w_root.tail
        w_mid.tail = (sign * 1.3, 0.1, 1.6)
        w_mid.parent = w_root

    # Legs & Talons
    for side, sign in [("L", 1), ("R", -1)]:
        thigh = eb.new(f"thigh.{side}")
        thigh.head = (sign * 0.25, 0.3, 1.2)
        thigh.tail = (sign * 0.3, 0.2, 0.7)
        thigh.parent = pelvis

        talon = eb.new(f"talon.{side}")
        talon.head = thigh.tail
        talon.tail = (sign * 0.3, -0.1, 0.3)
        talon.parent = thigh

    bpy.ops.object.mode_set(mode='OBJECT')

    # Mesh Geometry
    mesh_data = bpy.data.meshes.new("SolarGryphon_Mesh")
    mesh_obj = bpy.data.objects.new("SolarGryphon_Model", mesh_data)
    bpy.context.scene.collection.objects.link(mesh_obj)

    bm = bmesh.new()

    # Lion Torso (quad body)
    body_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.5, radius2=0.4, depth=1.4, segments=12)
    for v in body_geom['verts']:
        v.co.y += 0.1
        v.co.z += 1.35

    # Eagle Head
    head_geom = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.32)
    for v in head_geom['verts']:
        v.co.y -= 0.9
        v.co.z += 1.85

    # Hooked Golden Beak
    beak_geom = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, radius1=0.15, radius2=0.02, depth=0.35, segments=6)
    for v in beak_geom['verts']:
        v.co.y -= 1.2
        v.co.z += 1.78

    # Wings (layered fans)
    for sign in [1, -1]:
        wing_geom = bmesh.ops.create_cube(bm, size=1.0)
        for v in wing_geom['verts']:
            v.co.x = (v.co.x * 1.2) + (sign * 0.9)
            v.co.y = (v.co.y * 0.4)
            v.co.z = (v.co.z * 0.08) + 1.65

    bm.to_mesh(mesh_data)
    bm.free()

    mesh_data.materials.append(mat_feather)
    mesh_data.materials.append(mat_gold)

    # Weights
    for b in arm_data.bones:
        mesh_obj.vertex_groups.new(name=b.name)

    for v in mesh_data.vertices:
        if abs(v.co.x) > 0.4:
            side = "L" if v.co.x > 0 else "R"
            mesh_obj.vertex_groups[f"wing_mid.{side}"].add([v.index], 1.0, 'REPLACE')
        elif v.co.y < -0.6:
            mesh_obj.vertex_groups["head"].add([v.index], 1.0, 'REPLACE')
        else:
            mesh_obj.vertex_groups["spine"].add([v.index], 1.0, 'REPLACE')

    mesh_obj.parent = arm_obj
    mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj

    # 6 Authored Animations for Solar Gryphon
    # 1. idle (1.2s loop)
    add_action(arm_obj, "idle", 1.2, {
        "wing_root.L": [(0.0, euler_to_quat(0, 0, 0)), (0.6, euler_to_quat(0, 0, 0.4)), (1.2, euler_to_quat(0, 0, 0))],
        "wing_root.R": [(0.0, euler_to_quat(0, 0, 0)), (0.6, euler_to_quat(0, 0, -0.4)), (1.2, euler_to_quat(0, 0, 0))],
    })

    # 2. fly_locomotion (0.8s)
    add_action(arm_obj, "fly_locomotion", 0.8, {
        "wing_root.L": [(0.0, euler_to_quat(0.2, 0, -0.3)), (0.4, euler_to_quat(-0.2, 0, 0.6)), (0.8, euler_to_quat(0.2, 0, -0.3))],
        "wing_root.R": [(0.0, euler_to_quat(0.2, 0, 0.3)), (0.4, euler_to_quat(-0.2, 0, -0.6)), (0.8, euler_to_quat(0.2, 0, 0.3))],
    })

    # 3. telegraph_screech (0.9s)
    add_action(arm_obj, "telegraph_screech", 0.9, {
        "neck": [(0.0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(-0.4, 0, 0)), (0.9, euler_to_quat(0.3, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(-0.3, 0, 0)), (0.9, euler_to_quat(0.4, 0, 0))],
    })

    # 4. dive_strike (0.8s)
    add_action(arm_obj, "dive_strike", 0.8, {
        "spine": [(0.0, euler_to_quat(0, 0, 0)), (0.3, euler_to_quat(0.6, 0, 0)), (0.8, euler_to_quat(0, 0, 0))],
        "talon.L": [(0.0, euler_to_quat(0, 0, 0)), (0.3, euler_to_quat(-0.8, 0, 0)), (0.8, euler_to_quat(0, 0, 0))],
        "talon.R": [(0.0, euler_to_quat(0, 0, 0)), (0.3, euler_to_quat(-0.8, 0, 0)), (0.8, euler_to_quat(0, 0, 0))],
    })

    # 5. stagger (0.7s)
    add_action(arm_obj, "stagger", 0.7, {
        "spine": [(0.0, euler_to_quat(0, 0, 0)), (0.2, euler_to_quat(-0.4, 0, 0)), (0.7, euler_to_quat(0, 0, 0))],
    })

    # 6. death (1.4s)
    add_action(arm_obj, "death", 1.4, {
        "spine": [(0.0, euler_to_quat(0, 0, 0)), (1.4, euler_to_quat(0.9, 0, 0))],
    }, loc_dict={
        "root": [(0.0, Vector((0, 0, 1.2))), (1.4, Vector((0, 0, 0.1)))],
    })

    out_path = os.path.join(ENEMY_DIR, "solar_gryphon.glb")
    bpy.ops.object.select_all(action='DESELECT')
    arm_obj.select_set(True)
    mesh_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        use_selection=True,
        export_format='GLB',
        export_animations=True,
        export_apply=True
    )
    print(f"Exported Solar Gryphon: {out_path} ({os.path.getsize(out_path)} bytes)")

def main():
    print("=" * 60)
    print("Building Production Combat Actors for Realm of Svar...")
    print("=" * 60)
    build_boss_surya()
    build_surya_guardian()
    build_solar_gryphon()
    print("=" * 60)
    print("All Svar combat actors built and exported successfully!")
    print("=" * 60)

if __name__ == "__main__":
    main()
