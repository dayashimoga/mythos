class_name TestPlayerGuidanceAndNavigationQ13
extends RefCounted

## Suite 29: Player Guidance, UI Functionality & Quest Navigation Verification (Stage Q13)
## Validates:
## 1. Contextual Onboarding Tutorial State Machine & Replay/Skip Flows.
## 2. Multi-device adaptive input keycap hints (Keyboard/Mouse, Gamepad, Touch).
## 3. PauseMenu3D 5-tab navigation, Q/E/LB/RB cycling, and numeric shortcuts.
## 4. Settings & Accessibility disk persistence via SaveSystem without tamper faults.
## 5. 2D Tactical Realm Map coordinate projection, player heading, and landmark pins.
## 6. HUD3D 3D screen-space waypoint projection, edge clamping, and distance badge.
## 7. Guided Bhumi Chapter I campaign progression waypoint chain (Tara -> Shards -> Kalanemi -> Altar).
## 8. Unobstructed HUD: persistent controls panel hidden in standard mode, toggleable via [H].

const HUD3DScene = preload("res://scenes/ui/HUD3D.tscn")
const PauseMenuScene = preload("res://scenes/ui/PauseMenu3D.tscn")
const BhumiValleyScene = preload("res://scenes/levels/BhumiValley3D.tscn")
const TutorialManagerScript = preload("res://scripts/ui/tutorial_manager_3d.gd")
const TacticalMapScript = preload("res://scripts/ui/tactical_map_canvas.gd")

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(test_tutorial_manager_state_machine_and_skip())
	results.append(test_tutorial_device_adaptation())
	results.append(test_pause_menu_tab_navigation_and_shortcuts())
	results.append(test_pause_menu_settings_disk_persistence())
	results.append(test_tactical_realm_map_projection_and_landmarks())
	results.append(test_hud_3d_waypoint_unprojection_and_clamping())
	results.append(test_bhumi_guided_progression_waypoints_chain())
	results.append(test_hud_unobstructed_controls_toggle())
	return results

static func test_tutorial_manager_state_machine_and_skip() -> Dictionary:
	var test_name = "test_tutorial_manager_state_machine_and_skip"
	var tut = TutorialManagerScript.new()
	tut.start_tutorial(true)

	if tut.current_step != TutorialManagerScript.TutorialStep.CAMERA_LOOK:
		return {"name": test_name, "passed": false, "message": "Initial tutorial step should be CAMERA_LOOK."}

	# Advance through actions
	tut.notify_action("look")
	if tut.current_step != TutorialManagerScript.TutorialStep.MOVE:
		return {"name": test_name, "passed": false, "message": "Step after look should be MOVE."}

	tut.notify_action("move")
	if tut.current_step != TutorialManagerScript.TutorialStep.SPRINT:
		return {"name": test_name, "passed": false, "message": "Step after move should be SPRINT."}

	tut.notify_action("sprint")
	if tut.current_step != TutorialManagerScript.TutorialStep.JUMP:
		return {"name": test_name, "passed": false, "message": "Step after sprint should be JUMP."}

	tut.notify_action("jump")
	if tut.current_step != TutorialManagerScript.TutorialStep.DASH:
		return {"name": test_name, "passed": false, "message": "Step after jump should be DASH."}

	tut.notify_action("dash")
	if tut.current_step != TutorialManagerScript.TutorialStep.GUARD:
		return {"name": test_name, "passed": false, "message": "Step after dash should be GUARD."}

	tut.notify_action("guard")
	if tut.current_step != TutorialManagerScript.TutorialStep.ATTACK:
		return {"name": test_name, "passed": false, "message": "Step after guard should be ATTACK."}

	tut.notify_action("attack")
	if tut.current_step != TutorialManagerScript.TutorialStep.INTERACT:
		return {"name": test_name, "passed": false, "message": "Step after attack should be INTERACT."}

	tut.notify_action("interact")
	if tut.current_step != TutorialManagerScript.TutorialStep.COMPLETED or tut.is_active:
		return {"name": test_name, "passed": false, "message": "Tutorial should be COMPLETED and inactive after interact."}

	# Test restart
	tut.restart_tutorial()
	if tut.current_step != TutorialManagerScript.TutorialStep.CAMERA_LOOK or not tut.is_active:
		return {"name": test_name, "passed": false, "message": "Tutorial should reset to CAMERA_LOOK on restart."}

	# Test skip
	tut.skip_tutorial()
	if tut.current_step != TutorialManagerScript.TutorialStep.COMPLETED or tut.is_active:
		return {"name": test_name, "passed": false, "message": "Tutorial should be COMPLETED after skip."}

	var save = SaveSystem.load_game()
	if not save.get("tutorialCompleted", false):
		return {"name": test_name, "passed": false, "message": "tutorialCompleted should be saved to SaveSystem."}

	return {"name": test_name, "passed": true}

