class_name PlayerController3D
extends CharacterBody3D

## Genuine 3D Third-Person Character Controller for Veer (Solar Guardian).
## Features camera-relative locomotion, physical gravity, stair traversal, 
## procedural limb articulation, Prana Dash, and 3-hit Surya combo attack.

signal health_changed(current: int, max_val: int)
signal shards_changed(count: int)
signal interacted_with(target_name: String)

@export_group("Locomotion")
@export var walk_speed: float = 4.2
@export var run_speed: float = 7.5
@export var acceleration: float = 38.0
@export var friction: float = 32.0
@export var turn_speed: float = 14.0
@export var jump_velocity: float = 8.5
@export var gravity: float = 18.0

@export_group("Prana Dash")
@export var dash_speed: float = 18.0
@export var dash_duration: float = 0.22
@export var dash_cooldown: float = 0.65

@export_group("Combat Stats")
@export var max_health: int = 100
@export var attack_damage_base: int = 25

# Node References
@onready var camera_arm: SpringArm3D = $CameraArm
@onready var visual_root: Node3D = $Visual
@onready var body_mesh: Node3D = $Visual/Body
@onready var weapon_socket: Node3D = $Visual/Body/ArmR/WeaponSocket
@onready var weapon_mesh: Node3D = $Visual/Body/ArmR/WeaponSocket/SuryaKhadga
@onready var aura_particles: GPUParticles3D = $Visual/AuraParticles
@onready var interact_detector: Area3D = $InteractDetector

# State
var health: int = 100
var shards_collected: int = 0
var is_dashing: bool = false
var dash_timer: float = 0.0
var dash_cooldown_timer: float = 0.0
var dash_direction: Vector3 = Vector3.ZERO

var is_attacking: bool = false
var attack_timer: float = 0.0
var attack_duration: float = 0.35
var combo_index: int = 0
var combo_window_timer: float = 0.0

var walk_cycle_time: float = 0.0
var idle_breath_time: float = 0.0

func _ready() -> void:
	health = max_health
	floor_snap_length = 0.4
	floor_max_angle = deg_to_rad(48.0) # Allows smooth stair and ramp stepping
	health_changed.emit(health, max_health)
	shards_changed.emit(shards_collected)

func _physics_process(delta: float) -> void:
	# 1. Apply Gravity
	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		if velocity.y < 0:
			velocity.y = -0.5 # Maintain slight downward stickiness for stairs

	# 2. Update Timers
	if dash_cooldown_timer > 0.0:
		dash_cooldown_timer -= delta
	if combo_window_timer > 0.0:
		combo_window_timer -= delta
		if combo_window_timer <= 0.0:
			combo_index = 0

	# 3. Dash Handling
	if is_dashing:
		dash_timer -= delta
		velocity.x = dash_direction.x * dash_speed
		velocity.z = dash_direction.z * dash_speed
		if dash_timer <= 0.0:
			is_dashing = false
		move_and_slide()
		_animate_limbs(delta)
		return

	# 4. Attack Handling
	if is_attacking:
		attack_timer -= delta
		# Committed combat footwork slows horizontal drift
		velocity.x = move_toward(velocity.x, 0.0, friction * 0.7 * delta)
		velocity.z = move_toward(velocity.z, 0.0, friction * 0.7 * delta)
		if attack_timer <= 0.0:
			is_attacking = false
			combo_window_timer = 0.55
		move_and_slide()
		_animate_combat_weapon(delta)
		return

	# 5. Jump Action
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = jump_velocity

	# 6. Dash Action Trigger
	if Input.is_action_just_pressed("dash") and dash_cooldown_timer <= 0.0:
		_trigger_dash()
		move_and_slide()
		return

	# 7. Attack Action Trigger
	if Input.is_action_just_pressed("attack"):
		_trigger_attack()
		move_and_slide()
		return

	# 8. Interaction Trigger
	if Input.is_action_just_pressed("interact"):
		_check_interaction()

	# 9. Camera-Relative Locomotion Input
	var input_dir: Vector2 = Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
	var move_dir: Vector3 = Vector3.ZERO

	if input_dir.length_squared() > 0.001:
		# Convert 2D input to 3D direction relative to the CameraArm's Y rotation
		var cam_rot_y = camera_arm.global_rotation.y
		var forward = Vector3(sin(cam_rot_y), 0, cos(cam_rot_y))
		var right = Vector3(cos(cam_rot_y), 0, -sin(cam_rot_y))
		move_dir = (right * input_dir.x + forward * input_dir.y).normalized()

	var target_speed = run_speed if Input.is_key_pressed(KEY_SHIFT) or input_dir.length() > 0.8 else walk_speed

	if move_dir.length_squared() > 0.001:
		velocity.x = move_toward(velocity.x, move_dir.x * target_speed, acceleration * delta)
		velocity.z = move_toward(velocity.z, move_dir.z * target_speed, acceleration * delta)

		# Smoothly rotate avatar towards movement direction
		var target_angle = atan2(-move_dir.x, -move_dir.z)
		rotation.y = lerp_angle(rotation.y, target_angle, turn_speed * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, friction * delta)
		velocity.z = move_toward(velocity.z, 0.0, friction * delta)

	move_and_slide()
	_animate_limbs(delta)

