extends Area3D
class_name VasukiPeetham3D

@export var shrine_name: String = "Vasuki's Nagamani Peetham"
@export var is_consecrated: bool = false
@export var prompt_message: String = "Press E to consecrate the Serpent Altar"

var _glow_light: OmniLight3D = null
var _gem_mesh: Node3D = null

signal consecrated(peetham: VasukiPeetham3D)

func _init() -> void:
	add_to_group("interactables")
	add_to_group("shrines")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 2   # Layer 2: Player

func _ready() -> void:
	if has_node("GemLight"):
		_glow_light = get_node("GemLight")
	if has_node("VisualMesh"):
		_gem_mesh = get_node("VisualMesh")

func interact(_interactor: Node3D = null) -> void:
	if is_consecrated:
		return

	is_consecrated = true
	if _glow_light:
		_glow_light.light_energy = 4.0
		_glow_light.light_color = Color(0.1, 1.0, 0.7, 1.0)

	consecrated.emit(self)
