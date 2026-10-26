class_name CombatMath
extends RefCounted

## Authoritative 3D Combat Mathematics ported from legacy CombatSystem.ts
## Preserves perfect parry timing, shield directional block, stagger break, and critical multipliers.

enum Element {
	NONE,
	AGNI,
	SURYA,
	VAYU,
	TAMAS
}

class PoiseData:
	var current: float = 100.0
	var max_poise: float = 100.0
	var is_staggered: bool = false
	var stagger_timer: float = 0.0
	var stagger_duration: float = 1.8

	func _init(p_max: float = 100.0, p_duration: float = 1.8) -> void:
		max_poise = p_max
		current = p_max
		stagger_duration = p_duration

	func take_poise_damage(amount: float) -> bool:
		current = max(0.0, current - amount)
		if current <= 0.0 and not is_staggered:
			is_staggered = true
			stagger_timer = stagger_duration
			return true
		return false

	func damage(amount: float) -> bool:
		return take_poise_damage(amount)

	func update(delta: float) -> void:
		if is_staggered:
			stagger_timer = max(0.0, stagger_timer - delta)
			if stagger_timer <= 0.0:
				is_staggered = false
				current = max_poise

class AttackSpec:
	var attacker_id: String = ""
	var damage: int = 25
	var poise_damage: float = 30.0
	var is_shield_break: bool = false
	var element: Element = Element.SURYA
	var origin: Vector3 = Vector3.ZERO

	var base_damage: int:
		get: return damage
		set(v): damage = v

	func _init(p_id: String = "", p_dmg: int = 25, p_poise: float = 30.0, p_origin: Vector3 = Vector3.ZERO) -> void:
		attacker_id = p_id
		damage = p_dmg
		poise_damage = p_poise
		origin = p_origin

class DefenseSpec:
	var defender_id: String = ""
	var position: Vector3 = Vector3.ZERO
	var facing: Vector3 = Vector3.FORWARD
	var is_guarding: bool = false
	var parry_window_timer: float = 0.0 # > 0 means inside 120ms parry window
	var poise: PoiseData = PoiseData.new()

	func _init(p_id: String = "", p_pos: Vector3 = Vector3.ZERO, p_facing: Vector3 = Vector3.FORWARD) -> void:
		defender_id = p_id
		position = p_pos
		facing = p_facing

class CombatHitResult:
	var damage_dealt: int = 0
	var poise_damage_dealt: float = 0.0
	var was_parried: bool = false
	var was_blocked: bool = false
	var triggered_stagger: bool = false
	var is_critical: bool = false

	var is_parried: bool:
		get: return was_parried
		set(v): was_parried = v

	var is_blocked: bool:
		get: return was_blocked
		set(v): was_blocked = v

	func _init(p_hit: bool = true, p_parried: bool = false, p_stagger: bool = false, p_dmg: int = 0, p_poise: float = 0.0) -> void:
		was_parried = p_parried
		triggered_stagger = p_stagger
		damage_dealt = p_dmg
		poise_damage_dealt = p_poise

## Evaluates attack against defense state authoritatively matching legacy TypeScript formulas.
static func resolve_attack(attack: AttackSpec, defense: DefenseSpec) -> CombatHitResult:
	var result = CombatHitResult.new()

	# 1. Perfect Parry Check (Active parry window)
	if defense.parry_window_timer > 0.0:
		result.damage_dealt = 0
		result.poise_damage_dealt = 0.0
		result.was_parried = true
		result.was_blocked = false
		result.triggered_stagger = false
		result.is_critical = false
		return result

	# 2. Directional Shield Block Check (facing dot incoming attack vector)
	var was_blocked: bool = false
	var damage: int = attack.damage
	var poise_dmg: float = attack.poise_damage

	if defense.is_guarding:
		var attack_dir = (attack.origin - defense.position)
		attack_dir.y = 0.0 # Calculate on ground plane XZ
		if attack_dir.length_squared() > 0.001:
			attack_dir = attack_dir.normalized()
			var facing_flat = Vector3(defense.facing.x, 0.0, defense.facing.z).normalized()
			var dot = facing_flat.dot(attack_dir)

			# Dot > 0.38 corresponds to ~68 degree half-angle cone
			if dot > 0.38:
				if attack.is_shield_break:
					# Shield break bypasses guard and inflicts 2x poise damage
					was_blocked = false
					poise_dmg *= 2.0
				else:
					# Normal block absorbs 75% of health damage, absorbs 50% poise damage
					was_blocked = true
					damage = int(floor(float(damage) * 0.25))
					poise_dmg = floor(poise_dmg * 0.50)

	# 3. Stagger & Critical Vulnerability Check
	var is_critical: bool = false
	if defense.poise.is_staggered:
		is_critical = true
		damage = int(floor(float(damage) * 1.35)) # +35% critical punish

	# 4. Apply Poise Damage
	var triggered_stagger: bool = false
	defense.poise.current = max(0.0, defense.poise.current - poise_dmg)

	if defense.poise.current <= 0.0 and not defense.poise.is_staggered:
		defense.poise.is_staggered = true
		defense.poise.stagger_timer = defense.poise.stagger_duration
		triggered_stagger = true

	result.damage_dealt = damage
	result.poise_damage_dealt = poise_dmg
	result.was_parried = false
	result.was_blocked = was_blocked
	result.triggered_stagger = triggered_stagger
	result.is_critical = is_critical
	return result
