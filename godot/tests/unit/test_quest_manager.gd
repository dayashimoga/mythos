class_name TestQuestManager
extends RefCounted

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(_test_mission_registration_and_status())
	results.append(_test_start_mission())
	results.append(_test_objective_progress_and_completion())
	return results

static func _test_mission_registration_and_status() -> Dictionary:
	var qm = QuestManager.new()
	var m = qm.get_mission("sanctum_calibration")
	var status = qm.get_mission_status("sanctum_calibration")

	var pass_check = (m != null and m.objectives.size() == 2 and status == QuestManager.Status.AVAILABLE)
	return {"name": "test_mission_registration_and_status", "passed": pass_check}

static func _test_start_mission() -> Dictionary:
	var qm = QuestManager.new()
	var started = qm.start_mission("sanctum_calibration")
	var status = qm.get_mission_status("sanctum_calibration")

	var pass_check = (started and status == QuestManager.Status.ACTIVE and qm.active_mission_id == "sanctum_calibration")
	return {"name": "test_start_mission", "passed": pass_check}

static func _test_objective_progress_and_completion() -> Dictionary:
	var qm = QuestManager.new()
	qm.start_mission("sanctum_calibration")

	# Collect 3 shards
	qm.update_objective_progress("sanctum_calibration", "collect_shards", 2)
	var m = qm.get_mission("sanctum_calibration")
	var shard_obj = m.objectives[0]
	var shards_half = (shard_obj.current_count == 2 and not shard_obj.is_completed)

	qm.update_objective_progress("sanctum_calibration", "collect_shards", 1)
	var shards_done = (shard_obj.current_count == 3 and shard_obj.is_completed)

	# Kindle Altar
	qm.update_objective_progress("sanctum_calibration", "kindle_altar", 1)
	var final_status = qm.get_mission_status("sanctum_calibration")

	var pass_check = (shards_half and shards_done and final_status == QuestManager.Status.COMPLETED)
	return {"name": "test_objective_progress_and_completion", "passed": pass_check}
