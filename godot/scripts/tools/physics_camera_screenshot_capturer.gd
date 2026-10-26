extends SceneTree

## Stage Q9 Physical Integrity, Collisions & Camera Correction Screenshot Capturer
## Captures high-resolution in-engine validation screenshots for Phase Q9.7:
## 1. 01_temple_sanctum_traversal_wall_containment.png
## 2. 02_water_ghat_stairs_step_traversal.png
## 3. 03_temple_pillars_and_columns_solid_collision.png
## 4. 04_camera_orbit_tight_space_framing_under_roof.png
## 5. 05_environment_interaction_line_of_sight_altar.png
## 6. 06_environment_interaction_through_wall_occlusion.png
## 7. 07_prana_dash_motion_sweep_boundary.png
## 8. 08_seven_realms_physical_integrity_overview.png

const OUT_DIR = "res://../screenshots/physics_q9/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/c3d06cc8-1b26-4e1a-a6af-c9334d76f122/"

func _init() -> void:
	call_deferred("_run_captures")

func _run_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q9 PHYSICAL INTEGRITY & CAMERA CAPTURE TOUR    ")
	print("================================================================")

	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR))
	DirAccess.make_dir_recursive_absolute(BRAIN_DIR)

	var capture = func(stem: String, label: String):
		await RenderingServer.frame_post_draw
		var img = root.get_viewport().get_texture().get_image()
		var out_path = ProjectSettings.globalize_path(OUT_DIR + stem + ".png")
		var brain_path = BRAIN_DIR + stem + ".png"
		img.save_png(out_path)
		img.save_png(brain_path)
		print("  -> Saved %s (%s)" % [stem, label])

	# -------------------------------------------------------------------------
	# 1. Temple Sanctum Traversal & Wall Containment
	# -------------------------------------------------------------------------
	print("\n--- Shot 1: Temple Sanctum Traversal & Wall Containment ---")
	var bhumi_scene = load("res://scenes/levels/BhumiValley3D.tscn")
	var bhumi = bhumi_scene.instantiate()
	root.add_child(bhumi)
	for f in range(25): await process_frame
	
	var player = bhumi.find_child("Player3D", true, false) as PlayerController3D
	var cam_arm = player.get_node_or_null("CameraArm") as OrbitCamera3D if player else null
	
	if player:
		# Place player inside sanctum near back wall facing altar
		player.global_position = Vector3(0.0, 2.82, -4.2)
		if player.visual_root:
			player.visual_root.rotation.y = PI # Face altar at z = -2.0
		if cam_arm:
			cam_arm.rotation.y = 0.0
			cam_arm.rotation.x = deg_to_rad(-15.0)
	for f in range(20): await process_frame
	await capture.call("01_temple_sanctum_traversal_wall_containment", "Veer navigating temple sanctum against solid rear wall")

	# -------------------------------------------------------------------------
	# 2. Water Ghat Stairs Step Traversal
	# -------------------------------------------------------------------------
	print("\n--- Shot 2: Water Ghat Stairs Step Traversal ---")
	if player:
		player.global_position = Vector3(-6.0, 1.2, 27.5) # On ghat stairs
		if player.visual_root:
			player.visual_root.rotation.y = deg_to_rad(30.0)
		if cam_arm:
			cam_arm.rotation.y = deg_to_rad(-45.0)
			cam_arm.rotation.x = deg_to_rad(-18.0)
	for f in range(20): await process_frame
	await capture.call("02_water_ghat_stairs_step_traversal", "Veer ascending water ghat stairs with smooth collision ramp")

	# -------------------------------------------------------------------------
	# 3. Temple Pillars and Columns Solid Collision
	# -------------------------------------------------------------------------
	print("\n--- Shot 3: Temple Pillars and Columns Solid Collision ---")
	if player:
		player.global_position = Vector3(-7.2, 0.0, -6.8) # Next to Col_01 at (-8, -8)
		if player.visual_root:
			player.visual_root.rotation.y = deg_to_rad(-135.0)
		if cam_arm:
			cam_arm.rotation.y = deg_to_rad(45.0)
			cam_arm.rotation.x = deg_to_rad(-12.0)
	for f in range(20): await process_frame
	await capture.call("03_temple_pillars_and_columns_solid_collision", "Veer traversing next to temple pillars with cylindrical collision")

	# -------------------------------------------------------------------------
	# 4. Camera Orbit Tight Space Framing Under Roof
	# -------------------------------------------------------------------------
	print("\n--- Shot 4: Camera Orbit Tight Space Framing Under Roof ---")
	if player and cam_arm:
		player.global_position = Vector3(0.0, 2.82, -2.5) # Inside sanctum under shikhara roof
		cam_arm.rotation.y = 0.0
		cam_arm.rotation.x = deg_to_rad(-65.0) # Look high up into roof
	for f in range(25): await process_frame
	await capture.call("04_camera_orbit_tight_space_framing_under_roof", "Camera SpringArm contracting under temple roof with adaptive framing")

	# -------------------------------------------------------------------------
	# 5. Environment Interaction Line of Sight (Altar)
	# -------------------------------------------------------------------------
	print("\n--- Shot 5: Environment Interaction Line of Sight (Altar) ---")
	if player:
		player.global_position = Vector3(0.0, 2.82, -0.6) # Facing altar
		if player.visual_root:
			player.visual_root.rotation.y = 0.0
		if cam_arm:
			cam_arm.rotation.y = deg_to_rad(180.0)
			cam_arm.rotation.x = deg_to_rad(-10.0)
	for f in range(20): await process_frame
	await capture.call("05_environment_interaction_line_of_sight_altar", "Unblocked line of sight showing interactable prompt for Sun Altar")

	# -------------------------------------------------------------------------
	# 6. Environment Interaction Through Wall Occlusion
	# -------------------------------------------------------------------------
	print("\n--- Shot 6: Environment Interaction Through Wall Occlusion ---")
	if player:
		player.global_position = Vector3(0.0, 2.82, -6.8) # Outside rear wall
		if player.visual_root:
			player.visual_root.rotation.y = 0.0
		if cam_arm:
			cam_arm.rotation.y = 0.0
			cam_arm.rotation.x = deg_to_rad(-12.0)
	for f in range(20): await process_frame
	await capture.call("06_environment_interaction_through_wall_occlusion", "Sanctum rear wall occluding interaction prompt from outside")

	# -------------------------------------------------------------------------
	# 7. Prana Dash Motion Sweep Boundary
	# -------------------------------------------------------------------------
	print("\n--- Shot 7: Prana Dash Motion Sweep Boundary ---")
	if player:
		player.global_position = Vector3(0.0, 0.0, 5.0) # Processional pathway
		player.is_dashing = true
		player.dash_direction = Vector3(0.0, 0.0, -1.0)
		if cam_arm:
			cam_arm.rotation.y = deg_to_rad(30.0)
			cam_arm.rotation.x = deg_to_rad(-15.0)
	for f in range(15): await process_frame
	await capture.call("07_prana_dash_motion_sweep_boundary", "Prana Dash motion sweep preserving collision boundary")
	if player:
		player.is_dashing = false

	bhumi.queue_free()
	for f in range(10): await process_frame

	# -------------------------------------------------------------------------
	# 8. Seven Realms Physical Integrity Overview (Antariksha Sky Citadel)
	# -------------------------------------------------------------------------
	print("\n--- Shot 8: Seven Realms Physical Integrity Overview ---")
	var antariksha_scene = load("res://scenes/levels/AntarikshaSkyRealm3D.tscn")
	var antariksha = antariksha_scene.instantiate()
	root.add_child(antariksha)
	for f in range(25): await process_frame
	await capture.call("08_seven_realms_physical_integrity_overview", "Antariksha sky realm with physical collision on floating sky platforms")
	antariksha.queue_free()

	print("\n================================================================")
	print("  STAGE Q9 PHYSICAL INTEGRITY & CAMERA CAPTURES COMPLETE!       ")
	print("================================================================\n")
	quit(0)
