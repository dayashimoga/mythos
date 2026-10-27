class_name PlayerController3D
extends CharacterBody3D

const AudioManager3D = preload("res://scripts/audio/audio_manager_3d.gd")
const CombatMath = preload("res://scripts/domain/combat_math.gd")

## Stage Q2 — Production Realistic 3D Humanoid Locomotion and Character Controller for Veer.
## Features:
## - Full 24-bone Skeleton3D humanoid animation integration
## - Programmatic AnimationTree with AnimationNodeStateMachine & AnimationNodeBlendSpace2D
## - Seamless speed-matched gait blending (Idle, Walk, Jog, Run, Sprint, Walk Backward, Strafing)
## - Dynamic body lean / banking roll into turns and forward acceleration pitch
## - Turn-in-place state selection (90 deg left/right, 180 deg)
## - Grounded foot placement with gait-phase stride tracking & 3D footstep audio
## - Slope handling with constant speed, stair snapping (0.45m), and slope velocity alignment
## - Enhanced jump with jump buffering (0.15s), coyote time (0.12s), and variable jump cutoff
## - 4-directional Prana Dash (Dodge) with invulnerability frames
## - 3-hit Surya combo attack sequence with contact-synchronized 3D melee hitboxes & CombatMath
## - Directional shield guard stance (absorbs 75% dmg) and 140ms perfect parry deflection
## - BoneAttachment3D sockets for weapon (right hand) and shield (left hand)
## - Multi-input support: Keyboard & Mouse, Gamepad analog sticks/buttons, Touch triggers
## - Forward raycast and proximity area spatial interactions with shrines and Astra shards

signal health_changed(current: int, max_val: int)
signal shards_changed(count: int)
signal prana_changed(current: float, max_val: float)
signal nearby_prompt_changed(prompt_text: String)
signal interacted_with(target_name: String)
signal interaction_requested(target_name: String)
signal locomotion_state_changed(state: String, speed: float)
signal attack_hit(target: Node3D, damage: int, is_crit: bool)
signal attack_phase_changed(phase: String, combo_index: int)
signal footstep_contact(foot_index: int, pos: Vector3, surface_type: String)
signal animation_state_entered(state_name: String)
signal player_action_performed(action: String)


@export_group("Locomotion")
@export var walk_speed: float = 4.2
@export var jog_speed: float = 7.5
@export var sprint_speed: float = 10.5
@export var guard_speed: float = 2.2
@export var strafe_speed: float = 3.8
@export var backward_speed: float = 3.5
@export var acceleration: float = 42.0
@export var air_acceleration: float = 18.0
@export var friction: float = 35.0
@export var turn_speed: float = 14.0
@export var jump_velocity: float = 8.5
@export var gravity: float = 19.6
@export var max_fall_speed: float = 35.0

@export_group("Prana Dash (Dodge)")
@export var dash_speed: float = 18.0
@export var dash_duration: float = 0.22
@export var dash_cooldown: float = 0.65

@export_group("Combat Stats")
@export var max_health: int = 100
@export var attack_damage_base: int = 25
@export var max_prana: float = 100.0
@export var prana_regen: float = 24.0

# Node References
@onready var camera_arm: SpringArm3D = $CameraArm
@onready var visual_root: Node3D = $Visual
@onready var interact_detector: Area3D = $InteractDetector
@onready var interact_raycast: RayCast3D = $InteractRayCast
@onready var melee_hitbox: Area3D = $MeleeHitbox

# Animation System
var anim_player: AnimationPlayer = null
var anim_tree: AnimationTree = null
var anim_playback: AnimationNodeStateMachinePlayback = null
var locomotion_blend_space: AnimationNodeBlendSpace2D = null
var current_anim: String = ""
var current_state: String = "Locomotion"

# Bone Sockets
var weapon_socket: BoneAttachment3D = null
var shield_socket: BoneAttachment3D = null

# Gameplay State
var health: int = 100
var prana: float = 100.0
var active_prompt_cache: String = ""
var shards_collected: int = 0
var is_dashing: bool = false
var dash_timer: float = 0.0
var dash_cooldown_timer: float = 0.0
var dash_direction: Vector3 = Vector3.ZERO

# Defense & Guard
var is_guarding: bool = false
var parry_window_timer: float = 0.0
var parry_duration: float = 0.14

# Combat Attack State
var is_attacking: bool = false
var attack_timer: float = 0.0
var attack_duration: float = 0.35
var combo_index: int = 0
var combo_window_timer: float = 0.0
var hit_enemies: Array[Node3D] = []
var hit_stop_timer: float = 0.0
var slash_arc: MeshInstance3D = null

# Traversal & Kinematics State
var was_on_floor: bool = true
var landing_timer: float = 0.0
var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0

# Kinematics & Secondary Physics
var previous_yaw: float = 0.0
var gait_cycle_phase: float = 0.0
var last_footstep_phase: float = 0.0
var previous_horiz_speed: float = 0.0
var stop_transition_timer: float = 0.0
var slope_alignment_pitch: float = 0.0
var _last_camera_yaw: float = 0.0
var _prev_is_guarding: bool = false

# Aerial Glider & Harpoon Grapple (Chapter II: Antariksha)
var is_gliding: bool = false
var glide_speed: float = 12.0
var glide_fall_speed: float = 2.0
var is_grappling: bool = false
var grapple_target_pos: Vector3 = Vector3.ZERO
var grapple_speed: float = 24.0

# Traversal & Locomotion Expansion (Stage Q19)
var is_crouching: bool = false
@export var crouch_speed: float = 2.4
var is_rolling: bool = false
var roll_timer: float = 0.0
var is_on_stairs: bool = false
var stair_direction: int = 1
var stair_timer: float = 0.0


func _ready() -> void:
	if not visual_root:
		visual_root = get_node_or_null("Visual")
	if not camera_arm:
		camera_arm = get_node_or_null("CameraArm")
	if not melee_hitbox:
		melee_hitbox = get_node_or_null("MeleeHitbox")
	if not interact_detector:
		interact_detector = get_node_or_null("InteractDetector")
	if not interact_raycast:
		interact_raycast = get_node_or_null("InteractRayCast")

	health = max_health
	floor_snap_length = 0.45
	floor_max_angle = deg_to_rad(58.0)
	floor_stop_on_slope = true
	floor_constant_speed = true
	floor_block_on_wall = true
	safe_margin = 0.08
	up_direction = Vector3.UP

	anim_player = _find_animation_player(visual_root if visual_root else self)
	if anim_player:
		anim_player.playback_default_blend_time = 0.16
		_setup_animation_tree()
		_setup_bone_sockets()

	if melee_hitbox:
		melee_hitbox.area_entered.connect(_on_melee_hitbox_area_entered)
		melee_hitbox.body_entered.connect(_on_melee_hitbox_body_entered)
		melee_hitbox.monitoring = false

	if visual_root:
		previous_yaw = visual_root.rotation.y
		_setup_slash_arc()

	if camera_arm:
		_last_camera_yaw = camera_arm.rotation.y

	health_changed.emit(health, max_health)
	shards_changed.emit(shards_collected)

