import bpy

blend_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

arm = bpy.data.objects.get("Veer")
if arm:
    print(f"Bones count: {len(arm.data.bones)}")
    for b in arm.data.bones:
        p_name = b.parent.name if b.parent else "None"
        print(f"  Bone: {b.name:20s} Parent: {p_name:20s} Head: {b.head} Tail: {b.tail}")
