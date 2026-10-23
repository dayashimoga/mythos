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

	var test_combat_math = load("res://tests/unit/test_combat_math.gd")
	var test_quest_manager = load("res://tests/unit/test_quest_manager.gd")
	var test_save_system = load("res://tests/unit/test_save_system.gd")
	var test_dialogue_runner = load("res://tests/unit/test_dialogue_runner.gd")
	var test_traversal_3d = load("res://tests/integration/test_player_traversal_3d.gd")

	var suites = [
		{"name": "Combat Mathematics (Domain)", "runner": test_combat_math},
		{"name": "Quest & Narrative Manager (Domain)", "runner": test_quest_manager},
		{"name": "Save State & Tamper Verification (Domain)", "runner": test_save_system},
		{"name": "Dialogue Runner (Domain)", "runner": test_dialogue_runner},
		{"name": "3D Physics, Camera & Traversal (Integration)", "runner": test_traversal_3d}
	]

	for suite in suites:
		print("--- Running Suite: %s ---" % suite["name"])
		var runner = suite["runner"]
		var results: Array = runner.run_all()

		for res in results:
			total_tests += 1
			if res.get("passed", false):
				passed_tests += 1
				print("  ✓ %s" % res["name"])
			else:
				failed_tests += 1
				all_passed = false
				print("  ✗ FAILED: %s" % res["name"])
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
