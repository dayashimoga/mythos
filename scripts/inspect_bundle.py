import bpy

print("=== ALL COLLECTIONS IN BUNDLE ===")
for col in bpy.data.collections:
    print(f"Collection: {col.name}")
    for obj in col.objects:
        if 'body' in obj.name.lower() or 'male' in obj.name.lower() or 'head' in obj.name.lower():
            verts = len(obj.data.vertices) if obj.type == 'MESH' else 0
            print(f"  * {obj.name} (type: {obj.type}, verts: {verts})")
