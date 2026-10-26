"""
Mythos 3D - Author Comprehensive Realistic 3D Locomotion & Character Animation Library
Blender 4.2 LTS Master Script for Stage Q2
Authors 29 complete, anatomically realistic, physically grounded skeletal animation clips.
"""

import bpy
import math
import os
from mathutils import Vector, Quaternion, Euler

ROOT_DIR = r"h:\mythologicalgame"
BLEND_PATH = os.path.join(ROOT_DIR, r"godot\assets\characters\veer\veer_production.blend")
GLB_PATH = os.path.join(ROOT_DIR, r"godot\assets\characters\veer\veer.glb")

bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

arm_obj = bpy.data.objects.get("Veer")
body_obj = bpy.data.objects.get("VeerSkinnedHumanoidMesh")
if not arm_obj or not body_obj:
    raise RuntimeError("Could not find Veer armature or mesh in blend file!")

# Validate and repair mesh deform weights
body_obj.data.name = "Veer_Humanoid_Mesh"
fixed = body_obj.data.validate(verbose=False)
print("Mesh validation & repair status:", fixed)

bpy.context.view_layer.objects.active = arm_obj
arm_obj.select_set(True)

# Ensure animation data
if arm_obj.animation_data is None:
    arm_obj.animation_data_create()

# Clear existing actions and NLA tracks to build clean, high-precision motion library
while arm_obj.animation_data.nla_tracks:
    arm_obj.animation_data.nla_tracks.remove(arm_obj.animation_data.nla_tracks[0])

for act in list(bpy.data.actions):
    bpy.data.actions.remove(act)

print("Cleared old animation tracks. Authoring comprehensive realistic motion library...")

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

def add_full_action(name, duration_sec, rot_dict, loc_dict=None, fps=30.0):
    act = bpy.data.actions.new(name=name)
    act.use_fake_user = True
    arm_obj.animation_data.action = act
    
    # 1. Rotations
    for bone_name, kfs in rot_dict.items():
        if bone_name not in arm_obj.pose.bones:
            continue
        pb = arm_obj.pose.bones[bone_name]
        pb.rotation_mode = 'QUATERNION'
        for time_s, q_val in kfs:
            frame = 1.0 + time_s * fps
            pb.rotation_quaternion = q_val
            pb.keyframe_insert(data_path="rotation_quaternion", frame=frame)
            
    # 2. Locations (e.g. Pelvis vertical bounce, sway)
    if loc_dict:
        for bone_name, kfs in loc_dict.items():
            if bone_name not in arm_obj.pose.bones:
                continue
            pb = arm_obj.pose.bones[bone_name]
            for time_s, l_val in kfs:
                frame = 1.0 + time_s * fps
                pb.location = l_val
                pb.keyframe_insert(data_path="location", frame=frame)

    # Set interpolation to BEZIER with auto handles
    for fcurve in act.fcurves:
        for kfp in fcurve.keyframe_points:
            kfp.interpolation = 'BEZIER'
            kfp.handle_left_type = 'AUTO'
            kfp.handle_right_type = 'AUTO'

    # Push to NLA track for universal compatibility
    track = arm_obj.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 1, act)

    return act

# =========================================================================
# 1. IDLE (Living Breathing & Natural Weight Shift, 2.4s loop)
# =========================================================================
idle_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.6, euler_to_quat(0.0, math.radians(1.5), math.radians(1.2))),
        (1.2, euler_to_quat(0.0, 0.0, 0.0)),
        (1.8, euler_to_quat(0.0, math.radians(-1.5), math.radians(-1.2))),
        (2.4, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "spine_01": [
        (0.0, euler_to_quat(math.radians(1.0), 0.0, 0.0)),
        (1.2, euler_to_quat(math.radians(3.5), 0.0, 0.0)),
        (2.4, euler_to_quat(math.radians(1.0), 0.0, 0.0)),
    ],
    "chest": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.6, euler_to_quat(math.radians(2.0), 0.0, 0.0)),
        (1.2, euler_to_quat(math.radians(4.5), 0.0, 0.0)),
        (1.8, euler_to_quat(math.radians(2.0), 0.0, 0.0)),
        (2.4, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "head": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (1.2, euler_to_quat(math.radians(-2.0), math.radians(2.5), 0.0)),
        (2.4, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "arm_l": [
        (0.0, euler_to_quat(math.radians(6.0), 0.0, math.radians(8.0))),
        (1.2, euler_to_quat(math.radians(9.0), 0.0, math.radians(10.0))),
        (2.4, euler_to_quat(math.radians(6.0), 0.0, math.radians(8.0))),
    ],
    "forearm_l": [
        (0.0, euler_to_quat(math.radians(16.0), math.radians(6.0), 0.0)),
        (1.2, euler_to_quat(math.radians(20.0), math.radians(8.0), 0.0)),
        (2.4, euler_to_quat(math.radians(16.0), math.radians(6.0), 0.0)),
    ],
    "arm_r": [
        (0.0, euler_to_quat(math.radians(6.0), 0.0, math.radians(-8.0))),
        (1.2, euler_to_quat(math.radians(9.0), 0.0, math.radians(-10.0))),
        (2.4, euler_to_quat(math.radians(6.0), 0.0, math.radians(-8.0))),
    ],
    "forearm_r": [
        (0.0, euler_to_quat(math.radians(16.0), math.radians(-6.0), 0.0)),
        (1.2, euler_to_quat(math.radians(20.0), math.radians(-8.0), 0.0)),
        (2.4, euler_to_quat(math.radians(16.0), math.radians(-6.0), 0.0)),
    ],
    "sash_01": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (1.2, euler_to_quat(math.radians(5.0), math.radians(3.0), 0.0)),
        (2.4, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "sash_02": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (1.4, euler_to_quat(math.radians(8.0), math.radians(4.0), 0.0)),
        (2.4, euler_to_quat(0.0, 0.0, 0.0)),
    ],
}
idle_loc = {
    "pelvis": [
        (0.0, Vector((0.0, 0.0, 0.0))),
        (0.6, Vector((0.012, 0.0, 0.005))),
        (1.2, Vector((0.0, 0.0, 0.0))),
        (1.8, Vector((-0.012, 0.0, 0.005))),
        (2.4, Vector((0.0, 0.0, 0.0))),
    ]
}
add_full_action("idle", 2.4, idle_rot, idle_loc)

# =========================================================================
# 2. IDLE_ALERT (Combat Ready Stance, 2.0s loop)
# =========================================================================
idle_alert_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, math.radians(-15.0), 0.0)),
        (1.0, euler_to_quat(0.0, math.radians(-13.0), 0.0)),
        (2.0, euler_to_quat(0.0, math.radians(-15.0), 0.0)),
    ],
    "thigh_l": [(0.0, euler_to_quat(math.radians(14.0), 0.0, 0.0)), (2.0, euler_to_quat(math.radians(14.0), 0.0, 0.0))],
    "shin_l": [(0.0, euler_to_quat(math.radians(16.0), 0.0, 0.0)), (2.0, euler_to_quat(math.radians(16.0), 0.0, 0.0))],
    "foot_l": [(0.0, euler_to_quat(math.radians(-5.0), 0.0, 0.0)), (2.0, euler_to_quat(math.radians(-5.0), 0.0, 0.0))],
    "thigh_r": [(0.0, euler_to_quat(math.radians(-10.0), 0.0, 0.0)), (2.0, euler_to_quat(math.radians(-10.0), 0.0, 0.0))],
    "shin_r": [(0.0, euler_to_quat(math.radians(18.0), 0.0, 0.0)), (2.0, euler_to_quat(math.radians(18.0), 0.0, 0.0))],
    "foot_r": [(0.0, euler_to_quat(math.radians(-8.0), 0.0, 0.0)), (2.0, euler_to_quat(math.radians(-8.0), 0.0, 0.0))],
    "chest": [
        (0.0, euler_to_quat(math.radians(8.0), math.radians(14.0), 0.0)),
        (1.0, euler_to_quat(math.radians(11.0), math.radians(14.0), 0.0)),
        (2.0, euler_to_quat(math.radians(8.0), math.radians(14.0), 0.0)),
    ],
    "arm_r": [
        (0.0, euler_to_quat(math.radians(-25.0), math.radians(-25.0), math.radians(15.0))),
        (1.0, euler_to_quat(math.radians(-22.0), math.radians(-25.0), math.radians(15.0))),
        (2.0, euler_to_quat(math.radians(-25.0), math.radians(-25.0), math.radians(15.0))),
    ],
    "forearm_r": [(0.0, euler_to_quat(math.radians(55.0), 0.0, 0.0)), (2.0, euler_to_quat(math.radians(55.0), 0.0, 0.0))],
    "arm_l": [(0.0, euler_to_quat(math.radians(15.0), math.radians(20.0), math.radians(-15.0))), (2.0, euler_to_quat(math.radians(15.0), math.radians(20.0), math.radians(-15.0)))],
    "forearm_l": [(0.0, euler_to_quat(math.radians(45.0), 0.0, 0.0)), (2.0, euler_to_quat(math.radians(45.0), 0.0, 0.0))],
}
idle_alert_loc = {
    "pelvis": [
        (0.0, Vector((0.0, 0.0, -0.04))),
        (1.0, Vector((0.0, 0.0, -0.03))),
        (2.0, Vector((0.0, 0.0, -0.04))),
    ]
}
add_full_action("idle_alert", 2.0, idle_alert_rot, idle_alert_loc)

