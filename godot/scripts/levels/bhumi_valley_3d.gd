class_name BhumiValley3D
extends Node3D

## Master Controller for the 3D Landscape of the Mortal Realm (Bhumi)
## Stage E: Complete Entertaining Gameplay Vertical Slice
## Features:
## 1. 180m x 180m explorable mythological world (Sanctum, Kalyani, Dandaka, Tapas, Watchtower).
## 2. Integrated QuestManager driving campaign quest "cleansing_of_bhumi".
## 3. DialogueRunner driving interactive branching dialogue with Devi Tara.
## 4. Multi-phase Boss encounter with General Kalanemi (Phase 1 cleaves/slams, Phase 2 enrage/charge).
## 5. Asura Demonic Warriors with perception, chase, telegraph, and poise stagger.
## 6. Dynamic Tamas Barrier dispelled upon collecting 3 Astra Shards.
## 7. Checkpoint persistence, SaveSystem serialization, and Defeat/Victory retry loops.

enum WorldRegion {
	NONE,
	SANCTUM_SURYA_KUND,
	KALYANI_RESERVOIR,
	DANDAKA_GROVE,
	TAPAS_RIDGE,
	RUINS_WATCHTOWER
}

const BhumiTerrainGeneratorScript = preload("res://scripts/levels/bhumi_terrain_generator.gd")
const AsuraWarriorScript = preload("res://scripts/entities/asura_warrior_3d.gd")
const BossKalanemiScript = preload("res://scripts/entities/boss_kalanemi_3d.gd")
const CinematicDirectorScript = preload("res://scripts/cinematics/cinematic_director_3d.gd")
const WorldCollisionBuilderScript = preload("res://scripts/levels/world_collision_builder.gd")

var current_region: WorldRegion = WorldRegion.NONE
var collected_shards: int = 0
const TARGET_SHARDS: int = 5
const SHARDS_FOR_BARRIER: int = 3

var quest_mgr: QuestManager = null
var dialogue_runner: DialogueRunner = null
var last_checkpoint_pos: Vector3 = Vector3(0.0, 1.2, 6.0)
var level_start_time: float = 0.0
var is_barrier_dispelled: bool = false
var is_game_completed: bool = false
var cinematic_director: Node = null
var _boss_intro_played: bool = false
var _barrier_hint_timer: float = 0.0
var _altar_hint_timer: float = 0.0

@onready var player: PlayerController3D = $Player3D if has_node("Player3D") else null
@onready var hud: HUD3D = $HUD3D if has_node("HUD3D") else null
@onready var sun_altar: SunShrine3D = $Interactables/SunShrine3D if has_node("Interactables/SunShrine3D") else null
@onready var terrain_container: Node3D = $TerrainContainer if has_node("TerrainContainer") else null
@onready var tamas_barrier: StaticBody3D = $Architecture/TamasBarrier if has_node("Architecture/TamasBarrier") else null
@onready var boss_kalanemi: CharacterBody3D = $Enemies/BossKalanemi if has_node("Enemies/BossKalanemi") else null
@onready var tara_npc: Node3D = $NPCs/DeviTara3D if has_node("NPCs/DeviTara3D") else null


var _region_names = {
	WorldRegion.SANCTUM_SURYA_KUND: "Sanctum of Surya-Kund",
	WorldRegion.KALYANI_RESERVOIR: "Kalyani Stepped Reservoir",
	WorldRegion.DANDAKA_GROVE: "Dandaka Sacred Grove",
	WorldRegion.TAPAS_RIDGE: "Tapas Mountain Ridge",
	WorldRegion.RUINS_WATCHTOWER: "Ruins of Kalanemi Watchtower"
}

func _ready() -> void:
	level_start_time = Time.get_ticks_msec() / 1000.0
	AudioManager3D.set_ambience("bhumi")

	_setup_cinematic_director()
	_setup_terrain_mesh()
	_setup_water_plane()
	WorldCollisionBuilderScript.build_collisions(self)
	_setup_systems_and_quest()
	_wire_interactables()
	_wire_enemies_and_boss()
	_wire_player_and_hud()

	if hud:
		hud.set_quest_manager(quest_mgr, "Bhumi")
		hud.update_weapon("Surya-Kripana")
		hud.update_shards(collected_shards, TARGET_SHARDS)
		_refresh_objective_display()
		hud.show_banner("WELCOME TO THE REALM OF BHUMI\nAct I: Cleansing of the Bhumi Valley", 4.5)

	if cinematic_director:
		cinematic_director.play_realm_intro("bhumi")

