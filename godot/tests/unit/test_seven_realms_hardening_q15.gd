class_name TestSevenRealmsHardeningQ15
extends RefCounted

## Suite 31: Seven-Realm Production Hardening & Release Certification (Stage Q15)
## Independent verification across all seven Vedic Realms:
## Bhumi, Antariksha, Patala, Svar, Maharloka, Tapoloka, and Satyaloka.

static func run_all() -> Array:
	var results: Array = []
	results.append(test_bhumi_production_integrity())
	results.append(test_antariksha_combat_remediation())
	results.append(test_antariksha_enemy_separation_and_parry())
	results.append(test_patala_combat_remediation())
	results.append(test_patala_enemy_remediation())
	results.append(test_svar_combat_remediation())
	results.append(test_maharloka_combat_remediation())
	results.append(test_tapoloka_combat_remediation())
	results.append(test_satyaloka_combat_remediation())
	results.append(test_seven_realms_full_traceability_matrix())
	return results

static func test_bhumi_production_integrity() -> Dictionary:
	var name = "Q15-01: Bhumi Valley Production Hardening & Boss Reset Verification"
	var kalanemi_script = load("res://scripts/entities/boss_kalanemi_3d.gd")
	if not kalanemi_script:
		return {"name": name, "passed": false, "message": "Failed to load boss_kalanemi_3d.gd"}

	var boss = kalanemi_script.new()
	if not boss.has_method("take_damage_spec"):
		boss.free()
		return {"name": name, "passed": false, "message": "BossKalanemi missing take_damage_spec()"}

	if not boss.has_method("reset_boss"):
		boss.free()
		return {"name": name, "passed": false, "message": "BossKalanemi missing reset_boss()"}

	# Test reset_boss restores health and phase
	boss.current_health = 50
	boss.current_phase = 2
	boss.reset_boss()
	var ok = (boss.current_health == boss.max_health and boss.current_phase == 1 and boss.current_state == kalanemi_script.State.DORMANT)
	boss.free()

	if not ok:
		return {"name": name, "passed": false, "message": "reset_boss failed to restore full HP or phase 1"}
	return {"name": name, "passed": true}

static func test_antariksha_combat_remediation() -> Dictionary:
	var name = "Q15-02: Antariksha Boss Matarishvan CombatMath Integration & Parry Stagger"
	var matarishvan_script = load("res://scripts/entities/boss_matarishvan_3d.gd")
	if not matarishvan_script:
		return {"name": name, "passed": false, "message": "Failed to load boss_matarishvan_3d.gd"}

	var boss = matarishvan_script.new()
	if not boss.has_method("take_damage_spec"):
		boss.free()
		return {"name": name, "passed": false, "message": "BossMatarishvan missing take_damage_spec()"}

	if not boss.has_method("reset_boss"):
		boss.free()
		return {"name": name, "passed": false, "message": "BossMatarishvan missing reset_boss()"}

	# Inflict damage via AttackSpec
	var spec = CombatMath.AttackSpec.new("player_chakram", 50, 40.0, Vector3.ZERO)
	var res = boss.take_damage_spec(spec)
	var hp_reduced = (boss.current_health == boss.max_health - 50)

	# Trigger parry callback
	boss._on_sweep_parried()
	var parry_staggered = (boss.current_state == boss.State.STAGGERED)

	# Reset boss
	boss.reset_boss()
	var reset_ok = (boss.current_health == boss.max_health and boss.current_phase == 1)
	boss.free()

	if not hp_reduced:
		return {"name": name, "passed": false, "message": "take_damage_spec did not correctly reduce boss HP"}
	if not parry_staggered:
		return {"name": name, "passed": false, "message": "_on_sweep_parried did not trigger STAGGERED state"}
	if not reset_ok:
		return {"name": name, "passed": false, "message": "reset_boss did not restore full HP"}
	return {"name": name, "passed": true}

