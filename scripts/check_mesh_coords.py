import bpy
import numpy as np

blend_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

mesh_obj = bpy.data.objects["VeerSkinnedHumanoidMesh"]
coords = np.array([[v.co.x, v.co.y, v.co.z] for v in mesh_obj.data.vertices])

print("Total vertices:", len(coords))
print(f"X span: [{coords[:,0].min():.4f}, {coords[:,0].max():.4f}]")
print(f"Y span: [{coords[:,1].min():.4f}, {coords[:,1].max():.4f}]")
print(f"Z span: [{coords[:,2].min():.4f}, {coords[:,2].max():.4f}]")

# Check material slot vertex assignments
poly_mats = np.array([p.material_index for p in mesh_obj.data.polygons])
for m_idx in range(len(mesh_obj.data.materials)):
    count = np.sum(poly_mats == m_idx)
    print(f"Material {m_idx} ({mesh_obj.data.materials[m_idx].name}): {count} polygons")

# Check bone weights distribution
vgroups = {vg.index: vg.name for vg in mesh_obj.vertex_groups}
print("Vertex groups in mesh:", [vgroups[i] for i in sorted(vgroups.keys())])
