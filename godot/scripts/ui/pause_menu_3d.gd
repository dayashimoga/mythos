class_name PauseMenu3D
extends Control

## Modern In-Game Pause Menu, Quest Journal, Realm Map, Codex & Accessibility Suite.
## Stage Q13: Full Gamepad/Keyboard Focus, Tab Navigation, Real 2D Tactical Map,
## Settings Disk Persistence, Onboarding Replay/Skip, and Unobstructed Layout.

signal resumed()
signal checkpoint_restarted()
signal realm_travel_requested(realm_scene_path: String)
signal tutorial_reset_requested()
signal tutorial_skip_requested()

const TacticalMapScript = preload("res://scripts/ui/tactical_map_canvas.gd")

@onready var tabs_container: TabContainer = find_child("TabContainer", true, false) as TabContainer

# Navigation Buttons
@onready var btn_resume: Button = find_child("BtnResume", true, false) as Button
@onready var btn_restart_cp: Button = find_child("BtnRestart", true, false) as Button

# Tab Bar Quick Buttons
@onready var tab_btn_journal: Button = find_child("BtnTabJournal", true, false) as Button
@onready var tab_btn_map: Button = find_child("BtnTabMap", true, false) as Button
@onready var tab_btn_settings: Button = find_child("BtnTabSettings", true, false) as Button
@onready var tab_btn_codex: Button = find_child("BtnTabCodex", true, false) as Button
@onready var tab_btn_controls: Button = find_child("BtnTabControls", true, false) as Button

# Settings Controls
@onready var slider_master: HSlider = find_child("SliderMaster", true, false) as HSlider
@onready var slider_sfx: HSlider = find_child("SliderSFX", true, false) as HSlider
@onready var slider_ambience: HSlider = find_child("SliderAmbience", true, false) as HSlider
@onready var slider_cam_sens: HSlider = find_child("SliderCamSens", true, false) as HSlider
@onready var check_invert_y: CheckBox = find_child("CheckInvertY", true, false) as CheckBox
@onready var slider_shake: HSlider = find_child("SliderShake", true, false) as HSlider
@onready var check_reduced_motion: CheckBox = find_child("CheckReducedMotion", true, false) as CheckBox
@onready var check_subtitles: CheckBox = find_child("CheckSubtitles", true, false) as CheckBox
@onready var btn_reset_tutorial: Button = find_child("BtnResetTutorial", true, false) as Button
@onready var btn_skip_tutorial: Button = find_child("BtnSkipTutorial", true, false) as Button

# Journal & Map Containers
@onready var journal_text_label: RichTextLabel = find_child("JournalTextLabel", true, false) as RichTextLabel
@onready var map_grid: GridContainer = find_child("MapGridContainer", true, false) as GridContainer
@onready var tactical_map_container: Container = find_child("TacticalMapContainer", true, false) as Container
var tactical_map: Control = null

# Codex Tree / Viewer
@onready var codex_text_label: RichTextLabel = find_child("CodexTextLabel", true, false) as RichTextLabel
@onready var codex_item_list: ItemList = find_child("CodexItemList", true, false) as ItemList

var quest_mgr_ref: QuestManager = null
var current_realm_name: String = "Bhumi"

# Cached player & waypoint state for Tactical Map
var cached_player_pos: Vector3 = Vector3.ZERO
var cached_player_yaw: float = 0.0
var cached_waypoint_pos: Vector3 = Vector3.ZERO
var cached_waypoint_label: String = ""

# Accessibility & Gameplay settings cache
static var camera_sensitivity: float = 1.0
static var invert_camera_y: bool = false
static var screen_shake_multiplier: float = 1.0
static var reduced_motion: bool = false
static var subtitles_enabled: bool = true