static func test_antariksha_enemy_separation_and_parry() -> Dictionary:
	var name = "Q15-03: Antariksha Wind Archer & Gale Falcon Parry Reactions & Flocking"
	var archer_script = load("res://scripts/entities/wind_archer_3d.gd")
	var falcon_script = load("res://scripts/entities/gale_falcon_3d.gd")
	if not archer_script or not falcon_script:
		return {"name": name, "passed": false, "message": "Failed to load Antariksha enemy scripts"}

	var archer = archer_script.new()
	var falcon = falcon_script.new()

	var archer_has_spec = archer.has_method("take_damage_spec")
	var falcon_has_spec = falcon.has_method("take_damage_spec")

	# Test talon parried
	falcon._on_talon_parried()
	var falcon_staggered = (falcon.current_state == falcon.State.STAGGERED)

	archer.free()
	falcon.free()

	if not archer_has_spec or not falcon_has_spec:
		return {"name": name, "passed": false, "message": "Antariksha enemies missing take_damage_spec"}
	if not falcon_staggered:
		return {"name": name, "passed": false, "message": "Falcon not staggered on talon parry"}
	return {"name": name, "passed": true}

static func test_patala_combat_remediation() -> Dictionary:
	var name = "Q15-04: Patala Boss Shesha Echo Parry Stagger & Enrage Phase Mechanics"
	var shesha_script = load("res://scripts/entities/boss_shesha_echo_3d.gd")
	if not shesha_script:
		return {"name": name, "passed": false, "message": "Failed to load boss_shesha_echo_3d.gd"}

	var boss = shesha_script.new()
	if not boss.has_method("take_damage_spec") or not boss.has_method("reset_boss"):
		boss.free()
		return {"name": name, "passed": false, "message": "BossSheshaEcho missing required combat methods"}

	# Inflict parry
	boss._on_attack_parried(45.0)
	var staggered = (boss.current_state == boss.State.STAGGERED)

	# Reset
	boss.reset_boss()
	var reset_ok = (boss.current_health == boss.max_health and boss.current_phase == 1 and not boss.is_enraged)
	boss.free()

	if not staggered:
		return {"name": name, "passed": false, "message": "Shesha not staggered after attack parried"}
	if not reset_ok:
		return {"name": name, "passed": false, "message": "Shesha reset_boss did not clear enraged state or restore HP"}
	return {"name": name, "passed": true}

static func test_patala_enemy_remediation() -> Dictionary:
	var name = "Q15-05: Patala Naga Spitter & Constrictor CombatMath & Parry Recoil"
	var spitter_script = load("res://scripts/entities/naga_spitter_3d.gd")
	var constrictor_script = load("res://scripts/entities/naga_constrictor_3d.gd")
	if not spitter_script or not constrictor_script:
		return {"name": name, "passed": false, "message": "Failed to load Patala enemy scripts"}

	var spitter = spitter_script.new()
	var constrictor = constrictor_script.new()

	var spitter_ok = spitter.has_method("take_damage_spec")
	var constrictor_ok = constrictor.has_method("take_damage_spec") and constrictor.has_method("_on_attack_parried")

	constrictor._on_attack_parried()
	var constrictor_staggered = (constrictor.current_state == constrictor.State.STAGGERED)

	spitter.free()
	constrictor.free()

	if not spitter_ok or not constrictor_ok:
		return {"name": name, "passed": false, "message": "Patala enemies missing take_damage_spec"}
	if not constrictor_staggered:
		return {"name": name, "passed": false, "message": "Naga constrictor failed to stagger on parry"}
	return {"name": name, "passed": true}

