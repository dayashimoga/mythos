extends SceneTree

## Stage Q3 Bhumi Remaster Screenshot & Traversal Validation Capturer
## Captures high-definition in-engine screenshots of the remastered Bhumi 3D landscape:
## 1. Sanctum Vimana & Mandapa Architecture (Panoramic)
## 2. Torana Ceremonial Gateway & Processional Path
## 3. Kalyani Stepped Water Reservoir & Ghat Pavilions
## 4. Dandaka Sacred Grove & Ancient Banyan Trees
## 5. Tapas Mountain Ridge Switchback Pathway
## 6. Ruined Kalanemi Fortress Watchtower Bastion
## 7. Close-Up: Veer at Sanctum Portal with Hoysala Columns
## 8. Valley-Wide Sunset Atmospheric Perspective

const OUT_DIR = "res://../screenshots/bhumi_remaster_q3/"

func _init() -> void:
	call_deferred("_run_bhumi_captures")

func _run_bhumi_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q3 BHUMI REMASTER VALIDATION CAPTURES          ")
	print("================================================================")
	var abs_out_dir = ProjectSettings.globalize_path(OUT_DIR)
	DirAccess.make_dir_recursive_absolute(abs_out_dir)

	# 1. Load BhumiValley3D Scene
	var bhumi_scene = load("res://scenes/levels/BhumiValley3D.tscn")
	var world = bhumi_scene.instantiate()
	root.add_child(world)

	# Allow scene initialization, terrain trimesh generation, and shaders to warm up
	for f in range(35):
		await process_frame

	var player: PlayerController3D = world.find_child("Player3D", true, false)
	var hud: HUD3D = world.find_child("HUD3D", true, false)
	if hud:
		if hud.banner_panel:
			hud.banner_panel.visible = false
			hud.banner_panel.modulate.a = 0.0

	# Dedicated Cinematic Camera for landscape composition
	var cine_cam = Camera3D.new()
	cine_cam.name = "CineCaptureCamera"
	cine_cam.fov = 65.0
	cine_cam.near = 0.1
	cine_cam.far = 300.0
	cine_cam.current = true
	world.add_child(cine_cam)

	var capture = func(filename: String, desc: String):
		if hud and hud.banner_panel:
			hud.banner_panel.visible = false
			hud.banner_panel.modulate.a = 0.0
		for f in range(12):
			if hud and hud.banner_panel:
				hud.banner_panel.visible = false
				hud.banner_panel.modulate.a = 0.0
			await process_frame
		var img = root.get_texture().get_image()
		if img and not img.is_empty():
			var p = abs_out_dir + filename + ".png"
			var err = img.save_png(p)
			if err == OK:
				print("  [CAPTURED] " + filename + " — " + desc)
			else:
				printerr("  [ERROR] Failed to save " + filename + ": ", err)

	# --- View 1: Sanctum Vimana & Mandapa Architecture (Panoramic Three-Quarter) ---
	cine_cam.position = Vector3(14.0, 7.2, 16.0)
	cine_cam.look_at(Vector3(0.0, 6.0, -2.0), Vector3.UP)
	if player:
		player.position = Vector3(0.0, 1.4, 4.2)
		player.visual_root.rotation.y = deg_to_rad(180.0)
	await capture.call("01_bhumi_sanctum_vimana_panoramic", "14.8m Hoysala Dravidian Vimana tower with Adhisthana base and Kalasha finial")

	# --- View 2: Torana Ceremonial Gateway & Processional Path ---
	cine_cam.position = Vector3(0.0, 2.6, 26.0)
	cine_cam.look_at(Vector3(0.0, 4.2, 12.0), Vector3.UP)
	if player:
		player.position = Vector3(0.0, 0.0, 18.0)
		player.visual_root.rotation.y = deg_to_rad(0.0)
	await capture.call("02_bhumi_torana_ceremonial_gateway", "Sanchi-style Torana ceremonial gateway with curved Makara architraves")

	# --- View 3: Kalyani Stepped Water Reservoir & Ghat Pavilions ---
	cine_cam.position = Vector3(4.0, 3.2, 28.0)
	cine_cam.look_at(Vector3(-6.0, -0.6, 45.0), Vector3.UP)
	if player:
		player.position = Vector3(-6.0, -0.2, 34.0)
		player.visual_root.rotation.y = deg_to_rad(0.0)
	await capture.call("03_bhumi_kalyani_stepped_water_reservoir", "Kalyani water reservoir with turquoise reflective water and corner Chhatri pavilions")

	# --- View 4: Dandaka Sacred Grove & Ancient Banyan Trees ---
	cine_cam.position = Vector3(-18.0, 3.8, -14.0)
	cine_cam.look_at(Vector3(-36.0, 3.5, -26.0), Vector3.UP)
	if player:
		player.position = Vector3(-24.0, 1.5, -18.0)
		player.visual_root.rotation.y = deg_to_rad(-45.0)
	await capture.call("04_bhumi_dandaka_sacred_banyan_grove", "Dandaka forest grove with monumental Vata-Vriksha banyans and aerial prop roots")

	# --- View 5: Tapas Mountain Ridge Switchback Pathway ---
	cine_cam.position = Vector3(24.0, 4.2, 4.0)
	cine_cam.look_at(Vector3(42.0, 8.5, -18.0), Vector3.UP)
	if player:
		player.position = Vector3(30.0, 2.5, -2.0)
		player.visual_root.rotation.y = deg_to_rad(-120.0)
	await capture.call("05_bhumi_tapas_mountain_switchback_trail", "Ascending Tapas mountain switchback trail with red ochre cliff faces and basalt crags")

	# --- View 6: Ruined Kalanemi Fortress Watchtower Bastion ---
	cine_cam.position = Vector3(48.0, 13.5, -36.0)
	cine_cam.look_at(Vector3(55.0, 14.8, -45.0), Vector3.UP)
	if player:
		player.position = Vector3(51.0, 12.2, -40.0)
		player.visual_root.rotation.y = deg_to_rad(-135.0)
	await capture.call("06_bhumi_ruined_watchtower_fortress_bastion", "Mountain summit Kalanemi fortress watchtower with spiral exterior stairs and battlements")

	# --- View 7: Close-Up: Veer at Sanctum Portal with Hoysala Columns ---
	cine_cam.position = Vector3(1.6, 2.1, 6.2)
	cine_cam.look_at(Vector3(0.0, 1.8, 3.2), Vector3.UP)
	if player:
		player.position = Vector3(0.0, 1.4, 3.4)
		player.visual_root.rotation.y = deg_to_rad(150.0)
		player.velocity = Vector3.ZERO
		player._update_locomotion_animation(0.016)
	await capture.call("07_bhumi_sanctum_entrance_veer_closeup", "Close-up of Veer at the Sanctum entrance with lathe-turned pillars and golden diya lamps")

	# --- View 8: Valley-Wide Atmospheric Panorama ---
	cine_cam.position = Vector3(45.0, 22.0, 35.0)
	cine_cam.look_at(Vector3(0.0, 4.0, 0.0), Vector3.UP)
	await capture.call("08_bhumi_golden_hour_atmospheric_panorama", "Panoramic golden-hour landscape over the entire Bhumi valley and mountain horizons")

	print("================================================================")
	print("  ALL 8 STAGE Q3 BHUMI REMASTER CAPTURES COMPLETED!             ")
	print("================================================================")
	world.queue_free()
	quit(0)
