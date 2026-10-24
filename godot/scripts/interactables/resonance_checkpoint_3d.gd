class_name ResonanceCheckpoint3D
extends Node3D

signal checkpoint_activated(checkpoint_id: String, checkpoint_pos: Vector3)

@export var checkpoint_id: String = "checkpoint_dandaka_ridge"
@export var checkpoint_name: String = "Tapas Ridge Shrine"

var is_activated: bool = false
var _player_nearby: bool = false
var _time: float = 0.0

@onready var prompt_label: Label3D = $PromptLabel if has_node("PromptLabel") else null
@onready var beacon_light: SpotLight3D = $BeaconLight if has_node("BeaconLight") else null
@onready var core_light: OmniLight3D = $CoreLight if has_node("CoreLight") else null
@onready var rune_mesh: MeshInstance3D = $RuneMesh if has_node("RuneMesh") else null

func _ready() -> void:
	add_to_group("checkpoints")
	add_to_group("interactables")
	if prompt_label:
		prompt_label.visible = false
	if beacon_light:
		beacon_light.visible = false

func _process(delta: float) -> void:
	_time += delta
	if is_activated and core_light:
		core_light.light_energy = 2.5 + sin(_time * 4.0) * 0.6
	
	if _player_nearby and not is_activated and Input.is_action_just_pressed("interact"):
		activate_checkpoint()

func _on_interaction_area_body_entered(body: Node3D) -> void:
	if body.is_in_group("player"):
		_player_nearby = true
		if prompt_label and not is_activated:
			prompt_label.visible = true

func _on_interaction_area_body_exited(body: Node3D) -> void:
	if body.is_in_group("player"):
		_player_nearby = false
		if prompt_label:
			prompt_label.visible = false

func interact() -> void:
	if not is_activated:
		activate_checkpoint()

func activate_checkpoint() -> void:
	is_activated = true
	if beacon_light:
		beacon_light.visible = true
	if core_light:
		core_light.light_color = Color(1.0, 0.85, 0.3)
		core_light.light_energy = 3.5
	if prompt_label:
		prompt_label.text = "Resonance Attuned: " + checkpoint_name
		prompt_label.visible = true
	
	var emit_pos: Vector3 = global_position if is_inside_tree() else position
	checkpoint_activated.emit(checkpoint_id, emit_pos)
