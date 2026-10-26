"""
Mythos 3D - Bhumi Combat Actors Blender Pipeline
Generates authentic, high-fidelity 3D rigged & animated models:
1. Asura Warrior (1.95m demonic humanoid soldier with horned brow, spiked obsidian armor, curved scythe, 22-bone skeleton, 7 authored actions)
2. General Kalanemi (2.85m monumental 4-armed Asura Warlord with quad-horned crown, molten Tamas chest core, dual heavy cleavers, 28-bone skeleton, 10 authored actions)
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

def create_pbr_material(name, alb_name, norm_name=None, mr_name=None, em_name=None):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out_node = nodes.new(type="ShaderNodeOutputMaterial")
    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    links.new(bsdf.outputs["BSDF"], out_node.inputs["Surface"])

    # Albedo
    alb_path = os.path.join(TEXTURE_DIR, alb_name)
    if os.path.exists(alb_path):
        img_alb = bpy.data.images.load(alb_path)
        tex_alb = nodes.new(type="ShaderNodeTexImage")
        tex_alb.image = img_alb
        links.new(tex_alb.outputs["Color"], bsdf.inputs["Base Color"])

    # Normal
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

    # Metallic / Roughness (G=Roughness, B=Metallic)
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

    # Emissive
    if em_name:
        em_path = os.path.join(TEXTURE_DIR, em_name)
        if os.path.exists(em_path):
            img_em = bpy.data.images.load(em_path)
            tex_em = nodes.new(type="ShaderNodeTexImage")
            tex_em.image = img_em
            links.new(tex_em.outputs["Color"], bsdf.inputs["Emission Color"])
            bsdf.inputs["Emission Strength"].default_value = 2.5

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

    # Push to NLA Track
    track = arm_obj.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, 1, act)
    strip.action = act
    strip.use_auto_blend = True
    return act

def smart_uv_unwrap_object(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    print('UNWRAPPING:', obj.name, 'ACTIVE:', bpy.context.view_layer.objects.active.name, 'POLL:', bpy.ops.uv.smart_project.poll())
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# =========================================================================
# 1. BUILD ASURA WARRIOR
# =========================================================================
def build_asura_warrior():
    print("=== Building Production 3D Asura Warrior ===")
    clear_scene()

    # Materials
    mat_skin = create_pbr_material("Mat_Asura_Skin", "asura_skin_albedo.png", "asura_skin_normal.png", "asura_skin_mr.png", "asura_skin_emissive.png")
    mat_armor = create_pbr_material("Mat_Asura_Armor", "asura_armor_albedo.png", "asura_armor_normal.png", "asura_armor_mr.png")
    mat_wep = create_pbr_material("Mat_Asura_Weapon", "asura_weapon_albedo.png", "asura_weapon_normal.png", "asura_weapon_mr.png", "asura_weapon_emissive.png")

    # 1. Load male body mesh from bundle
    with bpy.data.libraries.load(BUNDLE_PATH) as (data_from, data_to):
        if "GEO-body_male_realistic" in data_from.objects:
            data_to.objects = ["GEO-body_male_realistic"]
    
    body_obj = data_to.objects[0]
    bpy.context.collection.objects.link(body_obj)
    bpy.context.view_layer.objects.active = body_obj
    body_obj.select_set(True)

    # Reset position to origin and apply transform
    body_obj.location = (0, 0, 0)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Scale and center to 1.95m tall
    # Calculate current height
    min_z = min(v.co.z for v in body_obj.data.vertices)
    max_z = max(v.co.z for v in body_obj.data.vertices)
    curr_h = max_z - min_z
    scale_fac = 1.95 / curr_h
    body_obj.scale = (scale_fac * 1.08, scale_fac * 1.05, scale_fac) # Broad muscular demonic build
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Center feet at Z=0, X=0, Y=0
    min_z = min(v.co.z for v in body_obj.data.vertices)
    for v in body_obj.data.vertices:
        v.co.z -= min_z

    body_obj.data.materials.clear()
    body_obj.data.materials.append(mat_skin)

    # 2. Add Demonic Curved Brow Horns
    mesh_horns = bpy.data.meshes.new("AsuraHorns")
    bm_horns = bmesh.new()
    for side in [-1, 1]:
        # Tapered curved horn
        steps = 10
        prev_ring = []
        for i in range(steps):
            t = i / float(steps - 1)
            # Horn curve up and back
            cz = 1.84 + t * 0.22 - (t**2)*0.04
            cy = -0.06 - t * 0.18
            cx = side * (0.09 + t * 0.12)
            r = (1.0 - t * 0.85) * 0.038
            ring_verts = []
            for seg in range(8):
                ang = seg * (2 * math.pi / 8)
                vx = cx + math.cos(ang) * r
                vy = cy + math.sin(ang) * r * 0.8
                vz = cz
                ring_verts.append(bm_horns.verts.new((vx, vy, vz)))
            if prev_ring:
                for seg in range(8):
                    next_seg = (seg + 1) % 8
                    bm_horns.faces.new([prev_ring[seg], prev_ring[next_seg], ring_verts[next_seg], ring_verts[seg]])
            else:
                # Cap base
                bm_horns.faces.new(ring_verts)
            prev_ring = ring_verts
        # Cap tip
        bm_horns.faces.new(list(reversed(prev_ring)))

    bm_horns.to_mesh(mesh_horns)
    bm_horns.free()
    horns_obj = bpy.data.objects.new("AsuraHorns", mesh_horns)
    horns_obj.data.materials.append(mat_armor)
    bpy.context.collection.objects.link(horns_obj)

    # 3. Add Spiked Shoulder Pauldrons
    mesh_pauldrons = bpy.data.meshes.new("AsuraPauldrons")
    bm_p = bmesh.new()
    for side in [-1, 1]:
        # Curved shoulder plate with 2 sharp spikes
        px = side * 0.32
        py = 0.0
        pz = 1.50
        plate = bmesh.ops.create_cube(bm_p, size=0.18)
        for v in plate['verts']:
            v.co.x = v.co.x * 1.1 + px
            v.co.y = v.co.y * 1.4 + py
            v.co.z = v.co.z * 0.6 + pz
        # Spike 1 pointing up/out
        cone1 = bmesh.ops.create_cone(bm_p, cap_ends=True, segments=12, radius1=0.045, radius2=0.005, depth=0.20)
        for v in cone1['verts']:
            v.co.x += px + side * 0.06
            v.co.y += py - 0.02
            v.co.z += pz + 0.14
        # Spike 2 pointing back/out
        cone2 = bmesh.ops.create_cone(bm_p, cap_ends=True, segments=12, radius1=0.035, radius2=0.004, depth=0.16)
        for v in cone2['verts']:
            v.co.x += px + side * 0.08
            v.co.y += py + 0.06
            v.co.z += pz + 0.10

    bm_p.to_mesh(mesh_pauldrons)
    bm_p.free()
    pauldrons_obj = bpy.data.objects.new("AsuraPauldrons", mesh_pauldrons)
    pauldrons_obj.data.materials.append(mat_armor)
    bpy.context.collection.objects.link(pauldrons_obj)

    # 4. Add Armored War Kilt & Belt
    mesh_kilt = bpy.data.meshes.new("AsuraKilt")
    bm_k = bmesh.new()
    # Cylinder belt around waist
    bmesh.ops.create_cone(bm_k, cap_ends=False, segments=16, radius1=0.28, radius2=0.34, depth=0.38)
    for v in bm_k.verts:
        v.co.z += 0.95
        v.co.y *= 0.85
    bm_k.to_mesh(mesh_kilt)
    bm_k.free()
    kilt_obj = bpy.data.objects.new("AsuraKilt", mesh_kilt)
    kilt_obj.data.materials.append(mat_armor)
    bpy.context.collection.objects.link(kilt_obj)

    # 5. Add Serrated Scythe / Scimitar Weapon
    mesh_wep = bpy.data.meshes.new("AsuraScythe")
    bm_w = bmesh.new()
    # Haft / Hilt in right hand
    hx = -0.52
    hy = -0.10
    hz = 0.85
    bmesh.ops.create_cube(bm_w, size=0.04)
    for v in bm_w.verts:
        v.co.x = v.co.x * 0.7 + hx
        v.co.y = v.co.y * 0.7 + hy
        v.co.z = v.co.z * 18.0 + hz + 0.15 # 0.72m shaft
    # Curved blade extending forward/down
    prev_b = []
    for i in range(8):
        t = i / 7.0
        bx = hx + t * 0.08
        by = hy - 0.05 - math.sin(t * math.pi * 0.8) * 0.32
        bz = hz + 0.50 + t * 0.15
        verts = [
            bm_w.verts.new((bx - 0.015, by, bz)),
            bm_w.verts.new((bx + 0.015, by, bz)),
            bm_w.verts.new((bx, by - 0.08, bz - 0.02)) # cutting edge
        ]
        if prev_b:
            bm_w.faces.new([prev_b[0], prev_b[1], verts[1], verts[0]])
            bm_w.faces.new([prev_b[1], prev_b[2], verts[2], verts[1]])
            bm_w.faces.new([prev_b[2], prev_b[0], verts[0], verts[2]])
        prev_b = verts

    bm_w.to_mesh(mesh_wep)
    bm_w.free()
    wep_obj = bpy.data.objects.new("AsuraScythe", mesh_wep)
    wep_obj.data.materials.append(mat_wep)
    bpy.context.collection.objects.link(wep_obj)

    # UV unwrap props
    for obj in [horns_obj, pauldrons_obj, kilt_obj, wep_obj]:
        smart_uv_unwrap_object(obj)

    # 6. Build 22-bone Armature
    arm_data = bpy.data.armatures.new("AsuraArmature")
    arm_obj = bpy.data.objects.new("AsuraWarriorRig", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    ebones = arm_data.edit_bones

    def make_b(name, head, tail, parent_name=None):
        b = ebones.new(name)
        b.head = head
        b.tail = tail
        if parent_name and parent_name in ebones:
            b.parent = ebones[parent_name]
        return b

    make_b("root", (0, 0, 0), (0, 0, 0.2))
    make_b("pelvis", (0, 0, 1.0), (0, 0, 1.1), "root")
    make_b("spine_01", (0, 0, 1.1), (0, 0, 1.25), "pelvis")
    make_b("chest", (0, 0, 1.25), (0, 0, 1.55), "spine_01")
    make_b("neck", (0, 0, 1.55), (0, 0, 1.65), "chest")
    make_b("head", (0, 0, 1.65), (0, 0, 1.90), "neck")
    make_b("horn_l", (0.1, -0.05, 1.85), (0.22, -0.15, 2.05), "head")
    make_b("horn_r", (-0.1, -0.05, 1.85), (-0.22, -0.15, 2.05), "head")

    # Left arm
    make_b("shoulder_l", (0.08, 0, 1.50), (0.24, 0, 1.48), "chest")
    make_b("arm_l", (0.24, 0, 1.48), (0.38, 0, 1.18), "shoulder_l")
    make_b("forearm_l", (0.38, 0, 1.18), (0.48, -0.08, 0.88), "arm_l")
    make_b("hand_l", (0.48, -0.08, 0.88), (0.54, -0.12, 0.76), "forearm_l")

    # Right arm & weapon socket
    make_b("shoulder_r", (-0.08, 0, 1.50), (-0.24, 0, 1.48), "chest")
    make_b("arm_r", (-0.24, 0, 1.48), (-0.38, 0, 1.18), "shoulder_r")
    make_b("forearm_r", (-0.38, 0, 1.18), (-0.48, -0.08, 0.88), "arm_r")
    make_b("hand_r", (-0.48, -0.08, 0.88), (-0.54, -0.12, 0.76), "forearm_r")
    make_b("weapon_r", (-0.54, -0.12, 0.76), (-0.58, -0.16, 0.66), "hand_r")

    # Left leg
    make_b("thigh_l", (0.14, 0, 0.95), (0.16, 0.02, 0.52), "pelvis")
    make_b("shin_l", (0.16, 0.02, 0.52), (0.18, 0.06, 0.12), "thigh_l")
    make_b("foot_l", (0.18, 0.06, 0.12), (0.18, -0.15, 0.02), "shin_l")

    # Right leg
    make_b("thigh_r", (-0.14, 0, 0.95), (-0.16, 0.02, 0.52), "pelvis")
    make_b("shin_r", (-0.16, 0.02, 0.52), (-0.18, 0.06, 0.12), "thigh_r")
    make_b("foot_r", (-0.18, 0.06, 0.12), (-0.18, -0.15, 0.02), "shin_r")

    bpy.ops.object.mode_set(mode='OBJECT')

    # Skin weights parent for body mesh
    bpy.ops.object.select_all(action='DESELECT')
    body_obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')

    # Assign rigid skinning vertex groups to accessories
    vg_h = horns_obj.vertex_groups.new(name="head")
    vg_h.add(list(range(len(horns_obj.data.vertices))), 1.0, 'REPLACE')

    vg_p_l = pauldrons_obj.vertex_groups.new(name="shoulder_l")
    vg_p_r = pauldrons_obj.vertex_groups.new(name="shoulder_r")
    for i, v in enumerate(pauldrons_obj.data.vertices):
        if v.co.x > 0:
            vg_p_l.add([i], 1.0, 'REPLACE')
        else:
            vg_p_r.add([i], 1.0, 'REPLACE')

    vg_k = kilt_obj.vertex_groups.new(name="pelvis")
    vg_k.add(list(range(len(kilt_obj.data.vertices))), 1.0, 'REPLACE')

    vg_w = wep_obj.vertex_groups.new(name="weapon_r")
    vg_w.add(list(range(len(wep_obj.data.vertices))), 1.0, 'REPLACE')

    # Now join accessories into unified mesh
    bpy.ops.object.select_all(action='DESELECT')
    for obj in [body_obj, horns_obj, pauldrons_obj, kilt_obj, wep_obj]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = body_obj
    bpy.ops.object.join()
    body_obj.name = "AsuraWarrior_Mesh"

    # 7. Author 7 High-Fidelity Skeletal Animations
    print("Authoring 7 skeletal actions for Asura Warrior...")

    # Action 1: idle (2.0s)
    add_action(arm_obj, "idle", 2.0, {
        "chest": [(0.0, euler_to_quat(0.04, 0.0, 0.0)), (1.0, euler_to_quat(-0.02, 0.0, 0.0)), (2.0, euler_to_quat(0.04, 0.0, 0.0))],
        "head": [(0.0, euler_to_quat(0.0, -0.06, 0.0)), (1.0, euler_to_quat(0.0, 0.06, 0.0)), (2.0, euler_to_quat(0.0, -0.06, 0.0))],
        "arm_r": [(0.0, euler_to_quat(-0.10, 0.0, -0.15)), (1.0, euler_to_quat(-0.16, 0.0, -0.12)), (2.0, euler_to_quat(-0.10, 0.0, -0.15))],
        "forearm_r": [(0.0, euler_to_quat(0.35, 0.0, 0.0)), (1.0, euler_to_quat(0.42, 0.0, 0.0)), (2.0, euler_to_quat(0.35, 0.0, 0.0))],
        "arm_l": [(0.0, euler_to_quat(0.08, 0.0, 0.12)), (1.0, euler_to_quat(0.04, 0.0, 0.10)), (2.0, euler_to_quat(0.08, 0.0, 0.12))],
    })

    # Action 2: walk (1.2s)
    add_action(arm_obj, "walk", 1.2, {
        "chest": [(0.0, euler_to_quat(0.05, 0.08, 0.0)), (0.6, euler_to_quat(0.05, -0.08, 0.0)), (1.2, euler_to_quat(0.05, 0.08, 0.0))],
        "thigh_l": [(0.0, euler_to_quat(0.38, 0.0, 0.0)), (0.6, euler_to_quat(-0.32, 0.0, 0.0)), (1.2, euler_to_quat(0.38, 0.0, 0.0))],
        "shin_l": [(0.0, euler_to_quat(-0.25, 0.0, 0.0)), (0.3, euler_to_quat(0.45, 0.0, 0.0)), (0.6, euler_to_quat(0.05, 0.0, 0.0)), (1.2, euler_to_quat(-0.25, 0.0, 0.0))],
        "thigh_r": [(0.0, euler_to_quat(-0.32, 0.0, 0.0)), (0.6, euler_to_quat(0.38, 0.0, 0.0)), (1.2, euler_to_quat(-0.32, 0.0, 0.0))],
        "shin_r": [(0.0, euler_to_quat(0.05, 0.0, 0.0)), (0.6, euler_to_quat(-0.25, 0.0, 0.0)), (0.9, euler_to_quat(0.45, 0.0, 0.0)), (1.2, euler_to_quat(0.05, 0.0, 0.0))],
        "arm_r": [(0.0, euler_to_quat(-0.25, 0.0, -0.1)), (0.6, euler_to_quat(0.15, 0.0, -0.1)), (1.2, euler_to_quat(-0.25, 0.0, -0.1))],
        "arm_l": [(0.0, euler_to_quat(0.30, 0.0, 0.1)), (0.6, euler_to_quat(-0.25, 0.0, 0.1)), (1.2, euler_to_quat(0.30, 0.0, 0.1))],
    })

    # Action 3: run (0.8s)
    add_action(arm_obj, "run", 0.8, {
        "spine_01": [(0.0, euler_to_quat(0.18, 0.0, 0.0)), (0.4, euler_to_quat(0.15, 0.0, 0.0)), (0.8, euler_to_quat(0.18, 0.0, 0.0))],
        "thigh_l": [(0.0, euler_to_quat(0.65, 0.0, 0.0)), (0.4, euler_to_quat(-0.55, 0.0, 0.0)), (0.8, euler_to_quat(0.65, 0.0, 0.0))],
        "shin_l": [(0.0, euler_to_quat(-0.40, 0.0, 0.0)), (0.2, euler_to_quat(0.80, 0.0, 0.0)), (0.4, euler_to_quat(0.10, 0.0, 0.0)), (0.8, euler_to_quat(-0.40, 0.0, 0.0))],
        "thigh_r": [(0.0, euler_to_quat(-0.55, 0.0, 0.0)), (0.4, euler_to_quat(0.65, 0.0, 0.0)), (0.8, euler_to_quat(-0.55, 0.0, 0.0))],
        "shin_r": [(0.0, euler_to_quat(0.10, 0.0, 0.0)), (0.4, euler_to_quat(-0.40, 0.0, 0.0)), (0.6, euler_to_quat(0.80, 0.0, 0.0)), (0.8, euler_to_quat(0.10, 0.0, 0.0))],
        "arm_r": [(0.0, euler_to_quat(-0.45, 0.0, -0.2)), (0.4, euler_to_quat(-0.25, 0.0, -0.2)), (0.8, euler_to_quat(-0.45, 0.0, -0.2))],
        "forearm_r": [(0.0, euler_to_quat(0.65, 0.0, 0.0)), (0.4, euler_to_quat(0.75, 0.0, 0.0)), (0.8, euler_to_quat(0.65, 0.0, 0.0))],
        "arm_l": [(0.0, euler_to_quat(0.55, 0.0, 0.15)), (0.4, euler_to_quat(-0.45, 0.0, 0.15)), (0.8, euler_to_quat(0.55, 0.0, 0.15))],
    })

    # Action 4: telegraph (0.75s windup)
    add_action(arm_obj, "telegraph", 0.75, {
        "spine_01": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.5, euler_to_quat(-0.25, -0.20, 0.0)), (0.75, euler_to_quat(-0.30, -0.25, 0.0))],
        "head": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.5, euler_to_quat(0.20, 0.20, 0.0)), (0.75, euler_to_quat(0.25, 0.25, 0.0))],
        "arm_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.5, euler_to_quat(-1.25, -0.35, -0.45)), (0.75, euler_to_quat(-1.45, -0.40, -0.50))],
        "forearm_r": [(0.0, euler_to_quat(0.3, 0.0, 0.0)), (0.5, euler_to_quat(0.95, 0.0, 0.0)), (0.75, euler_to_quat(1.10, 0.0, 0.0))],
        "weapon_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.5, euler_to_quat(0.45, 0.0, 0.30)), (0.75, euler_to_quat(0.60, 0.0, 0.35))],
        "arm_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.5, euler_to_quat(0.45, 0.35, 0.40)), (0.75, euler_to_quat(0.50, 0.40, 0.45))],
    })

    # Action 5: attack (0.4s explosive slash)
    add_action(arm_obj, "attack", 0.4, {
        "spine_01": [(0.0, euler_to_quat(-0.30, -0.25, 0.0)), (0.15, euler_to_quat(0.35, 0.30, 0.0)), (0.4, euler_to_quat(0.15, 0.10, 0.0))],
        "arm_r": [(0.0, euler_to_quat(-1.45, -0.40, -0.50)), (0.15, euler_to_quat(0.85, 0.45, 0.15)), (0.4, euler_to_quat(0.35, 0.20, 0.0))],
        "forearm_r": [(0.0, euler_to_quat(1.10, 0.0, 0.0)), (0.15, euler_to_quat(0.15, 0.0, 0.0)), (0.4, euler_to_quat(0.40, 0.0, 0.0))],
        "weapon_r": [(0.0, euler_to_quat(0.60, 0.0, 0.35)), (0.15, euler_to_quat(-0.80, 0.0, 0.0)), (0.4, euler_to_quat(-0.20, 0.0, 0.0))],
        "arm_l": [(0.0, euler_to_quat(0.50, 0.40, 0.45)), (0.15, euler_to_quat(-0.45, -0.30, 0.10)), (0.4, euler_to_quat(0.0, 0.0, 0.10))],
    })

    # Action 6: stagger (1.0s recoil)
    add_action(arm_obj, "stagger", 1.0, {
        "pelvis": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(-0.25, 0.0, 0.0)), (0.6, euler_to_quat(-0.15, 0.0, 0.0)), (1.0, euler_to_quat(0.0, 0.0, 0.0))],
        "spine_01": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(-0.45, 0.15, 0.0)), (0.6, euler_to_quat(-0.20, 0.05, 0.0)), (1.0, euler_to_quat(0.0, 0.0, 0.0))],
        "head": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(-0.35, -0.20, 0.0)), (0.6, euler_to_quat(0.15, 0.10, 0.0)), (1.0, euler_to_quat(0.0, 0.0, 0.0))],
        "arm_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(-0.65, 0.0, -0.65)), (0.6, euler_to_quat(-0.30, 0.0, -0.35)), (1.0, euler_to_quat(0.0, 0.0, 0.0))],
        "arm_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(-0.65, 0.0, 0.65)), (0.6, euler_to_quat(-0.30, 0.0, 0.35)), (1.0, euler_to_quat(0.0, 0.0, 0.0))],
    })

    # Action 7: death (1.5s collapse)
    add_action(arm_obj, "death", 1.5, {
        "pelvis": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.5, euler_to_quat(0.40, 0.0, 0.0)), (1.0, euler_to_quat(0.85, 0.0, 0.0)), (1.5, euler_to_quat(1.20, 0.0, 0.0))],
        "thigh_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.5, euler_to_quat(-0.60, 0.0, 0.2)), (1.0, euler_to_quat(-1.10, 0.0, 0.3)), (1.5, euler_to_quat(-1.30, 0.0, 0.3))],
        "thigh_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.5, euler_to_quat(-0.60, 0.0, -0.2)), (1.0, euler_to_quat(-1.10, 0.0, -0.3)), (1.5, euler_to_quat(-1.30, 0.0, -0.3))],
        "spine_01": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.5, euler_to_quat(-0.30, 0.0, 0.0)), (1.0, euler_to_quat(-0.55, 0.0, 0.0)), (1.5, euler_to_quat(-0.70, 0.0, 0.0))],
        "arm_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.5, euler_to_quat(0.45, 0.0, 0.2)), (1.0, euler_to_quat(0.85, 0.0, 0.3)), (1.5, euler_to_quat(1.10, 0.0, 0.4))],
        "arm_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.5, euler_to_quat(0.45, 0.0, -0.2)), (1.0, euler_to_quat(0.85, 0.0, -0.3)), (1.5, euler_to_quat(1.10, 0.0, -0.4))],
    })

    # Export to GLB and save blend
    blend_path = os.path.join(ENEMY_DIR, "asura_warrior_production.blend")
    glb_path = os.path.join(ENEMY_DIR, "asura_warrior.glb")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("Saved Asura Warrior blend file to:", blend_path)

    bpy.ops.object.select_all(action='DESELECT')
    arm_obj.select_set(True)
    body_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=True,
        export_animations=True,
        export_animation_mode='ACTIONS',
        export_force_sampling=False,
        export_anim_single_armature=True,
        export_skins=True,
        export_morph=False,
        export_materials='EXPORT',
        export_apply=False
    )
    print("Exported Asura Warrior GLB to:", glb_path)

# =========================================================================
# 2. BUILD GENERAL KALANEMI (4-ARMED ASURA WARLORD BOSS)
# =========================================================================
def build_boss_kalanemi():
    print("=== Building Production 3D Boss General Kalanemi ===")
    clear_scene()

    # Materials
    mat_body = create_pbr_material("Mat_Kalanemi_Body", "kalanemi_body_albedo.png", "kalanemi_body_normal.png", "kalanemi_body_mr.png", "kalanemi_body_emissive.png")
    mat_plate = create_pbr_material("Mat_Kalanemi_Plate", "kalanemi_armor_albedo.png", "kalanemi_armor_normal.png", "kalanemi_armor_mr.png")
    mat_core = create_pbr_material("Mat_Kalanemi_Core", "kalanemi_core_albedo.png", "kalanemi_core_normal.png", "kalanemi_core_mr.png", "kalanemi_core_emissive.png")
    mat_cleavers = create_pbr_material("Mat_Kalanemi_Cleavers", "kalanemi_cleaver_albedo.png", "kalanemi_cleaver_normal.png", "kalanemi_cleaver_mr.png", "kalanemi_cleaver_emissive.png")

    # 1. Base torso & legs from human base mesh
    with bpy.data.libraries.load(BUNDLE_PATH) as (data_from, data_to):
        if "GEO-body_male_realistic" in data_from.objects:
            data_to.objects = ["GEO-body_male_realistic"]

    boss_body = data_to.objects[0]
    bpy.context.collection.objects.link(boss_body)
    bpy.context.view_layer.objects.active = boss_body
    boss_body.select_set(True)

    # Reset position to origin and apply transform
    boss_body.location = (0, 0, 0)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Scale to monumental 2.85m tall and massively broad
    min_z = min(v.co.z for v in boss_body.data.vertices)
    max_z = max(v.co.z for v in boss_body.data.vertices)
    scale_fac = 2.85 / (max_z - min_z)
    boss_body.scale = (scale_fac * 1.35, scale_fac * 1.25, scale_fac)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    min_z = min(v.co.z for v in boss_body.data.vertices)
    for v in boss_body.data.vertices:
        v.co.z -= min_z

    boss_body.data.materials.clear()
    boss_body.data.materials.append(mat_body)

    # 2. Add Quad-Horned Demonic Crown Helm
    mesh_crown = bpy.data.meshes.new("KalanemiCrown")
    bm_c = bmesh.new()
    # 2 Upper giant curved horns
    for side in [-1, 1]:
        steps = 12
        prev_r = []
        for i in range(steps):
            t = i / float(steps - 1)
            cz = 2.65 + t * 0.45 - (t**2)*0.08
            cy = -0.05 - t * 0.28
            cx = side * (0.16 + t * 0.24)
            r = (1.0 - t * 0.82) * 0.055
            ring_v = []
            for seg in range(8):
                ang = seg * (2 * math.pi / 8)
                ring_v.append(bm_c.verts.new((cx + math.cos(ang)*r, cy + math.sin(ang)*r*0.8, cz)))
            if prev_r:
                for seg in range(8):
                    ns = (seg + 1) % 8
                    bm_c.faces.new([prev_r[seg], prev_r[ns], ring_v[ns], ring_v[seg]])
            else:
                bm_c.faces.new(ring_v)
            prev_r = ring_v
        bm_c.faces.new(list(reversed(prev_r)))

    # 2 Lower horns spreading outward
    for side in [-1, 1]:
        steps = 8
        prev_r = []
        for i in range(steps):
            t = i / float(steps - 1)
            cz = 2.50 + t * 0.12
            cy = 0.08 + t * 0.15
            cx = side * (0.20 + t * 0.28)
            r = (1.0 - t * 0.85) * 0.040
            ring_v = []
            for seg in range(8):
                ang = seg * (2 * math.pi / 8)
                ring_v.append(bm_c.verts.new((cx + math.cos(ang)*r, cy + math.sin(ang)*r, cz)))
            if prev_r:
                for seg in range(8):
                    ns = (seg + 1) % 8
                    bm_c.faces.new([prev_r[seg], prev_r[ns], ring_v[ns], ring_v[seg]])
            else:
                bm_c.faces.new(ring_v)
            prev_r = ring_v
        bm_c.faces.new(list(reversed(prev_r)))

    bm_c.to_mesh(mesh_crown)
    bm_c.free()
    crown_obj = bpy.data.objects.new("KalanemiCrown", mesh_crown)
    crown_obj.data.materials.append(mat_plate)
    bpy.context.collection.objects.link(crown_obj)

    # 3. Add Secondary Pair of Arms (Lower Demonic Arms)
    mesh_lower_arms = bpy.data.meshes.new("KalanemiLowerArms")
    bm_la = bmesh.new()
    for side in [-1, 1]:
        # Shoulder2 to Forearm2 to Hand2
        # Upper segment
        bmesh.ops.create_cone(bm_la, cap_ends=True, segments=12, radius1=0.085, radius2=0.070, depth=0.45)
        for v in bm_la.verts[-32:]:
            v.co.x = v.co.x + side * 0.42
            v.co.y = v.co.y - 0.08
            v.co.z = v.co.z + 1.70
        # Forearm segment
        bmesh.ops.create_cone(bm_la, cap_ends=True, segments=12, radius1=0.070, radius2=0.055, depth=0.48)
        for v in bm_la.verts[-32:]:
            v.co.x = v.co.x + side * 0.58
            v.co.y = v.co.y - 0.22
            v.co.z = v.co.z + 1.35
        # Clawed fist
        bmesh.ops.create_icosphere(bm_la, subdivisions=2, radius=0.085)
        for v in bm_la.verts[-42:]:
            v.co.x = v.co.x + side * 0.70
            v.co.y = v.co.y - 0.30
            v.co.z = v.co.z + 1.10

    bm_la.to_mesh(mesh_lower_arms)
    bm_la.free()
    lower_arms_obj = bpy.data.objects.new("KalanemiLowerArms", mesh_lower_arms)
    lower_arms_obj.data.materials.append(mat_body)
    bpy.context.collection.objects.link(lower_arms_obj)

    # 4. Add Heavy Volcanic Shoulder Pauldrons
    mesh_boss_pauldrons = bpy.data.meshes.new("KalanemiPauldrons")
    bm_bp = bmesh.new()
    for side in [-1, 1]:
        px = side * 0.48
        py = 0.0
        pz = 2.22
        bmesh.ops.create_cube(bm_bp, size=0.28)
        for v in bm_bp.verts[-8:]:
            v.co.x = v.co.x * 1.3 + px
            v.co.y = v.co.y * 1.8 + py
            v.co.z = v.co.z * 0.7 + pz
        # 3 Colossal jagged spikes
        for spk in range(3):
            bmesh.ops.create_cone(bm_bp, cap_ends=True, segments=12, radius1=0.065, radius2=0.008, depth=0.32)
            for v in bm_bp.verts[-32:]:
                v.co.x += px + side * (0.08 + spk * 0.06)
                v.co.y += py + (spk - 1) * 0.12
                v.co.z += pz + 0.20 + spk * 0.04

    bm_bp.to_mesh(mesh_boss_pauldrons)
    bm_bp.free()
    boss_pauldrons_obj = bpy.data.objects.new("KalanemiPauldrons", mesh_boss_pauldrons)
    boss_pauldrons_obj.data.materials.append(mat_plate)
    bpy.context.collection.objects.link(boss_pauldrons_obj)

    # 5. Add Chest Molten Tamas Core Medallion
    mesh_core = bpy.data.meshes.new("KalanemiCore")
    bm_core = bmesh.new()
    bmesh.ops.create_icosphere(bm_core, subdivisions=3, radius=0.18)
    for v in bm_core.verts:
        v.co.x *= 1.2
        v.co.y = v.co.y * 0.45 - 0.24
        v.co.z = v.co.z * 1.4 + 2.05
    bm_core.to_mesh(mesh_core)
    bm_core.free()
    core_obj = bpy.data.objects.new("KalanemiCore", mesh_core)
    core_obj.data.materials.append(mat_core)
    bpy.context.collection.objects.link(core_obj)

    # 6. Add Dual Heavy Void Cleavers (Held in upper hands)
    mesh_cleavers = bpy.data.meshes.new("KalanemiCleavers")
    bm_cl = bmesh.new()
    for side in [-1, 1]:
        hx = side * 0.85
        hy = -0.18
        hz = 1.12
        # Giant war axe / cleaver shaft
        bmesh.ops.create_cube(bm_cl, size=0.06)
        for v in bm_cl.verts[-8:]:
            v.co.x = v.co.x * 0.8 + hx
            v.co.y = v.co.y * 0.8 + hy
            v.co.z = v.co.z * 24.0 + hz + 0.25 # 1.44m heavy shaft
        # Massive serrated broad cleaver head
        bmesh.ops.create_cube(bm_cl, size=0.10)
        for v in bm_cl.verts[-8:]:
            v.co.x = v.co.x * 0.6 + hx + side * 0.05
            v.co.y = v.co.y * 5.5 + hy - 0.32 # 0.55m broad blade
            v.co.z = v.co.z * 7.5 + hz + 0.75 # 0.75m vertical blade
        # Spiked reverse pick
        bmesh.ops.create_cone(bm_cl, cap_ends=True, segments=12, radius1=0.05, radius2=0.005, depth=0.35)
        for v in bm_cl.verts[-32:]:
            v.co.x += hx
            v.co.y += hy + 0.25
            v.co.z += hz + 0.75

    bm_cl.to_mesh(mesh_cleavers)
    bm_cl.free()
    cleavers_obj = bpy.data.objects.new("KalanemiCleavers", mesh_cleavers)
    cleavers_obj.data.materials.append(mat_cleavers)
    bpy.context.collection.objects.link(cleavers_obj)

    # Smart UV project
    for obj in [crown_obj, lower_arms_obj, boss_pauldrons_obj, core_obj, cleavers_obj]:
        smart_uv_unwrap_object(obj)



    # 7. Build 28-bone Boss Armature
    boss_arm_data = bpy.data.armatures.new("BossKalanemiArmature")
    boss_arm_obj = bpy.data.objects.new("BossKalanemiRig", boss_arm_data)
    bpy.context.collection.objects.link(boss_arm_obj)
    bpy.context.view_layer.objects.active = boss_arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    ebones = boss_arm_data.edit_bones

    def make_bb(name, head, tail, parent_name=None):
        b = ebones.new(name)
        b.head = head
        b.tail = tail
        if parent_name and parent_name in ebones:
            b.parent = ebones[parent_name]
        return b

    make_bb("root", (0, 0, 0), (0, 0, 0.3))
    make_bb("pelvis", (0, 0, 1.45), (0, 0, 1.60), "root")
    make_bb("spine_01", (0, 0, 1.60), (0, 0, 1.85), "pelvis")
    make_bb("chest", (0, 0, 1.85), (0, 0, 2.25), "spine_01")
    make_bb("neck", (0, 0, 2.25), (0, 0, 2.40), "chest")
    make_bb("head", (0, 0, 2.40), (0, 0, 2.80), "neck")
    make_bb("horn_up_l", (0.16, -0.08, 2.70), (0.35, -0.25, 3.10), "head")
    make_bb("horn_up_r", (-0.16, -0.08, 2.70), (-0.35, -0.25, 3.10), "head")
    make_bb("horn_dn_l", (0.20, 0.05, 2.55), (0.45, 0.15, 2.65), "head")
    make_bb("horn_dn_r", (-0.20, 0.05, 2.55), (-0.45, 0.15, 2.65), "head")
    make_bb("chest_core", (0, -0.15, 2.05), (0, -0.25, 2.05), "chest")

    # Upper arms pair (cleavers)
    make_bb("shoulder1_l", (0.15, 0, 2.20), (0.40, 0, 2.18), "chest")
    make_bb("arm1_l", (0.40, 0, 2.18), (0.62, 0, 1.75), "shoulder1_l")
    make_bb("forearm1_l", (0.62, 0, 1.75), (0.76, -0.12, 1.30), "arm1_l")
    make_bb("hand1_l", (0.76, -0.12, 1.30), (0.85, -0.18, 1.12), "forearm1_l")
    make_bb("weapon1_l", (0.85, -0.18, 1.12), (0.95, -0.25, 0.95), "hand1_l")

    make_bb("shoulder1_r", (-0.15, 0, 2.20), (-0.40, 0, 2.18), "chest")
    make_bb("arm1_r", (-0.40, 0, 2.18), (-0.62, 0, 1.75), "shoulder1_r")
    make_bb("forearm1_r", (-0.62, 0, 1.75), (-0.76, -0.12, 1.30), "arm1_r")
    make_bb("hand1_r", (-0.76, -0.12, 1.30), (-0.85, -0.18, 1.12), "forearm1_r")
    make_bb("weapon1_r", (-0.85, -0.18, 1.12), (-0.95, -0.25, 0.95), "hand1_r")

    # Lower arms pair (secondary claws)
    make_bb("shoulder2_l", (0.12, -0.05, 1.95), (0.35, -0.05, 1.90), "chest")
    make_bb("arm2_l", (0.35, -0.05, 1.90), (0.54, -0.08, 1.55), "shoulder2_l")
    make_bb("forearm2_l", (0.54, -0.08, 1.55), (0.65, -0.18, 1.15), "arm2_l")
    make_bb("hand2_l", (0.65, -0.18, 1.15), (0.72, -0.22, 1.00), "forearm2_l")

    make_bb("shoulder2_r", (-0.12, -0.05, 1.95), (-0.35, -0.05, 1.90), "chest")
    make_bb("arm2_r", (-0.35, -0.05, 1.90), (-0.54, -0.08, 1.55), "shoulder2_r")
    make_bb("forearm2_r", (-0.54, -0.08, 1.55), (-0.65, -0.18, 1.15), "arm2_r")
    make_bb("hand2_r", (-0.65, -0.18, 1.15), (-0.72, -0.22, 1.00), "forearm2_r")

    # Legs
    make_bb("thigh_l", (0.22, 0, 1.40), (0.25, 0.04, 0.78), "pelvis")
    make_bb("shin_l", (0.25, 0.04, 0.78), (0.28, 0.08, 0.18), "thigh_l")
    make_bb("foot_l", (0.28, 0.08, 0.18), (0.28, -0.22, 0.03), "shin_l")

    make_bb("thigh_r", (-0.22, 0, 1.40), (-0.25, 0.04, 0.78), "pelvis")
    make_bb("shin_r", (-0.25, 0.04, 0.78), (-0.28, 0.08, 0.18), "thigh_r")
    make_bb("foot_r", (-0.28, 0.08, 0.18), (-0.28, -0.22, 0.03), "shin_r")

    bpy.ops.object.mode_set(mode='OBJECT')

    # Skin weights parent for boss body
    bpy.ops.object.select_all(action='DESELECT')
    boss_body.select_set(True)
    boss_arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = boss_arm_obj
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')

    # Assign rigid skinning vertex groups to accessories
    vg_cr = crown_obj.vertex_groups.new(name="head")
    vg_cr.add(list(range(len(crown_obj.data.vertices))), 1.0, 'REPLACE')

    vg_core = core_obj.vertex_groups.new(name="chest")
    vg_core.add(list(range(len(core_obj.data.vertices))), 1.0, 'REPLACE')

    vg_bp_l = boss_pauldrons_obj.vertex_groups.new(name="shoulder1_l")
    vg_bp_r = boss_pauldrons_obj.vertex_groups.new(name="shoulder1_r")
    for i, v in enumerate(boss_pauldrons_obj.data.vertices):
        if v.co.x > 0:
            vg_bp_l.add([i], 1.0, 'REPLACE')
        else:
            vg_bp_r.add([i], 1.0, 'REPLACE')

    vg_cl_l = cleavers_obj.vertex_groups.new(name="weapon1_l")
    vg_cl_r = cleavers_obj.vertex_groups.new(name="weapon1_r")
    for i, v in enumerate(cleavers_obj.data.vertices):
        if v.co.x > 0:
            vg_cl_l.add([i], 1.0, 'REPLACE')
        else:
            vg_cl_r.add([i], 1.0, 'REPLACE')

    vg_arm2_l = lower_arms_obj.vertex_groups.new(name="arm2_l")
    vg_farm2_l = lower_arms_obj.vertex_groups.new(name="forearm2_l")
    vg_hnd2_l = lower_arms_obj.vertex_groups.new(name="hand2_l")
    vg_arm2_r = lower_arms_obj.vertex_groups.new(name="arm2_r")
    vg_farm2_r = lower_arms_obj.vertex_groups.new(name="forearm2_r")
    vg_hnd2_r = lower_arms_obj.vertex_groups.new(name="hand2_r")
    for i, v in enumerate(lower_arms_obj.data.vertices):
        if v.co.x > 0:
            if v.co.z > 1.6:
                vg_arm2_l.add([i], 1.0, 'REPLACE')
            elif v.co.z > 1.2:
                vg_farm2_l.add([i], 1.0, 'REPLACE')
            else:
                vg_hnd2_l.add([i], 1.0, 'REPLACE')
        else:
            if v.co.z > 1.6:
                vg_arm2_r.add([i], 1.0, 'REPLACE')
            elif v.co.z > 1.2:
                vg_farm2_r.add([i], 1.0, 'REPLACE')
            else:
                vg_hnd2_r.add([i], 1.0, 'REPLACE')

    # Join props into boss_body
    bpy.ops.object.select_all(action='DESELECT')
    for obj in [boss_body, crown_obj, lower_arms_obj, boss_pauldrons_obj, core_obj, cleavers_obj]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = boss_body
    bpy.ops.object.join()
    boss_body.name = "BossKalanemi_Mesh"

    # 8. Author 10 Monumental Boss Skeletal Actions
    print("Authoring 10 monumental actions for General Kalanemi...")

    # Action 1: boss_idle (2.4s)
    add_action(boss_arm_obj, "boss_idle", 2.4, {
        "chest": [(0.0, euler_to_quat(0.05, 0.0, 0.0)), (1.2, euler_to_quat(-0.03, 0.0, 0.0)), (2.4, euler_to_quat(0.05, 0.0, 0.0))],
        "head": [(0.0, euler_to_quat(0.05, -0.05, 0.0)), (1.2, euler_to_quat(0.05, 0.05, 0.0)), (2.4, euler_to_quat(0.05, -0.05, 0.0))],
        "arm1_l": [(0.0, euler_to_quat(-0.15, 0.0, 0.20)), (1.2, euler_to_quat(-0.22, 0.0, 0.15)), (2.4, euler_to_quat(-0.15, 0.0, 0.20))],
        "forearm1_l": [(0.0, euler_to_quat(0.50, 0.0, 0.0)), (1.2, euler_to_quat(0.60, 0.0, 0.0)), (2.4, euler_to_quat(0.50, 0.0, 0.0))],
        "arm1_r": [(0.0, euler_to_quat(-0.15, 0.0, -0.20)), (1.2, euler_to_quat(-0.22, 0.0, -0.15)), (2.4, euler_to_quat(-0.15, 0.0, -0.20))],
        "forearm1_r": [(0.0, euler_to_quat(0.50, 0.0, 0.0)), (1.2, euler_to_quat(0.60, 0.0, 0.0)), (2.4, euler_to_quat(0.50, 0.0, 0.0))],
        "arm2_l": [(0.0, euler_to_quat(0.10, 0.0, 0.25)), (1.2, euler_to_quat(0.05, 0.0, 0.20)), (2.4, euler_to_quat(0.10, 0.0, 0.25))],
        "arm2_r": [(0.0, euler_to_quat(0.10, 0.0, -0.25)), (1.2, euler_to_quat(0.05, 0.0, -0.20)), (2.4, euler_to_quat(0.10, 0.0, -0.25))],
    })

    # Action 2: boss_walk (1.6s)
    add_action(boss_arm_obj, "boss_walk", 1.6, {
        "chest": [(0.0, euler_to_quat(0.06, 0.06, 0.0)), (0.8, euler_to_quat(0.06, -0.06, 0.0)), (1.6, euler_to_quat(0.06, 0.06, 0.0))],
        "thigh_l": [(0.0, euler_to_quat(0.42, 0.0, 0.0)), (0.8, euler_to_quat(-0.35, 0.0, 0.0)), (1.6, euler_to_quat(0.42, 0.0, 0.0))],
        "shin_l": [(0.0, euler_to_quat(-0.30, 0.0, 0.0)), (0.4, euler_to_quat(0.50, 0.0, 0.0)), (0.8, euler_to_quat(0.05, 0.0, 0.0)), (1.6, euler_to_quat(-0.30, 0.0, 0.0))],
        "thigh_r": [(0.0, euler_to_quat(-0.35, 0.0, 0.0)), (0.8, euler_to_quat(0.42, 0.0, 0.0)), (1.6, euler_to_quat(-0.35, 0.0, 0.0))],
        "shin_r": [(0.0, euler_to_quat(0.05, 0.0, 0.0)), (0.8, euler_to_quat(-0.30, 0.0, 0.0)), (1.2, euler_to_quat(0.50, 0.0, 0.0)), (1.6, euler_to_quat(0.05, 0.0, 0.0))],
        "arm1_l": [(0.0, euler_to_quat(-0.30, 0.0, 0.15)), (0.8, euler_to_quat(0.15, 0.0, 0.15)), (1.6, euler_to_quat(-0.30, 0.0, 0.15))],
        "arm1_r": [(0.0, euler_to_quat(0.15, 0.0, -0.15)), (0.8, euler_to_quat(-0.30, 0.0, -0.15)), (1.6, euler_to_quat(0.15, 0.0, -0.15))],
        "arm2_l": [(0.0, euler_to_quat(0.20, 0.0, 0.20)), (0.8, euler_to_quat(-0.15, 0.0, 0.20)), (1.6, euler_to_quat(0.20, 0.0, 0.20))],
        "arm2_r": [(0.0, euler_to_quat(-0.15, 0.0, -0.20)), (0.8, euler_to_quat(0.20, 0.0, -0.20)), (1.6, euler_to_quat(-0.15, 0.0, -0.20))],
    })

    # Action 3: boss_cleave_telegraph (0.85s windup)
    add_action(boss_arm_obj, "boss_cleave_telegraph", 0.85, {
        "spine_01": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.6, euler_to_quat(-0.25, 0.0, 0.0)), (0.85, euler_to_quat(-0.32, 0.0, 0.0))],
        "arm1_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.6, euler_to_quat(-1.35, 0.35, 0.40)), (0.85, euler_to_quat(-1.50, 0.40, 0.45))],
        "forearm1_l": [(0.0, euler_to_quat(0.5, 0.0, 0.0)), (0.6, euler_to_quat(1.20, 0.0, 0.0)), (0.85, euler_to_quat(1.35, 0.0, 0.0))],
        "arm1_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.6, euler_to_quat(-1.35, -0.35, -0.40)), (0.85, euler_to_quat(-1.50, -0.40, -0.45))],
        "forearm1_r": [(0.0, euler_to_quat(0.5, 0.0, 0.0)), (0.6, euler_to_quat(1.20, 0.0, 0.0)), (0.85, euler_to_quat(1.35, 0.0, 0.0))],
        "arm2_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.6, euler_to_quat(-0.45, 0.20, 0.50)), (0.85, euler_to_quat(-0.55, 0.25, 0.55))],
        "arm2_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.6, euler_to_quat(-0.45, -0.20, -0.50)), (0.85, euler_to_quat(-0.55, -0.25, -0.55))],
    })

    # Action 4: boss_cleave_attack (0.45s dual cross-cleave)
    add_action(boss_arm_obj, "boss_cleave_attack", 0.45, {
        "spine_01": [(0.0, euler_to_quat(-0.32, 0.0, 0.0)), (0.18, euler_to_quat(0.40, 0.0, 0.0)), (0.45, euler_to_quat(0.15, 0.0, 0.0))],
        "arm1_l": [(0.0, euler_to_quat(-1.50, 0.40, 0.45)), (0.18, euler_to_quat(0.95, -0.40, -0.30)), (0.45, euler_to_quat(0.35, -0.15, -0.10))],
        "forearm1_l": [(0.0, euler_to_quat(1.35, 0.0, 0.0)), (0.18, euler_to_quat(0.20, 0.0, 0.0)), (0.45, euler_to_quat(0.45, 0.0, 0.0))],
        "arm1_r": [(0.0, euler_to_quat(-1.50, -0.40, -0.45)), (0.18, euler_to_quat(0.95, 0.40, 0.30)), (0.45, euler_to_quat(0.35, 0.15, 0.10))],
        "forearm1_r": [(0.0, euler_to_quat(1.35, 0.0, 0.0)), (0.18, euler_to_quat(0.20, 0.0, 0.0)), (0.45, euler_to_quat(0.45, 0.0, 0.0))],
        "arm2_l": [(0.0, euler_to_quat(-0.55, 0.25, 0.55)), (0.18, euler_to_quat(0.45, 0.0, 0.25)), (0.45, euler_to_quat(0.10, 0.0, 0.20))],
        "arm2_r": [(0.0, euler_to_quat(-0.55, -0.25, -0.55)), (0.18, euler_to_quat(0.45, 0.0, -0.25)), (0.45, euler_to_quat(0.10, 0.0, -0.20))],
    })

    # Action 5: boss_slam_leap (0.6s)
    add_action(boss_arm_obj, "boss_slam_leap", 0.6, {
        "pelvis": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(0.35, 0.0, 0.0)), (0.6, euler_to_quat(-0.25, 0.0, 0.0))],
        "thigh_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(-0.65, 0.0, 0.0)), (0.6, euler_to_quat(0.45, 0.0, 0.0))],
        "thigh_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(-0.65, 0.0, 0.0)), (0.6, euler_to_quat(0.45, 0.0, 0.0))],
        "arm1_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(0.45, 0.0, 0.2)), (0.6, euler_to_quat(-1.40, 0.0, 0.3))],
        "arm1_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(0.45, 0.0, -0.2)), (0.6, euler_to_quat(-1.40, 0.0, -0.3))],
    })

    # Action 6: boss_slam_impact (0.6s)
    add_action(boss_arm_obj, "boss_slam_impact", 0.6, {
        "spine_01": [(0.0, euler_to_quat(-0.25, 0.0, 0.0)), (0.15, euler_to_quat(0.55, 0.0, 0.0)), (0.6, euler_to_quat(0.20, 0.0, 0.0))],
        "thigh_l": [(0.0, euler_to_quat(0.45, 0.0, 0.0)), (0.15, euler_to_quat(-0.75, 0.0, 0.1)), (0.6, euler_to_quat(-0.25, 0.0, 0.0))],
        "thigh_r": [(0.0, euler_to_quat(0.45, 0.0, 0.0)), (0.15, euler_to_quat(-0.75, 0.0, -0.1)), (0.6, euler_to_quat(-0.25, 0.0, 0.0))],
        "arm1_l": [(0.0, euler_to_quat(-1.40, 0.0, 0.3)), (0.15, euler_to_quat(1.10, 0.0, 0.1)), (0.6, euler_to_quat(0.40, 0.0, 0.15))],
        "arm1_r": [(0.0, euler_to_quat(-1.40, 0.0, -0.3)), (0.15, euler_to_quat(1.10, 0.0, -0.1)), (0.6, euler_to_quat(0.40, 0.0, -0.15))],
    })

    # Action 7: boss_charge (1.0s)
    add_action(boss_arm_obj, "boss_charge", 1.0, {
        "spine_01": [(0.0, euler_to_quat(0.35, 0.0, 0.0)), (0.5, euler_to_quat(0.30, 0.0, 0.0)), (1.0, euler_to_quat(0.35, 0.0, 0.0))],
        "thigh_l": [(0.0, euler_to_quat(0.60, 0.0, 0.0)), (0.5, euler_to_quat(-0.50, 0.0, 0.0)), (1.0, euler_to_quat(0.60, 0.0, 0.0))],
        "thigh_r": [(0.0, euler_to_quat(-0.50, 0.0, 0.0)), (0.5, euler_to_quat(0.60, 0.0, 0.0)), (1.0, euler_to_quat(-0.50, 0.0, 0.0))],
        "arm1_l": [(0.0, euler_to_quat(0.65, 0.0, 0.20)), (0.5, euler_to_quat(0.55, 0.0, 0.20)), (1.0, euler_to_quat(0.65, 0.0, 0.20))],
        "arm1_r": [(0.0, euler_to_quat(0.65, 0.0, -0.20)), (0.5, euler_to_quat(0.55, 0.0, -0.20)), (1.0, euler_to_quat(0.65, 0.0, -0.20))],
        "arm2_l": [(0.0, euler_to_quat(0.45, -0.30, 0.35)), (0.5, euler_to_quat(0.35, -0.30, 0.35)), (1.0, euler_to_quat(0.45, -0.30, 0.35))],
        "arm2_r": [(0.0, euler_to_quat(0.45, 0.30, -0.35)), (0.5, euler_to_quat(0.35, 0.30, -0.35)), (1.0, euler_to_quat(0.45, 0.30, -0.35))],
    })

    # Action 8: boss_roar (2.0s enrage)
    add_action(boss_arm_obj, "boss_roar", 2.0, {
        "spine_01": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(-0.45, 0.0, 0.0)), (1.6, euler_to_quat(-0.40, 0.0, 0.0)), (2.0, euler_to_quat(0.0, 0.0, 0.0))],
        "head": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(-0.55, 0.0, 0.0)), (1.6, euler_to_quat(-0.50, 0.0, 0.0)), (2.0, euler_to_quat(0.0, 0.0, 0.0))],
        "arm1_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(-0.85, 0.40, 0.85)), (1.6, euler_to_quat(-0.80, 0.35, 0.80)), (2.0, euler_to_quat(0.0, 0.0, 0.0))],
        "arm1_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(-0.85, -0.40, -0.85)), (1.6, euler_to_quat(-0.80, -0.35, -0.80)), (2.0, euler_to_quat(0.0, 0.0, 0.0))],
        "arm2_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(0.20, 0.0, 0.75)), (1.6, euler_to_quat(0.15, 0.0, 0.70)), (2.0, euler_to_quat(0.0, 0.0, 0.0))],
        "arm2_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(0.20, 0.0, -0.75)), (1.6, euler_to_quat(0.15, 0.0, -0.70)), (2.0, euler_to_quat(0.0, 0.0, 0.0))],
    })

    # Action 9: boss_stagger (3.0s poise break kneeling)
    add_action(boss_arm_obj, "boss_stagger", 3.0, {
        "pelvis": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(0.50, 0.0, 0.0)), (2.5, euler_to_quat(0.50, 0.0, 0.0)), (3.0, euler_to_quat(0.0, 0.0, 0.0))],
        "thigh_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(-1.10, 0.0, 0.0)), (2.5, euler_to_quat(-1.10, 0.0, 0.0)), (3.0, euler_to_quat(0.0, 0.0, 0.0))],
        "shin_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(1.40, 0.0, 0.0)), (2.5, euler_to_quat(1.40, 0.0, 0.0)), (3.0, euler_to_quat(0.0, 0.0, 0.0))],
        "thigh_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(-0.45, 0.0, 0.2)), (2.5, euler_to_quat(-0.45, 0.0, 0.2)), (3.0, euler_to_quat(0.0, 0.0, 0.0))],
        "spine_01": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(-0.55, 0.0, 0.0)), (2.5, euler_to_quat(-0.55, 0.0, 0.0)), (3.0, euler_to_quat(0.0, 0.0, 0.0))],
        "head": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(0.40, 0.0, 0.0)), (2.5, euler_to_quat(0.40, 0.0, 0.0)), (3.0, euler_to_quat(0.0, 0.0, 0.0))],
        "arm1_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(0.55, 0.0, 0.15)), (2.5, euler_to_quat(0.55, 0.0, 0.15)), (3.0, euler_to_quat(0.0, 0.0, 0.0))],
        "arm1_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(0.55, 0.0, -0.15)), (2.5, euler_to_quat(0.55, 0.0, -0.15)), (3.0, euler_to_quat(0.0, 0.0, 0.0))],
    })

    # Action 10: boss_defeat (2.5s dissolution)
    add_action(boss_arm_obj, "boss_defeat", 2.5, {
        "pelvis": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.6, euler_to_quat(-0.25, 0.0, 0.0)), (1.5, euler_to_quat(0.65, 0.0, 0.0)), (2.5, euler_to_quat(1.10, 0.0, 0.0))],
        "spine_01": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.6, euler_to_quat(-0.50, 0.0, 0.0)), (1.5, euler_to_quat(-0.35, 0.0, 0.0)), (2.5, euler_to_quat(-0.65, 0.0, 0.0))],
        "arm1_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.6, euler_to_quat(0.45, 0.0, 0.3)), (1.5, euler_to_quat(0.85, 0.0, 0.4)), (2.5, euler_to_quat(1.20, 0.0, 0.5))],
        "arm1_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.6, euler_to_quat(0.45, 0.0, -0.3)), (1.5, euler_to_quat(0.85, 0.0, -0.4)), (2.5, euler_to_quat(1.20, 0.0, -0.5))],
        "arm2_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.6, euler_to_quat(0.75, 0.3, 0.2)), (1.5, euler_to_quat(0.85, 0.3, 0.2)), (2.5, euler_to_quat(0.95, 0.3, 0.2))],
        "arm2_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.6, euler_to_quat(0.75, -0.3, -0.2)), (1.5, euler_to_quat(0.85, -0.3, -0.2)), (2.5, euler_to_quat(0.95, -0.3, -0.2))],
    })

    # Save and Export
    boss_blend_path = os.path.join(ENEMY_DIR, "boss_kalanemi_production.blend")
    boss_glb_path = os.path.join(ENEMY_DIR, "boss_kalanemi.glb")
    bpy.ops.wm.save_as_mainfile(filepath=boss_blend_path)
    print("Saved Boss Kalanemi blend file to:", boss_blend_path)

    bpy.ops.object.select_all(action='DESELECT')
    boss_arm_obj.select_set(True)
    boss_body.select_set(True)
    bpy.context.view_layer.objects.active = boss_arm_obj

    bpy.ops.export_scene.gltf(
        filepath=boss_glb_path,
        export_format='GLB',
        use_selection=True,
        export_animations=True,
        export_animation_mode='ACTIONS',
        export_force_sampling=False,
        export_anim_single_armature=True,
        export_skins=True,
        export_morph=False,
        export_materials='EXPORT',
        export_apply=False
    )
    print("Exported Boss Kalanemi GLB to:", boss_glb_path)

if __name__ == "__main__":
    build_asura_warrior()
    build_boss_kalanemi()
    print("All Bhumi combat actors built and exported successfully!")