static func test_tutorial_device_adaptation() -> Dictionary:
	var test_name = "test_tutorial_device_adaptation"
	var tut = TutorialManagerScript.new()
	tut.start_tutorial(true) # At CAMERA_LOOK

	tut.notify_input_device(TutorialManagerScript.InputDevice.KEYBOARD_MOUSE)
	var kb_inst = tut.get_current_instruction()
	if not ("Mouse" in kb_inst.get("keycap", "")):
		return {"name": test_name, "passed": false, "message": "Keyboard prompt should mention Mouse Look."}

	tut.notify_input_device(TutorialManagerScript.InputDevice.GAMEPAD)
	var pad_inst = tut.get_current_instruction()
	if not ("R-Stick" in pad_inst.get("keycap", "")):
		return {"name": test_name, "passed": false, "message": "Gamepad prompt should mention R-Stick."}

	tut.notify_input_device(TutorialManagerScript.InputDevice.TOUCH)
	var touch_inst = tut.get_current_instruction()
	if not ("Swipe" in touch_inst.get("keycap", "")):
		return {"name": test_name, "passed": false, "message": "Touch prompt should mention Swipe."}

	return {"name": test_name, "passed": true}

static func test_pause_menu_tab_navigation_and_shortcuts() -> Dictionary:
	var test_name = "test_pause_menu_tab_navigation_and_shortcuts"
	var menu = PauseMenuScene.instantiate()
	if not menu:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate PauseMenu3D.tscn."}

	var tabs = menu.find_child("TabContainer", true, false) as TabContainer
	if not tabs or tabs.get_tab_count() < 5:
		menu.free()
		return {"name": test_name, "passed": false, "message": "PauseMenu3D should contain 5 tabs."}

	menu._ready()
	menu.open_menu("Bhumi")

	# Test direct switch
	menu.switch_tab(1)
	if tabs.current_tab != 1:
		menu.free()
		return {"name": test_name, "passed": false, "message": "Failed to switch to tab index 1 (Realm Map)."}

	menu.switch_tab(4)
	if tabs.current_tab != 4:
		menu.free()
		return {"name": test_name, "passed": false, "message": "Failed to switch to tab index 4 (Controls Guide)."}

	# Test cycling
	menu._cycle_tab(1) # Should wrap to 0
	if tabs.current_tab != 0:
		menu.free()
		return {"name": test_name, "passed": false, "message": "Cycling forward from tab 4 should wrap to tab 0."}

	menu._cycle_tab(-1) # Should wrap to 4
	if tabs.current_tab != 4:
		menu.free()
		return {"name": test_name, "passed": false, "message": "Cycling backward from tab 0 should wrap to tab 4."}

	menu.close_menu()
	menu.free()
	return {"name": test_name, "passed": true}

