extends CharacterBody3D
class_name BossMatarishvan3D

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	IDLE,
	HOVER_COMBAT,
	GALE_SWEEP_TELEGRAPH,
	GALE_SWEEP_ATTACK,
	TEMPEST_VORTEX,
	DIVE_SLAM_TELEGRAPH,
	DIVE_SLAM_IMPACT,
	ENRAGE_ROAR,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 350
@export var current_health: int = 350
@export var max_poise: float = 160.0
@export var sweep_damage: int = 30
@export var dive_damage: int = 45
@export var perception_radius: float = 30.0

var current_state: State = State.IDLE
var current_phase: int = 1
var is_enraged: bool = false
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var attack_cooldown: float = 0.0
var dive_target_pos: Vector3 = Vector3.ZERO
var arena_center: Vector3 = Vector3.ZERO
var hover_base_y: float = 3.5

@onready var visual_mesh: Node3D = $VisualMesh
@onready var sweep_hitbox: Area3D = $SweepHitbox
@onready var slam_hitbox: Area3D = $SlamHitbox
@onready var tempest_core_light: OmniLight3D = $TempestCoreLight
@onready var telegraph_ring: Decal = $TelegraphRing

var anim_player: AnimationPlayer = null

signal boss_health_changed(current: int, max_hp: int)
signal boss_phase_changed(phase: int)
signal boss_defeated()

func _find_anim_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node
	for child in node.get_children():
		var found = _find_anim_player(child)
		if found:
			return found
	return null

func _play_anim(anim_name: String, blend_time: float = 0.15) -> void:
	if not anim_player:
		anim_player = _find_anim_player(self)
	if anim_player and anim_player.has_animation(anim_name):
		if anim_player.current_animation != anim_name:
			anim_player.play(anim_name, blend_time)

func _apply_camera_trauma(amount: float) -> void:
	if not is_inside_tree():
		return
	var cameras = get_tree().get_nodes_in_group("camera_3d")
	for cam in cameras:
		if cam.has_method("add_trauma"):
			cam.add_trauma(amount)
			return
	if target_player and target_player.has_node("OrbitCamera3D"):
		var cam = target_player.get_node("OrbitCamera3D")
		if cam.has_method("add_trauma"):
			cam.add_trauma(amount)

func _init() -> void:
	add_to_group("bosses")
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(160.0, 3.5)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layers 1 (Env) & 2 (Player)

func _ready() -> void:
	arena_center = global_position
	current_health = max_health
	anim_player = _find_anim_player(self)
	_play_anim("boss_idle")
	if sweep_hitbox:
		sweep_hitbox.monitoring = false
		sweep_hitbox.body_entered.connect(_on_sweep_hit_body)
	if slam_hitbox:
		slam_hitbox.monitoring = false
		slam_hitbox.body_entered.connect(_on_slam_hit_body)
	if telegraph_ring:
		telegraph_ring.visible = false

func _physics_process(delta: float) -> void:
	if current_state == State.DEFEATED:
		return

	if not target_player:
		var players = get_tree().get_nodes_in_group("player") if is_inside_tree() else []
		if players.size() > 0:
			target_player = players[0] as Node3D

	if poise:
		poise.update(delta)

	if attack_cooldown > 0:
		attack_cooldown -= delta

	match current_state:
		State.IDLE:
			_process_idle(delta)
		State.HOVER_COMBAT:
			_process_hover_combat(delta)
		State.GALE_SWEEP_TELEGRAPH:
			_process_sweep_telegraph(delta)
		State.GALE_SWEEP_ATTACK:
			_process_sweep_attack(delta)
		State.TEMPEST_VORTEX:
			_process_vortex(delta)
		State.DIVE_SLAM_TELEGRAPH:
			_process_dive_telegraph(delta)
		State.DIVE_SLAM_IMPACT:
			_process_dive_impact(delta)
		State.ENRAGE_ROAR:
			_process_enrage_roar(delta)
		State.STAGGERED:
			_process_staggered(delta)

