extends CharacterBody3D
class_name BossBrahmaAvatara3D

## Monumental 3D Boss Encounter — Brahma Avatara, Creator-Dissolution Titan
## Supreme Sovereign of Satyaloka / Brahmaloka — Chapter VII Final Climax Boss.
## Wields Quad Brahmic Rays from his four crowned faces and unleashes
## Phase 2 Mahapralaya Cosmic Dissolution upon reaching <= 50% HP.

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	IDLE,
	APPROACH,
	QUAD_RAY_TELEGRAPH,
	QUAD_RAY_EXECUTE,
	DHARMA_WHEEL_SLAM,
	MAHAPRALAYA_ENRAGE_ROAR,
	COSMIC_DISSOLUTION,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 650
@export var current_health: int = 650
@export var max_poise: float = 300.0
@export var quad_ray_damage: int = 42
@export var wheel_slam_damage: int = 48
@export var dissolution_damage: int = 64
@export var perception_radius: float = 46.0

var current_state: State = State.IDLE
var current_phase: int = 1
var is_enraged: bool = false
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var attack_cooldown: float = 0.0
var arena_center: Vector3 = Vector3.ZERO

@onready var visual_mesh: Node3D = $VisualMesh
@onready var ray_hitbox: Area3D = $RayHitbox
@onready var slam_hitbox: Area3D = $SlamHitbox
@onready var brahma_halo_light: OmniLight3D = $BrahmaHaloLight

signal boss_health_changed(current: int, max_hp: int)
signal boss_phase_changed(phase: int)
signal boss_defeated()
signal quad_ray_fired(target: Node3D, damage: int)
signal dissolution_triggered(epicenter: Vector3)

func _init() -> void:
	add_to_group("bosses")
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(300.0, 4.0)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layer 1: Env, Layer 2: Player

func _ready() -> void:
	arena_center = global_position if is_inside_tree() else position
	current_health = max_health
	if ray_hitbox:
		ray_hitbox.monitoring = false
		ray_hitbox.body_entered.connect(_on_ray_hit_body)
	if slam_hitbox:
		slam_hitbox.monitoring = false
		slam_hitbox.body_entered.connect(_on_slam_hit_body)

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
		attack_cooldown -= delta

	match current_state:
		State.IDLE:
			_process_idle(delta)
		State.APPROACH:
			_process_approach(delta)
		State.QUAD_RAY_TELEGRAPH:
			_process_ray_telegraph(delta)
		State.QUAD_RAY_EXECUTE:
			_process_ray_execute(delta)
		State.DHARMA_WHEEL_SLAM:
			_process_wheel_slam(delta)
		State.MAHAPRALAYA_ENRAGE_ROAR:
			_process_enrage_roar(delta)
		State.COSMIC_DISSOLUTION:
			_process_dissolution(delta)
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
			current_state = State.APPROACH
			state_timer = 0.0

func _process_approach(delta: float) -> void:
	state_timer += delta
	if not target_player or not is_instance_valid(target_player):
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	_safe_look_at(player_pos)

	var dist = my_pos.distance_to(player_pos)
	var speed = 4.5 if not is_enraged else 6.8
	var dir = (player_pos - my_pos).normalized() if dist > 0.001 else Vector3.FORWARD

	if dist > 8.0:
		velocity = dir * speed
	else:
		velocity = velocity.move_toward(Vector3.ZERO, 10.0 * delta)

	if attack_cooldown <= 0.0 and state_timer >= 1.2:
		state_timer = 0.0
		velocity = Vector3.ZERO
		if dist <= 7.0:
			current_state = State.DHARMA_WHEEL_SLAM
		elif is_enraged and randf() > 0.4:
			current_state = State.COSMIC_DISSOLUTION
		else:
			current_state = State.QUAD_RAY_TELEGRAPH

func _process_ray_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if brahma_halo_light:
		brahma_halo_light.light_color = Color(1.0, 0.85, 0.2, 1.0)
		brahma_halo_light.light_energy = 4.0 + sin(state_timer * 18.0) * 2.0

	var duration = 0.7 if not is_enraged else 0.45
	if state_timer >= duration:
		current_state = State.QUAD_RAY_EXECUTE
		state_timer = 0.0
		if ray_hitbox:
			ray_hitbox.monitoring = true

func _process_ray_execute(delta: float) -> void:
	state_timer += delta
	if state_timer >= 0.4:
		if ray_hitbox:
			ray_hitbox.monitoring = false
		attack_cooldown = 1.8 if not is_enraged else 1.0
		current_state = State.APPROACH
		state_timer = 0.0
		if brahma_halo_light:
			brahma_halo_light.light_color = Color(1.0, 0.9, 0.6, 1.0) if not is_enraged else Color(0.9, 0.4, 1.0, 1.0)
			brahma_halo_light.light_energy = 3.5 if not is_enraged else 5.5

