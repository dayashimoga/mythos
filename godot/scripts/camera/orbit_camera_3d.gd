class_name OrbitCamera3D
extends SpringArm3D

## Production 3D Third-Person Orbit Camera Controller.
## Features:
## - Spherical orbit with obstruction raycasting margin
## - Pitch clamping (-70° to +25°)
## - Mouse wheel zoom with smooth lerping (2.0m to 8.0m)
## - Over-The-Shoulder Combat Mode ('C' key)
## - Smooth framing damping and dynamic FOV transitions

signal camera_mode_changed(is_over_shoulder: bool)

@export var target_path: NodePath
@export var mouse_sensitivity: float = 0.0035
@export var key_turn_speed: float = 2.2
@export var min_pitch_deg: float = -70.0
@export var max_pitch_deg: float = 25.0

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

@onready var camera_node: Camera3D = $Camera3D

func _ready() -> void:
	target_zoom = default_zoom
	spring_length = default_zoom
	margin = 0.25
	collision_mask = 1 # Collide with Environment (Layer 1)
	position = standard_arm_offset
	target_arm_offset = standard_arm_offset

	if camera_node:
		camera_node.fov = standard_fov

	if not target_path.is_empty():
		target_node = get_node_or_null(target_path)
	elif get_parent() is Node3D:
		target_node = get_parent()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_RIGHT or event.button_index == MOUSE_BUTTON_MIDDLE:
			is_orbiting = event.pressed
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			if not is_over_shoulder:
				target_zoom = max(min_zoom, target_zoom - zoom_speed)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			if not is_over_shoulder:
				target_zoom = min(max_zoom, target_zoom + zoom_speed)

	elif event is InputEventMouseMotion and is_orbiting:
		orbit(event.relative.x, event.relative.y)

	elif event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_C:
			toggle_over_the_shoulder()

func toggle_over_the_shoulder() -> void:
	is_over_shoulder = !is_over_shoulder
	if is_over_shoulder:
		target_zoom = over_shoulder_zoom
		target_arm_offset = over_shoulder_arm_offset
	else:
		target_zoom = default_zoom
		target_arm_offset = standard_arm_offset
	camera_mode_changed.emit(is_over_shoulder)

func orbit(dx: float, dy: float) -> void:
	# Yaw (horizontal orbit)
	rotation.y -= dx * mouse_sensitivity
	# Pitch (vertical tilt)
	rotation.x -= dy * mouse_sensitivity
	rotation.x = clamp(rotation.x, deg_to_rad(min_pitch_deg), deg_to_rad(max_pitch_deg))

func _process(delta: float) -> void:
	# Smooth zoom lerp
	spring_length = lerp(spring_length, target_zoom, zoom_damping * delta)

	# Smooth arm offset lerp
	position = position.lerp(target_arm_offset, zoom_damping * delta)

	# Smooth FOV transition
	if camera_node:
		var dest_fov = over_shoulder_fov if is_over_shoulder else standard_fov
		camera_node.fov = lerp(camera_node.fov, dest_fov, 8.0 * delta)

	# Arrow keys / controller orbit support
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
