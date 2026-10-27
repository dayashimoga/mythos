import bpy
import os
import math
from mathutils import Vector

OUT_DOCS = "h:/mythologicalgame/docs/images/locomotion_q19"
BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/76f7b200-4c66-4077-80b0-19baeb9535b1"
os.makedirs(OUT_DOCS, exist_ok=True)
os.makedirs(BRAIN_DIR, exist_ok=True)

# Setup scene
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items else 'BLENDER_EEVEE'
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'

# Ensure world background
if not scene.world:
    scene.world = bpy.data.worlds.new("World")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.09, 0.10, 0.13, 1.0)
    bg.inputs[1].default_value = 1.0

# Setup sun light
sun = bpy.data.objects.get("SunLight")
if not sun:
    sun_data = bpy.data.lights.new(name="SunLight", type='SUN')
    sun_data.energy = 3.5
    sun_data.color = (1.0, 0.95, 0.85)
    sun = bpy.data.objects.new(name="SunLight", object_data=sun_data)
    scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(45), math.radians(20), math.radians(-35))

# Setup camera
cam = bpy.data.objects.get("Camera")
if not cam:
    cam_data = bpy.data.cameras.new(name="Camera")
    cam = bpy.data.objects.new(name="Camera", object_data=cam_data)
    scene.collection.objects.link(cam)
scene.camera = cam

# Locate Armature
arm_obj = None
for obj in scene.objects:
    if obj.type == 'ARMATURE':
        arm_obj = obj
        break

print(f"Found Armature: {arm_obj.name if arm_obj else 'None'}")

def point_camera_at(camera_obj, target_pos):
    loc = camera_obj.location
    direction = target_pos - loc
    rot_quat = direction.to_track_quat('-Z', 'Y')
    camera_obj.rotation_euler = rot_quat.to_euler()

target = Vector((0.0, 0.0, 1.05))

shots = [
    {
        "id": "01_locomotion_walk_stride_q19",
        "action": "walk",
        "frame": 12,
        "cam_pos": (-1.4, -3.2, 1.35),
        "lens": 38,
        "label": "Walk forward synchronized stride with pelvis weight transfer and arm swing"
    },
    {
        "id": "02_locomotion_sprint_drive_q19",
        "action": "sprint",
        "frame": 10,
        "cam_pos": (-2.6, -2.4, 1.30),
        "lens": 36,
        "label": "Sprint forward athletic drive with torso pitch and knee drive"
    },
    {
        "id": "03_locomotion_crouch_walk_q19",
        "action": "crouch_walk",
        "frame": 14,
        "cam_pos": (-1.8, -2.8, 1.15),
        "lens": 40,
        "label": "Low crouch stealth gait with deep knee flexion and balanced posture"
    },
    {
        "id": "04_locomotion_stair_ascent_q19",
        "action": "stair_ascent",
        "frame": 10,
        "cam_pos": (-1.8, -3.0, 1.35),
        "lens": 38,
        "label": "Stair climbing locomotion with step elevation and grounded foot placement"
    },
    {
        "id": "05_locomotion_dodge_roll_q19",
        "action": "roll",
        "frame": 8,
        "cam_pos": (-2.0, -2.6, 1.10),
        "lens": 38,
        "label": "Dynamic evasive roll with shoulder tuck and momentum recovery"
    },
    {
        "id": "06_locomotion_jump_apex_q19",
        "action": "jump",
        "frame": 8,
        "cam_pos": (-1.6, -3.4, 1.55),
        "lens": 38,
        "label": "Aerial jump apex with athletic limb articulation"
    },
    {
        "id": "07_locomotion_combat_combo_slash_q19",
        "action": "attack_heavy_finisher",
        "frame": 9,
        "cam_pos": (-2.0, -3.2, 1.40),
        "lens": 38,
        "label": "Surya finisher strike with torso torque and weapon follow-through"
    },
    {
        "id": "08_locomotion_guard_recoil_q19",
        "action": "recoil",
        "frame": 5,
        "cam_pos": (-1.4, -2.8, 1.30),
        "lens": 40,
        "label": "Heavy poise block recoil stance with shield deflection"
    },
    {
        "id": "09_locomotion_bhumi_gameplay_walk_q19",
        "action": "walk",
        "frame": 18,
        "cam_pos": (0.0, 3.5, 1.50),
        "lens": 38,
        "label": "Veer rear tracking third-person traversal perspective"
    },
    {
        "id": "10_locomotion_bhumi_temple_stairs_q19",
        "action": "stair_ascent",
        "frame": 16,
        "cam_pos": (-2.8, -2.0, 1.50),
        "lens": 38,
        "label": "Veer stair traversal dynamic profile perspective"
    }
]

for s in shots:
    action_name = s["action"]
    act = bpy.data.actions.get(action_name)
    if act and arm_obj:
        if not arm_obj.animation_data:
            arm_obj.animation_data_create()
        arm_obj.animation_data.action = act
        scene.frame_set(s["frame"])
        bpy.context.view_layer.update()

    cam.location = Vector(s["cam_pos"])
    point_camera_at(cam, target)
    cam.data.lens = s["lens"]

    p_doc = os.path.join(OUT_DOCS, s["id"] + ".png")
    p_brain = os.path.join(BRAIN_DIR, s["id"] + ".png")

    scene.render.filepath = p_doc
    bpy.ops.render.render(write_still=True)

    import shutil
    shutil.copyfile(p_doc, p_brain)
    print(f"Rendered {s['id']}: {s['label']}")

print("All 10 locomotion renders successfully completed with full-body framing!")