## Construct and bind Godot AnimationTree with AnimationNodeStateMachine & BlendSpace2D
func _setup_animation_tree() -> void:
	if not anim_player:
		return

	# Explicitly enforce looping on continuous cyclic locomotion tracks
	var looping_names = [
		"idle", "idle_alert", "walk", "jog", "run", "sprint",
		"walk_backward", "strafe_left", "strafe_right", "fall",
		"crouch_idle", "crouch_walk", "block", "meditation",
		"stair_ascent", "stair_descent"
	]
	for l_name in looping_names:
		if anim_player.has_animation(l_name):
			var a = anim_player.get_animation(l_name)
			if a:
				a.loop_mode = Animation.LOOP_LINEAR

	var oneshot_names = [
		"jump", "landing", "dodge", "roll", "parry", "recoil",
		"attack_light_1", "attack_light_2", "attack_heavy_finisher",
		"hit_reaction", "interact", "turn_left_90", "turn_right_90",
		"turn_180", "walk_start", "walk_stop", "run_stop", "solar_blast",
		"victory", "defeat"
	]
	for os_name in oneshot_names:
		if anim_player.has_animation(os_name):
			var a = anim_player.get_animation(os_name)
			if a:
				a.loop_mode = Animation.LOOP_NONE

	anim_tree = find_child("AnimationTree", true, false) as AnimationTree
	if not anim_tree:
		anim_tree = AnimationTree.new()
		anim_tree.name = "AnimationTree"
		add_child(anim_tree)

	anim_tree.anim_player = anim_tree.get_path_to(anim_player)

	if not anim_tree.tree_root:
		_build_production_animation_tree()

	anim_tree.active = true
	anim_playback = anim_tree.get("parameters/playback")

func _build_production_animation_tree() -> void:
	var state_machine = AnimationNodeStateMachine.new()

	# 1. Locomotion 2D Blend Space (X = Lateral [-strafe, +strafe], Y = Longitudinal [-back, +forward])
	locomotion_blend_space = AnimationNodeBlendSpace2D.new()
	locomotion_blend_space.min_space = Vector2(-11.0, -11.0)
	locomotion_blend_space.max_space = Vector2(11.0, 11.0)
	locomotion_blend_space.auto_triangles = true

	var add_bs_point = func(anim_name: String, pos: Vector2):
		if anim_player.has_animation(anim_name):
			var node = AnimationNodeAnimation.new()
			node.animation = anim_name
			locomotion_blend_space.add_blend_point(node, pos)

	add_bs_point.call("idle", Vector2(0.0, 0.0))
	add_bs_point.call("walk", Vector2(0.0, 4.2))
	add_bs_point.call("jog", Vector2(0.0, 7.5))
	add_bs_point.call("sprint", Vector2(0.0, 10.5))
	add_bs_point.call("walk_backward", Vector2(0.0, -3.5))
	add_bs_point.call("strafe_left", Vector2(-3.8, 0.0))
	add_bs_point.call("strafe_right", Vector2(3.8, 0.0))

	# Diagonals for responsive omnidirectional movement
	add_bs_point.call("walk", Vector2(-2.5, 3.0))
	add_bs_point.call("walk", Vector2(2.5, 3.0))
	add_bs_point.call("walk_backward", Vector2(-2.5, -2.5))
	add_bs_point.call("walk_backward", Vector2(2.5, -2.5))

	state_machine.add_node("Locomotion", locomotion_blend_space)

	# 2. Discrete Action Nodes
	var discrete_actions = [
		{"name": "jump", "xfade_in": 0.12, "xfade_out": 0.16, "at_end": false},
		{"name": "fall", "xfade_in": 0.15, "xfade_out": 0.16, "at_end": false},
		{"name": "landing", "xfade_in": 0.08, "xfade_out": 0.18, "at_end": true},
		{"name": "dodge", "xfade_in": 0.08, "xfade_out": 0.16, "at_end": true},
		{"name": "roll", "xfade_in": 0.08, "xfade_out": 0.16, "at_end": true},
		{"name": "block", "xfade_in": 0.12, "xfade_out": 0.15, "at_end": false},
		{"name": "parry", "xfade_in": 0.06, "xfade_out": 0.15, "at_end": true},
		{"name": "recoil", "xfade_in": 0.06, "xfade_out": 0.16, "at_end": true},
		{"name": "attack_light_1", "xfade_in": 0.08, "xfade_out": 0.16, "at_end": true},
		{"name": "attack_light_2", "xfade_in": 0.08, "xfade_out": 0.16, "at_end": true},
		{"name": "attack_heavy_finisher", "xfade_in": 0.10, "xfade_out": 0.20, "at_end": true},
		{"name": "hit_reaction", "xfade_in": 0.06, "xfade_out": 0.18, "at_end": true},
		{"name": "interact", "xfade_in": 0.12, "xfade_out": 0.18, "at_end": true},
		{"name": "turn_left_90", "xfade_in": 0.10, "xfade_out": 0.16, "at_end": true},
		{"name": "turn_right_90", "xfade_in": 0.10, "xfade_out": 0.16, "at_end": true},
		{"name": "turn_180", "xfade_in": 0.12, "xfade_out": 0.18, "at_end": true},
		{"name": "walk_start", "xfade_in": 0.08, "xfade_out": 0.16, "at_end": true},
		{"name": "walk_stop", "xfade_in": 0.12, "xfade_out": 0.16, "at_end": true},
		{"name": "run_stop", "xfade_in": 0.12, "xfade_out": 0.18, "at_end": true},
		{"name": "idle_alert", "xfade_in": 0.15, "xfade_out": 0.18, "at_end": false},
		{"name": "crouch_idle", "xfade_in": 0.12, "xfade_out": 0.16, "at_end": false},
		{"name": "crouch_walk", "xfade_in": 0.12, "xfade_out": 0.16, "at_end": false},
		{"name": "stair_ascent", "xfade_in": 0.12, "xfade_out": 0.16, "at_end": false},
		{"name": "stair_descent", "xfade_in": 0.12, "xfade_out": 0.16, "at_end": false},
		{"name": "solar_blast", "xfade_in": 0.08, "xfade_out": 0.18, "at_end": true},
		{"name": "meditation", "xfade_in": 0.20, "xfade_out": 0.25, "at_end": false},
		{"name": "victory", "xfade_in": 0.20, "xfade_out": 0.25, "at_end": true},
		{"name": "defeat", "xfade_in": 0.20, "xfade_out": 0.25, "at_end": false}
	]

	for act in discrete_actions:
		var anim_name: String = act["name"]
		if anim_player.has_animation(anim_name):
			var node_anim = AnimationNodeAnimation.new()
			node_anim.animation = anim_name
			state_machine.add_node(anim_name, node_anim)

			# Transition from Locomotion -> Action
			var trans_to = AnimationNodeStateMachineTransition.new()
			trans_to.xfade_time = act["xfade_in"]
			state_machine.add_transition("Locomotion", anim_name, trans_to)

			# Transition from Action -> Locomotion (with automatic advance at end)
			var trans_back = AnimationNodeStateMachineTransition.new()
			trans_back.xfade_time = act["xfade_out"]
			if act["at_end"]:
				trans_back.switch_mode = AnimationNodeStateMachineTransition.SWITCH_MODE_AT_END
				trans_back.advance_mode = AnimationNodeStateMachineTransition.ADVANCE_MODE_AUTO
			state_machine.add_transition(anim_name, "Locomotion", trans_back)

	# Action-to-Action Transitions for fluid combo chaining and movement continuity
	var chain_transitions = [
		{"from": "attack_light_1", "to": "attack_light_2", "xfade": 0.08},
		{"from": "attack_light_2", "to": "attack_heavy_finisher", "xfade": 0.10},
		{"from": "dodge", "to": "roll", "xfade": 0.10},
		{"from": "block", "to": "parry", "xfade": 0.06},
		{"from": "block", "to": "recoil", "xfade": 0.08},
		{"from": "jump", "to": "fall", "xfade": 0.15},
		{"from": "fall", "to": "landing", "xfade": 0.08},
		{"from": "crouch_idle", "to": "crouch_walk", "xfade": 0.12},
		{"from": "crouch_walk", "to": "crouch_idle", "xfade": 0.12},
	]

	for ct in chain_transitions:
		if anim_player.has_animation(ct["from"]) and anim_player.has_animation(ct["to"]):
			var trans = AnimationNodeStateMachineTransition.new()
			trans.xfade_time = ct["xfade"]
			state_machine.add_transition(ct["from"], ct["to"], trans)

	# Initial transition from Start to Locomotion
	var trans_start = AnimationNodeStateMachineTransition.new()
	trans_start.advance_mode = AnimationNodeStateMachineTransition.ADVANCE_MODE_AUTO
	state_machine.add_transition("Start", "Locomotion", trans_start)

	anim_tree.tree_root = state_machine

