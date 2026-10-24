extends Area3D
class_name MokshaPeetham3D

## Sacred Moksha Mahapeetham of Satyaloka / Brahmaloka
## Supreme Altar of the Transcendent Apex. Attuning this altar restores the Cosmic Dharma
## and completes the final stage of the Seven-Realm Cosmic Campaign.

@export var shrine_name: String = "Sacred Moksha Mahapeetham of Brahman"
@export var is_consecrated: bool = false
@export var prompt_message: String = "Press E to attune the Moksha Mahapeetham and attain Cosmic Liberation"

var _visual_mesh: Node3D = null
var _halo_light: OmniLight3D = null

signal peetham_consecrated(altar: MokshaPeetham3D)
signal moksha_attained(altar: MokshaPeetham3D)

func _init() -> void:
	add_to_group("interactables")
	add_to_group("shrines")
	add_to_group("peethams")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 2   # Layer 2: Player

func _ready() -> void:
	if has_node("VisualMesh"):
		_visual_mesh = get_node("VisualMesh")
	if has_node("HaloLight"):
		_halo_light = get_node("HaloLight")

	_update_visuals()

func interact(_interactor: Node3D = null) -> void:
	if is_consecrated:
		return

	is_consecrated = true
	_update_visuals()
	peetham_consecrated.emit(self)
	moksha_attained.emit(self)

func _update_visuals() -> void:
	if _halo_light:
		if is_consecrated:
			_halo_light.light_color = Color(1.0, 0.95, 0.8, 1.0)
			_halo_light.light_energy = 8.0
			_halo_light.omni_range = 16.0
		else:
			_halo_light.light_color = Color(0.6, 0.8, 1.0, 1.0)
			_halo_light.light_energy = 2.2
			_halo_light.omni_range = 10.0