const REALM_DATA = [
	{"id": "Bhumi", "name": "I. Bhumi (Dandaka Valley)", "scene": "res://scenes/levels/BhumiValley3D.tscn", "shards": 5},
	{"id": "Antariksha", "name": "II. Antariksha (Sky Citadels)", "scene": "res://scenes/levels/AntarikshaSkyRealm3D.tscn", "shards": 8},
	{"id": "Patala", "name": "III. Patala (Serpent Vaults)", "scene": "res://scenes/levels/PatalaUnderworld3D.tscn", "shards": 12},
	{"id": "Svar", "name": "IV. Svar (Solar Citadels)", "scene": "res://scenes/levels/SvarSolarCitadel3D.tscn", "shards": 16},
	{"id": "Maharloka", "name": "V. Maharloka (Astral Libraries)", "scene": "res://scenes/levels/MaharlokaSanctuary3D.tscn", "shards": 20},
	{"id": "Tapoloka", "name": "VI. Tapoloka (Agni's Forge)", "scene": "res://scenes/levels/TapolokaForge3D.tscn", "shards": 24},
	{"id": "Satyaloka", "name": "VII. Satyaloka (Cosmic Dharma)", "scene": "res://scenes/levels/SatyalokaApex3D.tscn", "shards": 28}
]

const CODEX_ENTRIES = {
	"Veer": "[b][color=#FFD166]VEER — THE CONSECRATED SOLAR GUARDIAN[/color][/b]\n\n" +
		"Born under the cosmic alignment of Krittika, Veer bears the living Agni-Core fused into his right gauntlet. " +
		"He wields the curved sunsteel blade [i]Surya-Kripana[/i] and channels solar prana for high-agility dashes, " +
		"perfect parry deflections, and seismic ground slams. His duty is to reconnect the severed cosmic spheres.",
	"Devi Tara": "[b][color=#38BDF8]DEVI TARA — CELESTIAL ORACLE OF TAPAS[/color][/b]\n\n" +
		"An immortal ascetic seer whose consciousness traverses all timelines through the Sri Yantra. " +
		"Her astral projection manifests in radiant peacock-teal robes to guide Veer through trials, " +
		"interpret ancient Sanskrit inscriptions, and offer cosmic blessings across all seven realms.",
	"The Seven Lokas": "[b][color=#FFB703]THE SEVEN LOKAS OF MOUNT MERU[/color][/b]\n\n" +
		"Forged along the cosmic axis to balance Sattva (truth), Rajas (action), and Tamas (inertia):\n" +
		"• [b]Bhumi[/b]: The mortal terrestrial foundations.\n" +
		"• [b]Antariksha[/b]: The roaring sky citadels of Vayu.\n" +
		"• [b]Patala[/b]: The subterranean serpentine vaults of King Vasuki.\n" +
		"• [b]Svar[/b]: The sunlit marble bastions of Savitr.\n" +
		"• [b]Maharloka[/b]: The cosmic libraries preserving eternal hymns.\n" +
		"• [b]Tapoloka[/b]: The volcanic crucibles of ascetic fire.\n" +
		"• [b]Satyaloka[/b]: The apex boundary where reality unfolds as a golden lotus.",
	"The Astras": "[b][color=#FB8500]THE PRIMAL ASTRAS & SOLAR SHARDS[/color][/b]\n\n" +
		"When Mahishasura assaulted the Kala-Chakra, the Great Solar Anchor shattered into 28 resonant shards. " +
		"Gathering these sacred prisms purifies corrupted wards, empowers Veer's blade, and unlocks the ascension portals.",
	"The Asura Titans": "[b][color=#EF4444]THE ASURA TITANS OF TAMAS[/color][/b]\n\n" +
		"Ancient elemental guardians corrupted by cosmic inertia and despair:\n" +
		"• [b]General Kalanemi[/b]: 4-armed warlord wielding dual void cleavers.\n" +
		"• [b]Cyclone Titan Matarishvan[/b]: Quad-winged lord of the hurricane.\n" +
		"• [b]Shesha's Tormented Echo[/b]: 7-hooded serpent of subterranean grief.\n" +
		"• [b]Sun Titan Avatara[/b]: Corrupted deity of blinding supernova heat.\n" +
		"• [b]Sage Brihaspati's Avatar[/b]: Cosmic intellect testing spiritual purity.\n" +
		"• [b]Agni Rudra[/b]: Primordial titan of volcanic wrath.\n" +
		"• [b]Brahma Avatara[/b]: Four-headed creator entangled in Mahapralaya dissolution."
}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
	_ensure_node_references()
	_wire_buttons()
	_wire_tab_buttons()
	_wire_settings()
	_load_settings_from_disk()
	_setup_codex()
	_setup_tactical_map()
	_setup_focus_navigation()