func _process_idle(_delta: float) -> void:
	_play_anim("boss_idle")
	if target_player and global_position.distance_to(target_player.global_position) <= perception_radius:
		current_state = State.HOVER_COMBAT
		state_timer = 0.0

func _process_hover_combat(delta: float) -> void:
	if not target_player:
		_play_anim("boss_idle")
		return

	var dist = global_position.distance_to(target_player.global_position)
	look_at(Vector3(target_player.global_position.x, global_position.y, target_player.global_position.z), Vector3.UP)

	# Hovering altitude physics
	var target_y = arena_center.y + hover_base_y
	velocity.y = (target_y - global_position.y) * 3.0

	var speed = 7.0 if current_phase == 1 else 9.5
	if dist > 6.0:
		var dir = (target_player.global_position - global_position).normalized()
		velocity.x = dir.x * speed
		velocity.z = dir.z * speed
		_play_anim("boss_walk")
	else:
		velocity.x = lerp(velocity.x, 0.0, 4.0 * delta)
		velocity.z = lerp(velocity.z, 0.0, 4.0 * delta)
		_play_anim("boss_idle")

	move_and_slide()

	if attack_cooldown <= 0.0:
		if dist <= 5.5:
			_start_sweep_attack()
		elif dist <= 18.0 and current_phase == 2:
			_start_dive_slam()
		else:
			_start_tempest_vortex()

func _start_sweep_attack() -> void:
	current_state = State.GALE_SWEEP_TELEGRAPH
	state_timer = 0.0
	velocity = Vector3.ZERO
	_play_anim("boss_cleave_telegraph")
	if tempest_core_light:
		tempest_core_light.light_energy = 5.0
		tempest_core_light.light_color = Color(1.0, 0.3, 0.1)

func _process_sweep_telegraph(delta: float) -> void:
	state_timer += delta
	if state_timer >= (0.6 if current_phase == 2 else 0.85):
		current_state = State.GALE_SWEEP_ATTACK
		state_timer = 0.0
		_play_anim("boss_cleave_attack")
		if sweep_hitbox:
			sweep_hitbox.monitoring = true

func _process_sweep_attack(delta: float) -> void:
	state_timer += delta
	# Lunge forward with scythe blades
	var lunge_speed = 14.0 if current_phase == 2 else 10.0
	velocity = -transform.basis.z * lunge_speed
	move_and_slide()

	if state_timer >= 0.4:
		if sweep_hitbox:
			sweep_hitbox.monitoring = false
		if tempest_core_light:
			tempest_core_light.light_energy = 2.5
			tempest_core_light.light_color = Color(0.2, 0.95, 1.0)
		attack_cooldown = 1.6 if current_phase == 2 else 2.5
		current_state = State.HOVER_COMBAT
		state_timer = 0.0

func _start_tempest_vortex() -> void:
	current_state = State.TEMPEST_VORTEX
	state_timer = 0.0
	velocity = Vector3.ZERO
	_play_anim("boss_vortex_channel")

func _process_vortex(delta: float) -> void:
	state_timer += delta
	# Pull target player toward boss with vortex wind force
	if target_player and target_player.has_method("apply_vortex_pull"):
		var pull_dir = (global_position - target_player.global_position).normalized()
		target_player.apply_vortex_pull(pull_dir * (6.5 * delta))

	if state_timer >= 2.0:
		attack_cooldown = 2.0
		current_state = State.HOVER_COMBAT
		state_timer = 0.0

func _start_dive_slam() -> void:
	current_state = State.DIVE_SLAM_TELEGRAPH
	state_timer = 0.0
	dive_target_pos = target_player.global_position if target_player else arena_center
	_play_anim("boss_slam_leap")
	if telegraph_ring:
		telegraph_ring.global_position = Vector3(dive_target_pos.x, arena_center.y + 0.1, dive_target_pos.z)
		telegraph_ring.visible = true

func _process_dive_telegraph(delta: float) -> void:
	state_timer += delta
	# Rise high into the storm sky
	velocity = Vector3(0, 16.0, 0)
	move_and_slide()

	if state_timer >= 1.0:
		current_state = State.DIVE_SLAM_IMPACT
		state_timer = 0.0
		global_position = Vector3(dive_target_pos.x, global_position.y, dive_target_pos.z)
		_play_anim("boss_slam_impact")
		if slam_hitbox:
			slam_hitbox.monitoring = true

