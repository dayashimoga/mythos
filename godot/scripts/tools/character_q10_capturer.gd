extends SceneTree

## Stage Q10 Veer Character Art, Anatomy, Costume & Material Reconstruction Screenshot Capturer
## Captures high-resolution in-engine validation screenshots for Phase Q10.6 & Q10.7:
## 1. 01_veer_front_full_body.png
## 2. 02_veer_three_quarter_heroic.png
## 3. 03_veer_back_garments_and_topknot.png
## 4. 04_veer_side_profile_posture.png
## 5. 05_veer_closeup_face_and_hair.png
## 6. 06_veer_costume_dhoti_kamarband.png
## 7. 07_veer_footwear_paduka_sandals.png
## 8. 08_veer_weapon_surya_khadga.png
## 9. 09_veer_character_studio_overview.png
## 10. 10_veer_combat_attack_pose.png

const OUT_DIR_Q10 = "res://../screenshots/character_q10/"
const OUT_DIR_DOCS = "res://../docs/images/veer_validation/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/c3d06cc8-1b26-4e1a-a6af-c9334d76f122/"

func _init() -> void:
	call_deferred("_run_captures")

func _run_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q10 VEER CHARACTER RECONSTRUCTION TOUR         ")
	print("================================================================")

	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR_Q10))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR_DOCS))
	DirAccess.make_dir_recursive_absolute(BRAIN_DIR)

	var studio_scene = load("res://scenes/studio/CharacterStudio3D.tscn")
	if not studio_scene:
		print("ERROR: Failed to load CharacterStudio3D.tscn")
		quit(1)
		return

	var studio = studio_scene.instantiate()
	root.add_child(studio)

	for f in range(20):
		await process_frame

	var cam_pivot: Node3D = studio.get_node_or_null("CameraPivot")
	var spring_arm: SpringArm3D = studio.get_node_or_null("CameraPivot/SpringArm3D")
	var cam: Camera3D = studio.get_node_or_null("CameraPivot/SpringArm3D/Camera3D")
	var ui: CanvasLayer = studio.get_node_or_null("UI")

	var capture = func(stem: String, label: String):
		for f in range(12):
			await process_frame
		await RenderingServer.frame_post_draw
		var img = root.get_viewport().get_texture().get_image()
		var p1 = ProjectSettings.globalize_path(OUT_DIR_Q10 + stem + ".png")
		var p2 = ProjectSettings.globalize_path(OUT_DIR_DOCS + stem + ".png")
		var p3 = BRAIN_DIR + stem + ".png"
		img.save_png(p1)
		img.save_png(p2)
		img.save_png(p3)
		print("  -> Saved %s (%s)" % [stem, label])

	# Shot 1: Front Full Body
	print("\n--- Shot 1: Front Full Body Heroic Posture ---")
	ui.visible = false
	studio.apply_lighting_preset(CharacterStudio3D.LightPreset.SURYA_DAWN)
	studio.play_animation("idle")
	cam_pivot.position = Vector3(0, 0.95, 0)
	cam_pivot.rotation.y = 0.0
	spring_arm.spring_length = 2.6
	cam.fov = 38.0
	await capture.call("01_veer_front_full_body", "Heroic standing front posture with dhoti and ornaments")

	# Shot 2: Three Quarter Heroic
	print("\n--- Shot 2: Three-Quarter Heroic Perspective ---")
	cam_pivot.position = Vector3(0, 1.0, 0)
	cam_pivot.rotation.y = deg_to_rad(-35.0)
	spring_arm.spring_length = 2.4
	cam.fov = 36.0
	await capture.call("02_veer_three_quarter_heroic", "Dynamic 3/4 perspective with sash drape and weapon")

	# Shot 3: Back Garments & Topknot
	print("\n--- Shot 3: Back Garments & Topknot ---")
	studio.apply_lighting_preset(CharacterStudio3D.LightPreset.HIGH_NOON)
	cam_pivot.position = Vector3(0, 1.05, 0)
	cam_pivot.rotation.y = deg_to_rad(180.0)
	spring_arm.spring_length = 2.5
	cam.fov = 38.0
	await capture.call("03_veer_back_garments_and_topknot", "Warrior Shikha topknot, Keshbandha ring, back anatomy, and dhoti folds")

	# Shot 4: Side Profile Posture
	print("\n--- Shot 4: Side Profile Posture ---")
	studio.apply_lighting_preset(CharacterStudio3D.LightPreset.SURYA_DAWN)
	cam_pivot.position = Vector3(0, 0.95, 0)
	cam_pivot.rotation.y = deg_to_rad(90.0)
	spring_arm.spring_length = 2.5
	cam.fov = 38.0
	await capture.call("04_veer_side_profile_posture", "Side profile posture showing spinal alignment and paduka sandals")

	# Shot 5: Face & Hair Close-up
	print("\n--- Shot 5: Face & Hair Close-up ---")
	cam_pivot.position = Vector3(0, 1.70, 0)
	cam_pivot.rotation.y = deg_to_rad(-12.0)
	spring_arm.spring_length = 0.65
	cam.fov = 24.0
	await capture.call("05_veer_closeup_face_and_hair", "Facial anatomy, sandalwood Tripundra, crimson Kumkum bindu, and eyes")

	# Shot 6: Costume Dhoti & Kamarband
	print("\n--- Shot 6: Costume Dhoti & Kamarband ---")
	studio.apply_lighting_preset(CharacterStudio3D.LightPreset.HIGH_NOON)
	cam_pivot.position = Vector3(0, 0.78, 0)
	cam_pivot.rotation.y = deg_to_rad(-20.0)
	spring_arm.spring_length = 1.25
	cam.fov = 32.0
	await capture.call("06_veer_costume_dhoti_kamarband", "Kamarband girdle, 12-petal Surya lotus medallion, and pleated silk dhoti")

	# Shot 7: Footwear Paduka Sandals
	print("\n--- Shot 7: Footwear Paduka Sandals ---")
	studio.apply_lighting_preset(CharacterStudio3D.LightPreset.SURYA_DAWN)
	cam_pivot.position = Vector3(0, 0.12, 0)
	cam_pivot.rotation.y = deg_to_rad(-22.0)
	spring_arm.spring_length = 0.85
	cam.fov = 26.0
	await capture.call("07_veer_footwear_paduka_sandals", "Authentic warrior Paduka sandals, leather straps, and golden khadau peg")

	# Shot 8: Weapon Surya-Kripana Scimitar
	print("\n--- Shot 8: Weapon Surya-Kripana Scimitar ---")
	studio.apply_lighting_preset(CharacterStudio3D.LightPreset.AGNI_FORGE)
	cam_pivot.position = Vector3(-0.44, 0.90, 0)
	cam_pivot.rotation.y = deg_to_rad(-45.0)
	spring_arm.spring_length = 0.95
	cam.fov = 30.0
	await capture.call("08_veer_weapon_surya_khadga", "Forged Sunsteel Surya-Kripana scimitar with quillon star guard and ruby pommel")

	# Shot 9: Character Studio Overview with UI
	print("\n--- Shot 9: Character Studio Overview with UI ---")
	ui.visible = true
	studio.apply_lighting_preset(CharacterStudio3D.LightPreset.TWILIGHT_TAPAS)
	cam_pivot.position = Vector3(0, 1.15, 0)
	cam_pivot.rotation.y = deg_to_rad(-25.0)
	spring_arm.spring_length = 3.2
	cam.fov = 55.0
	await capture.call("09_veer_character_studio_overview", "Character Studio inspection viewer with full controls and animation selector")

	# Shot 10: Combat Attack Pose
	print("\n--- Shot 10: Combat Attack Pose ---")
	ui.visible = false
	studio.apply_lighting_preset(CharacterStudio3D.LightPreset.SURYA_DAWN)
	if studio.anim_player:
		studio.anim_player.play("attack_light_1", 0.0)
		studio.anim_player.seek(0.28, true)
		studio.anim_player.pause()
	cam_pivot.position = Vector3(0, 1.05, 0)
	cam_pivot.rotation.y = deg_to_rad(-25.0)
	spring_arm.spring_length = 2.4
	cam.fov = 36.0
	await capture.call("10_veer_combat_attack_pose", "Dynamic attack slash pose showing muscle flex and scimitar swing")

	studio.queue_free()
	for f in range(10):
		await process_frame

	print("\n================================================================")
	print("  STAGE Q10 VEER CHARACTER RECONSTRUCTION CAPTURES COMPLETE!    ")
	print("================================================================\n")
	quit(0)
