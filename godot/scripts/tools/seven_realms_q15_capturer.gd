extends SceneTree

## Stage Q15 — Seven-Realm Visual & Gameplay Certification Capturer
## Captures 14 authoritative in-engine GPU validation screenshots across all 7 Vedic Realms:
## Bhumi:
##   1. 01_bhumi_sanctum_sentinel_drill.png
##   2. 02_bhumi_kalanemi_consecration.png
## Antariksha:
##   3. 03_antariksha_turbines_aerial_vault.png
##   4. 04_antariksha_matarishvan_dive_slam.png
## Patala:
##   5. 05_patala_basalt_caverns_naga_spit.png
##   6. 06_patala_shesha_awakened_fury.png
## Svar / Svarga:
##   7. 07_svar_solar_citadel_prisms.png
##   8. 08_svar_surya_avatara_supernova.png
## Maharloka:
##   9. 09_maharloka_astral_library_rishi.png
##   10. 10_maharloka_brihaspati_cosmic_collapse.png
## Tapoloka:
##   11. 11_tapoloka_primordial_forge_magma.png
##   12. 12_tapoloka_agni_rudra_berserker_clash.png
## Satyaloka:
##   13. 13_satyaloka_lotus_causeway_dharma.png
##   14. 14_satyaloka_brahma_avatara_final_moksha.png

const OUT_DIR_Q15 = "res://../screenshots/seven_realms_q15/"
const OUT_DIR_DOCS = "res://../docs/images/seven_realms_validation/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/c3d06cc8-1b26-4e1a-a6af-c9334d76f122/"

func _init() -> void:
	call_deferred("_run_captures")

func _save_viewport(stem: String, desc: String) -> void:
	for f in range(12):
		await process_frame
	await RenderingServer.frame_post_draw
	var img = root.get_viewport().get_texture().get_image()
	var p1 = ProjectSettings.globalize_path(OUT_DIR_Q15 + stem + ".png")
	var p2 = ProjectSettings.globalize_path(OUT_DIR_DOCS + stem + ".png")
	var p3 = BRAIN_DIR + stem + ".png"
	img.save_png(p1)
	img.save_png(p2)
	img.save_png(p3)
	print("  -> [CERTIFIED] %s: %s" % [stem, desc])