func _setup_cinematic_director() -> void:
	if has_node("CinematicDirector3D"):
		cinematic_director = $CinematicDirector3D
	else:
		cinematic_director = CinematicDirectorScript.new()
		cinematic_director.name = "CinematicDirector3D"
		add_child(cinematic_director)

func _physics_process(delta: float) -> void:
	if not player:
		return

	if _barrier_hint_timer > 0.0:
		_barrier_hint_timer -= delta
	if _altar_hint_timer > 0.0:
		_altar_hint_timer -= delta

	_update_world_region(player.global_position)
	_check_contextual_navigation_hints()
	_handle_debug_navigation()

func _check_contextual_navigation_hints() -> void:
	if not player or not hud:
		return

	var p_pos = player.global_position

	# Barrier guidance hint
	if tamas_barrier and not is_barrier_dispelled and _barrier_hint_timer <= 0.0:
		var b_pos = tamas_barrier.global_position if tamas_barrier.is_inside_tree() else tamas_barrier.position
		if p_pos.distance_to(b_pos) < 9.0:
			hud.show_banner("⚠️ TAMAS BARRIER BARS THE ASCENT!\nCollect 3 Astra Shards in Dandaka Grove and Kalyani Reservoir.", 4.0)
			_barrier_hint_timer = 12.0

	# Sun Altar premature approach hint
	if sun_altar and not is_game_completed and collected_shards < SHARDS_FOR_BARRIER and _altar_hint_timer <= 0.0:
		var a_pos = sun_altar.global_position if sun_altar.is_inside_tree() else sun_altar.position
		if p_pos.distance_to(a_pos) < 4.0:
			hud.show_banner("☀️ The Altar of Surya awaits purification.\nFirst commune with Devi Tara in Dandaka Grove.", 3.5)
			_altar_hint_timer = 10.0

func _update_world_region(pos: Vector3) -> void:
	var new_region: WorldRegion = _evaluate_region_at(pos.x, pos.z, pos.y)
	if new_region != current_region:
		current_region = new_region
		if current_region in _region_names:
			var reg_name: String = _region_names[current_region]
			if hud:
				hud.show_banner("ENTERING REGION:\n" + reg_name.to_upper(), 3.0)
		if current_region == WorldRegion.RUINS_WATCHTOWER and not _boss_intro_played and boss_kalanemi:
			_boss_intro_played = true
			if cinematic_director:
				cinematic_director.play_boss_intro("kalanemi", "General Kalanemi", "Corrupted Asura General", boss_kalanemi.global_position)

func _evaluate_region_at(x: float, z: float, y: float) -> WorldRegion:
	# 1. Ruined Watchtower (High mountain fortress at x: [42, 70], z: [-60, -30], y >= 10.5)
	if x >= 42.0 and x <= 70.0 and z >= -60.0 and z <= -30.0 and y >= 10.5:
		return WorldRegion.RUINS_WATCHTOWER

	# 2. Tapas Mountain Ridge (x >= 24.0, z <= 24.0)
	if x >= 24.0 and z <= 24.0:
		return WorldRegion.TAPAS_RIDGE

	# 3. Kalyani Stepped Reservoir (x: [-26, 14], z: [24, 66])
	if x >= -26.0 and x <= 14.0 and z >= 24.0 and z <= 66.0:
		return WorldRegion.KALYANI_RESERVOIR

	# 4. Sanctum of Surya-Kund (|x| <= 22.0, |z| <= 22.0)
	if abs(x) <= 22.0 and abs(z) <= 22.0:
		return WorldRegion.SANCTUM_SURYA_KUND

	# 5. Dandaka Sacred Grove
	return WorldRegion.DANDAKA_GROVE

