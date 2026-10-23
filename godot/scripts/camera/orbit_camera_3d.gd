class_name OrbitCamera3D
extends SpringArm3D

## 3D Third-Person Orbit Camera Controller with obstruction raycasting and pitch clamping.

@export var target_path: NodePath
@export var mouse_sensitivity: float = 0.0035
@export var key_turn_speed: float = 2.2
@export var min_pitch_deg: float = -70.0
@export var max_pitch_deg: float = 25.0
@export var min_zoom: float = 2.0
@export var max_zoom: float = 8.0
@export var default_zoom: float = 4.5
@export var zoom_speed: float = 0.5

var is_orbiting: bool = false
var target_node: Node3D = null

func _ready() -> void:
	spring_length = default_zoom
	margin = 0.25
	collision_mask = 1 # Collide with Environment (Layer 1)

	if not target_path.is_empty():
		target_node = get_node_or_null(target_path)
	elif get_parent() is Node3D:
		target_node = get_parent()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_RIGHT or event.button_index == MOUSE_BUTTON_MIDDLE:
			is_orbiting = event.pressed
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP:
			spring_length = max(min_zoom, spring_length - zoom_speed)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			spring_length = min(max_zoom, spring_length + zoom_speed)

	elif event is InputEventMouseMotion and is_orbiting:
		orbit(event.relative.x, event.relative.y)

func orbit(dx: float, dy: float) -> void:
	# Yaw (horizontal orbit)
	rotation.y -= dx * mouse_sensitivity
	# Pitch (vertical tilt)
	rotation.x -= dy * mouse_sensitivity
	rotation.x = clamp(rotation.x, deg_to_rad(min_pitch_deg), deg_to_rad(max_pitch_deg))

func _process(delta: float) -> void:
	# Arrow key / controller orbit support
	var key_h = Input.get_axis("ui_left", "ui_right")
	var key_v = Input.get_axis("ui_up", "ui_down")

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
