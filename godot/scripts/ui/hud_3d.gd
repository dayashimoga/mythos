class_name HUD3D
extends CanvasLayer

## Production 3D HUD & Interface Suite
## Manages Player Vitality (HP & Prana), Active Weapon Badge, Compass & 3D Waypoint Navigation,
## Interactive First-Time Tutorial Onboarding, Quest Objectives, Contextual Prompts, Boss Health,
## Dialogue Modals, Pause Menu Suite, Dev Drawer, Subtitles, and Defeat/Victory Overlays.

signal dialogue_advanced()
signal retry_requested()
signal ascend_requested()
signal menu_toggled(is_open: bool)

const PauseMenuScript = preload("res://scripts/ui/pause_menu_3d.gd")
const TutorialManagerScript = preload("res://scripts/ui/tutorial_manager_3d.gd")

# Player Vitality & Indicators
@onready var health_bar: ProgressBar = find_child("HealthBar", true, false) as ProgressBar
@onready var health_label: Label = find_child("HealthLabel", true, false) as Label
@onready var energy_bar: ProgressBar = find_child("EnergyBar", true, false) as ProgressBar
@onready var energy_label: Label = find_child("EnergyLabel", true, false) as Label
@onready var weapon_badge_label: Label = find_child("WeaponBadgeLabel", true, false) as Label
@onready var compass_label: Label = find_child("CompassLabel", true, false) as Label
@onready var shards_label: Label = find_child("ShardsLabel", true, false) as Label
@onready var objective_label: Label = find_child("ObjectiveLabel", true, false) as Label
@onready var target_lock_panel: PanelContainer = find_child("TargetLockPanel", true, false) as PanelContainer
@onready var target_label: Label = find_child("TargetLabel", true, false) as Label
@onready var banner_label: Label = find_child("BannerLabel", true, false) as Label
@onready var banner_panel: PanelContainer = find_child("BannerPanel", true, false) as PanelContainer

# Navigation & Pause Menu
@onready var pause_menu: Control = find_child("PauseMenu", true, false) as Control
@onready var btn_menu: Button = find_child("BtnMenu", true, false) as Button

# Dev Drawer & Controls Panel
@onready var btn_dev_toggle: Button = find_child("BtnDevToggle", true, false) as Button
@onready var dev_drawer: PanelContainer = find_child("DevDrawer", true, false) as PanelContainer
@onready var btn_studio: Button = find_child("BtnStudio", true, false) as Button
@onready var btn_toggle_touch: Button = find_child("BtnToggleTouch", true, false) as Button
@onready var touch_controls: Control = find_child("TouchControls", true, false) as Control
@onready var controls_panel: PanelContainer = find_child("ControlsPanel", true, false) as PanelContainer

# Interactive Tutorial Onboarding
@onready var tutorial_panel: PanelContainer = find_child("TutorialPanel", true, false) as PanelContainer
@onready var tutorial_title_label: Label = find_child("TutorialTitleLabel", true, false) as Label
@onready var tutorial_step_label: Label = find_child("TutorialStepLabel", true, false) as Label
@onready var tutorial_desc_label: Label = find_child("TutorialDescLabel", true, false) as Label
@onready var tutorial_keycap_label: Label = find_child("TutorialKeycapLabel", true, false) as Label
var tutorial_manager: RefCounted = null

# Screen-Space 3D Waypoint Marker
@onready var waypoint_marker: Control = find_child("WaypointMarker", true, false) as Control
@onready var waypoint_dist_label: Label = find_child("WaypointDistanceLabel", true, false) as Label
@onready var waypoint_name_label: Label = find_child("WaypointNameLabel", true, false) as Label

# Contextual Interaction Prompt
@onready var context_prompt_panel: PanelContainer = find_child("ContextPromptPanel", true, false) as PanelContainer
@onready var context_prompt_label: Label = find_child("ContextPromptLabel", true, false) as Label

# Subtitles
@onready var subtitle_panel: PanelContainer = find_child("SubtitlePanel", true, false) as PanelContainer
@onready var subtitle_label: Label = find_child("SubtitleLabel", true, false) as Label

# Boss Bar, Dialogue Modal, Defeat & Victory Overlays
@onready var boss_panel: PanelContainer = find_child("BossPanel", true, false) as PanelContainer
@onready var boss_name_label: Label = find_child("BossNameLabel", true, false) as Label
@onready var boss_health_bar: ProgressBar = find_child("BossHealthBar", true, false) as ProgressBar
@onready var boss_health_label: Label = find_child("BossHealthLabel", true, false) as Label

