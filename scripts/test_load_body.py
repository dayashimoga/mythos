import bpy
import bmesh
import math
import os
from mathutils import Vector, Matrix, Quaternion, Euler

ROOT_DIR = r"h:\mythologicalgame"
BUNDLE_PATH = os.path.join(ROOT_DIR, r"tools\human_base_meshes\human_base_meshes_bundle.blend")

bpy.ops.wm.read_factory_settings(use_empty=True)

# 1. Load base mesh and eyes
with bpy.data.libraries.load(BUNDLE_PATH) as (data_from, data_to):
    objs_to_load = ["GEO-body_male_realistic"]
    for eye in ["GEO-body_male_realistic.eye.R", "GEO-body_male_realistic.eye.L"]:
        if eye in data_from.objects:
            objs_to_load.append(eye)
    data_to.objects = objs_to_load

body_obj = data_to.objects[0]
bpy.context.collection.objects.link(body_obj)

eyes = []
for obj in data_to.objects[1:]:
    bpy.context.collection.objects.link(obj)
    eyes.append(obj)

# Scale by 1.055 and place feet at Z=0
scale_factor = 1.055
body_obj.scale = (scale_factor, scale_factor, scale_factor)
bpy.ops.object.select_all(action='DESELECT')
body_obj.select_set(True)
bpy.context.view_layer.objects.active = body_obj
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

for eye in eyes:
    eye.scale = (scale_factor, scale_factor, scale_factor)
    eye.select_set(True)
    bpy.context.view_layer.objects.active = eye
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

min_z = min(v.co.z for v in body_obj.data.vertices)
for v in body_obj.data.vertices:
    v.co.z -= min_z

for eye in eyes:
    for v in eye.data.vertices:
        v.co.z -= min_z

print("Base body loaded. Vertex count:", len(body_obj.data.vertices), "Z bounds:", min(v.co.z for v in body_obj.data.vertices), max(v.co.z for v in body_obj.data.vertices))
