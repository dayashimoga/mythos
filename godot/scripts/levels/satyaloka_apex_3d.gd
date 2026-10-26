extends Node3D
class_name SatyalokaApex3D

const DialogueRunnerScript = preload("res://scripts/domain/dialogue_runner.gd")
const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const SaveSystem = preload("res://scripts/domain/save_system.gd")
const MokshaSeraphScript = preload("res://scripts/entities/moksha_seraph_3d.gd")
const DharmaSentinelScript = preload("res://scripts/entities/dharma_sentinel_3d.gd")
const BossBrahmaAvataraScript = preload("res://scripts/entities/boss_brahma_avatara_3d.gd")
const DharmachakraNodeScript = preload("res://scripts/interactables/dharmachakra_node_3d.gd")
const BrahmanBridgeScript = preload("res://scripts/interactables/brahman_bridge_3d.gd")
const MokshaPeethamScript = preload("res://scripts/interactables/moksha_peetham_3d.gd")
const CinematicDirectorScript = preload("res://scripts/cinematics/cinematic_director_3d.gd")

@onready var player: CharacterBody3D = $Player3D
@onready var hud: HUD3D = $HUD3D if has_node("HUD3D") else null
@onready var tara_npc: Node3D = $DeviTaraSatya3D if has_node("DeviTaraSatya3D") else null
@onready var boss_brahma: CharacterBody3D = $BossBrahmaAvatara3D
@onready var moksha_peetham_altar: Area3D = $MokshaPeetham3D

var quest_mgr: RefCounted = null
var dialogue_runner: RefCounted = null

var aligned_chakras: int = 0
const TARGET_CHAKRAS: int = 2
var last_checkpoint_pos: Vector3 = Vector3(0, 1.5, 0)
var level_start_time: float = 0.0
var is_realm_cleansed: bool = false
var cinematic_director: Node = null
var _boss_intro_played: bool = false

func _ready() -> void:
	level_start_time = Time.get_ticks_msec() / 1000.0
	AudioManager3D.set_ambience("satyaloka")
	_setup_cinematic_director()
	quest_mgr = QuestManagerScript.new()
	dialogue_runner = DialogueRunnerScript.new()

	quest_mgr.start_mission("ascension_to_satyaloka")

	if player:
		last_checkpoint_pos = player.global_position
		player.health_changed.connect(_on_player_health_changed)
		player.shards_changed.connect(_on_player_shards_changed)
		player.interaction_requested.connect(_on_dialogue_requested)

	if hud:
		hud.set_quest_manager(quest_mgr, "Satyaloka")
		hud.update_weapon("Brahmashira Astra")
		hud.next_realm_scene_path = "res://scenes/levels/BhumiValley3D.tscn"
		hud.retry_requested.connect(_on_retry_requested)
		_refresh_objective_display()
		hud.show_banner("✦ CHAPTER VII: REALM OF SATYALOKA / BRAHMALOKA ✦\nThe Transcendent Apex & Cosmic Wheel of Dharma.", 5.0)

	if cinematic_director:
		cinematic_director.play_realm_intro("satyaloka")

	if tara_npc:
		tara_npc.dialogue_requested.connect(func(): _on_dialogue_requested("tara_satya"))

	if boss_brahma:
		boss_brahma.boss_health_changed.connect(_on_boss_health_changed)
		boss_brahma.boss_phase_changed.connect(_on_boss_phase_changed)
		boss_brahma.boss_defeated.connect(_on_boss_defeated)

	for chakra in get_tree().get_nodes_in_group("dharmachakras"):
		if chakra.has_signal("chakra_aligned"):
			chakra.chakra_aligned.connect(_on_chakra_aligned)

	if moksha_peetham_altar:
		moksha_peetham_altar.peetham_consecrated.connect(_on_moksha_consecrated)

func _setup_cinematic_director() -> void:
	if has_node("CinematicDirector3D"):
		cinematic_director = $CinematicDirector3D
	else:
		cinematic_director = CinematicDirectorScript.new()
		cinematic_director.name = "CinematicDirector3D"
		add_child(cinematic_director)

