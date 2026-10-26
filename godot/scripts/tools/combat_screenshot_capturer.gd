extends SceneTree

## Stage Q4 Production 3D Combat, Enemy AI & Boss Experience Screenshot Capturer
## Captures high-definition in-engine screenshots of the remastered 3D combat encounters:
## 1. 01_asura_warrior_patrol_stance.png
## 2. 02_asura_warrior_telegraph_windup.png
## 3. 03_veer_combat_attack_combo_and_slash_arc.png
## 4. 04_veer_perfect_parry_deflection.png
## 5. 05_boss_kalanemi_monumental_4arms_idle.png
## 6. 06_boss_kalanemi_cleave_telegraph.png
## 7. 07_boss_kalanemi_ground_slam_impact.png
## 8. 08_boss_kalanemi_enraged_tamas_roar.png
## 9. 09_boss_kalanemi_poise_broken_stagger.png
## 10. 10_boss_kalanemi_purified_victory.png

const OUT_DIR = "res://../screenshots/combat_q4/"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/4a5bfbbb-2b05-4ffa-a9b4-fd46b2031671/"

func _init() -> void:
	call_deferred("_run_combat_captures")

func _set_actor_rot_y(actor: Node, angle_deg: float) -> void:
	if not actor:
		return
	var rad = deg_to_rad(angle_deg)
	if "visual" in actor and actor.get("visual"):
		(actor.get("visual") as Node3D).rotation.y = rad
	elif "visual_root" in actor and actor.get("visual_root"):
		(actor.get("visual_root") as Node3D).rotation.y = rad
	elif actor is Node3D:
		(actor as Node3D).rotation.y = rad

