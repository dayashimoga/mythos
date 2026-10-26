class_name PauseMenu3D
extends Control

## Modern In-Game Pause Menu, Quest Journal, Realm Map, Codex & Accessibility Suite.
## Manages game pause state, settings adjustments, fast travel between unlocked realms,
## and player accessibility profiles.

signal resumed()
signal checkpoint_restarted()
signal realm_travel_requested(realm_scene_path: String)

@onready var tabs_container: TabContainer = $Panel/Margin/VBox/TabContainer if has_node("Panel/Margin/VBox/TabContainer") else null

# Navigation Buttons
@onready var btn_resume: Button = $Panel/Margin/VBox/TopHBox/BtnResume if has_node("Panel/Margin/VBox/TopHBox/BtnResume") else null
@onready var btn_restart_cp: Button = $Panel/Margin/VBox/TopHBox/BtnRestart if has_node("Panel/Margin/VBox/TopHBox/BtnRestart") else null

# Settings Controls
@onready var slider_master: HSlider = find_child("SliderMaster", true, false) as HSlider
@onready var slider_sfx: HSlider = find_child("SliderSFX", true, false) as HSlider
@onready var slider_ambience: HSlider = find_child("SliderAmbience", true, false) as HSlider
@onready var slider_cam_sens: HSlider = find_child("SliderCamSens", true, false) as HSlider
@onready var check_invert_y: CheckBox = find_child("CheckInvertY", true, false) as CheckBox
@onready var slider_shake: HSlider = find_child("SliderShake", true, false) as HSlider
@onready var check_reduced_motion: CheckBox = find_child("CheckReducedMotion", true, false) as CheckBox
@onready var check_subtitles: CheckBox = find_child("CheckSubtitles", true, false) as CheckBox

# Journal & Map Containers
@onready var journal_text_label: RichTextLabel = find_child("JournalTextLabel", true, false) as RichTextLabel
@onready var map_grid: GridContainer = find_child("MapGridContainer", true, false) as GridContainer

# Codex Tree / Viewer
@onready var codex_text_label: RichTextLabel = find_child("CodexTextLabel", true, false) as RichTextLabel
@onready var codex_item_list: ItemList = find_child("CodexItemList", true, false) as ItemList

var quest_mgr_ref: QuestManager = null
var current_realm_name: String = "Bhumi"

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
	_wire_buttons()
	_wire_settings()
	_setup_codex()

func open_menu(current_realm: String = "Bhumi", quest_mgr: QuestManager = null) -> void:
	current_realm_name = current_realm
	quest_mgr_ref = quest_mgr
	visible = true
	if get_tree():
		get_tree().paused = true
	AudioManager3D.play_open()
	_refresh_journal()
	_refresh_realm_map()

func close_menu() -> void:
	visible = false
	if get_tree():
		get_tree().paused = false
	AudioManager3D.play_close()
	resumed.emit()

func toggle_menu(current_realm: String = "Bhumi", quest_mgr: QuestManager = null) -> void:
	if visible:
		close_menu()
	else:
		open_menu(current_realm, quest_mgr)

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

func _wire_settings() -> void:
	if slider_master:
		slider_master.value = AudioManager3D.instance.master_volume if AudioManager3D.instance else 1.0
		slider_master.value_changed.connect(func(v):
			if AudioManager3D.instance: AudioManager3D.instance.set_master_volume(v)
		)
	if slider_sfx:
		slider_sfx.value = AudioManager3D.instance.sfx_volume if AudioManager3D.instance else 1.0
		slider_sfx.value_changed.connect(func(v):
			if AudioManager3D.instance: AudioManager3D.instance.set_sfx_volume(v)
		)
	if slider_ambience:
		slider_ambience.value = AudioManager3D.instance.ambience_volume if AudioManager3D.instance else 0.7
		slider_ambience.value_changed.connect(func(v):
			if AudioManager3D.instance: AudioManager3D.instance.set_ambience_volume(v)
		)
	if slider_cam_sens:
		slider_cam_sens.value = camera_sensitivity
		slider_cam_sens.value_changed.connect(func(v): camera_sensitivity = v)

	if check_invert_y:
		check_invert_y.button_pressed = invert_camera_y
		check_invert_y.toggled.connect(func(p): invert_camera_y = p)

	if slider_shake:
		slider_shake.value = screen_shake_multiplier
		slider_shake.value_changed.connect(func(v): screen_shake_multiplier = v)

	if check_reduced_motion:
		check_reduced_motion.button_pressed = reduced_motion
		check_reduced_motion.toggled.connect(func(p): reduced_motion = p)

	if check_subtitles:
		check_subtitles.button_pressed = subtitles_enabled
		check_subtitles.toggled.connect(func(p): subtitles_enabled = p)

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
		btn.custom_minimum_size = Vector2(260, 48)
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
