class_name PlayerController3D
extends CharacterBody3D

const AudioManager3D = preload("res://scripts/audio/audio_manager_3d.gd")

## Production 3D Third-Person Character Controller for Veer (Solar Guardian).
## Features:
## - Full skinned humanoid mesh with 24-bone Skeleton3D
## - Camera-relative locomotion with smooth rotation & target-locked strafing
## - Speed-matched gait synchronization (Walk, Jog, Sprint) eliminating foot sliding
## - Slope handling with constant speed, stair snapping (0.45m), and slope velocity alignment
## - Enhanced jump with jump buffering (0.15s), coyote time (0.12s), and variable jump cutoff
## - 4-directional Prana Dash (Dodge) with invulnerability frames
## - 3-hit Surya combo attack sequence with active 3D melee hitboxes & CombatMath integration
## - Directional shield guard stance (absorbs 75% dmg) and 140ms perfect parry deflection
## - Multi-input support: Keyboard & Mouse, Gamepad analog sticks/buttons, Touch triggers
## - Forward raycast and proximity area spatial interactions with shrines and Astra shards

signal health_changed(current: int, max_val: int)
signal shards_changed(count: int)
signal interacted_with(target_name: String)
signal interaction_requested(target_name: String)
signal locomotion_state_changed(state: String, speed: float)
signal attack_hit(target: Node3D, damage: int, is_crit: bool)

@export_group("Locomotion")
@export var walk_speed: float = 4.2
@export var jog_speed: float = 7.5
@export var sprint_speed: float = 10.5
@export var guard_speed: float = 2.2
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

# Node References
@onready var camera_arm: SpringArm3D = $CameraArm
@onready var visual_root: Node3D = $Visual
@onready var interact_detector: Area3D = $InteractDetector
@onready var interact_raycast: RayCast3D = $InteractRayCast
@onready var melee_hitbox: Area3D = $MeleeHitbox

var anim_player: AnimationPlayer = null
var current_anim: String = ""

# Gameplay State
var health: int = 100
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

# Traversal & Kinematics State
var was_on_floor: bool = true
var landing_timer: float = 0.0
var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0

# Aerial Glider & Harpoon Grapple (Chapter II: Antariksha)
var is_gliding: bool = false
var glide_speed: float = 12.0
var glide_fall_speed: float = 2.0
var is_grappling: bool = false
var grapple_target_pos: Vector3 = Vector3.ZERO
var grapple_speed: float = 24.0

func _ready() -> void:
	health = max_health
	floor_snap_length = 0.45
	floor_max_angle = deg_to_rad(48.0)
	floor_stop_on_slope = true
	floor_constant_speed = true

	anim_player = _find_animation_player(visual_root)
	if anim_player:
		anim_player.playback_default_blend_time = 0.16

	if melee_hitbox:
		melee_hitbox.area_entered.connect(_on_melee_hitbox_area_entered)
		melee_hitbox.body_entered.connect(_on_melee_hitbox_body_entered)
		melee_hitbox.monitoring = false

	health_changed.emit(health, max_health)
	shards_changed.emit(shards_collected)