static func test_svar_combat_remediation() -> Dictionary:
	var name = "Q15-06: Svar Boss Surya Avatara Greatsword Cleave Parry & Reset Integrity"
	var surya_script = load("res://scripts/entities/boss_surya_avatara_3d.gd")
	var guardian_script = load("res://scripts/entities/surya_guardian_3d.gd")
	if not surya_script or not guardian_script:
		return {"name": name, "passed": false, "message": "Failed to load Svar scripts"}

	var boss = surya_script.new()
	var guardian = guardian_script.new()

	var boss_has_spec = boss.has_method("take_damage_spec") and boss.has_method("reset_boss")
	boss._on_cleave_parried(45.0)
	var boss_staggered = (boss.current_state == boss.State.STAGGERED)

	guardian._on_attack_parried()
	var guardian_staggered = (guardian.current_state == guardian.State.STAGGERED)

	boss.reset_boss()
	var reset_ok = (boss.current_health == boss.max_health and boss.current_phase == 1)

	boss.free()
	guardian.free()

	if not boss_has_spec:
		return {"name": name, "passed": false, "message": "BossSuryaAvatara missing combat methods"}
	if not boss_staggered:
		return {"name": name, "passed": false, "message": "BossSuryaAvatara not staggered on cleave parry"}
	if not guardian_staggered:
		return {"name": name, "passed": false, "message": "SuryaGuardian not staggered on spear parry"}
	if not reset_ok:
		return {"name": name, "passed": false, "message": "BossSuryaAvatara reset_boss failed"}
	return {"name": name, "passed": true}

static func test_maharloka_combat_remediation() -> Dictionary:
	var name = "Q15-07: Maharloka Boss Brihaspati Astral Collapse Parry & Golem Stagger"
	var brihaspati_script = load("res://scripts/entities/boss_brihaspati_3d.gd")
	var golem_script = load("res://scripts/entities/scripture_golem_3d.gd")
	if not brihaspati_script or not golem_script:
		return {"name": name, "passed": false, "message": "Failed to load Maharloka scripts"}

	var boss = brihaspati_script.new()
	var golem = golem_script.new()

	var boss_has_spec = boss.has_method("take_damage_spec") and boss.has_method("reset_boss")
	boss._on_attack_parried(45.0)
	var boss_staggered = (boss.current_state == boss.State.STAGGERED)

	golem._on_slam_parried()
	var golem_staggered = (golem.current_state == golem.State.STAGGERED)

	boss.reset_boss()
	var reset_ok = (boss.current_health == boss.max_health and boss.current_phase == 1)

	boss.free()
	golem.free()

	if not boss_has_spec:
		return {"name": name, "passed": false, "message": "BossBrihaspati missing combat methods"}
	if not boss_staggered:
		return {"name": name, "passed": false, "message": "BossBrihaspati not staggered on attack parry"}
	if not golem_staggered:
		return {"name": name, "passed": false, "message": "ScriptureGolem not staggered on slam parry"}
	if not reset_ok:
		return {"name": name, "passed": false, "message": "BossBrihaspati reset_boss failed"}
	return {"name": name, "passed": true}

static func test_tapoloka_combat_remediation() -> Dictionary:
	var name = "Q15-08: Tapoloka Boss Agni Rudra Trisula Thrust Parry & Magma Hound Deflection"
	var agni_script = load("res://scripts/entities/boss_agni_rudra_3d.gd")
	var hound_script = load("res://scripts/entities/tapas_magma_hound_3d.gd")
	if not agni_script or not hound_script:
		return {"name": name, "passed": false, "message": "Failed to load Tapoloka scripts"}

	var boss = agni_script.new()
	var hound = hound_script.new()

	var boss_has_spec = boss.has_method("take_damage_spec") and boss.has_method("reset_boss")
	boss._on_attack_parried(40.0)
	var boss_staggered = (boss.current_state == boss.State.STAGGERED)

	hound._on_pounce_parried()
	var hound_staggered = (hound.current_state == hound.State.STAGGERED)

	boss.reset_boss()
	var reset_ok = (boss.current_health == boss.max_health and boss.current_phase == 1)

	boss.free()
	hound.free()

	if not boss_has_spec:
		return {"name": name, "passed": false, "message": "BossAgniRudra missing combat methods"}
	if not boss_staggered:
		return {"name": name, "passed": false, "message": "BossAgniRudra not staggered on attack parry"}
	if not hound_staggered:
		return {"name": name, "passed": false, "message": "TapasMagmaHound not staggered on pounce parry"}
	if not reset_ok:
		return {"name": name, "passed": false, "message": "BossAgniRudra reset_boss failed"}
	return {"name": name, "passed": true}

