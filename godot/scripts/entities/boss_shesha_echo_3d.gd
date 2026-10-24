extends CharacterBody3D
class_name BossSheshaEcho3D

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	IDLE,
	COIL_SLITHER,
	TAIL_SWEEP_TELEGRAPH,
	TAIL_SWEEP_EXECUTE,
	TRIPLE_VENOM_BARRAGE,
	CEILING_QUAKE_SLAM,
	AWAKENED_FURY_ROAR,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 450
@export var current_health: int = 450
@export var max_poise: float = 180.0
@export var sweep_damage: int = 34
@export var quake_damage: int = 48
@export var spit_damage: int = 24
@export var perception_radius: float = 35.0

var current_state: State = State.IDLE
var current_phase: int = 1
var is_enraged: bool = false
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var attack_cooldown: float = 0.0
var arena_center: Vector3 = Vector3.ZERO

@onready var visual_mesh: Node3D = $VisualMesh
@onready var sweep_hitbox: Area3D = $SweepHitbox
@onready var quake_hitbox: Area3D = $QuakeHitbox
@onready var nagamani_light: OmniLight3D = $NagamaniLight

signal boss_health_changed(current: int, max_hp: int)
signal boss_phase_changed(phase: int)
signal boss_defeated()
signal quake_triggered(epicenter: Vector3)

func _init() -> void:
	add_to_group("bosses")
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(180.0, 3.5)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layers 1 (Env) & 2 (Player)

func _ready() -> void:
	arena_center = global_position
	current_health = max_health
	if sweep_hitbox:
		sweep_hitbox.monitoring = false
		sweep_hitbox.body_entered.connect(_on_sweep_hit_body)
	if quake_hitbox:
		quake_hitbox.monitoring = false
		quake_hitbox.body_entered.connect(_on_quake_hit_body)

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
		State.COIL_SLITHER:
			_process_coil_slither(delta)
		State.TAIL_SWEEP_TELEGRAPH:
			_process_tail_telegraph(delta)
		State.TAIL_SWEEP_EXECUTE:
			_process_tail_execute(delta)
		State.TRIPLE_VENOM_BARRAGE:
			_process_venom_barrage(delta)
		State.CEILING_QUAKE_SLAM:
			_process_quake_slam(delta)
		State.AWAKENED_FURY_ROAR:
			_process_enrage_roar(delta)
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
			current_state = State.COIL_SLITHER
			state_timer = 0.0

func _process_coil_slither(delta: float) -> void:
	state_timer += delta
	if not target_player or not is_instance_valid(target_player):
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	_safe_look_at(player_pos)

	var dist = my_pos.distance_to(player_pos)
	var speed = 5.0 if not is_enraged else 7.2
	var dir = (player_pos - my_pos).normalized() if dist > 0.001 else Vector3.FORWARD

	if dist > 8.0:
		velocity = dir * speed
	else:
		velocity = velocity.move_toward(Vector3.ZERO, 10.0 * delta)

	if attack_cooldown <= 0.0 and state_timer >= 1.5:
		state_timer = 0.0
		velocity = Vector3.ZERO
		if dist <= 8.5:
			current_state = State.TAIL_SWEEP_TELEGRAPH
		elif is_enraged and randf() > 0.45:
			current_state = State.CEILING_QUAKE_SLAM
		else:
			current_state = State.TRIPLE_VENOM_BARRAGE

func _process_tail_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if nagamani_light:
		nagamani_light.light_energy = 3.0 + sin(state_timer * 18.0) * 2.0

	var telegraph_duration = 0.7 if not is_enraged else 0.45
	if state_timer >= telegraph_duration:
		current_state = State.TAIL_SWEEP_EXECUTE
		state_timer = 0.0
		if sweep_hitbox:
			sweep_hitbox.monitoring = true

func _process_tail_execute(delta: float) -> void:
	state_timer += delta
	# Rotate rapidly around Y to simulate massive 360-degree tail sweep
	rotation.y += delta * 12.0

	if state_timer >= 0.5:
		if sweep_hitbox:
			sweep_hitbox.monitoring = false
		attack_cooldown = 2.0 if not is_enraged else 1.2
		current_state = State.COIL_SLITHER
		state_timer = 0.0