## Setup BoneAttachment3D sockets for weapon and shield
func _setup_bone_sockets() -> void:
	var skeleton = _find_skeleton(visual_root if visual_root else self)
	if not skeleton:
		return

	var r_bone_idx = skeleton.find_bone("socket_right_hand")
	if r_bone_idx == -1:
		r_bone_idx = skeleton.find_bone("hand_r")

	if r_bone_idx != -1:
		weapon_socket = skeleton.find_child("WeaponSocket", true, false) as BoneAttachment3D
		if not weapon_socket:
			weapon_socket = BoneAttachment3D.new()
			weapon_socket.name = "WeaponSocket"
			weapon_socket.bone_name = skeleton.get_bone_name(r_bone_idx)
			skeleton.add_child(weapon_socket)

	var l_bone_idx = skeleton.find_bone("hand_l")
	if l_bone_idx != -1:
		shield_socket = skeleton.find_child("ShieldSocket", true, false) as BoneAttachment3D
		if not shield_socket:
			shield_socket = BoneAttachment3D.new()
			shield_socket.name = "ShieldSocket"
			shield_socket.bone_name = skeleton.get_bone_name(l_bone_idx)
			skeleton.add_child(shield_socket)

func _physics_process(delta: float) -> void:
	# 0. Hit-Stop Frame Freeze (Crunchy impact pause)
	if hit_stop_timer > 0.0:
		hit_stop_timer -= delta
		return

	if stop_transition_timer > 0.0:
		stop_transition_timer -= delta

	var on_floor = is_on_floor() if is_inside_tree() else true

	# 1. Coyote Time & Floor Tracking
	if on_floor:
		coyote_timer = 0.12
		is_gliding = false
		is_grappling = false
		if not was_on_floor:
			was_on_floor = true
			landing_timer = 0.22
		if velocity.y < 0:
			velocity.y = -0.5 # Maintain slight downward adherence for stairs
		elif velocity.y > 0.0 and jump_buffer_timer <= 0.0:
			velocity.y = 0.0 # Prevent horizontal wall sliding from generating upward launch
	else:
		if was_on_floor:
			was_on_floor = false
		coyote_timer = max(0.0, coyote_timer - delta)

		# Aerial Glider logic (holding jump while falling)
		var jump_held = Input.is_action_pressed("jump") or Input.is_key_pressed(KEY_SPACE)
		if velocity.y < 0 and jump_held and not is_guarding and not is_grappling:
			is_gliding = true
			velocity.y = max(-glide_fall_speed, velocity.y - (gravity * 0.25) * delta)
		else:
			is_gliding = false
			velocity.y = max(-max_fall_speed, velocity.y - gravity * delta)

	# 2. Update Timers
	if jump_buffer_timer > 0.0:
		jump_buffer_timer -= delta
	if dash_cooldown_timer > 0.0:
		dash_cooldown_timer -= delta
	if landing_timer > 0.0:
		landing_timer -= delta
	if parry_window_timer > 0.0:
		parry_window_timer -= delta
	if combo_window_timer > 0.0:
		combo_window_timer -= delta
		if combo_window_timer <= 0.0:
			combo_index = 0
	if stair_timer > 0.0:
		stair_timer -= delta
		if stair_timer <= 0.0:
			is_on_stairs = false
	if is_rolling:
		roll_timer -= delta
		if roll_timer <= 0.0:
			is_rolling = false

	# 3. Read Input & Modes
	var is_locked_on = camera_arm != null and camera_arm.has_method("is_locked_on") and camera_arm.is_locked_on()
	var locked_target = camera_arm.get_locked_target() if (is_locked_on and camera_arm) else null

	# Camera yaw tracking for onboarding / tutorial look action
	if camera_arm:
		var yaw_delta = abs(wrapf(camera_arm.rotation.y - _last_camera_yaw, -PI, PI))
		if yaw_delta > 0.04:
			player_action_performed.emit("look")
			_last_camera_yaw = camera_arm.rotation.y

	is_crouching = (Input.is_key_pressed(KEY_C) or (InputMap.has_action("crouch") and Input.is_action_pressed("crouch"))) and on_floor and not is_dashing and not is_attacking
	is_guarding = (Input.is_key_pressed(KEY_Q) or Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT) or Input.is_joy_button_pressed(0, JOY_BUTTON_LEFT_SHOULDER)) and not is_attacking and not is_dashing and not is_gliding
	if is_guarding and not _prev_is_guarding:
		player_action_performed.emit("guard")
	_prev_is_guarding = is_guarding

	# 4. Handle Active Harpoon Grapple
	if is_grappling:
		var to_target = (grapple_target_pos - global_position)
		var dist = to_target.length()
		if dist > 1.8:
			velocity = to_target.normalized() * grapple_speed
			move_and_slide()
			return
		else:
			is_grappling = false
			is_gliding = true
			velocity = -visual_root.transform.basis.z * glide_speed + Vector3(0, 4.5, 0)

	# 5. Handle Active Dash (Collision-aware motion sweep to prevent penetration)
	if is_dashing:
		dash_timer -= delta
		var sweep_step = dash_direction * (dash_speed * delta)
		var sweep_col = KinematicCollision3D.new()
		if test_move(global_transform, sweep_step, sweep_col, safe_margin):
			var normal = sweep_col.get_normal()
			var slide_dir = (dash_direction - normal * dash_direction.dot(normal)).normalized()
			velocity.x = slide_dir.x * dash_speed
			velocity.z = slide_dir.z * dash_speed
		else:
			velocity.x = dash_direction.x * dash_speed
			velocity.z = dash_direction.z * dash_speed
		
		if on_floor and velocity.y > 0.0 and jump_buffer_timer <= 0.0:
			velocity.y = 0.0
		
		if dash_timer <= 0.0:
			is_dashing = false
		move_and_slide()
		_update_locomotion_animation(delta)
		return

	# 6. Handle Active Melee Attack
	if is_attacking:
		attack_timer -= delta
		# Natural attack weight transfer & momentum
		velocity.x = move_toward(velocity.x, 0.0, friction * 0.7 * delta)
		velocity.z = move_toward(velocity.z, 0.0, friction * 0.7 * delta)

		# Synchronize hitbox monitoring & slash arc with weapon swing arc (20% to 75% of duration)
		var progress = 1.0 - (attack_timer / attack_duration)
		if progress < 0.20:
			attack_phase_changed.emit("windup", combo_index)
			if melee_hitbox:
				melee_hitbox.monitoring = false
			if slash_arc:
				slash_arc.visible = false
		elif progress <= 0.75:
			attack_phase_changed.emit("active", combo_index)
			if melee_hitbox:
				melee_hitbox.monitoring = true
			if slash_arc:
				slash_arc.visible = true
				var arc_scale = 1.0 + (combo_index - 1) * 0.25
				slash_arc.scale = Vector3(arc_scale, 0.08, arc_scale)
		else:
			attack_phase_changed.emit("recovery", combo_index)
			if melee_hitbox:
				melee_hitbox.monitoring = false
			if slash_arc:
				slash_arc.visible = false

		# Face locked target or attack direction
		if locked_target and is_instance_valid(locked_target):
			var to_target = (locked_target.global_position - global_position)
			visual_root.rotation.y = atan2(-to_target.x, -to_target.z)

		if attack_timer <= 0.0:
			is_attacking = false
			if melee_hitbox:
				melee_hitbox.monitoring = false
			if slash_arc:
				slash_arc.visible = false
			combo_window_timer = 0.55

		move_and_slide()
		_update_locomotion_animation(delta)
		return

	# 7. Read Locomotion Input Vector
	var input_dir = Vector2.ZERO
	if Input.is_action_pressed("move_forward") or Input.is_key_pressed(KEY_W):
		input_dir.y -= 1.0
	if Input.is_action_pressed("move_backward") or Input.is_key_pressed(KEY_S):
		input_dir.y += 1.0
	if Input.is_action_pressed("move_left") or Input.is_key_pressed(KEY_A):
		input_dir.x -= 1.0
	if Input.is_action_pressed("move_right") or Input.is_key_pressed(KEY_D):
		input_dir.x += 1.0

	var joy_x = Input.get_joy_axis(0, JOY_AXIS_LEFT_X)
	var joy_y = Input.get_joy_axis(0, JOY_AXIS_LEFT_Y)
	if abs(joy_x) > 0.15 or abs(joy_y) > 0.15:
		input_dir.x = joy_x
		input_dir.y = joy_y

	if input_dir.length_squared() > 1.0:
		input_dir = input_dir.normalized()

	# 8. Transform Movement Camera-Relative
	var move_dir = Vector3.ZERO
	if input_dir.length_squared() > 0.001:
		var cam_rot_y = camera_arm.rotation.y if camera_arm else 0.0
		var forward = -Vector3(sin(cam_rot_y), 0, cos(cam_rot_y))
		var right = Vector3(cos(cam_rot_y), 0, -sin(cam_rot_y))
		move_dir = (forward * -input_dir.y + right * input_dir.x).normalized()

	# 9. Determine Target Speed
	var sprint_pressed = Input.is_key_pressed(KEY_SHIFT) or (InputMap.has_action("sprint") and Input.is_action_pressed("sprint")) or Input.is_joy_button_pressed(0, JOY_BUTTON_LEFT_STICK)
	var is_sprinting = sprint_pressed and not is_guarding and not is_crouching
	var target_speed = 0.0
	if move_dir.length_squared() > 0.001:
		if is_guarding:
			target_speed = guard_speed
		elif is_crouching:
			target_speed = crouch_speed
		elif is_sprinting:
			target_speed = sprint_speed
		elif input_dir.length() < 0.65:
			target_speed = walk_speed
		else:
			target_speed = jog_speed

	# 10. Horizontal Acceleration / Friction (with air control)
	var current_accel = acceleration if on_floor else air_acceleration
	if move_dir.length_squared() > 0.001:
		velocity.x = move_toward(velocity.x, move_dir.x * target_speed, current_accel * delta)
		velocity.z = move_toward(velocity.z, move_dir.z * target_speed, current_accel * delta)

		# Character Facing
		if is_locked_on and locked_target and is_instance_valid(locked_target):
			# Strafing mode: face locked target continuously
			var to_t = (locked_target.global_position - global_position)
			visual_root.rotation.y = lerp_angle(visual_root.rotation.y, atan2(-to_t.x, -to_t.z), turn_speed * 1.5 * delta)
		elif is_guarding and visual_root:
			# Guard mode: face camera forward
			var cam_rot_y = camera_arm.rotation.y if camera_arm else 0.0
			visual_root.rotation.y = lerp_angle(visual_root.rotation.y, cam_rot_y, turn_speed * delta)
		elif visual_root:
			# Free roam: face direction of movement
			var target_angle = atan2(-move_dir.x, -move_dir.z)
			visual_root.rotation.y = lerp_angle(visual_root.rotation.y, target_angle, turn_speed * delta)
	else:
		if on_floor:
			velocity.x = move_toward(velocity.x, 0.0, friction * delta)
			velocity.z = move_toward(velocity.z, 0.0, friction * delta)

	# 11. Turn-In-Place & Stopping Inertia Detection
	var horiz_speed = Vector2(velocity.x, velocity.z).length()
	if on_floor and not is_attacking and not is_dashing and not is_guarding and stop_transition_timer <= 0.0:
		if horiz_speed < 0.35 and previous_horiz_speed > 6.8 and anim_player and anim_player.has_animation("run_stop"):
			_travel_to("run_stop")
			stop_transition_timer = 0.45
		elif horiz_speed < 0.35 and previous_horiz_speed > 3.2 and anim_player and anim_player.has_animation("walk_stop"):
			_travel_to("walk_stop")
			stop_transition_timer = 0.35
		elif horiz_speed < 0.2 and visual_root:
			var cam_rot_y = camera_arm.rotation.y if camera_arm else visual_root.rotation.y
			var turn_diff = wrapf(cam_rot_y - visual_root.rotation.y, -PI, PI)
			if abs(turn_diff) > deg_to_rad(70.0):
				if turn_diff > deg_to_rad(130.0) or turn_diff < -deg_to_rad(130.0):
					_travel_to("turn_180")
				elif turn_diff > 0:
					_travel_to("turn_left_90")
				else:
					_travel_to("turn_right_90")

	# 12. Dynamic Body Lean & Banking Physics
	_update_body_lean_physics(delta, horiz_speed)

	# 13. Jump Execution (Buffered + Coyote Time)
	if (Input.is_action_just_pressed("jump") or Input.is_key_pressed(KEY_SPACE) or Input.is_joy_button_pressed(0, JOY_BUTTON_A)) and not is_guarding:
		jump_buffer_timer = 0.15

	if jump_buffer_timer > 0.0 and (on_floor or coyote_timer > 0.0) and not is_guarding:
		player_action_performed.emit("jump")
		velocity.y = jump_velocity
		jump_buffer_timer = 0.0
		coyote_timer = 0.0
		was_on_floor = false

	# Variable Jump Height: release button to cut rising arc
	if Input.is_action_just_released("jump") or (Input.is_key_pressed(KEY_SPACE) == false and not on_floor and velocity.y > 2.0):
		velocity.y *= 0.55

	# 14. Execute Kinematics with Slope Floor Snapping & Stair Stepping
	if is_inside_tree():
		move_and_slide()

	# Stair step-up assistance when contacting step risers on floor
	if on_floor and is_on_wall() and move_dir.length_squared() > 0.01:
		_handle_stair_step_up(move_dir, delta)

	# Ground conformance & foot planting on slopes and steps
	_update_ground_conformance(delta)

	# 15. Footstep Phase Contact Tracking
	_update_footstep_audio(delta, on_floor, horiz_speed)

	# 16. Update Animation State Machine & Blend Spaces
	_update_locomotion_animation(delta)

	# Cache current horizontal speed for deceleration stop transitions
	previous_horiz_speed = horiz_speed

	# Locomotion tutorial tracking
	if horiz_speed > 0.4:
		if is_sprinting and horiz_speed > 6.0:
			player_action_performed.emit("sprint")
		else:
			player_action_performed.emit("move")

	# 17. Prana (Energy) System & Dynamic Regeneration
	var is_sprinting_now = (Input.is_key_pressed(KEY_SHIFT) or (InputMap.has_action("sprint") and Input.is_action_pressed("sprint"))) and not is_guarding
	if is_sprinting_now and horiz_speed > 0.5:
		prana = max(0.0, prana - 15.0 * delta)
	elif not is_dashing and not is_attacking:
		prana = min(max_prana, prana + prana_regen * delta)
	prana_changed.emit(prana, max_prana)

	# 18. Contextual Interaction Prompt Detection
	var nearby_prompt = get_nearby_interactable_prompt()
	if nearby_prompt != active_prompt_cache:
		active_prompt_cache = nearby_prompt
		nearby_prompt_changed.emit(active_prompt_cache)

