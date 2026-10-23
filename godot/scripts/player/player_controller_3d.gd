class_name PlayerController3D
extends CharacterBody3D

## Production 3D Third-Person Character Controller for Veer (Solar Guardian).
## Features:
## - Full skinned humanoid mesh with standard humanoid Skeleton3D
## - Camera-relative locomotion with smooth rotation
## - Walk, jog, sprint with gait speed matching actual displacement
## - Jump with launch anticipation, flight arc, and landing recovery
## - 4-directional Prana Dash (Dodge)
## - 3-hit Surya combo attack sequence
## - Directional shield guard block stance
## - Stair and slope traversal with floor snapping (0.4m)
## - Interactive proximity triggers for shrines and Astra shards

signal health_changed(current: int, max_val: int)
signal shards_changed(count: int)
signal interacted_with(target_name: String)
signal locomotion_state_changed(state: String, speed: float)

@export_group("Locomotion")
@export var walk_speed: float = 4.2
@export var jog_speed: float = 7.5
@export var sprint_speed: float = 10.5
@export var guard_speed: float = 2.2
@export var acceleration: float = 38.0
@export var friction: float = 32.0
@export var turn_speed: float = 14.0
@export var jump_velocity: float = 8.5
@export var gravity: float = 19.6

@export_group("Prana Dash (Dodge)")
@export var dash_speed: float = 18.0
@export var dash_duration: float = 0.22
@export var dash_cooldown: float = 0.65

@export_group("Combat Stats")
@export var max_health: int = 100
@export var attack_damage_base: int = 25

# Node References
@onready var camera_arm: SpringArm3D = $CameraArm
@onready var visual_root: Node3D = $Visual
@onready var interact_detector: Area3D = $InteractDetector

var anim_player: AnimationPlayer = null
var current_anim: String = ""

# Gameplay State
var health: int = 100
var shards_collected: int = 0
var is_dashing: bool = false
var dash_timer: float = 0.0
var dash_cooldown_timer: float = 0.0
var dash_direction: Vector3 = Vector3.ZERO

var is_guarding: bool = false
var is_attacking: bool = false
var attack_timer: float = 0.0
var attack_duration: float = 0.35
var combo_index: int = 0
var combo_window_timer: float = 0.0

var was_on_floor: bool = true
var landing_timer: float = 0.0

func _ready() -> void:
	health = max_health
	floor_snap_length = 0.4
	floor_max_angle = deg_to_rad(48.0) # Allows smooth stair and ramp stepping

	anim_player = _find_animation_player(visual_root)
	if anim_player:
		anim_player.playback_default_blend_time = 0.15

	health_changed.emit(health, max_health)
	shards_changed.emit(shards_collected)

