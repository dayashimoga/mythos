import bpy

blend_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

body_obj = bpy.data.objects.get("VeerSkinnedHumanoidMesh")
if body_obj:
    body_obj.data.name = "Veer_Mesh"
    fixed = body_obj.data.validate(verbose=False)
    print("Second validate result (should be False):", fixed)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("Saved cleaned blend file!")