func _trigger_dash() -> void:
	is_dashing = true
	dash_timer = dash_duration
	dash_cooldown_timer = dash_cooldown

	var input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
	if input_dir.length_squared() > 0.001:
		var cam_rot_y = camera_arm.global_rotation.y
		var forward = Vector3(sin(cam_rot_y), 0, cos(cam_rot_y))
		var right = Vector3(cos(cam_rot_y), 0, -sin(cam_rot_y))
		dash_direction = (right * input_dir.x + forward * input_dir.y).normalized()
	else:
		# Dash straight forward relative to avatar facing
		dash_direction = -transform.basis.z.normalized()

func _trigger_attack() -> void:
	is_attacking = true
	attack_timer = attack_duration
	combo_index = (combo_index % 3) + 1

func _check_interaction() -> void:
	if not interact_detector:
		return
	var overlapping = interact_detector.get_overlapping_areas()
	for area in overlapping:
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

## Procedural skeletal limb articulation matching bone mechanics
func _animate_limbs(delta: float) -> void:
	var horiz_speed = Vector2(velocity.x, velocity.z).length()

	if horiz_speed > 0.2:
		walk_cycle_time += delta * (horiz_speed * 2.2)
		var swing = sin(walk_cycle_time)

		# Articulate Thighs and Shins
		var thigh_l = $Visual/Body/ThighL as Node3D
		var thigh_r = $Visual/Body/ThighR as Node3D
		var arm_l = $Visual/Body/ArmL as Node3D
		var arm_r = $Visual/Body/ArmR as Node3D

		if thigh_l and thigh_r:
			thigh_l.rotation.x = swing * 0.65
			thigh_r.rotation.x = -swing * 0.65
		if arm_l and arm_r and not is_attacking:
			arm_l.rotation.x = -swing * 0.55
			arm_r.rotation.x = swing * 0.55

		# Torso vertical bounce
		if body_mesh:
			body_mesh.position.y = 0.95 + abs(sin(walk_cycle_time * 2.0)) * 0.08
	else:
		idle_breath_time += delta * 2.0
		var breath = sin(idle_breath_time) * 0.04

		var thigh_l = $Visual/Body/ThighL as Node3D
		var thigh_r = $Visual/Body/ThighR as Node3D
		var arm_l = $Visual/Body/ArmL as Node3D
		var arm_r = $Visual/Body/ArmR as Node3D

		if thigh_l and thigh_r:
			thigh_l.rotation.x = lerp_angle(thigh_l.rotation.x, 0.0, 10.0 * delta)
			thigh_r.rotation.x = lerp_angle(thigh_r.rotation.x, 0.0, 10.0 * delta)
		if arm_l and arm_r and not is_attacking:
			arm_l.rotation.x = lerp_angle(arm_l.rotation.x, breath * 0.5, 8.0 * delta)
			arm_r.rotation.x = lerp_angle(arm_r.rotation.x, -breath * 0.5, 8.0 * delta)
		if body_mesh:
			body_mesh.position.y = lerp(body_mesh.position.y, 0.95 + breath, 6.0 * delta)

func _animate_combat_weapon(delta: float) -> void:
	var progress = 1.0 - (attack_timer / attack_duration)
	var arm_r = $Visual/Body/ArmR as Node3D
	if not arm_r or not weapon_mesh:
		return

	if combo_index == 1: # Horizontal light slash
		arm_r.rotation.x = lerp_angle(deg_to_rad(-60.0), deg_to_rad(45.0), progress)
		arm_r.rotation.y = lerp_angle(deg_to_rad(-45.0), deg_to_rad(65.0), progress)
	elif combo_index == 2: # Rising backhand slash
		arm_r.rotation.x = lerp_angle(deg_to_rad(50.0), deg_to_rad(-70.0), progress)
		arm_r.rotation.y = lerp_angle(deg_to_rad(65.0), deg_to_rad(-40.0), progress)
	else: # Overhead Surya Finisher
		arm_r.rotation.x = lerp_angle(deg_to_rad(-110.0), deg_to_rad(55.0), progress)
		arm_r.rotation.y = 0.0
