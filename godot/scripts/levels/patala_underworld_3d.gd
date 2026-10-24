extends Node3D
class_name PatalaUnderworld3D

const DialogueRunnerScript = preload("res://scripts/domain/dialogue_runner.gd")
const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const SaveSystem = preload("res://scripts/domain/save_system.gd")
const NagaSpitterScript = preload("res://scripts/entities/naga_spitter_3d.gd")
const NagaConstrictorScript = preload("res://scripts/entities/naga_constrictor_3d.gd")
const BossSheshaEchoScript = preload("res://scripts/entities/boss_shesha_echo_3d.gd")

@onready var player: CharacterBody3D = $Player3D
@onready var hud: Control = $HUD3D
@onready var tara_npc: Area3D = $DeviTaraPatala3D
@onready var boss_shesha: CharacterBody3D = $BossSheshaEcho3D
@onready var vasuki_peetham_altar: Area3D = $VasukiPeetham3D

var quest_mgr: RefCounted = null
var dialogue_runner: RefCounted = null

var defeated_naga_guardians: int = 0
const TARGET_NAGA_GUARDIANS: int = 3
var last_checkpoint_pos: Vector3 = Vector3(0, 1.5, 0)
var level_start_time: float = 0.0
var is_realm_cleansed: bool = false

func _ready() -> void:
	level_start_time = Time.get_ticks_msec() / 1000.0
	quest_mgr = QuestManagerScript.new()
	dialogue_runner = DialogueRunnerScript.new()

	quest_mgr.start_mission("cleansing_of_patala")

	if player:
		last_checkpoint_pos = player.global_position
		player.health_changed.connect(_on_player_health_changed)
		player.shards_changed.connect(_on_player_shards_changed)
		player.interaction_requested.connect(_on_dialogue_requested)

	if hud:
		hud.retry_requested.connect(_on_retry_requested)
		_refresh_objective_display()
		hud.show_banner("✦ REALM OF PATALA: THE SERPENT VAULTS ✦\nCleanse the subterranean depths of Vasuki.", 5.0)

	if tara_npc:
		tara_npc.dialogue_requested.connect(func(): _on_dialogue_requested("tara_patala"))

	if boss_shesha:
		boss_shesha.boss_health_changed.connect(_on_boss_health_changed)
		boss_shesha.boss_phase_changed.connect(_on_boss_phase_changed)
		boss_shesha.boss_defeated.connect(_on_boss_defeated)

	for spitter in get_tree().get_nodes_in_group("enemies"):
		if spitter.has_signal("spitter_defeated"):
			spitter.spitter_defeated.connect(_on_naga_guardian_defeated)
		elif spitter.has_signal("constrictor_defeated"):
			spitter.constrictor_defeated.connect(_on_naga_guardian_defeated)

	if vasuki_peetham_altar:
		vasuki_peetham_altar.consecrated.connect(_on_peetham_consecrated)

func _physics_process(_delta: float) -> void:
	# Subterranean Chasm Fall Safeguard
	if player and player.global_position.y < -25.0:
		_respawn_at_checkpoint()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_F2:
			get_tree().change_scene_to_file("res://scenes/levels/BhumiValley3D.tscn")
		elif event.keycode == KEY_F3:
			get_tree().change_scene_to_file("res://scenes/levels/AntarikshaSkyRealm3D.tscn")
		elif event.keycode == KEY_F5:
			get_tree().change_scene_to_file("res://scenes/levels/SvarSolarCitadel3D.tscn")

func _refresh_objective_display() -> void:
	if not quest_mgr or not hud:
		return
	var m = quest_mgr.get_mission("cleansing_of_patala")
	if not m:
		return
	var text = ""
	for obj in m.objectives:
		if not obj.is_completed:
			text = "%s (%d / %d)" % [obj.description, obj.current_count, obj.target_count]
			break
	if text.is_empty():
		text = "PURIFIED: The Realm of Patala is Consecrated!"
	hud.update_objective(text)

