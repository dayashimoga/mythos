import bpy

obj = bpy.data.objects.get("GEO-body_male_realistic")
if not obj:
    obj = bpy.data.objects.get("GEO-body_male_stylized")

print(f"Selected Object: {obj.name}")
print(f"Vertex count: {len(obj.data.vertices)}")
print(f"Polygon count: {len(obj.data.polygons)}")
print(f"Dimensions: {obj.dimensions}")
print(f"Location: {obj.location}")

min_z = min(v.co.z for v in obj.data.vertices)
max_z = max(v.co.z for v in obj.data.vertices)
print(f"Z range: {min_z:.3f} to {max_z:.3f} (Height: {max_z - min_z:.3f}m)")

print("UV layers:", [uv.name for uv in obj.data.uv_layers])
print("Vertex groups:", [vg.name for vg in obj.vertex_groups])
print("Modifiers:", [m.name for m in obj.modifiers])
