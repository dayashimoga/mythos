extends Node3D
class_name SolarLightBridge3D

@export var is_active: bool = true
@export var bridge_size: Vector3 = Vector3(8.0, 0.4, 24.0)

var _collision_shape: CollisionShape3D = null
var _mesh_instance: MeshInstance3D = null
var _light: OmniLight3D = null

signal bridge_state_changed(active: bool)

func _init() -> void:
	add_to_group("light_bridges")

func _ready() -> void:
	if has_node("StaticBody3D/CollisionShape3D"):
		_collision_shape = get_node("StaticBody3D/CollisionShape3D")
	if has_node("StaticBody3D/MeshInstance3D"):
		_mesh_instance = get_node("StaticBody3D/MeshInstance3D")
	if has_node("BridgeLight"):
		_light = get_node("BridgeLight")

	_apply_state(is_active)

func activate_bridge() -> void:
	is_active = true
	_apply_state(true)
	bridge_state_changed.emit(true)

func deactivate_bridge() -> void:
	is_active = false
	_apply_state(false)
	bridge_state_changed.emit(false)

func toggle_bridge() -> void:
	if is_active:
		deactivate_bridge()
	else:
		activate_bridge()

func _apply_state(active: bool) -> void:
	if _collision_shape:
		_collision_shape.disabled = not active
	if _mesh_instance:
		_mesh_instance.visible = active
	if _light:
		_light.visible = active
		_light.light_energy = 3.5 if active else 0.0
