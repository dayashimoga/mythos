extends SceneTree

## Stage Q2 Locomotion & Gameplay Validation Capturer
## Captures continuous high-fidelity gameplay evidence of:
## Idle -> Walk -> Jog -> Sprint -> Turn Banking -> Jump -> Land -> Dodge -> Attack -> Block -> Slope/Stairs -> Bhumi Valley

const OUT_DIR = "res://../screenshots/locomotion_q2/"

func _init() -> void:
	call_deferred("_run_validation_captures")

func _run_validation_captures() -> void:
	print("[LOCOMOTION CAPTURER] Starting Stage Q2 Gameplay Validation Captures...")
	var abs_out_dir = ProjectSettings.globalize_path(OUT_DIR)
	DirAccess.make_dir_recursive_absolute(abs_out_dir)

	# 1. Load Test Chamber Scene for Locomotion Mechanics
	print("[LOCOMOTION CAPTURER] Loading Test Chamber 3D...")
	var chamber_scene = load("res://scenes/levels/TestChamber3D.tscn")
	var chamber = chamber_scene.instantiate()
	root.add_child(chamber)

	# Wait for physics and rendering to initialize
	for f in range(25):
		await process_frame

	var player: PlayerController3D = chamber.find_child("Player", true, false)
	var cam_arm: SpringArm3D = player.camera_arm if player else null
	var hud: HUD3D = chamber.find_child("HUD3D", true, false)
	if hud and hud.banner_panel:
		hud.banner_panel.visible = false

	if not player:
		printerr("[LOCOMOTION CAPTURER] Player not found in TestChamber3D!")
		quit(1)
		return

	# Helper to capture active frame
	var capture = func(filename: String, desc: String):
		if hud and hud.banner_panel:
			hud.banner_panel.visible = false
		var img = root.get_texture().get_image()
		if img and not img.is_empty():
			var p = abs_out_dir + filename + ".png"
			var err = img.save_png(p)
			if err == OK:
				print("  [CAPTURED] " + filename + " — " + desc)
			else:
				printerr("  [ERROR] Failed to save " + filename + ": ", err)

	# Setup Camera & Character
	if cam_arm:
		cam_arm.spring_length = 3.6
		cam_arm.rotation.x = deg_to_rad(-12.0)

	# Capture 1: Idle (Front-Three-Quarter View)
	player.visual_root.rotation.y = deg_to_rad(30.0)
	player.velocity = Vector3.ZERO
	player._update_locomotion_animation(0.016)
	if cam_arm:
		cam_arm.rotation.y = deg_to_rad(195.0) # Look toward front of Veer
	for f in range(20):
		await process_frame
	await capture.call("01_veer_locomotion_idle", "Veer idle rest stance with breathing and grounded feet")

	# Capture 2: Walk (4.2 m/s, Side/Three-Quarter View)
	player.visual_root.rotation.y = deg_to_rad(75.0)
	player.velocity = -player.visual_root.transform.basis.z * 4.2
	player._update_locomotion_animation(0.016)
	player._update_body_lean_physics(0.016, 4.2)
	if cam_arm:
		cam_arm.rotation.y = deg_to_rad(165.0)
	for f in range(20):
		await process_frame
	await capture.call("02_veer_locomotion_walk", "Veer walking gait with heel strike and foot roll articulation")

	# Capture 3: Jog (7.5 m/s, Athletic Stride)
	player.visual_root.rotation.y = deg_to_rad(75.0)
	player.velocity = -player.visual_root.transform.basis.z * 7.5
	player._update_locomotion_animation(0.016)
	player._update_body_lean_physics(0.016, 7.5)
	if cam_arm:
		cam_arm.rotation.y = deg_to_rad(160.0)
	for f in range(20):
		await process_frame
	await capture.call("03_veer_locomotion_jog", "Veer jogging gait with athletic spring and weight transfer")

	# Capture 4: Sprint (10.5 m/s, High Speed Lean)
	player.visual_root.rotation.y = deg_to_rad(75.0)
	player.velocity = -player.visual_root.transform.basis.z * 10.5
	player._update_locomotion_animation(0.016)
	player._update_body_lean_physics(0.016, 10.5)
	if cam_arm:
		cam_arm.rotation.y = deg_to_rad(155.0)
	for f in range(20):
		await process_frame
	await capture.call("04_veer_locomotion_sprint", "Veer high-speed sprint with dynamic forward lean and arm counter-swing")

	# Capture 5: Turn Banking (Body Roll into Curve)
	player.visual_root.rotation.y = deg_to_rad(45.0)
	player.velocity = -player.visual_root.transform.basis.z * 8.0
	player._update_locomotion_animation(0.016)
	# Apply noticeable banking lean into the turn
	player.visual_root.rotation.z = -0.12
	player.visual_root.rotation.x = 0.08
	if cam_arm:
		cam_arm.rotation.y = deg_to_rad(190.0)
	for f in range(15):
		await process_frame
	await capture.call("05_veer_locomotion_turn_banking", "Veer executing sharp turn with physical body banking lean")

	# Capture 6: Jump (Airborne Ascending Arc)
	player.visual_root.rotation.z = 0.0
	player.visual_root.rotation.y = deg_to_rad(30.0)
	player.velocity = Vector3(0, 5.5, -3.0)
	player._travel_to("jump")
	if cam_arm:
		cam_arm.rotation.y = deg_to_rad(190.0)
		cam_arm.rotation.x = deg_to_rad(-8.0)
	for f in range(15):
		await process_frame
	await capture.call("06_veer_locomotion_jump", "Veer ascending airborne jump arc with legs tucked")

	# Capture 7: Landing (Ground Impact Compression)
	player.velocity = Vector3.ZERO
	player._travel_to("landing")
	if cam_arm:
		cam_arm.rotation.y = deg_to_rad(190.0)
		cam_arm.rotation.x = deg_to_rad(-12.0)
	for f in range(15):
		await process_frame
	await capture.call("07_veer_locomotion_landing", "Veer landing impact shock absorption and knee compression")

	# Capture 8: Dodge (Prana Dash Roll)
	player.visual_root.rotation.y = deg_to_rad(60.0)
	player.velocity = -player.visual_root.transform.basis.z * 12.0
	player._travel_to("dodge")
	if cam_arm:
		cam_arm.rotation.y = deg_to_rad(170.0)
	for f in range(15):
		await process_frame
	await capture.call("08_veer_locomotion_dodge", "Veer Prana Dash evasive roll with invulnerability")

	# Capture 9: Combat Attack Combo Slash
	player.visual_root.rotation.y = deg_to_rad(30.0)
	player.velocity = Vector3.ZERO
	player.is_attacking = true
	player.combo_index = 1
	player.attack_timer = 0.22
	player._travel_to("attack_light_1")
	if player.melee_hitbox:
		player.melee_hitbox.monitoring = true
	if cam_arm:
		cam_arm.rotation.y = deg_to_rad(185.0)
	for f in range(15):
		await process_frame
	await capture.call("09_veer_combat_attack_slash", "Veer Surya sword slash with active melee hitbox arc")

	# Capture 10: Shield Guard Block
	player.is_attacking = false
	if player.melee_hitbox:
		player.melee_hitbox.monitoring = false
	player.is_guarding = true
	player._travel_to("block")
	if cam_arm:
		cam_arm.rotation.y = deg_to_rad(180.0)
	for f in range(15):
		await process_frame
	await capture.call("10_veer_combat_block_guard", "Veer directional shield guard stance with 75% damage deflection")

	# Capture 11: Stairs & Slopes Traversal
	player.is_guarding = false
	player.position = Vector3(0, 1.2, 5.0) # Elevated on stairs/platform
	player.visual_root.rotation.y = deg_to_rad(0.0)
	player.velocity = Vector3(0, 0, -4.2)
	player._update_locomotion_animation(0.016)
	if cam_arm:
		cam_arm.rotation.y = deg_to_rad(200.0)
		cam_arm.rotation.x = deg_to_rad(-16.0)
	for f in range(15):
		await process_frame
	await capture.call("11_veer_locomotion_stairs_slopes", "Veer stair and slope floor-snapped locomotion (0.45m step snap)")

	# Remove Chamber scene
	root.remove_child(chamber)
	chamber.queue_free()
	for f in range(5):
		await process_frame

	# 2. Load Bhumi Valley for Outdoor Open World Gameplay
	print("[LOCOMOTION CAPTURER] Loading Bhumi Valley 3D...")
	var bhumi_scene = load("res://scenes/levels/BhumiValley3D.tscn")
	var bhumi = bhumi_scene.instantiate()
	root.add_child(bhumi)

	var bhumi_hud: HUD3D = bhumi.find_child("HUD3D", true, false)
	if bhumi_hud and bhumi_hud.banner_panel:
		bhumi_hud.banner_panel.visible = false

	var bhumi_player: PlayerController3D = bhumi.find_child("Player3D", true, false)
	if bhumi_player:
		bhumi_player.visual_root.rotation.y = deg_to_rad(35.0)
		bhumi_player.velocity = -bhumi_player.visual_root.transform.basis.z * 7.5
		bhumi_player._update_locomotion_animation(0.016)
		bhumi_player._update_body_lean_physics(0.016, 7.5)
		if bhumi_player.camera_arm:
			bhumi_player.camera_arm.rotation.y = deg_to_rad(190.0)
			bhumi_player.camera_arm.rotation.x = deg_to_rad(-12.0)

	for f in range(25):
		if bhumi_hud and bhumi_hud.banner_panel:
			bhumi_hud.banner_panel.visible = false
		await process_frame

	await capture.call("12_veer_gameplay_bhumi_valley", "Veer running across organic terrain and ruins of Bhumi Valley")

	root.remove_child(bhumi)
	bhumi.queue_free()
	for f in range(5):
		await process_frame

	print("[LOCOMOTION CAPTURER] All Stage Q2 Locomotion Captures completed successfully!")
	quit(0)
