import bpy
import numpy as np

blend_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

mesh_obj = bpy.data.objects["VeerSkinnedHumanoidMesh"]
for i, v in enumerate(mesh_obj.data.vertices):
    if v.co.x < -0.8:
        print(f"Vertex {i} at X={v.co.x:.3f}, Y={v.co.y:.3f}, Z={v.co.z:.3f}")
        # check which polygon uses it
        for p in mesh_obj.data.polygons:
            if i in p.vertices:
                print(f"  Used by polygon {p.index} with material {p.material_index} ({mesh_obj.data.materials[p.material_index].name})")
                break
        break
