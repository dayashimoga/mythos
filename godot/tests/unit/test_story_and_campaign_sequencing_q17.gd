class_name TestStoryAndCampaignSequencingQ17
extends RefCounted

## Suite 33: Complete Seven-Realm Story & Gameplay Sequencing (Stage Q17)
## Authoritative tests verifying:
## 1. Declarative campaign state machine versioning, metadata & serialization (v2.0.0)
## 2. Launch flow: MainMenu3D New Game initialization vs Continue state restoration
## 3. Canonical Bhumi story sequence: Commune -> 3 Shards -> Tamas Barrier Dispel -> Kalanemi Defeat -> Altar Consecration -> Portal Unsealed
## 4. Objective prerequisites & anti-skipping: Barrier blocks ridge, Altar locks until Kalanemi defeated
## 5. Save/continue interruption recovery: Exact mid-chapter progress restoration
## 6. Sacred checkpoint retry resilience: Respawn without quest corruption or shard loss
## 7. Chapter replay progression isolation: Unlocked realm safety without main save regression
## 8. Complete seven-realm campaign contract & navigation coordinate completeness

const SaveSystemScript = preload("res://scripts/domain/save_system.gd")
const CampaignGraphScript = preload("res://scripts/domain/campaign_graph.gd")
const QuestManagerScript = preload("res://scripts/domain/quest_manager.gd")
const BhumiValleyScene = preload("res://scenes/levels/BhumiValley3D.tscn")
const MainMenuScene = preload("res://scenes/ui/MainMenu3D.tscn")

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	var backup_save = _backup_save()

	results.append(test_campaign_graph_versioning_and_metadata())
	results.append(test_launch_flow_new_game_vs_continue())
	results.append(test_bhumi_story_sequence_ordered_progression())
	results.append(test_objective_prerequisites_and_anti_skipping())
	results.append(test_save_continue_interruption_recovery())
	results.append(test_checkpoint_retry_resilience())
	results.append(test_chapter_replay_isolation())
	results.append(test_all_seven_realms_campaign_contracts())

	_restore_save(backup_save)
	return results

static func _backup_save() -> String:
	if FileAccess.file_exists(SaveSystemScript.SAVE_PATH):
		var f = FileAccess.open(SaveSystemScript.SAVE_PATH, FileAccess.READ)
		if f:
			var txt = f.get_as_text()
			f.close()
			return txt
	return ""

static func _restore_save(backup: String) -> void:
	if backup != "":
		var f = FileAccess.open(SaveSystemScript.SAVE_PATH, FileAccess.WRITE)
		if f:
			f.store_string(backup)
			f.close()
	else:
		if FileAccess.file_exists(SaveSystemScript.SAVE_PATH):
			DirAccess.remove_absolute(SaveSystemScript.SAVE_PATH)

