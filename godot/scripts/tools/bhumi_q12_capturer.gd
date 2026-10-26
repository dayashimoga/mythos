extends SceneTree

## Stage Q12 Bhumi Environment, Landscape & Architectural Quality Remaster Screenshot Capturer
## Captures direct in-engine GPU validation screenshots for Phase Q12.7:
## 1. 01_bhumi_sanctum_surya_kund_panoramic.png
## 2. 02_bhumi_processional_avenue_and_torana.png
## 3. 03_bhumi_kalyani_stepped_reservoir.png
## 4. 04_bhumi_dandaka_forest_trail.png
## 5. 05_bhumi_vata_vriksha_banyan_grove.png
## 6. 06_bhumi_temple_courtyard_and_pillars.png
## 7. 07_bhumi_tapas_mountain_ridge_ascent.png
## 8. 08_bhumi_ruined_watchtower_bastion.png
## 9. 09_bhumi_sun_shrine_and_astra_shard.png
## 10. 10_bhumi_third_person_traversal_exploration.png

const OUT_DIR_Q12 = "res://../screenshots/environment_q12/"
const OUT_DIR_DOCS = "res://../docs/images/bhumi_validation/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/c3d06cc8-1b26-4e1a-a6af-c9334d76f122/"

func _init() -> void:
	call_deferred("_run_captures")

