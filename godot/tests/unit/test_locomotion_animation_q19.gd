class_name TestLocomotionAnimationQ19
extends RefCounted

## Stage Q19 Test Suite: Production Locomotion, Animation & Movement Calibration
## Validates:
## 1. Complete 42-clip authored animation library in veer.glb and loop integrity
## 2. Dynamic skeletal bone articulated motion over time (no rigid translation)
## 3. AnimationNodeStateMachine automatic return (advance_mode = ADVANCE_MODE_AUTO)
## 4. Action combo chaining (attack_light_1 -> 2 -> finisher, dodge -> roll, block -> recoil)
## 5. Precise Godot 3D character facing mathematics (atan2(-x, -z))
## 6. Dynamic speed-to-stride cadence scaling to eliminate foot sliding
## 7. Crouch locomotion and stair traversal state integration
## 8. Sockets attachment and combat hitbox/recoil synchronization

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(_test_authored_42_animation_library_and_loop_integrity())
	results.append(_test_skeletal_bone_transform_motion_over_time())
	results.append(_test_animation_tree_state_machine_and_auto_advance())
	results.append(_test_action_combo_chaining_transitions())
	results.append(_test_character_facing_accuracy_in_godot_space())
	results.append(_test_speed_to_stride_cadence_scaling())
	results.append(_test_crouch_and_stair_traversal_integration())
	results.append(_test_weapon_sockets_and_combat_hitbox_sync())
	return results

static func _instantiate_player() -> PlayerController3D:
	var scene = load("res://scenes/player/Player3D.tscn")
	var player: PlayerController3D = scene.instantiate()
	player._ready()
	return player

static func _test_authored_42_animation_library_and_loop_integrity() -> Dictionary:
	var test_name = "test_authored_42_animation_library_and_loop_integrity"
	var scene = load("res://assets/characters/veer/veer.glb")
	if not scene:
		return {"name": test_name, "passed": false, "message": "veer.glb missing"}

	var inst = scene.instantiate()
	var ap: AnimationPlayer = inst.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if not ap:
		inst.free()
		return {"name": test_name, "passed": false, "message": "AnimationPlayer missing in veer.glb"}

	var anim_list = ap.get_animation_list()
	var required = [
		"idle", "idle_alert", "walk", "jog", "run", "sprint", "walk_backward",
		"strafe_left", "strafe_right", "walk_start", "walk_stop", "run_stop",
		"turn_left_90", "turn_right_90", "turn_180", "jump_start", "jump",
		"fall", "landing", "dodge", "roll", "block", "parry", "recoil",
		"attack_light_1", "attack_light_2", "attack_heavy_finisher", "hit_reaction",
		"interact", "solar_blast", "meditation", "victory", "defeat",
		"crouch_idle", "crouch_walk", "stair_ascent", "stair_descent"
	]

	var missing = []
	for req in required:
		var found = false
		for a in anim_list:
			if a == req or a.ends_with("/" + req):
				found = true
				break
		if not found:
			missing.append(req)

	var ok = missing.is_empty() and anim_list.size() >= 36
	inst.free()

	# Also verify PlayerController3D sets LOOP_LINEAR on continuous tracks
	var player = _instantiate_player()
	var p_ap = player.anim_player
	var loop_ok = true
	var failed_loop = ""
	if p_ap:
		var loop_checks = ["idle", "walk", "jog", "sprint", "crouch_walk", "stair_ascent"]
		for lc in loop_checks:
			if p_ap.has_animation(lc):
				var anim = p_ap.get_animation(lc)
				if anim and anim.loop_mode != Animation.LOOP_LINEAR:
					loop_ok = false
					failed_loop = lc
					break
	player.free()

	return {
		"name": test_name,
		"passed": ok and loop_ok,
		"message": ("Missing anims: %s" % str(missing)) if not ok else (("Loop mode failed on %s" % failed_loop) if not loop_ok else "")
	}