func _physics_process(_delta: float) -> void:
	# Void Fall Safeguard
	if player and player.global_position.y < -35.0:
		_respawn_at_checkpoint()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_F1: get_tree().change_scene_to_file("res://scenes/studio/CharacterStudio3D.tscn")
			KEY_F2: get_tree().change_scene_to_file("res://scenes/levels/BhumiValley3D.tscn")
			KEY_F3: get_tree().change_scene_to_file("res://scenes/levels/AntarikshaSkyRealm3D.tscn")
			KEY_F4: get_tree().change_scene_to_file("res://scenes/levels/PatalaUnderworld3D.tscn")
			KEY_F5: get_tree().change_scene_to_file("res://scenes/levels/SvarSolarCitadel3D.tscn")
			KEY_F6: get_tree().change_scene_to_file("res://scenes/levels/MaharlokaSanctuary3D.tscn")
			KEY_F7: get_tree().change_scene_to_file("res://scenes/levels/TapolokaForge3D.tscn")
			KEY_F8: get_tree().change_scene_to_file("res://scenes/levels/SatyalokaApex3D.tscn")

func _refresh_objective_display() -> void:
	if not quest_mgr or not hud:
		return
	var m = quest_mgr.get_mission("ascension_to_satyaloka")
	if not m:
		return
	var text = ""
	for obj in m.objectives:
		if not obj.is_completed:
			text = "%s (%d / %d)" % [obj.description, obj.current_count, obj.target_count]
			break
	if text.is_empty():
		text = "CONSECRATED: Cosmic Dharma Restored Across All Realms!"
	hud.update_objective(text)

func _on_chakra_aligned(_node_id: String) -> void:
	aligned_chakras += 1
	if quest_mgr:
		quest_mgr.update_objective_progress("ascension_to_satyaloka", "align_dharmachakras", 1)

	if hud:
		hud.show_banner("✦ DHARMACHAKRA RESONATOR ALIGNED (%d / %d) ✦\nCosmic Law Harmonic Restored!" % [aligned_chakras, TARGET_CHAKRAS], 3.5)
		_refresh_objective_display()

	if aligned_chakras >= TARGET_CHAKRAS:
		_manifest_all_bridges()

func _manifest_all_bridges() -> void:
	for bridge in get_tree().get_nodes_in_group("bridges"):
		if bridge.has_method("manifest_bridge"):
			bridge.manifest_bridge()
	if hud:
		hud.show_banner("⚡ TRANSCENDENT LIGHT BRIDGES MANIFESTED! ⚡\nThe Path to Brahma Avatara is Open!", 4.0)

func _on_boss_health_changed(curr: int, max_hp: int) -> void:
	if not _boss_intro_played and boss_brahma:
		_boss_intro_played = true
		if cinematic_director:
			cinematic_director.play_boss_intro("brahma", "Brahma Avatara", "Four-Headed Creator Titan", boss_brahma.global_position)

	if hud:
		hud.show_boss_bar("Brahma Avatara — Creator-Dissolution Titan", curr, max_hp)

func _on_boss_phase_changed(phase: int) -> void:
	if hud:
		if phase == 2:
			hud.show_banner("⚡ MAHAPRALAYA COSMIC DISSOLUTION! ⚡\nBrahma Avatara enters Phase 2 cosmic dissolution!", 4.0)

func _on_boss_defeated() -> void:
	if quest_mgr:
		quest_mgr.update_objective_progress("ascension_to_satyaloka", "defeat_brahma_avatara", 1)

	if hud:
		hud.hide_boss_bar()
		hud.show_banner("✦ BRAHMA AVATARA LIBERATED! ✦\nThe Moksha Mahapeetham can now be attuned.", 4.5)
		_refresh_objective_display()

