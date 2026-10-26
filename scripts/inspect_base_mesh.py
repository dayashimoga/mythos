import bpy

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Append GEO-body_male_realistic
bundle_path = r"h:\mythologicalgame\tools\human_base_meshes\human_base_meshes_bundle.blend"
with bpy.data.libraries.load(bundle_path) as (data_from, data_to):
    if "GEO-body_male_realistic" in data_from.objects:
        data_to.objects = ["GEO-body_male_realistic"]

mesh_obj = data_to.objects[0]
bpy.context.collection.objects.link(mesh_obj)

print(f"Object: {mesh_obj.name}, vertices: {len(mesh_obj.data.vertices)}, polygons: {len(mesh_obj.data.polygons)}")
print(f"Dimensions: {mesh_obj.dimensions}")
min_z = min(v.co.z for v in mesh_obj.data.vertices)
max_z = max(v.co.z for v in mesh_obj.data.vertices)
min_y = min(v.co.y for v in mesh_obj.data.vertices)
max_y = max(v.co.y for v in mesh_obj.data.vertices)
min_x = min(v.co.x for v in mesh_obj.data.vertices)
max_x = max(v.co.x for v in mesh_obj.data.vertices)
print(f"Bounds X: [{min_x:.3f}, {max_x:.3f}], Y: [{min_y:.3f}, {max_y:.3f}], Z: [{min_z:.3f}, {max_z:.3f}]")
print(f"UV layers: {[uv.name for uv in mesh_obj.data.uv_layers]}")
print(f"Materials: {[m.name if m else 'None' for m in mesh_obj.data.materials]}")
