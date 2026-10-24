extends Area3D
class_name PrimordialForge3D

## Primordial Anvil Forge of Agni in Tapoloka
## Interacting with the anvil attunes the cosmic fire element and awakens the forge fires.

@export var forge_id: String = "forge_1"
@export var is_attuned: bool = false
@export var prompt_message: String = "Press E to attune the Primordial Anvil Forge"

var _visual_mesh: Node3D = null
var _forge_light: OmniLight3D = null

signal forge_attuned(forge_id: String)

func _init() -> void:
	add_to_group("interactables")
	add_to_group("forges")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 2   # Layer 2: Player

func _ready() -> void:
	if has_node("VisualMesh"):
		_visual_mesh = get_node("VisualMesh")
	if has_node("ForgeLight"):
		_forge_light = get_node("ForgeLight")

	_update_visuals()

func interact(_interactor: Node3D = null) -> void:
	if is_attuned:
		return

	is_attuned = true
	_update_visuals()
	forge_attuned.emit(forge_id)

func _update_visuals() -> void:
	if _forge_light:
		if is_attuned:
			_forge_light.light_color = Color(1.0, 0.75, 0.2, 1.0)
			_forge_light.light_energy = 5.0
		else:
			_forge_light.light_color = Color(1.0, 0.35, 0.1, 1.0)
			_forge_light.light_energy = 1.8
