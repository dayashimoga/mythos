extends Area3D
class_name SuryaMahapeetham3D

@export var shrine_name: String = "Grand Solar Mahapeetham of Savitr"
@export var is_consecrated: bool = false
@export var prompt_message: String = "Press E to consecrate the Grand Solar Mahapeetham"

var _core_light: OmniLight3D = null

signal mahapeetham_consecrated(altar: SuryaMahapeetham3D)

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
		_core_light.light_color = Color(1.0, 0.9, 0.4, 1.0)

	mahapeetham_consecrated.emit(self)
