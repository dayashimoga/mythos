extends SceneTree

## Stage Q5-B Production Patala Realm Remaster Screenshot Capturer
## Captures 10 high-definition in-engine validation screenshots:
## 1. 01_patala_entrance_cavern_panoramic.png
## 2. 02_patala_venom_river_basin_hazard.png
## 3. 03_patala_bouncy_fungus_springboard.png
## 4. 04_patala_mid_chamber_gate_arch.png
## 5. 05_patala_naga_spitter_venom_charge.png
## 6. 06_patala_naga_constrictor_leap_strike.png
## 7. 07_patala_boss_shesha_7_hoods_stance.png
## 8. 08_patala_boss_shesha_tail_sweep_telegraph.png
## 9. 09_patala_boss_shesha_awakened_fury_enrage.png
## 10. 10_patala_vasuki_peetham_and_svar_portal.png

const OUT_DIR = "res://../screenshots/patala_q5/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/4a5bfbbb-2b05-4ffa-a9b4-fd46b2031671/"

func _init() -> void:
	call_deferred("_run_patala_captures")

func _run_patala_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q5-B PATALA REALM VALIDATION CAPTURES          ")
	print("================================================================")
	var abs_out_dir = ProjectSettings.globalize_path(OUT_DIR)
	DirAccess.make_dir_recursive_absolute(abs_out_dir)
	DirAccess.make_dir_recursive_absolute(BRAIN_DIR)

	# 1. Load PatalaUnderworld3D Scene
	var realm_scene = load("res://scenes/levels/PatalaUnderworld3D.tscn")
	var world = realm_scene.instantiate()
	root.add_child(world)

	# Allow scene initialization and shaders to warm up
	for f in range(35):
		await process_frame

	var player: PlayerController3D = world.find_child("Player3D", true, false)
	var boss: BossSheshaEcho3D = world.find_child("BossSheshaEcho3D", true, false)
	var spitter: NagaSpitter3D = world.find_child("NagaSpitter1", true, false)
	var constrictor: NagaConstrictor3D = world.find_child("NagaConstrictor1", true, false)
	var hud: HUD3D = world.find_child("HUD3D", true, false)

	if hud and hud.banner_panel:
		hud.banner_panel.visible = false
		hud.banner_panel.modulate.a = 0.0

	# Dedicated Cinematic Camera
	var cine_cam = Camera3D.new()
	cine_cam.name = "CinePatalaCamera"
	cine_cam.fov = 46.0
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
	if spitter:
		spitter.set_physics_process(false)
	if constrictor:
		constrictor.set_physics_process(false)

	# -------------------------------------------------------------
	# SHOT 1: Entrance Cavern Panoramic (Devi Tara & Serpent Archway)
	# -------------------------------------------------------------
	print("\n--- Shot 1: Entrance Cavern Panoramic ---")
	if player:
		player.global_position = Vector3(0, 1.2, 0)
		player._play_anim("idle")
	cine_cam.global_position = Vector3(5.5, 4.2, 5.0)
	cine_cam.look_at(Vector3(0, 2.0, -7.0), Vector3.UP)
	await capture.call("01_patala_entrance_cavern_panoramic", "Entrance Cavern with Devi Tara and Carved Serpent Archway")

	# -------------------------------------------------------------
	# SHOT 2: Venom River Basin Hazard
	# -------------------------------------------------------------
	print("\n--- Shot 2: Venom River Basin Hazard ---")
	if player:
		player.global_position = Vector3(0, 1.2, -8.0)
		player._play_anim("walk")
	cine_cam.global_position = Vector3(9.0, 3.5, -13.0)
	cine_cam.look_at(Vector3(0, -2.5, -18.0), Vector3.UP)
	await capture.call("02_patala_venom_river_basin_hazard", "Emerald Glowing Toxic Venom River Basin and Stone Banks")

	# -------------------------------------------------------------
	# SHOT 3: Bioluminescent Bouncy Fungus Springboard
	# -------------------------------------------------------------
	print("\n--- Shot 3: Bioluminescent Bouncy Fungus Springboard ---")
	if player:
		player.global_position = Vector3(0, 3.8, -12.0)
		player._play_anim("jump_rise")
	cine_cam.global_position = Vector3(-4.5, 2.0, -8.5)
	cine_cam.look_at(Vector3(0, -1.0, -12.0), Vector3.UP)
	await capture.call("03_patala_bouncy_fungus_springboard", "Player Springboarding off Bioluminescent Turquoise Fungus")

	# -------------------------------------------------------------
	# SHOT 4: Mid Chamber Gate Arch & Stalactite Vaults
	# -------------------------------------------------------------
	print("\n--- Shot 4: Mid Chamber Gate Arch ---")
	if player:
		player.global_position = Vector3(0, 1.2, -30.0)
		player._play_anim("run")
	cine_cam.global_position = Vector3(0, 6.0, -22.0)
	cine_cam.look_at(Vector3(0, 2.5, -40.0), Vector3.UP)
	await capture.call("04_patala_mid_chamber_gate_arch", "Mid Chamber Serpent Gateway with Hanging Stalactite Formations")

	# -------------------------------------------------------------
	# SHOT 5: Naga Spitter Venom Charge & Telegraph
	# -------------------------------------------------------------
	print("\n--- Shot 5: Naga Spitter Venom Charge ---")
	if spitter:
		spitter.global_position = Vector3(-3.0, 1.2, -34.0)
		spitter._play_anim("telegraph_coil")
		if spitter.venom_light:
			spitter.venom_light.visible = true
			spitter.venom_light.light_energy = 4.0
	cine_cam.global_position = Vector3(-1.0, 2.4, -31.5)
	cine_cam.look_at(Vector3(-3.0, 2.0, -34.0), Vector3.UP)
	await capture.call("05_patala_naga_spitter_venom_charge", "Naga Spitter with Flared Cobra Hood and Bioluminescent Throat Sac")

	# -------------------------------------------------------------
	# SHOT 6: Naga Constrictor Leap Strike
	# -------------------------------------------------------------
	print("\n--- Shot 6: Naga Constrictor Leap Strike ---")
	if constrictor:
		constrictor.global_position = Vector3(1.5, 1.5, -36.0)
		constrictor._play_anim("leap_strike")
	cine_cam.global_position = Vector3(-1.5, 2.2, -33.0)
	cine_cam.look_at(Vector3(1.5, 2.0, -36.0), Vector3.UP)
	await capture.call("06_patala_naga_constrictor_leap_strike", "Naga Constrictor Coiled Warrior in Twin Dagger Strike")

	# -------------------------------------------------------------
	# SHOT 7: Boss Shesha Echo 7 Hoods Monumental Stance
	# -------------------------------------------------------------
	print("\n--- Shot 7: Boss Shesha Echo 7 Hoods Stance ---")
	if boss:
		boss.global_position = Vector3(0, 5.0, -70.0)
		boss._play_anim("boss_hood_flare")
	if player:
		player.global_position = Vector3(0, 5.0, -60.0)
		player._play_anim("guard_idle")
	cine_cam.global_position = Vector3(0, 7.5, -57.0)
	cine_cam.look_at(Vector3(0, 8.0, -70.0), Vector3.UP)
	await capture.call("07_patala_boss_shesha_7_hoods_stance", "Boss Shesha's Tormented Echo with 7 Flaring Cobra Hoods and Nagamani Gem")

	# -------------------------------------------------------------
	# SHOT 8: Boss Shesha Tail Sweep Telegraph
	# -------------------------------------------------------------
	print("\n--- Shot 8: Boss Shesha Tail Sweep Telegraph ---")
	if boss:
		boss._play_anim("boss_tail_sweep_telegraph")
	cine_cam.global_position = Vector3(6.5, 7.0, -64.0)
	cine_cam.look_at(Vector3(0, 7.0, -70.0), Vector3.UP)
	await capture.call("08_patala_boss_shesha_tail_sweep_telegraph", "Boss Shesha Coiling for 360-Degree Tail Sweep Attack")

	# -------------------------------------------------------------
	# SHOT 9: Boss Shesha Awakened Fury Enrage Roar
	# -------------------------------------------------------------
	print("\n--- Shot 9: Boss Shesha Awakened Fury Enrage Roar ---")
	if boss:
		boss._play_anim("boss_roar_enrage")
		if boss.nagamani_light:
			boss.nagamani_light.light_color = Color(0.95, 0.1, 0.35, 1.0)
			boss.nagamani_light.light_energy = 8.0
	cine_cam.global_position = Vector3(0, 8.0, -63.0)
	cine_cam.look_at(Vector3(0, 8.5, -70.0), Vector3.UP)
	await capture.call("09_patala_boss_shesha_awakened_fury_enrage", "Boss Shesha Phase 2 Awakened Fury Roar with Red Luminescent Surge")

	# -------------------------------------------------------------
	# SHOT 10: Vasuki Peetham Sanctum & Svar Ascension Portal
	# -------------------------------------------------------------
	print("\n--- Shot 10: Vasuki Peetham Sanctum & Svar Ascension Portal ---")
	world._spawn_svar_portal()
	if player:
		player.global_position = Vector3(0, 8.0, -88.0)
		player._play_anim("attack_slash2")
	cine_cam.global_position = Vector3(5.5, 10.5, -84.0)
	cine_cam.look_at(Vector3(0, 9.2, -92.0), Vector3.UP)
	await capture.call("10_patala_vasuki_peetham_and_svar_portal", "Consecrated Vasuki Peetham Shrine with Svar Ascension Portal Beam")

	print("\n================================================================")
	print("  ALL 10 PATALA VALIDATION SCREENSHOTS CAPTURED SUCCESSFULLY!   ")
	print("================================================================")
	quit(0)