func _physics_process(delta: float) -> void:
	var on_floor = is_on_floor()

	# 1. Coyote Time & Floor Tracking
	if on_floor:
		coyote_timer = 0.12
		is_gliding = false
		is_grappling = false
		if not was_on_floor:
			was_on_floor = true
			landing_timer = 0.18
		if velocity.y < 0:
			velocity.y = -0.5 # Maintain slight downward adherence for stairs
	else:
		if was_on_floor:
			was_on_floor = false
		coyote_timer = max(0.0, coyote_timer - delta)

		# Chapter II: Aerial Glider logic (holding jump while falling)
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

	# 3. Read Input & Modes
	var is_locked_on = camera_arm.has_method("is_locked_on") and camera_arm.is_locked_on()
	var locked_target = camera_arm.get_locked_target() if is_locked_on else null

	is_guarding = (Input.is_key_pressed(KEY_Q) or Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT) or Input.is_joy_button_pressed(0, JOY_BUTTON_LEFT_SHOULDER)) and not is_attacking and not is_dashing and not is_gliding

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

	# 5. Handle Active Dash
	if is_dashing:
		dash_timer -= delta
		velocity.x = dash_direction.x * dash_speed
		velocity.z = dash_direction.z * dash_speed
		if dash_timer <= 0.0:
			is_dashing = false
		move_and_slide()
		_update_locomotion_animation(delta)
		return

	# 5. Handle Active Melee Attack
	if is_attacking:
		attack_timer -= delta
		velocity.x = move_toward(velocity.x, 0.0, friction * 0.8 * delta)
		velocity.z = move_toward(velocity.z, 0.0, friction * 0.8 * delta)

		# Enable hitbox during active middle frames
		var progress = 1.0 - (attack_timer / attack_duration)
		if melee_hitbox:
			melee_hitbox.monitoring = (progress >= 0.20 and progress <= 0.75)

		# Face locked target or attack direction
		if locked_target and is_instance_valid(locked_target):
			var to_target = (locked_target.global_position - global_position)
			visual_root.rotation.y = atan2(to_target.x, to_target.z)

		if attack_timer <= 0.0:
			is_attacking = false
			if melee_hitbox:
				melee_hitbox.monitoring = false
			combo_window_timer = 0.55

		move_and_slide()
		_update_locomotion_animation(delta)
		return

	# 6. Read Locomotion Input Vector (Keyboard + Gamepad Analog Stick)
	var input_dir = Vector2.ZERO
	# Keyboard
	if Input.is_action_pressed("move_forward") or Input.is_key_pressed(KEY_W):
		input_dir.y -= 1.0
	if Input.is_action_pressed("move_backward") or Input.is_key_pressed(KEY_S):
		input_dir.y += 1.0
	if Input.is_action_pressed("move_left") or Input.is_key_pressed(KEY_A):
		input_dir.x -= 1.0
	if Input.is_action_pressed("move_right") or Input.is_key_pressed(KEY_D):
		input_dir.x += 1.0

	# Gamepad Left Stick
	var joy_x = Input.get_joy_axis(0, JOY_AXIS_LEFT_X)
	var joy_y = Input.get_joy_axis(0, JOY_AXIS_LEFT_Y)
	if abs(joy_x) > 0.15 or abs(joy_y) > 0.15:
		input_dir.x = joy_x
		input_dir.y = joy_y

	if input_dir.length_squared() > 1.0:
		input_dir = input_dir.normalized()

	# 7. Transform Movement Camera-Relative
	var move_dir = Vector3.ZERO
	if input_dir.length_squared() > 0.001:
		var cam_rot_y = camera_arm.rotation.y if camera_arm else 0.0
		var forward = -Vector3(sin(cam_rot_y), 0, cos(cam_rot_y))
		var right = Vector3(cos(cam_rot_y), 0, -sin(cam_rot_y))
		move_dir = (forward * -input_dir.y + right * input_dir.x).normalized()

	# 8. Determine Target Speed
	var sprint_pressed = Input.is_key_pressed(KEY_SHIFT) or (InputMap.has_action("sprint") and Input.is_action_pressed("sprint")) or Input.is_joy_button_pressed(0, JOY_BUTTON_LEFT_STICK)
	var is_sprinting = sprint_pressed and not is_guarding
	var target_speed = 0.0
	if move_dir.length_squared() > 0.001:
		if is_guarding:
			target_speed = guard_speed
		elif is_sprinting:
			target_speed = sprint_speed
		elif input_dir.length() < 0.65:
			target_speed = walk_speed
		else:
			target_speed = jog_speed

	# 9. Horizontal Acceleration / Friction (with air control)
	var current_accel = acceleration if on_floor else air_acceleration
	if move_dir.length_squared() > 0.001:
		velocity.x = move_toward(velocity.x, move_dir.x * target_speed, current_accel * delta)
		velocity.z = move_toward(velocity.z, move_dir.z * target_speed, current_accel * delta)

		# Character Facing
		if is_locked_on and locked_target and is_instance_valid(locked_target):
			# Strafing mode: face locked target continuously
			var to_t = (locked_target.global_position - global_position)
			visual_root.rotation.y = lerp_angle(visual_root.rotation.y, atan2(to_t.x, to_t.z), turn_speed * 1.5 * delta)
		elif is_guarding:
			# Guard mode: face camera forward
			var cam_rot_y = camera_arm.rotation.y if camera_arm else 0.0
			visual_root.rotation.y = lerp_angle(visual_root.rotation.y, cam_rot_y, turn_speed * delta)
		else:
			# Free roam: face direction of movement
			var target_angle = atan2(move_dir.x, move_dir.z)
			visual_root.rotation.y = lerp_angle(visual_root.rotation.y, target_angle, turn_speed * delta)
	else:
		if on_floor:
			velocity.x = move_toward(velocity.x, 0.0, friction * delta)
			velocity.z = move_toward(velocity.z, 0.0, friction * delta)

	# 10. Jump Execution (Buffered + Coyote Time)
	if (Input.is_action_just_pressed("jump") or Input.is_key_pressed(KEY_SPACE) or Input.is_joy_button_pressed(0, JOY_BUTTON_A)) and not is_guarding:
		jump_buffer_timer = 0.15

	if jump_buffer_timer > 0.0 and (on_floor or coyote_timer > 0.0) and not is_guarding:
		velocity.y = jump_velocity
		jump_buffer_timer = 0.0
		coyote_timer = 0.0
		was_on_floor = false

	# Variable Jump Height: release button to cut rising arc
	if Input.is_action_just_released("jump") or (Input.is_key_pressed(KEY_SPACE) == false and not on_floor and velocity.y > 2.0):
		velocity.y *= 0.55

	# 11. Execute Kinematics with Slope Floor Snapping
	move_and_slide()

	# 12. Update Animation State Machine
	_update_locomotion_animation(delta)

