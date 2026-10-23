class_name TestCombatMath
extends RefCounted

static func run_all() -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	results.append(_test_normal_unblocked_attack())
	results.append(_test_perfect_parry())
	results.append(_test_directional_guard_block())
	results.append(_test_guard_out_of_angle_fails())
	results.append(_test_shield_break_bypasses_guard())
	results.append(_test_poise_break_and_stagger())
	results.append(_test_critical_punish_on_staggered())
	return results

static func _test_normal_unblocked_attack() -> Dictionary:
	var atk = CombatMath.AttackSpec.new("player", 40, 20.0, Vector3(0, 0, 5))
	var def = CombatMath.DefenseSpec.new("enemy", Vector3(0, 0, 0), Vector3.FORWARD)

	var res = CombatMath.resolve_attack(atk, def)
	var pass_check = (res.damage_dealt == 40 and res.poise_damage_dealt == 20.0 and not res.was_blocked and not res.was_parried)
	return {"name": "test_normal_unblocked_attack", "passed": pass_check}

static func _test_perfect_parry() -> Dictionary:
	var atk = CombatMath.AttackSpec.new("boss", 80, 50.0, Vector3(0, 0, 3))
	var def = CombatMath.DefenseSpec.new("player", Vector3(0, 0, 0), Vector3.FORWARD)
	def.parry_window_timer = 0.10 # Active parry window

	var res = CombatMath.resolve_attack(atk, def)
	var pass_check = (res.was_parried and res.damage_dealt == 0 and res.poise_damage_dealt == 0.0)
	return {"name": "test_perfect_parry", "passed": pass_check}

static func _test_directional_guard_block() -> Dictionary:
	var atk = CombatMath.AttackSpec.new("enemy", 40, 20.0, Vector3(0, 0, 5))
	var def = CombatMath.DefenseSpec.new("player", Vector3(0, 0, 0), Vector3(0, 0, 1)) # Facing attack
	def.is_guarding = true

	var res = CombatMath.resolve_attack(atk, def)
	# 75% health absorbed (40 * 0.25 = 10), 50% poise absorbed (20 * 0.5 = 10)
	var pass_check = (res.was_blocked and res.damage_dealt == 10 and res.poise_damage_dealt == 10.0)
	return {"name": "test_directional_guard_block", "passed": pass_check}

static func _test_guard_out_of_angle_fails() -> Dictionary:
	var atk = CombatMath.AttackSpec.new("enemy", 40, 20.0, Vector3(0, 0, -5)) # Flank from behind
	var def = CombatMath.DefenseSpec.new("player", Vector3(0, 0, 0), Vector3(0, 0, 1))
	def.is_guarding = true

	var res = CombatMath.resolve_attack(atk, def)
	var pass_check = (not res.was_blocked and res.damage_dealt == 40)
	return {"name": "test_guard_out_of_angle_fails", "passed": pass_check}

static func _test_shield_break_bypasses_guard() -> Dictionary:
	var atk = CombatMath.AttackSpec.new("boss", 50, 30.0, Vector3(0, 0, 4))
	atk.is_shield_break = true
	var def = CombatMath.DefenseSpec.new("player", Vector3(0, 0, 0), Vector3(0, 0, 1))
	def.is_guarding = true

	var res = CombatMath.resolve_attack(atk, def)
	# Guard break: was_blocked = false, poise damage doubled to 60.0
	var pass_check = (not res.was_blocked and res.poise_damage_dealt == 60.0)
	return {"name": "test_shield_break_bypasses_guard", "passed": pass_check}

static func _test_poise_break_and_stagger() -> Dictionary:
	var atk = CombatMath.AttackSpec.new("player", 30, 100.0, Vector3(0, 0, 3))
	var def = CombatMath.DefenseSpec.new("enemy", Vector3(0, 0, 0), Vector3.FORWARD)
	def.poise = CombatMath.PoiseData.new(80.0, 2.0)

	var res = CombatMath.resolve_attack(atk, def)
	var pass_check = (res.triggered_stagger and def.poise.is_staggered and def.poise.current == 0.0 and def.poise.stagger_timer == 2.0)
	return {"name": "test_poise_break_and_stagger", "passed": pass_check}

static func _test_critical_punish_on_staggered() -> Dictionary:
	var atk = CombatMath.AttackSpec.new("player", 100, 20.0, Vector3(0, 0, 3))
	var def = CombatMath.DefenseSpec.new("enemy", Vector3(0, 0, 0), Vector3.FORWARD)
	def.poise.is_staggered = true

	var res = CombatMath.resolve_attack(atk, def)
	# 100 * 1.35 = 135 critical damage
	var pass_check = (res.is_critical and res.damage_dealt == 135)
	return {"name": "test_critical_punish_on_staggered", "passed": pass_check}
