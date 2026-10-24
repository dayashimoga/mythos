class_name HUD3D
extends CanvasLayer

## Production 3D HUD & Interface Suite
## Manages Player Vitality, Quest Objectives, Astra Shards, Boss Health, Dialogue Modals,
## Combat Lock-On, and Defeat/Victory Overlays.

signal dialogue_advanced()
signal retry_requested()
signal ascend_requested()

@onready var health_bar: ProgressBar = $MarginContainer/VBoxContainer/TopBar/HealthBar if has_node("MarginContainer/VBoxContainer/TopBar/HealthBar") else null
@onready var health_label: Label = $MarginContainer/VBoxContainer/TopBar/HealthBar/Label if has_node("MarginContainer/VBoxContainer/TopBar/HealthBar/Label") else null
@onready var shards_label: Label = $MarginContainer/VBoxContainer/TopBar/ShardsPanel/ShardsLabel if has_node("MarginContainer/VBoxContainer/TopBar/ShardsPanel/ShardsLabel") else null
@onready var objective_label: Label = $MarginContainer/VBoxContainer/ObjectivePanel/ObjectiveLabel if has_node("MarginContainer/VBoxContainer/ObjectivePanel/ObjectiveLabel") else null
@onready var target_lock_panel: PanelContainer = $MarginContainer/VBoxContainer/TargetLockPanel if has_node("MarginContainer/VBoxContainer/TargetLockPanel") else null
@onready var target_label: Label = $MarginContainer/VBoxContainer/TargetLockPanel/Margin/HBox/TargetLabel if has_node("MarginContainer/VBoxContainer/TargetLockPanel/Margin/HBox/TargetLabel") else null
@onready var banner_label: Label = $BannerPanel/BannerLabel if has_node("BannerPanel/BannerLabel") else null
@onready var banner_panel: PanelContainer = $BannerPanel if has_node("BannerPanel") else null
@onready var btn_studio: Button = $MarginContainer/VBoxContainer/TopBar/BtnStudio if has_node("MarginContainer/VBoxContainer/TopBar/BtnStudio") else null
@onready var btn_toggle_touch: Button = $MarginContainer/VBoxContainer/TopBar/BtnToggleTouch if has_node("MarginContainer/VBoxContainer/TopBar/BtnToggleTouch") else null
@onready var touch_controls: Control = $TouchControls if has_node("TouchControls") else null

# Stage E Additions: Boss Bar, Dialogue Modal, Defeat & Victory Overlays
@onready var boss_panel: PanelContainer = $BossPanel if has_node("BossPanel") else null
@onready var boss_name_label: Label = $BossPanel/VBox/BossNameLabel if has_node("BossPanel/VBox/BossNameLabel") else null
@onready var boss_health_bar: ProgressBar = $BossPanel/VBox/BossHealthBar if has_node("BossPanel/VBox/BossHealthBar") else null
@onready var boss_health_label: Label = $BossPanel/VBox/BossHealthBar/Label if has_node("BossPanel/VBox/BossHealthBar/Label") else null

@onready var dialogue_panel: PanelContainer = $DialoguePanel if has_node("DialoguePanel") else null
@onready var dialogue_speaker: Label = $DialoguePanel/Margin/VBox/SpeakerLabel if has_node("DialoguePanel/Margin/VBox/SpeakerLabel") else null
@onready var dialogue_role: Label = $DialoguePanel/Margin/VBox/RoleLabel if has_node("DialoguePanel/Margin/VBox/RoleLabel") else null
@onready var dialogue_text: Label = $DialoguePanel/Margin/VBox/TextLabel if has_node("DialoguePanel/Margin/VBox/TextLabel") else null
@onready var btn_dialogue_next: Button = $DialoguePanel/Margin/VBox/BtnNext if has_node("DialoguePanel/Margin/VBox/BtnNext") else null

@onready var defeat_overlay: Control = $DefeatOverlay if has_node("DefeatOverlay") else null
@onready var btn_retry: Button = $DefeatOverlay/VBox/BtnRetry if has_node("DefeatOverlay/VBox/BtnRetry") else null

@onready var victory_overlay: Control = $VictoryOverlay if has_node("VictoryOverlay") else null
@onready var btn_ascend: Button = $VictoryOverlay/VBox/BtnAscend if has_node("VictoryOverlay/VBox/BtnAscend") else null

var player_ref: PlayerController3D = null
var _on_dialogue_callback: Callable = Callable()

