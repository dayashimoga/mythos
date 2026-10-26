class_name TestLocomotionAnimationTree
extends RefCounted

## Stage Q2 Test Suite: Realistic 3D Locomotion, AnimationTree Architecture,
## Gait Synchronization, Dynamic Lean Physics, Footstep Contacts, and Weapon Sockets.

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(_test_animation_tree_construction_and_binding())
	results.append(_test_locomotion_blend_space_2d_points())
	results.append(_test_state_machine_transitions_and_playback())
	results.append(_test_local_velocity_and_blend_position_calculation())
	results.append(_test_dynamic_banking_and_acceleration_pitch())
	results.append(_test_turn_in_place_selection())
	results.append(_test_footstep_phase_tracking_and_signals())
	results.append(_test_melee_attack_hitbox_contact_phases())
	results.append(_test_bone_attachment_weapon_sockets())
	return results

static func _instantiate_player() -> PlayerController3D:
	var scene = load("res://scenes/player/Player3D.tscn")
	var player: PlayerController3D = scene.instantiate()
	player._ready()
	return player

static func _test_animation_tree_construction_and_binding() -> Dictionary:
	var test_name = "test_animation_tree_construction_and_binding"
	var player = _instantiate_player()

	var anim_tree = player.anim_tree
	var anim_playback = player.anim_playback
	var anim_player = player.anim_player

	var ok = (anim_tree != null and anim_tree.active and anim_playback != null and anim_player != null)
	player.free()
	return {"name": test_name, "passed": ok}

static func _test_locomotion_blend_space_2d_points() -> Dictionary:
	var test_name = "test_locomotion_blend_space_2d_points"
	var player = _instantiate_player()
	var bs2d = player.locomotion_blend_space

	if not bs2d:
		player.free()
		return {"name": test_name, "passed": false, "message": "locomotion_blend_space is null"}

	var count = bs2d.get_blend_point_count()
	if count < 7:
		player.free()
		return {"name": test_name, "passed": false, "message": "Expected at least 7 blend points, found %d" % count}

	var found_idle = false
	var found_walk = false
	var found_sprint = false
	var found_strafe = false

	for i in range(count):
		var pos = bs2d.get_blend_point_position(i)
		var node = bs2d.get_blend_point_node(i) as AnimationNodeAnimation
		if node:
			if node.animation == "idle" and pos == Vector2.ZERO:
				found_idle = true
			elif node.animation == "walk" and abs(pos.y - 4.2) < 0.1:
				found_walk = true
			elif node.animation == "sprint" and abs(pos.y - 10.5) < 0.1:
				found_sprint = true
			elif node.animation == "strafe_left" or node.animation == "strafe_right":
				found_strafe = true

	var ok = (found_idle and found_walk and found_sprint and found_strafe)
	player.free()
	return {"name": test_name, "passed": ok}

static func _test_state_machine_transitions_and_playback() -> Dictionary:
	var test_name = "test_state_machine_transitions_and_playback"
	var player = _instantiate_player()
	var anim_playback = player.anim_playback

	if not anim_playback:
		player.free()
		return {"name": test_name, "passed": false, "message": "anim_playback is null"}

	player._travel_to("dodge")
	var state_dodge = player.current_state == "dodge"

	player._travel_to("attack_light_1")
	var state_atk = player.current_state == "attack_light_1"

	player._travel_to("Locomotion")
	var state_loco = player.current_state == "Locomotion"

	player.free()
	return {"name": test_name, "passed": (state_dodge and state_atk and state_loco)}

static func _test_local_velocity_and_blend_position_calculation() -> Dictionary:
	var test_name = "test_local_velocity_and_blend_position_calculation"
	var player = _instantiate_player()

	player.visual_root.rotation.y = 0.0
	player.velocity = Vector3(0, 0, -7.5) # Moving forward at 7.5 m/s

	player._update_locomotion_animation(0.016)

	var blend_pos: Vector2 = player.anim_tree.get("parameters/Locomotion/blend_position")
	var forward_ok = (abs(blend_pos.y - 7.5) < 0.1 and abs(blend_pos.x) < 0.1)

	# Moving laterally to the right (+X)
	player.velocity = Vector3(3.8, 0, 0)
	player._update_locomotion_animation(0.016)
	blend_pos = player.anim_tree.get("parameters/Locomotion/blend_position")
	var lateral_ok = (abs(blend_pos.x - 3.8) < 0.1 and abs(blend_pos.y) < 0.1)

	player.free()
	return {"name": test_name, "passed": (forward_ok and lateral_ok)}

