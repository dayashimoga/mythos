"""
Mythos 3D - Devi Tara Production 3D Rigged & Skinned Character Pipeline
Generates the authentic, production-quality 3D rigged & animated model for Devi Tara (Celestial Oracle of Tapas):
- 24-bone celestial humanoid armature
- High-fidelity PBR textured mesh with sari, gold jewelry, temple mukuta crown, and mandala aura
- 4 authored animation clips: idle, talk_oracle, bless_astra, warning_alert
- Exported to godot/assets/characters/npcs/devi_tara.glb
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Quaternion, Matrix

ROOT_DIR = r"h:\mythologicalgame"
TEXTURE_DIR = os.path.join(ROOT_DIR, r"godot\assets\textures\devi_tara")
NPC_DIR = os.path.join(ROOT_DIR, r"godot\assets\characters\npcs")
os.makedirs(NPC_DIR, exist_ok=True)

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
                        base_color=(0.9, 0.8, 0.7, 1.0), roughness=0.4, metallic=0.1):
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

def build_devi_tara():
    clear_scene()

    # Materials
    mat_skin = create_pbr_material("Mat_TaraSkin", "tara_skin_albedo.png",
                                   "tara_skin_normal.png", "tara_skin_mr.png", "tara_skin_emission.png")
    mat_silk = create_pbr_material("Mat_TaraSilk", "tara_silk_albedo.png",
                                   "tara_silk_normal.png", "tara_silk_mr.png", "tara_silk_emission.png")
    mat_gold = create_pbr_material("Mat_TaraGold", "tara_gold_albedo.png",
                                   "tara_gold_normal.png", "tara_gold_mr.png", "tara_gold_emission.png")
    mat_aura = create_pbr_material("Mat_TaraAura", "tara_aura_albedo.png",
                                   "tara_aura_normal.png", "tara_aura_mr.png", "tara_aura_emission.png")
    mat_hair = create_pbr_material("Mat_TaraHair", "tara_hair_albedo.png",
                                   "tara_hair_normal.png", "tara_hair_mr.png")

    # 1. Armature
    arm_data = bpy.data.armatures.new("Tara_Armature")
    arm_obj = bpy.data.objects.new("Tara_Rig", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    root = eb.new("root")
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.4)

    hips = eb.new("hips")
    hips.head = (0, 0, 0.85)
    hips.tail = (0, 0, 1.05)
    hips.parent = root

    spine = eb.new("spine")
    spine.head = (0, 0, 1.05)
    spine.tail = (0, 0, 1.25)
    spine.parent = hips

    chest = eb.new("chest")
    chest.head = (0, 0, 1.25)
    chest.tail = (0, 0, 1.50)
    chest.parent = spine

    neck = eb.new("neck")
    neck.head = (0, 0, 1.50)
    neck.tail = (0, 0, 1.62)
    neck.parent = chest

    head = eb.new("head")
    head.head = (0, 0, 1.62)
    head.tail = (0, 0, 1.86)
    head.parent = neck

    jaw = eb.new("jaw")
    jaw.head = (0, -0.06, 1.65)
    jaw.tail = (0, -0.12, 1.62)
    jaw.parent = head

    # Left arm
    sh_l = eb.new("shoulder.L")
    sh_l.head = (0.05, 0, 1.48)
    sh_l.tail = (0.18, 0, 1.46)
    sh_l.parent = chest

    ua_l = eb.new("upper_arm.L")
    ua_l.head = (0.18, 0, 1.46)
    ua_l.tail = (0.38, 0.02, 1.22)
    ua_l.parent = sh_l

    fa_l = eb.new("forearm.L")
    fa_l.head = (0.38, 0.02, 1.22)
    fa_l.tail = (0.44, -0.16, 0.98)
    fa_l.parent = ua_l

    hand_l = eb.new("hand.L")
    hand_l.head = (0.44, -0.16, 0.98)
    hand_l.tail = (0.48, -0.24, 0.90)
    hand_l.parent = fa_l

    # Right arm
    sh_r = eb.new("shoulder.R")
    sh_r.head = (-0.05, 0, 1.48)
    sh_r.tail = (-0.18, 0, 1.46)
    sh_r.parent = chest

    ua_r = eb.new("upper_arm.R")
    ua_r.head = (-0.18, 0, 1.46)
    ua_r.tail = (-0.38, 0.02, 1.22)
    ua_r.parent = sh_r

    fa_r = eb.new("forearm.R")
    fa_r.head = (-0.38, 0.02, 1.22)
    fa_r.tail = (-0.44, -0.16, 0.98)
    fa_r.parent = ua_r

    hand_r = eb.new("hand.R")
    hand_r.head = (-0.44, -0.16, 0.98)
    hand_r.tail = (-0.48, -0.24, 0.90)
    hand_r.parent = fa_r

    # Legs & Sari Skirt
    thigh_l = eb.new("thigh.L")
    thigh_l.head = (0.12, 0, 0.85)
    thigh_l.tail = (0.12, 0, 0.45)
    thigh_l.parent = hips

    calf_l = eb.new("calf.L")
    calf_l.head = (0.12, 0, 0.45)
    calf_l.tail = (0.12, 0, 0.10)
    calf_l.parent = thigh_l

    foot_l = eb.new("foot.L")
    foot_l.head = (0.12, 0, 0.10)
    foot_l.tail = (0.12, -0.15, 0.02)
    foot_l.parent = calf_l

    thigh_r = eb.new("thigh.R")
    thigh_r.head = (-0.12, 0, 0.85)
    thigh_r.tail = (-0.12, 0, 0.45)
    thigh_r.parent = hips

    calf_r = eb.new("calf.R")
    calf_r.head = (-0.12, 0, 0.45)
    calf_r.tail = (-0.12, 0, 0.10)
    calf_r.parent = thigh_r

    foot_r = eb.new("foot.R")
    foot_r.head = (-0.12, 0, 0.10)
    foot_r.tail = (-0.12, -0.15, 0.02)
    foot_r.parent = calf_r

    skirt_f = eb.new("skirt.front")
    skirt_f.head = (0, -0.14, 0.85)
    skirt_f.tail = (0, -0.18, 0.20)
    skirt_f.parent = hips

    skirt_b = eb.new("skirt.back")
    skirt_b.head = (0, 0.14, 0.85)
    skirt_b.tail = (0, 0.18, 0.20)
    skirt_b.parent = hips

    aura_bone = eb.new("aura_crown")
    aura_bone.head = (0, 0.14, 1.70)
    aura_bone.tail = (0, 0.16, 2.15)
    aura_bone.parent = chest

    bpy.ops.object.mode_set(mode='OBJECT')

    # 2. Character Mesh
    mesh_data = bpy.data.meshes.new("Tara_Mesh")
    mesh_obj = bpy.data.objects.new("Tara_Body", mesh_data)
    bpy.context.scene.collection.objects.link(mesh_obj)

    bm = bmesh.new()

    # (A) Flowing Sari Skirt (Cylindrical rings with pleat flares from z=0.05 to z=0.92)
    skirt_rings = 10
    skirt_segs = 16
    skirt_verts = []
    for r in range(skirt_rings):
        t = r / (skirt_rings - 1)
        z = 0.05 + t * 0.85
        # Flair out toward the hem
        radius = 0.44 * (1.0 - t * 0.42)
        ring = []
        for s in range(skirt_segs):
            ang = s * 2.0 * math.pi / skirt_segs
            # Front pleat ripple
            ripple = 0.04 * math.sin(ang * 4) if (math.sin(ang) < 0) else 0.0
            x = math.cos(ang) * (radius + ripple)
            y = math.sin(ang) * (radius * 0.85 + ripple)
            v = bm.verts.new((x, y, z))
            ring.append(v)
        skirt_verts.append(ring)

    for r in range(skirt_rings - 1):
        for s in range(skirt_segs):
            nxt = (s + 1) % skirt_segs
            f = bm.faces.new((skirt_verts[r][s], skirt_verts[r][nxt],
                              skirt_verts[r+1][nxt], skirt_verts[r+1][s]))
            f.material_index = 1 # Mat_TaraSilk

    # (B) Torso & Waist (Sari pallu draped over golden choli bodice, z=0.90 to z=1.52)
    torso_rings = 7
    torso_segs = 14
    torso_verts = []
    for r in range(torso_rings):
        t = r / (torso_rings - 1)
        z = 0.90 + t * 0.60
        # Slender waist flaring to chest and shoulders
        rx = 0.22 + 0.08 * math.sin(t * math.pi)
        ry = 0.16 + 0.06 * math.sin(t * math.pi)
        ring = []
        for s in range(torso_segs):
            ang = s * 2.0 * math.pi / torso_segs
            x = math.cos(ang) * rx
            y = math.sin(ang) * ry
            # Bust contour
            if t > 0.45 and t < 0.75 and math.sin(ang) < -0.3:
                y -= 0.07 * (1.0 - abs(math.cos(ang)))
            v = bm.verts.new((x, y, z))
            ring.append(v)
        torso_verts.append(ring)

    for r in range(torso_rings - 1):
        for s in range(torso_segs):
            nxt = (s + 1) % torso_segs
            f = bm.faces.new((torso_verts[r][s], torso_verts[r][nxt],
                              torso_verts[r+1][nxt], torso_verts[r+1][s]))
            # Lower waist gold belt, mid silk pallu, top skin
            if r == 0:
                f.material_index = 2 # Mat_TaraGold
            elif r < 4:
                f.material_index = 1 # Mat_TaraSilk
            else:
                f.material_index = 0 # Mat_TaraSkin

    # (C) Neck & Divine Face (z=1.50 to z=1.85)
    neck_ring = []
    for s in range(12):
        ang = s * 2.0 * math.pi / 12
        v = bm.verts.new((math.cos(ang) * 0.09, math.sin(ang) * 0.09, 1.54))
        neck_ring.append(v)

    head_segs = 12
    head_rings = 6
    head_verts = []
    for r in range(head_rings):
        t = r / (head_rings - 1)
        z = 1.60 + t * 0.24
        # Oval feminine face profile
        rx = 0.15 * math.sin(t * math.pi * 0.85 + 0.2)
        ry = 0.17 * math.sin(t * math.pi * 0.85 + 0.2)
        ring = []
        for s in range(head_segs):
            ang = s * 2.0 * math.pi / head_segs
            x = math.cos(ang) * rx
            y = math.sin(ang) * ry
            # Chin tapering
            if t < 0.25 and math.sin(ang) < 0:
                y *= 0.75
                x *= 0.85
            v = bm.verts.new((x, y, z))
            ring.append(v)
        head_verts.append(ring)

    for s in range(12):
        nxt = (s + 1) % 12
        f = bm.faces.new((neck_ring[s], neck_ring[nxt], head_verts[0][nxt], head_verts[0][s]))
        f.material_index = 0 # Mat_TaraSkin

    for r in range(head_rings - 1):
        for s in range(head_segs):
            nxt = (s + 1) % head_segs
            f = bm.faces.new((head_verts[r][s], head_verts[r][nxt],
                              head_verts[r+1][nxt], head_verts[r+1][s]))
            f.material_index = 0 # Mat_TaraSkin

    # (D) Hair Juda & Back Locks
    hair_bun = bm.verts.new((0, 0.16, 1.76))
    for s in range(8):
        ang = s * 2.0 * math.pi / 8
        h1 = bm.verts.new((math.cos(ang) * 0.14, 0.12 + math.sin(ang) * 0.10, 1.76))
        h2 = bm.verts.new((math.cos(ang + 0.4) * 0.14, 0.12 + math.sin(ang + 0.4) * 0.10, 1.76))
        f = bm.faces.new((hair_bun, h1, h2))
        f.material_index = 4 # Mat_TaraHair

    # (E) Mukuta Temple Crown (z=1.82 to z=2.22)
    crown_base_z = 1.82
    crown_tiers = 4
    for tier in range(crown_tiers):
        t = tier / crown_tiers
        z1 = crown_base_z + t * 0.36
        z2 = crown_base_z + (t + 0.22) * 0.36
        r1 = 0.16 * (1.0 - t * 0.75)
        r2 = 0.13 * (1.0 - (t + 0.22) * 0.75)
        for s in range(8):
            ang1 = s * 2.0 * math.pi / 8
            ang2 = (s + 1) * 2.0 * math.pi / 8
            v1 = bm.verts.new((math.cos(ang1) * r1, math.sin(ang1) * r1 - 0.02, z1))
            v2 = bm.verts.new((math.cos(ang2) * r1, math.sin(ang2) * r1 - 0.02, z1))
            v3 = bm.verts.new((math.cos(ang2) * r2, math.sin(ang2) * r2 - 0.02, z2))
            v4 = bm.verts.new((math.cos(ang1) * r2, math.sin(ang1) * r2 - 0.02, z2))
            f = bm.faces.new((v1, v2, v3, v4))
            f.material_index = 2 # Mat_TaraGold

    # (F) Arms & Mudra Hands
    # Left Arm
    for arm_side, side_sign in [("L", 1.0), ("R", -1.0)]:
        arm_base_x = 0.22 * side_sign
        elbow_x = 0.38 * side_sign
        hand_x = 0.44 * side_sign
        
        # Shoulder joint
        sh_v1 = bm.verts.new((arm_base_x, -0.06, 1.48))
        sh_v2 = bm.verts.new((arm_base_x + 0.08 * side_sign, -0.06, 1.46))
        sh_v3 = bm.verts.new((arm_base_x + 0.08 * side_sign, 0.06, 1.46))
        sh_v4 = bm.verts.new((arm_base_x, 0.06, 1.48))
        f_sh = bm.faces.new((sh_v1, sh_v2, sh_v3, sh_v4))
        f_sh.material_index = 2 # Golden armlet (Keyura)

        # Upper arm cylinder
        ua_v1 = bm.verts.new((elbow_x, -0.05, 1.24))
        ua_v2 = bm.verts.new((elbow_x + 0.05 * side_sign, -0.04, 1.24))
        ua_v3 = bm.verts.new((elbow_x + 0.05 * side_sign, 0.05, 1.24))
        ua_v4 = bm.verts.new((elbow_x, 0.05, 1.24))
        f_ua1 = bm.faces.new((sh_v1, sh_v2, ua_v2, ua_v1))
        f_ua2 = bm.faces.new((sh_v2, sh_v3, ua_v3, ua_v2))
        f_ua3 = bm.faces.new((sh_v3, sh_v4, ua_v4, ua_v3))
        f_ua4 = bm.faces.new((sh_v4, sh_v1, ua_v1, ua_v4))
        for f in [f_ua1, f_ua2, f_ua3, f_ua4]:
            f.material_index = 0 # Mat_TaraSkin

        # Forearm & Wrist Bangles
        wr_v1 = bm.verts.new((hand_x, -0.16, 1.02))
        wr_v2 = bm.verts.new((hand_x + 0.04 * side_sign, -0.16, 1.02))
        wr_v3 = bm.verts.new((hand_x + 0.04 * side_sign, -0.08, 1.02))
        wr_v4 = bm.verts.new((hand_x, -0.08, 1.02))
        f_fa1 = bm.faces.new((ua_v1, ua_v2, wr_v2, wr_v1))
        f_fa2 = bm.faces.new((ua_v2, ua_v3, wr_v3, wr_v2))
        f_fa3 = bm.faces.new((ua_v3, ua_v4, wr_v4, wr_v3))
        f_fa4 = bm.faces.new((ua_v4, ua_v1, wr_v1, wr_v4))
        for f in [f_fa1, f_fa2, f_fa3, f_fa4]:
            f.material_index = 0 # Mat_TaraSkin

        # Mudra Palm & Fingers
        h_tip = bm.verts.new((hand_x + 0.02 * side_sign, -0.26, 0.94))
        f_h1 = bm.faces.new((wr_v1, wr_v2, h_tip))
        f_h2 = bm.faces.new((wr_v2, wr_v3, h_tip))
        f_h3 = bm.faces.new((wr_v3, wr_v4, h_tip))
        f_h4 = bm.faces.new((wr_v4, wr_v1, h_tip))
        for f in [f_h1, f_h2, f_h3, f_h4]:
            f.material_index = 0 # Mat_TaraSkin

    # (G) Prana Mandala Halo (Floating Aura Disc behind upper body/head, z=1.75, y=0.18)
    halo_center = bm.verts.new((0, 0.20, 1.76))
    halo_segs = 16
    halo_r_inner = 0.55
    halo_r_outer = 0.88
    halo_inner_verts = []
    halo_outer_verts = []
    for s in range(halo_segs):
        ang = s * 2.0 * math.pi / halo_segs
        hx_in = math.cos(ang) * halo_r_inner
        hz_in = 1.76 + math.sin(ang) * halo_r_inner
        hx_out = math.cos(ang) * halo_r_outer
        hz_out = 1.76 + math.sin(ang) * halo_r_outer
        halo_inner_verts.append(bm.verts.new((hx_in, 0.20, hz_in)))
        halo_outer_verts.append(bm.verts.new((hx_out, 0.20, hz_out)))

    for s in range(halo_segs):
        nxt = (s + 1) % halo_segs
        f1 = bm.faces.new((halo_center, halo_inner_verts[s], halo_inner_verts[nxt]))
        f2 = bm.faces.new((halo_inner_verts[s], halo_outer_verts[s], halo_outer_verts[nxt], halo_inner_verts[nxt]))
        f1.material_index = 3 # Mat_TaraAura
        f2.material_index = 3 # Mat_TaraAura

    bm.to_mesh(mesh_data)
    bm.free()

    # Assign Materials to Mesh
    mesh_data.materials.append(mat_skin) # 0
    mesh_data.materials.append(mat_silk) # 1
    mesh_data.materials.append(mat_gold) # 2
    mesh_data.materials.append(mat_aura) # 3
    mesh_data.materials.append(mat_hair) # 4

    # Vertex Groups & Weighting
    for b in arm_data.bones:
        mesh_obj.vertex_groups.new(name=b.name)

    def assign_weight(vg_name, v_idx, weight):
        if vg_name in mesh_obj.vertex_groups:
            mesh_obj.vertex_groups[vg_name].add([v_idx], weight, 'REPLACE')

    for v in mesh_data.vertices:
        z = v.co.z
        x = v.co.x
        y = v.co.y

        # Halo check
        if abs(y - 0.20) < 0.02 and z > 1.2:
            assign_weight("aura_crown", v.index, 1.0)
            continue

        # Mukuta crown / head check
        if z > 1.82:
            assign_weight("head", v.index, 1.0)
        elif z > 1.62:
            if y < -0.06 and z < 1.68:
                assign_weight("jaw", v.index, 0.8)
                assign_weight("head", v.index, 0.2)
            else:
                assign_weight("head", v.index, 0.9)
                assign_weight("neck", v.index, 0.1)
        elif z > 1.50:
            assign_weight("neck", v.index, 0.8)
            assign_weight("chest", v.index, 0.2)
        elif z > 1.25:
            # Check arms vs chest
            if abs(x) > 0.35:
                side = "L" if x > 0 else "R"
                if z < 1.15:
                    assign_weight(f"hand.{side}", v.index, 0.9)
                elif z < 1.30:
                    assign_weight(f"forearm.{side}", v.index, 0.85)
                else:
                    assign_weight(f"upper_arm.{side}", v.index, 0.85)
            elif abs(x) > 0.18:
                side = "L" if x > 0 else "R"
                assign_weight(f"shoulder.{side}", v.index, 0.6)
                assign_weight("chest", v.index, 0.4)
            else:
                assign_weight("chest", v.index, 0.8)
                assign_weight("spine", v.index, 0.2)
        elif z > 1.05:
            assign_weight("spine", v.index, 0.7)
            assign_weight("chest", v.index, 0.3)
        elif z > 0.85:
            assign_weight("hips", v.index, 0.8)
            assign_weight("spine", v.index, 0.2)
        else:
            # Skirt / lower body
            if y < -0.08:
                assign_weight("skirt.front", v.index, 0.7)
                assign_weight("hips", v.index, 0.3)
            elif y > 0.08:
                assign_weight("skirt.back", v.index, 0.7)
                assign_weight("hips", v.index, 0.3)
            else:
                side = "L" if x > 0 else "R"
                if z < 0.2:
                    assign_weight(f"foot.{side}", v.index, 0.8)
                elif z < 0.5:
                    assign_weight(f"calf.{side}", v.index, 0.7)
                else:
                    assign_weight(f"thigh.{side}", v.index, 0.7)
                    assign_weight("hips", v.index, 0.3)

    # Armature modifier
    mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj
    mesh_obj.parent = arm_obj

    # 3. Authored Animations
    # (1) idle (2.4s ethereal floating levitation)
    add_action(arm_obj, "idle", 2.4, {
        "spine": [(0.0, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(0.04, 0, 0)), (2.4, euler_to_quat(0, 0, 0))],
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(-0.03, 0, 0)), (2.4, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(0.03, 0.04, 0.02)), (2.4, euler_to_quat(0, 0, 0))],
        "shoulder.L": [(0.0, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(0.02, 0, 0.03)), (2.4, euler_to_quat(0, 0, 0))],
        "shoulder.R": [(0.0, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(0.02, 0, -0.03)), (2.4, euler_to_quat(0, 0, 0))],
        "aura_crown": [(0.0, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(0, 0.08, 0.05)), (2.4, euler_to_quat(0, 0, 0))],
        "skirt.front": [(0.0, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(0.06, 0, 0)), (2.4, euler_to_quat(0, 0, 0))],
        "skirt.back": [(0.0, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(-0.06, 0, 0)), (2.4, euler_to_quat(0, 0, 0))],
    }, {
        "root": [(0.0, (0, 0, 0)), (1.2, (0, 0, 0.14)), (2.4, (0, 0, 0))]
    })

    # (2) talk_oracle (3.0s oracular teaching & guiding gestures)
    add_action(arm_obj, "talk_oracle", 3.0, {
        "spine": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(-0.05, 0.04, 0)), (1.8, euler_to_quat(0.04, -0.03, 0)), (3.0, euler_to_quat(0, 0, 0))],
        "neck": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(0.04, -0.06, 0)), (1.8, euler_to_quat(-0.03, 0.05, 0)), (3.0, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(0.06, 0.08, 0.04)), (1.8, euler_to_quat(-0.04, -0.06, -0.02)), (3.0, euler_to_quat(0, 0, 0))],
        "jaw": [(0.0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(0.12, 0, 0)), (0.9, euler_to_quat(0.02, 0, 0)), (1.4, euler_to_quat(0.15, 0, 0)), (2.0, euler_to_quat(0.04, 0, 0)), (2.5, euler_to_quat(0.10, 0, 0)), (3.0, euler_to_quat(0, 0, 0))],
        "shoulder.L": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(-0.15, 0.1, 0.15)), (2.0, euler_to_quat(-0.1, 0.05, 0.1)), (3.0, euler_to_quat(0, 0, 0))],
        "upper_arm.L": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(-0.35, 0.2, 0.2)), (2.0, euler_to_quat(-0.25, 0.15, 0.15)), (3.0, euler_to_quat(0, 0, 0))],
        "forearm.L": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(-0.4, 0.3, 0)), (2.0, euler_to_quat(-0.25, 0.15, 0)), (3.0, euler_to_quat(0, 0, 0))],
        "hand.L": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(0.25, 0.2, 0.1)), (2.0, euler_to_quat(0.15, 0.1, 0)), (3.0, euler_to_quat(0, 0, 0))],
        "shoulder.R": [(0.0, euler_to_quat(0, 0, 0)), (1.5, euler_to_quat(0.08, 0, -0.06)), (3.0, euler_to_quat(0, 0, 0))],
        "upper_arm.R": [(0.0, euler_to_quat(0, 0, 0)), (1.5, euler_to_quat(-0.15, 0, -0.1)), (3.0, euler_to_quat(0, 0, 0))],
        "forearm.R": [(0.0, euler_to_quat(0, 0, 0)), (1.5, euler_to_quat(-0.2, 0, 0)), (3.0, euler_to_quat(0, 0, 0))],
        "aura_crown": [(0.0, euler_to_quat(0, 0, 0)), (1.5, euler_to_quat(0, 0.15, 0.1)), (3.0, euler_to_quat(0, 0, 0))],
    })

    # (3) bless_astra (2.5s divine astra empowerment benediction)
    add_action(arm_obj, "bless_astra", 2.5, {
        "spine": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.12, 0, 0)), (2.0, euler_to_quat(0.06, 0, 0)), (2.5, euler_to_quat(0, 0, 0))],
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.15, 0, 0)), (2.0, euler_to_quat(0.08, 0, 0)), (2.5, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.22, 0, 0)), (2.0, euler_to_quat(-0.1, 0, 0)), (2.5, euler_to_quat(0, 0, 0))],
        "shoulder.L": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.35, 0.2, 0.4)), (2.0, euler_to_quat(-0.1, 0.05, 0.1)), (2.5, euler_to_quat(0, 0, 0))],
        "upper_arm.L": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.7, 0.3, 0.5)), (2.0, euler_to_quat(-0.2, 0.1, 0.15)), (2.5, euler_to_quat(0, 0, 0))],
        "forearm.L": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.6, 0, 0)), (2.0, euler_to_quat(-0.15, 0, 0)), (2.5, euler_to_quat(0, 0, 0))],
        "hand.L": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.4, 0.2, 0)), (2.0, euler_to_quat(0.1, 0, 0)), (2.5, euler_to_quat(0, 0, 0))],
        "shoulder.R": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.35, -0.2, -0.4)), (2.0, euler_to_quat(-0.1, -0.05, -0.1)), (2.5, euler_to_quat(0, 0, 0))],
        "upper_arm.R": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.7, -0.3, -0.5)), (2.0, euler_to_quat(-0.2, -0.1, -0.15)), (2.5, euler_to_quat(0, 0, 0))],
        "forearm.R": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.6, 0, 0)), (2.0, euler_to_quat(-0.15, 0, 0)), (2.5, euler_to_quat(0, 0, 0))],
        "hand.R": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.4, -0.2, 0)), (2.0, euler_to_quat(0.1, 0, 0)), (2.5, euler_to_quat(0, 0, 0))],
        "aura_crown": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0, 0.4, 0.3)), (2.5, euler_to_quat(0, 0, 0))],
    }, {
        "root": [(0.0, (0, 0, 0)), (1.0, (0, 0, 0.25)), (2.5, (0, 0, 0))]
    })

    # (4) warning_alert (2.0s urgency & pointing toward cosmic danger)
    add_action(arm_obj, "warning_alert", 2.0, {
        "spine": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(0.1, -0.12, 0)), (1.5, euler_to_quat(0.06, -0.08, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(-0.1, 0.25, 0)), (1.5, euler_to_quat(-0.06, 0.18, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "shoulder.R": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(-0.4, -0.2, -0.3)), (1.5, euler_to_quat(-0.35, -0.15, -0.25)), (2.0, euler_to_quat(0, 0, 0))],
        "upper_arm.R": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(-0.85, -0.3, -0.2)), (1.5, euler_to_quat(-0.8, -0.25, -0.15)), (2.0, euler_to_quat(0, 0, 0))],
        "forearm.R": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(-0.3, 0, 0)), (1.5, euler_to_quat(-0.25, 0, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "hand.R": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(0.4, -0.2, 0)), (1.5, euler_to_quat(0.35, -0.15, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "shoulder.L": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(0.1, 0.1, 0.2)), (2.0, euler_to_quat(0, 0, 0))],
        "upper_arm.L": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(-0.25, 0.15, 0.2)), (2.0, euler_to_quat(0, 0, 0))],
        "forearm.L": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(-0.4, 0, 0)), (2.0, euler_to_quat(0, 0, 0))],
    })

    # Export to GLTF/GLB
    out_path = os.path.join(NPC_DIR, "devi_tara.glb")
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
    print(f"Exported Devi Tara: {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == "__main__":
    print("Building Devi Tara Production Character...")
    build_devi_tara()
    print("Devi Tara build complete!")