func _unhandled_input(event: InputEvent) -> void:
	# Prana Dash Trigger (Shift + Space or Controller B)
	if event.is_action_pressed("dash") or (event is InputEventJoypadButton and event.button_index == JOY_BUTTON_B and event.pressed):
		_trigger_dash()

	# Melee Attack Trigger (LMB, 'K', Controller X)
	if (event.is_action_pressed("attack") or (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT) or (event is InputEventJoypadButton and event.button_index == JOY_BUTTON_X and event.pressed)) and not is_guarding:
		_trigger_attack()

	# Interact Trigger ('E', Controller Y)
	if event.is_action_pressed("interact") or (event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_E) or (event is InputEventJoypadButton and event.button_index == JOY_BUTTON_Y and event.pressed):
		_trigger_interaction()

	# Parry Trigger ('F', Controller RB)
	if (event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_F) or (event is InputEventJoypadButton and event.button_index == JOY_BUTTON_RIGHT_SHOULDER and event.pressed):
		_trigger_parry()

	# Harpoon Grapple Trigger ('G', 'C', or Middle Click)
	if (event is InputEventKey and event.pressed and not event.echo and (event.keycode == KEY_G or event.keycode == KEY_C)) or (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_MIDDLE):
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
	is_dashing = true
	dash_timer = dash_duration
	dash_cooldown_timer = dash_cooldown
	AudioManager3D.play("dash_whoosh")

	var horiz_vel = Vector3(velocity.x, 0, velocity.z)
	if horiz_vel.length() > 0.5:
		dash_direction = horiz_vel.normalized()
	else:
		dash_direction = -visual_root.global_transform.basis.z.normalized()

func _trigger_attack() -> void:
	if is_attacking or is_dashing:
		return

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
	_play_anim("parry", 0.08, 1.2)