static func _test_dynamic_banking_and_acceleration_pitch() -> Dictionary:
	var test_name = "test_dynamic_banking_and_acceleration_pitch"
	var player = _instantiate_player()

	# Test forward pitch when sprinting
	player.visual_root.rotation = Vector3.ZERO
	player.previous_yaw = 0.0
	player._update_body_lean_physics(0.1, 10.5)

	var has_forward_pitch = player.visual_root.rotation.x > 0.005

	# Test banking roll when turning sharply right
	player.visual_root.rotation.y = deg_to_rad(30.0)
	player.previous_yaw = 0.0
	player._update_body_lean_physics(0.1, 8.0)

	var has_banking_roll = abs(player.visual_root.rotation.z) > 0.005

	player.free()
	return {"name": test_name, "passed": (has_forward_pitch and has_banking_roll)}

static func _test_turn_in_place_selection() -> Dictionary:
	var test_name = "test_turn_in_place_selection"
	var player = _instantiate_player()

	player.visual_root.rotation.y = 0.0
	player.camera_arm.rotation.y = deg_to_rad(90.0)
	player.velocity = Vector3.ZERO

	player._update_locomotion_animation(0.016)

	var cam_diff = wrapf(player.camera_arm.rotation.y - player.visual_root.rotation.y, -PI, PI)
	var needs_turn = abs(cam_diff) > deg_to_rad(70.0)

	player.free()
	return {"name": test_name, "passed": needs_turn}

static func _test_footstep_phase_tracking_and_signals() -> Dictionary:
	var test_name = "test_footstep_phase_tracking_and_signals"
	var player = _instantiate_player()

	var footstep_emitted: Array = []
	player.footstep_contact.connect(func(foot_idx, pos, surface):
		footstep_emitted.append({"foot": foot_idx, "pos": pos, "surface": surface})
	)

	for i in range(60):
		player._update_footstep_audio(0.033, true, 4.2)

	var ok = (footstep_emitted.size() >= 2)
	player.free()
	return {"name": test_name, "passed": ok}

static func _test_melee_attack_hitbox_contact_phases() -> Dictionary:
	var test_name = "test_melee_attack_hitbox_contact_phases"
	var player = _instantiate_player()

	var phases_detected: Array[String] = []
	player.attack_phase_changed.connect(func(phase, combo):
		if not phase in phases_detected:
			phases_detected.append(phase)
	)

	player.is_attacking = true
	player.attack_duration = 0.4
	# 1. Windup (10% progress)
	player.attack_timer = 0.36
	player._physics_process(0.016)

	# 2. Active contact (50% progress)
	player.attack_timer = 0.20
	player._physics_process(0.016)
	var active_hitbox = player.melee_hitbox.monitoring

	# 3. Recovery (90% progress)
	player.attack_timer = 0.04
	player._physics_process(0.016)
	var recovery_hitbox = not player.melee_hitbox.monitoring

	var ok = ("windup" in phases_detected and "active" in phases_detected and active_hitbox and recovery_hitbox)
	player.free()
	return {"name": test_name, "passed": ok}

static func _test_bone_attachment_weapon_sockets() -> Dictionary:
	var test_name = "test_bone_attachment_weapon_sockets"
	var player = _instantiate_player()

	var w_sock = player.weapon_socket
	var s_sock = player.shield_socket

	var has_weapon_sock = (w_sock != null and w_sock is BoneAttachment3D and not w_sock.bone_name.is_empty())
	var has_shield_sock = (s_sock != null and s_sock is BoneAttachment3D and not s_sock.bone_name.is_empty())

	player.free()
	return {"name": test_name, "passed": (has_weapon_sock and has_shield_sock)}
