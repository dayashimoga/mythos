class_name TestSaveSystem
extends RefCounted

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(_test_checksum_calculation())
	results.append(_test_default_state_validity())
	results.append(_test_tamper_detection())
	return results

static func _test_checksum_calculation() -> Dictionary:
	var state = {
		"version": "1.0.0",
		"currentRealm": "SanctumOfAstra",
		"shardsCollected": 3,
		"altarConsecrated": true,
		"highScore": 1250
	}
	var hash_str = SaveSystem.calculate_checksum(state)
	var pass_check = (hash_str is String and not hash_str.is_empty())
	return {"name": "test_checksum_calculation", "passed": pass_check}

static func _test_default_state_validity() -> Dictionary:
	var def = SaveSystem.get_default_state()
	var expected = SaveSystem.calculate_checksum(def)
	var pass_check = (def["checksum"] == expected and def["shardsCollected"] == 0 and not def["altarConsecrated"])
	return {"name": "test_default_state_validity", "passed": pass_check}

static func _test_tamper_detection() -> Dictionary:
	var state = SaveSystem.get_default_state()
	# Tamper with shards without updating checksum
	state["shardsCollected"] = 999
	var calculated = SaveSystem.calculate_checksum(state)
	var mismatch_detected = (state["checksum"] != calculated)
	return {"name": "test_tamper_detection", "passed": mismatch_detected}