@onready var dialogue_panel: PanelContainer = find_child("DialoguePanel", true, false) as PanelContainer
@onready var dialogue_speaker: Label = find_child("SpeakerLabel", true, false) as Label
@onready var dialogue_role: Label = find_child("RoleLabel", true, false) as Label
@onready var dialogue_text: Label = find_child("TextLabel", true, false) as Label
@onready var btn_dialogue_next: Button = find_child("BtnNext", true, false) as Button

@onready var defeat_overlay: Control = find_child("DefeatOverlay", true, false) as Control
@onready var btn_retry: Button = find_child("BtnRetry", true, false) as Button

@onready var victory_overlay: Control = find_child("VictoryOverlay", true, false) as Control
@onready var btn_ascend: Button = find_child("BtnAscend", true, false) as Button

var player_ref: PlayerController3D = null
var quest_mgr_ref: QuestManager = null
var current_realm_name: String = "Bhumi"
var _on_dialogue_callback: Callable = Callable()
var next_realm_scene_path: String = "res://scenes/levels/AntarikshaSkyRealm3D.tscn"

# Waypoint Navigation target
var waypoint_target_pos: Vector3 = Vector3.ZERO
var waypoint_label_text: String = ""
var has_waypoint: bool = false
var prompt_anim_time: float = 0.0
var subtitle_timer: float = 0.0

func _ready() -> void:
	_ensure_node_references()
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
	if context_prompt_panel:
		context_prompt_panel.visible = false
	if subtitle_panel:
		subtitle_panel.visible = false
	if dev_drawer:
		dev_drawer.visible = false
	if controls_panel:
		controls_panel.visible = false
	if waypoint_marker:
		waypoint_marker.visible = false

	_setup_tutorial_manager()

	if btn_menu:
		btn_menu.pressed.connect(func():
			_toggle_pause_menu()
		)

	if btn_dev_toggle:
		btn_dev_toggle.pressed.connect(toggle_dev_drawer)

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
			if not next_realm_scene_path.is_empty():
				get_tree().change_scene_to_file(next_realm_scene_path)
		)

	if pause_menu:
		pause_menu.tutorial_reset_requested.connect(func():
			if tutorial_manager:
				tutorial_manager.restart_tutorial()
		)
		pause_menu.tutorial_skip_requested.connect(func():
			if tutorial_manager:
				tutorial_manager.skip_tutorial()
		)

	# Wire Touch buttons
	var btn_atk = find_child("BtnTouchAttack", true, false)
	var btn_jump = find_child("BtnTouchJump", true, false)
	var btn_dash = find_child("BtnTouchDash", true, false)
	var btn_guard = find_child("BtnTouchGuard", true, false)
	var btn_interact = find_child("BtnTouchInteract", true, false)

	if btn_atk:
		btn_atk.pressed.connect(func():
			if tutorial_manager: tutorial_manager.notify_input_device(TutorialManagerScript.InputDevice.TOUCH)
			if player_ref: player_ref._trigger_attack()
		)
	if btn_jump:
		btn_jump.pressed.connect(func():
			if tutorial_manager: tutorial_manager.notify_input_device(TutorialManagerScript.InputDevice.TOUCH)
			if player_ref and (player_ref.is_on_floor() or player_ref.coyote_timer > 0.0):
				player_ref.velocity.y = player_ref.jump_velocity
				if player_ref.has_signal("player_action_performed"):
					player_ref.player_action_performed.emit("jump")
		)
	if btn_dash:
		btn_dash.pressed.connect(func():
			if tutorial_manager: tutorial_manager.notify_input_device(TutorialManagerScript.InputDevice.TOUCH)
			if player_ref: player_ref._trigger_dash()
		)
	if btn_guard:
		btn_guard.pressed.connect(func():
			if tutorial_manager: tutorial_manager.notify_input_device(TutorialManagerScript.InputDevice.TOUCH)
			if player_ref: player_ref.is_guarding = not player_ref.is_guarding
		)
	if btn_interact:
		btn_interact.pressed.connect(func():
			if tutorial_manager: tutorial_manager.notify_input_device(TutorialManagerScript.InputDevice.TOUCH)
			if dialogue_panel and dialogue_panel.visible:
				_advance_dialogue()
			elif player_ref:
				player_ref._trigger_interaction()
		)

