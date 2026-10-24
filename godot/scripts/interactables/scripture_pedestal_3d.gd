extends Area3D
class_name ScripturePedestal3D

## Scripture Pedestal / Manuscript Lectern of Maharloka
## Interacting with the ancient codex deciphers Vedic wisdom and unlocks astral archives.

@export var pedestal_id: String = "scripture_1"
@export var scripture_title: String = "Sutra of Maharloka"
@export var is_deciphered: bool = false
@export var prompt_message: String = "Press E to commune with Vedic Scripture"

var _visual_mesh: Node3D = null
var _pedestal_light: OmniLight3D = null

signal scripture_deciphered(pedestal_id: String, title: String)

func _init() -> void:
	add_to_group("interactables")
	add_to_group("scripture_pedestals")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 2   # Layer 2: Player

func _ready() -> void:
	if has_node("VisualMesh"):
		_visual_mesh = get_node("VisualMesh")
	if has_node("PedestalLight"):
		_pedestal_light = get_node("PedestalLight")

	_update_visuals()

func interact(_interactor: Node3D = null) -> void:
	if is_deciphered:
		return

	is_deciphered = true
	_update_visuals()
	scripture_deciphered.emit(pedestal_id, scripture_title)

func _update_visuals() -> void:
	if _pedestal_light:
		if is_deciphered:
			_pedestal_light.light_color = Color(0.3, 0.8, 1.0, 1.0)
			_pedestal_light.light_energy = 4.0
		else:
			_pedestal_light.light_color = Color(0.8, 0.6, 0.3, 1.0)
			_pedestal_light.light_energy = 1.5