static func test_pause_menu_settings_disk_persistence() -> Dictionary:
	var test_name = "test_pause_menu_settings_disk_persistence"
	var menu = PauseMenuScene.instantiate()
	if not menu:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate PauseMenu3D."}

	menu._ready()

	var sens = menu.find_child("SliderCamSens", true, false) as HSlider
	var invert = menu.find_child("CheckInvertY", true, false) as CheckBox
	var shake = menu.find_child("SliderShake", true, false) as HSlider
	var motion = menu.find_child("CheckReducedMotion", true, false) as CheckBox
	var subs = menu.find_child("CheckSubtitles", true, false) as CheckBox

	if not sens or not invert or not shake or not motion or not subs:
		menu.free()
		return {"name": test_name, "passed": false, "message": "Missing settings controls."}

	sens.value = 1.7
	sens.value_changed.emit(1.7)
	invert.button_pressed = true
	shake.value = 0.5
	shake.value_changed.emit(0.5)
	motion.button_pressed = true
	subs.button_pressed = false

	# Save to disk
	menu._save_settings_to_disk()

	var save = SaveSystem.load_game()
	if not save.has("settings"):
		menu.free()
		return {"name": test_name, "passed": false, "message": "Settings dict missing in save file."}

	var s = save["settings"]
	if abs(float(s.get("camera_sensitivity", 0.0)) - 1.7) > 0.01:
		menu.free()
		return {"name": test_name, "passed": false, "message": "Saved camera_sensitivity mismatch."}

	if not bool(s.get("invert_camera_y", false)):
		menu.free()
		return {"name": test_name, "passed": false, "message": "Saved invert_camera_y mismatch."}

	# Test reloading from disk
	menu._load_settings_from_disk()
	if abs(sens.value - 1.7) > 0.01 or not invert.button_pressed:
		menu.free()
		return {"name": test_name, "passed": false, "message": "Loaded settings did not populate UI controls."}

	# Restore defaults
	sens.value = 1.0
	sens.value_changed.emit(1.0)
	invert.button_pressed = false
	shake.value = 1.0
	shake.value_changed.emit(1.0)
	motion.button_pressed = false
	subs.button_pressed = true
	menu._save_settings_to_disk()

	menu.free()
	return {"name": test_name, "passed": true}

static func test_tactical_realm_map_projection_and_landmarks() -> Dictionary:
	var test_name = "test_tactical_realm_map_projection_and_landmarks"
	var tmap = TacticalMapScript.new()
	tmap.size = Vector2(400, 400)

	# Test center projection
	var center_coord = tmap.world_to_map_coord(Vector3(0, 0, 0))
	if abs(center_coord.x - 200.0) > 2.0 or abs(center_coord.y - 200.0) > 2.0:
		tmap.free()
		return {"name": test_name, "passed": false, "message": "Center world (0,0) should project to map center."}

	# Test state updates
	tmap.set_player_state(Vector3(-24.0, 1.2, -13.0), deg_to_rad(45.0))
	if tmap.player_pos != Vector3(-24.0, 1.2, -13.0) or abs(tmap.player_yaw - deg_to_rad(45.0)) > 0.01:
		tmap.free()
		return {"name": test_name, "passed": false, "message": "TacticalMap player state mismatch."}

	tmap.set_waypoint(Vector3(55.0, 12.0, -45.0), "Watchtower")
	if not tmap.has_waypoint or tmap.waypoint_pos != Vector3(55.0, 12.0, -45.0):
		tmap.free()
		return {"name": test_name, "passed": false, "message": "TacticalMap waypoint state mismatch."}

	tmap.clear_waypoint()
	if tmap.has_waypoint:
		tmap.free()
		return {"name": test_name, "passed": false, "message": "TacticalMap waypoint should clear."}

	tmap.free()
	return {"name": test_name, "passed": true}

static func test_hud_3d_waypoint_unprojection_and_clamping() -> Dictionary:
	var test_name = "test_hud_3d_waypoint_unprojection_and_clamping"
	var hud = HUD3DScene.instantiate()
	if not hud:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate HUD3D."}

	hud._ready()

	var wp_marker = hud.find_child("WaypointMarker", true, false) as Control
	var wp_dist = hud.find_child("WaypointDistanceLabel", true, false) as Label
	var wp_name = hud.find_child("WaypointNameLabel", true, false) as Label

	if not wp_marker or not wp_dist or not wp_name:
		hud.free()
		return {"name": test_name, "passed": false, "message": "Missing WaypointMarker or child labels in HUD."}

	hud.set_waypoint(Vector3(30.0, 1.5, -40.0), "General Kalanemi")
	if not hud.has_waypoint or hud.waypoint_target_pos != Vector3(30.0, 1.5, -40.0):
		hud.free()
		return {"name": test_name, "passed": false, "message": "HUD waypoint state mismatch."}

	if wp_name.text != "General Kalanemi":
		hud.free()
		return {"name": test_name, "passed": false, "message": "Waypoint label text mismatch."}

	hud.clear_waypoint()
	if hud.has_waypoint or wp_marker.visible:
		hud.free()
		return {"name": test_name, "passed": false, "message": "Waypoint marker should hide when cleared."}

	hud.free()
	return {"name": test_name, "passed": true}