func _run_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q12 BHUMI ENVIRONMENT VALIDATION CAPTURE       ")
	print("================================================================")

	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR_Q12))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR_DOCS))
	DirAccess.make_dir_recursive_absolute(BRAIN_DIR)

	var bhumi_scene = load("res://scenes/levels/BhumiValley3D.tscn")
	if not bhumi_scene:
		print("ERROR: Failed to load BhumiValley3D.tscn")
		quit(1)
		return

	var world: Node3D = bhumi_scene.instantiate()
	root.add_child(world)

	# Hide HUD and cinematic intro overlays for pristine scenery captures
	var hud: CanvasLayer = world.get_node_or_null("HUD3D")
	if hud:
		hud.visible = false

	var cin_director: CinematicDirector3D = world.get_node_or_null("CinematicDirector3D")
	if cin_director:
		cin_director.finish_cinematic(true)
		cin_director.set_process(false)
		cin_director.set_physics_process(false)
		if cin_director.canvas_layer:
			cin_director.canvas_layer.visible = false

	# Hide all CanvasLayers across the scene
	for c in root.find_children("*", "CanvasLayer", true, false):
		(c as CanvasLayer).visible = false

	# Create dedicated high-precision camera for scenery inspection
	var test_cam: Camera3D = Camera3D.new()
	test_cam.name = "RemasterQualityCamera"
	test_cam.current = true
	test_cam.fov = 60.0
	test_cam.near = 0.05
	test_cam.far = 400.0
	world.add_child(test_cam)

	# Let scene tree warm up frames
	for f in range(30):
		await process_frame

	var capture = func(stem: String, label: String):
		for f in range(12):
			for c in root.find_children("*", "CanvasLayer", true, false):
				(c as CanvasLayer).visible = false
			for lbl in root.find_children("*", "Label3D", true, false):
				(lbl as Label3D).visible = false
			await process_frame
		await RenderingServer.frame_post_draw
		var img = root.get_viewport().get_texture().get_image()
		var p1 = ProjectSettings.globalize_path(OUT_DIR_Q12 + stem + ".png")
		var p2 = ProjectSettings.globalize_path(OUT_DIR_DOCS + stem + ".png")
		var p3 = BRAIN_DIR + stem + ".png"
		img.save_png(p1)
		img.save_png(p2)
		img.save_png(p3)
		print("  -> Saved %s (%s)" % [stem, label])

	# Shot 1: Grand Panoramic View of Sanctum Surya-Kund
	print("\n--- Shot 1: Sanctum of Surya-Kund Panoramic ---")
	test_cam.global_position = Vector3(14.0, 9.5, 24.0)
	test_cam.look_at(Vector3(0.0, 4.5, -2.0), Vector3.UP)
	test_cam.fov = 56.0
	await capture.call("01_bhumi_sanctum_surya_kund_panoramic", "Grand panoramic view of reconstructed Hoysala Vimana and Sanctum in Vedic morning light")

	# Shot 2: Processional Avenue & Torana Gateway
	print("\n--- Shot 2: Processional Avenue & Torana Gateway ---")
	test_cam.global_position = Vector3(0.0, 2.8, 26.0)
	test_cam.look_at(Vector3(0.0, 3.8, 12.0), Vector3.UP)
	test_cam.fov = 52.0
	await capture.call("02_bhumi_processional_avenue_and_torana", "Ceremonial Processional Avenue framed by monumental Sanchi Torana with Surya Dharmachakra crest")

	# Shot 3: Kalyani Stepped Water Reservoir Basin
	print("\n--- Shot 3: Kalyani Stepped Water Reservoir ---")
	test_cam.global_position = Vector3(-6.0, 4.5, 20.0)
	test_cam.look_at(Vector3(-6.0, 0.2, 45.0), Vector3.UP)
	test_cam.fov = 54.0
	await capture.call("03_bhumi_kalyani_stepped_reservoir", "Kalyani Stepped Water Reservoir with sacred turquoise water, flagstone ghat steps, and corner Chhatris")

	# Shot 4: Dandaka Sacred Forest Trail
	print("\n--- Shot 4: Dandaka Sacred Forest Trail ---")
	test_cam.global_position = Vector3(-19.0, 3.2, -2.0)
	test_cam.look_at(Vector3(-34.0, 3.0, -20.0), Vector3.UP)
	test_cam.fov = 54.0
	await capture.call("04_bhumi_dandaka_forest_trail", "Winding Dandaka pilgrim forest trail passing Shorea Sal trees, rock outcrops, and stone lanterns")

	# Shot 5: Monumental Vata-Vriksha Banyan Grove
	print("\n--- Shot 5: Vata-Vriksha Banyan Grove ---")
	test_cam.global_position = Vector3(-24.0, 4.5, -18.0)
	test_cam.look_at(Vector3(-36.0, 5.5, -26.0), Vector3.UP)
	test_cam.fov = 52.0
	await capture.call("05_bhumi_vata_vriksha_banyan_grove", "Monumental Vata-Vriksha Banyan tree with sinuous trunk, buttress roots, aerial prop roots, and organic canopy")

	# Shot 6: Temple Courtyard Pillars & Deepastambha Lanterns
	print("\n--- Shot 6: Temple Courtyard Pillars & Deepastambha ---")
	test_cam.global_position = Vector3(-11.0, 3.2, 11.0)
	test_cam.look_at(Vector3(-3.0, 2.2, -2.0), Vector3.UP)
	test_cam.fov = 50.0
	await capture.call("06_bhumi_temple_courtyard_and_pillars", "Lathe-turned Hoysala bell pillars, bracket capitals, and carved Deepastambha stone lanterns with glowing flames")

	# Shot 7: Tapas Mountain Ridge Switchback Ascent
	print("\n--- Shot 7: Tapas Mountain Ridge Ascent ---")
	test_cam.global_position = Vector3(22.0, 3.8, 4.0)
	test_cam.look_at(Vector3(42.0, 7.5, -18.0), Vector3.UP)
	test_cam.fov = 54.0
	await capture.call("07_bhumi_tapas_mountain_ridge_ascent", "Ascending switchback trail up Tapas Mountain Ridge through red ochre crags and basalt boulders")

	# Shot 8: Ruined Watchtower Mountain Bastion
	print("\n--- Shot 8: Ruined Watchtower Bastion ---")
	test_cam.global_position = Vector3(44.0, 14.5, -30.0)
	test_cam.look_at(Vector3(55.0, 16.0, -45.0), Vector3.UP)
	test_cam.fov = 50.0
	await capture.call("08_bhumi_ruined_watchtower_bastion", "Ruined Watchtower Cyclopean stone bastion at mountain summit with exterior spiral staircase and battlements")

	# Shot 9: Sun Shrine Peetham & Radiant Astra Shard
	print("\n--- Shot 9: Sun Shrine Peetham & Astra Shard ---")
	test_cam.global_position = Vector3(2.2, 2.0, 2.2)
	test_cam.look_at(Vector3(0.0, 0.8, 0.0), Vector3.UP)
	test_cam.fov = 48.0
	await capture.call("09_bhumi_sun_shrine_and_astra_shard", "Sacred Sun Shrine Lotus Peetham with rotating golden Surya mandala, Astra Shard, and glowing Garbhagriha portal")

	# Shot 10: Third-Person Hero Traversal in Remastered Realm
	print("\n--- Shot 10: Third-Person Hero Traversal ---")
	var player = world.get_node_or_null("Player3D")
	if player:
		player.global_position = Vector3(0.0, 0.1, 16.0)
		player.rotation.y = deg_to_rad(180.0)
	test_cam.global_position = Vector3(1.2, 2.2, 20.5)
	test_cam.look_at(Vector3(0.0, 2.5, 6.0), Vector3.UP)
	test_cam.fov = 55.0
	await capture.call("10_bhumi_third_person_traversal_exploration", "Protagonist Veer in third-person traversal across the remastered Bhumi Valley with atmospheric depth and dynamic shadows")

	print("\n================================================================")
	print("  STAGE Q12 BHUMI VALIDATION CAPTURE COMPLETED CLEANLY!         ")
	print("================================================================\n")
	quit(0)