func _ensure_node_references() -> void:
	if not tabs_container: tabs_container = find_child("TabContainer", true, false) as TabContainer
	if not btn_resume: btn_resume = find_child("BtnResume", true, false) as Button
	if not btn_restart_cp: btn_restart_cp = find_child("BtnRestart", true, false) as Button
	if not tab_btn_journal: tab_btn_journal = find_child("BtnTabJournal", true, false) as Button
	if not tab_btn_map: tab_btn_map = find_child("BtnTabMap", true, false) as Button
	if not tab_btn_settings: tab_btn_settings = find_child("BtnTabSettings", true, false) as Button
	if not tab_btn_codex: tab_btn_codex = find_child("BtnTabCodex", true, false) as Button
	if not tab_btn_controls: tab_btn_controls = find_child("BtnTabControls", true, false) as Button
	if not slider_master: slider_master = find_child("SliderMaster", true, false) as HSlider
	if not slider_sfx: slider_sfx = find_child("SliderSFX", true, false) as HSlider
	if not slider_ambience: slider_ambience = find_child("SliderAmbience", true, false) as HSlider
	if not slider_cam_sens: slider_cam_sens = find_child("SliderCamSens", true, false) as HSlider
	if not check_invert_y: check_invert_y = find_child("CheckInvertY", true, false) as CheckBox
	if not slider_shake: slider_shake = find_child("SliderShake", true, false) as HSlider
	if not check_reduced_motion: check_reduced_motion = find_child("CheckReducedMotion", true, false) as CheckBox
	if not check_subtitles: check_subtitles = find_child("CheckSubtitles", true, false) as CheckBox
	if not btn_reset_tutorial: btn_reset_tutorial = find_child("BtnResetTutorial", true, false) as Button
	if not btn_skip_tutorial: btn_skip_tutorial = find_child("BtnSkipTutorial", true, false) as Button
	if not journal_text_label: journal_text_label = find_child("JournalTextLabel", true, false) as RichTextLabel
	if not map_grid: map_grid = find_child("MapGridContainer", true, false) as GridContainer
	if not tactical_map_container: tactical_map_container = find_child("TacticalMapContainer", true, false) as Container
	if not codex_text_label: codex_text_label = find_child("CodexTextLabel", true, false) as RichTextLabel
	if not codex_item_list: codex_item_list = find_child("CodexItemList", true, false) as ItemList

func _input(event: InputEvent) -> void:
	if not visible:
		return

	# Handle Tab Navigation via Keyboard Q/E, Numbers 1-5, and Gamepad Shoulders LB/RB
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_Q:
				_cycle_tab(-1)
				get_viewport().set_input_as_handled()
			KEY_E:
				_cycle_tab(1)
				get_viewport().set_input_as_handled()
			KEY_1:
				switch_tab(0)
				get_viewport().set_input_as_handled()
			KEY_2:
				switch_tab(1)
				get_viewport().set_input_as_handled()
			KEY_3:
				switch_tab(2)
				get_viewport().set_input_as_handled()
			KEY_4:
				switch_tab(3)
				get_viewport().set_input_as_handled()
			KEY_5:
				switch_tab(4)
				get_viewport().set_input_as_handled()
	elif event is InputEventJoypadButton and event.pressed:
		match event.button_index:
			JOY_BUTTON_LEFT_SHOULDER:
				_cycle_tab(-1)
				get_viewport().set_input_as_handled()
			JOY_BUTTON_RIGHT_SHOULDER:
				_cycle_tab(1)
				get_viewport().set_input_as_handled()

func open_menu(current_realm: String = "Bhumi", quest_mgr: QuestManager = null, p_pos: Vector3 = Vector3.ZERO, p_yaw: float = 0.0, wp_pos: Vector3 = Vector3.ZERO, wp_label: String = "") -> void:
	current_realm_name = current_realm
	quest_mgr_ref = quest_mgr
	cached_player_pos = p_pos
	cached_player_yaw = p_yaw
	cached_waypoint_pos = wp_pos
	cached_waypoint_label = wp_label

	visible = true
	if get_tree():
		get_tree().paused = true
	AudioManager3D.play_open()
	_refresh_journal()
	_refresh_realm_map()

	if tactical_map:
		tactical_map.set_player_state(cached_player_pos, cached_player_yaw)
		if wp_pos != Vector3.ZERO:
			tactical_map.set_waypoint(wp_pos, wp_label)
		else:
			tactical_map.clear_waypoint()

	# Default focus to Resume button
	if btn_resume and btn_resume.is_inside_tree():
		btn_resume.grab_focus()

