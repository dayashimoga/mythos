extends SceneTree

## Headless Unit & Integration Test Runner for Mythos 3D Godot Engine.
## Returns exit code 0 on all tests passing, exit code 1 on failure.

func _init() -> void:
	print("\n========================================================")
	print("  MYTHOS 3D GODOT ENGINE TEST RUNNER (Headless CI)")
	print("========================================================\n")

	var all_passed = true
	var total_tests = 0
	var passed_tests = 0
	var failed_tests = 0
	var audio_manager_script = load("res://scripts/audio/audio_manager_3d.gd")
	var audio_mgr = audio_manager_script.new()
	root.add_child(audio_mgr)

	var test_combat_math = load("res://tests/unit/test_combat_math.gd")
	var test_quest_manager = load("res://tests/unit/test_quest_manager.gd")
	var test_save_system = load("res://tests/unit/test_save_system.gd")
	var test_dialogue_runner = load("res://tests/unit/test_dialogue_runner.gd")
	var test_veer_model = load("res://tests/unit/test_veer_model.gd")
	var test_character_studio = load("res://tests/unit/test_character_studio.gd")
	var test_traversal_3d = load("res://tests/integration/test_player_traversal_3d.gd")
	var test_bhumi_world = load("res://tests/integration/test_bhumi_world_3d.gd")
	var test_vertical_slice = load("res://tests/integration/test_gameplay_vertical_slice_3d.gd")
	var test_antariksha_realm = load("res://tests/integration/test_antariksha_realm_3d.gd")
	var test_patala_realm = load("res://tests/integration/test_patala_realm_3d.gd")
	var test_svar_realm = load("res://tests/integration/test_svar_realm_3d.gd")
	var test_maharloka_realm = load("res://tests/integration/test_maharloka_realm_3d.gd")
	var test_tapoloka_realm = load("res://tests/integration/test_tapoloka_realm_3d.gd")
	var test_satyaloka_realm = load("res://tests/integration/test_satyaloka_realm_3d.gd")
	var test_seven_realms_e2e = load("res://tests/integration/test_seven_realms_e2e_3d.gd")
	var test_locomotion_anim_tree = load("res://tests/unit/test_locomotion_animation_tree.gd")
	var test_bhumi_remaster = load("res://tests/unit/test_bhumi_remaster.gd")
	var test_combat_encounter = load("res://tests/unit/test_combat_encounter.gd")
	var test_antariksha_remaster = load("res://tests/unit/test_antariksha_remaster.gd")
	var test_patala_remaster = load("res://tests/unit/test_patala_remaster.gd")
	var test_narrative_cinematics = load("res://tests/unit/test_narrative_and_cinematics.gd")
	var test_svar_remaster = load("res://tests/unit/test_svar_remaster.gd")
	var test_game_presentation_ui = load("res://tests/unit/test_game_presentation_and_ui.gd")
	var test_prod_hardening = load("res://tests/unit/test_production_hardening_and_certification.gd")

	var suites = [
		{"name": "Combat Mathematics (Domain)", "runner": test_combat_math},
		{"name": "Quest & Narrative Manager (Domain)", "runner": test_quest_manager},
		{"name": "Save State & Tamper Verification (Domain)", "runner": test_save_system},
		{"name": "Dialogue Runner (Domain)", "runner": test_dialogue_runner},
		{"name": "Veer 3D Skinned Model & Rigging (Model/Anim)", "runner": test_veer_model},
		{"name": "Stage Q2: Realistic 3D Locomotion & AnimationTree (State/Kinematics)", "runner": test_locomotion_anim_tree},
		{"name": "3D Character Studio (Viewer/Inspection)", "runner": test_character_studio},
		{"name": "3D Physics, Camera & Traversal (Integration)", "runner": test_traversal_3d},
		{"name": "3D Landscape & World Architecture (Stage D)", "runner": test_bhumi_world},
		{"name": "3D Gameplay Vertical Slice & Boss Fight (Stage E)", "runner": test_vertical_slice},
		{"name": "Chapter II — Realm of Antariksha & Aerial Traversal (Stage G)", "runner": test_antariksha_realm},
		{"name": "Chapter III — Realm of Patala & Subterranean Serpent Vaults (Stage H)", "runner": test_patala_realm},
		{"name": "Chapter IV — Realm of Svar & Celestial Solar Citadels (Stage I)", "runner": test_svar_realm},
		{"name": "Chapter V — Realm of Maharloka & Astral Libraries (Stage J)", "runner": test_maharloka_realm},
		{"name": "Chapter VI — Realm of Janaloka / Tapoloka & Agni's Primordial Forge (Stage K)", "runner": test_tapoloka_realm},
		{"name": "Chapter VII — Realm of Satyaloka / Brahmaloka & Cosmic Dharma (Stage L)", "runner": test_satyaloka_realm},
		{"name": "Suite 16: Complete Seven-Realm Rendered Scene Lifecycle & E2E Progression (Stage Q0)", "runner": test_seven_realms_e2e},
		{"name": "Suite 18: Bhumi 3D Environment, Sanctum Architecture & Landscape Remaster (Stage Q3)", "runner": test_bhumi_remaster},
		{"name": "Suite 19: Polished 3D Combat, Enemy AI & Boss Experience (Stage Q4)", "runner": test_combat_encounter},
		{"name": "Suite 20: Antariksha Production Remaster & Cosmic Realm Verification (Stage Q5-A)", "runner": test_antariksha_remaster},
		{"name": "Suite 21: Patala Production Remaster & Cosmic Realm Verification (Stage Q5-B)", "runner": test_patala_remaster},
		{"name": "Suite 22: Seven-Realm Narrative, Animated NPCs & Cinematic Director (Stage Q6)", "runner": test_narrative_cinematics},
		{"name": "Suite 23: Svar Production Remaster & Cosmic Realm Verification (Stage Q5-C)", "runner": test_svar_remaster},
		{"name": "Suite 24: Game Presentation, Modern UI/UX, Audio & Accessibility (Stage Q7)", "runner": test_game_presentation_ui},
		{"name": "Suite 25: Production Hardening, Seven-Realm Verification & Release Certification (Stage Q8)", "runner": test_prod_hardening}
	]

	for suite in suites:
		print("--- Running Suite: %s ---" % suite["name"])
		var runner = suite["runner"]
		var results: Array = runner.run_all()

		for res in results:
			total_tests += 1
			if res is Dictionary and res.get("passed", false):
				passed_tests += 1
				print("  ✓ %s" % res.get("name", "unknown"))
			else:
				failed_tests += 1
				all_passed = false
				var t_name = res.get("name", "unnamed_test") if res is Dictionary else "null_result"
				var t_msg = res.get("message", "") if res is Dictionary else ""
				print("  ✗ FAILED: %s (Reason: %s)" % [t_name, t_msg])
		print("")

	print("--------------------------------------------------------")
	print("Summary: Total: %d | Passed: %d | Failed: %d" % [total_tests, passed_tests, failed_tests])
	print("========================================================\n")

	if all_passed:
		print("[TEST RUNNER] ALL GODOT 3D SUITES PASSED CLEANLY.\n")
		quit(0)
	else:
		print("[TEST RUNNER] TEST FAILURES DETECTED.\n")
		quit(1)
