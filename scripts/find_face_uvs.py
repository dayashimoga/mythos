import bpy
import numpy as np

bundle_path = r"h:\mythologicalgame\tools\human_base_meshes\human_base_meshes_bundle.blend"
with bpy.data.libraries.load(bundle_path) as (data_from, data_to):
    data_to.objects = ["GEO-body_male_realistic"]

obj = data_to.objects[0]
mesh = obj.data

# Find face polygons (where vertices have Z > 1.48, Y < -0.05, |X| < 0.10)
face_poly_indices = []
for p in mesh.polygons:
    p_verts = [mesh.vertices[vi] for vi in p.vertices]
    z_mean = sum(v.co.z for v in p_verts) / len(p_verts)
    y_mean = sum(v.co.y for v in p_verts) / len(p_verts)
    x_mean = sum(v.co.x for v in p_verts) / len(p_verts)
    if z_mean > 1.48 and y_mean < -0.05 and abs(x_mean) < 0.10:
        face_poly_indices.append(p.index)

print(f"Found {len(face_poly_indices)} face polygons.")

# Get their UV coordinates
face_uvs = []
for p_idx in face_poly_indices:
    p = mesh.polygons[p_idx]
    for loop_idx in p.loop_indices:
        uv = mesh.uv_layers.active.data[loop_idx].uv
        face_uvs.append([uv.x, uv.y])

face_uvs = np.array(face_uvs)
print(f"Face UV U range: [{face_uvs[:,0].min():.4f}, {face_uvs[:,0].max():.4f}]")
print(f"Face UV V range: [{face_uvs[:,1].min():.4f}, {face_uvs[:,1].max():.4f}]")
print(f"Face UV Center: [{face_uvs[:,0].mean():.4f}, {face_uvs[:,1].mean():.4f}]")

# Forehead specific polygons (Z > 1.58, Y < -0.10, |X| < 0.06)
forehead_uvs = []
for p_idx in face_poly_indices:
    p = mesh.polygons[p_idx]
    p_verts = [mesh.vertices[vi] for vi in p.vertices]
    z_mean = sum(v.co.z for v in p_verts) / len(p_verts)
    y_mean = sum(v.co.y for v in p_verts) / len(p_verts)
    x_mean = sum(v.co.x for v in p_verts) / len(p_verts)
    if z_mean > 1.58 and y_mean < -0.10 and abs(x_mean) < 0.05:
        for loop_idx in p.loop_indices:
            uv = mesh.uv_layers.active.data[loop_idx].uv
            forehead_uvs.append([uv.x, uv.y])

if len(forehead_uvs) > 0:
    forehead_uvs = np.array(forehead_uvs)
    print(f"Forehead UV center: [{forehead_uvs[:,0].mean():.4f}, {forehead_uvs[:,1].mean():.4f}]")
    print(f"Forehead U span: [{forehead_uvs[:,0].min():.4f}, {forehead_uvs[:,0].max():.4f}], V span: [{forehead_uvs[:,1].min():.4f}, {forehead_uvs[:,1].max():.4f}]")