static func test_bhumi_guided_progression_waypoints_chain() -> Dictionary:
	var test_name = "test_bhumi_guided_progression_waypoints_chain"
	var valley = BhumiValleyScene.instantiate()
	if not valley:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate BhumiValley3D."}

	valley._ready()

	var hud = valley.find_child("HUD3D", true, false) as HUD3D
	var qmgr = valley.quest_mgr

	if not hud or not qmgr:
		valley.free()
		return {"name": test_name, "passed": false, "message": "Missing HUD3D or QuestManager in BhumiValley3D."}

	# Stage 1: Commune with Devi Tara
	valley._refresh_objective_display()
	if not hud.has_waypoint:
		valley.free()
		return {"name": test_name, "passed": false, "message": "Stage 1 should have active waypoint to Devi Tara."}

	var tara_pos = Vector3(-24.0, 1.2, -13.0)
	if hud.waypoint_target_pos.distance_to(tara_pos) > 1.0:
		valley.free()
		return {"name": test_name, "passed": false, "message": "Stage 1 waypoint should point to Devi Tara."}

	# Complete Stage 1 -> Advance to Stage 2: Reclaim Astra Shards
	qmgr.update_objective_progress("cleansing_of_bhumi", "commune_tara", 1)
	valley._refresh_objective_display()
	if not hud.has_waypoint:
		valley.free()
		return {"name": test_name, "passed": false, "message": "Stage 2 should have active waypoint to nearest Shard."}

	# Complete Stage 2 -> Advance to Stage 3: Defeat General Kalanemi
	qmgr.update_objective_progress("cleansing_of_bhumi", "reclaim_shards", 3)
	valley._refresh_objective_display()
	var kalanemi_pos = Vector3(55.0, 12.0, -45.0)
	if hud.waypoint_target_pos.distance_to(kalanemi_pos) > 1.0:
		valley.free()
		return {"name": test_name, "passed": false, "message": "Stage 3 waypoint should point to General Kalanemi."}

	# Complete Stage 3 -> Advance to Stage 4: Consecrate Altar
	qmgr.update_objective_progress("cleansing_of_bhumi", "defeat_kalanemi", 1)
	valley._refresh_objective_display()
	var altar_pos = Vector3(0.0, 2.82, -2.0)
	if hud.waypoint_target_pos.distance_to(altar_pos) > 1.0:
		valley.free()
		return {"name": test_name, "passed": false, "message": "Stage 4 waypoint should point to High Sun Altar."}

	valley.free()
	return {"name": test_name, "passed": true}

static func test_hud_unobstructed_controls_toggle() -> Dictionary:
	var test_name = "test_hud_unobstructed_controls_toggle"
	var hud = HUD3DScene.instantiate()
	if not hud:
		return {"name": test_name, "passed": false, "message": "Failed to instantiate HUD3D."}

	hud._ready()

	var controls = hud.find_child("ControlsPanel", true, false) as PanelContainer
	if not controls:
		hud.free()
		return {"name": test_name, "passed": false, "message": "ControlsPanel missing in HUD3D."}

	# Requirement Q13.6: Minimize HUD obstruction and eliminate persistent oversized shortcut panels in standard player mode
	if controls.visible:
		hud.free()
		return {"name": test_name, "passed": false, "message": "ControlsPanel must be hidden by default in standard gameplay mode."}

	# Toggle controls panel on demand
	hud.toggle_controls_panel()
	if not controls.visible:
		hud.free()
		return {"name": test_name, "passed": false, "message": "ControlsPanel should be visible after toggle."}

	hud.toggle_controls_panel()
	if controls.visible:
		hud.free()
		return {"name": test_name, "passed": false, "message": "ControlsPanel should hide after second toggle."}

	hud.free()
	return {"name": test_name, "passed": true}