func _run_combat_captures() -> void:
	print("================================================================")
	print("  STARTING STAGE Q4 COMBAT & BOSS VALIDATION CAPTURES           ")
	print("================================================================")
	var abs_out_dir = ProjectSettings.globalize_path(OUT_DIR)
	DirAccess.make_dir_recursive_absolute(abs_out_dir)
	DirAccess.make_dir_recursive_absolute(BRAIN_DIR)

	# 1. Load BhumiValley3D Scene
	var bhumi_scene = load("res://scenes/levels/BhumiValley3D.tscn")
	var world = bhumi_scene.instantiate()
	root.add_child(world)

	# Allow scene initialization, terrain trimesh generation, and shaders to warm up
	for f in range(35):
		await process_frame

	var player: PlayerController3D = world.find_child("Player3D", true, false)
	var warrior_ridge: AsuraWarrior3D = world.find_child("AsuraWarrior_Ridge", true, false)
	var boss: BossKalanemi3D = world.find_child("BossKalanemi", true, false)
	var hud: HUD3D = world.find_child("HUD3D", true, false)

	# Hide old primitive placeholder sentinels and barriers from view
	for s_name in ["WatchtowerChampion", "GroveSentinel", "TamasBarrier"]:
		var sent = world.find_child(s_name, true, false)
		if sent:
			sent.visible = false
			sent.global_position = Vector3(999, 999, 999)

	var warrior_pass: AsuraWarrior3D = world.find_child("AsuraWarrior_Pass", true, false)
	if warrior_pass:
		warrior_pass.visible = false
		warrior_pass.global_position = Vector3(999, 999, 999)

	if hud and hud.banner_panel:
		hud.banner_panel.visible = false
		hud.banner_panel.modulate.a = 0.0

	# Dedicated Cinematic Camera for combat composition
	var cine_cam = Camera3D.new()
	cine_cam.name = "CineCombatCamera"
	cine_cam.fov = 42.0
	cine_cam.near = 0.1
	cine_cam.far = 300.0
	cine_cam.current = true
	world.add_child(cine_cam)

	var capture = func(filename: String, desc: String):
		for f in range(12):
			if hud and hud.banner_panel and not filename.contains("victory"):
				hud.banner_panel.visible = false
				hud.banner_panel.modulate.a = 0.0
			await process_frame

		var img = root.get_texture().get_image()
		if img and not img.is_empty():
			var p = abs_out_dir + filename + ".png"
			var err = img.save_png(p)
			if err == OK:
				print("  [CAPTURED] " + filename + " — " + desc)
				var brain_path = BRAIN_DIR + filename + ".png"
				img.save_png(brain_path)
			else:
				printerr("  [ERROR] Failed to save " + filename + ": ", err)
		else:
			printerr("  [ERROR] Image empty for " + filename)

	# Disable physics ticking during staged cinematography
	if player:
		player.set_physics_process(false)
	if warrior_ridge:
		warrior_ridge.set_physics_process(false)
	if boss:
		boss.set_physics_process(false)

	# =========================================================================
	# SHOT 1: Asura Warrior Patrol Stance (Frontal Three-Quarter View)
	# =========================================================================
	if warrior_ridge:
		warrior_ridge.global_position = Vector3(0.0, 1.4, 6.5)
		_set_actor_rot_y(warrior_ridge, 25.0) # Face towards camera showing horns, eyes, scythe, armor
		warrior_ridge._play_anim("idle")
		if warrior_ridge.eye_light:
			warrior_ridge.eye_light.light_color = Color(1.0, 0.35, 0.1)
			warrior_ridge.eye_light.light_energy = 2.5
		if warrior_ridge.status_label:
			warrior_ridge.status_label.text = "⚔ ASURA WARRIOR — PATROL STANCE ⚔"
			warrior_ridge.status_label.modulate = Color(1.0, 0.4, 0.2)

	if player:
		player.global_position = Vector3(999.0, 999.0, 999.0) # Completely out of frame

	cine_cam.fov = 34.0
	cine_cam.position = Vector3(-1.4, 2.5, 9.8)
	cine_cam.look_at(Vector3(0.0, 2.2, 6.5), Vector3.UP)
	await capture.call("01_asura_warrior_patrol_stance", "Demonic Asura Warrior with curved brow horns, spiked obsidian armor, and curved scythe")

	# =========================================================================
	# SHOT 2: Asura Warrior Telegraph Windup (Visual Attack Readiness)
	# =========================================================================
	if warrior_ridge:
		warrior_ridge.global_position = Vector3(0.0, 1.4, 5.8)
		_set_actor_rot_y(warrior_ridge, 20.0)
		warrior_ridge._play_anim("telegraph")
		if warrior_ridge.eye_light:
			warrior_ridge.eye_light.light_color = Color(1.0, 0.05, 0.05)
			warrior_ridge.eye_light.light_energy = 5.0
		if warrior_ridge.status_label:
			warrior_ridge.status_label.text = "⚠ TELEGRAPH: SCYTHE CLEAVE ⚠"
			warrior_ridge.status_label.modulate = Color(1.0, 0.15, 0.15)

	if player:
		player.global_position = Vector3(-1.2, 1.4, 8.2)
		_set_actor_rot_y(player, 160.0)
		player._play_anim("idle")
		if player.slash_arc:
			player.slash_arc.visible = false

	cine_cam.fov = 38.0
	cine_cam.position = Vector3(-1.8, 2.6, 9.6)
	cine_cam.look_at(Vector3(0.0, 2.3, 5.8), Vector3.UP)
	await capture.call("02_asura_warrior_telegraph_windup", "Asura Warrior raising scythe overhead with red eye flare and telegraph status")

	# =========================================================================
	# SHOT 3: Veer Combo Attack with Glowing Slash Arc VFX
	# =========================================================================
	if player:
		player.global_position = Vector3(-0.8, 1.4, 6.6)
		_set_actor_rot_y(player, 40.0)
		player._play_anim("attack_2")
		if player.slash_arc:
			player.slash_arc.visible = true
			player.slash_arc.scale = Vector3(1.4, 0.08, 1.4)

	if warrior_ridge:
		warrior_ridge.global_position = Vector3(0.8, 1.4, 5.8)
		_set_actor_rot_y(warrior_ridge, -140.0)
		warrior_ridge._play_anim("stagger")
		if warrior_ridge.status_label:
			warrior_ridge.status_label.text = "💥 HIT STAGGER 💥"
			warrior_ridge.status_label.modulate = Color(1.0, 0.7, 0.2)

	cine_cam.fov = 40.0
	cine_cam.position = Vector3(-3.4, 2.5, 7.8)
	cine_cam.look_at(Vector3(0.0, 2.2, 6.2), Vector3.UP)
	await capture.call("03_veer_combat_attack_combo_and_slash_arc", "Veer executing combo attack with radiant golden-orange SlashArcEffect")

	# =========================================================================
	# SHOT 4: Veer Perfect Parry & Deflection Flash
	# =========================================================================
	if player:
		player.global_position = Vector3(-0.5, 1.4, 6.8)
		_set_actor_rot_y(player, 40.0)
		player._play_anim("block")
		if player.slash_arc:
			player.slash_arc.visible = false

	if warrior_ridge:
		warrior_ridge.global_position = Vector3(0.5, 1.4, 6.0)
		_set_actor_rot_y(warrior_ridge, -140.0)
		warrior_ridge._play_anim("attack")
		if warrior_ridge.status_label:
			warrior_ridge.status_label.text = "🛡 PARRY DEFLECTION 🛡"
			warrior_ridge.status_label.modulate = Color(0.4, 0.85, 1.0)

	var spark_light = OmniLight3D.new()
	spark_light.light_color = Color(1.0, 0.9, 0.5)
	spark_light.light_energy = 6.0
	spark_light.omni_range = 3.5
	spark_light.position = Vector3(0.0, 2.2, 6.4)
	world.add_child(spark_light)

	cine_cam.fov = 34.0
	cine_cam.position = Vector3(-2.4, 2.4, 7.8)
	cine_cam.look_at(Vector3(0.0, 2.2, 6.4), Vector3.UP)
	await capture.call("04_veer_perfect_parry_deflection", "Veer executing frame-perfect parry deflecting Asura scythe with golden sparks")
	spark_light.queue_free()

	# =========================================================================
	# SHOT 5: General Kalanemi Monumental 4-Armed Warlord (Boss Intro at Fortress)
	# =========================================================================
	if boss:
		boss.global_position = Vector3(50.0, 11.5, -40.0)
		_set_actor_rot_y(boss, 30.0) # Turn to face camera & Veer with 4 arms & cleavers!
		boss._play_anim("boss_idle")
		if boss.status_label:
			boss.status_label.text = "⚔ GENERAL KALANEMI — WARLORD OF TAMAS ⚔"
			boss.status_label.modulate = Color(1.0, 0.3, 0.2)
		if boss.ground_slam_indicator:
			boss.ground_slam_indicator.visible = false
		if boss.eye_light:
			boss.eye_light.light_energy = 3.5
		if boss.core_light:
			boss.core_light.light_energy = 5.0

	if player:
		player.global_position = Vector3(46.0, 11.5, -36.5) # Side of frame facing boss
		_set_actor_rot_y(player, -45.0)
		player._play_anim("idle")
		if player.slash_arc:
			player.slash_arc.visible = false

	cine_cam.fov = 44.0
	cine_cam.position = Vector3(43.5, 13.0, -32.5)
	cine_cam.look_at(Vector3(49.0, 13.5, -39.0), Vector3.UP)
	await capture.call("05_boss_kalanemi_monumental_4arms_idle", "2.85m General Kalanemi with 4 muscular arms, dual void cleavers, and molten Tamas core")

	# =========================================================================
	# SHOT 6: Boss Kalanemi Heavy Cleave Telegraph
	# =========================================================================
	if boss:
		boss.global_position = Vector3(50.0, 11.5, -40.0)
		_set_actor_rot_y(boss, 30.0)
		boss._play_anim("boss_cleave_telegraph")
		if boss.status_label:
			boss.status_label.text = "⚠ HEAVY VOID CLEAVE ⚠"
			boss.status_label.modulate = Color(1.0, 0.1, 0.1)
		if boss.eye_light:
			boss.eye_light.light_color = Color(1.0, 0.0, 0.0)
			boss.eye_light.light_energy = 6.0
		if boss.core_light:
			boss.core_light.light_color = Color(1.0, 0.2, 0.0)
			boss.core_light.light_energy = 7.0

	if player:
		player.global_position = Vector3(45.5, 11.5, -36.5)
		_set_actor_rot_y(player, -80.0)
		player._play_anim("dash")

	cine_cam.fov = 45.0
	cine_cam.position = Vector3(43.0, 13.2, -32.5)
	cine_cam.look_at(Vector3(49.0, 13.8, -39.0), Vector3.UP)
	await capture.call("06_boss_kalanemi_cleave_telegraph", "Kalanemi winding up dual void cleavers with red eye flare and molten core surge")

	# =========================================================================
	# SHOT 7: Boss Kalanemi Ground Slam Impact Shockwave
	# =========================================================================
	if boss:
		boss.global_position = Vector3(49.5, 11.5, -39.5)
		_set_actor_rot_y(boss, 25.0)
		boss._play_anim("boss_slam_impact")
		if boss.ground_slam_indicator:
			boss.ground_slam_indicator.global_position = Vector3(49.5, 11.55, -39.5)
			boss.ground_slam_indicator.visible = true
			boss.ground_slam_indicator.scale = Vector3(4.0, 1.0, 4.0)
		if boss.status_label:
			boss.status_label.text = "💥 CATACLYSMIC GROUND SLAM 💥"
			boss.status_label.modulate = Color(1.0, 0.4, 0.1)

	if player:
		player.global_position = Vector3(44.5, 12.8, -35.0) # Airborne dodge
		_set_actor_rot_y(player, -50.0)
		player._play_anim("jump")

	cine_cam.fov = 46.0
	cine_cam.position = Vector3(41.5, 13.5, -31.0)
	cine_cam.look_at(Vector3(48.5, 12.8, -38.5), Vector3.UP)
	await capture.call("07_boss_kalanemi_ground_slam_impact", "Kalanemi crashing down from leap slam emitting radial ground shockwave ring")

	# =========================================================================
	# SHOT 8: Boss Kalanemi Phase 2 Enraged Roar (< 50% HP)
	# =========================================================================
	if boss:
		boss.global_position = Vector3(50.0, 11.5, -40.0)
		_set_actor_rot_y(boss, 30.0)
		boss.current_phase = BossKalanemi3D.BossPhase.PHASE_2_ENRAGED
		boss._play_anim("boss_roar")
		if boss.status_label:
			boss.status_label.text = "⚡ GENERAL KALANEMI — ENRAGED TAMAS SURGE ⚡"
			boss.status_label.modulate = Color(1.0, 0.1, 0.1)
		if boss.ground_slam_indicator:
			boss.ground_slam_indicator.visible = false
		if boss.core_light:
			boss.core_light.light_color = Color(1.0, 0.1, 0.0)
			boss.core_light.light_energy = 9.0

	if player:
		player.global_position = Vector3(46.0, 11.5, -36.5)
		_set_actor_rot_y(player, -45.0)
		player._play_anim("block")

	cine_cam.fov = 38.0
	cine_cam.position = Vector3(46.5, 13.2, -35.5)
	cine_cam.look_at(Vector3(49.8, 14.0, -39.8), Vector3.UP)
	await capture.call("08_boss_kalanemi_enraged_tamas_roar", "Phase 2 Enraged Roar with all four arms raised and molten Tamas core flaring")

	# =========================================================================
	# SHOT 9: Boss Kalanemi Poise Broken Stagger (Critical Vulnerability)
	# =========================================================================
	if boss:
		boss.global_position = Vector3(50.0, 11.5, -40.0)
		_set_actor_rot_y(boss, 30.0)
		boss._play_anim("boss_stagger")
		if boss.status_label:
			boss.status_label.text = "💥 POISE BROKEN — +35% CRITICAL DAMAGE WINDOW 💥"
			boss.status_label.modulate = Color(1.0, 0.85, 0.2)
		if boss.ground_slam_indicator:
			boss.ground_slam_indicator.visible = false

	if player:
		player.global_position = Vector3(48.5, 11.5, -38.5)
		_set_actor_rot_y(player, -45.0)
		player._play_anim("attack_3")
		if player.slash_arc:
			player.slash_arc.visible = true
			player.slash_arc.scale = Vector3(1.5, 0.08, 1.5)

	cine_cam.fov = 38.0
	cine_cam.position = Vector3(45.5, 12.8, -35.0)
	cine_cam.look_at(Vector3(49.2, 12.8, -39.2), Vector3.UP)
	await capture.call("09_boss_kalanemi_poise_broken_stagger", "Kalanemi collapsed onto knee in vulnerable poise break with Veer executing finisher")

	# =========================================================================
	# SHOT 10: General Kalanemi Purified — Realm Liberation Victory
	# =========================================================================
	if boss:
		boss.global_position = Vector3(50.0, 11.5, -40.0)
		_set_actor_rot_y(boss, 30.0)
		boss._play_anim("boss_defeat")
		if boss.status_label:
			boss.status_label.text = "✨ BHUMI REALM PURIFIED — VICTORY ✨"
			boss.status_label.modulate = Color(0.4, 1.0, 0.6)
		if boss.ground_slam_indicator:
			boss.ground_slam_indicator.visible = false

	if player:
		player.global_position = Vector3(46.5, 11.5, -36.0)
		_set_actor_rot_y(player, 140.0) # Overlooking the freed Bhumi valley
		player._play_anim("idle")
		if player.slash_arc:
			player.slash_arc.visible = false

	if hud and hud.banner_panel:
		hud.banner_panel.visible = true
		hud.banner_panel.modulate.a = 1.0
		if hud.banner_label:
			hud.banner_label.text = "BHUMI LIBERATED — THE SUNKEN SANCTUM RESTORED"

	cine_cam.fov = 46.0
	cine_cam.position = Vector3(43.0, 13.0, -32.0)
	cine_cam.look_at(Vector3(48.5, 12.5, -38.0), Vector3.UP)
	await capture.call("10_boss_kalanemi_purified_victory", "Kalanemi purified in celestial light and Veer standing victorious over Bhumi")

	print("================================================================")
	print("  ALL 10 STAGE Q4 COMBAT CAPTURES SUCCESSFULLY COMPLETED!       ")
	print("================================================================")
	world.queue_free()
	quit(0)
