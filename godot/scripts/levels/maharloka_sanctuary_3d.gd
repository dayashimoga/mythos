extends Node3D
class_name MaharlokaSanctuary3D

const DialogueRunnerScript = preload("res://scripts/domain/dialogue_runner.gd")
const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const SaveSystem = preload("res://scripts/domain/save_system.gd")
const AstralRishiScript = preload("res://scripts/entities/astral_rishi_3d.gd")
const ScriptureGolemScript = preload("res://scripts/entities/scripture_golem_3d.gd")
const BossBrihaspatiScript = preload("res://scripts/entities/boss_brihaspati_3d.gd")
const AstralGlyphScript = preload("res://scripts/interactables/astral_glyph_3d.gd")
const ScripturePedestalScript = preload("res://scripts/interactables/scripture_pedestal_3d.gd")
const MaharMandalaScript = preload("res://scripts/interactables/mahar_mandala_3d.gd")
const CinematicDirectorScript = preload("res://scripts/cinematics/cinematic_director_3d.gd")
const WorldCollisionBuilderScript = preload("res://scripts/levels/world_collision_builder.gd")

@onready var player: CharacterBody3D = $Player3D
@onready var hud: HUD3D = $HUD3D if has_node("HUD3D") else null
@onready var tara_npc: Node3D = $DeviTaraMahar3D if has_node("DeviTaraMahar3D") else null
@onready var boss_brihaspati: CharacterBody3D = $BossBrihaspati3D
@onready var mahar_mandala_altar: Area3D = $MaharMandala3D

var quest_mgr: RefCounted = null
var dialogue_runner: RefCounted = null

var deciphered_scriptures: int = 0
const TARGET_SCRIPTURES: int = 2
var last_checkpoint_pos: Vector3 = Vector3(0, 1.5, 0)
var level_start_time: float = 0.0
var is_realm_cleansed: bool = false
var cinematic_director: Node = null
var _boss_intro_played: bool = false

func _ready() -> void:
	level_start_time = Time.get_ticks_msec() / 1000.0
	AudioManager3D.set_ambience("maharloka")
	_setup_cinematic_director()
	WorldCollisionBuilderScript.build_collisions(self)
	quest_mgr = QuestManagerScript.new()
	dialogue_runner = DialogueRunnerScript.new()

	quest_mgr.start_mission("wisdom_of_maharloka")

	if player:
		last_checkpoint_pos = player.global_position
		player.health_changed.connect(_on_player_health_changed)
		player.shards_changed.connect(_on_player_shards_changed)
		player.interaction_requested.connect(_on_dialogue_requested)

	if hud:
		hud.set_quest_manager(quest_mgr, "Maharloka")
		hud.update_weapon("Rishi-Stave")
		hud.next_realm_scene_path = "res://scenes/levels/TapolokaForge3D.tscn"
		hud.retry_requested.connect(_on_retry_requested)
		_refresh_objective_display()
		hud.show_banner("✦ REALM OF MAHARLOKA: THE SAGE SANCTUARY ✦\nSeek the eternal cosmic wisdom of the Great Rishis.", 5.0)

	if cinematic_director:
		cinematic_director.play_realm_intro("maharloka")

	if tara_npc:
		tara_npc.dialogue_requested.connect(func(): _on_dialogue_requested("tara_mahar"))

	if boss_brihaspati:
		boss_brihaspati.boss_health_changed.connect(_on_boss_health_changed)
		boss_brihaspati.boss_phase_changed.connect(_on_boss_phase_changed)
		boss_brihaspati.boss_defeated.connect(_on_boss_defeated)

	if is_inside_tree() and get_tree():
		for ped in get_tree().get_nodes_in_group("scripture_pedestals"):
			if ped.has_signal("scripture_deciphered"):
				ped.scripture_deciphered.connect(_on_scripture_deciphered)

	if mahar_mandala_altar:
		mahar_mandala_altar.mandala_consecrated.connect(_on_mandala_consecrated)

func _setup_cinematic_director() -> void:
	if has_node("CinematicDirector3D"):
		cinematic_director = $CinematicDirector3D
	else:
		cinematic_director = CinematicDirectorScript.new()
		cinematic_director.name = "CinematicDirector3D"
		add_child(cinematic_director)

func _physics_process(_delta: float) -> void:
	# Void Fall Safeguard
	if player and player.global_position.y < -25.0:
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
	var m = quest_mgr.get_mission("wisdom_of_maharloka")
	if not m:
		return
	var text = ""
	for obj in m.objectives:
		if not obj.is_completed:
			text = "%s (%d / %d)" % [obj.description, obj.current_count, obj.target_count]
			break
	if text.is_empty():
		text = "CONSECRATED: Maharloka Shines with Astral Wisdom!"
	hud.update_objective(text)

