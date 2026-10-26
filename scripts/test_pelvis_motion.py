import bpy
from mathutils import Vector, Quaternion

blend_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

arm = bpy.data.objects.get("Veer")
bpy.context.view_layer.objects.active = arm
arm.select_set(True)
bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.transforms_clear()
bpy.ops.object.mode_set(mode='OBJECT')

pb_pelvis = arm.pose.bones.get("pelvis")
print("Pelvis cleared location:", pb_pelvis.location)
print("Transforms clear succeeded cleanly!")
