import bpy
import math

bpy.ops.wm.read_factory_settings(use_empty=True)

# Create small armature
arm_data = bpy.data.armatures.new("TestArm")
arm_obj = bpy.data.objects.new("Armature", arm_data)
bpy.context.collection.objects.link(arm_obj)
bpy.context.view_layer.objects.active = arm_obj

bpy.ops.object.mode_set(mode='EDIT')
b = arm_data.edit_bones.new("root")
b.head = (0, 0, 0)
b.tail = (0, 0, 1)
bpy.ops.object.mode_set(mode='OBJECT')

if arm_obj.animation_data is None:
    arm_obj.animation_data_create()

# Create action 1
act1 = bpy.data.actions.new("idle")
arm_obj.animation_data.action = act1
pb = arm_obj.pose.bones["root"]
pb.rotation_mode = 'QUATERNION'
pb.rotation_quaternion = (1, 0, 0, 0)
pb.keyframe_insert(data_path="rotation_quaternion", frame=1)
pb.rotation_quaternion = (0.99, 0.1, 0, 0)
pb.keyframe_insert(data_path="rotation_quaternion", frame=30)
pb.rotation_quaternion = (1, 0, 0, 0)
pb.keyframe_insert(data_path="rotation_quaternion", frame=60)

track1 = arm_obj.animation_data.nla_tracks.new()
track1.name = "idle"
track1.strips.new("idle", 1, act1)

# Create action 2
act2 = bpy.data.actions.new("walk")
arm_obj.animation_data.action = act2
pb.rotation_quaternion = (1, 0, 0, 0)
pb.keyframe_insert(data_path="rotation_quaternion", frame=1)
pb.rotation_quaternion = (0.95, 0, 0.3, 0)
pb.keyframe_insert(data_path="rotation_quaternion", frame=15)
pb.rotation_quaternion = (1, 0, 0, 0)
pb.keyframe_insert(data_path="rotation_quaternion", frame=30)

track2 = arm_obj.animation_data.nla_tracks.new()
track2.name = "walk"
track2.strips.new("walk", 1, act2)

# Unlink active action so NLA plays
arm_obj.animation_data.action = None

test_glb = r"h:\mythologicalgame\tools\scratch_test_anim.glb"
bpy.ops.export_scene.gltf(
    filepath=test_glb,
    export_format='GLB',
    export_nla_strips=True,
    export_animations=True
)
print("Exported scratch anim glb.")
