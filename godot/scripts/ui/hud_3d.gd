class_name HUD3D
extends CanvasLayer

## In-game 3D HUD displaying Health, Shards collected, Mission Objective, and Controls guide.

@onready var health_bar: ProgressBar = $MarginContainer/VBoxContainer/TopBar/HealthBar
@onready var health_label: Label = $MarginContainer/VBoxContainer/TopBar/HealthBar/Label
@onready var shards_label: Label = $MarginContainer/VBoxContainer/TopBar/ShardsPanel/ShardsLabel
@onready var objective_label: Label = $MarginContainer/VBoxContainer/ObjectivePanel/ObjectiveLabel
@onready var banner_label: Label = $BannerPanel/BannerLabel
@onready var banner_panel: PanelContainer = $BannerPanel

func _ready() -> void:
	if banner_panel:
		banner_panel.visible = false

func update_health(current: int, max_val: int) -> void:
	if health_bar:
		health_bar.max_value = max_val
		health_bar.value = current
	if health_label:
		health_label.text = "HP: %d / %d" % [current, max_val]

func update_shards(count: int, target: int = 3) -> void:
	if shards_label:
		shards_label.text = "✦ ASTRA SHARDS: %d / %d" % [count, target]

func update_objective(text: String) -> void:
	if objective_label:
		objective_label.text = "MISSION: " + text

func show_banner(text: String, duration: float = 3.5) -> void:
	if not banner_panel or not banner_label:
		return
	banner_label.text = text
	banner_panel.visible = true
	banner_panel.modulate.a = 0.0

	var tween = create_tween()
	tween.tween_property(banner_panel, "modulate:a", 1.0, 0.4)
	tween.tween_interval(duration)
	tween.tween_property(banner_panel, "modulate:a", 0.0, 0.6)
	tween.tween_callback(func(): banner_panel.visible = false)