func _setup_systems_and_quest() -> void:
	quest_mgr = QuestManager.new()
	dialogue_runner = DialogueRunner.new()

	# Start Stage E campaign quest
	quest_mgr.start_mission("cleansing_of_bhumi")

	# Save checkpoint initial state
	if player:
		last_checkpoint_pos = player.global_position

func _refresh_objective_display() -> void:
	if not hud or not quest_mgr:
		return

	var mission = quest_mgr.get_mission("cleansing_of_bhumi")
	if not mission:
		return

	var active_obj: QuestManager.Objective = null
	for obj in mission.objectives:
		if not obj.is_completed:
			active_obj = obj
			break

	if active_obj:
		var text = "%s (%d / %d)" % [active_obj.description, active_obj.current_count, active_obj.target_count]
		hud.update_objective(text)

		match active_obj.id:
			"commune_tara":
				var tara_pos = tara_npc.global_position if (tara_npc and tara_npc.is_inside_tree()) else Vector3(-24.0, 1.2, -13.0)
				hud.set_waypoint(tara_pos, "Commune with Devi Tara")
			"reclaim_shards":
				var nearest_shard_pos = _find_nearest_uncollected_shard_pos()
				hud.set_waypoint(nearest_shard_pos, "Astra Shard (%d / 3)" % collected_shards)
			"defeat_kalanemi":
				var boss_pos = boss_kalanemi.global_position if (boss_kalanemi and boss_kalanemi.is_inside_tree()) else Vector3(55.0, 12.0, -45.0)
				hud.set_waypoint(boss_pos, "General Kalanemi")
			"consecrate_altar":
				var altar_pos = sun_altar.global_position if (sun_altar and sun_altar.is_inside_tree()) else Vector3(0.0, 2.82, -2.0)
				hud.set_waypoint(altar_pos, "High Sun Altar")
			_:
				hud.clear_waypoint()
	else:
		var text = "CONSECRATED: The Realm of Bhumi is Cleansed!"
		hud.update_objective(text)
		var portal = find_child("AntarikshaSkyPortal", true, false)
		if portal:
			hud.set_waypoint(portal.global_position, "Antariksha Portal")
		elif sun_altar:
			hud.set_waypoint(sun_altar.global_position, "Antariksha Portal")
		else:
			hud.clear_waypoint()

func _find_nearest_uncollected_shard_pos() -> Vector3:
	var p_pos = player.global_position if player else Vector3.ZERO
	var min_dist = 99999.0
	var best_pos = Vector3(-6.0, 1.0, 28.0) # Fallback near Kalyani pool

	var shards = get_tree().get_nodes_in_group("shards") if is_inside_tree() else []
	for s in shards:
		if is_instance_valid(s) and s.visible:
			var s_pos = s.global_position if s.is_inside_tree() else s.position
			var d = p_pos.distance_to(s_pos)
			if d < min_dist:
				min_dist = d
				best_pos = s_pos
	return best_pos

func _setup_terrain_mesh() -> void:
	if not terrain_container:
		terrain_container = Node3D.new()
		terrain_container.name = "TerrainContainer"
		add_child(terrain_container)

	var terrain_mesh: ArrayMesh = BhumiTerrainGeneratorScript.create_terrain_mesh()
	var terrain_mat: StandardMaterial3D = BhumiTerrainGeneratorScript.create_terrain_material()

	var mi: MeshInstance3D = MeshInstance3D.new()
	mi.name = "TerrainMeshInstance"
	mi.mesh = terrain_mesh
	mi.material_override = terrain_mat
	terrain_container.add_child(mi)

	var static_body: StaticBody3D = StaticBody3D.new()
	static_body.name = "TerrainStaticBody"
	static_body.collision_layer = 1
	static_body.collision_mask = 0

	var col_shape: CollisionShape3D = CollisionShape3D.new()
	col_shape.name = "TerrainCollisionShape"
	col_shape.shape = terrain_mesh.create_trimesh_shape()

	static_body.add_child(col_shape)
	terrain_container.add_child(static_body)

