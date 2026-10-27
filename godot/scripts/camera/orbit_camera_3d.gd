class_name OrbitCamera3D
extends SpringArm3D

## Production 3D Third-Person Orbit Camera Controller with Combat Targeting.
## Features:
## - Spherical collision shape casting for reliable obstacle avoidance (no clipping)
## - Smooth mouse, keyboard, and gamepad analog orbit
## - Mouse wheel zoom with smooth lerping (2.0m to 8.0m)
## - Combat Target Locking (Tab / Middle-Click / Gamepad R3) tracking enemies/shrines
## - Over-The-Shoulder Combat Mode ('C' key)
## - Dynamic FOV transitions and framing damping

signal camera_mode_changed(is_over_shoulder: bool)
signal target_locked(target: Node3D)
signal target_unlocked()

@export var target_path: NodePath
@export var mouse_sensitivity: float = 0.0035
@export var gamepad_sensitivity: float = 2.8
@export var key_turn_speed: float = 2.2
@export var min_pitch_deg: float = -70.0
@export var max_pitch_deg: float = 25.0

const PauseMenuScript = preload("res://scripts/ui/pause_menu_3d.gd")

@export_group("Zoom & Framing")
@export var min_zoom: float = 2.0
@export var max_zoom: float = 8.0
@export var default_zoom: float = 4.5
@export var zoom_speed: float = 0.5
@export var zoom_damping: float = 12.0

@export_group("Over-The-Shoulder Mode")
@export var over_shoulder_zoom: float = 2.2
@export var standard_arm_offset: Vector3 = Vector3(0.0, 1.45, 0.0)
@export var over_shoulder_arm_offset: Vector3 = Vector3(0.65, 1.45, 0.0)
@export var standard_fov: float = 72.0
@export var over_shoulder_fov: float = 64.0

var is_orbiting: bool = false
var is_over_shoulder: bool = false
var target_zoom: float = 4.5
var target_arm_offset: Vector3 = Vector3(0.0, 1.45, 0.0)
var target_node: Node3D = null

# Combat Target Lock State
var locked_target: Node3D = null
var max_lock_distance: float = 24.0

# Camera Trauma / Impact Screen Shake
var trauma: float = 0.0
var trauma_decay: float = 2.2
var trauma_time: float = 0.0

func add_trauma(amount: float) -> void:
	trauma = clamp(trauma + amount, 0.0, 1.0)

@onready var camera_node: Camera3D = $Camera3D

func _ready() -> void:
	target_zoom = default_zoom
	spring_length = default_zoom
	margin = 0.25
	collision_mask = 1 # Collide with Environment (Layer 1)
	position = standard_arm_offset
	target_arm_offset = standard_arm_offset

	# Physical obstacle avoidance with sphere shape
	var sphere_shape = SphereShape3D.new()
	sphere_shape.radius = 0.22
	shape = sphere_shape

	if camera_node:
		camera_node.near = 0.05
		camera_node.fov = standard_fov

	if not target_path.is_empty():
		target_node = get_node_or_null(target_path)
	elif get_parent() is Node3D:
		target_node = get_parent()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_RIGHT:
			is_orbiting = event.pressed
		elif event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			if not is_inside_tree():
				pass
			elif Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
				# Allow capturing mouse on game viewport click when pause menu is not open
				var pause_menu = get_tree().root.find_child("PauseMenu", true, false)
				if not pause_menu or not pause_menu.visible:
					Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
		elif event.button_index == MOUSE_BUTTON_MIDDLE and event.pressed:
			toggle_target_lock()
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			if not is_over_shoulder and not locked_target:
				target_zoom = max(min_zoom, target_zoom - zoom_speed)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			if not is_over_shoulder and not locked_target:
				target_zoom = min(max_zoom, target_zoom + zoom_speed)

	elif event is InputEventMouseMotion and not locked_target:
		if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED or is_orbiting:
			orbit(event.relative.x, event.relative.y)

	elif event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ESCAPE:
			if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
				Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		elif event.keycode == KEY_C:
			toggle_over_the_shoulder()
		elif event.keycode == KEY_TAB:
			toggle_target_lock()

	elif event is InputEventJoypadButton and event.pressed:
		if event.button_index == JOY_BUTTON_RIGHT_STICK:
			toggle_target_lock()

