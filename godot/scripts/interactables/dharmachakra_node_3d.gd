extends Area3D
class_name DharmachakraNode3D

## Cosmic Dharmachakra Resonator of Satyaloka / Brahmaloka
## Represents a sacred cosmic wheel node that aligns the cosmic law of Dharma.
## When resonated/interacted, the wheel turns, radiates golden illumination, and powers the Brahman Bridges.

@export var node_id: String = "chakra_1"
@export var is_aligned: bool = false
@export var prompt_message: String = "Press E to align the Cosmic Dharmachakra Resonator"
@export var rotation_speed: float = 1.5

var _visual_mesh: Node3D = null
var _chakra_light: OmniLight3D = null

signal chakra_aligned(node_id: String)

func _init() -> void:
	add_to_group("interactables")
	add_to_group("dharmachakras")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 2   # Layer 2: Player

func _ready() -> void:
	if has_node("VisualMesh"):
		_visual_mesh = get_node("VisualMesh")
	if has_node("ChakraLight"):
		_chakra_light = get_node("ChakraLight")

	_update_visuals()

func _process(delta: float) -> void:
	if _visual_mesh:
		var speed_mult = 2.5 if is_aligned else 0.5
		_visual_mesh.rotate_y(rotation_speed * speed_mult * delta)

func interact(_interactor: Node3D = null) -> void:
	if is_aligned:
		return

	is_aligned = true
	_update_visuals()
	chakra_aligned.emit(node_id)

func _update_visuals() -> void:
	if _chakra_light:
		if is_aligned:
			_chakra_light.light_color = Color(1.0, 0.85, 0.3, 1.0)
			_chakra_light.light_energy = 5.5
		else:
			_chakra_light.light_color = Color(0.4, 0.7, 1.0, 1.0)
			_chakra_light.light_energy = 1.8
