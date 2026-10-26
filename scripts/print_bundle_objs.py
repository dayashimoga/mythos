import bpy

bundle_path = r"h:\mythologicalgame\tools\human_base_meshes\human_base_meshes_bundle.blend"
with bpy.data.libraries.load(bundle_path) as (data_from, data_to):
    for obj_name in data_from.objects:
        print(f"Object: {obj_name}")