func _process_venom_barrage(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO

	# Fire barrage of venom spit
	if state_timer >= 0.3 and state_timer - delta < 0.3:
		_fire_venom_orb(0.0)
	elif state_timer >= 0.6 and state_timer - delta < 0.6:
		_fire_venom_orb(-0.35)
	elif state_timer >= 0.9 and state_timer - delta < 0.9:
		_fire_venom_orb(0.35)

	if state_timer >= 1.2:
		attack_cooldown = 2.4 if not is_enraged else 1.5
		current_state = State.COIL_SLITHER
		state_timer = 0.0

func _fire_venom_orb(_angle_offset: float) -> void:
	if not target_player or not is_instance_valid(target_player):
		return
	var dist = global_position.distance_to(target_player.global_position)
	if dist <= 30.0:
		var dmg = spit_damage if not is_enraged else int(spit_damage * 1.25)
		var attack_spec = CombatMath.AttackSpec.new("boss_shesha_echo", dmg, 25.0, global_position)
		if target_player.has_method("take_damage_spec"):
			target_player.take_damage_spec(attack_spec)
		elif target_player.has_method("take_damage"):
			target_player.take_damage(dmg)

func _process_quake_slam(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO

	if state_timer <= 0.6:
		# Coiling up
		if nagamani_light:
			nagamani_light.light_energy = 5.0
	elif state_timer >= 0.6 and state_timer - delta < 0.6:
		# Ground impact
		if quake_hitbox:
			quake_hitbox.monitoring = true
		quake_triggered.emit(global_position)
	elif state_timer >= 0.95:
		if quake_hitbox:
			quake_hitbox.monitoring = false
		attack_cooldown = 2.8
		current_state = State.COIL_SLITHER
		state_timer = 0.0

func _process_enrage_roar(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO
	if nagamani_light:
		nagamani_light.light_color = Color(0.9, 0.1, 0.4, 1.0)
		nagamani_light.light_energy = 6.0

	if state_timer >= 2.0:
		current_state = State.COIL_SLITHER
		state_timer = 0.0

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 15.0 * delta)
	if state_timer >= 2.2:
		current_state = State.COIL_SLITHER
		state_timer = 0.0

func _on_sweep_hit_body(body: Node3D) -> void:
	if body == self or not is_instance_valid(body):
		return
	if body.is_in_group("player"):
		var dmg = sweep_damage if not is_enraged else int(sweep_damage * 1.3)
		var attack_spec = CombatMath.AttackSpec.new("shesha_sweep", dmg, 45.0, global_position)
		if body.has_method("take_damage_spec"):
			body.take_damage_spec(attack_spec)
		elif body.has_method("take_damage"):
			body.take_damage(dmg)

func _on_quake_hit_body(body: Node3D) -> void:
	if body == self or not is_instance_valid(body):
		return
	if body.is_in_group("player"):
		var dmg = quake_damage if not is_enraged else int(quake_damage * 1.25)
		var attack_spec = CombatMath.AttackSpec.new("shesha_quake", dmg, 60.0, global_position)
		if body.has_method("take_damage_spec"):
			body.take_damage_spec(attack_spec)
		elif body.has_method("take_damage"):
			body.take_damage(dmg)

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if current_state == State.DEFEATED:
		return CombatMath.CombatHitResult.new()

	var my_pos = global_position if is_inside_tree() else position
	var my_facing = -global_transform.basis.z if is_inside_tree() else Vector3.FORWARD
	var def_spec = CombatMath.DefenseSpec.new("boss_shesha_echo", my_pos, my_facing)
	var res = CombatMath.resolve_attack(attack_spec, def_spec)

	var prev_hp = current_health
	current_health = max(0, current_health - res.damage_dealt)
	boss_health_changed.emit(current_health, max_health)

	# Check Enrage Threshold (50% HP = 225)
	if current_health <= 225 and not is_enraged and current_health > 0:
		is_enraged = true
		current_phase = 2
		boss_phase_changed.emit(2)
		current_state = State.AWAKENED_FURY_ROAR
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

	if current_health <= 225 and not is_enraged and current_health > 0:
		is_enraged = true
		current_phase = 2
		boss_phase_changed.emit(2)
		current_state = State.AWAKENED_FURY_ROAR
		state_timer = 0.0
		return

	if current_health <= 0:
		_die()

func _die() -> void:
	current_state = State.DEFEATED
	current_health = 0
	velocity = Vector3.ZERO
	if sweep_hitbox:
		sweep_hitbox.monitoring = false
	if quake_hitbox:
		quake_hitbox.monitoring = false
	boss_defeated.emit()
	if is_inside_tree():
		var tween = create_tween()
		tween.tween_property(self, "scale", Vector3.ZERO, 1.2)
		tween.tween_callback(queue_free)
