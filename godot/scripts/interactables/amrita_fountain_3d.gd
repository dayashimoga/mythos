class_name AmritaFountain3D
extends Node3D

signal fountain_used(restored_health: float, restored_prana: float)

@export var heal_amount: float = 100.0
@export var prana_amount: float = 100.0

var _player_nearby: bool = false
var _player_node: Node3D = null
var _time: float = 0.0

@onready var prompt_label: Label3D = $PromptLabel if has_node("PromptLabel") else null
@onready var water_light: OmniLight3D = $WaterLight if has_node("WaterLight") else null

func _ready() -> void:
	add_to_group("interactables")
	if prompt_label:
		prompt_label.visible = false

func _process(delta: float) -> void:
	_time += delta
	if water_light:
		water_light.light_energy = 1.8 + sin(_time * 3.5) * 0.4
	
	if _player_nearby and Input.is_action_just_pressed("interact"):
		consecrate()

func _on_interaction_area_body_entered(body: Node3D) -> void:
	if body.is_in_group("player"):
		_player_nearby = true
		_player_node = body
		if prompt_label:
			prompt_label.visible = true

func _on_interaction_area_body_exited(body: Node3D) -> void:
	if body.is_in_group("player"):
		_player_nearby = false
		_player_node = null
		if prompt_label:
			prompt_label.visible = false

func interact() -> void:
	consecrate()

func consecrate() -> void:
	if _player_node:
		if "health" in _player_node:
			_player_node.health = min(_player_node.health + heal_amount, 100.0)
		if "prana" in _player_node:
			_player_node.prana = min(_player_node.prana + prana_amount, 100.0)
	
	fountain_used.emit(heal_amount, prana_amount)
	if prompt_label:
		prompt_label.text = "Amrita Bestowed!"
		if get_tree():
			await get_tree().create_timer(1.8).timeout
			if prompt_label and _player_nearby:
				prompt_label.text = "[E] Drink Amrita Nectar"
