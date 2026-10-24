extends Area3D
class_name TapoPeetham3D

## Sacred Tapas Peetham of Janaloka / Tapoloka
## Consecrating the Primordial Fire Altar attunes the eternal flame of Agni.

@export var shrine_name: String = "Sacred Tapas Peetham of Agni Rudra"
@export var is_consecrated: bool = false
@export var prompt_message: String = "Press E to ignite the Eternal Tapas Flame"

var _brazier_light: OmniLight3D = null

signal peetham_consecrated(altar: TapoPeetham3D)

func _init() -> void:
	add_to_group("interactables")
	add_to_group("shrines")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 2   # Layer 2: Player

func _ready() -> void:
	if has_node("BrazierLight"):
		_brazier_light = get_node("BrazierLight")

func interact(_interactor: Node3D = null) -> void:
	if is_consecrated:
		return

	is_consecrated = true
	if _brazier_light:
		_brazier_light.light_energy = 7.0
		_brazier_light.light_color = Color(1.0, 0.65, 0.1, 1.0)

	peetham_consecrated.emit(self)
