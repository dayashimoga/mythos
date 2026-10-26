class_name DeviTara3D
extends Node3D

signal dialogue_requested(dialogue_id: String)
signal performance_started(anim_name: String)
signal performance_completed(anim_name: String)

@export var guide_name: String = "Devi Tara"
@export var dialogue_id: String = "act1_dandaka_briefing"
@export var auto_orient_to_player: bool = true

var _player_nearby: bool = false
var _player_node: Node3D = null
var _time: float = 0.0
var _base_y: float = 0.0
var _current_anim: String = "idle"
var _is_speaking: bool = false

@onready var visual_root: Node3D = $VisualRoot if has_node("VisualRoot") else self
@onready var prompt_label: Label3D = $PromptLabel if has_node("PromptLabel") else null
@onready var prana_light: OmniLight3D = $VisualRoot/PranaLight if has_node("VisualRoot/PranaLight") else null

var anim_player: AnimationPlayer = null

func _init() -> void:
	add_to_group("npcs")
	add_to_group("interactables")

func _ready() -> void:
	_base_y = position.y
	if prompt_label:
		prompt_label.visible = false
		prompt_label.text = "[E] Converse with Devi Tara"

	_find_anim_player()
	play_idle()

func _find_anim_player() -> void:
	anim_player = find_child("AnimationPlayer", true, false) as AnimationPlayer
	if not anim_player and has_node("VisualRoot/ModelRoot/devi_tara/AnimationPlayer"):
		anim_player = get_node("VisualRoot/ModelRoot/devi_tara/AnimationPlayer") as AnimationPlayer

func _process(delta: float) -> void:
	_time += delta
	# Subtle celestial levitation
	if visual_root:
		visual_root.position.y = sin(_time * 2.0) * 0.12

	# Pulsing prana light
	if prana_light:
		prana_light.light_energy = 2.4 + sin(_time * 3.0) * 0.4

	# Smoothly orient towards player when nearby
	if auto_orient_to_player and _player_nearby and _player_node:
		var target_pos = _player_node.global_position
		target_pos.y = global_position.y
		var dir = (target_pos - global_position).normalized()
		if dir.length_squared() > 0.001:
			var target_rot_y = atan2(dir.x, dir.z)
			rotation.y = lerp_angle(rotation.y, target_rot_y, delta * 3.5)

	# Interaction input
	if _player_nearby and Input.is_action_just_pressed("interact"):
		trigger_dialogue()

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
		if _is_speaking:
			end_speech()

func interact() -> void:
	trigger_dialogue()

func trigger_dialogue() -> void:
	start_speech()
	dialogue_requested.emit(dialogue_id)

func start_speech() -> void:
	_is_speaking = true
	play_talk()

func end_speech() -> void:
	_is_speaking = false
	play_idle()

func play_idle() -> void:
	_play_anim("idle", true)

func play_talk() -> void:
	_play_anim("talk_oracle", true)

func play_bless() -> void:
	_play_anim("bless_astra", false)

func play_warning() -> void:
	_play_anim("warning_alert", false)

func _play_anim(anim_name: String, loop: bool) -> void:
	if not anim_player:
		_find_anim_player()
	if not anim_player:
		return

	if anim_player.has_animation(anim_name):
		_current_anim = anim_name
		var anim = anim_player.get_animation(anim_name)
		if anim:
			anim.loop_mode = Animation.LOOP_LINEAR if loop else Animation.LOOP_NONE
		anim_player.play(anim_name, 0.25)
		performance_started.emit(anim_name)

func get_current_animation() -> String:
	return _current_anim
