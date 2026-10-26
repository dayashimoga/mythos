import bpy

blend_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

print("Objects in scene:")
for o in bpy.data.objects:
    print(f"  Obj: {o.name}, type: {o.type}, users: {o.users}")

print("\nMeshes in bpy.data.meshes:")
for m in bpy.data.meshes:
    print(f"  Mesh: {m.name}, users: {m.users}")