static func test_campaign_graph_versioning_and_metadata() -> Dictionary:
	var test_name = "test_campaign_graph_versioning_and_metadata"

	if CampaignGraphScript.VERSION != "2.0.0":
		return {"name": test_name, "passed": false, "message": "Expected CampaignGraph version 2.0.0, got %s" % CampaignGraphScript.VERSION}

	var chapters = CampaignGraphScript.get_all_chapters()
	if chapters.size() != 7:
		return {"name": test_name, "passed": false, "message": "Expected 7 chapters in CampaignGraph, got %d" % chapters.size()}

	var total_objs = 0
	for ch in chapters:
		if ch.id.is_empty() or ch.realm_name.is_empty() or ch.title.is_empty():
			return {"name": test_name, "passed": false, "message": "Chapter metadata incomplete for %s" % ch.id}
		if ch.description.is_empty():
			return {"name": test_name, "passed": false, "message": "Narrative description missing for chapter %s" % ch.id}
		if ch.objectives.size() != 4:
			return {"name": test_name, "passed": false, "message": "Chapter %s has %d objectives, expected 4" % [ch.id, ch.objectives.size()]}

		for obj in ch.objectives:
			total_objs += 1
			if obj.id.is_empty() or obj.title.is_empty() or obj.why.is_empty() or obj.how_to_reach.is_empty():
				return {"name": test_name, "passed": false, "message": "Objective %s missing why/how_to_reach" % obj.id}
			if obj.action_prompt.is_empty() or obj.reward_description.is_empty():
				return {"name": test_name, "passed": false, "message": "Objective %s missing action_prompt/reward" % obj.id}

	if total_objs != 28:
		return {"name": test_name, "passed": false, "message": "Expected 28 total campaign objectives, got %d" % total_objs}

	# Test serialization roundtrip
	var serialized = CampaignGraphScript.serialize_campaign_state("cleansing_of_bhumi", ["commune_tara"], {"commune_tara": 1, "reclaim_shards": 2})
	var qm = QuestManagerScript.new()
	CampaignGraphScript.deserialize_campaign_state(qm, serialized)
	var mission = qm.get_mission("cleansing_of_bhumi")
	if not mission:
		return {"name": test_name, "passed": false, "message": "Failed to deserialize mission cleansing_of_bhumi"}

	var obj0 = mission.objectives[0]
	var obj1 = mission.objectives[1]
	if not obj0.is_completed or obj1.current_count != 2:
		return {"name": test_name, "passed": false, "message": "Campaign state deserialization did not restore progress"}

	return {"name": test_name, "passed": true}

static func test_launch_flow_new_game_vs_continue() -> Dictionary:
	var test_name = "test_launch_flow_new_game_vs_continue"

	var menu = MainMenuScene.instantiate()
	if not menu:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate MainMenu3D"}

	var tree = Engine.get_main_loop() as SceneTree
	if tree and tree.root:
		tree.root.add_child(menu)
	menu._ready()

	# 1. Test clean state (no progress): Continue button should be disabled
	var fresh_def = SaveSystemScript.get_default_state()
	fresh_def["shardsCollected"] = 0
	fresh_def["altarConsecrated"] = false
	SaveSystemScript.save_game(fresh_def)
	menu._inspect_save_state()

	var continue_disabled_initially = menu.btn_continue.disabled
	if not continue_disabled_initially:
		if tree and tree.root: tree.root.remove_child(menu)
		menu.free()
		return {"name": test_name, "passed": false, "message": "Continue button should be disabled when no save progress exists"}

	# 2. Test New Game execution: sets up clean fresh campaign
	menu._execute_fresh_new_game()
	var new_save = SaveSystemScript.load_game()
	var new_game_ok = (str(new_save.get("currentRealm", "")) == "Bhumi" and int(new_save.get("shardsCollected", 0)) == 0)

	# 3. Simulate progress: shards collected and checkpoint saved
	new_save["shardsCollected"] = 3
	new_save["checkpointPosition"] = [0.0, 1.2, 7.5]
	SaveSystemScript.save_game(new_save)
	menu._inspect_save_state()

	var continue_enabled_with_save = not menu.btn_continue.disabled
	var summary_text_ok = menu.save_summary_label != null and menu.save_summary_label.text.contains("✦ 3 Shards")

	# 4. New game with existing save should trigger confirmation modal
	menu._on_new_game_pressed()
	var modal_opened = menu.confirm_modal != null and menu.confirm_modal.visible

	if tree and tree.root:
		tree.root.remove_child(menu)
	menu.free()

	var passed = new_game_ok and continue_enabled_with_save and summary_text_ok and modal_opened
	if not passed:
		return {"name": test_name, "passed": false, "message": "NewGameOK=%s, ContinueOK=%s, SummaryOK=%s, ModalOK=%s" % [new_game_ok, continue_enabled_with_save, summary_text_ok, modal_opened]}

	return {"name": test_name, "passed": true}

