import bpy

bundle_path = r"h:\mythologicalgame\tools\human_base_meshes\human_base_meshes_bundle.blend"
with bpy.data.libraries.load(bundle_path) as (data_from, data_to):
    print("Objects in bundle:", data_from.objects)
    print("Collections in bundle:", data_from.collections)
    print("Armatures in bundle:", data_from.armatures)
    print("Materials in bundle:", data_from.materials)
