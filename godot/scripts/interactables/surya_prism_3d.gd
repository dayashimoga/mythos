extends Area3D
class_name SuryaPrism3D

@export var prism_id: String = "prism_1"
@export var current_step: int = 0
@export var target_step: int = 2
@export var is_harmonized: bool = false
@export var prompt_message: String = "Press E to align Surya Prism"

var _visual_mesh: Node3D = null
var _prism_light: OmniLight3D = null

signal prism_rotated(prism_id: String, step: int)
signal prism_harmonized(prism_id: String)

func _init() -> void:
	add_to_group("interactables")
	add_to_group("surya_prisms")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 2   # Layer 2: Player

func _ready() -> void:
	if has_node("VisualMesh"):
		_visual_mesh = get_node("VisualMesh")
	if has_node("PrismLight"):
		_prism_light = get_node("PrismLight")

	_apply_visual_rotation(false)
	_check_alignment()

func interact(_interactor: Node3D = null) -> void:
	if is_harmonized:
		return

	current_step = (current_step + 1) % 4
	_apply_visual_rotation(true)
	prism_rotated.emit(prism_id, current_step)
	_check_alignment()

func _apply_visual_rotation(animated: bool = true) -> void:
	var target_rot_y = current_step * (PI / 2.0)
	if _visual_mesh:
		if animated and is_inside_tree():
			var tween = create_tween()
			tween.tween_property(_visual_mesh, "rotation:y", target_rot_y, 0.25).set_trans(Tween.TRANS_QUAD)
		else:
			_visual_mesh.rotation.y = target_rot_y

func _check_alignment() -> void:
	if current_step == target_step:
		is_harmonized = true
		if _prism_light:
			_prism_light.light_color = Color(1.0, 0.85, 0.2, 1.0)
			_prism_light.light_energy = 4.5
		prism_harmonized.emit(prism_id)