func _setup_water_plane() -> void:
	var water_container: Node3D = Node3D.new()
	water_container.name = "WaterContainer"
	water_container.position = Vector3(-6.0, -0.65, 45.0)

	var water_mesh: PlaneMesh = BhumiTerrainGeneratorScript.create_water_mesh()
	var water_mat: StandardMaterial3D = BhumiTerrainGeneratorScript.create_water_material()

	var mi: MeshInstance3D = MeshInstance3D.new()
	mi.name = "WaterMeshInstance"
	mi.mesh = water_mesh
	mi.material_override = water_mat
	water_container.add_child(mi)

	add_child(water_container)

func _wire_interactables() -> void:
	# Connect all Astra Shards in scene
	for shard in get_tree().get_nodes_in_group("shards"):
		if shard.has_signal("shard_collected") and not shard.shard_collected.is_connected(_on_shard_collected):
			shard.shard_collected.connect(_on_shard_collected)

	# Connect Sun Altar
	if sun_altar and sun_altar.has_signal("shrine_consecrated") and not sun_altar.shrine_consecrated.is_connected(_on_altar_consecrated):
		sun_altar.shrine_consecrated.connect(_on_altar_consecrated)

	# Connect Devi Tara NPC
	for npc in get_tree().get_nodes_in_group("npcs"):
		if npc.has_signal("dialogue_requested") and not npc.dialogue_requested.is_connected(_on_dialogue_requested):
			npc.dialogue_requested.connect(_on_dialogue_requested)

	# Connect Checkpoints
	for cp in get_tree().get_nodes_in_group("checkpoints"):
		if cp.has_signal("checkpoint_activated") and not cp.checkpoint_activated.is_connected(_on_checkpoint_activated):
			cp.checkpoint_activated.connect(_on_checkpoint_activated)

func _wire_enemies_and_boss() -> void:
	# Connect Boss Kalanemi
	if boss_kalanemi:
		if boss_kalanemi.has_signal("boss_health_changed") and not boss_kalanemi.boss_health_changed.is_connected(_on_boss_health_changed):
			boss_kalanemi.boss_health_changed.connect(_on_boss_health_changed)
		if boss_kalanemi.has_signal("boss_phase_changed") and not boss_kalanemi.boss_phase_changed.is_connected(_on_boss_phase_changed):
			boss_kalanemi.boss_phase_changed.connect(_on_boss_phase_changed)
		if boss_kalanemi.has_signal("boss_defeated") and not boss_kalanemi.boss_defeated.is_connected(_on_boss_defeated):
			boss_kalanemi.boss_defeated.connect(_on_boss_defeated)

	# Connect Asura Warriors
	for enemy in get_tree().get_nodes_in_group("enemies"):
		if enemy.has_signal("warrior_defeated"):
			if not enemy.warrior_defeated.is_connected(_on_warrior_defeated):
				enemy.warrior_defeated.connect(_on_warrior_defeated)

func _wire_player_and_hud() -> void:
	if player and hud:
		hud.set_player(player)
		if player.has_signal("health_changed") and not player.health_changed.is_connected(_on_player_health_changed):
			player.health_changed.connect(_on_player_health_changed)
		hud.update_health(int(player.health), 100)

	if hud and not hud.retry_requested.is_connected(_on_retry_requested):
		hud.retry_requested.connect(_on_retry_requested)

func _on_player_health_changed(curr: int, max_hp: int) -> void:
	if hud:
		hud.update_health(curr, max_hp)
	if curr <= 0:
		if hud:
			hud.show_defeat_overlay()

func _on_retry_requested() -> void:
	if player:
		if player.is_inside_tree():
			player.global_position = last_checkpoint_pos
		else:
			player.position = last_checkpoint_pos
		player.velocity = Vector3.ZERO
		player.health = 100
		player.is_guarding = false
		player.is_dashing = false
		player.is_attacking = false
		player.health_changed.emit(100, 100)
	if boss_kalanemi and boss_kalanemi.has_method("reset_boss"):
		boss_kalanemi.reset_boss()
	if hud:
		hud.update_health(100, 100)
		hud.hide_boss_bar()
		hud.show_banner("✦ RESPAWNED AT SACRED CHECKPOINT ✦", 3.0)

