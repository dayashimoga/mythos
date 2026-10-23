class_name TestVeerModel
extends RefCounted

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(_test_model_import_and_nodes())
	results.append(_test_skeleton_bone_hierarchy())
	results.append(_test_animations_presence())
	return results

static func _test_model_import_and_nodes() -> Dictionary:
	var scene = load("res://assets/characters/veer/veer.glb")
	if scene == null:
		return {"name": "test_model_import_and_nodes", "passed": false}

	var inst = scene.instantiate()
	if inst == null:
		return {"name": "test_model_import_and_nodes", "passed": false}

	var skeleton = _find_skeleton(inst)
	var anim_player: AnimationPlayer = inst.find_child("AnimationPlayer", true, false)

	var ok = (skeleton != null and anim_player != null)
	inst.free()
	return {"name": "test_model_import_and_nodes", "passed": ok}

static func _test_skeleton_bone_hierarchy() -> Dictionary:
	var scene = load("res://assets/characters/veer/veer.glb")
	if scene == null:
		return {"name": "test_skeleton_bone_hierarchy", "passed": false}
	var inst = scene.instantiate()
	var skeleton = _find_skeleton(inst)
	if skeleton == null:
		inst.free()
		return {"name": "test_skeleton_bone_hierarchy", "passed": false}

	var bone_count = skeleton.get_bone_count()
	var required_bones = ["root", "pelvis", "spine_01", "chest", "head", "arm_l", "arm_r", "thigh_l", "thigh_r"]
	var all_found = (bone_count >= 15)

	for b in required_bones:
		if skeleton.find_bone(b) == -1:
			all_found = false
			break

	inst.free()
	return {"name": "test_skeleton_bone_hierarchy", "passed": all_found}

static func _test_animations_presence() -> Dictionary:
	var scene = load("res://assets/characters/veer/veer.glb")
	if scene == null:
		return {"name": "test_animations_presence", "passed": false}
	var inst = scene.instantiate()
	var anim_player: AnimationPlayer = inst.find_child("AnimationPlayer", true, false)
	if anim_player == null:
		inst.free()
		return {"name": "test_animations_presence", "passed": false}

	var anim_list = anim_player.get_animation_list()
	var required_anims = ["idle", "walk", "jog", "sprint", "jump", "dodge", "attack_light_1", "block"]
	var all_present = true

	for a in required_anims:
		var found = false
		for full_name in anim_list:
			if full_name.ends_with(a) or full_name == a:
				found = true
				break
		if not found:
			all_present = false
			break

	inst.free()
	return {"name": "test_animations_presence", "passed": all_present}

static func _find_skeleton(node: Node) -> Skeleton3D:
	if node is Skeleton3D:
		return node
	for child in node.get_children():
		var s = _find_skeleton(child)
		if s:
			return s
	return null
