import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)

# 1. Load base mesh
bundle_path = r"h:\mythologicalgame\tools\human_base_meshes\human_base_meshes_bundle.blend"
with bpy.data.libraries.load(bundle_path) as (data_from, data_to):
    data_to.objects = ["GEO-body_male_realistic"]

mesh_obj = data_to.objects[0]
bpy.context.collection.objects.link(mesh_obj)

# Scale slightly by 1.055 and place feet at Z=0
scale_factor = 1.055
mesh_obj.scale = (scale_factor, scale_factor, scale_factor)
bpy.ops.object.select_all(action='DESELECT')
mesh_obj.select_set(True)
bpy.context.view_layer.objects.active = mesh_obj
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

min_z = min(v.co.z for v in mesh_obj.data.vertices)
for v in mesh_obj.data.vertices:
    v.co.z -= min_z

print("Mesh adjusted. New Z span:", min(v.co.z for v in mesh_obj.data.vertices), "to", max(v.co.z for v in mesh_obj.data.vertices))

# 2. Create Armature
arm_data = bpy.data.armatures.new("VeerArmature")
arm_obj = bpy.data.objects.new("Veer", arm_data)
bpy.context.collection.objects.link(arm_obj)
bpy.context.view_layer.objects.active = arm_obj

bpy.ops.object.mode_set(mode='EDIT')
ebones = arm_data.edit_bones

def make_bone(name, head, tail, parent_name=None):
    b = ebones.new(name)
    b.head = head
    b.tail = tail
    if parent_name and parent_name in ebones:
        b.parent = ebones[parent_name]
    return b

# Build 24 bones matching anatomy
make_bone("root", (0, 0, 0), (0, 0, 0.2))
make_bone("pelvis", (0, 0, 0.94), (0, 0, 1.04), "root")
make_bone("spine_01", (0, 0, 1.04), (0, 0, 1.18), "pelvis")
make_bone("chest", (0, 0, 1.18), (0, 0, 1.45), "spine_01")
make_bone("neck", (0, 0, 1.45), (0, 0, 1.54), "chest")
make_bone("head", (0, 0, 1.54), (0, 0, 1.74), "neck")
make_bone("topknot", (0, -0.04, 1.74), (0, -0.06, 1.86), "head")

# Left arm
make_bone("shoulder_l", (0.05, 0, 1.40), (0.18, 0, 1.38), "chest")
make_bone("arm_l", (0.18, 0, 1.38), (0.29, 0, 1.14), "shoulder_l")
make_bone("forearm_l", (0.29, 0, 1.14), (0.42, -0.08, 0.85), "arm_l")
make_bone("hand_l", (0.42, -0.08, 0.85), (0.46, -0.11, 0.74), "forearm_l")

# Right arm
make_bone("shoulder_r", (-0.05, 0, 1.40), (-0.18, 0, 1.38), "chest")
make_bone("arm_r", (-0.18, 0, 1.38), (-0.29, 0, 1.14), "shoulder_r")
make_bone("forearm_r", (-0.29, 0, 1.14), (-0.42, -0.08, 0.85), "arm_r")
make_bone("hand_r", (-0.42, -0.08, 0.85), (-0.46, -0.11, 0.74), "forearm_r")
make_bone("socket_right_hand", (-0.46, -0.11, 0.74), (-0.48, -0.13, 0.68), "hand_r")

# Left leg
make_bone("thigh_l", (0.11, 0, 0.90), (0.12, 0.01, 0.50), "pelvis")
make_bone("shin_l", (0.12, 0.01, 0.50), (0.15, 0.06, 0.10), "thigh_l")
make_bone("foot_l", (0.15, 0.06, 0.10), (0.15, -0.12, 0.02), "shin_l")

# Right leg
make_bone("thigh_r", (-0.11, 0, 0.90), (-0.12, 0.01, 0.50), "pelvis")
make_bone("shin_r", (-0.12, 0.01, 0.50), (-0.15, 0.06, 0.10), "thigh_r")
make_bone("foot_r", (-0.15, 0.06, 0.10), (-0.15, -0.12, 0.02), "shin_r")

# Sash
make_bone("sash_01", (0.0, -0.12, 0.94), (0.08, -0.15, 0.68), "pelvis")
make_bone("sash_02", (0.08, -0.15, 0.68), (0.12, -0.18, 0.38), "sash_01")

bpy.ops.object.mode_set(mode='OBJECT')
print("Armature built with", len(arm_data.bones), "bones.")

# Test Auto weights
bpy.ops.object.select_all(action='DESELECT')
mesh_obj.select_set(True)
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj

try:
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    print("Auto-weights applied successfully! Vertex groups:", len(mesh_obj.vertex_groups))
except Exception as e:
    print("Auto-weights failed:", e)
