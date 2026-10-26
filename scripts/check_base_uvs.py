import bpy

bundle_path = r"h:\mythologicalgame\tools\human_base_meshes\human_base_meshes_bundle.blend"
with bpy.data.libraries.load(bundle_path) as (data_from, data_to):
    data_to.objects = ["GEO-body_male_realistic"]

obj = data_to.objects[0]
uv_layer = obj.data.uv_layers.active
print("UV layer name:", uv_layer.name if uv_layer else "None")
uvs = [loop.uv for loop in obj.data.uv_layers[0].uv]
print(f"Total UV loops: {len(uvs)}")
min_u = min(uv.x for uv in uvs)
max_u = max(uv.x for uv in uvs)
min_v = min(uv.y for uv in uvs)
max_v = max(uv.y for uv in uvs)
print(f"U bounds: [{min_u:.3f}, {max_u:.3f}], V bounds: [{min_v:.3f}, {max_v:.3f}]")

# Check face material indices
mat_indices = set(p.material_index for p in obj.data.polygons)
print(f"Polygon material indices in base mesh: {mat_indices}")