func _ready() -> void:
	if banner_panel:
		banner_panel.visible = false
	if target_lock_panel:
		target_lock_panel.visible = false
	if boss_panel:
		boss_panel.visible = false
	if dialogue_panel:
		dialogue_panel.visible = false
	if defeat_overlay:
		defeat_overlay.visible = false
	if victory_overlay:
		victory_overlay.visible = false

	if btn_studio:
		btn_studio.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/studio/CharacterStudio3D.tscn"))

	if btn_toggle_touch and touch_controls:
		btn_toggle_touch.pressed.connect(func():
			touch_controls.visible = not touch_controls.visible
			btn_toggle_touch.text = "[ Touch: ON ]" if touch_controls.visible else "[ Touch Controls ]"
		)

	if btn_dialogue_next:
		btn_dialogue_next.pressed.connect(_advance_dialogue)

	if btn_retry:
		btn_retry.pressed.connect(func():
			hide_defeat_overlay()
			retry_requested.emit()
		)

	if btn_ascend:
		btn_ascend.pressed.connect(func():
			ascend_requested.emit()
			get_tree().change_scene_to_file("res://scenes/levels/AntarikshaSkyRealm3D.tscn")
		)

	# Wire Touch buttons
	var btn_atk = find_child("BtnTouchAttack", true, false)
	var btn_jump = find_child("BtnTouchJump", true, false)
	var btn_dash = find_child("BtnTouchDash", true, false)
	var btn_guard = find_child("BtnTouchGuard", true, false)
	var btn_interact = find_child("BtnTouchInteract", true, false)

	if btn_atk:
		btn_atk.pressed.connect(func():
			if player_ref: player_ref._trigger_attack()
		)
	if btn_jump:
		btn_jump.pressed.connect(func():
			if player_ref and (player_ref.is_on_floor() or player_ref.coyote_timer > 0.0):
				player_ref.velocity.y = player_ref.jump_velocity
		)
	if btn_dash:
		btn_dash.pressed.connect(func():
			if player_ref: player_ref._trigger_dash()
		)
	if btn_guard:
		btn_guard.pressed.connect(func():
			if player_ref: player_ref.is_guarding = not player_ref.is_guarding
		)
	if btn_interact:
		btn_interact.pressed.connect(func():
			if dialogue_panel and dialogue_panel.visible:
				_advance_dialogue()
			elif player_ref:
				player_ref._trigger_interaction()
		)

func _unhandled_input(event: InputEvent) -> void:
	if dialogue_panel and dialogue_panel.visible:
		if event.is_action_pressed("ui_accept") or (event is InputEventKey and event.pressed and event.keycode in [KEY_SPACE, KEY_E, KEY_ENTER]):
			_advance_dialogue()
			get_viewport().set_input_as_handled()
	elif defeat_overlay and defeat_overlay.visible:
		if event is InputEventKey and event.pressed and event.keycode == KEY_R:
			hide_defeat_overlay()
			retry_requested.emit()
			get_viewport().set_input_as_handled()
	elif victory_overlay and victory_overlay.visible:
		if event is InputEventKey and event.pressed and event.keycode in [KEY_E, KEY_ENTER]:
			ascend_requested.emit()
			get_tree().change_scene_to_file("res://scenes/levels/AntarikshaSkyRealm3D.tscn")
			get_viewport().set_input_as_handled()

func set_player(player: PlayerController3D) -> void:
	player_ref = player
	if player_ref and player_ref.camera_arm:
		if player_ref.camera_arm.has_signal("target_locked"):
			player_ref.camera_arm.target_locked.connect(_on_target_locked)
		if player_ref.camera_arm.has_signal("target_unlocked"):
			player_ref.camera_arm.target_unlocked.connect(_on_target_unlocked)

func _on_target_locked(target: Node3D) -> void:
	if target_lock_panel and target_label:
		var t_name = target.name.to_upper().replace("3D", "").replace("_", " ")
		target_label.text = "⌖ TARGET LOCKED: " + t_name
		target_lock_panel.visible = true

func _on_target_unlocked() -> void:
	if target_lock_panel:
		target_lock_panel.visible = false

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

# ---------------------------------------------------------
# Stage E Dialogue Modal System
# ---------------------------------------------------------

func show_dialogue(speaker: String, role: String, text: String, on_advance: Callable = Callable()) -> void:
	_on_dialogue_callback = on_advance
	if dialogue_speaker:
		dialogue_speaker.text = speaker
	if dialogue_role:
		dialogue_role.text = role
	if dialogue_text:
		dialogue_text.text = text
	if dialogue_panel:
		dialogue_panel.visible = true

func _advance_dialogue() -> void:
	if _on_dialogue_callback.is_valid():
		var cb = _on_dialogue_callback
		_on_dialogue_callback = Callable()
		cb.call()
	dialogue_advanced.emit()

func hide_dialogue() -> void:
	if dialogue_panel:
		dialogue_panel.visible = false

# ---------------------------------------------------------
# Stage E Boss Health Bar
# ---------------------------------------------------------

func show_boss_bar(boss_name: String, current_hp: int, max_hp: int) -> void:
	if boss_name_label:
		boss_name_label.text = "☠ " + boss_name.to_upper() + " ☠"
	update_boss_health(current_hp, max_hp)
	if boss_panel:
		boss_panel.visible = true

func update_boss_health(current_hp: int, max_hp: int) -> void:
	if boss_health_bar:
		boss_health_bar.max_value = max_hp
		boss_health_bar.value = current_hp
	if boss_health_label:
		boss_health_label.text = "HP: %d / %d" % [current_hp, max_hp]

func hide_boss_bar() -> void:
	if boss_panel:
		boss_panel.visible = false

# ---------------------------------------------------------
# Stage E Defeat & Victory Overlays
# ---------------------------------------------------------

func show_defeat_overlay() -> void:
	if defeat_overlay:
		defeat_overlay.visible = true

func hide_defeat_overlay() -> void:
	if defeat_overlay:
		defeat_overlay.visible = false

func show_victory_overlay(shards: int = 5, clear_time_sec: float = 120.0) -> void:
	if victory_overlay:
		var summary = victory_overlay.find_child("SummaryLabel", true, false) as Label
		if summary:
			summary.text = "✦ All %d Astra Shards Purified\n✦ General Kalanemi Cleansed\n✦ Time: %.1fs  |  Rank: S (Solar Champion)" % [shards, clear_time_sec]
		victory_overlay.visible = true