static func test_bhumi_story_sequence_ordered_progression() -> Dictionary:
	var test_name = "test_bhumi_story_sequence_ordered_progression"
	SaveSystemScript.save_game(SaveSystemScript.get_default_state())

	var world = BhumiValleyScene.instantiate()
	if not world:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate BhumiValley3D"}

	var tree = Engine.get_main_loop() as SceneTree
	if tree and tree.root:
		tree.root.add_child(world)

	world._setup_systems_and_quest()
	world._wire_interactables()

	# Step 1: Initial objective is commune with Tara
	var mission = world.quest_mgr.get_mission("cleansing_of_bhumi")
	if not mission:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "Mission cleansing_of_bhumi not active"}

	var obj_tara = mission.objectives[0]
	if obj_tara.id != "commune_tara" or obj_tara.is_completed:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "Initial objective should be commune_tara"}

	# Step 2: Dialogue with Devi Tara completes objective 1 and unlocks shard recovery
	world.quest_mgr.update_objective_progress("cleansing_of_bhumi", "commune_tara", 1)
	world._refresh_objective_display()
	if not obj_tara.is_completed:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "commune_tara failed to complete"}

	# Step 3: Collect 3 shards to dispel Tamas Barrier
	world._on_shard_collected()
	world._on_shard_collected()
	world._on_shard_collected()

	if world.collected_shards != 3:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "Expected 3 collected shards, got %d" % world.collected_shards}

	if not world.is_barrier_dispelled:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "Tamas barrier was not dispelled after 3 shards"}

	var obj_shards = mission.objectives[1]
	if not obj_shards.is_completed:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "reclaim_shards objective not completed"}

	# Step 4: Defeat General Kalanemi
	world._on_boss_defeated()
	var obj_boss = mission.objectives[2]
	if not obj_boss.is_completed:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "defeat_kalanemi objective not completed"}

	if not world.sun_altar or not world.sun_altar.is_consecration_allowed:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "Sun Altar consecration not allowed after Kalanemi defeat"}

	# Step 5: Consecrate Sun Altar and unseal Antariksha Portal
	world._on_altar_consecrated()
	var obj_altar = mission.objectives[3]
	if not obj_altar.is_completed or not world.is_game_completed:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "Sun Altar consecration objective not completed"}

	var portal = world.find_child("AntarikshaSkyPortal", true, false)
	var portal_unsealed = portal != null

	if tree and tree.root:
		tree.root.remove_child(world)
	world.free()

	if not portal_unsealed:
		return {"name": test_name, "passed": false, "message": "AntarikshaSkyPortal failed to spawn on chapter completion"}

	return {"name": test_name, "passed": true}

static func test_objective_prerequisites_and_anti_skipping() -> Dictionary:
	var test_name = "test_objective_prerequisites_and_anti_skipping"
	SaveSystemScript.save_game(SaveSystemScript.get_default_state())

	var world = BhumiValleyScene.instantiate()
	if not world:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate BhumiValley3D"}

	var tree = Engine.get_main_loop() as SceneTree
	if tree and tree.root:
		tree.root.add_child(world)

	world._setup_systems_and_quest()
	world._wire_interactables()

	# Test 1: Consecration must be blocked before boss is defeated
	if not world.sun_altar:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "Sun Altar not found in Bhumi scene"}

	if world.sun_altar.is_consecration_allowed:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "Altar consecration must be blocked initially"}

	world.sun_altar.interact(world.player)
	if world.sun_altar.is_ignited or not world.sun_altar.blocked_reason.contains("Kalanemi"):
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "Altar allowed premature consecration without boss defeat"}

	# Test 2: Tamas barrier must be blocking while shards < 3
	if not world.tamas_barrier or world.is_barrier_dispelled or world.tamas_barrier.collision_layer == 0:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "Tamas barrier must have active collision initially"}

	# Test 3: Collecting only 2 shards does NOT dispel barrier
	world._on_shard_collected()
	world._on_shard_collected()
	if world.is_barrier_dispelled or world.tamas_barrier.collision_layer == 0:
		if tree and tree.root: tree.root.remove_child(world)
		world.free()
		return {"name": test_name, "passed": false, "message": "Barrier dispelled prematurely with only 2 shards"}

	if tree and tree.root:
		tree.root.remove_child(world)
	world.free()

	return {"name": test_name, "passed": true}

