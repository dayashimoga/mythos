extends Area3D
class_name MaharMandala3D

## Sacred Mahar Mandala Altar of Maharloka
## Consecrating the Sage Core harmonizes the astral wisdom of the seven rishis.

@export var shrine_name: String = "Sacred Mahar Mandala of Brihaspati"
@export var is_consecrated: bool = false
@export var prompt_message: String = "Press E to attune the Sage Core of Maharloka"

var _core_light: OmniLight3D = null

signal mandala_consecrated(altar: MaharMandala3D)

func _init() -> void:
	add_to_group("interactables")
	add_to_group("shrines")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 2   # Layer 2: Player

func _ready() -> void:
	if has_node("CoreLight"):
		_core_light = get_node("CoreLight")

func interact(_interactor: Node3D = null) -> void:
	if is_consecrated:
		return

	is_consecrated = true
	if _core_light:
		_core_light.light_energy = 6.0
		_core_light.light_color = Color(0.3, 0.8, 1.0, 1.0)

	mandala_consecrated.emit(self)
