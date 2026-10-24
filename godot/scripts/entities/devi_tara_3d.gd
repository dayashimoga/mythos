class_name DeviTara3D
extends Node3D

signal dialogue_requested(dialogue_id: String)

@export var guide_name: String = "Devi Tara"
@export var dialogue_id: String = "act1_dandaka_briefing"

var _player_nearby: bool = false
var _time: float = 0.0
var _base_y: float = 0.0

@onready var visual_root: Node3D = $VisualRoot if has_node("VisualRoot") else self
@onready var aura_ring: MeshInstance3D = $VisualRoot/AuraRing if has_node("VisualRoot/AuraRing") else null
@onready var prompt_label: Label3D = $PromptLabel if has_node("PromptLabel") else null

func _init() -> void:
	add_to_group("npcs")
	add_to_group("interactables")

func _ready() -> void:
	_base_y = position.y
	if prompt_label:
		prompt_label.visible = false
		prompt_label.text = "[E] Converse with Devi Tara"

func _process(delta: float) -> void:
	_time += delta
	# Ethereal floating levitation
	if visual_root:
		visual_root.position.y = sin(_time * 2.2) * 0.14
	# Slowly rotating celestial aura
	if aura_ring:
		aura_ring.rotate_y(delta * 0.45)
		aura_ring.rotate_z(delta * 0.25)
	
	# Check for interaction input when player is in proximity
	if _player_nearby and Input.is_action_just_pressed("interact"):
		trigger_dialogue()

func _on_interaction_area_body_entered(body: Node3D) -> void:
	if body.is_in_group("player"):
		_player_nearby = true
		if prompt_label:
			prompt_label.visible = true

func _on_interaction_area_body_exited(body: Node3D) -> void:
	if body.is_in_group("player"):
		_player_nearby = false
		if prompt_label:
			prompt_label.visible = false

func interact() -> void:
	trigger_dialogue()

func trigger_dialogue() -> void:
	dialogue_requested.emit(dialogue_id)
