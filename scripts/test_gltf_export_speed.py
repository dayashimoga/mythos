import bpy
import time

blend_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

arm_obj = bpy.data.objects.get("Veer")
body_obj = bpy.data.objects.get("VeerSkinnedHumanoidMesh")
if body_obj and body_obj.data:
    body_obj.data.name = "Veer_Mesh"

bpy.ops.object.select_all(action='DESELECT')
arm_obj.select_set(True)
body_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj

print(f"Testing glTF export speed with {len(bpy.data.actions)} actions...")
t0 = time.time()

# In Blender 4.2 glTF exporter:
# export_anim_single_armature=True limits evaluation to the selected armature
# export_animations=True, export_animation_mode='ACTIONS'
out_test = r"h:\mythologicalgame\godot\assets\characters\veer\test_veer.glb"

bpy.ops.export_scene.gltf(
    filepath=out_test,
    export_format='GLB',
    use_selection=True,
    export_animations=True,
    export_anim_single_armature=True,
    export_skins=True,
    export_morph=False,
    export_apply=False
)
t1 = time.time()
print(f"Export finished in {t1 - t0:.2f} seconds!")
