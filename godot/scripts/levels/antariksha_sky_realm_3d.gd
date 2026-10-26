extends Node3D
class_name AntarikshaSkyRealm3D

const DialogueRunnerScript = preload("res://scripts/domain/dialogue_runner.gd")
const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const SaveSystem = preload("res://scripts/domain/save_system.gd")
const GaleFalconScript = preload("res://scripts/entities/gale_falcon_3d.gd")
const WindArcherScript = preload("res://scripts/entities/wind_archer_3d.gd")
const BossMatarishvanScript = preload("res://scripts/entities/boss_matarishvan_3d.gd")
const CinematicDirectorScript = preload("res://scripts/cinematics/cinematic_director_3d.gd")

@onready var player: CharacterBody3D = $Player3D
@onready var hud: HUD3D = $HUD3D if has_node("HUD3D") else null
@onready var tara_npc: Node3D = $DeviTaraSky3D if has_node("DeviTaraSky3D") else null
@onready var boss_matarishvan: CharacterBody3D = $BossMatarishvan3D
@onready var gale_peetham_altar: Area3D = $HighGalePeetham3D

var quest_mgr: RefCounted = null
var dialogue_runner: RefCounted = null

var harmonized_turbines: int = 0
const TARGET_TURBINES: int = 2
var last_checkpoint_pos: Vector3 = Vector3(0, 42.0, 0)
var level_start_time: float = 0.0
var is_realm_cleansed: bool = false
var cinematic_director: Node = null
var _boss_intro_played: bool = false

func _ready() -> void:
	level_start_time = Time.get_ticks_msec() / 1000.0
	AudioManager3D.set_ambience("antariksha")
	_setup_cinematic_director()
	quest_mgr = QuestManagerScript.new()
	dialogue_runner = DialogueRunnerScript.new()

	quest_mgr.start_mission("liberation_of_antariksha")

	if player:
		last_checkpoint_pos = player.global_position
		player.health_changed.connect(_on_player_health_changed)
		player.shards_changed.connect(_on_player_shards_changed)
		player.interaction_requested.connect(_on_dialogue_requested)

	if hud:
		hud.set_quest_manager(quest_mgr, "Antariksha")
		hud.update_weapon("Vayu-Chakram")
		hud.next_realm_scene_path = "res://scenes/levels/PatalaUnderworld3D.tscn"
		hud.retry_requested.connect(_on_retry_requested)
		_refresh_objective_display()
		hud.show_banner("✦ REALM OF ANTARIKSHA: THE AERIAL VAULT ✦\nRestore the sacred wind currents of Vayu.", 5.0)

	if cinematic_director:
		cinematic_director.play_realm_intro("antariksha")

	if tara_npc:
		tara_npc.dialogue_requested.connect(func(): _on_dialogue_requested("tara_sky"))

	if boss_matarishvan:
		boss_matarishvan.boss_health_changed.connect(_on_boss_health_changed)
		boss_matarishvan.boss_phase_changed.connect(_on_boss_phase_changed)
		boss_matarishvan.boss_defeated.connect(_on_boss_defeated)

	for turbine in get_tree().get_nodes_in_group("vayu_turbines"):
		if turbine.has_signal("turbine_harmonized"):
			turbine.turbine_harmonized.connect(_on_turbine_harmonized)

	if gale_peetham_altar:
		gale_peetham_altar.shrine_activated.connect(_on_peetham_consecrated)

func _setup_cinematic_director() -> void:
	if has_node("CinematicDirector3D"):
		cinematic_director = $CinematicDirector3D
	else:
		cinematic_director = CinematicDirectorScript.new()
		cinematic_director.name = "CinematicDirector3D"
		add_child(cinematic_director)

func _physics_process(_delta: float) -> void:
	# Void Fall Plane Safeguard: Falling off floating citadels resets to last checkpoint
	if player and player.global_position.y < -15.0:
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
	var m = quest_mgr.get_mission("liberation_of_antariksha")
	if not m:
		return
	var text = ""
	for obj in m.objectives:
		if not obj.is_completed:
			text = "%s (%d / %d)" % [obj.description, obj.current_count, obj.target_count]
			break
	if text.is_empty():
		text = "LIBERATED: The Realm of Antariksha is Cleansed!"
	hud.update_objective(text)

func _on_turbine_harmonized(_turbine_id: String) -> void:
	harmonized_turbines += 1
	if quest_mgr:
		quest_mgr.update_objective_progress("liberation_of_antariksha", "restore_windmills", 1)

	if hud:
		hud.show_banner("✦ VAYU WIND TURBINE HARMONIZED (%d / %d) ✦" % [harmonized_turbines, TARGET_TURBINES], 3.0)
		_refresh_objective_display()

