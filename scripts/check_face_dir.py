import bpy
import numpy as np

bundle_path = r"h:\mythologicalgame\tools\human_base_meshes\human_base_meshes_bundle.blend"
with bpy.data.libraries.load(bundle_path) as (data_from, data_to):
    data_to.objects = ["GEO-body_male_realistic"]

mesh_obj = data_to.objects[0]
coords = np.array([[v.co.x, v.co.y, v.co.z] for v in mesh_obj.data.vertices])
face = coords[(coords[:,2] > 1.45) & (coords[:,2] < 1.65)]
print("Face Y min:", face[:,1].min(), "max:", face[:,1].max())
# Find vertex with extreme Y in face
min_y_v = face[face[:,1].argmin()]
max_y_v = face[face[:,1].argmax()]
print("Min Y vertex in face:", min_y_v)
print("Max Y vertex in face:", max_y_v)
