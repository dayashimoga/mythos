extends SceneTree

## Stage Q5-C Production Svar Realm Remaster Screenshot Capturer
## Captures 10 high-definition in-engine validation screenshots:
## 1. 01_svar_entry_bastion_panoramic.png
## 2. 02_svar_solar_light_bridge_crossing.png
## 3. 03_svar_mid_bastion_and_prisms.png
## 4. 04_svar_surya_guardian_spear_stance.png
## 5. 05_svar_surya_guardian_shield_block.png
## 6. 06_svar_solar_gryphon_aerial_hover.png
## 7. 07_svar_boss_surya_avatara_colosseum_stance.png
## 8. 08_svar_boss_surya_cleave_telegraph.png
## 9. 09_svar_boss_surya_supernova_ignition_enrage.png
## 10. 10_svar_mahapeetham_and_maharloka_portal.png

const OUT_DIR = "res://../screenshots/svar_q5/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/ebde482a-7463-4886-8fc0-62ef0783fc6e/"

func _init() -> void:
	call_deferred("_run_svar_captures")

func _run_svar_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q5-C SVAR REALM VALIDATION CAPTURES            ")
	print("================================================================")
	var abs_out_dir = ProjectSettings.globalize_path(OUT_DIR)
	DirAccess.make_dir_recursive_absolute(abs_out_dir)
	DirAccess.make_dir_recursive_absolute(BRAIN_DIR)

	# 1. Load SvarSolarCitadel3D Scene
	var realm_scene = load("res://scenes/levels/SvarSolarCitadel3D.tscn")
	var world = realm_scene.instantiate()
	root.add_child(world)

	# Allow scene initialization and shaders to warm up
	for f in range(35):
		await process_frame

	var player: PlayerController3D = world.find_child("Player3D", true, false)
	var boss: BossSuryaAvatara3D = world.find_child("BossSuryaAvatara3D", true, false)
	var guardian: SuryaGuardian3D = world.find_child("SuryaGuardian1", true, false)
	var gryphon: SolarGryphon3D = world.find_child("SolarGryphon1", true, false)
	var hud: HUD3D = world.find_child("HUD3D", true, false)

	if hud and hud.banner_panel:
		hud.banner_panel.visible = false
		hud.banner_panel.modulate.a = 0.0

	# Dedicated Cinematic Camera
	var cine_cam = Camera3D.new()
	cine_cam.name = "CineSvarCamera"
	cine_cam.fov = 48.0
	cine_cam.near = 0.1
	cine_cam.far = 300.0
	cine_cam.current = true
	world.add_child(cine_cam)

	var capture = func(filename: String, desc: String):
		for f in range(12):
			if hud and hud.banner_panel and not filename.contains("portal"):
				hud.banner_panel.visible = false
				hud.banner_panel.modulate.a = 0.0
			await process_frame

		var img = root.get_texture().get_image()
		if img and not img.is_empty():
			var p = abs_out_dir + filename + ".png"
			var err = img.save_png(p)
			if err == OK:
				print("  [CAPTURED] " + filename + " — " + desc)
				var brain_path = BRAIN_DIR + filename + ".png"
				img.save_png(brain_path)
			else:
				printerr("  [ERROR] Failed to save " + filename + ": ", err)
		else:
			printerr("  [ERROR] Image empty for " + filename)

	if player:
		player.set_physics_process(false)
	if boss:
		boss.set_physics_process(false)
	if guardian:
		guardian.set_physics_process(false)
	if gryphon:
		gryphon.set_physics_process(false)

	# -------------------------------------------------------------
	# SHOT 1: Entry Bastion Panoramic (Devi Tara & Solar Braziers)
	# -------------------------------------------------------------
	print("\n--- Shot 1: Entry Bastion Panoramic ---")
	if player:
		player.global_position = Vector3(0, 1.2, 0)
		player._play_anim("idle")
	cine_cam.global_position = Vector3(5.5, 4.0, 5.5)
	cine_cam.look_at(Vector3(0, 1.5, -6.0), Vector3.UP)
	await capture.call("01_svar_entry_bastion_panoramic", "Golden marble entry bastion with Devi Tara and fluted braziers")

	# -------------------------------------------------------------
	# SHOT 2: Solar Light Bridge Crossing
	# -------------------------------------------------------------
	print("\n--- Shot 2: Solar Light Bridge Crossing ---")
	if player:
		player.global_position = Vector3(0, 1.2, -18)
		player._play_anim("walk")
	cine_cam.global_position = Vector3(6.5, 3.5, -12)
	cine_cam.look_at(Vector3(0, 1.0, -28), Vector3.UP)
	await capture.call("02_svar_solar_light_bridge_crossing", "Shimmering crystalline solar light bridge across celestial sky")

	# -------------------------------------------------------------
	# SHOT 3: Mid Bastion & Rotating Surya Prisms
	# -------------------------------------------------------------
	print("\n--- Shot 3: Mid Bastion & Rotating Surya Prisms ---")
	cine_cam.global_position = Vector3(0, 5.0, -34)
	cine_cam.look_at(Vector3(0, 2.0, -48), Vector3.UP)
	await capture.call("03_svar_mid_bastion_and_prisms", "Mid bastion terrace with rotating crystal Surya Prisms")

	# -------------------------------------------------------------
	# SHOT 4: Surya Guardian Spear Stance
	# -------------------------------------------------------------
	print("\n--- Shot 4: Surya Guardian Spear Stance ---")
	if guardian:
		guardian.global_position = Vector3(-2, 1.0, -47)
		guardian._play_anim("idle")
	cine_cam.global_position = Vector3(-2, 2.2, -43)
	cine_cam.look_at(Vector3(-2, 2.0, -47), Vector3.UP)
	await capture.call("04_svar_surya_guardian_spear_stance", "Armored Surya Guardian with suncrest helm, spear and radiant shield")

	# -------------------------------------------------------------
	# SHOT 5: Surya Guardian Shield Block
	# -------------------------------------------------------------
	print("\n--- Shot 5: Surya Guardian Shield Block ---")
	if guardian:
		guardian._play_anim("shield_block")
	cine_cam.global_position = Vector3(-0.8, 2.0, -44.5)
	cine_cam.look_at(Vector3(-2, 1.8, -47), Vector3.UP)
	await capture.call("05_svar_surya_guardian_shield_block", "Surya Guardian raising radiant sun shield in defensive block")

	# -------------------------------------------------------------
	# SHOT 6: Solar Gryphon Aerial Hover
	# -------------------------------------------------------------
	print("\n--- Shot 6: Solar Gryphon Aerial Hover ---")
	if gryphon:
		gryphon.global_position = Vector3(3, 2.6, -50)
		gryphon._play_anim("idle")
	cine_cam.global_position = Vector3(3, 3.2, -46)
	cine_cam.look_at(Vector3(3, 2.6, -50), Vector3.UP)
	await capture.call("06_svar_solar_gryphon_aerial_hover", "Winged Solar Gryphon hovering with golden plumage and razor talons")

	# -------------------------------------------------------------
	# SHOT 7: Boss Surya Avatara Colosseum Stance
	# -------------------------------------------------------------
	print("\n--- Shot 7: Boss Surya Avatara Colosseum Stance ---")
	if boss:
		boss.global_position = Vector3(0, 4.0, -96)
		boss._play_anim("boss_idle")
	cine_cam.global_position = Vector3(0, 6.5, -84)
	cine_cam.look_at(Vector3(0, 5.0, -96), Vector3.UP)
	await capture.call("07_svar_boss_surya_avatara_colosseum_stance", "Monumental 3.8m Boss Surya Avatara Sun Titan in the Apex Citadel arena")

	# -------------------------------------------------------------
	# SHOT 8: Boss Surya Cleave Telegraph
	# -------------------------------------------------------------
	print("\n--- Shot 8: Boss Surya Cleave Telegraph ---")
	if boss:
		boss._play_anim("boss_cleave_telegraph")
	cine_cam.global_position = Vector3(4.5, 6.0, -90)
	cine_cam.look_at(Vector3(0, 5.5, -96), Vector3.UP)
	await capture.call("08_svar_boss_surya_cleave_telegraph", "Boss Surya Avatara raising 3.2m sunsteel greatsword high overhead")

	# -------------------------------------------------------------
	# SHOT 9: Boss Surya Supernova Ignition Enrage
	# -------------------------------------------------------------
	print("\n--- Shot 9: Boss Surya Supernova Ignition Enrage ---")
	if boss:
		boss._play_anim("boss_enrage_flare")
	cine_cam.global_position = Vector3(-3.5, 5.5, -91)
	cine_cam.look_at(Vector3(0, 5.5, -96), Vector3.UP)
	await capture.call("09_svar_boss_surya_supernova_ignition_enrage", "Phase 2 Supernova Ignition enrage with blazing solar halo flare")

	# -------------------------------------------------------------
	# SHOT 10: Surya Mahapeetham & Maharloka Ascension Portal
	# -------------------------------------------------------------
	print("\n--- Shot 10: Surya Mahapeetham & Maharloka Portal ---")
	if world.has_method("_spawn_maharloka_portal"):
		world._spawn_maharloka_portal()
	if player:
		player.global_position = Vector3(0, 7.5, -114)
		player._play_anim("idle")
	cine_cam.global_position = Vector3(5.0, 9.2, -110)
	cine_cam.look_at(Vector3(0, 8.0, -118), Vector3.UP)
	await capture.call("10_svar_mahapeetham_and_maharloka_portal", "Consecrated Surya Mahapeetham with violet Maharloka ascent portal")

	print("\n================================================================")
	print("  STAGE Q5-C SVAR VALIDATION CAPTURES COMPLETE!                ")
	print("================================================================")
	quit(0)
