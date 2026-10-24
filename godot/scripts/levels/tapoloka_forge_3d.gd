extends Node3D
class_name TapolokaForge3D

const DialogueRunnerScript = preload("res://scripts/domain/dialogue_runner.gd")
const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const SaveSystem = preload("res://scripts/domain/save_system.gd")
const AgniBerserkerScript = preload("res://scripts/entities/agni_berserker_3d.gd")
const TapasMagmaHoundScript = preload("res://scripts/entities/tapas_magma_hound_3d.gd")
const BossAgniRudraScript = preload("res://scripts/entities/boss_agni_rudra_3d.gd")
const MagmaGeyserScript = preload("res://scripts/interactables/magma_geyser_3d.gd")
const PrimordialForgeScript = preload("res://scripts/interactables/primordial_forge_3d.gd")
const TapoPeethamScript = preload("res://scripts/interactables/tapo_peetham_3d.gd")

@onready var player: CharacterBody3D = $Player3D
@onready var hud: Control = $HUD3D
@onready var tara_npc: Area3D = $DeviTaraTapo3D
@onready var boss_agni: CharacterBody3D = $BossAgniRudra3D
@onready var tapo_peetham_altar: Area3D = $TapoPeetham3D

var quest_mgr: RefCounted = null
var dialogue_runner: RefCounted = null

var attuned_forges: int = 0
const TARGET_FORGES: int = 2
var last_checkpoint_pos: Vector3 = Vector3(0, 1.5, 0)
var level_start_time: float = 0.0
var is_realm_cleansed: bool = false

func _ready() -> void:
	level_start_time = Time.get_ticks_msec() / 1000.0
	quest_mgr = QuestManagerScript.new()
	dialogue_runner = DialogueRunnerScript.new()

	quest_mgr.start_mission("purification_of_tapoloka")

	if player:
		last_checkpoint_pos = player.global_position
		player.health_changed.connect(_on_player_health_changed)
		player.shards_changed.connect(_on_player_shards_changed)
		player.interaction_requested.connect(_on_dialogue_requested)

	if hud:
		hud.retry_requested.connect(_on_retry_requested)
		_refresh_objective_display()
		hud.show_banner("✦ REALM OF TAPOLOKA: AGNI'S PRIMORDIAL FORGE ✦\nRekindle the sacred fire of divine asceticism.", 5.0)

	if tara_npc:
		tara_npc.dialogue_requested.connect(func(): _on_dialogue_requested("tara_tapo"))

	if boss_agni:
		boss_agni.boss_health_changed.connect(_on_boss_health_changed)
		boss_agni.boss_phase_changed.connect(_on_boss_phase_changed)
		boss_agni.boss_defeated.connect(_on_boss_defeated)

	for forge in get_tree().get_nodes_in_group("forges"):
		if forge.has_signal("forge_attuned"):
			forge.forge_attuned.connect(_on_forge_attuned)

	if tapo_peetham_altar:
		tapo_peetham_altar.peetham_consecrated.connect(_on_peetham_consecrated)

func _physics_process(_delta: float) -> void:
	# Void Fall Safeguard
	if player and player.global_position.y < -30.0:
		_respawn_at_checkpoint()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_F2:
			get_tree().change_scene_to_file("res://scenes/levels/BhumiValley3D.tscn")
		elif event.keycode == KEY_F3:
			get_tree().change_scene_to_file("res://scenes/levels/AntarikshaSkyRealm3D.tscn")
		elif event.keycode == KEY_F4:
			get_tree().change_scene_to_file("res://scenes/levels/PatalaUnderworld3D.tscn")
		elif event.keycode == KEY_F5:
			get_tree().change_scene_to_file("res://scenes/levels/SvarSolarCitadel3D.tscn")
		elif event.keycode == KEY_F6:
			get_tree().change_scene_to_file("res://scenes/levels/MaharlokaSanctuary3D.tscn")
		elif event.keycode == KEY_F8:
			get_tree().change_scene_to_file("res://scenes/levels/SatyalokaApex3D.tscn")

func _refresh_objective_display() -> void:
	if not quest_mgr or not hud:
		return
	var m = quest_mgr.get_mission("purification_of_tapoloka")
	if not m:
		return
	var text = ""
	for obj in m.objectives:
		if not obj.is_completed:
			text = "%s (%d / %d)" % [obj.description, obj.current_count, obj.target_count]
			break
	if text.is_empty():
		text = "CONSECRATED: Tapoloka Blazes with Divine Agni!"
	hud.update_objective(text)

func _on_forge_attuned(_forge_id: String) -> void:
	attuned_forges += 1
	if quest_mgr:
		quest_mgr.update_objective_progress("purification_of_tapoloka", "attune_forges", 1)

	if hud:
		hud.show_banner("✦ PRIMORDIAL ANVIL ATTUNED (%d / %d) ✦\nCosmic Furnace Reignited!" % [attuned_forges, TARGET_FORGES], 3.5)
		_refresh_objective_display()

func _on_boss_health_changed(curr: int, max_hp: int) -> void:
	if hud:
		hud.show_boss_bar("Agni Rudra — Primordial Fire Titan", curr, max_hp)

func _on_boss_phase_changed(phase: int) -> void:
	if hud:
		if phase == 2:
			hud.show_banner("⚡ TAPAS CONFLAGRATION! ⚡\nAgni Rudra unleashes the primordial world-fire!", 4.0)

func _on_boss_defeated() -> void:
	if quest_mgr:
		quest_mgr.update_objective_progress("purification_of_tapoloka", "defeat_agni_rudra", 1)

	if hud:
		hud.hide_boss_bar()
		hud.show_banner("✦ AGNI RUDRA PURIFIED! ✦\nThe Sacred Tapas Peetham can now be ignited.", 4.5)
		_refresh_objective_display()

func _on_peetham_consecrated(_altar: Area3D = null) -> void:
	if quest_mgr:
		quest_mgr.update_objective_progress("purification_of_tapoloka", "consecrate_tapo_peetham", 1)

	is_realm_cleansed = true
	var elapsed = (Time.get_ticks_msec() / 1000.0) - level_start_time

	# Persist save state with tamper verification
	var save_state = SaveSystem.get_default_state()
	save_state["currentRealm"] = "Tapoloka"
	save_state["shardsCollected"] = 24
	save_state["altarConsecrated"] = true
	save_state["playtimeSeconds"] = elapsed
	for r in ["Bhumi", "Antariksha", "Patala", "Svar", "Maharloka", "Tapoloka"]:
		if not save_state["unlockedRealms"].has(r):
			save_state["unlockedRealms"].append(r)
	SaveSystem.save_game(save_state)

	if hud:
		_refresh_objective_display()
		hud.show_banner("🔥 SACRED TAPAS PEETHAM CONSECRATED!\nThe Eternal Sacred Flame is Restored.", 5.0)
		hud.show_victory_overlay(24, elapsed)

func _on_player_health_changed(curr: int, max_hp: int) -> void:
	if hud:
		hud.update_health(curr, max_hp)
	if curr <= 0:
		_on_player_defeated()

func _on_player_shards_changed(shards: int) -> void:
	if hud:
		hud.update_shards(shards, 24)

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
		hud.show_banner("✦ RESPAWNED AT CALDERA THRESHOLD ✦", 3.0)

func _on_dialogue_requested(dialogue_id: String) -> void:
	if not dialogue_runner or not hud:
		return

	var start_node = "tara_tapo_1"
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
					quest_mgr.update_objective_progress("purification_of_tapoloka", "commune_tara_forge", 1)
					_refresh_objective_display()
		)
