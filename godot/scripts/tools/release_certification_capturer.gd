extends SceneTree

## Stage Q8 Production Hardening & Release Certification Screenshot Capturer
## Captures 10 high-resolution in-engine validation screenshots:
## 1. 01_bhumi_valley_production_sanctum_certification.png
## 2. 02_antariksha_aerial_sky_islands_certification.png
## 3. 03_patala_subterranean_venom_caverns_certification.png
## 4. 04_svar_celestial_solar_citadel_certification.png
## 5. 05_maharloka_astral_archives_sanctuary_certification.png
## 6. 06_tapoloka_primordial_forge_caldera_certification.png
## 7. 07_satyaloka_cosmic_dharma_apex_certification.png
## 8. 08_campaign_end_to_end_progression_certification.png
## 9. 09_production_hud_and_pause_system_certification.png
## 10. 10_final_moksha_consecration_and_epilogue_certification.png

const OUT_DIR = "res://../screenshots/certification_q8/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/ebde482a-7463-4886-8fc0-62ef0783fc6e/"

func _init() -> void:
	call_deferred("_run_certification_captures")

func _run_certification_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q8 PRODUCTION RELEASE CERTIFICATION TOUR       ")
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

	var clear_children = func():
		for child in root.get_children():
			if not (child is AudioManager3D):
				child.free()

	# -------------------------------------------------------------------------
	# 1. Bhumi Valley Production Sanctum
	# -------------------------------------------------------------------------
	print("\n--- Shot 1: Bhumi Valley Production Sanctum ---")
	var bhumi = load("res://scenes/levels/BhumiValley3D.tscn").instantiate()
	root.add_child(bhumi)
	for f in range(25): await process_frame
	await capture.call("01_bhumi_valley_production_sanctum_certification", "Bhumi Valley Sanctum of Astra and Veer")
	bhumi.free()

	# -------------------------------------------------------------------------
	# 2. Antariksha Sky Realm
	# -------------------------------------------------------------------------
	print("\n--- Shot 2: Antariksha Aerial Sky Islands ---")
	var antariksha = load("res://scenes/levels/AntarikshaSkyRealm3D.tscn").instantiate()
	root.add_child(antariksha)
	for f in range(25): await process_frame
	await capture.call("02_antariksha_aerial_sky_islands_certification", "Antariksha floating sky citadel and Vayu turbines")
	antariksha.free()

	# -------------------------------------------------------------------------
	# 3. Patala Underworld
	# -------------------------------------------------------------------------
	print("\n--- Shot 3: Patala Subterranean Venom Caverns ---")
	var patala = load("res://scenes/levels/PatalaUnderworld3D.tscn").instantiate()
	root.add_child(patala)
	for f in range(25): await process_frame
	await capture.call("03_patala_subterranean_venom_caverns_certification", "Patala subterranean serpent vaults and emerald river")
	patala.free()

	# -------------------------------------------------------------------------
	# 4. Svar Solar Citadel
	# -------------------------------------------------------------------------
	print("\n--- Shot 4: Svar Celestial Solar Citadel ---")
	var svar = load("res://scenes/levels/SvarSolarCitadel3D.tscn").instantiate()
	root.add_child(svar)
	for f in range(25): await process_frame
	await capture.call("04_svar_celestial_solar_citadel_certification", "Svar solar bastions and crystalline light bridges")
	svar.free()

	# -------------------------------------------------------------------------
	# 5. Maharloka Sanctuary
	# -------------------------------------------------------------------------
	print("\n--- Shot 5: Maharloka Astral Archives Sanctuary ---")
	var mahar = load("res://scenes/levels/MaharlokaSanctuary3D.tscn").instantiate()
	root.add_child(mahar)
	for f in range(25): await process_frame
	await capture.call("05_maharloka_astral_archives_sanctuary_certification", "Maharloka astral library and floating scripture pillars")
	mahar.free()

	# -------------------------------------------------------------------------
	# 6. Tapoloka Forge
	# -------------------------------------------------------------------------
	print("\n--- Shot 6: Tapoloka Primordial Forge Caldera ---")
	var tapo = load("res://scenes/levels/TapolokaForge3D.tscn").instantiate()
	root.add_child(tapo)
	for f in range(25): await process_frame
	await capture.call("06_tapoloka_primordial_forge_caldera_certification", "Tapoloka magma calderas and Agni primordial forge")
	tapo.free()

	# -------------------------------------------------------------------------
	# 7. Satyaloka Apex
	# -------------------------------------------------------------------------
	print("\n--- Shot 7: Satyaloka Cosmic Dharma Apex ---")
	var satya = load("res://scenes/levels/SatyalokaApex3D.tscn").instantiate()
	root.add_child(satya)
	for f in range(25): await process_frame
	await capture.call("07_satyaloka_cosmic_dharma_apex_certification", "Satyaloka cosmic dharma lotus and Moksha Mahapeetham")
	satya.free()

	# -------------------------------------------------------------------------
	# 8. Campaign End-to-End Progression & Map
	# -------------------------------------------------------------------------
	print("\n--- Shot 8: Campaign Progression & Realm Map ---")
	var pause_scene = load("res://scenes/ui/PauseMenu3D.tscn").instantiate()
	root.add_child(pause_scene)
	var tabs = pause_scene.find_child("TabContainer", true, false) as TabContainer
	if tabs:
		tabs.current_tab = 1 # Realm Map Tab
	for f in range(20): await process_frame
	await capture.call("08_campaign_end_to_end_progression_certification", "Celestial Realm Map with all seven lokas unlocked")
	pause_scene.free()

	# -------------------------------------------------------------------------
	# 9. Production HUD and Pause Settings
	# -------------------------------------------------------------------------
	print("\n--- Shot 9: Production Settings & Accessibility ---")
	var pause_settings = load("res://scenes/ui/PauseMenu3D.tscn").instantiate()
	root.add_child(pause_settings)
	var tabs2 = pause_settings.find_child("TabContainer", true, false) as TabContainer
	if tabs2:
		tabs2.current_tab = 2 # Settings Tab
	for f in range(20): await process_frame
	await capture.call("09_production_hud_and_pause_system_certification", "Settings and accessibility sliders with audio controls")
	pause_settings.free()

	# -------------------------------------------------------------------------
	# 10. Final Moksha Consecration & Epilogue
	# -------------------------------------------------------------------------
	print("\n--- Shot 10: Final Moksha Consecration & Epilogue ---")
	var satya_final = load("res://scenes/levels/SatyalokaApex3D.tscn").instantiate()
	root.add_child(satya_final)
	var hud_satya = satya_final.find_child("HUD3D", true, false)
	if hud_satya and hud_satya.has_method("show_consecration_banner"):
		hud_satya.show_consecration_banner("MOKSHA MAHARATNA CONSECRATED", "Cosmic Dharma Restored Across All Seven Lokas")
	for f in range(25): await process_frame
	await capture.call("10_final_moksha_consecration_and_epilogue_certification", "Final Grand Climax Resolution at Moksha Mahapeetham")
	satya_final.free()

	print("\n[CERTIFICATION CAPTURER] All 10 certification screenshots captured successfully.")
	quit(0)
