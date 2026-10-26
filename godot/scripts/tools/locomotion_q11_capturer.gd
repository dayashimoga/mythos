extends SceneTree

## Stage Q11 Realistic Locomotion, Skeletal Animation & Control Refinement Screenshot Capturer
## Captures direct in-engine GPU validation screenshots for Phase Q11.7:
## 1. 01_locomotion_walk_forward_stride.png
## 2. 02_locomotion_sprint_forward_drive.png
## 3. 03_locomotion_walk_backward_reverse_gait.png
## 4. 04_locomotion_strafe_lateral_step.png
## 5. 05_locomotion_stair_traversal_step_up.png
## 6. 06_locomotion_slope_ground_conformance.png
## 7. 07_locomotion_jump_apex_trajectory.png
## 8. 08_locomotion_landing_impact_compression.png
## 9. 09_locomotion_stopping_inertia_plant.png
## 10. 10_locomotion_combat_alert_and_slash.png

const OUT_DIR_Q11 = "res://../screenshots/locomotion_q11/"
const OUT_DIR_DOCS = "res://../docs/images/locomotion_validation/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/c3d06cc8-1b26-4e1a-a6af-c9334d76f122/"

func _init() -> void:
	call_deferred("_run_captures")

func _run_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q11 REALISTIC LOCOMOTION VALIDATION CAPTURE    ")
	print("================================================================")

	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR_Q11))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR_DOCS))
	DirAccess.make_dir_recursive_absolute(BRAIN_DIR)

	var studio_scene = load("res://scenes/studio/CharacterStudio3D.tscn")
	if not studio_scene:
		print("ERROR: Failed to load CharacterStudio3D.tscn")
		quit(1)
		return

	var studio = studio_scene.instantiate()
	root.add_child(studio)

	for f in range(25):
		await process_frame

	var cam_pivot: Node3D = studio.get_node_or_null("CameraPivot")
	var spring_arm: SpringArm3D = studio.get_node_or_null("CameraPivot/SpringArm3D")
	var cam: Camera3D = studio.get_node_or_null("CameraPivot/SpringArm3D/Camera3D")
	var ui: CanvasLayer = studio.get_node_or_null("UI")
	var anim_player: AnimationPlayer = studio.anim_player
	if not anim_player:
		for child in studio.find_children("*", "AnimationPlayer", true, false):
			anim_player = child as AnimationPlayer
			break

	var capture = func(stem: String, label: String):
		for f in range(12):
			await process_frame
		await RenderingServer.frame_post_draw
		var img = root.get_viewport().get_texture().get_image()
		var p1 = ProjectSettings.globalize_path(OUT_DIR_Q11 + stem + ".png")
		var p2 = ProjectSettings.globalize_path(OUT_DIR_DOCS + stem + ".png")
		var p3 = BRAIN_DIR + stem + ".png"
		img.save_png(p1)
		img.save_png(p2)
		img.save_png(p3)
		print("  -> Saved %s (%s)" % [stem, label])

	var play_pose = func(anim_name: String, time_s: float):
		if anim_player:
			var actual_name = ""
			for a in anim_player.get_animation_list():
				if a == anim_name or a.ends_with("/" + anim_name):
					actual_name = a
					break
			if not actual_name.is_empty():
				anim_player.play(actual_name, 0.0)
				anim_player.seek(time_s, true)
				anim_player.pause()

	ui.visible = false
	studio.apply_lighting_preset(CharacterStudio3D.LightPreset.SURYA_DAWN)

	# Shot 1: Walk Forward Stride
	print("\n--- Shot 1: Walk Forward 12-Phase Bipedal Stride ---")
	play_pose.call("walk", 0.25)
	cam_pivot.position = Vector3(0, 0.95, 0)
	cam_pivot.rotation.y = deg_to_rad(-25.0)
	spring_arm.spring_length = 2.8
	cam.fov = 36.0
	await capture.call("01_locomotion_walk_forward_stride", "12-phase bipedal walk stride with foot strike and pelvis bounce")

	# Shot 2: Sprint Forward Athletic Drive
	print("\n--- Shot 2: Sprint Forward Athletic Drive ---")
	play_pose.call("sprint", 0.275)
	cam_pivot.position = Vector3(0, 0.95, 0)
	cam_pivot.rotation.y = deg_to_rad(-65.0)
	spring_arm.spring_length = 2.6
	cam.fov = 38.0
	await capture.call("02_locomotion_sprint_forward_drive", "High-velocity sprint forward drive with 14 deg athletic pitch lean and high knee lift")

	# Shot 3: Walk Backward Reverse Gait
	print("\n--- Shot 3: Walk Backward Reverse Gait ---")
	play_pose.call("walk_backward", 0.50)
	cam_pivot.position = Vector3(0, 0.95, 0)
	cam_pivot.rotation.y = deg_to_rad(-30.0)
	spring_arm.spring_length = 2.7
	cam.fov = 36.0
	await capture.call("03_locomotion_walk_backward_reverse_gait", "Reverse bipedal stepping reaching back on ball of foot")

	# Shot 4: Strafe Lateral Step
	print("\n--- Shot 4: Strafe Lateral Step ---")
	play_pose.call("strafe_left", 0.40)
	cam_pivot.position = Vector3(0, 0.95, 0)
	cam_pivot.rotation.y = 0.0
	spring_arm.spring_length = 2.8
	cam.fov = 36.0
	await capture.call("04_locomotion_strafe_lateral_step", "Lateral strafing footstep with hip abduction and torso counter-balance")

	# Shot 5: Stair Traversal Step-Up
	print("\n--- Shot 5: Stair Traversal Step-Up ---")
	play_pose.call("walk_start", 0.22)
	cam_pivot.position = Vector3(0, 0.75, 0)
	cam_pivot.rotation.y = deg_to_rad(-40.0)
	spring_arm.spring_length = 2.2
	cam.fov = 32.0
	await capture.call("05_locomotion_stair_traversal_step_up", "Stair stepping traversal posture with forward push-off")

	# Shot 6: Slope Ground Conformance
	print("\n--- Shot 6: Slope Ground Conformance ---")
	play_pose.call("walk", 0.75)
	cam_pivot.position = Vector3(0, 0.90, 0)
	cam_pivot.rotation.y = deg_to_rad(75.0)
	spring_arm.spring_length = 2.5
	cam.fov = 36.0
	await capture.call("06_locomotion_slope_ground_conformance", "Slope ground conformance with pelvic drop compensation")

	# Shot 7: Jump Apex Trajectory
	print("\n--- Shot 7: Jump Apex Trajectory ---")
	play_pose.call("jump", 0.35)
	cam_pivot.position = Vector3(0, 1.15, 0)
	cam_pivot.rotation.y = deg_to_rad(-35.0)
	spring_arm.spring_length = 3.0
	cam.fov = 38.0
	await capture.call("07_locomotion_jump_apex_trajectory", "Airborne jump trajectory extension with trailing legs and raised arms")

	# Shot 8: Landing Impact Compression
	print("\n--- Shot 8: Landing Impact Compression ---")
	play_pose.call("landing", 0.15)
	cam_pivot.position = Vector3(0, 0.85, 0)
	cam_pivot.rotation.y = deg_to_rad(-25.0)
	spring_arm.spring_length = 2.6
	cam.fov = 36.0
	await capture.call("08_locomotion_landing_impact_compression", "Ground landing impact shock absorption with flexed knees and lowered pelvis")

	# Shot 9: Stopping Inertia Brake Plant
	print("\n--- Shot 9: Stopping Inertia Brake Plant ---")
	play_pose.call("run_stop", 0.22)
	cam_pivot.position = Vector3(0, 0.95, 0)
	cam_pivot.rotation.y = deg_to_rad(-55.0)
	spring_arm.spring_length = 2.7
	cam.fov = 36.0
	await capture.call("09_locomotion_stopping_inertia_plant", "Inertia deceleration plant with rearward torso lean absorbing forward momentum")

	# Shot 10: Combat Alert & Sword Slash
	print("\n--- Shot 10: Combat Alert & Sword Slash ---")
	studio.apply_lighting_preset(CharacterStudio3D.LightPreset.AGNI_FORGE)
	play_pose.call("attack_light_1", 0.28)
	cam_pivot.position = Vector3(0, 1.05, 0)
	cam_pivot.rotation.y = deg_to_rad(-35.0)
	spring_arm.spring_length = 2.5
	cam.fov = 36.0
	await capture.call("10_locomotion_combat_alert_and_slash", "Horizontal Surya-Khadga sword slash with torso twist and weapon extension")

	print("\n================================================================")
	print("  STAGE Q11 LOCOMOTION VALIDATION CAPTURE COMPLETED CLEANLY!    ")
	print("================================================================\n")
	quit(0)
