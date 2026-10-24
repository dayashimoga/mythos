extends StaticBody3D
class_name BrahmanBridge3D

## Transcendent Light Bridge of Satyaloka / Brahmaloka
## Spans the cosmic void connecting the sacred lotus platforms.
## Materializes into solid crystalline light when activated by Dharmachakra resonance.

@export var bridge_id: String = "bridge_1"
@export var is_manifested: bool = false
@export var length: float = 12.0
@export var width: float = 4.0

var _collision_shape: CollisionShape3D = null
var _visual_mesh: MeshInstance3D = null
var _bridge_light: OmniLight3D = null

signal bridge_manifested(bridge_id: String)

func _init() -> void:
	add_to_group("bridges")
	collision_layer = 1 # Layer 1: Environment
	collision_mask = 0

func _ready() -> void:
	if has_node("CollisionShape3D"):
		_collision_shape = get_node("CollisionShape3D")
	if has_node("VisualMesh"):
		_visual_mesh = get_node("VisualMesh")
	if has_node("BridgeLight"):
		_bridge_light = get_node("BridgeLight")

	_apply_state()

func manifest_bridge() -> void:
	if is_manifested:
		return

	is_manifested = true
	_apply_state()
	bridge_manifested.emit(bridge_id)

func _apply_state() -> void:
	if _collision_shape:
		_collision_shape.set_deferred("disabled", not is_manifested)

	if _visual_mesh and _visual_mesh.material_override:
		var mat = _visual_mesh.material_override as StandardMaterial3D
		if mat:
			if is_manifested:
				mat.albedo_color = Color(1.0, 0.95, 0.8, 0.85)
				mat.emission_enabled = true
				mat.emission = Color(1.0, 0.85, 0.4)
				mat.emission_energy_multiplier = 3.0
			else:
				mat.albedo_color = Color(0.4, 0.6, 1.0, 0.15)
				mat.emission_enabled = true
				mat.emission = Color(0.2, 0.4, 0.8)
				mat.emission_energy_multiplier = 0.4

	if _bridge_light:
		if is_manifested:
			_bridge_light.light_energy = 4.5
			_bridge_light.light_color = Color(1.0, 0.9, 0.5, 1.0)
		else:
			_bridge_light.light_energy = 0.5
			_bridge_light.light_color = Color(0.3, 0.5, 0.9, 1.0)