func _ensure_node_references() -> void:
	if not health_bar: health_bar = find_child("HealthBar", true, false) as ProgressBar
	if not health_label: health_label = find_child("HealthLabel", true, false) as Label
	if not energy_bar: energy_bar = find_child("EnergyBar", true, false) as ProgressBar
	if not energy_label: energy_label = find_child("EnergyLabel", true, false) as Label
	if not weapon_badge_label: weapon_badge_label = find_child("WeaponBadgeLabel", true, false) as Label
	if not compass_label: compass_label = find_child("CompassLabel", true, false) as Label
	if not shards_label: shards_label = find_child("ShardsLabel", true, false) as Label
	if not objective_label: objective_label = find_child("ObjectiveLabel", true, false) as Label
	if not pause_menu: pause_menu = find_child("PauseMenu", true, false) as Control
	if not controls_panel: controls_panel = find_child("ControlsPanel", true, false) as PanelContainer
	if not tutorial_panel: tutorial_panel = find_child("TutorialPanel", true, false) as PanelContainer
	if not tutorial_title_label: tutorial_title_label = find_child("TutorialTitleLabel", true, false) as Label
	if not tutorial_step_label: tutorial_step_label = find_child("TutorialStepLabel", true, false) as Label
	if not tutorial_desc_label: tutorial_desc_label = find_child("TutorialDescLabel", true, false) as Label
	if not tutorial_keycap_label: tutorial_keycap_label = find_child("TutorialKeycapLabel", true, false) as Label
	if not waypoint_marker: waypoint_marker = find_child("WaypointMarker", true, false) as Control
	if not waypoint_dist_label: waypoint_dist_label = find_child("WaypointDistanceLabel", true, false) as Label
	if not waypoint_name_label: waypoint_name_label = find_child("WaypointNameLabel", true, false) as Label
	if not context_prompt_panel: context_prompt_panel = find_child("ContextPromptPanel", true, false) as PanelContainer
	if not context_prompt_label: context_prompt_label = find_child("ContextPromptLabel", true, false) as Label
	if not subtitle_panel: subtitle_panel = find_child("SubtitlePanel", true, false) as PanelContainer
	if not subtitle_label: subtitle_label = find_child("SubtitleLabel", true, false) as Label

func _setup_tutorial_manager() -> void:
	if not tutorial_manager:
		tutorial_manager = TutorialManagerScript.new()
		tutorial_manager.step_changed.connect(_on_tutorial_step_changed)
		tutorial_manager.tutorial_finished.connect(_on_tutorial_finished)

func _on_tutorial_step_changed(step_id: int, title: String, instruction: String, keycap: String) -> void:
	if not tutorial_panel:
		return
	if tutorial_title_label:
		tutorial_title_label.text = title
	if tutorial_desc_label:
		tutorial_desc_label.text = instruction
	if tutorial_keycap_label:
		tutorial_keycap_label.text = keycap
	if tutorial_step_label:
		tutorial_step_label.text = "Action %d of 8  •  [ESC: Skip]" % step_id
	tutorial_panel.visible = true

func _on_tutorial_finished() -> void:
	if tutorial_panel:
		var tween = create_tween()
		tween.tween_property(tutorial_panel, "modulate:a", 0.0, 0.4)
		tween.tween_callback(func():
			tutorial_panel.visible = false
			tutorial_panel.modulate.a = 1.0
		)
	show_banner("✦ ONBOARDING COMPLETE: Walk with Surya's grace! ✦", 3.0)

func _process(delta: float) -> void:
	# 1. Update Compass & Waypoint Needle
	_update_compass_navigation()

	# 2. Update 3D Screen-Space Waypoint Marker Projection & Clamping
	_update_waypoint_projection()

	# 3. Pulse Context Prompt
	if context_prompt_panel and context_prompt_panel.visible:
		prompt_anim_time += delta * 4.0
		var pulse = 0.85 + sin(prompt_anim_time) * 0.15
		context_prompt_panel.modulate.a = pulse

	# 4. Handle Subtitle Decay
	if subtitle_panel and subtitle_panel.visible:
		subtitle_timer -= delta
		if subtitle_timer <= 0.0:
			subtitle_panel.visible = false

func _update_waypoint_projection() -> void:
	if not waypoint_marker:
		return

	if not has_waypoint:
		waypoint_marker.visible = false
		return

	var cam = get_viewport().get_camera_3d() if is_inside_tree() else null
	if not cam:
		waypoint_marker.visible = false
		return

	var is_behind = cam.is_position_behind(waypoint_target_pos)
	var screen_pos = cam.unproject_position(waypoint_target_pos)
	var vp_size = get_viewport().get_visible_rect().size
	var pad = 42.0

	if is_behind:
		screen_pos = vp_size - screen_pos

	var clamped_x = clamp(screen_pos.x, pad, vp_size.x - pad)
	var clamped_y = clamp(screen_pos.y, pad, vp_size.y - pad)

	waypoint_marker.position = Vector2(clamped_x, clamped_y) - waypoint_marker.size * 0.5
	waypoint_marker.visible = true

	var player_pos = player_ref.global_position if (player_ref and player_ref.is_inside_tree()) else Vector3.ZERO
	var dist = player_pos.distance_to(waypoint_target_pos)
	if waypoint_dist_label:
		waypoint_dist_label.text = "%dm" % int(dist)

