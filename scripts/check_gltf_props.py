import bpy

props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
anim_props = [p for p in props if "anim" in p or "nla" in p or "track" in p or "action" in p]
print("glTF animation export properties in Blender 4.2:")
for p in anim_props:
    print(" ", p)