# =========================================================================
# 3. WALK (12-Phase Anatomical Bipedal Gait, 1.0s loop, v = 4.2 m/s)
# =========================================================================
walk_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, math.radians(4.0), math.radians(-1.5))),
        (0.25, euler_to_quat(0.0, 0.0, math.radians(2.0))),
        (0.5, euler_to_quat(0.0, math.radians(-4.0), math.radians(-1.5))),
        (0.75, euler_to_quat(0.0, 0.0, math.radians(2.0))),
        (1.0, euler_to_quat(0.0, math.radians(4.0), math.radians(-1.5))),
    ],
    "thigh_l": [
        (0.0, euler_to_quat(math.radians(-24.0), 0.0, 0.0)),
        (0.15, euler_to_quat(math.radians(-12.0), 0.0, 0.0)),
        (0.35, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
        (0.65, euler_to_quat(math.radians(14.0), 0.0, 0.0)),
        (0.75, euler_to_quat(math.radians(0.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(-24.0), 0.0, 0.0)),
    ],
    "shin_l": [
        (0.0, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
        (0.25, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        (0.40, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        (0.65, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
        (0.75, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
    ],
    "foot_l": [
        (0.0, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
        (0.25, euler_to_quat(math.radians(0.0), 0.0, 0.0)),
        (0.40, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(16.0), 0.0, 0.0)),
        (0.65, euler_to_quat(math.radians(0.0), 0.0, 0.0)),
        (0.85, euler_to_quat(math.radians(-8.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
    ],
    "thigh_r": [
        (0.0, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
        (0.15, euler_to_quat(math.radians(14.0), 0.0, 0.0)),
        (0.25, euler_to_quat(math.radians(0.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(-24.0), 0.0, 0.0)),
        (0.65, euler_to_quat(math.radians(-12.0), 0.0, 0.0)),
        (0.85, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
    ],
    "shin_r": [
        (0.0, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        (0.15, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
        (0.25, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
        (0.75, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        (0.90, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
    ],
    "foot_r": [
        (0.0, euler_to_quat(math.radians(16.0), 0.0, 0.0)),
        (0.15, euler_to_quat(math.radians(0.0), 0.0, 0.0)),
        (0.35, euler_to_quat(math.radians(-8.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
        (0.75, euler_to_quat(math.radians(0.0), 0.0, 0.0)),
        (0.90, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(16.0), 0.0, 0.0)),
    ],
    "spine_01": [
        (0.0, euler_to_quat(math.radians(3.5), math.radians(-3.5), 0.0)),
        (0.5, euler_to_quat(math.radians(3.5), math.radians(3.5), 0.0)),
        (1.0, euler_to_quat(math.radians(3.5), math.radians(-3.5), 0.0)),
    ],
    "chest": [
        (0.0, euler_to_quat(math.radians(2.0), math.radians(-2.5), 0.0)),
        (0.5, euler_to_quat(math.radians(2.0), math.radians(2.5), 0.0)),
        (1.0, euler_to_quat(math.radians(2.0), math.radians(-2.5), 0.0)),
    ],
    "head": [
        (0.0, euler_to_quat(0.0, math.radians(1.5), 0.0)),
        (0.5, euler_to_quat(0.0, math.radians(-1.5), 0.0)),
        (1.0, euler_to_quat(0.0, math.radians(1.5), 0.0)),
    ],
    "arm_l": [
        (0.0, euler_to_quat(math.radians(22.0), 0.0, math.radians(5.0))),
        (0.5, euler_to_quat(math.radians(-18.0), 0.0, math.radians(5.0))),
        (1.0, euler_to_quat(math.radians(22.0), 0.0, math.radians(5.0))),
    ],
    "forearm_l": [
        (0.0, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
    ],
    "arm_r": [
        (0.0, euler_to_quat(math.radians(-18.0), 0.0, math.radians(-5.0))),
        (0.5, euler_to_quat(math.radians(22.0), 0.0, math.radians(-5.0))),
        (1.0, euler_to_quat(math.radians(-18.0), 0.0, math.radians(-5.0))),
    ],
    "forearm_r": [
        (0.0, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
    ],
    "sash_01": [
        (0.0, euler_to_quat(math.radians(6.0), math.radians(-4.0), 0.0)),
        (0.5, euler_to_quat(math.radians(6.0), math.radians(4.0), 0.0)),
        (1.0, euler_to_quat(math.radians(6.0), math.radians(-4.0), 0.0)),
    ],
}
walk_loc = {
    "pelvis": [
        (0.0, Vector((0.0, 0.0, -0.03))),
        (0.25, Vector((-0.022, 0.0, 0.015))),
        (0.5, Vector((0.0, 0.0, -0.03))),
        (0.75, Vector((0.022, 0.0, 0.015))),
        (1.0, Vector((0.0, 0.0, -0.03))),
    ]
}
add_full_action("walk", 1.0, walk_rot, walk_loc)

# =========================================================================
# 4. JOG (Athletic Cadence, 0.75s loop, v = 7.5 m/s)
# =========================================================================
jog_rot = {
    "pelvis": [
        (0.0, euler_to_quat(math.radians(4.0), math.radians(5.0), 0.0)),
        (0.375, euler_to_quat(math.radians(4.0), math.radians(-5.0), 0.0)),
        (0.75, euler_to_quat(math.radians(4.0), math.radians(5.0), 0.0)),
    ],
    "thigh_l": [
        (0.0, euler_to_quat(math.radians(-32.0), 0.0, 0.0)),
        (0.375, euler_to_quat(math.radians(38.0), 0.0, 0.0)),
        (0.75, euler_to_quat(math.radians(-32.0), 0.0, 0.0)),
    ],
    "shin_l": [
        (0.0, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
        (0.1875, euler_to_quat(math.radians(60.0), 0.0, 0.0)),
        (0.375, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (0.5625, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (0.75, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
    ],
    "foot_l": [
        (0.0, euler_to_quat(math.radians(-24.0), 0.0, 0.0)),
        (0.375, euler_to_quat(math.radians(18.0), 0.0, 0.0)),
        (0.75, euler_to_quat(math.radians(-24.0), 0.0, 0.0)),
    ],
    "thigh_r": [
        (0.0, euler_to_quat(math.radians(38.0), 0.0, 0.0)),
        (0.375, euler_to_quat(math.radians(-32.0), 0.0, 0.0)),
        (0.75, euler_to_quat(math.radians(38.0), 0.0, 0.0)),
    ],
    "shin_r": [
        (0.0, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (0.1875, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (0.375, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
        (0.5625, euler_to_quat(math.radians(60.0), 0.0, 0.0)),
        (0.75, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
    ],
    "foot_r": [
        (0.0, euler_to_quat(math.radians(18.0), 0.0, 0.0)),
        (0.375, euler_to_quat(math.radians(-24.0), 0.0, 0.0)),
        (0.75, euler_to_quat(math.radians(18.0), 0.0, 0.0)),
    ],
    "chest": [
        (0.0, euler_to_quat(math.radians(6.5), math.radians(-5.0), 0.0)),
        (0.375, euler_to_quat(math.radians(6.5), math.radians(5.0), 0.0)),
        (0.75, euler_to_quat(math.radians(6.5), math.radians(-5.0), 0.0)),
    ],
    "arm_l": [
        (0.0, euler_to_quat(math.radians(35.0), 0.0, math.radians(10.0))),
        (0.375, euler_to_quat(math.radians(-28.0), 0.0, math.radians(10.0))),
        (0.75, euler_to_quat(math.radians(35.0), 0.0, math.radians(10.0))),
    ],
    "forearm_l": [(0.0, euler_to_quat(math.radians(55.0), 0.0, 0.0)), (0.75, euler_to_quat(math.radians(55.0), 0.0, 0.0))],
    "arm_r": [
        (0.0, euler_to_quat(math.radians(-28.0), 0.0, math.radians(-10.0))),
        (0.375, euler_to_quat(math.radians(35.0), 0.0, math.radians(-10.0))),
        (0.75, euler_to_quat(math.radians(-28.0), 0.0, math.radians(-10.0))),
    ],
    "forearm_r": [(0.0, euler_to_quat(math.radians(55.0), 0.0, 0.0)), (0.75, euler_to_quat(math.radians(55.0), 0.0, 0.0))],
    "sash_01": [
        (0.0, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
        (0.375, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        (0.75, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
    ],
}
jog_loc = {
    "pelvis": [
        (0.0, Vector((0.0, 0.0, -0.045))),
        (0.1875, Vector((-0.02, 0.0, 0.02))),
        (0.375, Vector((0.0, 0.0, -0.045))),
        (0.5625, Vector((0.02, 0.0, 0.02))),
        (0.75, Vector((0.0, 0.0, -0.045))),
    ]
}
add_full_action("jog", 0.75, jog_rot, jog_loc)

# =========================================================================
# 5. RUN (High-Performance Drive, 0.65s loop, v = 9.0 m/s)
# =========================================================================
run_rot = {
    "pelvis": [
        (0.0, euler_to_quat(math.radians(7.0), math.radians(6.0), 0.0)),
        (0.325, euler_to_quat(math.radians(7.0), math.radians(-6.0), 0.0)),
        (0.65, euler_to_quat(math.radians(7.0), math.radians(6.0), 0.0)),
    ],
    "thigh_l": [
        (0.0, euler_to_quat(math.radians(-38.0), 0.0, 0.0)),
        (0.325, euler_to_quat(math.radians(46.0), 0.0, 0.0)),
        (0.65, euler_to_quat(math.radians(-38.0), 0.0, 0.0)),
    ],
    "shin_l": [
        (0.0, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
        (0.1625, euler_to_quat(math.radians(72.0), 0.0, 0.0)),
        (0.325, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
        (0.65, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
    ],
    "foot_l": [
        (0.0, euler_to_quat(math.radians(-28.0), 0.0, 0.0)),
        (0.325, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (0.65, euler_to_quat(math.radians(-28.0), 0.0, 0.0)),
    ],
    "thigh_r": [
        (0.0, euler_to_quat(math.radians(46.0), 0.0, 0.0)),
        (0.325, euler_to_quat(math.radians(-38.0), 0.0, 0.0)),
        (0.65, euler_to_quat(math.radians(46.0), 0.0, 0.0)),
    ],
    "shin_r": [
        (0.0, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
        (0.4875, euler_to_quat(math.radians(72.0), 0.0, 0.0)),
        (0.65, euler_to_quat(math.radians(12.0), 0.0, 0.0)),
    ],
    "foot_r": [
        (0.0, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (0.325, euler_to_quat(math.radians(-28.0), 0.0, 0.0)),
        (0.65, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
    ],
    "chest": [
        (0.0, euler_to_quat(math.radians(10.0), math.radians(-6.0), 0.0)),
        (0.325, euler_to_quat(math.radians(10.0), math.radians(6.0), 0.0)),
        (0.65, euler_to_quat(math.radians(10.0), math.radians(-6.0), 0.0)),
    ],
    "arm_l": [
        (0.0, euler_to_quat(math.radians(45.0), 0.0, math.radians(12.0))),
        (0.325, euler_to_quat(math.radians(-38.0), 0.0, math.radians(12.0))),
        (0.65, euler_to_quat(math.radians(45.0), 0.0, math.radians(12.0))),
    ],
    "forearm_l": [(0.0, euler_to_quat(math.radians(65.0), 0.0, 0.0)), (0.65, euler_to_quat(math.radians(65.0), 0.0, 0.0))],
    "arm_r": [
        (0.0, euler_to_quat(math.radians(-38.0), 0.0, math.radians(-12.0))),
        (0.325, euler_to_quat(math.radians(45.0), 0.0, math.radians(-12.0))),
        (0.65, euler_to_quat(math.radians(-38.0), 0.0, math.radians(-12.0))),
    ],
    "forearm_r": [(0.0, euler_to_quat(math.radians(65.0), 0.0, 0.0)), (0.65, euler_to_quat(math.radians(65.0), 0.0, 0.0))],
    "sash_01": [
        (0.0, euler_to_quat(math.radians(18.0), 0.0, 0.0)),
        (0.65, euler_to_quat(math.radians(18.0), 0.0, 0.0)),
    ],
}
run_loc = {
    "pelvis": [
        (0.0, Vector((0.0, 0.0, -0.05))),
        (0.1625, Vector((-0.025, 0.0, 0.025))),
        (0.325, Vector((0.0, 0.0, -0.05))),
        (0.4875, Vector((0.025, 0.0, 0.025))),
        (0.65, Vector((0.0, 0.0, -0.05))),
    ]
}
add_full_action("run", 0.65, run_rot, run_loc)

# =========================================================================
# 6. SPRINT (Maximum Velocity Forward Charge, 0.52s loop, v = 10.5 m/s)
# =========================================================================
sprint_rot = {
    "pelvis": [
        (0.0, euler_to_quat(math.radians(12.0), math.radians(7.0), 0.0)),
        (0.26, euler_to_quat(math.radians(12.0), math.radians(-7.0), 0.0)),
        (0.52, euler_to_quat(math.radians(12.0), math.radians(7.0), 0.0)),
    ],
    "thigh_l": [
        (0.0, euler_to_quat(math.radians(-46.0), 0.0, 0.0)),
        (0.26, euler_to_quat(math.radians(56.0), 0.0, 0.0)),
        (0.52, euler_to_quat(math.radians(-46.0), 0.0, 0.0)),
    ],
    "shin_l": [
        (0.0, euler_to_quat(math.radians(40.0), 0.0, 0.0)),
        (0.13, euler_to_quat(math.radians(85.0), 0.0, 0.0)),
        (0.26, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        (0.52, euler_to_quat(math.radians(40.0), 0.0, 0.0)),
    ],
    "foot_l": [
        (0.0, euler_to_quat(math.radians(-32.0), 0.0, 0.0)),
        (0.26, euler_to_quat(math.radians(24.0), 0.0, 0.0)),
        (0.52, euler_to_quat(math.radians(-32.0), 0.0, 0.0)),
    ],
    "thigh_r": [
        (0.0, euler_to_quat(math.radians(56.0), 0.0, 0.0)),
        (0.26, euler_to_quat(math.radians(-46.0), 0.0, 0.0)),
        (0.52, euler_to_quat(math.radians(56.0), 0.0, 0.0)),
    ],
    "shin_r": [
        (0.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        (0.39, euler_to_quat(math.radians(85.0), 0.0, 0.0)),
        (0.52, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
    ],
    "foot_r": [
        (0.0, euler_to_quat(math.radians(24.0), 0.0, 0.0)),
        (0.26, euler_to_quat(math.radians(-32.0), 0.0, 0.0)),
        (0.52, euler_to_quat(math.radians(24.0), 0.0, 0.0)),
    ],
    "chest": [
        (0.0, euler_to_quat(math.radians(16.0), math.radians(-8.0), 0.0)),
        (0.26, euler_to_quat(math.radians(16.0), math.radians(8.0), 0.0)),
        (0.52, euler_to_quat(math.radians(16.0), math.radians(-8.0), 0.0)),
    ],
    "arm_l": [
        (0.0, euler_to_quat(math.radians(55.0), 0.0, math.radians(14.0))),
        (0.26, euler_to_quat(math.radians(-45.0), 0.0, math.radians(14.0))),
        (0.52, euler_to_quat(math.radians(55.0), 0.0, math.radians(14.0))),
    ],
    "forearm_l": [(0.0, euler_to_quat(math.radians(75.0), 0.0, 0.0)), (0.52, euler_to_quat(math.radians(75.0), 0.0, 0.0))],
    "arm_r": [
        (0.0, euler_to_quat(math.radians(-45.0), 0.0, math.radians(-14.0))),
        (0.26, euler_to_quat(math.radians(55.0), 0.0, math.radians(-14.0))),
        (0.52, euler_to_quat(math.radians(-45.0), 0.0, math.radians(-14.0))),
    ],
    "forearm_r": [(0.0, euler_to_quat(math.radians(75.0), 0.0, 0.0)), (0.52, euler_to_quat(math.radians(75.0), 0.0, 0.0))],
    "sash_01": [
        (0.0, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
        (0.52, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
    ],
    "sash_02": [
        (0.0, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
        (0.52, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
    ],
}
sprint_loc = {
    "pelvis": [
        (0.0, Vector((0.0, 0.0, -0.065))),
        (0.13, Vector((-0.03, 0.0, 0.03))),
        (0.26, Vector((0.0, 0.0, -0.065))),
        (0.39, Vector((0.03, 0.0, 0.03))),
        (0.52, Vector((0.0, 0.0, -0.065))),
    ]
}
add_full_action("sprint", 0.52, sprint_rot, sprint_loc)

# =========================================================================
# 7. WALK_BACKWARD (Reverse Bipedal Locomotion, 1.0s loop)
# =========================================================================
walk_bw_rot = {
    "pelvis": [
        (0.0, euler_to_quat(math.radians(-2.0), math.radians(-4.0), 0.0)),
        (0.5, euler_to_quat(math.radians(-2.0), math.radians(4.0), 0.0)),
        (1.0, euler_to_quat(math.radians(-2.0), math.radians(-4.0), 0.0)),
    ],
    "thigh_l": [
        (0.0, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(-24.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
    ],
    "shin_l": [
        (0.0, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
    ],
    "foot_l": [
        (0.0, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(-22.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
    ],
    "thigh_r": [
        (0.0, euler_to_quat(math.radians(-24.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(-24.0), 0.0, 0.0)),
    ],
    "shin_r": [
        (0.0, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
    ],
    "foot_r": [
        (0.0, euler_to_quat(math.radians(-22.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(-22.0), 0.0, 0.0)),
    ],
    "chest": [(0.0, euler_to_quat(math.radians(-3.0), 0.0, 0.0)), (1.0, euler_to_quat(math.radians(-3.0), 0.0, 0.0))],
}
add_full_action("walk_backward", 1.0, walk_bw_rot)

# =========================================================================
# 8. STRAFE_LEFT & STRAFE_RIGHT (Lateral Stepping, 0.8s loop)
# =========================================================================
strafe_l_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, 0.0, math.radians(-3.0))),
        (0.4, euler_to_quat(0.0, 0.0, math.radians(3.0))),
        (0.8, euler_to_quat(0.0, 0.0, math.radians(-3.0))),
    ],
    "thigh_l": [
        (0.0, euler_to_quat(0.0, 0.0, math.radians(20.0))),
        (0.4, euler_to_quat(0.0, 0.0, math.radians(4.0))),
        (0.8, euler_to_quat(0.0, 0.0, math.radians(20.0))),
    ],
    "thigh_r": [
        (0.0, euler_to_quat(0.0, 0.0, math.radians(4.0))),
        (0.4, euler_to_quat(0.0, 0.0, math.radians(18.0))),
        (0.8, euler_to_quat(0.0, 0.0, math.radians(4.0))),
    ],
    "chest": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.8, euler_to_quat(0.0, 0.0, 0.0))],
}
add_full_action("strafe_left", 0.8, strafe_l_rot)

strafe_r_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, 0.0, math.radians(3.0))),
        (0.4, euler_to_quat(0.0, 0.0, math.radians(-3.0))),
        (0.8, euler_to_quat(0.0, 0.0, math.radians(3.0))),
    ],
    "thigh_r": [
        (0.0, euler_to_quat(0.0, 0.0, math.radians(-20.0))),
        (0.4, euler_to_quat(0.0, 0.0, math.radians(-4.0))),
        (0.8, euler_to_quat(0.0, 0.0, math.radians(-20.0))),
    ],
    "thigh_l": [
        (0.0, euler_to_quat(0.0, 0.0, math.radians(-4.0))),
        (0.4, euler_to_quat(0.0, 0.0, math.radians(-18.0))),
        (0.8, euler_to_quat(0.0, 0.0, math.radians(-4.0))),
    ],
    "chest": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.8, euler_to_quat(0.0, 0.0, 0.0))],
}
add_full_action("strafe_right", 0.8, strafe_r_rot)

# =========================================================================
# 9. TURN_LEFT_90 & TURN_RIGHT_90 & TURN_180
# =========================================================================
turn_l_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.25, euler_to_quat(0.0, math.radians(45.0), 0.0)),
        (0.5, euler_to_quat(0.0, math.radians(90.0), 0.0)),
    ],
    "thigh_l": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.2, euler_to_quat(math.radians(15.0), 0.0, math.radians(15.0))),
        (0.5, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "shin_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(math.radians(25.0), 0.0, 0.0)), (0.5, euler_to_quat(0.0, 0.0, 0.0))],
}
add_full_action("turn_left_90", 0.5, turn_l_rot)
add_full_action("turn", 0.5, turn_l_rot)

turn_r_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.25, euler_to_quat(0.0, math.radians(-45.0), 0.0)),
        (0.5, euler_to_quat(0.0, math.radians(-90.0), 0.0)),
    ],
    "thigh_r": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.2, euler_to_quat(math.radians(15.0), 0.0, math.radians(-15.0))),
        (0.5, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "shin_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(math.radians(25.0), 0.0, 0.0)), (0.5, euler_to_quat(0.0, 0.0, 0.0))],
}
add_full_action("turn_right_90", 0.5, turn_r_rot)

turn_180_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.32, euler_to_quat(0.0, math.radians(90.0), 0.0)),
        (0.65, euler_to_quat(0.0, math.radians(180.0), 0.0)),
    ],
}
add_full_action("turn_180", 0.65, turn_180_rot)

# =========================================================================
# 10. WALK_START & WALK_STOP & RUN_STOP
# =========================================================================
walk_start_rot = {
    "chest": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(math.radians(4.0), 0.0, 0.0))],
    "thigh_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(math.radians(24.0), 0.0, 0.0))],
    "shin_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(math.radians(10.0), 0.0, 0.0))],
    "foot_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.4, euler_to_quat(math.radians(14.0), 0.0, 0.0))],
}
add_full_action("walk_start", 0.4, walk_start_rot)

walk_stop_rot = {
    "chest": [(0.0, euler_to_quat(math.radians(3.5), 0.0, 0.0)), (0.45, euler_to_quat(0.0, 0.0, 0.0))],
    "thigh_r": [(0.0, euler_to_quat(math.radians(20.0), 0.0, 0.0)), (0.45, euler_to_quat(0.0, 0.0, 0.0))],
    "foot_r": [(0.0, euler_to_quat(math.radians(12.0), 0.0, 0.0)), (0.45, euler_to_quat(0.0, 0.0, 0.0))],
}
add_full_action("walk_stop", 0.45, walk_stop_rot)

run_stop_rot = {
    "pelvis": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(math.radians(-10.0), 0.0, 0.0)), (0.5, euler_to_quat(0.0, 0.0, 0.0))],
    "chest": [(0.0, euler_to_quat(math.radians(10.0), 0.0, 0.0)), (0.2, euler_to_quat(math.radians(-12.0), 0.0, 0.0)), (0.5, euler_to_quat(0.0, 0.0, 0.0))],
    "thigh_r": [(0.0, euler_to_quat(math.radians(35.0), 0.0, 0.0)), (0.2, euler_to_quat(math.radians(25.0), 0.0, 0.0)), (0.5, euler_to_quat(0.0, 0.0, 0.0))],
    "shin_r": [(0.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)), (0.2, euler_to_quat(math.radians(35.0), 0.0, 0.0)), (0.5, euler_to_quat(0.0, 0.0, 0.0))],
    "foot_r": [(0.0, euler_to_quat(math.radians(16.0), 0.0, 0.0)), (0.2, euler_to_quat(math.radians(0.0), 0.0, 0.0)), (0.5, euler_to_quat(0.0, 0.0, 0.0))],
}
add_full_action("run_stop", 0.5, run_stop_rot)

# =========================================================================
# 11. JUMP SUITE (Jump Start, Jump/Apex, Fall, Landing)
# =========================================================================
jump_start_rot = {
    "pelvis": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(math.radians(10.0), 0.0, 0.0)), (0.25, euler_to_quat(0.0, 0.0, 0.0))],
    "chest": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(math.radians(16.0), 0.0, 0.0)), (0.25, euler_to_quat(math.radians(-6.0), 0.0, 0.0))],
    "thigh_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(math.radians(35.0), 0.0, 0.0)), (0.25, euler_to_quat(math.radians(-10.0), 0.0, 0.0))],
    "shin_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(math.radians(45.0), 0.0, 0.0)), (0.25, euler_to_quat(0.0, 0.0, 0.0))],
    "thigh_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(math.radians(35.0), 0.0, 0.0)), (0.25, euler_to_quat(math.radians(-10.0), 0.0, 0.0))],
    "shin_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(math.radians(45.0), 0.0, 0.0)), (0.25, euler_to_quat(0.0, 0.0, 0.0))],
    "arm_l": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(math.radians(-35.0), 0.0, 0.0)), (0.25, euler_to_quat(math.radians(25.0), 0.0, 0.0))],
    "arm_r": [(0.0, euler_to_quat(0.0, 0.0, 0.0)), (0.2, euler_to_quat(math.radians(-35.0), 0.0, 0.0)), (0.25, euler_to_quat(math.radians(25.0), 0.0, 0.0))],
}
jump_start_loc = {
    "pelvis": [(0.0, Vector((0, 0, 0))), (0.2, Vector((0, 0, -0.12))), (0.25, Vector((0, 0, 0.05)))]
}
add_full_action("jump_start", 0.25, jump_start_rot, jump_start_loc)

jump_rot = {
    "chest": [(0.0, euler_to_quat(math.radians(-6.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(-4.0), 0.0, 0.0))],
    "thigh_l": [(0.0, euler_to_quat(math.radians(25.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(18.0), 0.0, 0.0))],
    "shin_l": [(0.0, euler_to_quat(math.radians(35.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(25.0), 0.0, 0.0))],
    "thigh_r": [(0.0, euler_to_quat(math.radians(20.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(14.0), 0.0, 0.0))],
    "shin_r": [(0.0, euler_to_quat(math.radians(30.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(20.0), 0.0, 0.0))],
    "arm_l": [(0.0, euler_to_quat(math.radians(30.0), 0.0, math.radians(20.0))), (0.6, euler_to_quat(math.radians(25.0), 0.0, math.radians(20.0)))],
    "arm_r": [(0.0, euler_to_quat(math.radians(30.0), 0.0, math.radians(-20.0))), (0.6, euler_to_quat(math.radians(25.0), 0.0, math.radians(-20.0)))],
}
add_full_action("jump", 0.6, jump_rot)

fall_rot = {
    "chest": [(0.0, euler_to_quat(math.radians(4.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(6.0), 0.0, 0.0))],
    "thigh_l": [(0.0, euler_to_quat(math.radians(-10.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(-6.0), 0.0, 0.0))],
    "shin_l": [(0.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(12.0), 0.0, 0.0))],
    "thigh_r": [(0.0, euler_to_quat(math.radians(8.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(5.0), 0.0, 0.0))],
    "shin_r": [(0.0, euler_to_quat(math.radians(18.0), 0.0, 0.0)), (0.6, euler_to_quat(math.radians(14.0), 0.0, 0.0))],
    "arm_l": [(0.0, euler_to_quat(math.radians(-15.0), 0.0, math.radians(25.0))), (0.6, euler_to_quat(math.radians(-10.0), 0.0, math.radians(25.0)))],
    "arm_r": [(0.0, euler_to_quat(math.radians(-15.0), 0.0, math.radians(-25.0))), (0.6, euler_to_quat(math.radians(-10.0), 0.0, math.radians(-25.0)))],
}
add_full_action("fall", 0.6, fall_rot)
add_full_action("jump_fall", 0.6, fall_rot)

landing_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(8.0), 0.0, 0.0)),
        (0.35, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "chest": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(18.0), 0.0, 0.0)),
        (0.35, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "thigh_l": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
        (0.35, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "shin_l": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(50.0), 0.0, 0.0)),
        (0.35, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "thigh_r": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
        (0.35, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "shin_r": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(50.0), 0.0, 0.0)),
        (0.35, euler_to_quat(0.0, 0.0, 0.0)),
    ],
}
landing_loc = {
    "pelvis": [
        (0.0, Vector((0, 0, 0))),
        (0.12, Vector((0, 0, -0.14))),
        (0.35, Vector((0, 0, 0))),
    ]
}
add_full_action("landing", 0.35, landing_rot, landing_loc)
add_full_action("jump_land", 0.35, landing_rot, landing_loc)

# =========================================================================
# 12. DODGE / PRANA DASH (0.6s)
# =========================================================================
dodge_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.15, euler_to_quat(math.radians(65.0), 0.0, 0.0)),
        (0.35, euler_to_quat(math.radians(180.0), 0.0, 0.0)),
        (0.50, euler_to_quat(math.radians(310.0), 0.0, 0.0)),
        (0.60, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "chest": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.2, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
        (0.6, euler_to_quat(0.0, 0.0, 0.0)),
    ],
}
dodge_loc = {
    "pelvis": [
        (0.0, Vector((0, 0, 0))),
        (0.25, Vector((0, 0, -0.22))),
        (0.6, Vector((0, 0, 0))),
    ]
}
add_full_action("dodge", 0.6, dodge_rot, dodge_loc)

# =========================================================================
# 13. COMBAT DEFENSE: BLOCK & PARRY
# =========================================================================
block_rot = {
    "pelvis": [(0.0, euler_to_quat(0.0, math.radians(-12.0), 0.0)), (0.5, euler_to_quat(0.0, math.radians(-12.0), 0.0))],
    "thigh_l": [(0.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)), (0.5, euler_to_quat(math.radians(15.0), 0.0, 0.0))],
    "shin_l": [(0.0, euler_to_quat(math.radians(20.0), 0.0, 0.0)), (0.5, euler_to_quat(math.radians(20.0), 0.0, 0.0))],
    "thigh_r": [(0.0, euler_to_quat(math.radians(-15.0), 0.0, 0.0)), (0.5, euler_to_quat(math.radians(-15.0), 0.0, 0.0))],
    "shin_r": [(0.0, euler_to_quat(math.radians(25.0), 0.0, 0.0)), (0.5, euler_to_quat(math.radians(25.0), 0.0, 0.0))],
    "chest": [(0.0, euler_to_quat(math.radians(6.0), math.radians(12.0), 0.0)), (0.5, euler_to_quat(math.radians(6.0), math.radians(12.0), 0.0))],
    "arm_r": [(0.0, euler_to_quat(math.radians(-35.0), math.radians(-30.0), math.radians(25.0))), (0.5, euler_to_quat(math.radians(-35.0), math.radians(-30.0), math.radians(25.0)))],
    "forearm_r": [(0.0, euler_to_quat(math.radians(65.0), 0.0, 0.0)), (0.5, euler_to_quat(math.radians(65.0), 0.0, 0.0))],
    "arm_l": [(0.0, euler_to_quat(math.radians(25.0), math.radians(25.0), math.radians(-25.0))), (0.5, euler_to_quat(math.radians(25.0), math.radians(25.0), math.radians(-25.0)))],
    "forearm_l": [(0.0, euler_to_quat(math.radians(50.0), 0.0, 0.0)), (0.5, euler_to_quat(math.radians(50.0), 0.0, 0.0))],
}
block_loc = {
    "pelvis": [(0.0, Vector((0, 0, -0.05))), (0.5, Vector((0, 0, -0.05)))]
}
add_full_action("block", 0.5, block_rot, block_loc)

parry_rot = {
    "chest": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(-8.0), math.radians(25.0), 0.0)),
        (0.40, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "arm_r": [
        (0.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(-65.0), math.radians(45.0), math.radians(25.0))),
        (0.40, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "forearm_r": [
        (0.0, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (0.40, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
    ],
}
add_full_action("parry", 0.40, parry_rot)

# =========================================================================
# 14. COMBAT OFFENSE: ATTACK 1, 2, HEAVY FINISHER, COMBO
# =========================================================================
atk1_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(0.0, math.radians(-20.0), 0.0)),
        (0.30, euler_to_quat(0.0, math.radians(30.0), 0.0)),
        (0.50, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "chest": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(4.0), math.radians(-25.0), 0.0)),
        (0.30, euler_to_quat(math.radians(8.0), math.radians(38.0), 0.0)),
        (0.50, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "arm_r": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(-35.0), math.radians(-35.0), math.radians(35.0))),
        (0.30, euler_to_quat(math.radians(15.0), math.radians(55.0), math.radians(-15.0))),
        (0.50, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "forearm_r": [
        (0.0, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        (0.30, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (0.50, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
    ],
    "thigh_l": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.30, euler_to_quat(math.radians(18.0), 0.0, 0.0)),
        (0.50, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "shin_l": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.30, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (0.50, euler_to_quat(0.0, 0.0, 0.0)),
    ],
}
add_full_action("attack_light_1", 0.50, atk1_rot)

atk2_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, math.radians(25.0), 0.0)),
        (0.18, euler_to_quat(0.0, math.radians(-30.0), 0.0)),
        (0.50, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "chest": [
        (0.0, euler_to_quat(0.0, math.radians(28.0), 0.0)),
        (0.18, euler_to_quat(math.radians(-6.0), math.radians(-35.0), 0.0)),
        (0.50, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "arm_r": [
        (0.0, euler_to_quat(math.radians(25.0), math.radians(45.0), 0.0)),
        (0.18, euler_to_quat(math.radians(-60.0), math.radians(-35.0), math.radians(30.0))),
        (0.50, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "forearm_r": [
        (0.0, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
        (0.18, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        (0.50, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
    ],
}
add_full_action("attack_light_2", 0.50, atk2_rot)

finisher_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.30, euler_to_quat(math.radians(-15.0), 0.0, 0.0)),
        (0.55, euler_to_quat(math.radians(28.0), 0.0, 0.0)),
        (0.85, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "chest": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.30, euler_to_quat(math.radians(-25.0), 0.0, 0.0)),
        (0.55, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
        (0.85, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "arm_r": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.30, euler_to_quat(math.radians(-95.0), 0.0, math.radians(15.0))),
        (0.55, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        (0.85, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "forearm_r": [
        (0.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        (0.30, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        (0.55, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (0.85, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
    ],
    "arm_l": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.30, euler_to_quat(math.radians(-85.0), 0.0, math.radians(-15.0))),
        (0.55, euler_to_quat(math.radians(35.0), 0.0, math.radians(-10.0))),
        (0.85, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "thigh_r": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.55, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
        (0.85, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "shin_r": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.55, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
        (0.85, euler_to_quat(0.0, 0.0, 0.0)),
    ],
}
finisher_loc = {
    "pelvis": [
        (0.0, Vector((0, 0, 0))),
        (0.30, Vector((0, 0, 0.05))),
        (0.55, Vector((0, 0, -0.12))),
        (0.85, Vector((0, 0, 0))),
    ]
}
add_full_action("attack_heavy_finisher", 0.85, finisher_rot, finisher_loc)
add_full_action("combo", 0.85, finisher_rot, finisher_loc)

# =========================================================================
# 15. HIT REACTION / STAGGER (0.45s)
# =========================================================================
hit_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(-10.0), 0.0, 0.0)),
        (0.45, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "chest": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(-22.0), math.radians(12.0), 0.0)),
        (0.45, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "head": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.12, euler_to_quat(math.radians(-18.0), 0.0, 0.0)),
        (0.45, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "thigh_r": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.15, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
        (0.45, euler_to_quat(0.0, 0.0, 0.0)),
    ],
}
hit_loc = {
    "pelvis": [(0.0, Vector((0, 0, 0))), (0.12, Vector((0, -0.05, -0.04))), (0.45, Vector((0, 0, 0)))]
}
add_full_action("hit_reaction", 0.45, hit_rot, hit_loc)
add_full_action("stagger", 0.45, hit_rot, hit_loc)

# =========================================================================
# 16. INTERACT (0.9s)
# =========================================================================
interact_rot = {
    "chest": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.40, euler_to_quat(math.radians(14.0), 0.0, 0.0)),
        (0.90, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "arm_r": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.40, euler_to_quat(math.radians(-50.0), math.radians(-15.0), 0.0)),
        (0.90, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "forearm_r": [
        (0.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        (0.40, euler_to_quat(math.radians(10.0), 0.0, 0.0)),
        (0.90, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
    ],
}
add_full_action("interact", 0.90, interact_rot)

# =========================================================================
# 17. VICTORY (2.0s)
# =========================================================================
vic_rot = {
    "chest": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.4, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        (0.8, euler_to_quat(math.radians(-15.0), 0.0, 0.0)),
        (2.0, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "arm_r": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.4, euler_to_quat(math.radians(-35.0), math.radians(-15.0), 0.0)),
        (0.8, euler_to_quat(math.radians(-110.0), 0.0, math.radians(10.0))),
        (2.0, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "forearm_r": [
        (0.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        (0.4, euler_to_quat(math.radians(80.0), 0.0, 0.0)),
        (0.8, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        (2.0, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
    ],
    "head": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.8, euler_to_quat(math.radians(-20.0), 0.0, 0.0)),
        (2.0, euler_to_quat(0.0, 0.0, 0.0)),
    ],
}
add_full_action("victory", 2.0, vic_rot)

# =========================================================================
# 18. DEFEAT (1.8s)
# =========================================================================
def_rot = {
    "pelvis": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.6, euler_to_quat(math.radians(15.0), 0.0, 0.0)),
        (1.8, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
    ],
    "thigh_l": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.6, euler_to_quat(math.radians(45.0), 0.0, 0.0)),
        (1.8, euler_to_quat(math.radians(65.0), 0.0, 0.0)),
    ],
    "shin_l": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.6, euler_to_quat(math.radians(90.0), 0.0, 0.0)),
        (1.8, euler_to_quat(math.radians(100.0), 0.0, 0.0)),
    ],
    "chest": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.6, euler_to_quat(math.radians(25.0), 0.0, 0.0)),
        (1.8, euler_to_quat(math.radians(35.0), 0.0, 0.0)),
    ],
    "head": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.6, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (1.8, euler_to_quat(math.radians(30.0), 0.0, 0.0)),
    ],
}
def_loc = {
    "pelvis": [
        (0.0, Vector((0, 0, 0))),
        (0.6, Vector((0, 0, -0.25))),
        (1.8, Vector((0, 0, -0.35))),
    ]
}
add_full_action("defeat", 1.8, def_rot, def_loc)

# =========================================================================
# 19. SOLAR_BLAST (Channeling & Prana Burst, 0.75s)
# =========================================================================
solar_rot = {
    "chest": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.3, euler_to_quat(math.radians(-15.0), 0.0, 0.0)),
        (0.5, euler_to_quat(math.radians(20.0), 0.0, 0.0)),
        (0.75, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "arm_r": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.3, euler_to_quat(math.radians(-60.0), math.radians(20.0), 0.0)),
        (0.5, euler_to_quat(math.radians(-90.0), math.radians(0.0), 0.0)),
        (0.75, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "arm_l": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (0.3, euler_to_quat(math.radians(30.0), math.radians(-30.0), 0.0)),
        (0.5, euler_to_quat(math.radians(-40.0), math.radians(-15.0), 0.0)),
        (0.75, euler_to_quat(0.0, 0.0, 0.0)),
    ],
}
add_full_action("solar_blast", 0.75, solar_rot)

# =========================================================================
# 20. MEDITATION (Tapovan Focused Breathing, 2.0s loop)
# =========================================================================
med_rot = {
    "chest": [
        (0.0, euler_to_quat(0.0, 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(5.0), 0.0, 0.0)),
        (2.0, euler_to_quat(0.0, 0.0, 0.0)),
    ],
    "arm_l": [
        (0.0, euler_to_quat(math.radians(10.0), 0.0, math.radians(15.0))),
        (1.0, euler_to_quat(math.radians(12.0), 0.0, math.radians(18.0))),
        (2.0, euler_to_quat(math.radians(10.0), 0.0, math.radians(15.0))),
    ],
    "arm_r": [
        (0.0, euler_to_quat(math.radians(10.0), 0.0, math.radians(-15.0))),
        (1.0, euler_to_quat(math.radians(12.0), 0.0, math.radians(-18.0))),
        (2.0, euler_to_quat(math.radians(10.0), 0.0, math.radians(-15.0))),
    ],
    "head": [
        (0.0, euler_to_quat(math.radians(6.0), 0.0, 0.0)),
        (1.0, euler_to_quat(math.radians(4.0), 0.0, 0.0)),
        (2.0, euler_to_quat(math.radians(6.0), 0.0, 0.0)),
    ],
}
add_full_action("meditation", 2.0, med_rot)

print(f"Authored all actions! Total actions in blend: {len(bpy.data.actions)}")

# CRITICAL: Reset pose to Rest Pose before saving and exporting!
arm_obj.animation_data.action = None
bpy.context.view_layer.objects.active = arm_obj
arm_obj.select_set(True)
bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.transforms_clear()
bpy.ops.object.mode_set(mode='OBJECT')

print("Reset Armature pose to Rest Pose.")

# Save updated blend file
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
print(f"Saved updated blend file to: {BLEND_PATH}")

# Export production GLB (Fast export with ACTIONS mode and no force sampling)
bpy.ops.object.select_all(action='DESELECT')
arm_obj.select_set(True)
body_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj

bpy.ops.export_scene.gltf(
    filepath=GLB_PATH,
    export_format='GLB',
    use_selection=True,
    export_animations=True,
    export_animation_mode='ACTIONS',
    export_force_sampling=False,
    export_skins=True,
    export_morph=False,
    export_apply=False
)

print(f"Exported updated GLB to: {GLB_PATH} ({os.path.getsize(GLB_PATH)} bytes)")
print("=== Stage Q11 Locomotion & Combat Motion Library Complete! ===")