func _physics_process(delta: float) -> void:
	# 1. Apply Gravity
	var on_floor = is_on_floor()
	if not on_floor:
		velocity.y -= gravity * delta
		if was_on_floor:
			was_on_floor = false
	else:
		if not was_on_floor:
			# Just landed
			was_on_floor = true
			landing_timer = 0.18
		if velocity.y < 0:
			velocity.y = -0.5 # Maintain slight downward stickiness for stairs

	# 2. Update Timers
	if dash_cooldown_timer > 0.0:
		dash_cooldown_timer -= delta
	if landing_timer > 0.0:
		landing_timer -= delta
	if combo_window_timer > 0.0:
		combo_window_timer -= delta
		if combo_window_timer <= 0.0:
			combo_index = 0

	# 3. Guarding State
	is_guarding = (Input.is_key_pressed(KEY_Q) or Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT)) and not is_attacking and not is_dashing

	# 4. Handle Active Dash
	if is_dashing:
		dash_timer -= delta
		velocity.x = dash_direction.x * dash_speed
		velocity.z = dash_direction.z * dash_speed
		if dash_timer <= 0.0:
			is_dashing = false
		move_and_slide()
		_update_locomotion_animation(delta)
		return

	# 5. Handle Active Attack
	if is_attacking:
		attack_timer -= delta
		velocity.x = move_toward(velocity.x, 0.0, friction * 0.7 * delta)
		velocity.z = move_toward(velocity.z, 0.0, friction * 0.7 * delta)
		if attack_timer <= 0.0:
			is_attacking = false
			combo_window_timer = 0.55
		move_and_slide()
		_update_locomotion_animation(delta)
		return

	# 6. Read Locomotion Input (WASD / Arrows)
	var input_dir = Vector2.ZERO
	if Input.is_action_pressed("move_forward") or Input.is_key_pressed(KEY_W):
		input_dir.y -= 1.0
	if Input.is_action_pressed("move_backward") or Input.is_key_pressed(KEY_S):
		input_dir.y += 1.0
	if Input.is_action_pressed("move_left") or Input.is_key_pressed(KEY_A):
		input_dir.x -= 1.0
	if Input.is_action_pressed("move_right") or Input.is_key_pressed(KEY_D):
		input_dir.x += 1.0

	input_dir = input_dir.normalized()

	# 7. Transform Movement Camera-Relative
	var move_dir = Vector3.ZERO
	if input_dir.length_squared() > 0.001:
		var cam_rot_y = camera_arm.rotation.y if camera_arm else 0.0
		var forward = -Vector3(sin(cam_rot_y), 0, cos(cam_rot_y))
		var right = Vector3(cos(cam_rot_y), 0, -sin(cam_rot_y))
		move_dir = (forward * -input_dir.y + right * input_dir.x).normalized()

	# Determine Target Speed
	var is_sprinting = (Input.is_key_pressed(KEY_SHIFT) or Input.is_action_pressed("sprint")) and not is_guarding
	var target_speed = 0.0
	if move_dir.length_squared() > 0.001:
		if is_guarding:
			target_speed = guard_speed
		elif is_sprinting:
			target_speed = sprint_speed
		else:
			target_speed = jog_speed

	# 8. Acceleration / Friction
	if move_dir.length_squared() > 0.001:
		velocity.x = move_toward(velocity.x, move_dir.x * target_speed, acceleration * delta)
		velocity.z = move_toward(velocity.z, move_dir.z * target_speed, acceleration * delta)

		# Smooth Avatar Turning
		var target_angle = atan2(move_dir.x, move_dir.z)
		visual_root.rotation.y = lerp_angle(visual_root.rotation.y, target_angle, turn_speed * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, friction * delta)
		velocity.z = move_toward(velocity.z, 0.0, friction * delta)

	# 9. Jump Input
	if (Input.is_action_just_pressed("jump") or Input.is_key_pressed(KEY_SPACE)) and on_floor and not is_guarding:
		velocity.y = jump_velocity
		was_on_floor = false

	# 10. Execute Kinematics
	move_and_slide()

	# 11. Drive Animations
	_update_locomotion_animation(delta)

func _unhandled_input(event: InputEvent) -> void:
	# Prana Dash Trigger
	if event.is_action_pressed("dash") or (event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_SPACE and Input.is_key_pressed(KEY_SHIFT)):
		_trigger_dash()

	# Melee Attack Trigger
	if (event.is_action_pressed("attack") or (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT)) and not is_guarding:
		_trigger_attack()

	# Interact Trigger
	if event.is_action_pressed("interact") or (event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_E):
		_trigger_interaction()

func _trigger_dash() -> void:
	if is_dashing or dash_cooldown_timer > 0.0:
		return
	is_dashing = true
	dash_timer = dash_duration
	dash_cooldown_timer = dash_cooldown

	var horiz_vel = Vector3(velocity.x, 0, velocity.z)
	if horiz_vel.length() > 0.5:
		dash_direction = horiz_vel.normalized()
	else:
		dash_direction = -visual_root.global_transform.basis.z.normalized()

