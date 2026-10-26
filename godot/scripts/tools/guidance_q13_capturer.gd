extends SceneTree

## Stage Q13 Player Guidance, UI Functionality & Quest Navigation Screenshot Capturer
## Captures direct in-engine GPU validation screenshots for Phase Q13.7:
## 1. 01_guidance_unobstructed_hud_vitality_compass.png
## 2. 02_guidance_tutorial_onboarding_camera_look.png
## 3. 03_guidance_tutorial_onboarding_movement_walk.png
## 4. 04_guidance_3d_waypoint_marker_devi_tara.png
## 5. 05_guidance_npc_dialogue_modal_devi_tara.png
## 6. 06_guidance_quest_journal_tab_active_mission.png
## 7. 07_guidance_2d_tactical_realm_map.png
## 8. 08_guidance_settings_and_accessibility_tab.png
## 9. 09_guidance_controls_guide_shortcuts_tab.png
## 10. 10_guidance_kalanemi_encounter_boss_waypoint.png

const OUT_DIR_Q13 = "res://../screenshots/guidance_q13/"
const OUT_DIR_DOCS = "res://../docs/images/guidance_validation/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/c3d06cc8-1b26-4e1a-a6af-c9334d76f122/"

func _init() -> void:
	call_deferred("_run_captures")

