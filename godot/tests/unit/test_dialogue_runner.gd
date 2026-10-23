class_name TestDialogueRunner
extends RefCounted

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(_test_dialogue_start_and_progression())
	results.append(_test_dialogue_history())
	return results

static func _test_dialogue_start_and_progression() -> Dictionary:
	var dr = DialogueRunner.new()
	var started = dr.start("tara_intro")
	var initial_speaker = dr.nodes[dr.current_node_id].speaker

	# Advance to Veer reply
	var adv1 = dr.advance()
	var second_speaker = dr.nodes[dr.current_node_id].speaker

	# Advance to Tara instruction
	var adv2 = dr.advance()
	var third_speaker = dr.nodes[dr.current_node_id].speaker

	var pass_check = (started and adv1 and adv2 and initial_speaker == "Devi Tara" and second_speaker == "Veer" and third_speaker == "Devi Tara")
	return {"name": "test_dialogue_start_and_progression", "passed": pass_check}

static func _test_dialogue_history() -> Dictionary:
	var dr = DialogueRunner.new()
	dr.start("tara_intro")
	dr.advance()
	dr.advance()

	var pass_check = (dr.history.size() >= 3 and dr.history[0] == "tara_intro")
	return {"name": "test_dialogue_history", "passed": pass_check}
