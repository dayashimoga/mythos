import bpy
import numpy as np

bundle_path = r"h:\mythologicalgame\tools\human_base_meshes\human_base_meshes_bundle.blend"
with bpy.data.libraries.load(bundle_path) as (data_from, data_to):
    data_to.objects = ["GEO-body_male_realistic"]

mesh_obj = data_to.objects[0]
coords = np.array([[v.co.x, v.co.y, v.co.z] for v in mesh_obj.data.vertices])

# Left Arm landmark search
# Left hand tips (furthest +X)
furthest_x = coords[coords[:,0] > 0.40]
print("Hand furthest vertices mean:", furthest_x.mean(axis=0))

# Left elbow area (X in [0.25, 0.35], Z in [1.0, 1.25])
elbow_area = coords[(coords[:,0] > 0.25) & (coords[:,0] < 0.35) & (coords[:,2] > 1.05) & (coords[:,2] < 1.25)]
print("Elbow area mean:", elbow_area.mean(axis=0))

# Shoulder area (X in [0.15, 0.22], Z in [1.32, 1.45])
shoulder_area = coords[(coords[:,0] > 0.15) & (coords[:,0] < 0.22) & (coords[:,2] > 1.32) & (coords[:,2] < 1.45)]
print("Shoulder area mean:", shoulder_area.mean(axis=0))

# Left knee area (X in [0.08, 0.16], Z in [0.45, 0.55])
knee_area = coords[(coords[:,0] > 0.08) & (coords[:,0] < 0.16) & (coords[:,2] > 0.45) & (coords[:,2] < 0.55)]
print("Knee area mean:", knee_area.mean(axis=0))

# Left ankle area (X in [0.08, 0.16], Z in [0.05, 0.15])
ankle_area = coords[(coords[:,0] > 0.08) & (coords[:,0] < 0.16) & (coords[:,2] > 0.05) & (coords[:,2] < 0.15)]
print("Ankle area mean:", ankle_area.mean(axis=0))