func _on_naga_guardian_defeated(_guardian: CharacterBody3D) -> void:
	defeated_naga_guardians += 1
	if quest_mgr:
		quest_mgr.update_objective_progress("cleansing_of_patala", "defeat_naga_guardians", 1)

	if hud:
		hud.show_banner("✦ NAGA GUARDIAN SUBDUED (%d / %d) ✦" % [min(defeated_naga_guardians, TARGET_NAGA_GUARDIANS), TARGET_NAGA_GUARDIANS], 2.5)
		_refresh_objective_display()

func _on_boss_health_changed(curr: int, max_hp: int) -> void:
	if hud:
		hud.show_boss_bar("Shesha's Tormented Echo — Guardian of the Abyss", curr, max_hp)

func _on_boss_phase_changed(phase: int) -> void:
	if hud:
		if phase == 2:
			hud.show_banner("☣ AWAKENED SERPENT FURY! ☣\nShesha's Echo channels primordial venom!", 4.0)

func _on_boss_defeated() -> void:
	if quest_mgr:
		quest_mgr.update_objective_progress("cleansing_of_patala", "defeat_shesha_echo", 1)

	if hud:
		hud.hide_boss_bar()
		hud.show_banner("✦ SHESHA'S ECHO PURIFIED! ✦\nThe Nagamani Peetham radiates cleansing light.", 4.5)
		_refresh_objective_display()

func _on_peetham_consecrated(_altar: Area3D = null) -> void:
	if quest_mgr:
		quest_mgr.update_objective_progress("cleansing_of_patala", "consecrate_vasuki_peetham", 1)

	is_realm_cleansed = true
	var elapsed = (Time.get_ticks_msec() / 1000.0) - level_start_time

	# Persist save state with tamper verification
	var save_state = SaveSystem.get_default_state()
	save_state["currentRealm"] = "Patala"
	save_state["shardsCollected"] = 12
	save_state["altarConsecrated"] = true
	save_state["playtimeSeconds"] = elapsed
	for r in ["Bhumi", "Antariksha", "Patala"]:
		if not save_state["unlockedRealms"].has(r):
			save_state["unlockedRealms"].append(r)
	SaveSystem.save_game(save_state)

	if hud:
		_refresh_objective_display()
		hud.show_banner("☀️ SACRED NAGAMANI PEETHAM CONSECRATED!\nThe Serpent Vaults are Restored.", 5.0)
		hud.show_victory_overlay(12, elapsed)

func _on_player_health_changed(curr: int, max_hp: int) -> void:
	if hud:
		hud.update_health(curr, max_hp)
	if curr <= 0:
		_on_player_defeated()

func _on_player_shards_changed(shards: int) -> void:
	if hud:
		hud.update_shards(shards, 12)

func _on_player_defeated() -> void:
	if hud:
		hud.show_defeat_overlay()

func _on_retry_requested() -> void:
	_respawn_at_checkpoint()

func _respawn_at_checkpoint() -> void:
	if hud:
		hud.hide_defeat_overlay()
	if player:
		player.global_position = last_checkpoint_pos
		player.velocity = Vector3.ZERO
		player.health = player.max_health
		player.is_guarding = false
		player.is_dashing = false
		player.is_attacking = false
		player.is_gliding = false
		player.is_grappling = false
		player.health_changed.emit(player.max_health, player.max_health)
	if hud:
		hud.update_health(player.max_health, player.max_health)
		hud.show_banner("✦ RESPAWNED AT CAVERN SANCTUARY ✦", 3.0)

func _on_dialogue_requested(dialogue_id: String) -> void:
	if not dialogue_runner or not hud:
		return

	var start_node = "tara_patala_1"
	if dialogue_id == "tara_intro":
		start_node = "tara_intro"

	if dialogue_runner.start(start_node):
		_display_active_dialogue_node()

func _display_active_dialogue_node() -> void:
	if not dialogue_runner or not dialogue_runner.is_active:
		if hud:
			hud.hide_dialogue()
		return

	var node = dialogue_runner.nodes.get(dialogue_runner.current_node_id, null)
	if node and hud:
		hud.show_dialogue(node.speaker, node.speaker_role, node.text, func():
			if dialogue_runner.advance():
				_display_active_dialogue_node()
			else:
				hud.hide_dialogue()
				if quest_mgr:
					quest_mgr.update_objective_progress("cleansing_of_patala", "commune_tara_subterranean", 1)
					_refresh_objective_display()
		)