func close_menu() -> void:
	visible = false
	if get_tree():
		get_tree().paused = false
	AudioManager3D.play_close()
	resumed.emit()

func toggle_menu(current_realm: String = "Bhumi", quest_mgr: QuestManager = null, p_pos: Vector3 = Vector3.ZERO, p_yaw: float = 0.0, wp_pos: Vector3 = Vector3.ZERO, wp_label: String = "") -> void:
	if visible:
		close_menu()
	else:
		open_menu(current_realm, quest_mgr, p_pos, p_yaw, wp_pos, wp_label)

func _wire_buttons() -> void:
	if btn_resume:
		btn_resume.pressed.connect(func():
			AudioManager3D.play_click()
			close_menu()
		)
	if btn_restart_cp:
		btn_restart_cp.pressed.connect(func():
			AudioManager3D.play_click()
			close_menu()
			checkpoint_restarted.emit()
		)

func _wire_tab_buttons() -> void:
	if tab_btn_journal:
		tab_btn_journal.pressed.connect(func(): switch_tab(0))
	if tab_btn_map:
		tab_btn_map.pressed.connect(func(): switch_tab(1))
	if tab_btn_settings:
		tab_btn_settings.pressed.connect(func(): switch_tab(2))
	if tab_btn_codex:
		tab_btn_codex.pressed.connect(func(): switch_tab(3))
	if tab_btn_controls:
		tab_btn_controls.pressed.connect(func(): switch_tab(4))

	if tabs_container:
		tabs_container.tab_changed.connect(_on_tab_changed)

func switch_tab(idx: int) -> void:
	_ensure_node_references()
	if not tabs_container:
		return
	var count = tabs_container.get_tab_count()
	if count == 0:
		return
	var clamped = clamp(idx, 0, count - 1)
	tabs_container.current_tab = clamped
	var tb = tabs_container.get_tab_bar()
	if tb:
		tb.current_tab = clamped
	AudioManager3D.play_click()
	_update_tab_button_highlights(clamped)

func _cycle_tab(delta: int) -> void:
	if not tabs_container:
		return
	var count = tabs_container.get_tab_count()
	if count <= 1:
		return
	var next_idx = (tabs_container.current_tab + delta + count) % count
	switch_tab(next_idx)

func _on_tab_changed(tab_idx: int) -> void:
	_update_tab_button_highlights(tab_idx)

func _update_tab_button_highlights(active_idx: int) -> void:
	var buttons = [tab_btn_journal, tab_btn_map, tab_btn_settings, tab_btn_codex, tab_btn_controls]
	for i in range(buttons.size()):
		var b = buttons[i]
		if b:
			if i == active_idx:
				b.modulate = Color(1.0, 0.9, 0.4, 1.0)
			else:
				b.modulate = Color(0.75, 0.8, 0.85, 0.85)

func _wire_settings() -> void:
	if slider_master:
		slider_master.value = AudioManager3D.instance.master_volume if AudioManager3D.instance else 1.0
		slider_master.value_changed.connect(func(v):
			if AudioManager3D.instance: AudioManager3D.instance.set_master_volume(v)
			_save_settings_to_disk()
		)
	if slider_sfx:
		slider_sfx.value = AudioManager3D.instance.sfx_volume if AudioManager3D.instance else 1.0
		slider_sfx.value_changed.connect(func(v):
			if AudioManager3D.instance: AudioManager3D.instance.set_sfx_volume(v)
			_save_settings_to_disk()
		)
	if slider_ambience:
		slider_ambience.value = AudioManager3D.instance.ambience_volume if AudioManager3D.instance else 0.7
		slider_ambience.value_changed.connect(func(v):
			if AudioManager3D.instance: AudioManager3D.instance.set_ambience_volume(v)
			_save_settings_to_disk()
		)
	if slider_cam_sens:
		slider_cam_sens.value = camera_sensitivity
		slider_cam_sens.value_changed.connect(func(v):
			camera_sensitivity = v
			_save_settings_to_disk()
		)

	if check_invert_y:
		check_invert_y.button_pressed = invert_camera_y
		check_invert_y.toggled.connect(func(p):
			invert_camera_y = p
			_save_settings_to_disk()
		)

	if slider_shake:
		slider_shake.value = screen_shake_multiplier
		slider_shake.value_changed.connect(func(v):
			screen_shake_multiplier = v
			_save_settings_to_disk()
		)

	if check_reduced_motion:
		check_reduced_motion.button_pressed = reduced_motion
		check_reduced_motion.toggled.connect(func(p):
			reduced_motion = p
			_save_settings_to_disk()
		)

	if check_subtitles:
		check_subtitles.button_pressed = subtitles_enabled
		check_subtitles.toggled.connect(func(p):
			subtitles_enabled = p
			_save_settings_to_disk()
		)

	if btn_reset_tutorial:
		btn_reset_tutorial.pressed.connect(func():
			AudioManager3D.play_click()
			var save = SaveSystem.load_game()
			save["tutorialCompleted"] = false
			SaveSystem.save_game(save)
			tutorial_reset_requested.emit()
		)

	if btn_skip_tutorial:
		btn_skip_tutorial.pressed.connect(func():
			AudioManager3D.play_click()
			var save = SaveSystem.load_game()
			save["tutorialCompleted"] = true
			SaveSystem.save_game(save)
			tutorial_skip_requested.emit()
		)

