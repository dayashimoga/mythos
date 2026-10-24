extends Area3D
class_name VayuTurbine3D

@export var turbine_id: String = "turbine_1"
@export var is_harmonized: bool = false

@onready var visual_model: Node3D = $VisualModel
@onready var turbine_light: OmniLight3D = $TurbineLight

signal turbine_harmonized(id: String)

func _init() -> void:
	add_to_group("vayu_turbines")
	add_to_group("interactables")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 2   # Layer 2: Player

func _ready() -> void:
	if visual_model:
		var tween = create_tween().set_loops()
		tween.tween_property(visual_model, "rotation:y", PI * 2, 6.0).from(0.0)

func interact(_player: Node3D = null) -> void:
	if is_harmonized:
		return
	is_harmonized = true
	if turbine_light:
		turbine_light.light_color = Color(1.0, 0.85, 0.2)
		turbine_light.light_energy = 5.0

	turbine_harmonized.emit(turbine_id)

func harmonize() -> void:
	interact(null)