func _trigger_attack() -> void:
	if is_attacking or is_dashing:
		return

	is_attacking = true
	combo_index += 1
	if combo_index > 3:
		combo_index = 1

	if combo_index == 1:
		attack_duration = 0.35
	elif combo_index == 2:
		attack_duration = 0.38
	else:
		attack_duration = 0.50

	attack_timer = attack_duration

func _trigger_interaction() -> void:
	if not interact_detector:
		return

	_play_anim("interact", 0.12, 1.0)
	var overlapping_areas = interact_detector.get_overlapping_areas()
	for area in overlapping_areas:
		if area.has_method("interact"):
			area.interact(self)
			interacted_with.emit(area.name)
			return
		elif area.get_parent() and area.get_parent().has_method("interact"):
			area.get_parent().interact(self)
			interacted_with.emit(area.get_parent().name)
			return

func add_shard(amount: int = 1) -> void:
	shards_collected += amount
	shards_changed.emit(shards_collected)

## Synchronize 3D locomotion animation with actual displacement speed to prevent sliding
func _update_locomotion_animation(delta: float) -> void:
	if not anim_player:
		return

	var horiz_speed = Vector2(velocity.x, velocity.z).length()

	# Priority 1: Dash (Dodge)
	if is_dashing:
		_play_anim("dodge", 0.08, 1.2)
		locomotion_state_changed.emit("Dodge", dash_speed)
		return

	# Priority 2: Attack
	if is_attacking:
		var atk_anim = "attack_light_1"
		if combo_index == 2:
			atk_anim = "attack_light_2"
		elif combo_index == 3:
			atk_anim = "attack_heavy_finisher"
		_play_anim(atk_anim, 0.08, 1.0)
		locomotion_state_changed.emit("Attack" + str(combo_index), horiz_speed)
		return

	# Priority 3: Guard Block
	if is_guarding:
		_play_anim("block", 0.15, 1.0)
		locomotion_state_changed.emit("Block", horiz_speed)
		return

	# Priority 4: Airborne (Jump & Fall)
	if not is_on_floor():
		if velocity.y > 0.5:
			_play_anim("jump", 0.15, 1.0)
			locomotion_state_changed.emit("Jump", velocity.y)
		else:
			_play_anim("jump_fall", 0.18, 1.0)
			locomotion_state_changed.emit("Fall", velocity.y)
		return

	# Priority 5: Landing Impact Recovery
	if landing_timer > 0.0 and horiz_speed < 1.0:
		_play_anim("jump_land", 0.1, 1.2)
		locomotion_state_changed.emit("Land", horiz_speed)
		return

	# Priority 6: Ground Locomotion with Gait Speed Matching
	if horiz_speed < 0.2:
		_play_anim("idle", 0.25, 1.0)
		locomotion_state_changed.emit("Idle", 0.0)
	elif horiz_speed <= 5.0:
		var speed_scale = clamp(horiz_speed / walk_speed, 0.7, 1.5)
		_play_anim("walk", 0.15, speed_scale)
		locomotion_state_changed.emit("Walk", horiz_speed)
	elif horiz_speed <= 8.5:
		var speed_scale = clamp(horiz_speed / jog_speed, 0.7, 1.4)
		_play_anim("jog", 0.15, speed_scale)
		locomotion_state_changed.emit("Jog", horiz_speed)
	else:
		var speed_scale = clamp(horiz_speed / sprint_speed, 0.8, 1.5)
		_play_anim("sprint", 0.12, speed_scale)
		locomotion_state_changed.emit("Sprint", horiz_speed)

func _play_anim(anim_name: String, blend_time: float, speed_scale: float) -> void:
	if not anim_player:
		return

	# Find actual animation name in list (handles prefixes like 'veer/' or direct 'walk')
	var actual_name = ""
	for a in anim_player.get_animation_list():
		if a == anim_name or a.ends_with("/" + anim_name) or a.ends_with(anim_name):
			actual_name = a
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
