import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)

blend_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

arm_obj = bpy.data.objects["Veer"]
print("Active action on arm_obj:", arm_obj.animation_data.action.name if arm_obj.animation_data and arm_obj.animation_data.action else "None")
for pb in arm_obj.pose.bones:
    if pb.rotation_quaternion != (1.0, 0.0, 0.0, 0.0):
        print(f"Pose bone {pb.name} is ROTATED: {pb.rotation_quaternion}")