## Ground conformance: adjusts visual root height and slope alignment so feet remain firmly planted
func _update_ground_conformance(delta: float) -> void:
	if not visual_root or not is_inside_tree():
		return

	if not is_on_floor():
		visual_root.position.y = lerp(visual_root.position.y, 0.0, 10.0 * delta)
		slope_alignment_pitch = lerp_angle(slope_alignment_pitch, 0.0, 8.0 * delta)
		return

	var world_3d = get_world_3d()
	if not world_3d:
		return
	var space = world_3d.direct_space_state
	if not space:
		return

	var left_origin = global_position + visual_root.transform.basis.x * -0.20 + Vector3(0.0, 0.5, 0.0)
	var right_origin = global_position + visual_root.transform.basis.x * 0.20 + Vector3(0.0, 0.5, 0.0)
	var ray_down = Vector3(0.0, -1.0, 0.0)

	var q_l = PhysicsRayQueryParameters3D.create(left_origin, left_origin + ray_down, 1)
	q_l.exclude = [get_rid()]
	var hit_l = space.intersect_ray(q_l)

	var q_r = PhysicsRayQueryParameters3D.create(right_origin, right_origin + ray_down, 1)
	q_r.exclude = [get_rid()]
	var hit_r = space.intersect_ray(q_r)

	var target_y_offset = 0.0
	if not hit_l.is_empty() and not hit_r.is_empty():
		var l_dist = left_origin.y - hit_l.position.y
		var r_dist = right_origin.y - hit_r.position.y
		var avg_dist = (l_dist + r_dist) * 0.5
		target_y_offset = clamp(0.5 - avg_dist, -0.15, 0.15)
	elif not hit_l.is_empty():
		target_y_offset = clamp(0.5 - (left_origin.y - hit_l.position.y), -0.15, 0.15)
	elif not hit_r.is_empty():
		target_y_offset = clamp(0.5 - (right_origin.y - hit_r.position.y), -0.15, 0.15)

	# Calculate slope pitch alignment based on floor normal
	var floor_n = get_floor_normal()
	if floor_n.dot(Vector3.UP) < 0.99 and velocity.length_squared() > 0.1:
		var forward_h = -Vector3(visual_root.transform.basis.z.x, 0, visual_root.transform.basis.z.z).normalized()
		var slope_grade = floor_n.dot(forward_h)
		slope_alignment_pitch = clamp(-slope_grade * 0.25, -0.22, 0.22)
	else:
		slope_alignment_pitch = lerp_angle(slope_alignment_pitch, 0.0, 6.0 * delta)

	visual_root.position.y = lerp(visual_root.position.y, target_y_offset, 14.0 * delta)

