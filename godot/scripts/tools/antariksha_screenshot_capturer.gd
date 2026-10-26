extends SceneTree

## Stage Q5-A Production Antariksha Realm Remaster Screenshot Capturer
## Captures 10 high-definition in-engine validation screenshots:
## 1. 01_antariksha_sky_sanctuary_panoramic.png
## 2. 02_antariksha_prana_glider_aerial_descent.png
## 3. 03_antariksha_vayu_wind_turbine_ridge.png
## 4. 04_antariksha_harpoon_grapple_tether.png
## 5. 05_antariksha_gale_falcon_dive_attack.png
## 6. 06_antariksha_wind_archer_hover_snipe.png
## 7. 07_antariksha_boss_matarishvan_quad_wings_stance.png
## 8. 08_antariksha_boss_matarishvan_cleave_telegraph.png
## 9. 09_antariksha_boss_matarishvan_tempest_roar_enrage.png
## 10. 10_antariksha_patala_descent_portal_consecration.png

const OUT_DIR = "res://../screenshots/antariksha_q5/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/4a5bfbbb-2b05-4ffa-a9b4-fd46b2031671/"

func _init() -> void:
	call_deferred("_run_antariksha_captures")

func _run_antariksha_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q5-A ANTARIKSHA REALM VALIDATION CAPTURES       ")
	print("================================================================")
	var abs_out_dir = ProjectSettings.globalize_path(OUT_DIR)
	DirAccess.make_dir_recursive_absolute(abs_out_dir)
	DirAccess.make_dir_recursive_absolute(BRAIN_DIR)

	# 1. Load AntarikshaSkyRealm3D Scene
	var realm_scene = load("res://scenes/levels/AntarikshaSkyRealm3D.tscn")
	var world = realm_scene.instantiate()
	root.add_child(world)

	# Allow scene initialization and shaders to warm up
	for f in range(35):
		await process_frame

	var player: PlayerController3D = world.find_child("Player3D", true, false)
	var boss: BossMatarishvan3D = world.find_child("BossMatarishvan3D", true, false)
	var falcon: GaleFalcon3D = world.find_child("GaleFalcon1", true, false)
	var archer: WindArcher3D = world.find_child("WindArcher1", true, false)
	var hud: HUD3D = world.find_child("HUD3D", true, false)

	if hud and hud.banner_panel:
		hud.banner_panel.visible = false
		hud.banner_panel.modulate.a = 0.0

	# Dedicated Cinematic Camera
	var cine_cam = Camera3D.new()
	cine_cam.name = "CineAntarikshaCamera"
	cine_cam.fov = 44.0
	cine_cam.near = 0.1
	cine_cam.far = 400.0
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
	if falcon:
		falcon.set_physics_process(false)
	if archer:
		archer.set_physics_process(false)

	# -------------------------------------------------------------
	# SHOT 1: Sky Sanctuary Island Panoramic (Devi Tara in Pavilion)
	# -------------------------------------------------------------
	print("\n--- Shot 1: Sky Sanctuary Island Panoramic ---")
	if player:
		player.global_position = Vector3(0, 40.0, 3.5)
		player._play_anim("idle")
	cine_cam.global_position = Vector3(7.5, 43.5, 9.5)
	cine_cam.look_at(Vector3(0, 41.5, -4.0), Vector3.UP)
	await capture.call("01_antariksha_sky_sanctuary_panoramic", "Sky Sanctuary Island with Devi Tara in Hoysala Pavilion")

	# -------------------------------------------------------------
	# SHOT 2: Prana Glider Aerial Descent (Veer gliding over abyss)
	# -------------------------------------------------------------
	print("\n--- Shot 2: Prana Glider Aerial Descent ---")
	if player:
		player.global_position = Vector3(20.0, 41.0, -22.0)
		player._play_anim("fall")
		player.is_gliding = true
	cine_cam.global_position = Vector3(15.0, 43.0, -14.0)
	cine_cam.look_at(Vector3(25.0, 40.0, -28.0), Vector3.UP)
	await capture.call("02_antariksha_prana_glider_aerial_descent", "Veer deploying Prana Glider across celestial void")

	# -------------------------------------------------------------
	# SHOT 3: Vayu Wind Turbine Ridge Island (7.5m Vedic wind engine)
	# -------------------------------------------------------------
	print("\n--- Shot 3: Vayu Wind Turbine Ridge Island ---")
	if player:
		player.global_position = Vector3(45.0, 38.0, -44.0)
		player._play_anim("idle")
		player.is_gliding = false
	cine_cam.global_position = Vector3(54.0, 41.5, -39.0)
	cine_cam.look_at(Vector3(45.0, 41.0, -50.0), Vector3.UP)
	await capture.call("03_antariksha_vayu_wind_turbine_ridge", "Vayu Wind Turbine with rotating brass vanes and thermal vent")

	# -------------------------------------------------------------
	# SHOT 4: Harpoon Grapple Tether
	# -------------------------------------------------------------
	print("\n--- Shot 4: Harpoon Grapple Tether ---")
	if player:
		player.global_position = Vector3(24.0, 43.5, -28.0)
		player._play_anim("attack_1")
	cine_cam.global_position = Vector3(18.5, 46.0, -20.0)
	cine_cam.look_at(Vector3(22.0, 45.0, -25.0), Vector3.UP)
	await capture.call("04_antariksha_harpoon_grapple_tether", "Veer launching harpoon grapple towards celestial beacon")

	# -------------------------------------------------------------
	# SHOT 5: Gale Falcon Dive Attack
	# -------------------------------------------------------------
	print("\n--- Shot 5: Gale Falcon Dive Attack ---")
	if falcon:
		falcon.global_position = Vector3(45.0, 42.5, -48.0)
		falcon._play_anim("attack")
		falcon.look_at(Vector3(45.0, 38.0, -44.0), Vector3.UP)
	cine_cam.global_position = Vector3(41.0, 41.5, -44.0)
	cine_cam.look_at(Vector3(45.0, 42.0, -48.0), Vector3.UP)
	await capture.call("05_antariksha_gale_falcon_dive_attack", "Gale Falcon swooping in streamlined dive attack")

	# -------------------------------------------------------------
	# SHOT 6: Wind Archer Hover Snipe
	# -------------------------------------------------------------
	print("\n--- Shot 6: Wind Archer Hover Snipe ---")
	if archer:
		archer.global_position = Vector3(-50.0, 48.0, -75.0)
		archer._play_anim("telegraph")
	cine_cam.global_position = Vector3(-46.0, 49.5, -71.0)
	cine_cam.look_at(Vector3(-50.0, 49.0, -75.0), Vector3.UP)
	await capture.call("06_antariksha_wind_archer_hover_snipe", "Wind Archer hovering with Gale Greatbow drawn taut")

	# -------------------------------------------------------------
	# SHOT 7: Boss Matarishvan Quad-Wings Stance
	# -------------------------------------------------------------
	print("\n--- Shot 7: Boss Matarishvan Quad-Wings Stance ---")
	if boss:
		boss.global_position = Vector3(0, 60.5, -145.0)
		boss._play_anim("boss_idle")
	if player:
		player.global_position = Vector3(0, 58.0, -137.0)
		player._play_anim("idle")
	cine_cam.global_position = Vector3(7.0, 62.5, -137.0)
	cine_cam.look_at(Vector3(0, 62.0, -145.0), Vector3.UP)
	await capture.call("07_antariksha_boss_matarishvan_quad_wings_stance", "Colossal 3.4m Boss Matarishvan in quad-winged hover stance")

	# -------------------------------------------------------------
	# SHOT 8: Boss Matarishvan Cleave Telegraph
	# -------------------------------------------------------------
	print("\n--- Shot 8: Boss Matarishvan Cleave Telegraph ---")
	if boss:
		boss._play_anim("boss_cleave_telegraph")
	cine_cam.global_position = Vector3(4.5, 62.0, -140.0)
	cine_cam.look_at(Vector3(0, 62.5, -145.0), Vector3.UP)
	await capture.call("08_antariksha_boss_matarishvan_cleave_telegraph", "Boss Matarishvan raising dual crescent scythes overhead")

	# -------------------------------------------------------------
	# SHOT 9: Boss Matarishvan Tempest Roar Enrage
	# -------------------------------------------------------------
	print("\n--- Shot 9: Boss Matarishvan Tempest Roar Enrage ---")
	if boss:
		boss._trigger_phase_two()
		boss._play_anim("boss_roar")
	cine_cam.global_position = Vector3(0, 63.5, -139.0)
	cine_cam.look_at(Vector3(0, 62.5, -145.0), Vector3.UP)
	await capture.call("09_antariksha_boss_matarishvan_tempest_roar_enrage", "Boss Matarishvan Phase 2 Enrage roar with flaring wings and magma core")

	# -------------------------------------------------------------
	# SHOT 10: Patala Descent Portal Consecration
	# -------------------------------------------------------------
	print("\n--- Shot 10: Patala Descent Portal Consecration ---")
	world._spawn_patala_descent_portal()
	if boss:
		boss.visible = false
	if player:
		player.global_position = Vector3(0, 58.0, -133.0)
		player._play_anim("victory")
	cine_cam.global_position = Vector3(4.5, 60.5, -130.0)
	cine_cam.look_at(Vector3(0, 59.5, -136.0), Vector3.UP)
	if hud and hud.banner_panel:
		hud.banner_panel.visible = true
		hud.banner_panel.modulate.a = 1.0
	await capture.call("10_antariksha_patala_descent_portal_consecration", "High Gale Peetham consecrated with radiant Patala descent portal")

	print("\n================================================================")
	print("  STAGE Q5-A ANTARIKSHA CAPTURES COMPLETED SUCCESSFULLY          ")
	print("================================================================")
	quit(0)
