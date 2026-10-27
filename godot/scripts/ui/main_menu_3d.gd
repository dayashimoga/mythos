class_name MainMenu3D
extends Control

## MainMenu3D
## Authentic Vedic Title Screen, Main Navigation, Continue/New Game Flow,
## Chapter Expeditions & Accessibility Settings Suite.
## Stage Q17: Complete Seven-Realm Sequencing Contract.

signal new_game_started()
signal game_continued(realm: String)
signal chapter_selected(chapter_id: String)

const SaveSystemScript = preload("res://scripts/domain/save_system.gd")
const CampaignGraphScript = preload("res://scripts/domain/campaign_graph.gd")
const AudioManagerScript = preload("res://scripts/audio/audio_manager_3d.gd")
const PauseMenuScript = preload("res://scripts/ui/pause_menu_3d.gd")

# UI Nodes
@onready var btn_continue: Button = find_child("BtnContinue", true, false) as Button
@onready var btn_new_game: Button = find_child("BtnNewGame", true, false) as Button
@onready var btn_chapters: Button = find_child("BtnChapters", true, false) as Button
@onready var btn_settings: Button = find_child("BtnSettings", true, false) as Button
@onready var btn_quit: Button = find_child("BtnQuit", true, false) as Button

# Modals
@onready var confirm_modal: PanelContainer = find_child("ConfirmModal", true, false) as PanelContainer
@onready var btn_confirm_new: Button = find_child("BtnConfirmNew", true, false) as Button
@onready var btn_cancel_new: Button = find_child("BtnCancelNew", true, false) as Button

@onready var chapters_modal: PanelContainer = find_child("ChaptersModal", true, false) as PanelContainer
@onready var chapters_list: VBoxContainer = find_child("ChaptersList", true, false) as VBoxContainer
@onready var btn_close_chapters: Button = find_child("BtnCloseChapters", true, false) as Button

@onready var settings_modal: PanelContainer = find_child("SettingsModal", true, false) as PanelContainer
@onready var btn_close_settings: Button = find_child("BtnCloseSettings", true, false) as Button
@onready var slider_master: HSlider = find_child("MenuSliderMaster", true, false) as HSlider
@onready var slider_sfx: HSlider = find_child("MenuSliderSFX", true, false) as HSlider
@onready var slider_ambience: HSlider = find_child("MenuSliderAmbience", true, false) as HSlider

@onready var save_summary_label: Label = find_child("SaveSummaryLabel", true, false) as Label

var has_valid_save: bool = false
var saved_realm: String = "Bhumi"
var saved_shards: int = 0

func _resolve_nodes() -> void:
	if not btn_continue: btn_continue = find_child("BtnContinue", true, false) as Button
	if not btn_new_game: btn_new_game = find_child("BtnNewGame", true, false) as Button
	if not btn_chapters: btn_chapters = find_child("BtnChapters", true, false) as Button
	if not btn_settings: btn_settings = find_child("BtnSettings", true, false) as Button
	if not btn_quit: btn_quit = find_child("BtnQuit", true, false) as Button
	if not confirm_modal: confirm_modal = find_child("ConfirmModal", true, false) as PanelContainer
	if not btn_confirm_new: btn_confirm_new = find_child("BtnConfirmNew", true, false) as Button
	if not btn_cancel_new: btn_cancel_new = find_child("BtnCancelNew", true, false) as Button
	if not chapters_modal: chapters_modal = find_child("ChaptersModal", true, false) as PanelContainer
	if not chapters_list: chapters_list = find_child("ChaptersList", true, false) as VBoxContainer
	if not btn_close_chapters: btn_close_chapters = find_child("BtnCloseChapters", true, false) as Button
	if not settings_modal: settings_modal = find_child("SettingsModal", true, false) as PanelContainer
	if not btn_close_settings: btn_close_settings = find_child("BtnCloseSettings", true, false) as Button
	if not slider_master: slider_master = find_child("MenuSliderMaster", true, false) as HSlider
	if not slider_sfx: slider_sfx = find_child("MenuSliderSFX", true, false) as HSlider
	if not slider_ambience: slider_ambience = find_child("MenuSliderAmbience", true, false) as HSlider
	if not save_summary_label: save_summary_label = find_child("SaveSummaryLabel", true, false) as Label

func _ready() -> void:
	_resolve_nodes()
	AudioManagerScript.set_ambience("bhumi")
	_inspect_save_state()
	_wire_buttons()
	_wire_settings()
	_populate_chapters_list()
	if confirm_modal: confirm_modal.visible = false
	if chapters_modal: chapters_modal.visible = false
	if settings_modal: settings_modal.visible = false

func _inspect_save_state() -> void:
	_resolve_nodes()
	var save = SaveSystemScript.load_game()
	var current_realm = str(save.get("currentRealm", "SanctumOfAstra"))
	saved_shards = int(save.get("shardsCollected", 0))
	var altar_consecrated = bool(save.get("altarConsecrated", false))
	var has_checkpoint = save.has("checkpointPosition")

	has_valid_save = (saved_shards > 0 or altar_consecrated or has_checkpoint or (current_realm != "SanctumOfAstra" and current_realm != "Bhumi"))
	saved_realm = current_realm
	if saved_realm == "SanctumOfAstra":
		saved_realm = "Bhumi"

	if btn_continue:
		btn_continue.disabled = not has_valid_save
		if has_valid_save:
			btn_continue.modulate = Color(1.0, 1.0, 1.0, 1.0)
			if save_summary_label:
				save_summary_label.text = "Saved Journey: Realm of %s • ✦ %d Shards" % [saved_realm, saved_shards]
		else:
			btn_continue.modulate = Color(0.6, 0.6, 0.6, 0.6)
			if save_summary_label:
				save_summary_label.text = "No previous journey detected • Begin a new expedition"