func _save_settings_to_disk() -> void:
	_ensure_node_references()
	if slider_cam_sens: camera_sensitivity = slider_cam_sens.value
	if check_invert_y: invert_camera_y = check_invert_y.button_pressed
	if slider_shake: screen_shake_multiplier = slider_shake.value
	if check_reduced_motion: reduced_motion = check_reduced_motion.button_pressed
	if check_subtitles: subtitles_enabled = check_subtitles.button_pressed

	var save = SaveSystem.load_game()
	save["settings"] = {
		"master_volume": slider_master.value if slider_master else 1.0,
		"sfx_volume": slider_sfx.value if slider_sfx else 1.0,
		"ambience_volume": slider_ambience.value if slider_ambience else 0.7,
		"camera_sensitivity": camera_sensitivity,
		"invert_camera_y": invert_camera_y,
		"screen_shake": screen_shake_multiplier,
		"reduced_motion": reduced_motion,
		"subtitles": subtitles_enabled
	}
	SaveSystem.save_game(save)

func _load_settings_from_disk() -> void:
	var save = SaveSystem.load_game()
	if save.has("settings") and save["settings"] is Dictionary:
		var s: Dictionary = save["settings"]
		camera_sensitivity = float(s.get("camera_sensitivity", 1.0))
		invert_camera_y = bool(s.get("invert_camera_y", false))
		screen_shake_multiplier = float(s.get("screen_shake", 1.0))
		reduced_motion = bool(s.get("reduced_motion", false))
		subtitles_enabled = bool(s.get("subtitles", true))

		var m_vol = float(s.get("master_volume", 1.0))
		var s_vol = float(s.get("sfx_volume", 1.0))
		var a_vol = float(s.get("ambience_volume", 0.7))

		if AudioManager3D.instance:
			AudioManager3D.instance.set_master_volume(m_vol)
			AudioManager3D.instance.set_sfx_volume(s_vol)
			AudioManager3D.instance.set_ambience_volume(a_vol)

		if slider_master: slider_master.value = m_vol
		if slider_sfx: slider_sfx.value = s_vol
		if slider_ambience: slider_ambience.value = a_vol
		if slider_cam_sens: slider_cam_sens.value = camera_sensitivity
		if check_invert_y: check_invert_y.button_pressed = invert_camera_y
		if slider_shake: slider_shake.value = screen_shake_multiplier
		if check_reduced_motion: check_reduced_motion.button_pressed = reduced_motion
		if check_subtitles: check_subtitles.button_pressed = subtitles_enabled

func _setup_tactical_map() -> void:
	if tactical_map_container:
		tactical_map = tactical_map_container.find_child("TacticalMapCanvas", true, false) as Control
		if not tactical_map:
			tactical_map = TacticalMapScript.new()
			tactical_map.name = "TacticalMapCanvas"
			tactical_map_container.add_child(tactical_map)