func _on_boss_health_changed(curr: int, max_hp: int) -> void:
	if not _boss_intro_played and boss_matarishvan:
		_boss_intro_played = true
		if cinematic_director:
			cinematic_director.play_boss_intro("matarishvan", "Matarishvan", "Corrupted Cyclone Titan", boss_matarishvan.global_position)

	if hud:
		hud.show_boss_bar("Matarishvan — Corrupted Cyclone Titan", curr, max_hp)

func _on_boss_phase_changed(phase: int) -> void:
	if hud:
		if phase == 2:
			hud.show_banner("⚡ EYE OF THE CYCLONE UNLEASHED! ⚡\nTempest fury intensifies!", 4.0)

func _on_boss_defeated() -> void:
	if quest_mgr:
		quest_mgr.update_objective_progress("liberation_of_antariksha", "defeat_matarishvan", 1)

	if hud:
		hud.hide_boss_bar()
		hud.show_banner("✦ MATARISHVAN PURIFIED! ✦\nThe High Gale Peetham can now be consecrated.", 4.5)
		_refresh_objective_display()

func _on_peetham_consecrated() -> void:
	if quest_mgr:
		quest_mgr.update_objective_progress("liberation_of_antariksha", "consecrate_vayu_peetham", 1)

	is_realm_cleansed = true
	var elapsed = (Time.get_ticks_msec() / 1000.0) - level_start_time

	# Persist save state with tamper verification
	var save_state = SaveSystem.get_default_state()
	save_state["currentRealm"] = "Dyaus"
	save_state["shardsCollected"] = 8
	save_state["altarConsecrated"] = true
	save_state["playtimeSeconds"] = elapsed
	if not save_state["unlockedRealms"].has("Antariksha"):
		save_state["unlockedRealms"].append("Antariksha")
	if not save_state["unlockedRealms"].has("Dyaus"):
		save_state["unlockedRealms"].append("Dyaus")
	SaveSystem.save_game(save_state)

	if cinematic_director and gale_peetham_altar:
		cinematic_director.play_consecration_victory("Antariksha", gale_peetham_altar.global_position)

	if hud:
		_refresh_objective_display()
		hud.show_banner("☀️ HIGH GALE PEETHAM CONSECRATED!\nThe Aerial Vault is Pacified.", 5.0)
		hud.show_victory_overlay(8, elapsed)

	_spawn_patala_descent_portal()

func _spawn_patala_descent_portal() -> void:
	var portal_pos = Vector3(0, 77.0, -125.0)
	if gale_peetham_altar:
		portal_pos = gale_peetham_altar.global_position + Vector3(0, 1.2, 4.0)

	var portal_area = Area3D.new()
	portal_area.name = "PatalaDescentPortal"
	portal_area.collision_layer = 1
	portal_area.collision_mask = 2
	portal_area.position = portal_pos

	var col = CollisionShape3D.new()
	var shape = CylinderShape3D.new()
	shape.radius = 2.5
	shape.height = 3.0
	col.shape = shape
	portal_area.add_child(col)

	var light = OmniLight3D.new()
	light.light_color = Color(0.1, 0.95, 0.5, 1.0)
	light.light_energy = 4.0
	light.omni_range = 8.0
	portal_area.add_child(light)

	portal_area.body_entered.connect(func(body: Node3D):
		if body.is_in_group("player"):
			if hud:
				hud.show_banner("✦ DESCENDING TO PATALA: THE SERPENT VAULTS ✦", 3.0)
			get_tree().create_timer(1.2).timeout.connect(func():
				get_tree().change_scene_to_file("res://scenes/levels/PatalaUnderworld3D.tscn")
			)
	)

	add_child(portal_area)

func _on_player_health_changed(curr: int, max_hp: int) -> void:
	if hud:
		hud.update_health(curr, max_hp)
	if curr <= 0:
		_on_player_defeated()

func _on_player_shards_changed(shards: int) -> void:
	if hud:
		hud.update_shards(shards, 8)

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
		hud.show_banner("✦ RESPAWNED AT SKY SANCTUARY ✦", 3.0)

func _on_dialogue_requested(dialogue_id: String) -> void:
	if not dialogue_runner or not hud:
		return

	var start_node = "tara_sky_1"
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
					quest_mgr.update_objective_progress("liberation_of_antariksha", "commune_tara_sky", 1)
					_refresh_objective_display()
		)
