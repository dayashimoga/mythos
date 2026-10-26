"""
Mythos 3D - Author Realistic Locomotion & Character Animation Library (Blender 4.2 LTS)
Stage Q2: Realistic 3D Locomotion, Bipedal Kinematics & Secondary Motion
"""

import bpy
import math
import os
from mathutils import Vector, Quaternion, Euler

BLEND_PATH = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
GLB_PATH = r"h:\mythologicalgame\godot\assets\characters\veer\veer.glb"

bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

arm_obj = bpy.data.objects.get("Veer")
if not arm_obj:
    raise RuntimeError("Could not find Veer armature in blend file!")

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

    # Set interpolation to BEZIER for all fcurves in this action
    for fcurve in act.fcurves:
        for kfp in fcurve.keyframe_points:
            kfp.interpolation = 'BEZIER'
            kfp.handle_left_type = 'AUTO'
            kfp.handle_right_type = 'AUTO'

    # Push to NLA Track
    track = arm_obj.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, 1, act)
    strip.action = act
    return act

print("Helper functions defined successfully.")
