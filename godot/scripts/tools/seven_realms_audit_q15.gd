extends SceneTree

## Stage Q15: Seven-Realm Traceability & Encounter Audit Tool
## Inspects scenes, models, bosses, enemies, peethams, and portals across all 7 realms.

func _init() -> void:
	print("\n========================================================")
	print("  MYTHOS 3D STAGE Q15 — SEVEN-REALM TRACEABILITY AUDIT   ")
	print("========================================================\n")

	var realms = [
		{
			"realm": "Bhumi (Mortal Realm)",
			"scene": "res://scenes/levels/BhumiValley3D.tscn",
			"boss_name": "BossKalanemi",
			"boss_script": "res://scripts/entities/boss_kalanemi_3d.gd",
			"peetham": "SunShrine3D",
			"portal_fn": "_spawn_antariksha_portal",
			"enemies": ["TrainingSentinel3D", "AsuraWarrior3D"]
		},
		{
			"realm": "Antariksha (Sky Realm)",
			"scene": "res://scenes/levels/AntarikshaSkyRealm3D.tscn",
			"boss_name": "BossMatarishvan3D",
			"boss_script": "res://scripts/entities/boss_matarishvan_3d.gd",
			"peetham": "HighGalePeetham3D",
			"portal_fn": "_spawn_patala_descent_portal",
			"enemies": ["GaleFalcon3D", "WindArcher3D"]
		},
		{
			"realm": "Patala (Subterranean Serpent Vaults)",
			"scene": "res://scenes/levels/PatalaUnderworld3D.tscn",
			"boss_name": "BossSheshaEcho3D",
			"boss_script": "res://scripts/entities/boss_shesha_echo_3d.gd",
			"peetham": "VasukiPeetham3D",
			"portal_fn": "_spawn_svar_portal",
			"enemies": ["NagaSpitter3D", "NagaConstrictor3D"]
		},
		{
			"realm": "Svar / Svarga (Solar Citadel)",
			"scene": "res://scenes/levels/SvarSolarCitadel3D.tscn",
			"boss_name": "BossSuryaAvatara3D",
			"boss_script": "res://scripts/entities/boss_surya_avatara_3d.gd",
			"peetham": "SuryaMahapeetham3D",
			"portal_fn": "_spawn_maharloka_portal",
			"enemies": ["SuryaGuardian3D", "SolarGryphon3D"]
		},
		{
			"realm": "Maharloka (Astral Libraries)",
			"scene": "res://scenes/levels/MaharlokaSanctuary3D.tscn",
			"boss_name": "BossBrihaspati3D",
			"boss_script": "res://scripts/entities/boss_brihaspati_3d.gd",
			"peetham": "MaharMandala3D",
			"portal_fn": "_spawn_tapoloka_portal",
			"enemies": ["ScriptureGolem3D", "AstralRishi3D"]
		},
		{
			"realm": "Tapoloka / Janaloka (Agni's Forge)",
			"scene": "res://scenes/levels/TapolokaForge3D.tscn",
			"boss_name": "BossAgniRudra3D",
			"boss_script": "res://scripts/entities/boss_agni_rudra_3d.gd",
			"peetham": "TapoPeetham3D",
			"portal_fn": "_spawn_satyaloka_portal",
			"enemies": ["AgniBerserker3D", "TapasMagmaHound3D"]
		},
		{
			"realm": "Satyaloka / Brahmaloka (Cosmic Dharma)",
			"scene": "res://scenes/levels/SatyalokaApex3D.tscn",
			"boss_name": "BossBrahmaAvatara3D",
			"boss_script": "res://scripts/entities/boss_brahma_avatara_3d.gd",
			"peetham": "MokshaPeetham3D",
			"portal_fn": "_spawn_cosmic_cycle_portal",
			"enemies": ["DharmaSentinel3D", "MokshaSeraph3D"]
		}
	]

	var total_audited = 0
	var verified_count = 0
	var defective_count = 0

	for r in realms:
		total_audited += 1
		print("\n--- Auditing Realm: %s ---" % r["realm"])
		var pck_scene = load(r["scene"])
		if not pck_scene:
			print("  ✗ Scene load failed: %s" % r["scene"])
			defective_count += 1
			continue

		var inst = pck_scene.instantiate()
		var player = inst.find_child("Player3D", true, false)
		var hud = inst.find_child("HUD3D", true, false)
		var boss = inst.find_child(r["boss_name"], true, false)
		var peetham = inst.find_child(r["peetham"], true, false)
		var has_portal = inst.has_method(r["portal_fn"])
		var has_retry = inst.has_method("_on_retry_requested")

		print("  • Player3D: %s" % ("Found" if player else "MISSING"))
		print("  • HUD3D: %s" % ("Found" if hud else "MISSING"))
		print("  • Boss (%s): %s" % [r["boss_name"], "Found" if boss else "MISSING"])
		print("  • Peetham (%s): %s" % [r["peetham"], "Found" if peetham else "MISSING"])
		print("  • Portal Method (%s): %s" % [r["portal_fn"], "Found" if has_portal else "MISSING"])
		print("  • Retry Method (_on_retry_requested): %s" % ("Found" if has_retry else "MISSING"))

		var boss_scr = load(r["boss_script"])
		var boss_inst = boss_scr.new() if boss_scr else null
		var boss_has_spec = boss_inst.has_method("take_damage_spec") if boss_inst else false
		var boss_has_reset = boss_inst.has_method("reset_boss") if boss_inst else false
		print("  • Boss take_damage_spec(): %s" % ("VERIFIED" if boss_has_spec else "DEFECTIVE/MISSING"))
		print("  • Boss reset_boss(): %s" % ("VERIFIED" if boss_has_reset else "DEFECTIVE/MISSING"))

		if boss_inst:
			boss_inst.free()
		inst.free()

		if player and hud and boss and peetham and has_portal and has_retry and boss_has_spec and boss_has_reset:
			print("  ==> Classification: VERIFIED")
			verified_count += 1
		else:
			print("  ==> Classification: DEFECTIVE/PARTIAL (Requires Remediation)")
			defective_count += 1

	print("\n========================================================")
	print("  AUDIT SUMMARY: %d Total | %d Verified | %d Defective/Partial" % [total_audited, verified_count, defective_count])
	print("========================================================\n")
	quit(0)