func _update_compass_navigation() -> void:
	if not compass_label:
		return

	var cam_yaw = 0.0
	var player_pos = Vector3.ZERO

	if player_ref and is_instance_valid(player_ref):
		player_pos = player_ref.global_position if player_ref.is_inside_tree() else player_ref.position
		if player_ref.camera_arm:
			cam_yaw = player_ref.camera_arm.rotation.y
	else:
		var cam = get_viewport().get_camera_3d() if is_inside_tree() else null
		if cam:
			cam_yaw = cam.rotation.y

	# Calculate heading angle
	var heading_deg = fposmod(rad_to_deg(-cam_yaw), 360.0)
	var card = "N"
	if heading_deg >= 337.5 or heading_deg < 22.5:
		card = "N"
	elif heading_deg < 67.5:
		card = "NE"
	elif heading_deg < 112.5:
		card = "E"
	elif heading_deg < 157.5:
		card = "SE"
	elif heading_deg < 202.5:
		card = "S"
	elif heading_deg < 247.5:
		card = "SW"
	elif heading_deg < 292.5:
		card = "W"
	else:
		card = "NW"

	if has_waypoint:
		var to_wp = (waypoint_target_pos - player_pos)
		var dist = to_wp.length()
		var target_angle = atan2(to_wp.x, to_wp.z)
		var diff = wrapf(target_angle - (-cam_yaw), -PI, PI)
		var needle = "▲"
		if diff > deg_to_rad(45.0) and diff < deg_to_rad(135.0):
			needle = "▶"
		elif diff < -deg_to_rad(45.0) and diff > -deg_to_rad(135.0):
			needle = "◀"
		elif abs(diff) >= deg_to_rad(135.0):
			needle = "▼"

		compass_label.text = "%s %s %03d° | %dm" % [needle, card, int(heading_deg), int(dist)]
	else:
		compass_label.text = "🧭 %s %03d°" % [card, int(heading_deg)]

func _unhandled_input(event: InputEvent) -> void:
	# Detect input device type and notify tutorial
	if tutorial_manager:
		if event is InputEventKey or event is InputEventMouse:
			tutorial_manager.notify_input_device(TutorialManagerScript.InputDevice.KEYBOARD_MOUSE)
		elif event is InputEventJoypadButton or event is InputEventJoypadMotion:
			tutorial_manager.notify_input_device(TutorialManagerScript.InputDevice.GAMEPAD)

	# Toggle Pause Menu
	if (event is InputEventKey and event.pressed and not event.echo and (event.keycode == KEY_ESCAPE or event.keycode == KEY_P)) or \
	   (event is InputEventJoypadButton and event.pressed and event.button_index == JOY_BUTTON_START):
		_toggle_pause_menu()
		get_viewport().set_input_as_handled()
		return
	elif event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_H:
		toggle_controls_panel()
		get_viewport().set_input_as_handled()
		return
	elif event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_F1:
		toggle_dev_drawer()
		get_viewport().set_input_as_handled()
		return

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
			get_tree().change_scene_to_file(next_realm_scene_path)
			get_viewport().set_input_as_handled()

func _toggle_pause_menu() -> void:
	if not pause_menu:
		return
	var p_pos = player_ref.global_position if (player_ref and player_ref.is_inside_tree()) else Vector3.ZERO
	var p_yaw = player_ref.visual_root.rotation.y if (player_ref and player_ref.visual_root) else 0.0
	pause_menu.toggle_menu(current_realm_name, quest_mgr_ref, p_pos, p_yaw, waypoint_target_pos, waypoint_label_text)
	menu_toggled.emit(pause_menu.visible)

func toggle_controls_panel() -> void:
	if controls_panel:
		controls_panel.visible = not controls_panel.visible

func toggle_dev_drawer() -> void:
	if dev_drawer:
		dev_drawer.visible = not dev_drawer.visible
		if btn_dev_toggle:
			btn_dev_toggle.text = "[F1] Dev ▴" if dev_drawer.visible else "[F1] Dev ▾"

