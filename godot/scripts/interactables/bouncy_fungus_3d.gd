extends Area3D
class_name BouncyFungus3D

@export var bounce_force: float = 16.0
@export var cooldown_time: float = 0.35

var _timer: float = 0.0
var _visual_mesh: Node3D = null
var _rebound_tween: Tween = null

signal bounced(body: Node3D, force: float)

func _init() -> void:
	add_to_group("springboards")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 6   # Layer 2: Player, Layer 3: Enemies

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	if has_node("VisualMesh"):
		_visual_mesh = get_node("VisualMesh")

func _physics_process(delta: float) -> void:
	if _timer > 0.0:
		_timer = max(0.0, _timer - delta)

func _on_body_entered(body: Node3D) -> void:
	if _timer > 0.0 or not is_instance_valid(body):
		return

	if body.has_method("apply_bounce_impulse"):
		body.apply_bounce_impulse(bounce_force)
		_trigger_bounce_effect(body)
	elif body is CharacterBody3D:
		body.velocity.y = max(body.velocity.y, bounce_force)
		_trigger_bounce_effect(body)

func _trigger_bounce_effect(body: Node3D) -> void:
	_timer = cooldown_time
	bounced.emit(body, bounce_force)

	if _visual_mesh:
		if _rebound_tween and _rebound_tween.is_valid():
			_rebound_tween.kill()
		_rebound_tween = create_tween()
		_rebound_tween.tween_property(_visual_mesh, "scale", Vector3(1.25, 0.55, 1.25), 0.08)
		_rebound_tween.tween_property(_visual_mesh, "scale", Vector3(0.85, 1.35, 0.85), 0.14)
		_rebound_tween.tween_property(_visual_mesh, "scale", Vector3(1.0, 1.0, 1.0), 0.18)