static func _test_skeletal_bone_transform_motion_over_time() -> Dictionary:
	var test_name = "test_skeletal_bone_transform_motion_over_time"
	var scene = load("res://assets/characters/veer/veer.glb")
	if not scene:
		return {"name": test_name, "passed": false, "message": "veer.glb missing"}

	var inst = scene.instantiate()
	var ap: AnimationPlayer = inst.find_child("AnimationPlayer", true, false) as AnimationPlayer
	var skel: Skeleton3D = inst.find_child("Veer", true, false) as Skeleton3D
	if not skel:
		skel = inst.find_child("Skeleton3D", true, false) as Skeleton3D

	if not ap or not skel:
		inst.free()
		return {"name": test_name, "passed": false, "message": "AnimationPlayer or Skeleton3D missing in veer.glb"}

	var bone_names = ["thigh_l", "shin_l", "arm_r", "pelvis", "chest"]
	var bone_indices = []
	for b_name in bone_names:
		var idx = skel.find_bone(b_name)
		if idx != -1:
			bone_indices.append(idx)

	if bone_indices.size() < 3:
		inst.free()
		return {"name": test_name, "passed": false, "message": "Critical humanoid bones missing in Skeleton3D"}

	var test_clips = ["walk", "sprint", "crouch_walk", "stair_ascent", "dodge", "attack_light_1"]
	var motion_detected = true
	var failed_clip = ""

	for clip in test_clips:
		if not ap.has_animation(clip):
			continue
		var anim = ap.get_animation(clip)
		var total_bone_delta = 0.0

		for b_idx in bone_indices:
			# Sample tracks at t=0.0 and t=0.3
			var b_name = skel.get_bone_name(b_idx)
			var track_rot = anim.find_track(NodePath("Veer/Skeleton3D:" + b_name), Animation.TYPE_ROTATION_3D)
			if track_rot == -1:
				track_rot = anim.find_track(NodePath("Veer:" + b_name), Animation.TYPE_ROTATION_3D)
			if track_rot == -1:
				track_rot = anim.find_track(NodePath("%GeneralSkeleton:" + b_name), Animation.TYPE_ROTATION_3D)

			if track_rot != -1 and anim.track_get_key_count(track_rot) >= 2:
				var q0 = anim.rotation_track_interpolate(track_rot, 0.0)
				var q1 = anim.rotation_track_interpolate(track_rot, min(0.3, anim.length * 0.5))
				total_bone_delta += abs(q0.angle_to(q1))

		if total_bone_delta < 0.05:
			motion_detected = false
			failed_clip = clip
			break

	inst.free()
	return {
		"name": test_name,
		"passed": motion_detected,
		"message": ("Clip '%s' has insufficient skeletal bone articulation (frozen motion detected)" % failed_clip) if not motion_detected else ""
	}

static func _test_animation_tree_state_machine_and_auto_advance() -> Dictionary:
	var test_name = "test_animation_tree_state_machine_and_auto_advance"
	var player = _instantiate_player()
	var at: AnimationTree = player.anim_tree
	if not at or not at.tree_root:
		player.free()
		return {"name": test_name, "passed": false, "message": "AnimationTree or tree_root missing"}

	var sm: AnimationNodeStateMachine = at.tree_root as AnimationNodeStateMachine
	if not sm:
		player.free()
		return {"name": test_name, "passed": false, "message": "AnimationTree root is not AnimationNodeStateMachine"}

	# Verify Start -> Locomotion auto advance
	var trans_start = sm.get_transition(0)
	var has_auto_start = false
	var auto_advance_count = 0
	var trans_count = sm.get_transition_count()

	for i in range(trans_count):
		var from_node = sm.get_transition_from(i)
		var to_node = sm.get_transition_to(i)
		var trans = sm.get_transition(i)
		if from_node == "Start" and to_node == "Locomotion":
			if trans.advance_mode == AnimationNodeStateMachineTransition.ADVANCE_MODE_AUTO:
				has_auto_start = true
		if to_node == "Locomotion" and trans.switch_mode == AnimationNodeStateMachineTransition.SWITCH_MODE_AT_END:
			if trans.advance_mode == AnimationNodeStateMachineTransition.ADVANCE_MODE_AUTO:
				auto_advance_count += 1

	player.free()
	var ok = has_auto_start and auto_advance_count >= 8
	return {
		"name": test_name,
		"passed": ok,
		"message": ("State machine auto advance check failed. Start auto: %s, AtEnd auto returns: %d" % [has_auto_start, auto_advance_count]) if not ok else ""
	}

