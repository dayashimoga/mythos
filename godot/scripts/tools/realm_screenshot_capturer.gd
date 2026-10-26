extends SceneTree

const REALMS = [
	{"name": "01_bhumi_valley", "path": "res://scenes/levels/BhumiValley3D.tscn"},
	{"name": "02_antariksha_sky", "path": "res://scenes/levels/AntarikshaSkyRealm3D.tscn"},
	{"name": "03_patala_underworld", "path": "res://scenes/levels/PatalaUnderworld3D.tscn"},
	{"name": "04_svar_citadel", "path": "res://scenes/levels/SvarSolarCitadel3D.tscn"},
	{"name": "05_maharloka_sanctuary", "path": "res://scenes/levels/MaharlokaSanctuary3D.tscn"},
	{"name": "06_tapoloka_forge", "path": "res://scenes/levels/TapolokaForge3D.tscn"},
	{"name": "07_satyaloka_apex", "path": "res://scenes/levels/SatyalokaApex3D.tscn"},
	{"name": "08_test_chamber", "path": "res://scenes/levels/TestChamber3D.tscn"},
	{"name": "09_character_studio", "path": "res://scenes/studio/CharacterStudio3D.tscn"}
]

func _init() -> void:
	call_deferred("_run_captures")

func _run_captures() -> void:
	print("[AUDIT CAPTURER] Starting 7-Realm Runtime Capture Sequence...")
	var out_dir = ProjectSettings.globalize_path("res://../screenshots/audit_q0/")
	
	for realm in REALMS:
		print("[AUDIT CAPTURER] Loading: " + realm.name + " (" + realm.path + ")")
		var scene_res = load(realm.path)
		if not scene_res:
			printerr("[AUDIT CAPTURER] Failed to load scene: " + realm.path)
			continue
		var instance = scene_res.instantiate()
		root.add_child(instance)
		
		# Allow frames for rendering, shaders, and physics to settle
		for f in range(25):
			await process_frame
		
		var img = root.get_texture().get_image()
		if img and not img.is_empty():
			var save_path = out_dir + realm.name + ".png"
			var err = img.save_png(save_path)
			if err == OK:
				print("[AUDIT CAPTURER] Captured: " + save_path)
			else:
				printerr("[AUDIT CAPTURER] Error saving image: ", err)
		else:
			printerr("[AUDIT CAPTURER] Empty image for: " + realm.name)
		
		root.remove_child(instance)
		instance.queue_free()
		for f in range(5):
			await process_frame
	
	print("[AUDIT CAPTURER] All realm screenshots captured successfully.")
	quit(0)
