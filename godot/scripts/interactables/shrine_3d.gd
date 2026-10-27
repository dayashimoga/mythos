class_name SunShrine3D
extends Area3D

const AudioManager3D = preload("res://scripts/audio/audio_manager_3d.gd")

## 3D Sacred Sun Altar Shrine with spatial proximity prompt, golden flame ignition, and resonance audio.

signal consecrated()
signal shrine_consecrated()
signal shrine_activated()

@export var required_shards: int = 3
var is_ignited: bool = false
var is_consecration_allowed: bool = false
var blocked_reason: String = "Cleanse General Kalanemi at the Watchtower first!"

@onready var prompt_label: Label3D = $PromptLabel
@onready var sun_light: OmniLight3D = $SunLight
@onready var mandala_mesh: Node3D = $MandalaRoot
@onready var flame_particles: GPUParticles3D = get_node_or_null("FlameParticles")

func _ready() -> void:
	if prompt_label:
		prompt_label.visible = false
	if sun_light:
		sun_light.light_energy = 0.5
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

func _process(delta: float) -> void:
	if mandala_mesh:
		mandala_mesh.rotation.y += delta * (1.2 if is_ignited else 0.4)

func _on_body_entered(body: Node3D) -> void:
	if body is PlayerController3D and not is_ignited:
		if prompt_label:
			if not is_consecration_allowed:
				prompt_label.text = "☀️ " + blocked_reason
			else:
				prompt_label.text = "[E] Kindle Sun Altar (%d/%d Shards)" % [body.shards_collected, required_shards]
			prompt_label.visible = true

func _on_body_exited(body: Node3D) -> void:
	if body is PlayerController3D:
		if prompt_label:
			prompt_label.visible = false

func interact(player: PlayerController3D) -> void:
	if is_ignited:
		return

	if not is_consecration_allowed:
		if prompt_label:
			prompt_label.text = "☀️ " + blocked_reason
		return

	if player.shards_collected >= required_shards:
		ignite_shrine()
	else:
		if prompt_label:
			prompt_label.text = "Need %d Astra Shards! (%d/%d)" % [required_shards, player.shards_collected, required_shards]

func ignite_shrine() -> void:
	is_ignited = true
	AudioManager3D.play_3d("altar_attune", global_position)
	if prompt_label:
		prompt_label.text = "✦ Sun Altar Kindled! ✦"
		prompt_label.modulate = Color(1.0, 0.85, 0.2)
	if sun_light:
		var tween = create_tween()
		tween.tween_property(sun_light, "light_energy", 4.5, 1.2)
	consecrated.emit()
	shrine_consecrated.emit()
	shrine_activated.emit()