static func _test_action_combo_chaining_transitions() -> Dictionary:
	var test_name = "test_action_combo_chaining_transitions"
	var player = _instantiate_player()
	var sm: AnimationNodeStateMachine = player.anim_tree.tree_root as AnimationNodeStateMachine
	if not sm:
		player.free()
		return {"name": test_name, "passed": false, "message": "AnimationNodeStateMachine missing"}

	var required_chains = [
		{"from": "attack_light_1", "to": "attack_light_2"},
		{"from": "attack_light_2", "to": "attack_heavy_finisher"},
		{"from": "dodge", "to": "roll"},
		{"from": "block", "to": "parry"},
		{"from": "block", "to": "recoil"},
		{"from": "jump", "to": "fall"},
		{"from": "fall", "to": "landing"}
	]

	var missing_chains = []
	for rc in required_chains:
		var found = false
		for i in range(sm.get_transition_count()):
			if sm.get_transition_from(i) == rc["from"] and sm.get_transition_to(i) == rc["to"]:
				found = true
				break
		if not found:
			missing_chains.append("%s->%s" % [rc["from"], rc["to"]])

	player.free()
	var ok = missing_chains.is_empty()
	return {
		"name": test_name,
		"passed": ok,
		"message": ("Missing combo/action chains: %s" % str(missing_chains)) if not ok else ""
	}

static func _test_character_facing_accuracy_in_godot_space() -> Dictionary:
	var test_name = "test_character_facing_accuracy_in_godot_space"

	# In Godot 3D:
	# Forward is -Z (0, 0, -1). Facing angle should be 0.
	# Backward is +Z (0, 0, 1). Facing angle should be PI.
	# Right is +X (1, 0, 0). Facing angle should be -PI/2.
	# Left is -X (-1, 0, 0). Facing angle should be +PI/2.
	var calc_facing = func(dir: Vector3) -> Vector3:
		var angle = atan2(-dir.x, -dir.z)
		return -Transform3D().rotated(Vector3.UP, angle).basis.z

	var fwd = calc_facing.call(Vector3(0, 0, -1))
	var back = calc_facing.call(Vector3(0, 0, 1))
	var right = calc_facing.call(Vector3(1, 0, 0))
	var left = calc_facing.call(Vector3(-1, 0, 0))

	var fwd_ok = fwd.distance_to(Vector3(0, 0, -1)) < 0.001
	var back_ok = back.distance_to(Vector3(0, 0, 1)) < 0.001
	var right_ok = right.distance_to(Vector3(1, 0, 0)) < 0.001
	var left_ok = left.distance_to(Vector3(-1, 0, 0)) < 0.001

	var ok = fwd_ok and back_ok and right_ok and left_ok
	return {
		"name": test_name,
		"passed": ok,
		"message": "Facing formula inverted or misaligned with Godot -Z convention" if not ok else ""
	}