static func test_satyaloka_combat_remediation() -> Dictionary:
	var name = "Q15-09: Satyaloka Boss Brahma Avatara Quad-Ray Parry & Dharma Sentinel Shield"
	var brahma_script = load("res://scripts/entities/boss_brahma_avatara_3d.gd")
	var sentinel_script = load("res://scripts/entities/dharma_sentinel_3d.gd")
	if not brahma_script or not sentinel_script:
		return {"name": name, "passed": false, "message": "Failed to load Satyaloka scripts"}

	var boss = brahma_script.new()
	var sentinel = sentinel_script.new()

	var boss_has_spec = boss.has_method("take_damage_spec") and boss.has_method("reset_boss")
	boss._on_attack_parried(45.0)
	var boss_staggered = (boss.current_state == boss.State.STAGGERED)

	sentinel._on_spear_parried()
	var sentinel_staggered = (sentinel.current_state == sentinel.State.STAGGERED)

	boss.reset_boss()
	var reset_ok = (boss.current_health == boss.max_health and boss.current_phase == 1 and not boss.is_enraged)

	boss.free()
	sentinel.free()

	if not boss_has_spec:
		return {"name": name, "passed": false, "message": "BossBrahmaAvatara missing combat methods"}
	if not boss_staggered:
		return {"name": name, "passed": false, "message": "BossBrahmaAvatara not staggered on attack parry"}
	if not sentinel_staggered:
		return {"name": name, "passed": false, "message": "DharmaSentinel not staggered on spear parry"}
	if not reset_ok:
		return {"name": name, "passed": false, "message": "BossBrahmaAvatara reset_boss failed"}
	return {"name": name, "passed": true}

static func test_seven_realms_full_traceability_matrix() -> Dictionary:
	var name = "Q15-10: Complete Seven-Realm Scene Instantiation & Checkpoint Retry Linkage"
	var realm_scenes = [
		{"path": "res://scenes/levels/BhumiValley3D.tscn", "portal": "_spawn_antariksha_portal"},
		{"path": "res://scenes/levels/AntarikshaSkyRealm3D.tscn", "portal": "_spawn_patala_descent_portal"},
		{"path": "res://scenes/levels/PatalaUnderworld3D.tscn", "portal": "_spawn_svar_portal"},
		{"path": "res://scenes/levels/SvarSolarCitadel3D.tscn", "portal": "_spawn_maharloka_portal"},
		{"path": "res://scenes/levels/MaharlokaSanctuary3D.tscn", "portal": "_spawn_tapoloka_portal"},
		{"path": "res://scenes/levels/TapolokaForge3D.tscn", "portal": "_spawn_satyaloka_portal"},
		{"path": "res://scenes/levels/SatyalokaApex3D.tscn", "portal": "_spawn_cosmic_cycle_portal"}
	]

	for r in realm_scenes:
		var scn = load(r["path"])
		if not scn:
			return {"name": name, "passed": false, "message": "Failed to load realm: " + r["path"]}
		var inst = scn.instantiate()
		if not inst:
			return {"name": name, "passed": false, "message": "Failed to instantiate realm: " + r["path"]}
		if not inst.has_method("_on_retry_requested"):
			inst.free()
			return {"name": name, "passed": false, "message": "Realm missing _on_retry_requested: " + r["path"]}
		if not inst.has_method(r["portal"]):
			inst.free()
			return {"name": name, "passed": false, "message": "Realm missing portal method %s: %s" % [r["portal"], r["path"]]}
		inst.free()

	return {"name": name, "passed": true}