func toggle_over_the_shoulder() -> void:
	is_over_shoulder = !is_over_shoulder
	if is_over_shoulder:
		target_zoom = over_shoulder_zoom
		target_arm_offset = over_shoulder_arm_offset
	else:
		target_zoom = default_zoom
		target_arm_offset = standard_arm_offset
	camera_mode_changed.emit(is_over_shoulder)

func toggle_target_lock() -> void:
	if locked_target:
		clear_target_lock()
	else:
		find_and_lock_target()

func find_and_lock_target() -> void:
	var player_pos = Vector3.ZERO
	if target_node:
		player_pos = target_node.global_position if target_node.is_inside_tree() else target_node.position
	else:
		player_pos = global_position if is_inside_tree() else position

	var cam_forward = Vector3.FORWARD
	if is_inside_tree():
		cam_forward = -global_transform.basis.z.normalized()
	else:
		cam_forward = -transform.basis.z.normalized()

	var candidates: Array[Node3D] = []
	var tree = get_tree() if is_inside_tree() else null
	if tree:
		# Search in group "targetable" or interactable entities
		for node in tree.get_nodes_in_group("targetable"):
			if node is Node3D and is_instance_valid(node) and node != target_node:
				var node_pos = node.global_position if node.is_inside_tree() else node.position
				var to_node = node_pos - player_pos
				var dist = to_node.length()
				if dist <= max_lock_distance:
					candidates.append(node)
	elif target_node and target_node.get_parent():
		for child in target_node.get_parent().get_children():
			if child is Node3D and child.is_in_group("targetable") and child != target_node:
				var child_pos = child.global_position if child.is_inside_tree() else child.position
				var to_child = child_pos - player_pos
				if to_child.length() <= max_lock_distance:
					candidates.append(child)

	if candidates.is_empty():
		return

	# Choose the candidate best aligned with camera forward
	var best_target: Node3D = null
	var best_score: float = -999.0

	for c in candidates:
		var c_pos = c.global_position if c.is_inside_tree() else c.position
		var to_c = (c_pos - player_pos).normalized()
		var dot = cam_forward.dot(to_c)
		var dist = player_pos.distance_to(c_pos)
		var score = dot * 10.0 - (dist * 0.25)
		if score > best_score:
			best_score = score
			best_target = c

	if best_target:
		locked_target = best_target
		target_locked.emit(locked_target)

func clear_target_lock() -> void:
	locked_target = null
	target_unlocked.emit()

func is_locked_on() -> bool:
	return locked_target != null and is_instance_valid(locked_target)

func get_locked_target() -> Node3D:
	return locked_target if is_locked_on() else null

func orbit(dx: float, dy: float) -> void:
	var sens_mult: float = PauseMenuScript.camera_sensitivity
	var y_dir: float = -1.0 if PauseMenuScript.invert_camera_y else 1.0
	# Yaw (horizontal orbit)
	rotation.y -= dx * mouse_sensitivity * sens_mult
	# Pitch (vertical tilt)
	rotation.x -= dy * mouse_sensitivity * sens_mult * y_dir
	rotation.x = clamp(rotation.x, deg_to_rad(min_pitch_deg), deg_to_rad(max_pitch_deg))

