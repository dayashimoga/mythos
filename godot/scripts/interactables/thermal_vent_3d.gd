extends Area3D
class_name ThermalVent3D

@export var updraft_force: float = 12.0
@export var vent_radius: float = 6.0
@export var vent_height: float = 24.0

var active_gliders: Array[Node3D] = []

func _init() -> void:
	add_to_group("thermal_vents")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 2   # Layer 2: Player

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

func _physics_process(delta: float) -> void:
	for body in active_gliders:
		if is_instance_valid(body) and body.has_method("apply_updraft"):
			body.apply_updraft(updraft_force * delta)

func _on_body_entered(body: Node3D) -> void:
	if not active_gliders.has(body):
		active_gliders.append(body)

func _on_body_exited(body: Node3D) -> void:
	active_gliders.erase(body)