func set_player(player: PlayerController3D) -> void:
	player_ref = player
	if player_ref:
		if player_ref.has_signal("health_changed") and not player_ref.health_changed.is_connected(update_health):
			player_ref.health_changed.connect(update_health)
		if player_ref.has_signal("prana_changed") and not player_ref.prana_changed.is_connected(update_prana):
			player_ref.prana_changed.connect(update_prana)
		if player_ref.has_signal("nearby_prompt_changed") and not player_ref.nearby_prompt_changed.is_connected(set_context_prompt):
			player_ref.nearby_prompt_changed.connect(set_context_prompt)
		if player_ref.has_signal("player_action_performed") and not player_ref.player_action_performed.is_connected(_on_player_action):
			player_ref.player_action_performed.connect(_on_player_action)
		if player_ref.camera_arm:
			if player_ref.camera_arm.has_signal("target_locked") and not player_ref.camera_arm.target_locked.is_connected(_on_target_locked):
				player_ref.camera_arm.target_locked.connect(_on_target_locked)
			if player_ref.camera_arm.has_signal("target_unlocked") and not player_ref.camera_arm.target_unlocked.is_connected(_on_target_unlocked):
				player_ref.camera_arm.target_unlocked.connect(_on_target_unlocked)

	if tutorial_manager:
		tutorial_manager.start_tutorial()

func _on_player_action(action: String) -> void:
	if tutorial_manager:
		tutorial_manager.notify_action(action)

func set_quest_manager(quest_mgr: QuestManager, realm_name: String = "Bhumi") -> void:
	quest_mgr_ref = quest_mgr
	current_realm_name = realm_name

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

func update_prana(current: float, max_val: float) -> void:
	if energy_bar:
		energy_bar.max_value = max_val
		energy_bar.value = current
	if energy_label:
		energy_label.text = "PRANA: %d / %d" % [int(current), int(max_val)]

func update_weapon(weapon_name: String) -> void:
	if weapon_badge_label:
		weapon_badge_label.text = "⚔ " + weapon_name.to_upper()

func update_shards(count: int, target: int = 3) -> void:
	if shards_label:
		shards_label.text = "✦ ASTRA SHARDS: %d / %d" % [count, target]

func update_objective(text: String) -> void:
	if objective_label:
		objective_label.text = "MISSION: " + text

func set_waypoint(pos: Vector3, label: String = "") -> void:
	waypoint_target_pos = pos
	waypoint_label_text = label
	has_waypoint = true
	if waypoint_name_label and not label.is_empty():
		waypoint_name_label.text = label
	if not label.is_empty():
		update_objective(label)

func clear_waypoint() -> void:
	has_waypoint = false
	waypoint_label_text = ""
	if waypoint_marker:
		waypoint_marker.visible = false

func set_context_prompt(text: String) -> void:
	if not context_prompt_panel or not context_prompt_label:
		return
	if text.is_empty():
		context_prompt_panel.visible = false
	else:
		context_prompt_label.text = text
		context_prompt_panel.visible = true
		context_prompt_panel.modulate.a = 1.0
		prompt_anim_time = 0.0

func show_subtitle(speaker: String, text: String, duration: float = 4.0) -> void:
	if not subtitle_panel or not subtitle_label:
		return
	if not PauseMenuScript.subtitles_enabled:
		subtitle_panel.visible = false
		return
	subtitle_label.text = "%s: \"%s\"" % [speaker, text]
	subtitle_panel.visible = true
	subtitle_timer = duration

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
	show_subtitle(speaker, text, 5.0)

func _advance_dialogue() -> void:
	if _on_dialogue_callback.is_valid():
		var cb = _on_dialogue_callback
		_on_dialogue_callback = Callable()
		cb.call()
	dialogue_advanced.emit()

func hide_dialogue() -> void:
	if dialogue_panel:
		dialogue_panel.visible = false

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

func show_defeat_overlay() -> void:
	if defeat_overlay:
		defeat_overlay.visible = true

func hide_defeat_overlay() -> void:
	if defeat_overlay:
		defeat_overlay.visible = false

func show_victory_overlay(shards: int = 5, clear_time_sec: float = 120.0, realm_title: String = "") -> void:
	if victory_overlay:
		var summary = victory_overlay.find_child("SummaryLabel", true, false) as Label
		if summary:
			if realm_title.is_empty():
				summary.text = "✦ All %d Astra Shards Purified\n✦ Realm Guardian Cleansed\n✦ Time: %.1fs  |  Rank: S (Solar Champion)" % [shards, clear_time_sec]
			else:
				summary.text = "✦ %s Consecrated & Restored\n✦ All %d Astra Shards Purified\n✦ Time: %.1fs  |  Rank: S (Solar Champion)" % [realm_title, shards, clear_time_sec]
		victory_overlay.visible = true