## Dynamic body lean: roll banking into turns and pitch lean during acceleration
func _update_body_lean_physics(delta: float, horiz_speed: float) -> void:
	if not visual_root:
		return

	var current_yaw = visual_root.rotation.y
	var yaw_diff = wrapf(current_yaw - previous_yaw, -PI, PI)
	previous_yaw = current_yaw
	var yaw_rate = yaw_diff / max(0.0001, delta)

	# Bank roll into turns (proportional to yaw rate and speed)
	var speed_ratio = clamp(horiz_speed / sprint_speed, 0.0, 1.0)
	var target_bank_roll = -clamp(yaw_rate * 0.075, -0.16, 0.16) * speed_ratio
	visual_root.rotation.z = lerp_angle(visual_root.rotation.z, target_bank_roll, 10.0 * delta)

	# Forward athletic pitch lean based on speed + slope grade
	var target_forward_pitch = clamp((horiz_speed / sprint_speed) * 0.08, 0.0, 0.11) + slope_alignment_pitch
	visual_root.rotation.x = lerp_angle(visual_root.rotation.x, target_forward_pitch, 8.0 * delta)

## Physically tests step risers up to 0.38m to step over stair edges cleanly
func _handle_stair_step_up(move_dir: Vector3, delta: float) -> void:
	var max_step_height: float = 0.38
	var probe_speed: float = max(walk_speed, Vector2(velocity.x, velocity.z).length())
	var step_distance: float = clamp(probe_speed * delta * 2.5, 0.20, 0.40)
	
	# 1. Test vertical head clearance overhead before stepping up
	var up_disp = Vector3(0.0, max_step_height, 0.0)
	if test_move(global_transform, up_disp, null, safe_margin):
		return # Overhead obstruction (low doorway or ceiling)
	
	# 2. Test forward displacement at elevated height
	var elevated_trans = global_transform.translated(up_disp)
	var fwd_disp = move_dir.normalized() * step_distance
	if test_move(elevated_trans, fwd_disp, null, safe_margin):
		return # Blocked forward at step height - this is a high solid wall, not a step
	
	# 3. Test downwards to detect step tread surface
	var target_top_trans = elevated_trans.translated(fwd_disp)
	var down_col = KinematicCollision3D.new()
	var test_down = Vector3(0.0, -max_step_height * 1.25, 0.0)
	if test_move(target_top_trans, test_down, down_col, safe_margin):
		var normal = down_col.get_normal()
		if normal.dot(Vector3.UP) >= 0.65:
			# In Godot 4, downward travel is negative
			var traveled_down = abs(down_col.get_travel().y)
			var step_up_amount = max_step_height - traveled_down
			if step_up_amount > 0.02 and step_up_amount <= max_step_height:
				# Validate candidate position on top of the step tread
				var target_trans = global_transform.translated(Vector3(0.0, step_up_amount + 0.02, 0.0) + fwd_disp * 0.5)
				if not test_move(target_trans, Vector3.ZERO, null, safe_margin):
					global_position = target_trans.origin
					is_on_stairs = true
					stair_direction = 1
					stair_timer = 0.35

