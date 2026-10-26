"""
Mythos 3D - Production 3D Veer Character Reconstruction Master Pipeline (Blender 4.2 LTS)
Builds authentic high-fidelity Vedic Hero Veer (Solar Guardian):
- High-quality anatomical humanoid base mesh (CC0 quad topology, 10.5k vertices)
- Properly centered (X=0, Y=0, Z=0 at soles of feet, top of head 1.85m)
- Genuine 3D polygonal Vedic attire & equipment:
  * Sculpted warrior topknot (Shikha) with golden ring (Keshbandha) & hair volume
  * Pleated Saffron & Royal Crimson silk Dhoti with central folded Kashta
  * Polished 24k gold Kamarband (waist girdle) with 12-petal Surya lotus medallion buckle & tassels
  * 12-rayed golden Surya medallion necklace & bicep armlets (Bajuband)
  * Flame-engraved antique bronze forearm bracers (Kavacha) & shin greaves (Pada-rakshaka)
  * Flowing Tapovan celestial azure sash (Uttariya)
  * Forged Sunsteel Surya-Kripana scimitar with quillon guard and ruby pommel
- Smart UV unwrapping on all components matching PBR materials
- 7 PBR Principled BSDF materials linked to 1024x1024 texture maps
- 24-bone Skeleton3D with smooth 3D heat diffusion skinning in REST POSE
- Rigid socket attachment for Surya-Kripana to socket_right_hand
- 22 authored skeletal animation tracks (idle, walk, run, sprint, combat, agility, victory, defeat)
- Preserves editable veer_production.blend and exports optimized veer.glb
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Matrix, Quaternion, Euler

ROOT_DIR = r"h:\mythologicalgame"
BUNDLE_PATH = os.path.join(ROOT_DIR, r"tools\human_base_meshes\human_base_meshes_bundle.blend")
TEXTURE_DIR = os.path.join(ROOT_DIR, r"godot\assets\characters\veer\textures")
OUTPUT_BLEND = os.path.join(ROOT_DIR, r"godot\assets\characters\veer\veer_production.blend")
OUTPUT_GLB = os.path.join(ROOT_DIR, r"godot\assets\characters\veer\veer.glb")

import sys
sys.path.append(os.path.join(ROOT_DIR, "scripts"))
import build_veer_geometry as geom

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def setup_materials():
    """Create 9 Principled BSDF materials with PBR texture nodes and double-sided rendering."""
    materials = {}
    mat_configs = [
        ("Mat_Veer_Skin", "skin_albedo.png", "skin_normal.png", "skin_mr.png", None),      # 0
        ("Mat_Veer_Cuirass", "armor_albedo.png", "armor_normal.png", "armor_mr.png", None),# 1
        ("Mat_Veer_Gold", "gold_albedo.png", "gold_normal.png", "gold_mr.png", None),      # 2
        ("Mat_Veer_Dhoti", "dhoti_albedo.png", "dhoti_normal.png", "dhoti_mr.png", None),   # 3
        ("Mat_Veer_Sash", "sash_albedo.png", "sash_normal.png", "sash_mr.png", "sash_emissive.png"), # 4
        ("Mat_Veer_Khadga", "khadga_albedo.png", "khadga_normal.png", "khadga_mr.png", "khadga_emissive.png"), # 5
        ("Mat_Veer_Hair", "hair_albedo.png", "hair_normal.png", "hair_mr.png", None),      # 6
        ("Mat_Veer_Eyes", "eyes_albedo.png", "eyes_normal.png", "eyes_mr.png", None),      # 7
        ("Mat_Veer_Tilak", "tilak_albedo.png", "tilak_normal.png", "tilak_mr.png", None),  # 8
    ]

    for name, alb, nrm, mr, em in mat_configs:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        mat.use_backface_culling = False # Ensure double-sided rendering for garments, ornaments, and hair
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        nodes.clear()

        out_node = nodes.new(type="ShaderNodeOutputMaterial")
        bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
        links.new(bsdf.outputs["BSDF"], out_node.inputs["Surface"])

        # Albedo
        alb_path = os.path.join(TEXTURE_DIR, alb)
        if os.path.exists(alb_path):
            img = bpy.data.images.load(alb_path)
            tex_node = nodes.new(type="ShaderNodeTexImage")
            tex_node.image = img
            links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])

        # Normal
        nrm_path = os.path.join(TEXTURE_DIR, nrm)
        if os.path.exists(nrm_path):
            img_n = bpy.data.images.load(nrm_path)
            img_n.colorspace_settings.name = "Non-Color"
            tex_n = nodes.new(type="ShaderNodeTexImage")
            tex_n.image = img_n
            nmap = nodes.new(type="ShaderNodeNormalMap")
            links.new(tex_n.outputs["Color"], nmap.inputs["Color"])
            links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])

        # Metallic / Roughness (G=Roughness, B=Metallic)
        mr_path = os.path.join(TEXTURE_DIR, mr)
        if os.path.exists(mr_path):
            img_mr = bpy.data.images.load(mr_path)
            img_mr.colorspace_settings.name = "Non-Color"
            tex_mr = nodes.new(type="ShaderNodeTexImage")
            tex_mr.image = img_mr
            sep = nodes.new(type="ShaderNodeSeparateColor")
            links.new(tex_mr.outputs["Color"], sep.inputs["Color"])
            links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])
            links.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])

        # Emissive
        if em:
            em_path = os.path.join(TEXTURE_DIR, em)
            if os.path.exists(em_path):
                img_em = bpy.data.images.load(em_path)
                tex_em = nodes.new(type="ShaderNodeTexImage")
                tex_em.image = img_em
                links.new(tex_em.outputs["Color"], bsdf.inputs["Emission Color"])
                bsdf.inputs["Emission Strength"].default_value = 2.0

        materials[name] = mat
    return materials

def main():
    print("=== Starting Mythos 3D Veer Character Reconstruction Pipeline (Aligned) ===")
    clear_scene()

    # 1. Setup Materials
    mats_dict = setup_materials()
    mat_list = [
        mats_dict["Mat_Veer_Skin"],    # 0
        mats_dict["Mat_Veer_Cuirass"], # 1
        mats_dict["Mat_Veer_Gold"],    # 2
        mats_dict["Mat_Veer_Dhoti"],   # 3
        mats_dict["Mat_Veer_Sash"],    # 4
        mats_dict["Mat_Veer_Khadga"],  # 5
        mats_dict["Mat_Veer_Hair"],    # 6
        mats_dict["Mat_Veer_Eyes"],    # 7
        mats_dict["Mat_Veer_Tilak"],   # 8
    ]

    # 2. Load Base Mesh & Eyes from CC0 bundle
    with bpy.data.libraries.load(BUNDLE_PATH) as (data_from, data_to):
        objs_to_load = ["GEO-body_male_realistic"]
        for eye in ["GEO-body_male_realistic.eye.R", "GEO-body_male_realistic.eye.L"]:
            if eye in data_from.objects:
                objs_to_load.append(eye)
        data_to.objects = objs_to_load

    body_obj = data_to.objects[0]
    bpy.context.collection.objects.link(body_obj)
    eyes = []
    for obj in data_to.objects[1:]:
        bpy.context.collection.objects.link(obj)
        eyes.append(obj)

    # CRITICAL FIX: Reset raw object location to (0, 0, 0) to remove the -2.26m lineup offset!
    body_obj.location = (0.0, 0.0, 0.0)
    body_obj.rotation_euler = (0.0, 0.0, 0.0)
    for eye in eyes:
        eye.location = (0.0, 0.0, 0.0)
        eye.rotation_euler = (0.0, 0.0, 0.0)

    # Scale to heroic 1.85m stature (scale factor 1.055)
    scale_factor = 1.055
    body_obj.scale = (scale_factor, scale_factor, scale_factor)
    bpy.ops.object.select_all(action='DESELECT')
    body_obj.select_set(True)
    bpy.context.view_layer.objects.active = body_obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    for eye in eyes:
        eye.scale = (scale_factor, scale_factor, scale_factor)
        eye.select_set(True)
        bpy.context.view_layer.objects.active = eye
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Place soles of feet exactly at Z = 0.0m
    min_z = min(v.co.z for v in body_obj.data.vertices)
    for v in body_obj.data.vertices:
        v.co.z -= min_z
    for eye in eyes:
        for v in eye.data.vertices:
            v.co.z -= min_z

    # Smart Project Body Mesh into unified 0..1 UV layout
    bpy.ops.object.select_all(action='DESELECT')
    body_obj.select_set(True)
    bpy.context.view_layer.objects.active = body_obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Assign materials to body and eyes
    for m in mat_list:
        body_obj.data.materials.append(m)
    for eye in eyes:
        for m in mat_list:
            eye.data.materials.append(m)
        if len(eye.data.materials) > 0:
            eye.data.materials[0] = mats_dict["Mat_Veer_Eyes"]
        bpy.ops.object.select_all(action='DESELECT')
        eye.select_set(True)
        bpy.context.view_layer.objects.active = eye
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02)
        bpy.ops.object.mode_set(mode='OBJECT')

    # 3. Create All 3D Vedic Pieces
    topknot_obj = geom.create_topknot_and_hair(mat_list)
    tripundra_obj = geom.create_forehead_tripundra(mat_list)
    dhoti_obj = geom.create_dhoti(mat_list)
    kamarband_obj = geom.create_kamarband_and_buckle(mat_list)
    bracers_obj = geom.create_kavacha_bracers(mat_list)
    greaves_obj = geom.create_greaves_and_sandals(mat_list)
    necklace_obj = geom.create_surya_necklace_and_armlets(mat_list)
    sash_obj = geom.create_uttariya(mat_list)
    scimitar_obj = geom.create_surya_kripana(mat_list)

    costume_objs = [
        topknot_obj, tripundra_obj, dhoti_obj, kamarband_obj, bracers_obj,
        greaves_obj, necklace_obj, sash_obj, scimitar_obj
    ]
    for c_obj in costume_objs:
        bpy.context.collection.objects.link(c_obj)
        # Apply UV unwrapping
        bpy.ops.object.select_all(action='DESELECT')
        c_obj.select_set(True)
        bpy.context.view_layer.objects.active = c_obj
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02)
        bpy.ops.object.mode_set(mode='OBJECT')
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    print("All 8 Vedic costume & weapon components created and UV unwrapped.")

    # 4. Join All Meshes into Unified VeerSkinnedHumanoidMesh in Rest Pose
    bpy.ops.object.select_all(action='DESELECT')
    for o in [body_obj] + eyes + costume_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = body_obj
    bpy.ops.object.join()
    body_obj.name = "VeerSkinnedHumanoidMesh"
    body_obj.data.name = "Veer_Humanoid_Mesh"

    # Shift entire unified character geometry so sandal soles rest precisely at Z = 0.0m on the ground
    min_mesh_z = min(v.co.z for v in body_obj.data.vertices)
    dz = -min_mesh_z # typically +0.024
    if abs(dz) > 1e-4:
        for v in body_obj.data.vertices:
            v.co.z += dz
        print(f"Shifted unified character mesh by dz = +{dz:.4f}m so bottom of sandals rests precisely at Z = 0.0m.")

    print(f"Unified mesh '{body_obj.name}' (data: '{body_obj.data.name}') compiled with {len(body_obj.data.vertices)} vertices across {len(body_obj.data.materials)} material slots.")

    # 5. Build 24-bone Armature in exact Rest Pose
    arm_data = bpy.data.armatures.new("VeerArmature")
    arm_obj = bpy.data.objects.new("Veer", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    ebones = arm_data.edit_bones

    def make_bone(name, head, tail, parent_name=None):
        b = ebones.new(name)
        if name != "root":
            b.head = (head[0], head[1], head[2] + dz)
            b.tail = (tail[0], tail[1], tail[2] + dz)
        else:
            b.head = head
            b.tail = tail
        if parent_name and parent_name in ebones:
            b.parent = ebones[parent_name]
        return b

    # 24 bones matching anatomy
    make_bone("root", (0, 0, 0), (0, 0, 0.2))
    make_bone("pelvis", (0, 0, 0.94), (0, 0, 1.04), "root")
    make_bone("spine_01", (0, 0, 1.04), (0, 0, 1.18), "pelvis")
    make_bone("chest", (0, 0, 1.18), (0, 0, 1.45), "spine_01")
    make_bone("neck", (0, 0, 1.45), (0, 0, 1.54), "chest")
    make_bone("head", (0, 0, 1.54), (0, 0, 1.74), "neck")
    make_bone("topknot", (0, -0.035, 1.78), (0, -0.05, 1.88), "head")

    # Left arm
    make_bone("shoulder_l", (0.05, 0, 1.40), (0.18, 0, 1.38), "chest")
    make_bone("arm_l", (0.18, 0, 1.38), (0.29, 0, 1.14), "shoulder_l")
    make_bone("forearm_l", (0.29, 0, 1.14), (0.42, -0.08, 0.85), "arm_l")
    make_bone("hand_l", (0.42, -0.08, 0.85), (0.46, -0.11, 0.74), "forearm_l")

    # Right arm
    make_bone("shoulder_r", (-0.05, 0, 1.40), (-0.18, 0, 1.38), "chest")
    make_bone("arm_r", (-0.18, 0, 1.38), (-0.29, 0, 1.14), "shoulder_r")
    make_bone("forearm_r", (-0.29, 0, 1.14), (-0.42, -0.08, 0.85), "arm_r")
    make_bone("hand_r", (-0.42, -0.08, 0.85), (-0.46, -0.11, 0.74), "forearm_r")
    make_bone("socket_right_hand", (-0.46, -0.11, 0.74), (-0.48, -0.13, 0.68), "hand_r")

    # Left leg
    make_bone("thigh_l", (0.11, 0, 0.90), (0.14, 0.01, 0.50), "pelvis")
    make_bone("shin_l", (0.14, 0.01, 0.50), (0.19, 0.035, 0.12), "thigh_l")
    make_bone("foot_l", (0.19, 0.035, 0.12), (0.215, -0.12, 0.02), "shin_l")

    # Right leg
    make_bone("thigh_r", (-0.11, 0, 0.90), (-0.14, 0.01, 0.50), "pelvis")
    make_bone("shin_r", (-0.14, 0.01, 0.50), (-0.19, 0.035, 0.12), "thigh_r")
    make_bone("foot_r", (-0.19, 0.035, 0.12), (-0.215, -0.12, 0.02), "shin_r")

    # Sash
    make_bone("sash_01", (0.0, -0.12, 0.94), (0.08, -0.15, 0.68), "pelvis")
    make_bone("sash_02", (0.08, -0.15, 0.68), (0.12, -0.18, 0.38), "sash_01")

    bpy.ops.object.mode_set(mode='OBJECT')
    print("Armature built with 24 bones in Rest Pose.")

    # 6. Apply 3D Heat Diffusion Auto Skin Weights to the Entire Unified Mesh
    bpy.ops.object.select_all(action='DESELECT')
    body_obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    print("Entire unified character mesh successfully auto-weighted to 24 bones!")

    # 7. Lock Surya-Kripana Scimitar rigidly to socket_right_hand
    # Vertices belonging to Mat_Veer_Khadga (slot 5)
    khadga_v_indices = set()
    for p in body_obj.data.polygons:
        if p.material_index == 5: # Mat_Veer_Khadga
            for v_idx in p.vertices:
                khadga_v_indices.add(v_idx)

    # Clear other bone weights from scimitar and assign 100% to socket_right_hand and hand_r
    for vg in body_obj.vertex_groups:
        if vg.name not in ["socket_right_hand", "hand_r"]:
            for v_idx in khadga_v_indices:
                try:
                    vg.remove([v_idx])
                except:
                    pass

    vg_socket = body_obj.vertex_groups.get("socket_right_hand")
    if not vg_socket:
        vg_socket = body_obj.vertex_groups.new(name="socket_right_hand")
    vg_hand = body_obj.vertex_groups.get("hand_r")
    if not vg_hand:
        vg_hand = body_obj.vertex_groups.new(name="hand_r")

    for v_idx in khadga_v_indices:
        vg_socket.add([v_idx], 1.0, 'REPLACE')
        vg_hand.add([v_idx], 0.4, 'REPLACE')

    print(f"Surya-Kripana scimitar ({len(khadga_v_indices)} vertices) rigidly bound to socket_right_hand.")

    # 7b. Lock Paduka sandals and foot vertices to foot_l and foot_r (eliminate any root bone pinning)
    vg_root = body_obj.vertex_groups.get("root")
    vg_foot_l = body_obj.vertex_groups.get("foot_l")
    vg_foot_r = body_obj.vertex_groups.get("foot_r")

    sandal_foot_count = 0
    for v in body_obj.data.vertices:
        if v.co.z < 0.11:
            if vg_root:
                try:
                    vg_root.remove([v.index])
                except:
                    pass
            if v.co.x > 0.0:
                if vg_foot_l:
                    vg_foot_l.add([v.index], 1.0, 'REPLACE')
                    sandal_foot_count += 1
            else:
                if vg_foot_r:
                    vg_foot_r.add([v.index], 1.0, 'REPLACE')
                    sandal_foot_count += 1
        elif v.co.z < 0.48:
            if vg_root:
                try:
                    vg_root.remove([v.index])
                except:
                    pass

    print(f"Paduka sandals and feet ({sandal_foot_count} vertices) locked to foot_l & foot_r with zero root pinning.")
    if arm_obj.animation_data is None:
        arm_obj.animation_data_create()

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

    def add_anim(name, duration, keyframes_dict):
        act = bpy.data.actions.new(name=name)
        arm_obj.animation_data.action = act
        fps = 30.0
        for bone_name, kfs in keyframes_dict.items():
            if bone_name not in arm_obj.pose.bones:
                continue
            pb = arm_obj.pose.bones[bone_name]
            pb.rotation_mode = 'QUATERNION'
            for time_s, q_val in kfs:
                frame = 1 + time_s * fps
                pb.rotation_quaternion = q_val
                pb.keyframe_insert(data_path="rotation_quaternion", frame=frame)

        track = arm_obj.animation_data.nla_tracks.new()
        track.name = name
        track.strips.new(name, 1, act)

    # 1. Idle (2.4s)
    idle_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.6, euler_to_quat(math.radians(3.5), 0.0, 0.0)),
            (1.2, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
            (1.8, euler_to_quat(math.radians(2.5), 0.0, 0.0)),
            (2.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "head": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (1.2, euler_to_quat(math.radians(-2.5), math.radians(2.0), 0.0)),
            (2.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(math.radians(6.0), 0.0, math.radians(6.0))),
            (1.2, euler_to_quat(math.radians(8.0), 0.0, math.radians(8.0))),
            (2.4, euler_to_quat(math.radians(6.0), 0.0, math.radians(6.0))),
        ],
        "forearm_l": [
            (0.0, euler_to_quat(math.radians(14.0), math.radians(6.0), 0.0)),
            (1.2, euler_to_quat(math.radians(18.0), math.radians(8.0), 0.0)),
            (2.4, euler_to_quat(math.radians(14.0), math.radians(6.0), 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(6.0), 0.0, math.radians(-6.0))),
            (1.2, euler_to_quat(math.radians(8.0), 0.0, math.radians(-8.0))),
            (2.4, euler_to_quat(math.radians(6.0), 0.0, math.radians(-6.0))),
        ],
        "forearm_r": [
            (0.0, euler_to_quat(math.radians(14.0), math.radians(-6.0), 0.0)),
            (1.2, euler_to_quat(math.radians(18.0), math.radians(-8.0), 0.0)),
            (2.4, euler_to_quat(math.radians(14.0), math.radians(-6.0), 0.0)),
        ],
        "sash_01": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (1.2, euler_to_quat(math.radians(4.0), math.radians(3.0), 0.0)),
            (2.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("idle", 2.4, idle_kfs)

    # 2. Walk (1.0s)
    walk_kfs = {
        "thigh_l": [
            (0.0, euler_to_quat(math.radians(-25.0), 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(0.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(-25.0), 0.0, 0.0)),
        ],
        "shin_l": [
            (0.0, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(40.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(-25.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(0.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
        ],
        "shin_r": [
            (0.0, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(40.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
        ],
        "spine_01": [
            (0.0, euler_to_quat(math.radians(3.0), math.radians(4.0), 0.0)),
            (0.5, euler_to_quat(math.radians(3.0), math.radians(-4.0), 0.0)),
            (1.0, euler_to_quat(math.radians(3.0), math.radians(4.0), 0.0)),
        ],
    }
    add_anim("walk", 1.0, walk_kfs)

    # 2b. Walk Backward (1.0s)
    walk_bwd_kfs = {
        "thigh_l": [
            (0.0, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
        ],
        "shin_l": [
            (0.0, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
        ],
        "shin_r": [
            (0.0, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(math.radians(-15.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(-15.0), 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(-15.0), 0.0, 0.0)),
            (1.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        ],
    }
    add_anim("walk_backward", 1.0, walk_bwd_kfs)

    # 2c. Strafe Left (0.8s)
    strafe_l_kfs = {
        "pelvis": [
            (0.0, euler_to_quat(0.0, 0.0, math.radians(-3.0))),
            (0.4, euler_to_quat(0.0, 0.0, math.radians(3.0))),
            (0.8, euler_to_quat(0.0, 0.0, math.radians(-3.0))),
        ],
        "thigh_l": [
            (0.0, euler_to_quat(0.0, 0.0, math.radians(-12.0))),
            (0.4, euler_to_quat(0.0, 0.0, math.radians(4.0))),
            (0.8, euler_to_quat(0.0, 0.0, math.radians(-12.0))),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(0.0, 0.0, math.radians(-4.0))),
            (0.4, euler_to_quat(0.0, 0.0, math.radians(12.0))),
            (0.8, euler_to_quat(0.0, 0.0, math.radians(-4.0))),
        ],
    }
    add_anim("strafe_left", 0.8, strafe_l_kfs)

    # 2d. Strafe Right (0.8s)
    strafe_r_kfs = {
        "pelvis": [
            (0.0, euler_to_quat(0.0, 0.0, math.radians(3.0))),
            (0.4, euler_to_quat(0.0, 0.0, math.radians(-3.0))),
            (0.8, euler_to_quat(0.0, 0.0, math.radians(3.0))),
        ],
        "thigh_l": [
            (0.0, euler_to_quat(0.0, 0.0, math.radians(4.0))),
            (0.4, euler_to_quat(0.0, 0.0, math.radians(-12.0))),
            (0.8, euler_to_quat(0.0, 0.0, math.radians(4.0))),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(0.0, 0.0, math.radians(12.0))),
            (0.4, euler_to_quat(0.0, 0.0, math.radians(-4.0))),
            (0.8, euler_to_quat(0.0, 0.0, math.radians(12.0))),
        ],
    }
    add_anim("strafe_right", 0.8, strafe_r_kfs)

    # 3. Run & Jog (0.75s)
    run_kfs = {
        "thigh_l": [
            (0.0, euler_to_quat(math.radians(-40.0), 0.0, 0.0)),
            (0.375, euler_to_quat(math.radians(42.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(-40.0), 0.0, 0.0)),
        ],
        "shin_l": [
            (0.0, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
            (0.375, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
            (0.5625, euler_to_quat(math.radians(65.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(math.radians(42.0), 0.0, 0.0)),
            (0.375, euler_to_quat(math.radians(-40.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(42.0), 0.0, 0.0)),
        ],
        "shin_r": [
            (0.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
            (0.1875, euler_to_quat(math.radians(65.0), 0.0, 0.0)),
            (0.375, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
            (0.375, euler_to_quat(math.radians(-30.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(-30.0), 0.0, 0.0)),
            (0.375, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(-30.0), 0.0, 0.0)),
        ],
        "spine_01": [
            (0.0, euler_to_quat(math.radians(8.0), math.radians(5.0), 0.0)),
            (0.375, euler_to_quat(math.radians(8.0), math.radians(-5.0), 0.0)),
            (0.75, euler_to_quat(math.radians(8.0), math.radians(5.0), 0.0)),
        ],
    }
    add_anim("run", 0.75, run_kfs)
    add_anim("jog", 0.75, run_kfs)

    # 4. Sprint (0.55s)
    sprint_kfs = {
        "thigh_l": [
            (0.0, euler_to_quat(math.radians(-50.0), 0.0, 0.0)),
            (0.275, euler_to_quat(math.radians(55.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(-50.0), 0.0, 0.0)),
        ],
        "shin_l": [
            (0.0, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
            (0.275, euler_to_quat(math.radians(75.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(math.radians(55.0), 0.0, 0.0)),
            (0.275, euler_to_quat(math.radians(-50.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(55.0), 0.0, 0.0)),
        ],
        "shin_r": [
            (0.0, euler_to_quat(math.radians(75.0), 0.0, 0.0)),
            (0.275, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(75.0), 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(math.radians(40.0), 0.0, 0.0)),
            (0.275, euler_to_quat(math.radians(-40.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(40.0), 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(-40.0), 0.0, 0.0)),
            (0.275, euler_to_quat(math.radians(40.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(-40.0), 0.0, 0.0)),
        ],
        "chest": [
            (0.0, euler_to_quat(math.radians(14.0), 0.0, 0.0)),
            (0.55, euler_to_quat(math.radians(14.0), 0.0, 0.0)),
        ],
    }
    add_anim("sprint", 0.55, sprint_kfs)

    # 5. Turn (0.6s)
    turn_kfs = {
        "pelvis": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.3, euler_to_quat(0.0, math.radians(45.0), 0.0)),
            (0.6, euler_to_quat(0.0, math.radians(90.0), 0.0)),
        ],
    }
    add_anim("turn", 0.6, turn_kfs)

    # 6. Jump (0.75s) & Jump Start
    jump_kfs = {
        "chest": [
            (0.0, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
            (0.25, euler_to_quat(math.radians(-6.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(-4.0), 0.0, 0.0)),
        ],
        "thigh_l": [
            (0.0, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
            (0.75, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        ],
    }
    add_anim("jump", 0.75, jump_kfs)
    add_anim("jump_start", 0.3, jump_kfs)

    # 7. Fall & Jump Fall (0.6s)
    fall_kfs = {
        "chest": [(0.0, euler_to_quat(math.radians(4.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(6.0), 0.0, 0.0))],
        "thigh_l": [(0.0, euler_to_quat(math.radians(-12.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(-8.0), 0.0, 0.0))],
        "thigh_r": [(0.0, euler_to_quat(math.radians(12.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(8.0), 0.0, 0.0))],
    }
    add_anim("fall", 0.6, fall_kfs)
    add_anim("jump_fall", 0.6, fall_kfs)

    # 8. Landing & Jump Land (0.4s)
    land_kfs = {
        "pelvis": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.15, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
            (0.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "thigh_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.15, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
            (0.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.15, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
            (0.4, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("landing", 0.4, land_kfs)
    add_anim("jump_land", 0.4, land_kfs)

    # 9. Dodge (0.65s)
    dodge_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.2, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
            (0.65, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("dodge", 0.65, dodge_kfs)

    # 10. Block (0.5s)
    block_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.2, euler_to_quat(math.radians(8.0), math.radians(-15.0), 0.0)),
            (0.5, euler_to_quat(math.radians(8.0), math.radians(-15.0), 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.2, euler_to_quat(math.radians(-35.0), math.radians(-35.0), math.radians(25.0))),
            (0.5, euler_to_quat(math.radians(-35.0), math.radians(-35.0), math.radians(25.0))),
        ],
        "arm_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.2, euler_to_quat(math.radians(25.0), math.radians(25.0), math.radians(-25.0))),
            (0.5, euler_to_quat(math.radians(25.0), math.radians(25.0), math.radians(-25.0))),
        ],
    }
    add_anim("block", 0.5, block_kfs)

    # 11. Parry (0.45s)
    parry_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.15, euler_to_quat(math.radians(-5.0), math.radians(20.0), 0.0)),
            (0.45, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.12, euler_to_quat(math.radians(-50.0), math.radians(35.0), math.radians(20.0))),
            (0.45, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("parry", 0.45, parry_kfs)

    # 12. Attack Light 1 (0.6s)
    atk1_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.12, euler_to_quat(math.radians(-10.0), math.radians(25.0), 0.0)),
            (0.28, euler_to_quat(math.radians(8.0), math.radians(-35.0), math.radians(-5.0))),
            (0.48, euler_to_quat(math.radians(2.0), math.radians(-10.0), 0.0)),
            (0.60, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.12, euler_to_quat(math.radians(35.0), math.radians(-25.0), math.radians(35.0))),
            (0.28, euler_to_quat(math.radians(-75.0), math.radians(25.0), math.radians(-30.0))),
            (0.48, euler_to_quat(math.radians(-20.0), math.radians(10.0), 0.0)),
            (0.60, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "forearm_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.12, euler_to_quat(math.radians(20.0), math.radians(-15.0), 0.0)),
            (0.28, euler_to_quat(math.radians(-45.0), math.radians(-30.0), 0.0)),
            (0.48, euler_to_quat(math.radians(-10.0), 0.0, 0.0)),
            (0.60, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.12, euler_to_quat(math.radians(-20.0), math.radians(15.0), 0.0)),
            (0.28, euler_to_quat(math.radians(45.0), math.radians(-25.0), math.radians(25.0))),
            (0.60, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "thigh_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.28, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
            (0.60, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "thigh_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.28, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
            (0.60, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("attack_light_1", 0.6, atk1_kfs)

    # 13. Attack Light 2 (0.6s)
    atk2_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, math.radians(-30.0), 0.0)),
            (0.2, euler_to_quat(math.radians(-8.0), math.radians(30.0), 0.0)),
            (0.6, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(math.radians(10.0), math.radians(45.0), 0.0)),
            (0.2, euler_to_quat(math.radians(-50.0), math.radians(-30.0), math.radians(20.0))),
            (0.6, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("attack_light_2", 0.6, atk2_kfs)

    # 14. Attack Heavy Finisher & Combo (1.0s)
    finisher_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.35, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
            (0.65, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
            (1.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.35, euler_to_quat(math.radians(-85.0), 0.0, math.radians(10.0))),
            (0.65, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
            (1.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("attack_heavy_finisher", 1.0, finisher_kfs)
    add_anim("combo", 1.0, finisher_kfs)

    # 15. Hit Reaction (0.5s)
    hit_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.12, euler_to_quat(math.radians(-16.0), math.radians(10.0), 0.0)),
            (0.5, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "head": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.12, euler_to_quat(math.radians(-14.0), 0.0, 0.0)),
            (0.5, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("hit_reaction", 0.5, hit_kfs)

    # 16. Interact (1.0s)
    interact_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.4, euler_to_quat(math.radians(14.0), 0.0, 0.0)),
            (1.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_l": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.4, euler_to_quat(math.radians(-45.0), math.radians(-10.0), 0.0)),
            (1.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("interact", 1.0, interact_kfs)

    # 17. Victory (2.0s)
    victory_kfs = {
        "chest": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(-10.0), 0.0, 0.0)),
            (2.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
        "arm_r": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.5, euler_to_quat(math.radians(-90.0), 0.0, math.radians(10.0))),
            (2.0, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("victory", 2.0, victory_kfs)

    # 18. Defeat (1.8s)
    defeat_kfs = {
        "pelvis": [
            (0.0, euler_to_quat(0.0, 0.0, 0.0)),
            (0.8, euler_to_quat(math.radians(-10.0), 0.0, 0.0)),
            (1.8, euler_to_quat(0.0, 0.0, 0.0)),
        ],
    }
    add_anim("defeat", 1.8, defeat_kfs)

    # CRITICAL: Reset pose to Rest Pose before saving/exporting!
    arm_obj.animation_data.action = None
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.transforms_clear()
    bpy.ops.object.mode_set(mode='OBJECT')

    print("22 skeletal animation tracks authored and Armature reset to clean REST POSE.")

    # 9. Save Editable Source Blend File
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
    print(f"Editable source blend file saved to: {OUTPUT_BLEND}")

    # 10. Export Production GLB File
    bpy.ops.object.select_all(action='DESELECT')
    arm_obj.select_set(True)
    body_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format='GLB',
        use_selection=True,
        export_animations=True,
        export_animation_mode='ACTIONS',
        export_force_sampling=False,
        export_skins=True,
        export_morph=False,
        export_apply=False
    )
    print(f"Production GLB exported to: {OUTPUT_GLB} ({os.path.getsize(OUTPUT_GLB)} bytes)")
    print("=== Production Veer Pipeline Complete! ===")

if __name__ == "__main__":
    main()
