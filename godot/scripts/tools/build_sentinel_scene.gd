@tool
extends SceneTree

func _init() -> void:
	print("[Sentinel Builder] Constructing production Asura Training Sentinel 3D scene...")

	# --- PBR Materials ---
	var mat_basalt = StandardMaterial3D.new()
	mat_basalt.albedo_color = Color(0.18, 0.19, 0.24)
	mat_basalt.metallic = 0.25
	mat_basalt.roughness = 0.70

	var mat_brass = StandardMaterial3D.new()
	mat_brass.albedo_color = Color(0.92, 0.75, 0.25)
	mat_brass.metallic = 0.88
	mat_brass.roughness = 0.24

	var mat_core = StandardMaterial3D.new()
	mat_core.albedo_color = Color(0.2, 0.88, 1.0)
	mat_core.emission_enabled = true
	mat_core.emission = Color(0.2, 0.88, 1.0)
	mat_core.emission_energy_multiplier = 3.5
	mat_core.roughness = 0.15
	mat_core.metallic = 0.1

	var mat_blade = StandardMaterial3D.new()
	mat_blade.albedo_color = Color(0.85, 0.88, 0.94)
	mat_blade.metallic = 0.92
	mat_blade.roughness = 0.18
	mat_blade.emission_enabled = true
	mat_blade.emission = Color(0.1, 0.65, 0.95)
	mat_blade.emission_energy_multiplier = 1.2

	var mat_visor = StandardMaterial3D.new()
	mat_visor.albedo_color = Color(1.0, 0.2, 0.1)
	mat_visor.emission_enabled = true
	mat_visor.emission = Color(1.0, 0.25, 0.1)
	mat_visor.emission_energy_multiplier = 3.0

	var mat_shadow = StandardMaterial3D.new()
	mat_shadow.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat_shadow.albedo_color = Color(0.04, 0.04, 0.06, 0.45)
	mat_shadow.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED

	# --- Root CharacterBody3D ---
	var root = CharacterBody3D.new()
	root.name = "TrainingSentinel3D"
	root.collision_layer = 4
	root.collision_mask = 1
	root.add_to_group("targetable")
	root.add_to_group("enemies")
	var script = load("res://scripts/entities/training_sentinel_3d.gd")
	root.set_script(script)

	# --- Collision Shape ---
	var col_shape = CollisionShape3D.new()
	col_shape.name = "CollisionShape3D"
	var capsule = CapsuleShape3D.new()
	capsule.radius = 0.55
	capsule.height = 2.2
	col_shape.shape = capsule
	col_shape.position = Vector3(0.0, 1.1, 0.0)
	root.add_child(col_shape)
	col_shape.owner = root

	# --- Visual Root ---
	var visual = Node3D.new()
	visual.name = "Visual"
	root.add_child(visual)
	visual.owner = root

	# Contact Shadow
	var shadow_mesh = MeshInstance3D.new()
	shadow_mesh.name = "GroundShadow"
	var cyl_shadow = CylinderMesh.new()
	cyl_shadow.top_radius = 0.85
	cyl_shadow.bottom_radius = 0.85
	cyl_shadow.height = 0.01
	shadow_mesh.mesh = cyl_shadow
	shadow_mesh.material_override = mat_shadow
	shadow_mesh.position = Vector3(0.0, 0.01, 0.0)
	visual.add_child(shadow_mesh)
	shadow_mesh.owner = root

	# Stepped Base Pedestal
	var base_mesh = MeshInstance3D.new()
	base_mesh.name = "BasePedestal"
	var cyl_base = CylinderMesh.new()
	cyl_base.top_radius = 0.52
	cyl_base.bottom_radius = 0.68
	cyl_base.height = 0.32
	cyl_base.radial_segments = 16
	base_mesh.mesh = cyl_base
	base_mesh.material_override = mat_basalt
	base_mesh.position = Vector3(0.0, 0.16, 0.0)
	visual.add_child(base_mesh)
	base_mesh.owner = root

	# Base Brass Ring
	var base_ring = MeshInstance3D.new()
	base_ring.name = "BaseBrassRing"
	var torus_base = TorusMesh.new()
	torus_base.inner_radius = 0.54
	torus_base.outer_radius = 0.62
	base_ring.mesh = torus_base
	base_ring.material_override = mat_brass
	base_ring.position = Vector3(0.0, 0.28, 0.0)
	visual.add_child(base_ring)
	base_ring.owner = root

	# --- Torso Pivot (Animated Bob/Tilt) ---
	var torso = Node3D.new()
	torso.name = "Torso"
	torso.position = Vector3(0.0, 0.85, 0.0)
	visual.add_child(torso)
	torso.owner = root

	# Cuirass Body
	var cuirass = MeshInstance3D.new()
	cuirass.name = "Cuirass"
	var cyl_cuirass = CylinderMesh.new()
	cyl_cuirass.top_radius = 0.44
	cyl_cuirass.bottom_radius = 0.34
	cyl_cuirass.height = 0.72
	cyl_cuirass.radial_segments = 16
	cuirass.mesh = cyl_cuirass
	cuirass.material_override = mat_basalt
	torso.add_child(cuirass)
	cuirass.owner = root

	# Waist Girdle
	var girdle = MeshInstance3D.new()
	girdle.name = "Girdle"
	var torus_girdle = TorusMesh.new()
	torus_girdle.inner_radius = 0.34
	torus_girdle.outer_radius = 0.42
	girdle.mesh = torus_girdle
	girdle.material_override = mat_brass
	girdle.position = Vector3(0.0, -0.28, 0.0)
	torso.add_child(girdle)
	girdle.owner = root

	# Surya Core Light
	var core_light = OmniLight3D.new()
	core_light.name = "CoreLight"
	core_light.light_color = Color(0.2, 0.85, 1.0)
	core_light.light_energy = 2.2
	core_light.omni_range = 4.5
	core_light.position = Vector3(0.0, 0.05, 0.0)
	torso.add_child(core_light)
	core_light.owner = root

	# Surya Core Mesh
	var core_mesh = MeshInstance3D.new()
	core_mesh.name = "Core"
	var sphere_core = SphereMesh.new()
	sphere_core.radius = 0.18
	sphere_core.height = 0.36
	sphere_core.radial_segments = 16
	sphere_core.rings = 8
	core_mesh.mesh = sphere_core
	core_mesh.material_override = mat_core
	core_mesh.position = Vector3(0.0, 0.05, 0.0)
	torso.add_child(core_mesh)
	core_mesh.owner = root

	# Orbital Rings (Inner Y, Outer X)
	var ring_inner = MeshInstance3D.new()
	ring_inner.name = "OrbitalRing"
	var torus_inner = TorusMesh.new()
	torus_inner.inner_radius = 0.65
	torus_inner.outer_radius = 0.75
	ring_inner.mesh = torus_inner
	ring_inner.material_override = mat_brass
	ring_inner.position = Vector3(0.0, 0.05, 0.0)
	torso.add_child(ring_inner)
	ring_inner.owner = root

	var ring_outer = MeshInstance3D.new()
	ring_outer.name = "OrbitalRingOuter"
	var torus_outer = TorusMesh.new()
	torus_outer.inner_radius = 0.82
	torus_outer.outer_radius = 0.92
	ring_outer.mesh = torus_outer
	ring_outer.material_override = mat_brass
	ring_outer.position = Vector3(0.0, 0.05, 0.0)
	ring_outer.rotation_degrees = Vector3(45.0, 0.0, 30.0)
	torso.add_child(ring_outer)
	ring_outer.owner = root

	# Head Node
	var head = Node3D.new()
	head.name = "Head"
	head.position = Vector3(0.0, 0.68, 0.0)
	torso.add_child(head)
	head.owner = root

	var helmet = MeshInstance3D.new()
	helmet.name = "Helmet"
	var box_head = BoxMesh.new()
	box_head.size = Vector3(0.48, 0.44, 0.42)
	helmet.mesh = box_head
	helmet.material_override = mat_basalt
	head.add_child(helmet)
	helmet.owner = root

	var visor = MeshInstance3D.new()
	visor.name = "Visor"
	var box_visor = BoxMesh.new()
	box_visor.size = Vector3(0.38, 0.10, 0.12)
	visor.mesh = box_visor
	visor.material_override = mat_visor
	visor.position = Vector3(0.0, 0.02, -0.19)
	head.add_child(visor)
	visor.owner = root

	var crown_spire = MeshInstance3D.new()
	crown_spire.name = "CrownSpire"
	var cone = CylinderMesh.new()
	cone.top_radius = 0.02
	cone.bottom_radius = 0.18
	cone.height = 0.28
	crown_spire.mesh = cone
	crown_spire.material_override = mat_brass
	crown_spire.position = Vector3(0.0, 0.34, 0.0)
	head.add_child(crown_spire)
	crown_spire.owner = root

	var eye_light = OmniLight3D.new()
	eye_light.name = "EyeLight"
	eye_light.light_color = Color(1.0, 0.2, 0.1)
	eye_light.light_energy = 2.0
	eye_light.omni_range = 3.5
	eye_light.position = Vector3(0.0, 0.02, -0.28)
	head.add_child(eye_light)
	eye_light.owner = root

	# Left Articulated Blade Arm
	var shoulder_l = Node3D.new()
	shoulder_l.name = "Shoulder_L"
	shoulder_l.position = Vector3(-0.52, 0.22, 0.0)
	torso.add_child(shoulder_l)
	shoulder_l.owner = root

	var pauldron_l = MeshInstance3D.new()
	pauldron_l.name = "Pauldron_L"
	var sp_p = SphereMesh.new()
	sp_p.radius = 0.18
	sp_p.height = 0.36
	pauldron_l.mesh = sp_p
	pauldron_l.material_override = mat_brass
	shoulder_l.add_child(pauldron_l)
	pauldron_l.owner = root

	var arm_l = Node3D.new()
	arm_l.name = "Arm_L"
	arm_l.position = Vector3(-0.05, -0.20, 0.0)
	shoulder_l.add_child(arm_l)
	arm_l.owner = root

	var blade_l = MeshInstance3D.new()
	blade_l.name = "Blade_L"
	var box_blade = BoxMesh.new()
	box_blade.size = Vector3(0.06, 0.85, 0.28)
	blade_l.mesh = box_blade
	blade_l.material_override = mat_blade
	blade_l.position = Vector3(0.0, -0.35, -0.15)
	blade_l.rotation_degrees = Vector3(25.0, 0.0, 15.0)
	arm_l.add_child(blade_l)
	blade_l.owner = root

	# Right Articulated Blade Arm
	var shoulder_r = Node3D.new()
	shoulder_r.name = "Shoulder_R"
	shoulder_r.position = Vector3(0.52, 0.22, 0.0)
	torso.add_child(shoulder_r)
	shoulder_r.owner = root

	var pauldron_r = MeshInstance3D.new()
	pauldron_r.name = "Pauldron_R"
	pauldron_r.mesh = sp_p
	pauldron_r.material_override = mat_brass
	shoulder_r.add_child(pauldron_r)
	pauldron_r.owner = root

	var arm_r = Node3D.new()
	arm_r.name = "Arm_R"
	arm_r.position = Vector3(0.05, -0.20, 0.0)
	shoulder_r.add_child(arm_r)
	arm_r.owner = root

	var blade_r = MeshInstance3D.new()
	blade_r.name = "Blade_R"
	blade_r.mesh = box_blade
	blade_r.material_override = mat_blade
	blade_r.position = Vector3(0.0, -0.35, -0.15)
	blade_r.rotation_degrees = Vector3(25.0, 0.0, -15.0)
	arm_r.add_child(blade_r)
	blade_r.owner = root

	# --- PracticeStrikeArea ---
	var strike_area = Area3D.new()
	strike_area.name = "PracticeStrikeArea"
	strike_area.collision_layer = 0
	strike_area.collision_mask = 2
	strike_area.monitoring = false
	strike_area.position = Vector3(0.0, 1.0, -1.2)
	root.add_child(strike_area)
	strike_area.owner = root

	var strike_col = CollisionShape3D.new()
	strike_col.name = "CollisionShape3D"
	var box_strike = BoxShape3D.new()
	box_strike.size = Vector3(2.4, 1.8, 2.6)
	strike_col.shape = box_strike
	strike_area.add_child(strike_col)
	strike_col.owner = root

	# --- StatusLabel ---
	var label = Label3D.new()
	label.name = "StatusLabel"
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.text = "ASURA TRAINING SENTINEL\nHP: 150/150 | POISE: 100%"
	label.font_size = 26
	label.outline_size = 6
	label.modulate = Color(0.3, 0.9, 1.0)
	label.position = Vector3(0.0, 2.45, 0.0)
	root.add_child(label)
	label.owner = root

	# --- AnimationPlayer & Authored Actions ---
	var anim_player = AnimationPlayer.new()
	anim_player.name = "AnimationPlayer"
	root.add_child(anim_player)
	anim_player.owner = root

	var lib = AnimationLibrary.new()

	# 1. sentinel_idle (2.0s loop)
	var anim_idle = Animation.new()
	anim_idle.length = 2.0
	anim_idle.loop_mode = Animation.LOOP_LINEAR
	# Torso bobbing
	var t_pos_idx = anim_idle.add_track(Animation.TYPE_VALUE)
	anim_idle.track_set_path(t_pos_idx, "Visual/Torso:position")
	anim_idle.track_insert_key(t_pos_idx, 0.0, Vector3(0.0, 0.85, 0.0))
	anim_idle.track_insert_key(t_pos_idx, 1.0, Vector3(0.0, 0.92, 0.0))
	anim_idle.track_insert_key(t_pos_idx, 2.0, Vector3(0.0, 0.85, 0.0))
	# Arm breathing
	var a_l_idx = anim_idle.add_track(Animation.TYPE_VALUE)
	anim_idle.track_set_path(a_l_idx, "Visual/Torso/Shoulder_L/Arm_L:rotation_degrees")
	anim_idle.track_insert_key(a_l_idx, 0.0, Vector3(0.0, 0.0, 0.0))
	anim_idle.track_insert_key(a_l_idx, 1.0, Vector3(0.0, 0.0, 8.0))
	anim_idle.track_insert_key(a_l_idx, 2.0, Vector3(0.0, 0.0, 0.0))
	var a_r_idx = anim_idle.add_track(Animation.TYPE_VALUE)
	anim_idle.track_set_path(a_r_idx, "Visual/Torso/Shoulder_R/Arm_R:rotation_degrees")
	anim_idle.track_insert_key(a_r_idx, 0.0, Vector3(0.0, 0.0, 0.0))
	anim_idle.track_insert_key(a_r_idx, 1.0, Vector3(0.0, 0.0, -8.0))
	anim_idle.track_insert_key(a_r_idx, 2.0, Vector3(0.0, 0.0, 0.0))
	lib.add_animation("sentinel_idle", anim_idle)

	# 2. sentinel_telegraph (1.2s)
	var anim_tel = Animation.new()
	anim_tel.length = 1.2
	var tel_t_idx = anim_tel.add_track(Animation.TYPE_VALUE)
	anim_tel.track_set_path(tel_t_idx, "Visual/Torso:position")
	anim_tel.track_insert_key(tel_t_idx, 0.0, Vector3(0.0, 0.85, 0.0))
	anim_tel.track_insert_key(tel_t_idx, 1.2, Vector3(0.0, 1.05, 0.15))
	var tel_al_idx = anim_tel.add_track(Animation.TYPE_VALUE)
	anim_tel.track_set_path(tel_al_idx, "Visual/Torso/Shoulder_L/Arm_L:rotation_degrees")
	anim_tel.track_insert_key(tel_al_idx, 0.0, Vector3(0.0, 0.0, 0.0))
	anim_tel.track_insert_key(tel_al_idx, 1.2, Vector3(-55.0, 0.0, 25.0))
	var tel_ar_idx = anim_tel.add_track(Animation.TYPE_VALUE)
	anim_tel.track_set_path(tel_ar_idx, "Visual/Torso/Shoulder_R/Arm_R:rotation_degrees")
	anim_tel.track_insert_key(tel_ar_idx, 0.0, Vector3(0.0, 0.0, 0.0))
	anim_tel.track_insert_key(tel_ar_idx, 1.2, Vector3(-55.0, 0.0, -25.0))
	lib.add_animation("sentinel_telegraph", anim_tel)

	# 3. sentinel_strike (0.6s)
	var anim_str = Animation.new()
	anim_str.length = 0.6
	var str_t_idx = anim_str.add_track(Animation.TYPE_VALUE)
	anim_str.track_set_path(str_t_idx, "Visual/Torso:position")
	anim_str.track_insert_key(str_t_idx, 0.0, Vector3(0.0, 1.05, 0.15))
	anim_str.track_insert_key(str_t_idx, 0.15, Vector3(0.0, 0.72, -0.45)) # explosive lunge
	anim_str.track_insert_key(str_t_idx, 0.6, Vector3(0.0, 0.85, 0.0))
	var str_al_idx = anim_str.add_track(Animation.TYPE_VALUE)
	anim_str.track_set_path(str_al_idx, "Visual/Torso/Shoulder_L/Arm_L:rotation_degrees")
	anim_str.track_insert_key(str_al_idx, 0.0, Vector3(-55.0, 0.0, 25.0))
	anim_str.track_insert_key(str_al_idx, 0.15, Vector3(65.0, 0.0, -10.0)) # cleave impact
	anim_str.track_insert_key(str_al_idx, 0.6, Vector3(0.0, 0.0, 0.0))
	var str_ar_idx = anim_str.add_track(Animation.TYPE_VALUE)
	anim_str.track_set_path(str_ar_idx, "Visual/Torso/Shoulder_R/Arm_R:rotation_degrees")
	anim_str.track_insert_key(str_ar_idx, 0.0, Vector3(-55.0, 0.0, -25.0))
	anim_str.track_insert_key(str_ar_idx, 0.15, Vector3(65.0, 0.0, 10.0))
	anim_str.track_insert_key(str_ar_idx, 0.6, Vector3(0.0, 0.0, 0.0))
	lib.add_animation("sentinel_strike", anim_str)

	# 4. sentinel_stagger (1.0s)
	var anim_stg = Animation.new()
	anim_stg.length = 1.0
	var stg_t_idx = anim_stg.add_track(Animation.TYPE_VALUE)
	anim_stg.track_set_path(stg_t_idx, "Visual/Torso:position")
	anim_stg.track_insert_key(stg_t_idx, 0.0, Vector3(0.0, 0.85, 0.0))
	anim_stg.track_insert_key(stg_t_idx, 0.1, Vector3(0.0, 0.80, 0.35)) # recoil
	anim_stg.track_insert_key(stg_t_idx, 1.0, Vector3(0.0, 0.85, 0.0))
	var stg_r_idx = anim_stg.add_track(Animation.TYPE_VALUE)
	anim_stg.track_set_path(stg_r_idx, "Visual/Torso:rotation_degrees")
	anim_stg.track_insert_key(stg_r_idx, 0.0, Vector3(0.0, 0.0, 0.0))
	anim_stg.track_insert_key(stg_r_idx, 0.1, Vector3(-18.0, 0.0, 0.0))
	anim_stg.track_insert_key(stg_r_idx, 1.0, Vector3(0.0, 0.0, 0.0))
	lib.add_animation("sentinel_stagger", anim_stg)

	# 5. sentinel_recover (0.5s)
	var anim_rec = Animation.new()
	anim_rec.length = 0.5
	var rec_t_idx = anim_rec.add_track(Animation.TYPE_VALUE)
	anim_rec.track_set_path(rec_t_idx, "Visual/Torso:position")
	anim_rec.track_insert_key(rec_t_idx, 0.0, Vector3(0.0, 0.80, 0.1))
	anim_rec.track_insert_key(rec_t_idx, 0.5, Vector3(0.0, 0.85, 0.0))
	lib.add_animation("sentinel_recover", anim_rec)

	# 6. sentinel_defeat (1.5s)
	var anim_def = Animation.new()
	anim_def.length = 1.5
	var def_t_idx = anim_def.add_track(Animation.TYPE_VALUE)
	anim_def.track_set_path(def_t_idx, "Visual/Torso:position")
	anim_def.track_insert_key(def_t_idx, 0.0, Vector3(0.0, 0.85, 0.0))
	anim_def.track_insert_key(def_t_idx, 1.0, Vector3(0.0, 0.35, 0.0)) # collapse
	var def_r_idx = anim_def.add_track(Animation.TYPE_VALUE)
	anim_def.track_set_path(def_r_idx, "Visual/Torso:rotation_degrees")
	anim_def.track_insert_key(def_r_idx, 0.0, Vector3(0.0, 0.0, 0.0))
	anim_def.track_insert_key(def_r_idx, 1.0, Vector3(25.0, 0.0, 15.0))
	var def_s_idx = anim_def.add_track(Animation.TYPE_VALUE)
	anim_def.track_set_path(def_s_idx, "Visual:scale")
	anim_def.track_insert_key(def_s_idx, 0.0, Vector3(1.0, 1.0, 1.0))
	anim_def.track_insert_key(def_s_idx, 1.2, Vector3(1.0, 1.0, 1.0))
	anim_def.track_insert_key(def_s_idx, 1.5, Vector3(0.05, 0.05, 0.05)) # dissolve
	lib.add_animation("sentinel_defeat", anim_def)

	anim_player.add_animation_library("", lib)

	# --- Pack and Save Scene ---
	var packed = PackedScene.new()
	var pack_err = packed.pack(root)
	if pack_err != OK:
		print("  -> ERROR: Failed to pack scene: ", pack_err)
		quit(1)
		return

	var save_err = ResourceSaver.save(packed, "res://scenes/entities/TrainingSentinel3D.tscn")
	if save_err != OK:
		print("  -> ERROR: Failed to save scene: ", save_err)
		quit(1)
		return

	print("  -> SUCCESS: Saved production TrainingSentinel3D.tscn cleanly!")
	quit(0)