## Gait stride tracking for footstep contact timing and 3D audio triggering
func _update_footstep_audio(delta: float, on_floor: bool, horiz_speed: float) -> void:
	if on_floor and horiz_speed > 0.35:
		var stride_length = 1.5
		if horiz_speed > 8.5:
			stride_length = 2.8 # Sprint
		elif horiz_speed > 5.0:
			stride_length = 2.2 # Jog

		gait_cycle_phase += (horiz_speed / stride_length) * delta
		if gait_cycle_phase >= 1.0:
			gait_cycle_phase -= 1.0
			_emit_footstep(0) # Left foot strike
		elif gait_cycle_phase >= 0.5 and last_footstep_phase < 0.5:
			_emit_footstep(1) # Right foot strike

		last_footstep_phase = gait_cycle_phase
	else:
		gait_cycle_phase = 0.0
		last_footstep_phase = 0.0

func _emit_footstep(foot_index: int) -> void:
	var contact_pos = global_position
	if visual_root:
		var lateral_offset = -0.22 if foot_index == 0 else 0.22
		contact_pos += visual_root.transform.basis.x * lateral_offset

	footstep_contact.emit(foot_index, contact_pos, "stone")
	AudioManager3D.play_3d("footstep_stone", contact_pos, randf_range(0.96, 1.06))

func _unhandled_input(event: InputEvent) -> void:
	# Prana Dash / Dodge / Roll Trigger
	if event.is_action_pressed("dash") or (event is InputEventJoypadButton and event.button_index == JOY_BUTTON_B and event.pressed):
		if is_dashing and dash_timer < 0.14:
			_trigger_roll()
		else:
			_trigger_dash()

	# Melee Attack Trigger
	if (event.is_action_pressed("attack") or (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT) or (event is InputEventJoypadButton and event.button_index == JOY_BUTTON_X and event.pressed)) and not is_guarding:
		_trigger_attack()

	# Interact Trigger
	if event.is_action_pressed("interact") or (event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_E) or (event is InputEventJoypadButton and event.button_index == JOY_BUTTON_Y and event.pressed):
		_trigger_interaction()

	# Parry Trigger
	if (event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_F) or (event is InputEventJoypadButton and event.button_index == JOY_BUTTON_RIGHT_SHOULDER and event.pressed):
		_trigger_parry()

	# Harpoon Grapple Trigger
	if (event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_G) or (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_MIDDLE):
		_trigger_grapple()

func apply_updraft(force: float) -> void:
	if not is_on_floor():
		velocity.y = min(12.0, velocity.y + force)
		is_gliding = true

func apply_vortex_pull(pull_vec: Vector3) -> void:
	velocity += pull_vec

func apply_bounce_impulse(force: float) -> void:
	velocity.y = max(velocity.y, force)
	is_gliding = false

func _trigger_grapple() -> void:
	if is_grappling:
		return
	var anchors = get_tree().get_nodes_in_group("grapple_anchors") if is_inside_tree() else []
	var best_anchor: Node3D = null
	var min_dist = 28.0
	for a in anchors:
		if is_instance_valid(a):
			var d = global_position.distance_to(a.global_position)
			if d < min_dist:
				min_dist = d
				best_anchor = a
	if best_anchor:
		is_grappling = true
		grapple_target_pos = best_anchor.get_pull_target_position() if best_anchor.has_method("get_pull_target_position") else best_anchor.global_position

func _trigger_dash() -> void:
	if is_dashing or dash_cooldown_timer > 0.0:
		return
	player_action_performed.emit("dash")
	is_dashing = true
	dash_timer = dash_duration
	dash_cooldown_timer = dash_cooldown
	prana = max(0.0, prana - 20.0)
	prana_changed.emit(prana, max_prana)
	AudioManager3D.play("dash_whoosh")

	var horiz_vel = Vector3(velocity.x, 0, velocity.z)
	if horiz_vel.length() > 0.5:
		dash_direction = horiz_vel.normalized()
	else:
		dash_direction = -visual_root.global_transform.basis.z.normalized()

func _trigger_roll() -> void:
	if is_rolling:
		return
	is_rolling = true
	roll_timer = 0.36
	_travel_to("roll")
	player_action_performed.emit("roll")
	AudioManager3D.play("dash_whoosh", 0.9)

func _trigger_attack() -> void:
	if is_dashing:
		return
	if is_attacking:
		if attack_timer > 0.18:
			return # Still in active swing
		# In recovery window: allow chaining into next combo strike

	player_action_performed.emit("attack")
	is_attacking = true
	hit_enemies.clear()
	combo_index += 1
	if combo_index > 3:
		combo_index = 1

	AudioManager3D.play("sword_slash", 1.0 + (combo_index - 1) * 0.15)

	if combo_index == 1:
		attack_duration = 0.35
	elif combo_index == 2:
		attack_duration = 0.38
	else:
		attack_duration = 0.50

	attack_timer = attack_duration

func _trigger_parry() -> void:
	parry_window_timer = parry_duration
	AudioManager3D.play("parry_clink")
	_travel_to("parry")

func _trigger_interaction() -> void:
	player_action_performed.emit("interact")
	_travel_to("interact")

	if interact_raycast and interact_raycast.is_colliding():
		var col = interact_raycast.get_collider()
		var candidate = col if (col and col.has_method("interact")) else (col.get_parent() if col else null)
		if candidate and candidate.has_method("interact") and _can_interact_with(candidate):
			candidate.interact(self)
			interacted_with.emit(candidate.name)
			interaction_requested.emit(candidate.name)
			return

	if interact_detector:
		var overlapping_areas = interact_detector.get_overlapping_areas()
		for area in overlapping_areas:
			if not is_instance_valid(area):
				continue
			var target_node = area if area.has_method("interact") else area.get_parent()
			if target_node and target_node.has_method("interact") and _can_interact_with(target_node):
				target_node.interact(self)
				interacted_with.emit(target_node.name)
				interaction_requested.emit(target_node.name)
				return

func get_nearby_interactable_prompt() -> String:
	if interact_raycast and interact_raycast.is_colliding():
		var col = interact_raycast.get_collider()
		var candidate = col if (col and col.has_method("interact")) else (col.get_parent() if col else null)
		if candidate and candidate.has_method("interact") and _can_interact_with(candidate):
			return _format_prompt(candidate.name)
	if interact_detector:
		var overlapping_areas = interact_detector.get_overlapping_areas()
		for area in overlapping_areas:
			if is_instance_valid(area):
				var target_node = area if area.has_method("interact") else area.get_parent()
				if target_node and target_node.has_method("interact") and _can_interact_with(target_node):
					return _format_prompt(target_node.name)
	return ""

