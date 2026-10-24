extends CharacterBody3D
class_name BossBrihaspati3D

## Monumental 3D Boss Encounter — Brihaspati's Astral Avatar / Sage Titan
## High Preceptor of the Devas, Master of Sacred Vedic Mantras and Cosmic Wisdom.

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	IDLE,
	ASTRAL_APPROACH,
	ARMILLARY_BEAM_TELEGRAPH,
	ARMILLARY_BEAM_EXECUTE,
	MANTRA_SHOCKWAVE_TELEGRAPH,
	MANTRA_SHOCKWAVE_EXECUTE,
	COSMIC_ENLIGHTENMENT_ROAR,
	COSMIC_COLLAPSE,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 550
@export var current_health: int = 550
@export var max_poise: float = 220.0
@export var beam_damage: int = 36
@export var shockwave_damage: int = 30
@export var collapse_damage: int = 55
@export var perception_radius: float = 40.0

var current_state: State = State.IDLE
var current_phase: int = 1
var is_enraged: bool = false
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var attack_cooldown: float = 0.0
var arena_center: Vector3 = Vector3.ZERO

@onready var visual_mesh: Node3D = $VisualMesh
@onready var shockwave_hitbox: Area3D = $ShockwaveHitbox
@onready var collapse_hitbox: Area3D = $CollapseHitbox
@onready var halo_light: OmniLight3D = $BrihaspatiHaloLight

signal boss_health_changed(current: int, max_hp: int)
signal boss_phase_changed(phase: int)
signal boss_defeated()
signal astral_collapse_triggered(epicenter: Vector3)

func _init() -> void:
	add_to_group("bosses")
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(220.0, 3.8)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layer 1: Env, Layer 2: Player

func _ready() -> void:
	arena_center = global_position
	current_health = max_health
	if shockwave_hitbox:
		shockwave_hitbox.monitoring = false
		shockwave_hitbox.body_entered.connect(_on_shockwave_hit_body)
	if collapse_hitbox:
		collapse_hitbox.monitoring = false
		collapse_hitbox.body_entered.connect(_on_collapse_hit_body)

func _physics_process(delta: float) -> void:
	if current_state == State.DEFEATED:
		return

	if not target_player:
		var players = get_tree().get_nodes_in_group("player") if is_inside_tree() else []
		if players.size() > 0:
			target_player = players[0] as Node3D

	if poise:
		poise.update(delta)

	if attack_cooldown > 0.0:
		attack_cooldown = max(0.0, attack_cooldown - delta)

	match current_state:
		State.IDLE:
			_process_idle(delta)
		State.ASTRAL_APPROACH:
			_process_approach(delta)
		State.ARMILLARY_BEAM_TELEGRAPH:
			_process_beam_telegraph(delta)
		State.ARMILLARY_BEAM_EXECUTE:
			_process_beam_execute(delta)
		State.MANTRA_SHOCKWAVE_TELEGRAPH:
			_process_shockwave_telegraph(delta)
		State.MANTRA_SHOCKWAVE_EXECUTE:
			_process_shockwave_execute(delta)
		State.COSMIC_ENLIGHTENMENT_ROAR:
			_process_enrage_roar(delta)
		State.COSMIC_COLLAPSE:
			_process_collapse(delta)
		State.STAGGERED:
			_process_stagger(delta)

	move_and_slide()

func _get_entity_pos(node: Node3D) -> Vector3:
	return node.global_position if node.is_inside_tree() else node.position

func _safe_look_at(target_pos: Vector3) -> void:
	if is_inside_tree():
		var my_pos = global_position
		var look_target = target_pos
		look_target.y = my_pos.y
		if my_pos.distance_squared_to(look_target) > 0.001:
			look_at(look_target, Vector3.UP)

func _process_idle(delta: float) -> void:
	state_timer += delta
	if target_player and is_instance_valid(target_player):
		var dist = _get_entity_pos(self).distance_to(_get_entity_pos(target_player))
		if dist <= perception_radius:
			current_state = State.ASTRAL_APPROACH
			state_timer = 0.0

func _process_approach(delta: float) -> void:
	state_timer += delta
	if not target_player or not is_instance_valid(target_player):
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	_safe_look_at(player_pos)

	var dist = my_pos.distance_to(player_pos)
	var speed = 4.2 if not is_enraged else 6.5
	var dir = (player_pos - my_pos).normalized() if dist > 0.001 else Vector3.FORWARD

	if dist > 8.0:
		velocity = dir * speed
	else:
		velocity = velocity.move_toward(Vector3.ZERO, 10.0 * delta)

	if attack_cooldown <= 0.0 and state_timer >= 1.2:
		state_timer = 0.0
		velocity = Vector3.ZERO
		if dist <= 7.0:
			current_state = State.MANTRA_SHOCKWAVE_TELEGRAPH
		elif is_enraged and randf() > 0.4:
			current_state = State.COSMIC_COLLAPSE
		else:
			current_state = State.ARMILLARY_BEAM_TELEGRAPH

func _process_beam_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if halo_light:
		halo_light.light_energy = 3.5 + sin(state_timer * 20.0) * 2.0

	var duration = 0.6 if not is_enraged else 0.35
	if state_timer >= duration:
		current_state = State.ARMILLARY_BEAM_EXECUTE
		state_timer = 0.0

func _process_beam_execute(delta: float) -> void:
	state_timer += delta
	if state_timer >= 0.2 and state_timer - delta < 0.2:
		_fire_armillary_beam()

	if state_timer >= 0.6:
		attack_cooldown = 1.6 if not is_enraged else 0.9
		current_state = State.ASTRAL_APPROACH
		state_timer = 0.0