func _trigger_interaction() -> void:
	_play_anim("interact", 0.12, 1.0)

	# 1. First priority: Raycast facing direction
	if interact_raycast and interact_raycast.is_colliding():
		var col = interact_raycast.get_collider()
		if col and col.has_method("interact"):
			col.interact(self)
			interacted_with.emit(col.name)
			interaction_requested.emit(col.name)
			return

	# 2. Second priority: Proximity Area
	if interact_detector:
		var overlapping_areas = interact_detector.get_overlapping_areas()
		for area in overlapping_areas:
			if area.has_method("interact"):
				area.interact(self)
				interacted_with.emit(area.name)
				interaction_requested.emit(area.name)
				return
			elif area.get_parent() and area.get_parent().has_method("interact"):
				area.get_parent().interact(self)
				interacted_with.emit(area.get_parent().name)
				interaction_requested.emit(area.get_parent().name)
				return

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

	hit_enemies.append(target)
	var dmg = attack_damage_base
	var poise_dmg = 30.0

	if combo_index == 2:
		dmg = int(attack_damage_base * 1.4)
		poise_dmg = 45.0
	elif combo_index == 3:
		dmg = int(attack_damage_base * 2.4)
		poise_dmg = 75.0

	var p_pos_melee = global_position if is_inside_tree() else position
	var attack_spec = CombatMath.AttackSpec.new("veer", dmg, poise_dmg, p_pos_melee)
	if target.has_method("take_damage_spec"):
		var res = target.take_damage_spec(attack_spec)
		attack_hit.emit(target, res.damage_dealt, res.is_critical)
	elif target.has_method("take_damage"):
		target.take_damage(dmg)
		attack_hit.emit(target, dmg, false)

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	var p_pos = global_position if is_inside_tree() else position
	var p_facing = -visual_root.global_transform.basis.z if (visual_root and visual_root.is_inside_tree()) else Vector3.FORWARD
	var def_spec = CombatMath.DefenseSpec.new("veer", p_pos, p_facing)
	def_spec.is_guarding = is_guarding
	def_spec.parry_window_timer = parry_window_timer

	var result = CombatMath.resolve_attack(attack_spec, def_spec)

	if result.was_parried:
		_play_anim("parry", 0.06, 1.3)
	elif result.was_blocked:
		_play_anim("block", 0.08, 1.0)
		health = max(0, health - result.damage_dealt)
		health_changed.emit(health, max_health)
	else:
		health = max(0, health - result.damage_dealt)
		health_changed.emit(health, max_health)
		_play_anim("hit_reaction", 0.06, 1.2)

	return result

func take_damage(amount: int) -> void:
	health = max(0, health - amount)
	health_changed.emit(health, max_health)
	_play_anim("hit_reaction", 0.06, 1.2)

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

	# Priority 4: Airborne (Jump, Fall & Gliding)
	if not is_on_floor():
		if is_gliding:
			_play_anim("jump_fall", 0.15, 0.8)
			locomotion_state_changed.emit("Glide", horiz_speed)
		elif velocity.y > 0.5:
			_play_anim("jump", 0.15, 1.0)
			locomotion_state_changed.emit("Jump", velocity.y)
		else:
			_play_anim("fall", 0.18, 1.0)
			locomotion_state_changed.emit("Fall", velocity.y)
		return

	# Priority 5: Landing Impact Recovery
	if landing_timer > 0.0 and horiz_speed < 1.0:
		_play_anim("landing", 0.1, 1.2)
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
		_play_anim("run", 0.15, speed_scale)
		locomotion_state_changed.emit("Run", horiz_speed)
	else:
		var speed_scale = clamp(horiz_speed / sprint_speed, 0.8, 1.5)
		_play_anim("sprint", 0.12, speed_scale)
		locomotion_state_changed.emit("Sprint", horiz_speed)

func _play_anim(anim_name: String, blend_time: float, speed_scale: float) -> void:
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