func _wire_buttons() -> void:
	if btn_continue:
		btn_continue.pressed.connect(_on_continue_pressed)
	if btn_new_game:
		btn_new_game.pressed.connect(_on_new_game_pressed)
	if btn_chapters:
		btn_chapters.pressed.connect(_on_chapters_pressed)
	if btn_settings:
		btn_settings.pressed.connect(_on_settings_pressed)
	if btn_quit:
		btn_quit.pressed.connect(func(): get_tree().quit())

	if btn_confirm_new:
		btn_confirm_new.pressed.connect(_execute_fresh_new_game)
	if btn_cancel_new:
		btn_cancel_new.pressed.connect(func(): if confirm_modal: confirm_modal.visible = false)
	if btn_close_chapters:
		btn_close_chapters.pressed.connect(func(): if chapters_modal: chapters_modal.visible = false)
	if btn_close_settings:
		btn_close_settings.pressed.connect(func(): if settings_modal: settings_modal.visible = false)

func _wire_settings() -> void:
	if slider_master:
		slider_master.value = AudioManagerScript.instance.master_volume if AudioManagerScript.instance else 1.0
		slider_master.value_changed.connect(func(v):
			if AudioManagerScript.instance: AudioManagerScript.instance.set_master_volume(v)
			_persist_audio_settings()
		)
	if slider_sfx:
		slider_sfx.value = AudioManagerScript.instance.sfx_volume if AudioManagerScript.instance else 1.0
		slider_sfx.value_changed.connect(func(v):
			if AudioManagerScript.instance: AudioManagerScript.instance.set_sfx_volume(v)
			_persist_audio_settings()
		)
	if slider_ambience:
		slider_ambience.value = AudioManagerScript.instance.ambience_volume if AudioManagerScript.instance else 0.7
		slider_ambience.value_changed.connect(func(v):
			if AudioManagerScript.instance: AudioManagerScript.instance.set_ambience_volume(v)
			_persist_audio_settings()
		)

func _persist_audio_settings() -> void:
	var save = SaveSystemScript.load_game()
	if not save.has("settings") or not (save["settings"] is Dictionary):
		save["settings"] = {}
	save["settings"]["master_volume"] = slider_master.value if slider_master else 1.0
	save["settings"]["sfx_volume"] = slider_sfx.value if slider_sfx else 1.0
	save["settings"]["ambience_volume"] = slider_ambience.value if slider_ambience else 0.7
	SaveSystemScript.save_game(save)

func _on_continue_pressed() -> void:
	if not has_valid_save:
		return
	AudioManagerScript.play_click()
	var save = SaveSystemScript.load_game()
	var target_realm = str(save.get("currentRealm", "Bhumi"))
	var ch = CampaignGraphScript.get_chapter(target_realm)
	var scene_path = ch.scene_path if ch else "res://scenes/levels/BhumiValley3D.tscn"
	game_continued.emit(target_realm)
	if is_inside_tree() and get_tree():
		get_tree().change_scene_to_file(scene_path)

func _on_new_game_pressed() -> void:
	AudioManagerScript.play_click()
	if has_valid_save:
		if confirm_modal:
			confirm_modal.visible = true
	else:
		_execute_fresh_new_game()

func _execute_fresh_new_game() -> void:
	AudioManagerScript.play_click()
	if confirm_modal:
		confirm_modal.visible = false

	# Initialize clean default save state
	var fresh_state = SaveSystemScript.get_default_state()
	fresh_state["currentRealm"] = "Bhumi"
	fresh_state["unlockedRealms"] = ["SanctumOfAstra", "Bhumi"]
	fresh_state["shardsCollected"] = 0
	fresh_state["altarConsecrated"] = false
	fresh_state["tutorialCompleted"] = false
	SaveSystemScript.save_game(fresh_state)

	new_game_started.emit()
	if is_inside_tree() and get_tree():
		get_tree().change_scene_to_file("res://scenes/levels/BhumiValley3D.tscn")

func _on_chapters_pressed() -> void:
	AudioManagerScript.play_click()
	if chapters_modal:
		chapters_modal.visible = true

func _on_settings_pressed() -> void:
	AudioManagerScript.play_click()
	if settings_modal:
		settings_modal.visible = true

func _populate_chapters_list() -> void:
	if not chapters_list:
		return

	for child in chapters_list.get_children():
		child.queue_free()

	var save = SaveSystemScript.load_game()
	var unlocked = save.get("unlockedRealms", ["SanctumOfAstra", "Bhumi"])

	for ch in CampaignGraphScript.get_all_chapters():
		var btn = Button.new()
		var is_unlocked = (ch.index == 1) or unlocked.has(ch.realm_name) or unlocked.has(ch.id)
		btn.text = "Chapter %d: %s (%s)" % [ch.index, ch.realm_name, ch.title]
		btn.custom_minimum_size = Vector2(0, 42)
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.disabled = not is_unlocked

		if is_unlocked:
			btn.modulate = Color(1.0, 0.9, 0.5, 1.0)
			btn.pressed.connect(func():
				AudioManagerScript.play_click()
				CampaignGraphScript.is_chapter_replay = true
				CampaignGraphScript.active_replay_chapter = ch.id
				chapter_selected.emit(ch.id)
				if is_inside_tree() and get_tree():
					get_tree().change_scene_to_file(ch.scene_path)
			)
		else:
			btn.modulate = Color(0.5, 0.5, 0.5, 0.5)
			btn.text += " 🔒 [LOCKED]"

		chapters_list.add_child(btn)