func _process(delta: float) -> void:
	# 1. Handle Target Lock Tracking
	if locked_target:
		if not is_instance_valid(locked_target) or locked_target.is_queued_for_deletion():
			clear_target_lock()
		else:
			var player_pos = target_node.global_position if (target_node and target_node.is_inside_tree()) else (target_node.position if target_node else position)
			var t_pos = locked_target.global_position if locked_target.is_inside_tree() else locked_target.position
			var dist = player_pos.distance_to(t_pos)

			if dist > max_lock_distance * 1.3:
				clear_target_lock()
			else:
				# Smoothly align camera to face target
				var to_target = (t_pos - player_pos)
				var desired_yaw = atan2(-to_target.x, -to_target.z)
				rotation.y = lerp_angle(rotation.y, desired_yaw, 7.0 * delta)

				var desired_pitch = deg_to_rad(clamp(-14.0 + (dist * 0.35), min_pitch_deg, max_pitch_deg))
				rotation.x = lerp_angle(rotation.x, desired_pitch, 6.0 * delta)

				target_zoom = clamp(dist * 0.75 + 1.8, 3.2, 7.0)

	# 2. Gamepad Right Analog Stick Orbit with radial deadzone
	if not locked_target:
		var joy_x = Input.get_joy_axis(0, JOY_AXIS_RIGHT_X)
		var joy_y = Input.get_joy_axis(0, JOY_AXIS_RIGHT_Y)
		var stick = Vector2(joy_x, joy_y)
		var deadzone = 0.15
		if stick.length() > deadzone:
			var stick_norm = stick.normalized()
			var stick_mag = (stick.length() - deadzone) / (1.0 - deadzone)
			var remapped = stick_norm * stick_mag
			orbit(remapped.x * gamepad_sensitivity * 280.0 * delta, remapped.y * gamepad_sensitivity * 240.0 * delta)

	# 3. Adaptive Tight-Space Framing & Obstruction Avoidance
	# If camera is compressed close to player (< 2.2m) by walls, pillars, or low ceilings, adapt framing
	var current_hit_len = get_hit_length()
	var effective_arm_offset = target_arm_offset
	if current_hit_len < 2.2 and not is_over_shoulder:
		var t_tight = clamp((2.2 - current_hit_len) / 1.5, 0.0, 1.0)
		# Adjust arm height and shift right so Veer remains centered and visible
		effective_arm_offset = standard_arm_offset.lerp(Vector3(0.55, 1.30, 0.0), t_tight)
		# Dynamically bound pitch in tight interiors to prevent camera pressing into roofs or stairs
		var dynamic_max_pitch = lerp(deg_to_rad(14.0), deg_to_rad(max_pitch_deg), clamp(current_hit_len / 2.0, 0.0, 1.0))
		var dynamic_min_pitch = lerp(deg_to_rad(-52.0), deg_to_rad(min_pitch_deg), clamp(current_hit_len / 2.0, 0.0, 1.0))
		rotation.x = clamp(rotation.x, dynamic_min_pitch, dynamic_max_pitch)

	# 4. Smooth zoom & arm offset lerp
	spring_length = lerp(spring_length, target_zoom, zoom_damping * delta)
	position = position.lerp(effective_arm_offset, zoom_damping * delta)

	# 5. Smooth FOV transition
	if camera_node:
		var dest_fov = over_shoulder_fov if is_over_shoulder else standard_fov
		if current_hit_len < 2.0:
			dest_fov = standard_fov + 4.0 # Slightly widen FOV in tight interiors
		camera_node.fov = lerp(camera_node.fov, dest_fov, 8.0 * delta)

	# 6. Arrow keys orbit fallback
	if not locked_target:
		if Input.is_key_pressed(KEY_LEFT):
			rotation.y += key_turn_speed * delta
		if Input.is_key_pressed(KEY_RIGHT):
			rotation.y -= key_turn_speed * delta
		if Input.is_key_pressed(KEY_UP):
			rotation.x += key_turn_speed * 0.8 * delta
			rotation.x = clamp(rotation.x, deg_to_rad(min_pitch_deg), deg_to_rad(max_pitch_deg))
		if Input.is_key_pressed(KEY_DOWN):
			rotation.x -= key_turn_speed * 0.8 * delta
			rotation.x = clamp(rotation.x, deg_to_rad(min_pitch_deg), deg_to_rad(max_pitch_deg))

	# 7. Apply Trauma Screen Shake (respecting accessibility settings)
	if camera_node:
		if trauma > 0.0:
			trauma_time += delta * 36.0
			var shake_mult: float = PauseMenuScript.screen_shake_multiplier if not PauseMenuScript.reduced_motion else 0.0
			var shake = trauma * trauma * shake_mult
			camera_node.rotation.z = sin(trauma_time * 1.3) * deg_to_rad(3.5) * shake
			camera_node.rotation.x = cos(trauma_time * 1.7) * deg_to_rad(2.5) * shake
			camera_node.rotation.y = sin(trauma_time * 1.9) * deg_to_rad(2.5) * shake
			trauma = max(0.0, trauma - trauma_decay * delta)
		else:
			camera_node.rotation = camera_node.rotation.lerp(Vector3.ZERO, 15.0 * delta)