func _on_scripture_deciphered(_pedestal_id: String, title: String) -> void:
	deciphered_scriptures += 1
	if quest_mgr:
		quest_mgr.update_objective_progress("wisdom_of_maharloka", "commune_scriptures", 1)

	if hud:
		hud.show_banner("✦ SCRIPTURE DECIPHERED: %s ✦\n(%d / %d Archives Aligned)" % [title, deciphered_scriptures, TARGET_SCRIPTURES], 3.5)
		_refresh_objective_display()

func _on_boss_health_changed(curr: int, max_hp: int) -> void:
	if not _boss_intro_played and boss_brihaspati:
		_boss_intro_played = true
		if cinematic_director:
			cinematic_director.play_boss_intro("brihaspati", "Brihaspati's Astral Avatar", "Sage Titan of Maharloka", boss_brihaspati.global_position)

	if hud:
		hud.show_boss_bar("Brihaspati — Sage Titan of Maharloka", curr, max_hp)

func _on_boss_phase_changed(phase: int) -> void:
	if hud:
		if phase == 2:
			hud.show_banner("⚡ COSMIC ENLIGHTENMENT! ⚡\nThe Astral Guru channels the infinite Vedic mantra!", 4.0)

func _on_boss_defeated() -> void:
	if quest_mgr:
		quest_mgr.update_objective_progress("wisdom_of_maharloka", "defeat_brihaspati", 1)

	if hud:
		hud.hide_boss_bar()
		hud.show_banner("✦ BRIHASPATI'S AVATAR PURIFIED! ✦\nThe Sacred Mahar Mandala can now be attuned.", 4.5)
		_refresh_objective_display()

func _on_mandala_consecrated(_altar: Area3D = null) -> void:
	if quest_mgr:
		quest_mgr.update_objective_progress("wisdom_of_maharloka", "consecrate_mahar_mandala", 1)

	is_realm_cleansed = true
	var elapsed = (Time.get_ticks_msec() / 1000.0) - level_start_time

	# Persist save state with tamper verification
	var save_state = SaveSystem.get_default_state()
	save_state["currentRealm"] = "Maharloka"
	save_state["shardsCollected"] = 20
	save_state["altarConsecrated"] = true
	save_state["playtimeSeconds"] = elapsed
	for r in ["Bhumi", "Antariksha", "Patala", "Svar", "Maharloka"]:
		if not save_state["unlockedRealms"].has(r):
			save_state["unlockedRealms"].append(r)
	SaveSystem.save_game(save_state)

	_spawn_tapoloka_portal()

	if cinematic_director and mahar_mandala_altar:
		cinematic_director.play_consecration_victory("Maharloka", mahar_mandala_altar.global_position)

	if hud:
		_refresh_objective_display()
		hud.show_banner("🌌 SACRED MAHAR MANDALA CONSECRATED!\nThe Ascension Portal to Tapoloka is Open. [Walk into Blazing Flame Pillar]", 6.0)
		hud.show_victory_overlay(20, elapsed, "Maharloka Sanctuary")

func _spawn_tapoloka_portal() -> void:
	var portal_pos = Vector3(0.0, 1.2, 50.0)
	if mahar_mandala_altar:
		portal_pos = mahar_mandala_altar.global_position + Vector3(0, 1.2, 4.0)

	var portal_area = Area3D.new()
	portal_area.name = "TapolokaAscensionPortal"
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
	light.light_color = Color(1.0, 0.45, 0.1)
	light.light_energy = 8.0
	light.omni_range = 10.0
	portal_area.add_child(light)

	portal_area.body_entered.connect(func(body: Node3D):
		if body is CharacterBody3D or body.name == "Player":
			get_tree().change_scene_to_file("res://scenes/levels/TapolokaForge3D.tscn")
	)
	add_child(portal_area)

func _on_player_health_changed(curr: int, max_hp: int) -> void:
	if hud:
		hud.update_health(curr, max_hp)
	if curr <= 0:
		_on_player_defeated()

func _on_player_shards_changed(shards: int) -> void:
	if hud:
		hud.update_shards(shards, 20)

func _on_player_defeated() -> void:
	if hud:
		hud.show_defeat_overlay()

func _on_retry_requested() -> void:
	if boss_brihaspati and boss_brihaspati.has_method("reset_boss"):
		boss_brihaspati.reset_boss()
	if hud and hud.has_method("hide_boss_bar"):
		hud.hide_boss_bar()
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
		hud.show_banner("✦ RESPAWNED AT ASTRAL TERRACE ✦", 3.0)

func _on_dialogue_requested(dialogue_id: String) -> void:
	if not dialogue_runner or not hud:
		return

	var start_node = "tara_mahar_1"
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
					quest_mgr.update_objective_progress("wisdom_of_maharloka", "commune_tara_astral", 1)
					_refresh_objective_display()
		)