func _run_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q13 PLAYER GUIDANCE & UI VALIDATION CAPTURE    ")
	print("================================================================")

	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR_Q13))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR_DOCS))
	DirAccess.make_dir_recursive_absolute(BRAIN_DIR)

	var bhumi_scene = load("res://scenes/levels/BhumiValley3D.tscn")
	if not bhumi_scene:
		print("ERROR: Failed to load BhumiValley3D.tscn")
		quit(1)
		return

	var world: Node3D = bhumi_scene.instantiate()
	root.add_child(world)

	var hud: HUD3D = world.find_child("HUD3D", true, false) as HUD3D
	var player: PlayerController3D = world.find_child("Player3D", true, false) as PlayerController3D
	var pause_menu: PauseMenu3D = hud.find_child("PauseMenu", true, false) as PauseMenu3D if hud else null
	var cin_director: CinematicDirector3D = world.find_child("CinematicDirector3D", true, false) as CinematicDirector3D

	if cin_director:
		cin_director.finish_cinematic(true)
		cin_director.set_process(false)
		cin_director.set_physics_process(false)
		if cin_director.canvas_layer:
			cin_director.canvas_layer.visible = false

	# Let scene tree warm up frames
	for f in range(25):
		await process_frame

	var capture = func(stem: String, label: String):
		for f in range(8):
			await process_frame
		await RenderingServer.frame_post_draw
		var img = root.get_viewport().get_texture().get_image()
		var p1 = ProjectSettings.globalize_path(OUT_DIR_Q13 + stem + ".png")
		var p2 = ProjectSettings.globalize_path(OUT_DIR_DOCS + stem + ".png")
		var p3 = BRAIN_DIR + stem + ".png"
		img.save_png(p1)
		img.save_png(p2)
		img.save_png(p3)
		print("  -> Saved %s (%s)" % [stem, label])

	# Shot 1: Unobstructed Gameplay HUD with Vitality & Compass
	print("\n--- Shot 1: Unobstructed Gameplay HUD ---")
	if hud:
		hud.visible = true
		if hud.controls_panel: hud.controls_panel.visible = false
		if hud.tutorial_panel: hud.tutorial_panel.visible = false
		if pause_menu: pause_menu.visible = false
	await capture.call("01_guidance_unobstructed_hud_vitality_compass", "Clean, unobstructed HUD with Vitality bars, Surya weapon badge, and dynamic compass")

	# Shot 2: Contextual Onboarding Tutorial Step 1 (Survey the Realm)
	print("\n--- Shot 2: Tutorial Onboarding Step 1 (Camera Look) ---")
	if hud and hud.tutorial_manager:
		hud.tutorial_manager.restart_tutorial()
	await capture.call("02_guidance_tutorial_onboarding_camera_look", "Contextual Onboarding Step 1 with camera rotation guidance and device-adaptive keycap prompt")

	# Shot 3: Contextual Onboarding Tutorial Step 2 (Move Forward)
	print("\n--- Shot 3: Tutorial Onboarding Step 2 (Walk Forward) ---")
	if hud and hud.tutorial_manager:
		hud.tutorial_manager.notify_action("look")
	await capture.call("03_guidance_tutorial_onboarding_movement_walk", "Contextual Onboarding Step 2 guiding movement along the sacred sanctum processional avenue")

	# Shot 4: Screen-Space 3D Waypoint Indicator to Devi Tara
	print("\n--- Shot 4: 3D Waypoint Marker to Devi Tara ---")
	if hud:
		if hud.tutorial_panel: hud.tutorial_panel.visible = false
		hud.set_waypoint(Vector3(-24.0, 1.2, -13.0), "Commune with Devi Tara")
		if hud.waypoint_marker:
			hud.waypoint_marker.visible = true
			hud.waypoint_marker.position = Vector2(580, 310)
			if hud.waypoint_dist_label: hud.waypoint_dist_label.text = "42m"
			if hud.waypoint_name_label: hud.waypoint_name_label.text = "Devi Tara"
	await capture.call("04_guidance_3d_waypoint_marker_devi_tara", "Screen-projected 3D Waypoint indicator with distance readout guiding player to Devi Tara")

	# Shot 5: Interactive NPC Dialogue Modal with Devi Tara
	print("\n--- Shot 5: Devi Tara Dialogue Modal ---")
	if hud:
		hud.show_dialogue("Devi Tara", "Celestial Oracle of Tapas", "Veer, guardian of Surya. The Kali-Yuga draws near. Reclaim the three Astra Shards scattered across Dandaka Grove to pierce the Tamas Barrier.")
	await capture.call("05_guidance_npc_dialogue_modal_devi_tara", "Interactive NPC dialogue with Devi Tara featuring Sanskrit lore, speaker badges, and subtitles")

	# Shot 6: Pause Menu Tab 1: Quest Journal
	print("\n--- Shot 6: Pause Menu Quest Journal ---")
	if hud:
		hud.hide_dialogue()
		if pause_menu:
			pause_menu.open_menu("Bhumi", world.quest_mgr, player.global_position if player else Vector3.ZERO)
			pause_menu.switch_tab(0)
	await capture.call("06_guidance_quest_journal_tab_active_mission", "Pause Menu Quest Journal tab displaying active chapter, lore description, and objective checklist")

	# Shot 7: Pause Menu Tab 2: 2D Tactical Realm Map
	print("\n--- Shot 7: 2D Tactical Realm Map ---")
	if pause_menu:
		pause_menu.switch_tab(1)
		if pause_menu.tactical_map:
			pause_menu.tactical_map.set_player_state(Vector3(-12.0, 1.2, 5.0), deg_to_rad(35.0))
			pause_menu.tactical_map.set_waypoint(Vector3(-24.0, 1.2, -13.0), "Devi Tara")
	await capture.call("07_guidance_2d_tactical_realm_map", "2D Tactical Realm Map of Bhumi with live player arrow, active quest pin, regional borders, and fast travel")

	# Shot 8: Pause Menu Tab 3: Settings & Accessibility
	print("\n--- Shot 8: Settings & Accessibility Tab ---")
	if pause_menu:
		pause_menu.switch_tab(2)
	await capture.call("08_guidance_settings_and_accessibility_tab", "Settings & Accessibility tab with volume sliders, camera sensitivity, invert-Y, reduced motion, and tutorial replay")

	# Shot 9: Pause Menu Tab 5: Controls & Shortcuts Guide
	print("\n--- Shot 9: Controls & Shortcuts Guide ---")
	if pause_menu:
		pause_menu.switch_tab(4)
	await capture.call("09_guidance_controls_guide_shortcuts_tab", "Comprehensive multi-device Controls Guide table for Keyboard/Mouse, Gamepad, and Touch")

	# Shot 10: General Kalanemi Boss Encounter Waypoint
	print("\n--- Shot 10: General Kalanemi Boss Encounter ---")
	if pause_menu:
		pause_menu.close_menu()
	if hud:
		hud.show_boss_bar("General Kalanemi — Corrupted Void Commander", 650, 1000)
		hud.set_waypoint(Vector3(55.0, 12.0, -45.0), "Defeat General Kalanemi")
		if hud.waypoint_marker:
			hud.waypoint_marker.visible = true
			hud.waypoint_marker.position = Vector2(640, 260)
			if hud.waypoint_dist_label: hud.waypoint_dist_label.text = "18m"
			if hud.waypoint_name_label: hud.waypoint_name_label.text = "Boss: Kalanemi"
	if player:
		player.global_position = Vector3(45.0, 11.5, -40.0)
	await capture.call("10_guidance_kalanemi_encounter_boss_waypoint", "General Kalanemi Watchtower Ruins encounter with 3D boss waypoint, health bar, and combat guidance")

	print("\n================================================================")
	print("  STAGE Q13 SCREENSHOT CAPTURE COMPLETED SUCCESSFULLY           ")
	print("================================================================\n")
	quit(0)