func _setup_codex() -> void:
	if not codex_item_list:
		return
	codex_item_list.clear()
	for title in CODEX_ENTRIES:
		codex_item_list.add_item(title)

	codex_item_list.item_selected.connect(func(idx):
		AudioManager3D.play_click()
		var title = codex_item_list.get_item_text(idx)
		if codex_text_label and CODEX_ENTRIES.has(title):
			codex_text_label.bbcode_text = CODEX_ENTRIES[title]
	)
	if codex_text_label:
		codex_text_label.bbcode_text = CODEX_ENTRIES["Veer"]

func _setup_focus_navigation() -> void:
	if not is_inside_tree():
		return
	# Configure gamepad & keyboard focus neighbors between top bar buttons
	if btn_restart_cp and btn_resume:
		btn_restart_cp.focus_neighbor_right = btn_resume.get_path()
		btn_resume.focus_neighbor_left = btn_restart_cp.get_path()

	# Sliders and checkboxes focus chain
	var focus_chain: Array[Control] = []
	if slider_master: focus_chain.append(slider_master)
	if slider_sfx: focus_chain.append(slider_sfx)
	if slider_ambience: focus_chain.append(slider_ambience)
	if slider_cam_sens: focus_chain.append(slider_cam_sens)
	if check_invert_y: focus_chain.append(check_invert_y)
	if slider_shake: focus_chain.append(slider_shake)
	if check_reduced_motion: focus_chain.append(check_reduced_motion)
	if check_subtitles: focus_chain.append(check_subtitles)
	if btn_reset_tutorial: focus_chain.append(btn_reset_tutorial)
	if btn_skip_tutorial: focus_chain.append(btn_skip_tutorial)

	for i in range(focus_chain.size()):
		var ctrl = focus_chain[i]
		ctrl.focus_mode = Control.FOCUS_ALL
		if i > 0:
			ctrl.focus_neighbor_top = focus_chain[i - 1].get_path()
		if i < focus_chain.size() - 1:
			ctrl.focus_neighbor_bottom = focus_chain[i + 1].get_path()

func _refresh_journal() -> void:
	if not journal_text_label:
		return

	var text = "[b][color=#FFD166]QUEST JOURNAL & CURRENT CAMPAIGN STATUS[/color][/b]\n\n"
	text += "[color=#38BDF8]Active Realm:[/color] %s\n" % current_realm_name

	if quest_mgr_ref and not quest_mgr_ref.active_mission_id.is_empty():
		var m = quest_mgr_ref.get_mission(quest_mgr_ref.active_mission_id)
		if m:
			text += "[color=#FFB703]Active Chapter:[/color] %s\n" % m.title
			text += "[color=#CBD5E1]%s[/color]\n\n" % m.description
			text += "[b][color=#FFD166]Mission Objectives:[/color][/b]\n"
			for obj in m.objectives:
				var mark = "✓" if obj.is_completed else "○"
				var col = "#10B981" if obj.is_completed else "#FBBF24"
				text += "[color=%s]  [%s] %s (%d / %d)[/color]\n" % [col, mark, obj.description, obj.current_count, obj.target_count]
	else:
		text += "[color=#CBD5E1]Explore the realm, seek counsel from Devi Tara, and cleanse the sacred altars.[/color]\n"

	journal_text_label.bbcode_text = text

func _refresh_realm_map() -> void:
	if not map_grid:
		return

	# Clear existing buttons
	for child in map_grid.get_children():
		child.queue_free()

	# Read save state to check unlocked realms
	var save = SaveSystem.load_game()
	var unlocked: Array = save.get("unlockedRealms", ["Bhumi"])

	for data in REALM_DATA:
		var btn = Button.new()
		btn.custom_minimum_size = Vector2(230, 42)
		btn.focus_mode = Control.FOCUS_ALL
		var is_unlocked = unlocked.has(data["id"])
		var is_current = (data["id"].to_lower() == current_realm_name.to_lower())

		if is_current:
			btn.text = "✦ %s [ACTIVE]" % data["name"]
			btn.disabled = true
		elif is_unlocked:
			btn.text = "✓ %s [TRAVEL]" % data["name"]
			btn.pressed.connect(func():
				AudioManager3D.play_click()
				close_menu()
				realm_travel_requested.emit(data["scene"])
				get_tree().change_scene_to_file(data["scene"])
			)
		else:
			btn.text = "🔒 %s [LOCKED]" % data["name"]
			btn.disabled = true

		map_grid.add_child(btn)
