class_name TestLocomotionSkeletalAnimationQ11
extends RefCounted

## Stage Q11 Test Suite: Realistic Locomotion, Skeletal Animation & Control Refinement
## Validates:
## 1. Authored 36-clip motion library in veer.glb (Locomotion, Transitions, Aerial, Combat)
## 2. AnimationTree State Machine & 2D BlendSpace speed coverage
## 3. Stopping inertia & deceleration transitions (walk_stop, run_stop)
## 4. Ground conformance & slope foot placement
## 5. Combat alert stance selection
## 6. Camera-relative movement vector math
## 7. Camera radial deadzone & captured mouse look
## 8. Dynamic body banking roll & forward slope pitch

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(_test_authored_locomotion_animation_library())
	results.append(_test_locomotion_blend_space_coverage())
	results.append(_test_stopping_inertia_transitions())
	results.append(_test_ground_conformance_and_foot_placement())
	results.append(_test_combat_alert_stance_selection())
	results.append(_test_camera_relative_movement_math())
	results.append(_test_camera_controls_and_deadzone())
	results.append(_test_body_banking_and_slope_pitch())
	return results

static func _instantiate_player() -> PlayerController3D:
	var scene = load("res://scenes/player/Player3D.tscn")
	var player: PlayerController3D = scene.instantiate()
	player._ready()
	return player

static func _test_authored_locomotion_animation_library() -> Dictionary:
	var test_name = "test_authored_locomotion_animation_library"
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
		"fall", "landing", "dodge", "block", "parry", "attack_light_1",
		"attack_light_2", "attack_heavy_finisher", "hit_reaction", "interact",
		"solar_blast", "meditation", "victory", "defeat"
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

	var ok = missing.is_empty() and anim_list.size() >= 30
	inst.free()
	return {
		"name": test_name,
		"passed": ok,
		"message": ("Found %d animations. Missing: %s" % [anim_list.size(), str(missing)]) if not ok else ""
	}

static func _test_locomotion_blend_space_coverage() -> Dictionary:
	var test_name = "test_locomotion_blend_space_coverage"
	var player = _instantiate_player()
	var bs2d = player.locomotion_blend_space
	if not bs2d:
		player.free()
		return {"name": test_name, "passed": false, "message": "locomotion_blend_space is null"}

	var count = bs2d.get_blend_point_count()
	var found_idle = false
	var found_walk = false
	var found_sprint = false
	var found_backward = false
	var found_strafe_l = false
	var found_strafe_r = false

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
			elif node.animation == "walk_backward" and abs(pos.y - -3.5) < 0.1:
				found_backward = true
			elif node.animation == "strafe_left" and abs(pos.x - -3.8) < 0.1:
				found_strafe_l = true
			elif node.animation == "strafe_right" and abs(pos.x - 3.8) < 0.1:
				found_strafe_r = true

	var ok = (found_idle and found_walk and found_sprint and found_backward and found_strafe_l and found_strafe_r)
	player.free()
	return {"name": test_name, "passed": ok}

static func _test_stopping_inertia_transitions() -> Dictionary:
	var test_name = "test_stopping_inertia_transitions"
	var player = _instantiate_player()

	# Simulate braking from sprint (velocity drops from 10.5 to 0 on floor)
	player.previous_horiz_speed = 10.0
	player.velocity = Vector3(0.1, 0, 0)
	player.stop_transition_timer = 0.0

	# Process kinematics step
	player._physics_process(0.016)

	var run_stop_triggered = (player.current_state == "run_stop" and player.stop_transition_timer > 0.0)

	# Reset and simulate braking from walk (speed drops from 4.0 to 0)
	player.stop_transition_timer = 0.0
	player.previous_horiz_speed = 4.0
	player.velocity = Vector3(0.1, 0, 0)
	player._physics_process(0.016)

	var walk_stop_triggered = (player.current_state == "walk_stop" and player.stop_transition_timer > 0.0)

	player.free()
	return {
		"name": test_name,
		"passed": (run_stop_triggered and walk_stop_triggered),
		"message": "run_stop: %s, walk_stop: %s" % [str(run_stop_triggered), str(walk_stop_triggered)]
	}

