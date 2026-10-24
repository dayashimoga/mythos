extends Area3D
class_name VenomRiver3D

@export var damage_per_tick: int = 8
@export var tick_interval: float = 0.8
@export var river_size: Vector3 = Vector3(40.0, 1.0, 14.0)

var submerged_bodies: Dictionary = {} # body -> timer

signal entity_poisoned(body: Node3D, damage: int)

func _init() -> void:
	add_to_group("hazards")
	collision_layer = 16 # Layer 5: Interactables / Hazards
	collision_mask = 6   # Layer 2: Player, Layer 3: Enemies

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

func _physics_process(delta: float) -> void:
	var to_remove = []
	for body in submerged_bodies.keys():
		if not is_instance_valid(body):
			to_remove.append(body)
			continue

		submerged_bodies[body] += delta
		if submerged_bodies[body] >= tick_interval:
			submerged_bodies[body] = 0.0
			_apply_venom(body)

	for b in to_remove:
		submerged_bodies.erase(b)

func _on_body_entered(body: Node3D) -> void:
	if not submerged_bodies.has(body):
		submerged_bodies[body] = 0.0
		_apply_venom(body)

func _on_body_exited(body: Node3D) -> void:
	submerged_bodies.erase(body)

func _apply_venom(body: Node3D) -> void:
	if not is_instance_valid(body):
		return

	if body.has_method("take_damage"):
		body.take_damage(damage_per_tick)
		entity_poisoned.emit(body, damage_per_tick)
