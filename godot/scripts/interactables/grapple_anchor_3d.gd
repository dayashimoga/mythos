extends Area3D
class_name GrappleAnchor3D

@export var anchor_id: String = "anchor_1"
@export var detection_radius: float = 28.0

@onready var visual_ring: Node3D = $VisualRing
@onready var glow_core: OmniLight3D = $GlowCore

var is_targeted: bool = false

func _init() -> void:
	add_to_group("grapple_anchors")
	collision_layer = 16 # Layer 5: Interactables
	collision_mask = 2   # Layer 2: Player

func _ready() -> void:
	if visual_ring:
		var tween = create_tween().set_loops()
		tween.tween_property(visual_ring, "rotation:z", PI * 2, 8.0).from(0.0)

func set_targeted(targeted: bool) -> void:
	is_targeted = targeted
	if glow_core:
		glow_core.light_energy = 3.5 if targeted else 1.2
		glow_core.light_color = Color(1.0, 0.85, 0.2) if targeted else Color(0.2, 0.9, 1.0)

func get_pull_target_position() -> Vector3:
	return global_position + Vector3(0, 1.2, 0)