func _fire_armillary_beam() -> void:
	if not target_player or not is_instance_valid(target_player):
		return
	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	var dist = my_pos.distance_to(player_pos)
	if dist <= 35.0:
		var dmg = beam_damage if not is_enraged else int(beam_damage * 1.25)
		var attack_spec = CombatMath.AttackSpec.new("armillary_beam", dmg, 30.0, my_pos)
		if target_player.has_method("take_damage_spec"):
			target_player.take_damage_spec(attack_spec)
		elif target_player.has_method("take_damage"):
			target_player.take_damage(dmg)

func _process_shockwave_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	var duration = 0.65 if not is_enraged else 0.4
	if state_timer >= duration:
		current_state = State.MANTRA_SHOCKWAVE_EXECUTE
		state_timer = 0.0
		if shockwave_hitbox:
			shockwave_hitbox.monitoring = true

func _process_shockwave_execute(delta: float) -> void:
	state_timer += delta
	if state_timer >= 0.4:
		if shockwave_hitbox:
			shockwave_hitbox.monitoring = false
		attack_cooldown = 1.8 if not is_enraged else 1.0
		current_state = State.ASTRAL_APPROACH
		state_timer = 0.0

func _process_collapse(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO

	if state_timer <= 0.7:
		if halo_light:
			halo_light.light_energy = 6.5
			halo_light.light_color = Color(0.6, 0.3, 1.0, 1.0)
	elif state_timer >= 0.7 and state_timer - delta < 0.7:
		if collapse_hitbox:
			collapse_hitbox.monitoring = true
		astral_collapse_triggered.emit(_get_entity_pos(self))
	elif state_timer >= 1.1:
		if collapse_hitbox:
			collapse_hitbox.monitoring = false
		if halo_light:
			halo_light.light_energy = 3.0
			halo_light.light_color = Color(0.4, 0.7, 1.0, 1.0)
		attack_cooldown = 2.4
		current_state = State.ASTRAL_APPROACH
		state_timer = 0.0

func _process_enrage_roar(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO
	if halo_light:
		halo_light.light_color = Color(0.8, 0.4, 1.0, 1.0)
		halo_light.light_energy = 8.0

	if state_timer >= 1.8:
		current_state = State.ASTRAL_APPROACH
		state_timer = 0.0

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 15.0 * delta)
	if state_timer >= 1.8:
		current_state = State.ASTRAL_APPROACH
		state_timer = 0.0

func _on_shockwave_hit_body(body: Node3D) -> void:
	if body == self or not is_instance_valid(body):
		return
	if body.is_in_group("player"):
		var dmg = shockwave_damage if not is_enraged else int(shockwave_damage * 1.25)
		var attack_spec = CombatMath.AttackSpec.new("mantra_shockwave", dmg, 45.0, _get_entity_pos(self))
		if body.has_method("take_damage_spec"):
			body.take_damage_spec(attack_spec)
		elif body.has_method("take_damage"):
			body.take_damage(dmg)

func _on_collapse_hit_body(body: Node3D) -> void:
	if body == self or not is_instance_valid(body):
		return
	if body.is_in_group("player"):
		var dmg = collapse_damage if not is_enraged else int(collapse_damage * 1.3)
		var attack_spec = CombatMath.AttackSpec.new("cosmic_collapse", dmg, 70.0, _get_entity_pos(self))
		if body.has_method("take_damage_spec"):
			body.take_damage_spec(attack_spec)
		elif body.has_method("take_damage"):
			body.take_damage(dmg)

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if current_state == State.DEFEATED:
		return CombatMath.CombatHitResult.new()

	var my_pos = _get_entity_pos(self)
	var facing = -global_transform.basis.z if is_inside_tree() else Vector3.FORWARD
	var def_spec = CombatMath.DefenseSpec.new("boss_brihaspati", my_pos, facing)
	var res = CombatMath.resolve_attack(attack_spec, def_spec)

	current_health = max(0, current_health - res.damage_dealt)
	boss_health_changed.emit(current_health, max_health)

	# Check Enrage Threshold (50% HP = 275)
	if current_health <= 275 and not is_enraged and current_health > 0:
		is_enraged = true
		current_phase = 2
		boss_phase_changed.emit(2)
		current_state = State.COSMIC_ENLIGHTENMENT_ROAR
		state_timer = 0.0
		return res

	var poise_broken = false
	if poise and poise.has_method("take_poise_damage"):
		poise_broken = poise.take_poise_damage(attack_spec.poise_damage)

	if current_health <= 0:
		_die()
	elif poise_broken and not is_enraged:
		current_state = State.STAGGERED
		state_timer = 0.0

	return res

func take_damage(amount: int) -> void:
	if current_state == State.DEFEATED:
		return
	current_health = max(0, current_health - amount)
	boss_health_changed.emit(current_health, max_health)

	if current_health <= 275 and not is_enraged and current_health > 0:
		is_enraged = true
		current_phase = 2
		boss_phase_changed.emit(2)
		current_state = State.COSMIC_ENLIGHTENMENT_ROAR
		state_timer = 0.0
		return

	if current_health <= 0:
		_die()

func _die() -> void:
	current_state = State.DEFEATED
	current_health = 0
	velocity = Vector3.ZERO
	if shockwave_hitbox:
		shockwave_hitbox.monitoring = false
	if collapse_hitbox:
		collapse_hitbox.monitoring = false
	boss_defeated.emit()
	if is_inside_tree():
		var tween = create_tween()
		tween.tween_property(self, "scale", Vector3.ZERO, 1.2)
		tween.tween_callback(queue_free)
	else:
		queue_free()