## Validates unobstructed line of sight and orientation toward interactable target
func _can_interact_with(target: Node3D) -> bool:
	if not target or not is_instance_valid(target):
		return false
	
	var p_pos: Vector3 = global_position + Vector3(0.0, 1.1, 0.0)
	var t_pos: Vector3 = target.global_position if target.is_inside_tree() else target.position
	t_pos += Vector3(0.0, 0.6, 0.0)
	
	# Distance check (max 3.2m)
	var dist = p_pos.distance_to(t_pos)
	if dist > 3.2:
		# print("DEBUG _can_interact_with: dist > 3.2: ", dist)
		return false
	
	# Orientation check: Target must be in front of player (within 160 degree forward arc)
	var forward: Vector3 = -visual_root.global_transform.basis.z.normalized() if (visual_root and visual_root.is_inside_tree()) else -global_transform.basis.z.normalized()
	var to_t: Vector3 = (t_pos - p_pos).normalized()
	if forward.dot(to_t) < -0.15:
		# print("DEBUG _can_interact_with: dot < -0.15: ", forward.dot(to_t))
		return false
	
	# Physics line of sight check against Environment Layer 1
	if is_inside_tree():
		var world_3d = get_world_3d()
		if world_3d:
			var space = world_3d.direct_space_state
			if space:
				var ray_query = PhysicsRayQueryParameters3D.create(p_pos, t_pos, 1) # Layer 1: Environment
				ray_query.exclude = [get_rid()]
				var hit = space.intersect_ray(ray_query)
				if not hit.is_empty():
					var hit_col = hit.collider
					# If the ray hit the target itself or a child of target, line of sight is clear!
					if hit_col == target or hit_col.get_parent() == target or target.is_ancestor_of(hit_col) or (target.get_parent() and hit_col == target.get_parent()):
						return true
					return false
	
	return true

func _format_prompt(raw_name: String) -> String:
	var n = raw_name.to_lower()
	if "devi" in n or "tara" in n or "oracle" in n:
		return "[ E ] Commune with Devi Tara"
	elif "shard" in n or "astra" in n:
		return "[ E ] Purify Solar Astra Shard"
	elif "shrine" in n or "altar" in n or "peetham" in n:
		return "[ E ] Attune Checkpoint Altar"
	elif "portal" in n or "gate" in n:
		return "[ E ] Ascend through Cosmic Gateway"
	elif "chest" in n or "relic" in n:
		return "[ E ] Open Sacred Reliquary"
	else:
		return "[ E ] Interact"

func _on_melee_hitbox_area_entered(area: Area3D) -> void:
	var target = area.get_parent() if area.get_parent() else area
	_handle_melee_hit(target)

func _on_melee_hitbox_body_entered(body: Node3D) -> void:
	_handle_melee_hit(body)

func _handle_melee_hit(target: Node3D) -> void:
	if not is_attacking or not target:
		return

	if target in hit_enemies or target == self:
		return

	# Line of sight check against Environment Layer 1: attacks cannot pass through solid walls/pillars
	if is_inside_tree():
		var world_3d = get_world_3d()
		if world_3d:
			var space = world_3d.direct_space_state
			if space:
				var p_origin = global_position + Vector3(0.0, 1.1, 0.0)
				var t_target = target.global_position if target.is_inside_tree() else target.position
				t_target += Vector3(0.0, 0.9, 0.0)
				var ray = PhysicsRayQueryParameters3D.create(p_origin, t_target, 1) # Layer 1: Environment
				ray.exclude = [get_rid()]
				var hit = space.intersect_ray(ray)
				if not hit.is_empty():
					var hit_col = hit.collider
					if hit_col != target and hit_col.get_parent() != target and not target.is_ancestor_of(hit_col) and (target.get_parent() and hit_col != target.get_parent()):
						return # Obstructed by solid obstacle

	hit_enemies.append(target)
	var dmg = attack_damage_base
	var poise_dmg = 30.0

	if combo_index == 2:
		dmg = int(attack_damage_base * 1.4)
		poise_dmg = 45.0
	elif combo_index == 3:
		dmg = int(attack_damage_base * 2.4)
		poise_dmg = 75.0
		if camera_arm and camera_arm.has_method("add_trauma"):
			camera_arm.add_trauma(0.35)

	# Trigger crunchy hit-stop freeze frame
	_trigger_hit_stop(0.06)

	var p_pos_melee = global_position if is_inside_tree() else position
	var attack_spec = CombatMath.AttackSpec.new("veer", dmg, poise_dmg, p_pos_melee)
	if target.has_method("take_damage_spec"):
		var res = target.take_damage_spec(attack_spec)
		attack_hit.emit(target, res.damage_dealt, res.is_critical)
	elif target.has_method("take_damage"):
		target.take_damage(dmg)
		attack_hit.emit(target, dmg, false)

func _trigger_hit_stop(duration: float = 0.06) -> void:
	hit_stop_timer = duration

func _setup_slash_arc() -> void:
	if not visual_root or slash_arc:
		return
	slash_arc = MeshInstance3D.new()
	slash_arc.name = "SlashArcEffect"
	var torus = TorusMesh.new()
	torus.inner_radius = 0.95
	torus.outer_radius = 1.35
	torus.rings = 16
	torus.ring_segments = 16
	slash_arc.mesh = torus
	var mat = StandardMaterial3D.new()
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.albedo_color = Color(1.0, 0.75, 0.2, 0.6)
	mat.emission_enabled = true
	mat.emission = Color(1.0, 0.55, 0.1)
	mat.emission_energy_multiplier = 4.0
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	slash_arc.material_override = mat
	slash_arc.transform = Transform3D(Basis().scaled(Vector3(1.0, 0.08, 1.0)), Vector3(0, 1.1, -0.6))
	slash_arc.visible = false
	visual_root.add_child(slash_arc)

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	# Dodge Invulnerability Frames (i-frames during Prana Dash)
	if is_dashing:
		var dodge_res = CombatMath.CombatHitResult.new()
		dodge_res.damage_dealt = 0
		dodge_res.poise_damage_dealt = 0.0
		dodge_res.was_parried = false
		dodge_res.was_blocked = false
		return dodge_res

	var p_pos = global_position if is_inside_tree() else position
	var p_facing = -visual_root.global_transform.basis.z if (visual_root and visual_root.is_inside_tree()) else Vector3.FORWARD
	var def_spec = CombatMath.DefenseSpec.new("veer", p_pos, p_facing)
	def_spec.is_guarding = is_guarding
	def_spec.parry_window_timer = parry_window_timer

	var result = CombatMath.resolve_attack(attack_spec, def_spec)

	if result.was_parried:
		_travel_to("parry")
		AudioManager3D.play("parry_clink", 1.2)
		if camera_arm and camera_arm.has_method("add_trauma"):
			camera_arm.add_trauma(0.22)
		_trigger_hit_stop(0.08)
	elif result.was_blocked:
		health = max(0, health - result.damage_dealt)
		health_changed.emit(health, max_health)
		if result.poise_damage_dealt > 40.0:
			_travel_to("recoil")
		else:
			_travel_to("block")
		AudioManager3D.play("hit_impact", 1.1)
	else:
		health = max(0, health - result.damage_dealt)
		health_changed.emit(health, max_health)
		_travel_to("hit_reaction")
		if camera_arm and camera_arm.has_method("add_trauma"):
			var trauma_amount = 0.55 if result.damage_dealt >= 30 else 0.25
			camera_arm.add_trauma(trauma_amount)

	return result