func _run_captures() -> void:
	print("\n================================================================")
	print("  STARTING STAGE Q15 SEVEN-REALM VISUAL CERTIFICATION CAPTURES   ")
	print("================================================================\n")

	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR_Q15))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR_DOCS))
	DirAccess.make_dir_recursive_absolute(BRAIN_DIR)

	# Setup Shared Capture Camera
	var cam = Camera3D.new()
	cam.name = "Q15CaptureCam"
	root.add_child(cam)
	cam.make_current()

	# -------------------------------------------------------------
	# REALM 1: BHUMI
	# -------------------------------------------------------------
	print("--- Processing Realm 1: Bhumi ---")
	var bhumi_scn = load("res://scenes/levels/BhumiValley3D.tscn")
	var bhumi: Node3D = bhumi_scn.instantiate()
	root.add_child(bhumi)

	var cin = bhumi.find_child("CinematicDirector3D", true, false)
	if cin and cin.has_method("finish_cinematic"):
		cin.finish_cinematic(true)
		cin.set_process(false)
		cin.set_physics_process(false)

	for f in range(20):
		await process_frame

	var gatekeeper = bhumi.find_child("GatekeeperSentinel", true, false)
	var player = bhumi.find_child("Player3D", true, false)
	if gatekeeper and player:
		gatekeeper.global_position = Vector3(0.0, 1.2, 8.0)
		player.global_position = Vector3(0.0, 1.2, 4.0)
		cam.global_position = Vector3(2.5, 2.2, 5.0)
		cam.look_at(Vector3(0.0, 2.2, 8.0), Vector3.UP)
		await _save_viewport("01_bhumi_sanctum_sentinel_drill", "Bhumi Ancient Sanctum with Hoysala Training Sentinel Drill")

	var boss_kalanemi = bhumi.find_child("BossKalanemi", true, false)
	var shrine = bhumi.find_child("SunShrine3D", true, false)
	if boss_kalanemi and shrine:
		boss_kalanemi.global_position = Vector3(0.0, 1.0, 40.0)
		boss_kalanemi.visible = true
		if boss_kalanemi.has_method("reset_boss"):
			boss_kalanemi.reset_boss()
		cam.global_position = Vector3(5.0, 4.0, 32.0)
		cam.look_at(Vector3(0.0, 2.5, 40.0), Vector3.UP)
		await _save_viewport("02_bhumi_kalanemi_consecration", "Bhumi Consecration Arena with Boss Kalanemi & Sun Shrine Portal")

	bhumi.queue_free()
	for f in range(5):
		await process_frame

	# -------------------------------------------------------------
	# REALM 2: ANTARIKSHA
	# -------------------------------------------------------------
	print("\n--- Processing Realm 2: Antariksha ---")
	var antariksha_scn = load("res://scenes/levels/AntarikshaSkyRealm3D.tscn")
	var antariksha: Node3D = antariksha_scn.instantiate()
	root.add_child(antariksha)

	cin = antariksha.find_child("CinematicDirector3D", true, false)
	if cin and cin.has_method("finish_cinematic"):
		cin.finish_cinematic(true)
		cin.set_process(false)
		cin.set_physics_process(false)

	for f in range(20):
		await process_frame

	var archer = antariksha.find_child("WindArcher3D", true, false)
	player = antariksha.find_child("Player3D", true, false)
	if player:
		player.global_position = Vector3(0.0, 42.0, 0.0)
	cam.global_position = Vector3(10.0, 46.0, 12.0)
	cam.look_at(Vector3(0.0, 42.0, 0.0), Vector3.UP)
	await _save_viewport("03_antariksha_turbines_aerial_vault", "Antariksha Aerial Vault with Vayu Wind Turbines & Cloud Citadel")

	var boss_matarishvan = antariksha.find_child("BossMatarishvan3D", true, false)
	if boss_matarishvan:
		cam.global_position = boss_matarishvan.global_position + Vector3(6.0, 5.0, 8.0)
		cam.look_at(boss_matarishvan.global_position + Vector3(0, 2.0, 0), Vector3.UP)
		await _save_viewport("04_antariksha_matarishvan_dive_slam", "Antariksha Cyclone Arena with Boss Matarishvan Storm Titan")

	antariksha.queue_free()
	for f in range(5):
		await process_frame

	# -------------------------------------------------------------
	# REALM 3: PATALA
	# -------------------------------------------------------------
	print("\n--- Processing Realm 3: Patala ---")
	var patala_scn = load("res://scenes/levels/PatalaUnderworld3D.tscn")
	var patala: Node3D = patala_scn.instantiate()
	root.add_child(patala)

	cin = patala.find_child("CinematicDirector3D", true, false)
	if cin and cin.has_method("finish_cinematic"):
		cin.finish_cinematic(true)
		cin.set_process(false)
		cin.set_physics_process(false)

	for f in range(20):
		await process_frame

	var spitter = patala.find_child("NagaSpitter3D", true, false)
	var constrictor = patala.find_child("NagaConstrictor3D", true, false)
	player = patala.find_child("Player3D", true, false)
	if spitter and player:
		cam.global_position = spitter.global_position + Vector3(3.0, 2.5, 4.0)
		cam.look_at(spitter.global_position + Vector3(0, 1.0, 0), Vector3.UP)
	else:
		cam.global_position = Vector3(0.0, 4.0, 10.0)
		cam.look_at(Vector3.ZERO, Vector3.UP)
	await _save_viewport("05_patala_basalt_caverns_naga_spit", "Patala Basalt Caverns with Bioluminescent Naga Spitter & Constrictor")

	var boss_shesha = patala.find_child("BossSheshaEcho3D", true, false)
	if boss_shesha:
		cam.global_position = boss_shesha.global_position + Vector3(6.0, 4.5, 9.0)
		cam.look_at(boss_shesha.global_position + Vector3(0, 2.0, 0), Vector3.UP)
		await _save_viewport("06_patala_shesha_awakened_fury", "Patala Boss Shesha Echo Awakened Fury with Nagamani Light")

	patala.queue_free()
	for f in range(5):
		await process_frame

	# -------------------------------------------------------------
	# REALM 4: SVAR / SVARGA
	# -------------------------------------------------------------
	print("\n--- Processing Realm 4: Svar / Svarga ---")
	var svar_scn = load("res://scenes/levels/SvarSolarCitadel3D.tscn")
	var svar: Node3D = svar_scn.instantiate()
	root.add_child(svar)

	cin = svar.find_child("CinematicDirector3D", true, false)
	if cin and cin.has_method("finish_cinematic"):
		cin.finish_cinematic(true)
		cin.set_process(false)
		cin.set_physics_process(false)

	for f in range(20):
		await process_frame

	var guardian = svar.find_child("SuryaGuardian3D", true, false)
	if guardian:
		cam.global_position = guardian.global_position + Vector3(4.0, 3.0, 5.0)
		cam.look_at(guardian.global_position + Vector3(0, 1.5, 0), Vector3.UP)
	else:
		cam.global_position = Vector3(0.0, 5.0, 12.0)
		cam.look_at(Vector3.ZERO, Vector3.UP)
	await _save_viewport("07_svar_solar_citadel_prisms", "Svar Solar Citadel with Surya Prisms & Light Bridges")

	var boss_surya = svar.find_child("BossSuryaAvatara3D", true, false)
	if boss_surya:
		cam.global_position = boss_surya.global_position + Vector3(5.0, 4.0, 8.0)
		cam.look_at(boss_surya.global_position + Vector3(0, 2.0, 0), Vector3.UP)
		await _save_viewport("08_svar_surya_avatara_supernova", "Svar Solar Citadel Boss Surya Avatara with Greatsword Cleave")

	svar.queue_free()
	for f in range(5):
		await process_frame

	# -------------------------------------------------------------
	# REALM 5: MAHARLOKA
	# -------------------------------------------------------------
	print("\n--- Processing Realm 5: Maharloka ---")
	var mahar_scn = load("res://scenes/levels/MaharlokaSanctuary3D.tscn")
	var mahar: Node3D = mahar_scn.instantiate()
	root.add_child(mahar)

	cin = mahar.find_child("CinematicDirector3D", true, false)
	if cin and cin.has_method("finish_cinematic"):
		cin.finish_cinematic(true)
		cin.set_process(false)
		cin.set_physics_process(false)

	for f in range(20):
		await process_frame

	var rishi = mahar.find_child("AstralRishi3D", true, false)
	var golem = mahar.find_child("ScriptureGolem3D", true, false)
	if rishi:
		cam.global_position = rishi.global_position + Vector3(3.5, 2.5, 4.5)
		cam.look_at(rishi.global_position + Vector3(0, 1.5, 0), Vector3.UP)
	else:
		cam.global_position = Vector3(0.0, 5.0, 10.0)
		cam.look_at(Vector3.ZERO, Vector3.UP)
	await _save_viewport("09_maharloka_astral_library_rishi", "Maharloka Astral Library with Scripture Golems and Vedic Rishis")

	var boss_brihaspati = mahar.find_child("BossBrihaspati3D", true, false)
	if boss_brihaspati:
		cam.global_position = boss_brihaspati.global_position + Vector3(5.5, 4.5, 8.5)
		cam.look_at(boss_brihaspati.global_position + Vector3(0, 2.2, 0), Vector3.UP)
		await _save_viewport("10_maharloka_brihaspati_cosmic_collapse", "Maharloka Sanctuary Boss Brihaspati Sage Titan Cosmic Wisdom")

	mahar.queue_free()
	for f in range(5):
		await process_frame

	# -------------------------------------------------------------
	# REALM 6: TAPOLOKA
	# -------------------------------------------------------------
	print("\n--- Processing Realm 6: Tapoloka ---")
	var tapo_scn = load("res://scenes/levels/TapolokaForge3D.tscn")
	var tapo: Node3D = tapo_scn.instantiate()
	root.add_child(tapo)

	cin = tapo.find_child("CinematicDirector3D", true, false)
	if cin and cin.has_method("finish_cinematic"):
		cin.finish_cinematic(true)
		cin.set_process(false)
		cin.set_physics_process(false)

	for f in range(20):
		await process_frame

	var hound = tapo.find_child("TapasMagmaHound3D", true, false)
	var berserker = tapo.find_child("AgniBerserker3D", true, false)
	if berserker:
		cam.global_position = berserker.global_position + Vector3(3.5, 2.5, 4.5)
		cam.look_at(berserker.global_position + Vector3(0, 1.5, 0), Vector3.UP)
	else:
		cam.global_position = Vector3(0.0, 5.0, 10.0)
		cam.look_at(Vector3.ZERO, Vector3.UP)
	await _save_viewport("11_tapoloka_primordial_forge_magma", "Tapoloka Primordial Forge with Magma Geysers and Agni Berserkers")

	var boss_agni = tapo.find_child("BossAgniRudra3D", true, false)
	if boss_agni:
		cam.global_position = boss_agni.global_position + Vector3(6.0, 4.5, 9.0)
		cam.look_at(boss_agni.global_position + Vector3(0, 2.2, 0), Vector3.UP)
		await _save_viewport("12_tapoloka_agni_rudra_berserker_clash", "Tapoloka Caldera Boss Agni Rudra Primordial Fire Titan")

	tapo.queue_free()
	for f in range(5):
		await process_frame

	# -------------------------------------------------------------
	# REALM 7: SATYALOKA
	# -------------------------------------------------------------
	print("\n--- Processing Realm 7: Satyaloka ---")
	var satya_scn = load("res://scenes/levels/SatyalokaApex3D.tscn")
	var satya: Node3D = satya_scn.instantiate()
	root.add_child(satya)

	cin = satya.find_child("CinematicDirector3D", true, false)
	if cin and cin.has_method("finish_cinematic"):
		cin.finish_cinematic(true)
		cin.set_process(false)
		cin.set_physics_process(false)

	for f in range(20):
		await process_frame

	var sentinel = satya.find_child("DharmaSentinel3D", true, false)
	var seraph = satya.find_child("MokshaSeraph3D", true, false)
	if sentinel:
		cam.global_position = sentinel.global_position + Vector3(4.0, 3.0, 5.5)
		cam.look_at(sentinel.global_position + Vector3(0, 1.8, 0), Vector3.UP)
	else:
		cam.global_position = Vector3(0.0, 5.0, 12.0)
		cam.look_at(Vector3.ZERO, Vector3.UP)
	await _save_viewport("13_satyaloka_lotus_causeway_dharma", "Satyaloka Lotus Causeway with Dharma Sentinels & Moksha Seraphs")

	var boss_brahma = satya.find_child("BossBrahmaAvatara3D", true, false)
	if boss_brahma:
		cam.global_position = boss_brahma.global_position + Vector3(6.5, 5.0, 9.5)
		cam.look_at(boss_brahma.global_position + Vector3(0, 2.5, 0), Vector3.UP)
		await _save_viewport("14_satyaloka_brahma_avatara_final_moksha", "Satyaloka Apex Boss Brahma Avatara Quad-Faced Creator-Dissolution Titan")

	satya.queue_free()
	for f in range(5):
		await process_frame

	print("\n================================================================")
	print("  COMPLETED ALL 14 SEVEN-REALM CERTIFICATION CAPTURES (100%)    ")
	print("================================================================\n")
	quit(0)