func _on_shard_collected() -> void:
	collected_shards += 1
	if quest_mgr:
		quest_mgr.update_objective_progress("cleansing_of_bhumi", "reclaim_shards", 1)

	if hud:
		hud.update_shards(collected_shards, TARGET_SHARDS)
		_refresh_objective_display()

	if collected_shards >= SHARDS_FOR_BARRIER and not is_barrier_dispelled:
		_dispel_tamas_barrier()
	elif collected_shards < TARGET_SHARDS:
		if hud:
			hud.show_banner("✦ ASTRA SHARD RECOVERED (%d / %d)" % [collected_shards, TARGET_SHARDS], 2.5)

func _dispel_tamas_barrier() -> void:
	is_barrier_dispelled = true
	if tamas_barrier:
		var tween = create_tween()
		tween.tween_property(tamas_barrier, "scale", Vector3(1.0, 0.05, 1.0), 0.8)
		tween.tween_callback(func():
			tamas_barrier.collision_layer = 0
			tamas_barrier.visible = false
		)

	if hud:
		hud.show_banner("⚡ TAMAS BARRIER SHATTERED! ⚡\nThe Path to Watchtower Ruins is Open.", 4.5)
	_refresh_objective_display()

func _on_altar_consecrated() -> void:
	if quest_mgr:
		quest_mgr.update_objective_progress("cleansing_of_bhumi", "consecrate_altar", 1)

	is_game_completed = true
	var elapsed = (Time.get_ticks_msec() / 1000.0) - level_start_time

	# Persist save state with tamper verification
	var save_state = SaveSystem.get_default_state()
	save_state["currentRealm"] = "Antariksha"
	save_state["shardsCollected"] = collected_shards
	save_state["altarConsecrated"] = true
	save_state["playtimeSeconds"] = elapsed
	if not save_state["unlockedRealms"].has("Antariksha"):
		save_state["unlockedRealms"].append("Antariksha")
	SaveSystem.save_game(save_state)

	_spawn_antariksha_portal()

	if cinematic_director and sun_altar:
		cinematic_director.play_consecration_victory("Bhumi", sun_altar.global_position)

	if hud:
		_refresh_objective_display()
		hud.show_banner("☀️ SURYA PEETHAM CONSECRATED!\nThe Sky Portal to Antariksha is Open. [Press E or Walk Into Beam to Ascend]", 6.0)
		hud.show_victory_overlay(collected_shards, elapsed)

func _on_dialogue_requested(dialogue_id: String) -> void:
	if not dialogue_runner or not hud:
		return

	var start_node = "tara_dandaka_1"
	if dialogue_id == "tara_intro":
		start_node = "tara_intro"

	for tara in get_tree().get_nodes_in_group("npcs"):
		if tara.has_method("play_talk"):
			tara.play_talk()

	if dialogue_runner.start(start_node):
		_display_active_dialogue_node()

func _display_active_dialogue_node() -> void:
	if not dialogue_runner or not dialogue_runner.is_active:
		if hud:
			hud.hide_dialogue()
		for tara in get_tree().get_nodes_in_group("npcs"):
			if tara.has_method("play_idle"):
				tara.play_idle()
		return

	var node = dialogue_runner.nodes.get(dialogue_runner.current_node_id, null)
	if node and hud:
		hud.show_dialogue(node.speaker, node.speaker_role, node.text, func():
			if dialogue_runner.advance():
				_display_active_dialogue_node()
			else:
				hud.hide_dialogue()
				for tara in get_tree().get_nodes_in_group("npcs"):
					if tara.has_method("play_bless"):
						tara.play_bless()
				# Mark objective completed
				if quest_mgr:
					quest_mgr.update_objective_progress("cleansing_of_bhumi", "commune_tara", 1)
					_refresh_objective_display()
		)

func _on_checkpoint_activated(cp_id: String, pos: Vector3) -> void:
	last_checkpoint_pos = pos
	if hud:
		hud.show_banner("RESONANCE CHECKPOINT ATTUNED:\nRespawn Coordinates Harmonized.", 3.0)