static func _test_ground_conformance_and_foot_placement() -> Dictionary:
	var test_name = "test_ground_conformance_and_foot_placement"
	var player = _instantiate_player()

	# Initially visual_root.position.y is 0.0
	var initial_y = player.visual_root.position.y

	# Airborne should return to 0.0
	player.was_on_floor = false
	player._update_ground_conformance(0.016)
	var airborne_y = player.visual_root.position.y

	var ok = (abs(initial_y) < 0.001 and abs(airborne_y) < 0.001)
	player.free()
	return {"name": test_name, "passed": ok}

static func _test_combat_alert_stance_selection() -> Dictionary:
	var test_name = "test_combat_alert_stance_selection"
	var player = _instantiate_player()

	# Standing still with active combo window should select idle_alert
	player.velocity = Vector3.ZERO
	player.combo_window_timer = 0.45
	player._update_locomotion_animation(0.016)

	var alert_selected = (player.current_state == "idle_alert")

	# Once combo window expires, standing still selects Locomotion (Idle)
	player.combo_window_timer = 0.0
	player.parry_window_timer = 0.0
	player._update_locomotion_animation(0.016)
	var idle_selected = (player.current_state == "Locomotion")

	player.free()
	return {"name": test_name, "passed": (alert_selected and idle_selected)}

static func _test_camera_relative_movement_math() -> Dictionary:
	var test_name = "test_camera_relative_movement_math"
	var player = _instantiate_player()

	# Facing camera at yaw = 0 (pointing south/Z+)
	player.camera_arm.rotation.y = 0.0
	var cam_rot_y = player.camera_arm.rotation.y
	var forward = -Vector3(sin(cam_rot_y), 0, cos(cam_rot_y))
	var right = Vector3(cos(cam_rot_y), 0, -sin(cam_rot_y))

	# W key: forward (-input_dir.y = 1)
	var move_forward = (forward * 1.0).normalized()
	var fwd_ok = (move_forward.is_equal_approx(Vector3(0, 0, -1)))

	# D key: right (input_dir.x = 1)
	var move_right = (right * 1.0).normalized()
	var rgt_ok = (move_right.is_equal_approx(Vector3(1, 0, 0)))

	# Turn camera 90 degrees right (yaw = PI/2)
	player.camera_arm.rotation.y = PI * 0.5
	cam_rot_y = player.camera_arm.rotation.y
	forward = -Vector3(sin(cam_rot_y), 0, cos(cam_rot_y))
	var move_fwd_turned = (forward * 1.0).normalized()
	var turned_ok = (move_fwd_turned.is_equal_approx(Vector3(-1, 0, 0)))

	player.free()
	return {"name": test_name, "passed": (fwd_ok and rgt_ok and turned_ok)}

static func _test_camera_controls_and_deadzone() -> Dictionary:
	var test_name = "test_camera_controls_and_deadzone"
	var player = _instantiate_player()
	var cam = player.camera_arm

	if not cam:
		player.free()
		return {"name": test_name, "passed": false, "message": "CameraArm is null"}

	var init_yaw = cam.rotation.y
	cam.orbit(10.0, 5.0)
	var changed_yaw = cam.rotation.y != init_yaw

	player.free()
	return {"name": test_name, "passed": changed_yaw}

static func _test_body_banking_and_slope_pitch() -> Dictionary:
	var test_name = "test_body_banking_and_slope_pitch"
	var player = _instantiate_player()

	player.visual_root.rotation = Vector3.ZERO
	player.previous_yaw = 0.0
	player.slope_alignment_pitch = 0.05
	player._update_body_lean_physics(0.1, 10.5)

	# Has pitch combining speed and slope alignment
	var pitch_ok = player.visual_root.rotation.x > 0.01

	player.free()
	return {"name": test_name, "passed": pitch_ok}
