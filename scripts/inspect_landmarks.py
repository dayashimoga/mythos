import bpy
import numpy as np

bpy.ops.wm.read_factory_settings(use_empty=True)

bundle_path = r"h:\mythologicalgame\tools\human_base_meshes\human_base_meshes_bundle.blend"
with bpy.data.libraries.load(bundle_path) as (data_from, data_to):
    data_to.objects = ["GEO-body_male_realistic"]

mesh_obj = data_to.objects[0]
bpy.context.collection.objects.link(mesh_obj)

verts = [v.co for v in mesh_obj.data.vertices]
coords = np.array([[v.x, v.y, v.z] for v in verts])

print("Total vertices:", len(coords))
print(f"X span: [{coords[:,0].min():.4f}, {coords[:,0].max():.4f}]")
print(f"Y span: [{coords[:,1].min():.4f}, {coords[:,1].max():.4f}]")
print(f"Z span: [{coords[:,2].min():.4f}, {coords[:,2].max():.4f}]")

# Find key heights
# Head top
top_verts = coords[coords[:,2] > 1.65]
print("Head top center:", top_verts.mean(axis=0))

# Chin / jaw (Z ~ 1.45 - 1.50)
chin_verts = coords[(coords[:,2] > 1.45) & (coords[:,2] < 1.50) & (coords[:,1] > 0.05) & (np.abs(coords[:,0]) < 0.05)]
if len(chin_verts) > 0:
    print("Chin center:", chin_verts.mean(axis=0))

# Neck (Z ~ 1.40 - 1.47)
neck_verts = coords[(coords[:,2] > 1.42) & (coords[:,2] < 1.47) & (np.abs(coords[:,0]) < 0.06)]
print("Neck center:", neck_verts.mean(axis=0))

# Chest / Clavicle (Z ~ 1.25 - 1.35)
chest_verts = coords[(coords[:,2] > 1.25) & (coords[:,2] < 1.35) & (np.abs(coords[:,0]) < 0.10)]
print("Chest center:", chest_verts.mean(axis=0))

# Pelvis / Hips (Z ~ 0.85 - 0.95)
pelvis_verts = coords[(coords[:,2] > 0.85) & (coords[:,2] < 0.95) & (np.abs(coords[:,0]) < 0.12)]
print("Pelvis center:", pelvis_verts.mean(axis=0))

# Left shoulder / arm (X > 0.15, Z ~ 1.30 - 1.45)
l_shoulder = coords[(coords[:,0] > 0.14) & (coords[:,0] < 0.22) & (coords[:,2] > 1.32) & (coords[:,2] < 1.45)]
print("L Shoulder approx:", l_shoulder.mean(axis=0))

# Left hand (furthest X or wrist)
l_wrist = coords[(coords[:,0] > 0.35) & (coords[:,2] < 0.95)]
print("L Hand/Wrist approx:", l_wrist.mean(axis=0) if len(l_wrist) > 0 else "None")

# Knees (Z ~ 0.45 - 0.55)
l_knee = coords[(coords[:,0] > 0.05) & (coords[:,0] < 0.18) & (coords[:,2] > 0.45) & (coords[:,2] < 0.55)]
print("L Knee approx:", l_knee.mean(axis=0))

# Ankles / Feet (Z < 0.12)
l_foot = coords[(coords[:,0] > 0.05) & (coords[:,0] < 0.18) & (coords[:,2] < 0.10)]
print("L Foot approx:", l_foot.mean(axis=0))