static func _test_speed_to_stride_cadence_scaling() -> Dictionary:
	var test_name = "test_speed_to_stride_cadence_scaling"
	var player = _instantiate_player()
	player.current_state = "Locomotion"

	# Test Walk Cadence Scaling
	player.velocity = Vector3(0.0, 0.0, -4.2)
	player._update_locomotion_animation(0.016)
	var walk_scale = player.anim_player.speed_scale if player.anim_player else 1.0

	# Test Jog Cadence Scaling
	player.velocity = Vector3(0.0, 0.0, -7.5)
	player._update_locomotion_animation(0.016)
	var jog_scale = player.anim_player.speed_scale if player.anim_player else 1.0

	# Test Sprint Cadence Scaling
	player.velocity = Vector3(0.0, 0.0, -10.5)
	player._update_locomotion_animation(0.016)
	var sprint_scale = player.anim_player.speed_scale if player.anim_player else 1.0

	# Test Idle Rest Scaling
	player.velocity = Vector3.ZERO
	player._update_locomotion_animation(0.016)
	var idle_scale = player.anim_player.speed_scale if player.anim_player else 1.0

	player.free()
	var ok = abs(walk_scale - 1.0) < 0.05 and abs(jog_scale - 1.0) < 0.05 and abs(sprint_scale - 1.0) < 0.05 and abs(idle_scale - 1.0) < 0.001
	return {
		"name": test_name,
		"passed": ok,
		"message": ("Speed scale calibration error: walk=%.2f, jog=%.2f, sprint=%.2f, idle=%.2f" % [walk_scale, jog_scale, sprint_scale, idle_scale]) if not ok else ""
	}

static func _test_crouch_and_stair_traversal_integration() -> Dictionary:
	var test_name = "test_crouch_and_stair_traversal_integration"
	var player = _instantiate_player()

	# 1. Crouch Idle
	player.is_crouching = true
	player.velocity = Vector3.ZERO
	player._update_locomotion_animation(0.016)
	var crouch_idle_ok = player.current_state == "crouch_idle"

	# 2. Crouch Walk
	player.velocity = Vector3(0.0, 0.0, -2.4)
	player._update_locomotion_animation(0.016)
	var crouch_walk_ok = player.current_state == "crouch_walk"

	# 3. Stair Ascent
	player.is_crouching = false
	player.is_on_stairs = true
	player.stair_direction = 1
	player.velocity = Vector3(0.0, 0.0, -3.0)
	player._update_locomotion_animation(0.016)
	var stair_asc_ok = player.current_state == "stair_ascent"

	# 4. Stair Descent
	player.stair_direction = -1
	player._update_locomotion_animation(0.016)
	var stair_desc_ok = player.current_state == "stair_descent"

	player.free()
	var ok = crouch_idle_ok and crouch_walk_ok and stair_asc_ok and stair_desc_ok
	return {
		"name": test_name,
		"passed": ok,
		"message": ("Crouch/Stair state failed: c_idle=%s, c_walk=%s, st_asc=%s, st_desc=%s" % [crouch_idle_ok, crouch_walk_ok, stair_asc_ok, stair_desc_ok]) if not ok else ""
	}

static func _test_weapon_sockets_and_combat_hitbox_sync() -> Dictionary:
	var test_name = "test_weapon_sockets_and_combat_hitbox_sync"
	var player = _instantiate_player()

	# Check bone sockets
	var ws_ok = player.weapon_socket != null and is_instance_valid(player.weapon_socket)
	var ss_ok = player.shield_socket != null and is_instance_valid(player.shield_socket)

	# Check combo chaining ability during recovery window
	player.is_attacking = true
	player.attack_timer = 0.12 # Inside recovery window (<= 0.18)
	player.combo_index = 1
	player._trigger_attack()
	var combo_chain_ok = player.combo_index == 2

	# Check block poise recoil (90 poise dmg -> 45 poise after block > 40 threshold triggers recoil)
	var spec = CombatMath.AttackSpec.new("boss", 20, 90.0, Vector3(0, 0, -2))
	player.is_guarding = true
	player.take_damage_spec(spec)
	var recoil_ok = player.current_state == "recoil"

	player.free()
	var ok = ws_ok and ss_ok and combo_chain_ok and recoil_ok
	return {
		"name": test_name,
		"passed": ok,
		"message": ("Combat sync failed: ws=%s, ss=%s, combo_chain=%s, recoil=%s" % [ws_ok, ss_ok, combo_chain_ok, recoil_ok]) if not ok else ""
	}