func _on_moksha_consecrated(_altar: Area3D = null) -> void:
	if quest_mgr:
		quest_mgr.update_objective_progress("ascension_to_satyaloka", "consecrate_moksha_peetham", 1)
		quest_mgr.complete_mission("ascension_to_satyaloka")

	is_realm_cleansed = true
	var elapsed = (Time.get_ticks_msec() / 1000.0) - level_start_time

	# Persist final campaign save state with tamper verification
	var save_state = SaveSystem.get_default_state()
	save_state["currentRealm"] = "Satyaloka"
	save_state["shardsCollected"] = 28
	save_state["altarConsecrated"] = true
	save_state["playtimeSeconds"] = elapsed
	for r in ["Bhumi", "Antariksha", "Patala", "Svar", "Maharloka", "Tapoloka", "Satyaloka"]:
		if not save_state["unlockedRealms"].has(r):
			save_state["unlockedRealms"].append(r)
	SaveSystem.save_game(save_state)

	_spawn_cosmic_cycle_portal()

	if cinematic_director and moksha_peetham_altar:
		cinematic_director.play_campaign_resolution(moksha_peetham_altar.global_position)

	if hud:
		_refresh_objective_display()
		hud.show_banner("🕉️ MOKSHA ATTAINED — SEVEN REALMS HARMONIZED! 🕉️\nThe Cosmic Dharma Turns for Eternity. [Cosmic Cycle Portal Open]", 6.0)
		hud.show_victory_overlay(28, elapsed, "Satyaloka Apex - Campaign Completed")

func _spawn_cosmic_cycle_portal() -> void:
	var portal_pos = Vector3(0.0, 1.2, 50.0)
	if moksha_peetham_altar:
		portal_pos = moksha_peetham_altar.global_position + Vector3(0, 1.2, 4.0)

	var portal_area = Area3D.new()
	portal_area.name = "CosmicCycleAscensionPortal"
	portal_area.collision_layer = 1
	portal_area.collision_mask = 2
	portal_area.position = portal_pos

	var col = CollisionShape3D.new()
	var shape = CylinderShape3D.new()
	shape.radius = 2.5
	shape.height = 4.0
	col.shape = shape
	portal_area.add_child(col)

	var light = OmniLight3D.new()
	light.light_color = Color(1.0, 1.0, 1.0)
	light.light_energy = 10.0
	light.omni_range = 12.0
	portal_area.add_child(light)

	portal_area.body_entered.connect(func(body: Node3D):
		if body is CharacterBody3D or body.name == "Player":
			get_tree().change_scene_to_file("res://scenes/levels/BhumiValley3D.tscn")
	)
	add_child(portal_area)

func _on_player_health_changed(curr: int, max_hp: int) -> void:
	if hud:
		hud.update_health(curr, max_hp)
	if curr <= 0:
		_on_player_defeated()

func _on_player_shards_changed(shards: int) -> void:
	if hud:
		hud.update_shards(shards, 28)

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
		hud.show_banner("✦ RESPAWNED AT SATYALOKA LOTUS THRESHOLD ✦", 3.0)

func _on_dialogue_requested(dialogue_id: String) -> void:
	if not dialogue_runner or not hud:
		return

	var start_node = "tara_satya_1"
	if dialogue_id == "tara_intro":
		start_node = "tara_intro"

	if tara_npc and tara_npc.has_method("play_talk"):
		tara_npc.play_talk()

	if dialogue_runner.start(start_node):
		_display_active_dialogue_node()

func _display_active_dialogue_node() -> void:
	if not dialogue_runner or not dialogue_runner.is_active:
		if hud:
			hud.hide_dialogue()
		if tara_npc and tara_npc.has_method("play_idle"):
			tara_npc.play_idle()
		return

	var node = dialogue_runner.nodes.get(dialogue_runner.current_node_id, null)
	if node and hud:
		hud.show_dialogue(node.speaker, node.speaker_role, node.text, func():
			if dialogue_runner.advance():
				_display_active_dialogue_node()
			else:
				hud.hide_dialogue()
				if tara_npc and tara_npc.has_method("play_bless"):
					tara_npc.play_bless()
				if quest_mgr:
					quest_mgr.update_objective_progress("ascension_to_satyaloka", "commune_tara_satya", 1)
					_refresh_objective_display()
		)