func take_damage(amount: int) -> void:
	if is_dashing:
		return
	health = max(0, health - amount)
	health_changed.emit(health, max_health)
	_travel_to("hit_reaction")

func add_shard(amount: int = 1) -> void:
	shards_collected += amount
	shards_changed.emit(shards_collected)

## Synchronize 3D locomotion animation with actual displacement speed to prevent sliding
func _update_locomotion_animation(delta: float) -> void:
	var horiz_vel = Vector3(velocity.x, 0.0, velocity.z)
	var horiz_speed = horiz_vel.length()

	# Dynamic speed-to-stride cadence scaling to eliminate foot sliding
	if anim_player:
		if current_state == "Locomotion":
			if horiz_speed > 8.5:
				anim_player.speed_scale = clamp(horiz_speed / sprint_speed, 0.85, 1.35)
			elif horiz_speed > 5.0:
				anim_player.speed_scale = clamp(horiz_speed / jog_speed, 0.80, 1.30)
			elif horiz_speed > 0.35:
				anim_player.speed_scale = clamp(horiz_speed / walk_speed, 0.70, 1.30)
			else:
				anim_player.speed_scale = 1.0
		else:
			anim_player.speed_scale = 1.0

	# Compute local character-relative velocity for 2D blend space
	var local_x = 0.0
	var local_z = 0.0
	if visual_root and horiz_speed > 0.05:
		var forward_dir = -visual_root.transform.basis.z.normalized()
		var right_dir = visual_root.transform.basis.x.normalized()
		local_z = horiz_vel.dot(forward_dir)
		local_x = horiz_vel.dot(right_dir)
	elif horiz_speed > 0.05:
		local_z = horiz_speed

	# Update 2D Locomotion Blend Space parameter
	if anim_tree and anim_tree.active:
		anim_tree.set("parameters/Locomotion/blend_position", Vector2(local_x, local_z))

	# Priority 1: Dash (Dodge) & Roll
	if is_rolling:
		_travel_to("roll")
		locomotion_state_changed.emit("Roll", horiz_speed)
		return
	if is_dashing:
		_travel_to("dodge")
		locomotion_state_changed.emit("Dodge", dash_speed)
		return

	# Priority 2: Attack
	if is_attacking:
		var atk_anim = "attack_light_1"
		if combo_index == 2:
			atk_anim = "attack_light_2"
		elif combo_index == 3:
			atk_anim = "attack_heavy_finisher"
		_travel_to(atk_anim)
		locomotion_state_changed.emit("Attack" + str(combo_index), horiz_speed)
		return

	# Priority 3: Guard Block
	if is_guarding:
		_travel_to("block")
		locomotion_state_changed.emit("Block", horiz_speed)
		return

	# Priority 4: Airborne (Jump, Fall & Gliding)
	var is_airborne = not is_on_floor() if is_inside_tree() else false
	if is_airborne:
		if is_gliding:
			_travel_to("fall")
			locomotion_state_changed.emit("Glide", horiz_speed)
		elif velocity.y > 0.5:
			_travel_to("jump")
			locomotion_state_changed.emit("Jump", velocity.y)
		else:
			_travel_to("fall")
			locomotion_state_changed.emit("Fall", velocity.y)
		return

	# Priority 5: Landing Impact Recovery
	if landing_timer > 0.0 and horiz_speed < 1.0:
		_travel_to("landing")
		locomotion_state_changed.emit("Land", horiz_speed)
		return

	# Priority 5b: Stopping Inertia Deceleration Step
	if stop_transition_timer > 0.0:
		return

	# Priority 6: Crouch Movement
	if is_crouching:
		if horiz_speed < 0.2:
			_travel_to("crouch_idle")
			locomotion_state_changed.emit("CrouchIdle", 0.0)
		else:
			_travel_to("crouch_walk")
			locomotion_state_changed.emit("CrouchWalk", horiz_speed)
		return

	# Priority 7: Stair Traversal
	if is_on_stairs and horiz_speed > 0.3:
		if stair_direction > 0:
			_travel_to("stair_ascent")
			locomotion_state_changed.emit("StairAscent", horiz_speed)
		else:
			_travel_to("stair_descent")
			locomotion_state_changed.emit("StairDescent", horiz_speed)
		return

	# Priority 8: Ground Locomotion via BlendSpace2D
	if horiz_speed < 0.2:
		if combo_window_timer > 0.0 or parry_window_timer > 0.0:
			_travel_to("idle_alert")
			locomotion_state_changed.emit("Alert", 0.0)
			return
		_travel_to("Locomotion")
		locomotion_state_changed.emit("Idle", 0.0)
	elif horiz_speed <= 5.0:
		_travel_to("Locomotion")
		locomotion_state_changed.emit("Walk", horiz_speed)
	elif horiz_speed <= 8.5:
		_travel_to("Locomotion")
		locomotion_state_changed.emit("Run", horiz_speed)
	else:
		_travel_to("Locomotion")
		locomotion_state_changed.emit("Sprint", horiz_speed)

## Travel to target state via AnimationTree state machine or fallback to AnimationPlayer
func _travel_to(state_name: String) -> void:
	if current_state != state_name:
		current_state = state_name
		animation_state_entered.emit(state_name)

	if anim_playback:
		anim_playback.travel(state_name)
	elif anim_player:
		_play_anim(state_name, 0.14, 1.0)

## Fallback animation playback directly on AnimationPlayer
func _play_anim(anim_name: String, blend_time: float = 0.14, speed_scale: float = 1.0) -> void:
	if not anim_player:
		return

	var candidates = [anim_name]
	if anim_name == "jump_fall":
		candidates.append("fall")
	elif anim_name == "fall":
		candidates.append("jump_fall")
	elif anim_name == "jump_land":
		candidates.append("landing")
	elif anim_name == "landing":
		candidates.append("jump_land")
	elif anim_name == "jog":
		candidates.append("run")
	elif anim_name == "run":
		candidates.append("jog")

	var actual_name = ""
	for c in candidates:
		for a in anim_player.get_animation_list():
			if a == c or a.ends_with("/" + c) or a.ends_with(c):
				actual_name = a
				break
		if not actual_name.is_empty():
			break

	if actual_name.is_empty():
		return

	if current_anim != actual_name or not anim_player.is_playing():
		current_anim = actual_name
		anim_player.play(actual_name, blend_time, speed_scale)
	else:
		anim_player.speed_scale = speed_scale

func _find_animation_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	for child in node.get_children():
		var ap = _find_animation_player(child)
		if ap:
			return ap
	return null

func _find_skeleton(node: Node) -> Skeleton3D:
	if node is Skeleton3D:
		return node
	for child in node.get_children():
		var s = _find_skeleton(child)
		if s:
			return s
	return null

func notify_action_performed(action: String) -> void:
	player_action_performed.emit(action)