func _process_dive_impact(delta: float) -> void:
	state_timer += delta
	# High velocity vertical slam
	velocity = Vector3(0, -32.0, 0)
	move_and_slide()

	if is_on_floor() or global_position.y <= arena_center.y + 0.5 or state_timer >= 0.8:
		_apply_camera_trauma(0.65)
		if telegraph_ring:
			telegraph_ring.visible = false
		if slam_hitbox:
			slam_hitbox.monitoring = false
		attack_cooldown = 2.2
		current_state = State.HOVER_COMBAT
		state_timer = 0.0

func _process_enrage_roar(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO
	if state_timer >= 1.5:
		current_state = State.HOVER_COMBAT
		state_timer = 0.0

func _process_staggered(delta: float) -> void:
	state_timer += delta
	velocity.y -= 9.8 * delta
	move_and_slide()

	if state_timer >= 3.5:
		current_state = State.HOVER_COMBAT
		state_timer = 0.0
		if poise:
			poise.current = poise.max_poise

func take_damage(amount: int, poise_dmg: float = 25.0) -> void:
	if current_state == State.DEFEATED or current_state == State.ENRAGE_ROAR:
		return

	var final_dmg = amount
	if current_state == State.STAGGERED:
		final_dmg = int(amount * 1.35)

	current_health = max(0, current_health - final_dmg)
	boss_health_changed.emit(current_health, max_health)

	# Phase 2 Transition Check at 50% HP
	if current_phase == 1 and current_health <= int(max_health * 0.5):
		_trigger_phase_two()
		return

	if poise:
		var broken = poise.take_poise_damage(poise_dmg)
		if broken and current_state != State.STAGGERED:
			current_state = State.STAGGERED
			state_timer = 0.0
			_play_anim("boss_stagger")
			if sweep_hitbox:
				sweep_hitbox.monitoring = false
			if slam_hitbox:
				slam_hitbox.monitoring = false

	if is_inside_tree() and visual_mesh:
		var tween = create_tween()
		tween.tween_property(visual_mesh, "scale", Vector3(1.1, 0.9, 1.1), 0.08)
		tween.tween_property(visual_mesh, "scale", Vector3.ONE, 0.12)

	if current_health <= 0:
		_die()

func _trigger_phase_two() -> void:
	current_phase = 2
	is_enraged = true
	current_state = State.ENRAGE_ROAR
	state_timer = 0.0
	_play_anim("boss_roar")
	_apply_camera_trauma(0.50)
	boss_phase_changed.emit(2)

	if tempest_core_light:
		tempest_core_light.light_color = Color(1.0, 0.85, 0.1)
		tempest_core_light.light_energy = 8.0

	if is_inside_tree() and visual_mesh:
		var tween = create_tween()
		tween.tween_property(visual_mesh, "scale", Vector3(1.15, 1.15, 1.15), 1.0)

func _on_sweep_hit_body(body: Node3D) -> void:
	if body.is_in_group("player") and body.has_method("take_damage"):
		body.take_damage(sweep_damage, 35.0)

func _on_slam_hit_body(body: Node3D) -> void:
	if body.is_in_group("player") and body.has_method("take_damage"):
		body.take_damage(dive_damage, 60.0)

func _die() -> void:
	current_state = State.DEFEATED
	_play_anim("boss_defeat")
	if sweep_hitbox:
		sweep_hitbox.monitoring = false
	if slam_hitbox:
		slam_hitbox.monitoring = false
	if telegraph_ring:
		telegraph_ring.visible = false
	boss_defeated.emit()

	if is_inside_tree() and visual_mesh:
		var tween = create_tween()
		tween.tween_property(visual_mesh, "scale", Vector3(0.01, 0.01, 0.01), 1.2)
		tween.tween_callback(queue_free)
	elif is_inside_tree():
		queue_free()