static func test_save_continue_interruption_recovery() -> Dictionary:
	var test_name = "test_save_continue_interruption_recovery"

	# Build a mid-journey save state
	var mid_state = SaveSystemScript.get_default_state()
	mid_state["currentRealm"] = "Bhumi"
	mid_state["shardsCollected"] = 2
	mid_state["checkpointPosition"] = [15.0, 1.2, 42.0]
	mid_state["campaignState"] = CampaignGraphScript.serialize_campaign_state(
		"cleansing_of_bhumi",
		["commune_tara"],
		{"commune_tara": 1, "reclaim_shards": 2, "defeat_kalanemi": 0, "consecrate_altar": 0}
	)
	SaveSystemScript.save_game(mid_state)

	# Instantiate world and verify automatic restoration
	var world = BhumiValleyScene.instantiate()
	if not world:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate BhumiValley3D"}

	var tree = Engine.get_main_loop() as SceneTree
	if tree and tree.root:
		tree.root.add_child(world)

	world._setup_systems_and_quest()

	var shards_restored = (world.collected_shards == 2 and world.player != null and world.player.shards_collected == 2)
	var checkpoint_restored = (world.last_checkpoint_pos.distance_to(Vector3(15.0, 1.2, 42.0)) < 0.1)

	var mission = world.quest_mgr.get_mission("cleansing_of_bhumi")
	var tara_done = mission != null and mission.objectives[0].is_completed
	var shards_count = mission.objectives[1].current_count if mission else 0

	if tree and tree.root:
		tree.root.remove_child(world)
	world.free()

	if not shards_restored:
		return {"name": test_name, "passed": false, "message": "Shards failed to restore: collected=%d, player_shards=%s" % [world.collected_shards, (world.player.shards_collected if world.player else "null")]}
	if not checkpoint_restored:
		return {"name": test_name, "passed": false, "message": "Checkpoint failed to restore: pos=%s" % [world.last_checkpoint_pos]}
	if not tara_done:
		return {"name": test_name, "passed": false, "message": "Tara dialogue objective did not restore as completed"}
	if shards_count != 2:
		return {"name": test_name, "passed": false, "message": "Shard progress count mismatch: %d != 2" % shards_count}

	return {"name": test_name, "passed": true}

static func test_checkpoint_retry_resilience() -> Dictionary:
	var test_name = "test_checkpoint_retry_resilience"
	SaveSystemScript.save_game(SaveSystemScript.get_default_state())

	var world = BhumiValleyScene.instantiate()
	if not world:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate BhumiValley3D"}

	var tree = Engine.get_main_loop() as SceneTree
	if tree and tree.root:
		tree.root.add_child(world)

	world._setup_systems_and_quest()

	# Set checkpoint at Tapas Ridge
	var test_cp = Vector3(45.0, 10.0, -30.0)
	world._on_checkpoint_activated("ridge_cp", test_cp)

	# Collect 2 shards
	world._on_shard_collected()
	world._on_shard_collected()

	# Simulate player taking lethal damage
	if world.player:
		world.player.health = 0
		world._on_player_health_changed(0, 100)

	# Trigger retry
	world._on_retry_requested()

	var player_health_restored = world.player != null and world.player.health == 100
	var actual_pos = world.player.global_position if world.player.is_inside_tree() else world.player.position
	var player_pos_restored = world.player != null and (actual_pos.distance_to(test_cp) < 0.2)
	var shards_preserved = world.collected_shards == 2

	if tree and tree.root:
		tree.root.remove_child(world)
	world.free()

	if not player_health_restored:
		return {"name": test_name, "passed": false, "message": "Player health not restored to 100"}
	if not player_pos_restored:
		return {"name": test_name, "passed": false, "message": "Player position not restored to checkpoint"}
	if not shards_preserved:
		return {"name": test_name, "passed": false, "message": "Shards not preserved on retry"}

	return {"name": test_name, "passed": true}