func _process_wheel_slam(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO

	if state_timer <= 0.5:
		if target_player and is_instance_valid(target_player):
			_safe_look_at(_get_entity_pos(target_player))
	elif state_timer > 0.5 and state_timer - delta <= 0.5:
		if slam_hitbox:
			slam_hitbox.monitoring = true
		if brahma_halo_light:
			brahma_halo_light.light_energy = 8.0

	if state_timer >= 0.85:
		if slam_hitbox:
			slam_hitbox.monitoring = false
		attack_cooldown = 2.0 if not is_enraged else 1.2
		current_state = State.APPROACH
		state_timer = 0.0
		if brahma_halo_light:
			brahma_halo_light.light_energy = 3.5 if not is_enraged else 5.5

func _process_enrage_roar(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO

	if brahma_halo_light:
		brahma_halo_light.light_color = Color(0.9, 0.35, 1.0, 1.0)
		brahma_halo_light.light_energy = 6.0 + sin(state_timer * 25.0) * 3.0

	if state_timer >= 2.0:
		current_state = State.COSMIC_DISSOLUTION
		state_timer = 0.0

func _process_dissolution(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO

	if state_timer >= 0.5 and state_timer - delta < 0.5:
		_trigger_dissolution_vortex()

	if state_timer >= 1.6:
		attack_cooldown = 2.5
		current_state = State.APPROACH
		state_timer = 0.0

func _trigger_dissolution_vortex() -> void:
	var my_pos = _get_entity_pos(self)
	dissolution_triggered.emit(my_pos)

	if target_player and is_instance_valid(target_player):
		var player_pos = _get_entity_pos(target_player)
		var dist = my_pos.distance_to(player_pos)
		if dist <= 14.0:
			if target_player.has_method("take_damage"):
				target_player.take_damage(dissolution_damage)

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 10.0 * delta)
	if ray_hitbox:
		ray_hitbox.monitoring = false
	if slam_hitbox:
		slam_hitbox.monitoring = false

	if state_timer >= 2.2:
		current_state = State.APPROACH
		state_timer = 0.0

func _trigger_phase_2() -> void:
	current_phase = 2
	is_enraged = true
	current_state = State.MAHAPRALAYA_ENRAGE_ROAR
	state_timer = 0.0
	velocity = Vector3.ZERO
	if ray_hitbox:
		ray_hitbox.monitoring = false
	if slam_hitbox:
		slam_hitbox.monitoring = false

	if brahma_halo_light:
		brahma_halo_light.light_color = Color(0.9, 0.3, 1.0, 1.0)
		brahma_halo_light.light_energy = 7.0

	boss_phase_changed.emit(2)

func _on_ray_hit_body(body: Node3D) -> void:
	if body == self:
		return
	if body.is_in_group("player"):
		if body.has_method("take_damage"):
			body.take_damage(quad_ray_damage)
		quad_ray_fired.emit(body, quad_ray_damage)

func _on_slam_hit_body(body: Node3D) -> void:
	if body == self:
		return
	if body.is_in_group("player"):
		if body.has_method("take_damage"):
			body.take_damage(wheel_slam_damage)

func take_damage(amount: int, poise_dmg: float = 0.0) -> void:
	if current_state == State.DEFEATED:
		return

	current_health = maxi(0, current_health - amount)
	boss_health_changed.emit(current_health, max_health)

	# Phase 2 Enrage Check at 50% HP (<= 325 HP)
	if current_phase == 1 and current_health <= max_health / 2:
		_trigger_phase_2()
		return

	if poise and poise_dmg > 0.0:
		if poise.damage(poise_dmg):
			current_state = State.STAGGERED
			state_timer = 0.0
			velocity = Vector3.ZERO
			if ray_hitbox:
				ray_hitbox.monitoring = false
			if slam_hitbox:
				slam_hitbox.monitoring = false

	if current_health <= 0:
		_die()

func _die() -> void:
	current_state = State.DEFEATED
	velocity = Vector3.ZERO
	if ray_hitbox:
		ray_hitbox.monitoring = false
	if slam_hitbox:
		slam_hitbox.monitoring = false
	boss_defeated.emit()
	if is_inside_tree():
		var tween = create_tween()
		if tween:
			tween.tween_property(self, "scale", Vector3.ZERO, 0.8)
			tween.tween_callback(queue_free)
		else:
			queue_free()
	else:
		queue_free()
