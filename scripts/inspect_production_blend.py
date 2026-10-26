import bpy
import os

blend_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

print("=== Blend Inspection ===")
print("Objects:", [o.name for o in bpy.data.objects])
arm = bpy.data.objects.get("VeerArmature")
if arm:
    print(f"Armature found: {arm.name}")
    print(f"Bones count: {len(arm.data.bones)}")
    print("Bone names:", [b.name for b in arm.data.bones])
    if arm.animation_data:
        print(f"NLA Tracks ({len(arm.animation_data.nla_tracks)}):")
        for t in arm.animation_data.nla_tracks:
            strips = [s.name for s in t.strips]
            print(f"  Track: {t.name} -> Strips: {strips}")
print(f"Actions in blend: {len(bpy.data.actions)}")
for a in bpy.data.actions:
    print(f"  Action: {a.name}, frames: {a.frame_range}")
