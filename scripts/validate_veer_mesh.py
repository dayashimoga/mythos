import bpy

blend_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

body_obj = bpy.data.objects.get("VeerSkinnedHumanoidMesh")
if body_obj:
    print(f"Validating mesh {body_obj.data.name}...")
    res = body_obj.data.validate(verbose=True)
    print("Validate result:", res)
