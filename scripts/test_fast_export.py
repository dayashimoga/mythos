import bpy
import time
import os

blend_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
glb_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer.glb"

bpy.ops.wm.open_mainfile(filepath=blend_path)

arm_obj = bpy.data.objects.get("Veer")
body_obj = bpy.data.objects.get("VeerSkinnedHumanoidMesh")

bpy.ops.object.select_all(action='DESELECT')
arm_obj.select_set(True)
body_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj

print(f"Exporting glTF with export_force_sampling=False across {len(bpy.data.actions)} actions...")
t0 = time.time()

bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    use_selection=True,
    export_animations=True,
    export_animation_mode='ACTIONS',
    export_force_sampling=False,
    export_skins=True,
    export_morph=False,
    export_apply=False
)
t1 = time.time()
print(f"EXPORT SUCCEEDED IN {t1 - t0:.2f} SECONDS!")
print(f"File size: {os.path.getsize(glb_path)} bytes")
