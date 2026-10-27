class_name AstraShard3D
extends Area3D

const AudioManager3D = preload("res://scripts/audio/audio_manager_3d.gd")

## 3D Floating Astra Shard pickup with continuous rotation, bobbing, and collection detection.

signal collected(shard_name: String)
signal shard_collected()

@export var shard_id: String = "shard_1"
@export var rotation_speed: float = 2.4
@export var bob_amplitude: float = 0.15
@export var bob_frequency: float = 3.0

var base_y: float = 0.0
var elapsed_time: float = 0.0
var is_collected: bool = false

@onready var mesh: Node3D = $MeshInstance3D
@onready var light: OmniLight3D = $OmniLight3D

func _ready() -> void:
	add_to_group("shards")
	base_y = position.y
	elapsed_time = randf() * 10.0
	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	if is_collected:
		return
	elapsed_time += delta
	rotation.y += rotation_speed * delta
	position.y = base_y + sin(elapsed_time * bob_frequency) * bob_amplitude

func _on_body_entered(body: Node3D) -> void:
	if is_collected:
		return
	if body is PlayerController3D:
		is_collected = true
		AudioManager3D.play_3d("crystal_pickup", global_position)
		body.add_shard(1)
		collected.emit(shard_id)
		shard_collected.emit()

		# Collection animation: scale down and dissipate
		var tween = create_tween()
		tween.tween_property(self, "scale", Vector3.ZERO, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
		tween.tween_callback(queue_free)
