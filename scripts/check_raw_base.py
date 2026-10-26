import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)

bundle_path = r"h:\mythologicalgame\tools\human_base_meshes\human_base_meshes_bundle.blend"
with bpy.data.libraries.load(bundle_path) as (data_from, data_to):
    data_to.objects = ["GEO-body_male_realistic"]

mesh_obj = data_to.objects[0]
print("Raw object location:", mesh_obj.location)
min_x = min(v.co.x for v in mesh_obj.data.vertices)
max_x = max(v.co.x for v in mesh_obj.data.vertices)
print(f"Raw vertices X span: [{min_x:.3f}, {max_x:.3f}], center: {(min_x+max_x)*0.5:.3f}")
min_y = min(v.co.y for v in mesh_obj.data.vertices)
max_y = max(v.co.y for v in mesh_obj.data.vertices)
print(f"Raw vertices Y span: [{min_y:.3f}, {max_y:.3f}], center: {(min_y+max_y)*0.5:.3f}")
min_z = min(v.co.z for v in mesh_obj.data.vertices)
max_z = max(v.co.z for v in mesh_obj.data.vertices)
print(f"Raw vertices Z span: [{min_z:.3f}, {max_z:.3f}]")
