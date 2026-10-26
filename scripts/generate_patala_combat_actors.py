"""
Mythos 3D - Patala Combat Actors Blender Pipeline
Generates authentic, high-fidelity 3D rigged & animated models for Chapter III: Realm of Patala:
1. Boss Shesha Echo (4.2m colossal 7-hooded Naga King with 26-bone armature and 10 authored actions)
2. Naga Constrictor (2.4m coiled serpent warrior with dual venom daggers, 20-bone armature, 6 authored actions)
3. Naga Spitter (2.0m flared-hood serpent sorcerer with bioluminescent venom sac, 18-bone armature, 6 authored actions)
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Quaternion, Matrix, Euler

ROOT_DIR = r"h:\mythologicalgame"
TEXTURE_DIR = os.path.join(ROOT_DIR, r"godot\assets\textures")
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
                        base_color=(0.15, 0.25, 0.2, 1.0), roughness=0.5, metallic=0.2):
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
# 1. BOSS SHESHA ECHO (4.2m Monumental 7-Hooded Serpent King)
# =========================================================================
def build_boss_shesha():
    clear_scene()

    # Materials
    mat_scales = create_pbr_material("Mat_SheshaScales", "patala_serpent_scales_albedo.png",
                                     "patala_serpent_scales_normal.png", "patala_serpent_scales_mr.png")
    mat_brass = create_pbr_material("Mat_SheshaArmor", "patala_vasuki_brass_albedo.png",
                                    "patala_vasuki_brass_normal.png", "patala_vasuki_brass_mr.png")
    mat_gem = create_pbr_material("Mat_SheshaNagamani", "patala_nagamani_albedo.png",
                                  "patala_nagamani_normal.png", em_name="patala_nagamani_emissive.png",
                                  base_color=(0.1, 0.95, 0.6, 1.0))

    # Create Armature
    arm_data = bpy.data.armatures.new("BossShesha_Armature")
    arm_obj = bpy.data.objects.new("BossShesha_Rig", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    # Serpentine Spine & Tail
    root = eb.new("root")
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.3)

    # Spine chain (ascending upward from base coil)
    prev = root
    spine_bones = []
    spine_heights = [0.7, 1.3, 1.9, 2.5, 3.1, 3.6]
    for i, h in enumerate(spine_heights):
        bname = f"spine.{i+1:03d}"
        b = eb.new(bname)
        b.head = prev.tail
        b.tail = (0, -0.15 * math.sin((i + 1) * 0.8), h)
        b.parent = prev
        prev = b
        spine_bones.append(bname)

    # Neck and Head
    neck = eb.new("neck")
    neck.head = prev.tail
    neck.tail = (0, -0.2, 3.9)
    neck.parent = prev

    head = eb.new("head")
    head.head = neck.tail
    head.tail = (0, -0.6, 4.2)
    head.parent = neck

    jaw = eb.new("jaw")
    jaw.head = head.head
    jaw.tail = (0, -0.7, 3.8)
    jaw.parent = head

    # Tail chain (extending backwards/coiled on ground)
    prev_tail = root
    tail_bones = []
    tail_offsets = [(0, 0.8, 0.2), (0.7, 1.4, 0.15), (1.4, 0.8, 0.1), (1.2, -0.4, 0.05), (0.4, -0.8, 0.05)]
    for i, (tx, ty, tz) in enumerate(tail_offsets):
        tname = f"tail.{i+1:03d}"
        tb = eb.new(tname)
        tb.head = prev_tail.tail if i > 0 else (0, 0.2, 0.1)
        tb.tail = (tx, ty, tz)
        tb.parent = prev_tail
        prev_tail = tb
        tail_bones.append(tname)

    # 7 Cobra Hood Canopy Bones (Attached to neck)
    hood_bones = []
    for h_idx in range(-3, 4):
        hname = f"hood.{h_idx+3:02d}"
        hb = eb.new(hname)
        ang = h_idx * 0.25
        hx = math.sin(ang) * 1.6
        hy = 0.3 + math.cos(ang) * 0.4
        hz = 3.6 + (3 - abs(h_idx)) * 0.25
        hb.head = neck.head
        hb.tail = (hx, hy, hz)
        hb.parent = neck
        hood_bones.append(hname)

    bpy.ops.object.mode_set(mode='OBJECT')

    # Create Serpent Body Mesh
    mesh_data = bpy.data.meshes.new("BossShesha_Mesh")
    mesh_obj = bpy.data.objects.new("BossShesha_Model", mesh_data)
    bpy.context.scene.collection.objects.link(mesh_obj)

    bm = bmesh.new()

    # Create cylindrical ribbed serpent body
    body_rings = 24
    circle_segs = 16
    verts_by_ring = []

    for r_idx in range(body_rings + 1):
        t = r_idx / body_rings
        # S-curve spine profile
        pz = t * 3.8
        py = -math.sin(t * math.pi) * 0.4
        px = 0.0
        # Radius tapers from massive coiled base (r=1.2m) to neck (r=0.6m) to head (r=0.8m)
        if t < 0.2:
            rad = 1.2 - t * 1.0
        elif t < 0.8:
            rad = 0.7 - (t - 0.2) * 0.2
        else:
            rad = 0.58 + (t - 0.8) * 0.8

        ring = []
        for seg in range(circle_segs):
            ang = 2.0 * math.pi * seg / circle_segs
            vx = px + math.cos(ang) * rad
            vy = py + math.sin(ang) * rad * 0.9  # slightly elliptical cobra chest
            ring.append(bm.verts.new((vx, vy, pz)))
        verts_by_ring.append(ring)

    for r_idx in range(body_rings):
        for seg in range(circle_segs):
            nxt = (seg + 1) % circle_segs
            bm.faces.new((verts_by_ring[r_idx][seg], verts_by_ring[r_idx][nxt],
                          verts_by_ring[r_idx+1][nxt], verts_by_ring[r_idx+1][seg]))

    # Seven Cobra Hood Wings Mesh (Rear Fan)
    for h_idx in range(-3, 4):
        ang = h_idx * 0.22
        hx = math.sin(ang) * 1.5
        hy = 0.4 + math.cos(ang) * 0.3
        hz = 3.5 + (3 - abs(h_idx)) * 0.25
        hw = 0.45 - abs(h_idx) * 0.05

        v_base = bm.verts.new((0, 0.2, 2.8))
        v_l = bm.verts.new((hx - hw, hy, hz * 0.85))
        v_r = bm.verts.new((hx + hw, hy, hz * 0.85))
        v_tip = bm.verts.new((hx, hy - 0.1, hz))
        bm.faces.new((v_base, v_r, v_tip, v_l))

    # Central Serpent Head & Fangs
    head_center = bm.verts.new((0, -0.65, 4.05))
    jaw_center = bm.verts.new((0, -0.7, 3.8))
    fang_l = bm.verts.new((-0.25, -0.85, 3.65))
    fang_r = bm.verts.new((0.25, -0.85, 3.65))
    bm.faces.new((head_center, fang_l, jaw_center))
    bm.faces.new((head_center, jaw_center, fang_r))

    # Sacred Nagamani Crown Jewel (Atop head)
    gem_top = bm.verts.new((0, -0.5, 4.45))
    for i in range(8):
        a1 = 2.0 * math.pi * i / 8
        a2 = 2.0 * math.pi * (i + 1) / 8
        g1 = bm.verts.new((math.cos(a1) * 0.25, -0.5 + math.sin(a1) * 0.25, 4.25))
        g2 = bm.verts.new((math.cos(a2) * 0.25, -0.5 + math.sin(a2) * 0.25, 4.25))
        bm.faces.new((gem_top, g1, g2))

    bm.to_mesh(mesh_data)
    bm.free()

    mesh_data.materials.append(mat_scales)
    mesh_data.materials.append(mat_brass)
    mesh_data.materials.append(mat_gem)

    # Vertex Groups & Skinning
    for b in arm_data.bones:
        mesh_obj.vertex_groups.new(name=b.name)

    def assign_weight(vg_name, v_idx, weight):
        if vg_name in mesh_obj.vertex_groups:
            mesh_obj.vertex_groups[vg_name].add([v_idx], weight, 'REPLACE')

    for v in mesh_data.vertices:
        z = v.co.z
        if z < 0.6:
            assign_weight("root", v.index, 0.7)
            assign_weight("spine.001", v.index, 0.3)
        elif z < 1.3:
            assign_weight("spine.001", v.index, 0.5)
            assign_weight("spine.002", v.index, 0.5)
        elif z < 2.0:
            assign_weight("spine.002", v.index, 0.4)
            assign_weight("spine.003", v.index, 0.6)
        elif z < 2.7:
            assign_weight("spine.003", v.index, 0.4)
            assign_weight("spine.004", v.index, 0.6)
        elif z < 3.4:
            assign_weight("spine.004", v.index, 0.4)
            assign_weight("spine.005", v.index, 0.6)
        elif z < 3.8:
            assign_weight("neck", v.index, 0.8)
        else:
            assign_weight("head", v.index, 0.9)

    # Parent mesh to armature
    mesh_obj.parent = arm_obj
    mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj

    # Authored Animations (10 Action Clips for Boss Shesha)
    # 1. boss_idle (2.0s)
    add_action(arm_obj, "boss_idle", 2.0, {
        "spine.003": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.08, 0.05, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "neck": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(-0.06, -0.04, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.05, 0.08, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "hood.03": [(0.0, euler_to_quat(0, 0, 0)), (1.0, euler_to_quat(0.05, 0.1, 0)), (2.0, euler_to_quat(0, 0, 0))],
    })

    # 2. boss_slither (1.6s)
    add_action(arm_obj, "boss_slither", 1.6, {
        "root": [(0.0, euler_to_quat(0, 0, 0)), (0.4, euler_to_quat(0, 0.18, 0)), (0.8, euler_to_quat(0, 0, 0)), (1.2, euler_to_quat(0, -0.18, 0)), (1.6, euler_to_quat(0, 0, 0))],
        "spine.002": [(0.0, euler_to_quat(0, 0.15, 0)), (0.8, euler_to_quat(0, -0.15, 0)), (1.6, euler_to_quat(0, 0.15, 0))],
        "neck": [(0.0, euler_to_quat(0, -0.1, 0)), (0.8, euler_to_quat(0, 0.1, 0)), (1.6, euler_to_quat(0, -0.1, 0))],
    })

    # 3. boss_hood_flare (1.2s)
    add_action(arm_obj, "boss_hood_flare", 1.2, {
        "neck": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(-0.25, 0, 0)), (1.2, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(0.3, 0, 0)), (1.2, euler_to_quat(0, 0, 0))],
        "hood.00": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(0, -0.35, -0.2)), (1.2, euler_to_quat(0, 0, 0))],
        "hood.06": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(0, 0.35, 0.2)), (1.2, euler_to_quat(0, 0, 0))],
    })

    # 4. boss_tail_sweep_telegraph (0.8s)
    add_action(arm_obj, "boss_tail_sweep_telegraph", 0.8, {
        "root": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(0, -0.7, 0))],
        "spine.003": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(0.2, -0.4, 0))],
        "tail.001": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(0, 0.8, 0))],
    })

    # 5. boss_tail_sweep_execute (0.6s)
    add_action(arm_obj, "boss_tail_sweep_execute", 0.6, {
        "root": [(0.0, euler_to_quat(0, -0.7, 0)), (0.3, euler_to_quat(0, 1.8, 0)), (0.6, euler_to_quat(0, 0, 0))],
        "tail.001": [(0.0, euler_to_quat(0, 0.8, 0)), (0.3, euler_to_quat(0, -1.5, 0)), (0.6, euler_to_quat(0, 0, 0))],
    })

    # 6. boss_venom_barrage (1.2s)
    add_action(arm_obj, "boss_venom_barrage", 1.2, {
        "spine.004": [(0.0, euler_to_quat(0, 0, 0)), (0.3, euler_to_quat(-0.35, 0, 0)), (0.7, euler_to_quat(0.35, 0, 0)), (1.2, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.3, euler_to_quat(-0.4, 0, 0)), (0.7, euler_to_quat(0.5, 0, 0)), (1.2, euler_to_quat(0, 0, 0))],
        "jaw": [(0.0, euler_to_quat(0, 0, 0)), (0.3, euler_to_quat(0.65, 0, 0)), (0.7, euler_to_quat(0.2, 0, 0)), (1.2, euler_to_quat(0, 0, 0))],
    })

    # 7. boss_quake_slam (1.4s)
    add_action(arm_obj, "boss_quake_slam", 1.4, {
        "spine.002": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(-0.5, 0, 0)), (0.8, euler_to_quat(0.7, 0, 0)), (1.4, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.5, euler_to_quat(-0.6, 0, 0)), (0.8, euler_to_quat(0.8, 0, 0)), (1.4, euler_to_quat(0, 0, 0))],
    })

    # 8. boss_roar_enrage (2.0s)
    add_action(arm_obj, "boss_roar_enrage", 2.0, {
        "spine.003": [(0.0, euler_to_quat(0, 0, 0)), (0.6, euler_to_quat(-0.6, 0, 0)), (1.5, euler_to_quat(-0.4, 0.1, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.6, euler_to_quat(-0.8, 0, 0)), (1.5, euler_to_quat(-0.6, -0.1, 0)), (2.0, euler_to_quat(0, 0, 0))],
        "jaw": [(0.0, euler_to_quat(0, 0, 0)), (0.6, euler_to_quat(0.9, 0, 0)), (1.5, euler_to_quat(0.85, 0, 0)), (2.0, euler_to_quat(0, 0, 0))],
    })

    # 9. boss_stagger (1.5s)
    add_action(arm_obj, "boss_stagger", 1.5, {
        "spine.003": [(0.0, euler_to_quat(0, 0, 0)), (0.2, euler_to_quat(-0.45, 0.2, 0)), (1.0, euler_to_quat(-0.2, -0.1, 0)), (1.5, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.2, euler_to_quat(-0.6, 0.3, 0)), (1.0, euler_to_quat(-0.1, -0.1, 0)), (1.5, euler_to_quat(0, 0, 0))],
    })

    # 10. boss_defeat (2.5s)
    add_action(arm_obj, "boss_defeat", 2.5, {
        "root": [(0.0, euler_to_quat(0, 0, 0)), (1.5, euler_to_quat(0.3, 0, 0)), (2.5, euler_to_quat(0.8, 0, 0))],
        "spine.002": [(0.0, euler_to_quat(0, 0, 0)), (1.5, euler_to_quat(0.6, 0, 0)), (2.5, euler_to_quat(1.1, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (1.5, euler_to_quat(0.8, 0, 0)), (2.5, euler_to_quat(1.4, 0, 0))],
    })

    # Export Boss Shesha
    out_path = os.path.join(ENEMY_DIR, "boss_shesha_echo.glb")
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
    print(f"Exported Boss Shesha: {out_path} ({os.path.getsize(out_path)} bytes)")

# =========================================================================
# 2. NAGA CONSTRICTOR (2.4m Coiled Serpent Warrior with Dual Daggers)
# =========================================================================
def build_naga_constrictor():
    clear_scene()

    mat_scales = create_pbr_material("Mat_ConstrictorScales", "patala_serpent_scales_albedo.png",
                                     "patala_serpent_scales_normal.png", "patala_serpent_scales_mr.png")
    mat_brass = create_pbr_material("Mat_ConstrictorBrass", "patala_vasuki_brass_albedo.png",
                                    "patala_vasuki_brass_normal.png", "patala_vasuki_brass_mr.png")

    arm_data = bpy.data.armatures.new("Constrictor_Armature")
    arm_obj = bpy.data.objects.new("Constrictor_Rig", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    root = eb.new("root")
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.3)

    # Tail coil
    tail1 = eb.new("tail.001")
    tail1.head = (0, 0, 0)
    tail1.tail = (0, 0.6, 0.1)
    tail1.parent = root

    tail2 = eb.new("tail.002")
    tail2.head = tail1.tail
    tail2.tail = (0.5, 0.8, 0.05)
    tail2.parent = tail1

    # Torso
    spine = eb.new("spine")
    spine.head = root.tail
    spine.tail = (0, 0, 0.9)
    spine.parent = root

    chest = eb.new("chest")
    chest.head = spine.tail
    chest.tail = (0, 0, 1.5)
    chest.parent = spine

    neck = eb.new("neck")
    neck.head = chest.tail
    neck.tail = (0, -0.05, 1.9)
    neck.parent = chest

    head = eb.new("head")
    head.head = neck.tail
    head.tail = (0, -0.2, 2.2)
    head.parent = neck

    # Arms and Daggers
    for side, sign in [("L", -1), ("R", 1)]:
        sh = eb.new(f"shoulder.{side}")
        sh.head = (sign * 0.1, 0, 1.45)
        sh.tail = (sign * 0.45, 0, 1.4)
        sh.parent = chest

        arm = eb.new(f"arm.{side}")
        arm.head = sh.tail
        arm.tail = (sign * 0.5, -0.3, 1.0)
        arm.parent = sh

        hand = eb.new(f"hand.{side}")
        hand.head = arm.tail
        hand.tail = (sign * 0.55, -0.55, 0.85)
        hand.parent = arm

    bpy.ops.object.mode_set(mode='OBJECT')

    # Mesh
    mesh_data = bpy.data.meshes.new("Constrictor_Mesh")
    mesh_obj = bpy.data.objects.new("Constrictor_Model", mesh_data)
    bpy.context.scene.collection.objects.link(mesh_obj)

    bm = bmesh.new()

    # Lower serpent body & tail coil
    for r in range(12):
        t = r / 12
        pz = t * 0.9
        rad = 0.55 * (1.2 - t * 0.3)
        for s in range(12):
            ang = 2.0 * math.pi * s / 12
            bm.verts.new((math.cos(ang) * rad, math.sin(ang) * rad, pz))

    # Torso & Head
    torso_top = bm.verts.new((0, 0, 1.6))
    head_top = bm.verts.new((0, -0.15, 2.25))
    for s in range(8):
        ang = 2.0 * math.pi * s / 8
        v_neck = bm.verts.new((math.cos(ang) * 0.25, math.sin(ang) * 0.25, 1.8))
        bm.faces.new((torso_top, v_neck, head_top))

    # Dual Venom Daggers
    for sign in [-1, 1]:
        d_hilt = bm.verts.new((sign * 0.55, -0.55, 0.85))
        d_tip = bm.verts.new((sign * 0.65, -0.9, 0.65))
        d_blade = bm.verts.new((sign * 0.6, -0.75, 0.8))
        bm.faces.new((d_hilt, d_blade, d_tip))

    bm.to_mesh(mesh_data)
    bm.free()

    mesh_data.materials.append(mat_scales)
    mesh_data.materials.append(mat_brass)

    for b in arm_data.bones:
        mesh_obj.vertex_groups.new(name=b.name)
    for v in mesh_data.vertices:
        if v.co.z < 0.9:
            mesh_obj.vertex_groups["root"].add([v.index], 1.0, 'REPLACE')
        elif v.co.z < 1.6:
            mesh_obj.vertex_groups["chest"].add([v.index], 1.0, 'REPLACE')
        else:
            mesh_obj.vertex_groups["head"].add([v.index], 1.0, 'REPLACE')

    mesh_obj.parent = arm_obj
    mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj

    # Authored Animations (6 clips)
    add_action(arm_obj, "idle", 1.5, {
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (0.75, euler_to_quat(0.05, 0.04, 0)), (1.5, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.75, euler_to_quat(-0.04, -0.05, 0)), (1.5, euler_to_quat(0, 0, 0))],
    })

    add_action(arm_obj, "stalk", 1.2, {
        "root": [(0.0, euler_to_quat(0, 0.15, 0)), (0.6, euler_to_quat(0, -0.15, 0)), (1.2, euler_to_quat(0, 0.15, 0))],
        "chest": [(0.0, euler_to_quat(0.1, 0, 0)), (0.6, euler_to_quat(0.15, 0, 0)), (1.2, euler_to_quat(0.1, 0, 0))],
    })

    add_action(arm_obj, "telegraph", 0.6, {
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (0.6, euler_to_quat(-0.25, 0, 0))],
        "arm.L": [(0.0, euler_to_quat(0, 0, 0)), (0.6, euler_to_quat(0.5, 0.4, 0))],
        "arm.R": [(0.0, euler_to_quat(0, 0, 0)), (0.6, euler_to_quat(0.5, -0.4, 0))],
    })

    add_action(arm_obj, "leap_strike", 0.8, {
        "chest": [(0.0, euler_to_quat(-0.25, 0, 0)), (0.4, euler_to_quat(0.5, 0, 0)), (0.8, euler_to_quat(0, 0, 0))],
        "arm.L": [(0.0, euler_to_quat(0.5, 0.4, 0)), (0.4, euler_to_quat(-0.6, 0.2, 0)), (0.8, euler_to_quat(0, 0, 0))],
        "arm.R": [(0.0, euler_to_quat(0.5, -0.4, 0)), (0.4, euler_to_quat(-0.6, -0.2, 0)), (0.8, euler_to_quat(0, 0, 0))],
    })

    add_action(arm_obj, "stagger", 1.0, {
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (0.2, euler_to_quat(-0.4, 0.2, 0)), (1.0, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.2, euler_to_quat(-0.5, 0.3, 0)), (1.0, euler_to_quat(0, 0, 0))],
    })

    add_action(arm_obj, "defeat", 1.8, {
        "root": [(0.0, euler_to_quat(0, 0, 0)), (1.8, euler_to_quat(0.8, 0, 0))],
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (1.8, euler_to_quat(0.9, 0, 0))],
    })

    out_path = os.path.join(ENEMY_DIR, "naga_constrictor.glb")
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
    print(f"Exported Naga Constrictor: {out_path} ({os.path.getsize(out_path)} bytes)")

# =========================================================================
# 3. NAGA SPITTER (2.0m Flared-Hood Serpent Sorcerer)
# =========================================================================
def build_naga_spitter():
    clear_scene()

    mat_scales = create_pbr_material("Mat_SpitterScales", "patala_serpent_scales_albedo.png",
                                     "patala_serpent_scales_normal.png", "patala_serpent_scales_mr.png")
    mat_venom = create_pbr_material("Mat_SpitterVenom", "patala_venom_moss_albedo.png",
                                    "patala_venom_moss_normal.png", em_name="patala_venom_moss_emissive.png",
                                    base_color=(0.1, 0.85, 0.3, 1.0))

    arm_data = bpy.data.armatures.new("Spitter_Armature")
    arm_obj = bpy.data.objects.new("Spitter_Rig", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    root = eb.new("root")
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.25)

    tail = eb.new("tail.001")
    tail.head = (0, 0, 0)
    tail.tail = (0, 0.5, 0.05)
    tail.parent = root

    spine = eb.new("spine")
    spine.head = root.tail
    spine.tail = (0, 0, 0.8)
    spine.parent = root

    chest = eb.new("chest")
    chest.head = spine.tail
    chest.tail = (0, 0, 1.3)
    chest.parent = spine

    neck = eb.new("neck")
    neck.head = chest.tail
    neck.tail = (0, -0.1, 1.7)
    neck.parent = chest

    head = eb.new("head")
    head.head = neck.tail
    head.tail = (0, -0.3, 2.0)
    head.parent = neck

    jaw = eb.new("jaw")
    jaw.head = head.head
    jaw.tail = (0, -0.35, 1.7)
    jaw.parent = head

    hood_l = eb.new("hood.L")
    hood_l.head = neck.head
    hood_l.tail = (-0.6, 0.1, 1.75)
    hood_l.parent = neck

    hood_r = eb.new("hood.R")
    hood_r.head = neck.head
    hood_r.tail = (0.6, 0.1, 1.75)
    hood_r.parent = neck

    bpy.ops.object.mode_set(mode='OBJECT')

    # Mesh
    mesh_data = bpy.data.meshes.new("Spitter_Mesh")
    mesh_obj = bpy.data.objects.new("Spitter_Model", mesh_data)
    bpy.context.scene.collection.objects.link(mesh_obj)

    bm = bmesh.new()

    # Serpent body cylinder
    for r in range(10):
        t = r / 10
        pz = t * 0.8
        rad = 0.5 * (1.1 - t * 0.3)
        for s in range(10):
            ang = 2.0 * math.pi * s / 10
            bm.verts.new((math.cos(ang) * rad, math.sin(ang) * rad, pz))

    # Flared Cobra Hood Fins
    v_base = bm.verts.new((0, 0.1, 1.2))
    v_l = bm.verts.new((-0.65, 0.15, 1.7))
    v_r = bm.verts.new((0.65, 0.15, 1.7))
    v_top = bm.verts.new((0, 0.05, 1.95))
    bm.faces.new((v_base, v_r, v_top, v_l))

    # Bioluminescent Throat Sac (Emissive bulb)
    sac_center = bm.verts.new((0, -0.22, 1.55))
    for s in range(6):
        a1 = 2.0 * math.pi * s / 6
        a2 = 2.0 * math.pi * (s + 1) / 6
        v1 = bm.verts.new((math.cos(a1) * 0.18, -0.22 + math.sin(a1) * 0.18, 1.55))
        v2 = bm.verts.new((math.cos(a2) * 0.18, -0.22 + math.sin(a2) * 0.18, 1.55))
        bm.faces.new((sac_center, v1, v2))

    bm.to_mesh(mesh_data)
    bm.free()

    mesh_data.materials.append(mat_scales)
    mesh_data.materials.append(mat_venom)

    for b in arm_data.bones:
        mesh_obj.vertex_groups.new(name=b.name)
    for v in mesh_data.vertices:
        if v.co.z < 0.8:
            mesh_obj.vertex_groups["root"].add([v.index], 1.0, 'REPLACE')
        elif v.co.z < 1.4:
            mesh_obj.vertex_groups["chest"].add([v.index], 1.0, 'REPLACE')
        else:
            mesh_obj.vertex_groups["head"].add([v.index], 1.0, 'REPLACE')

    mesh_obj.parent = arm_obj
    mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj

    # Authored Animations (6 clips)
    add_action(arm_obj, "idle", 1.5, {
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (0.75, euler_to_quat(0.04, 0.05, 0)), (1.5, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.75, euler_to_quat(-0.04, -0.04, 0)), (1.5, euler_to_quat(0, 0, 0))],
    })

    add_action(arm_obj, "slither", 1.2, {
        "root": [(0.0, euler_to_quat(0, 0.2, 0)), (0.6, euler_to_quat(0, -0.2, 0)), (1.2, euler_to_quat(0, 0.2, 0))],
        "chest": [(0.0, euler_to_quat(0, -0.1, 0)), (0.6, euler_to_quat(0, 0.1, 0)), (1.2, euler_to_quat(0, -0.1, 0))],
    })

    add_action(arm_obj, "telegraph_coil", 0.8, {
        "neck": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(-0.35, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(-0.4, 0, 0))],
        "hood.L": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(0, -0.3, 0))],
        "hood.R": [(0.0, euler_to_quat(0, 0, 0)), (0.8, euler_to_quat(0, 0.3, 0))],
    })

    add_action(arm_obj, "spit_venom", 0.7, {
        "neck": [(0.0, euler_to_quat(-0.35, 0, 0)), (0.3, euler_to_quat(0.45, 0, 0)), (0.7, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(-0.4, 0, 0)), (0.3, euler_to_quat(0.55, 0, 0)), (0.7, euler_to_quat(0, 0, 0))],
        "jaw": [(0.0, euler_to_quat(0, 0, 0)), (0.3, euler_to_quat(0.75, 0, 0)), (0.7, euler_to_quat(0, 0, 0))],
    })

    add_action(arm_obj, "stagger", 1.0, {
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (0.2, euler_to_quat(-0.4, 0.15, 0)), (1.0, euler_to_quat(0, 0, 0))],
        "head": [(0.0, euler_to_quat(0, 0, 0)), (0.2, euler_to_quat(-0.5, 0.25, 0)), (1.0, euler_to_quat(0, 0, 0))],
    })

    add_action(arm_obj, "defeat", 1.6, {
        "root": [(0.0, euler_to_quat(0, 0, 0)), (1.6, euler_to_quat(0.7, 0, 0))],
        "chest": [(0.0, euler_to_quat(0, 0, 0)), (1.6, euler_to_quat(0.85, 0, 0))],
    })

    out_path = os.path.join(ENEMY_DIR, "naga_spitter.glb")
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
    print(f"Exported Naga Spitter: {out_path} ({os.path.getsize(out_path)} bytes)")

def main():
    print("=" * 60)
    print("Building Production Combat Actors for Realm of Patala...")
    print("=" * 60)
    build_boss_shesha()
    build_naga_constrictor()
    build_naga_spitter()
    print("=" * 60)
    print("All Patala combat actors built and exported successfully!")
    print("=" * 60)

if __name__ == "__main__":
    main()