static func test_chapter_replay_isolation() -> Dictionary:
	var test_name = "test_chapter_replay_isolation"

	# Establish endgame unlocked state
	var endgame_save = SaveSystemScript.get_default_state()
	endgame_save["currentRealm"] = "Patala"
	endgame_save["unlockedRealms"] = ["SanctumOfAstra", "Bhumi", "Antariksha", "Patala"]
	endgame_save["shardsCollected"] = 10
	endgame_save["altarConsecrated"] = true
	SaveSystemScript.save_game(endgame_save)

	# Enter chapter replay mode for Chapter 1
	CampaignGraphScript.is_chapter_replay = true
	CampaignGraphScript.active_replay_chapter = "bhumi"

	var world = BhumiValleyScene.instantiate()
	var tree = Engine.get_main_loop() as SceneTree
	if tree and tree.root:
		tree.root.add_child(world)

	world._setup_systems_and_quest()
	world.collected_shards = 5
	world._save_campaign_snapshot()
	world._on_altar_consecrated()

	if tree and tree.root:
		tree.root.remove_child(world)
	world.free()

	# Verify main save was NOT downgraded or regressed
	var reloaded_save = SaveSystemScript.load_game()
	var current_realm_safe = str(reloaded_save.get("currentRealm", "")) == "Patala"
	var unlocked_safe = reloaded_save.get("unlockedRealms", []).has("Patala")

	# Clean up replay flag
	CampaignGraphScript.is_chapter_replay = false
	CampaignGraphScript.active_replay_chapter = ""

	var passed = current_realm_safe and unlocked_safe
	return {"name": test_name, "passed": passed, "message": "Chapter replay isolated from main campaign save"}

static func test_all_seven_realms_campaign_contracts() -> Dictionary:
	var test_name = "test_all_seven_realms_campaign_contracts"

	var chapters = CampaignGraphScript.get_all_chapters()
	var expected_progression = [
		{"realm": "Bhumi", "next": "Antariksha"},
		{"realm": "Antariksha", "next": "Patala"},
		{"realm": "Patala", "next": "Svar"},
		{"realm": "Svar", "next": "Maharloka"},
		{"realm": "Maharloka", "next": "Tapoloka"},
		{"realm": "Tapoloka", "next": "Satyaloka"},
		{"realm": "Satyaloka", "next": ""}
	]

	for i in range(chapters.size()):
		var ch = chapters[i]
		var exp = expected_progression[i]

		if ch.realm_name != exp["realm"]:
			return {"name": test_name, "passed": false, "message": "Chapter %d realm mismatch: %s != %s" % [i + 1, ch.realm_name, exp["realm"]]}
		if ch.next_realm != exp["next"]:
			return {"name": test_name, "passed": false, "message": "Chapter %d next realm mismatch: %s != %s" % [i + 1, ch.next_realm, exp["next"]]}

		if not ResourceLoader.exists(ch.scene_path):
			return {"name": test_name, "passed": false, "message": "Scene path does not exist for %s: %s" % [ch.realm_name, ch.scene_path]}

		# Verify all 4 objectives have valid 3D coordinates
		for obj in ch.objectives:
			if obj.where_coords == Vector3.ZERO and obj.where_region.is_empty():
				return {"name": test_name, "passed": false, "message": "Objective %s has invalid navigation coordinates" % obj.id}

	return {"name": test_name, "passed": true}