func _on_boss_health_changed(curr: int, max_hp: int) -> void:
	if hud:
		hud.show_boss_bar("Kalanemi — Corrupted Asura General", curr, max_hp)

func _on_boss_phase_changed(phase: int) -> void:
	if hud:
		if phase == 2:
			hud.show_banner("🔥 ENRAGED TAMAS FLARE! 🔥\nGeneral Kalanemi unleashes void fury!", 4.0)

func _on_boss_defeated() -> void:
	if quest_mgr:
		quest_mgr.update_objective_progress("cleansing_of_bhumi", "defeat_kalanemi", 1)

	if hud:
		hud.hide_boss_bar()
		hud.show_banner("✦ GENERAL KALANEMI PURIFIED! ✦\nThe High Sun Altar can now be consecrated.", 4.5)
		_refresh_objective_display()

func _on_warrior_defeated(_warrior: CharacterBody3D) -> void:
	if hud:
		hud.show_banner("✦ ASURA FOE DISPELLED ✦\n+50 Solar Essence", 2.0)

func _handle_debug_navigation() -> void:
	if Input.is_key_pressed(KEY_F1):
		get_tree().change_scene_to_file("res://scenes/studio/CharacterStudio3D.tscn")
	elif Input.is_key_pressed(KEY_F2):
		get_tree().change_scene_to_file("res://scenes/levels/BhumiValley3D.tscn")
	elif Input.is_key_pressed(KEY_F3):
		get_tree().change_scene_to_file("res://scenes/levels/AntarikshaSkyRealm3D.tscn")
	elif Input.is_key_pressed(KEY_F4):
		get_tree().change_scene_to_file("res://scenes/levels/PatalaUnderworld3D.tscn")
	elif Input.is_key_pressed(KEY_F5):
		get_tree().change_scene_to_file("res://scenes/levels/SvarSolarCitadel3D.tscn")
	elif Input.is_key_pressed(KEY_F6):
		get_tree().change_scene_to_file("res://scenes/levels/MaharlokaSanctuary3D.tscn")
	elif Input.is_key_pressed(KEY_F7):
		get_tree().change_scene_to_file("res://scenes/levels/TapolokaForge3D.tscn")
	elif Input.is_key_pressed(KEY_F8):
		get_tree().change_scene_to_file("res://scenes/levels/SatyalokaApex3D.tscn")

func _spawn_antariksha_portal() -> void:
	var portal_pos = Vector3(12.0, 10.0, 32.0)
	if sun_altar:
		portal_pos = sun_altar.global_position + Vector3(0, 1.0, 0)

	var portal_area = Area3D.new()
	portal_area.name = "AntarikshaSkyPortal"
	portal_area.collision_layer = 1
	portal_area.collision_mask = 1
	portal_area.position = portal_pos

	var col = CollisionShape3D.new()
	var sphere = SphereShape3D.new()
	sphere.radius = 3.5
	col.shape = sphere
	portal_area.add_child(col)

	var beam_mesh = CylinderMesh.new()
	beam_mesh.top_radius = 1.2
	beam_mesh.bottom_radius = 1.2
	beam_mesh.height = 30.0

	var beam_mat = StandardMaterial3D.new()
	beam_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	beam_mat.albedo_color = Color(0.2, 0.9, 1.0, 0.6)
	beam_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	beam_mat.emission_enabled = true
	beam_mat.emission = Color(0.3, 0.95, 1.0)
	beam_mat.emission_energy_multiplier = 4.0

	var beam_instance = MeshInstance3D.new()
	beam_instance.mesh = beam_mesh
	beam_instance.material_override = beam_mat
	beam_instance.position = Vector3(0, 15.0, 0)
	portal_area.add_child(beam_instance)

	portal_area.body_entered.connect(func(body):
		if body is PlayerController3D or body.name == "Player3D":
			if hud:
				hud.show_banner("✦ ASCENDING TO CHAPTER II: REALM OF ANTARIKSHA ✦", 2.0)
			get_tree().create_timer(0.6).timeout.connect(func():
				get_tree().change_scene_to_file("res://scenes/levels/AntarikshaSkyRealm3D.tscn")
			)
	)

	add_child(portal_area)
