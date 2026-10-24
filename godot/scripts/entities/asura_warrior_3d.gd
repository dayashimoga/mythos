class_name AsuraWarrior3D
extends CharacterBody3D

## 3D Asura Demonic Warrior with Perception, Navigation, Telegraphs, and Combat Interactions.
## Part of the "targetable" group for OrbitCamera3D and "enemies" group for level tracking.

signal health_changed(current: int, max_hp: int)
signal warrior_defeated(warrior: AsuraWarrior3D)
signal staggered()

enum State {
	IDLE,
	CHASE,
	TELEGRAPH,
	ATTACK,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 80
@export var max_poise: float = 50.0
@export var move_speed: float = 4.2
@export var perception_radius: float = 16.0
@export var attack_range: float = 2.4
@export var attack_cooldown_duration: float = 2.8

var current_health: int = 80
var poise: CombatMath.PoiseData = null
var current_state: State = State.IDLE
var attack_cooldown: float = 1.0
var state_timer: float = 0.0
var gravity: float = 22.0

@onready var visual: Node3D = $Visual
@onready var eye_light: OmniLight3D = $Visual/EyeLight if has_node("Visual/EyeLight") else null
@onready var status_label: Label3D = $StatusLabel if has_node("StatusLabel") else null
@onready var strike_area: Area3D = $StrikeArea if has_node("StrikeArea") else null
@onready var collision_shape: CollisionShape3D = $CollisionShape3D if has_node("CollisionShape3D") else null

var _target_player: CharacterBody3D = null

func _init() -> void:
	add_to_group("targetable")
	add_to_group("enemies")
	current_health = max_health
	poise = CombatMath.PoiseData.new(max_poise, 2.2)

func _ready() -> void:
	current_health = max_health
	if not poise:
		poise = CombatMath.PoiseData.new(max_poise, 2.2)

	if strike_area:
		strike_area.body_entered.connect(_on_strike_body_entered)
		strike_area.monitoring = false

	_update_status_display()

func _physics_process(delta: float) -> void:
	if current_state == State.DEFEATED:
		return

	# Apply gravity
	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = 0.0

	# Find player if not tracked
	if not _target_player or not is_instance_valid(_target_player):
		_find_player()

	# Cooldown ticking
	if attack_cooldown > 0.0:
		attack_cooldown -= delta

	match current_state:
		State.IDLE:
			_process_idle(delta)
		State.CHASE:
			_process_chase(delta)
		State.TELEGRAPH:
			_process_telegraph(delta)
		State.ATTACK:
			_process_attack(delta)
		State.STAGGERED:
			_process_staggered(delta)

	move_and_slide()

func _find_player() -> void:
	var players = get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		_target_player = players[0] as CharacterBody3D

func _process_idle(delta: float) -> void:
	velocity.x = move_toward(velocity.x, 0.0, 10.0 * delta)
	velocity.z = move_toward(velocity.z, 0.0, 10.0 * delta)

	# Idle breathing
	if visual:
		visual.position.y = sin(Time.get_ticks_msec() * 0.003) * 0.04

	if _target_player and is_instance_valid(_target_player):
		var dist = global_position.distance_to(_target_player.global_position)
		if dist <= perception_radius:
			current_state = State.CHASE
			_update_status_display()

func _process_chase(delta: float) -> void:
	if not _target_player or not is_instance_valid(_target_player):
		current_state = State.IDLE
		return

	var to_player = _target_player.global_position - global_position
	to_player.y = 0.0
	var dist = to_player.length()

	if dist > perception_radius * 1.5:
		current_state = State.IDLE
		_update_status_display()
		return

	# Rotate toward player
	if to_player.length_squared() > 0.01 and visual:
		var target_rot = atan2(to_player.x, to_player.z)
		visual.rotation.y = lerp_angle(visual.rotation.y, target_rot, delta * 6.0)

	if dist <= attack_range and attack_cooldown <= 0.0:
		_start_telegraph()
	else:
		# Pursue
		var dir = to_player.normalized()
		velocity.x = dir.x * move_speed
		velocity.z = dir.z * move_speed

func _start_telegraph() -> void:
	current_state = State.TELEGRAPH
	state_timer = 0.75 # Telegraph window
	velocity.x = 0.0
	velocity.z = 0.0

	if eye_light:
		eye_light.light_color = Color(1.0, 0.1, 0.1)
		eye_light.light_energy = 3.0

	if status_label:
		status_label.text = "✦ ASURA SCYTHE STRIKE ✦\n[ Guard or Parry Now! ]"
		status_label.modulate = Color(1.0, 0.8, 0.1)

func _process_telegraph(delta: float) -> void:
	state_timer -= delta
	if visual:
		# Lean back in anticipation
		visual.rotation.x = sin(state_timer * 15.0) * 0.1

	if state_timer <= 0.0:
		_execute_attack()

func _execute_attack() -> void:
	current_state = State.ATTACK
	state_timer = 0.35
	attack_cooldown = attack_cooldown_duration

	# Forward lunge
	if visual:
		var fwd = -visual.global_transform.basis.z
		velocity.x = fwd.x * 6.0
		velocity.z = fwd.z * 6.0

	if strike_area:
		strike_area.monitoring = true

	if status_label:
		status_label.text = "⚔ SLASHING! ⚔"
		status_label.modulate = Color(1.0, 0.2, 0.2)

func _process_attack(delta: float) -> void:
	state_timer -= delta
	velocity.x = move_toward(velocity.x, 0.0, 15.0 * delta)
	velocity.z = move_toward(velocity.z, 0.0, 15.0 * delta)

	if state_timer <= 0.0:
		if strike_area:
			strike_area.monitoring = false
		if visual:
			visual.rotation.x = 0.0
		current_state = State.CHASE
		_update_status_display()

func _process_staggered(delta: float) -> void:
	velocity.x = move_toward(velocity.x, 0.0, 12.0 * delta)
	velocity.z = move_toward(velocity.z, 0.0, 12.0 * delta)

	if poise and poise.is_staggered:
		poise.stagger_timer -= delta
		if status_label:
			status_label.text = "POISE BROKEN! (+35% CRIT)\n[ %.1fs ]" % poise.stagger_timer
			status_label.modulate = Color(1.0, 0.4, 0.1)
		if poise.stagger_timer <= 0.0:
			poise.is_staggered = false
			poise.current = poise.max_poise
			current_state = State.CHASE
			_update_status_display()
	else:
		current_state = State.CHASE
		_update_status_display()

func _on_strike_body_entered(body: Node3D) -> void:
	if body is PlayerController3D and body.has_method("take_damage_spec"):
		var atk = CombatMath.AttackSpec.new("asura_warrior", 18, 22.0, global_position)
		body.take_damage_spec(atk)

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if current_state == State.DEFEATED:
		return CombatMath.CombatHitResult.new()

	var def_pos = global_position if is_inside_tree() else position
	var def_facing = -transform.basis.z
	if visual and visual.is_inside_tree():
		def_facing = -visual.global_transform.basis.z
	elif is_inside_tree():
		def_facing = -global_transform.basis.z

	var def_spec = CombatMath.DefenseSpec.new("asura_warrior", def_pos, def_facing)
	def_spec.poise = poise

	var result = CombatMath.resolve_attack(attack_spec, def_spec)
	current_health = max(0, current_health - result.damage_dealt)
	health_changed.emit(current_health, max_health)

	# Flinch bounce (only if inside scene tree)
	if visual and is_inside_tree():
		var push = (global_position - attack_spec.origin).normalized() * 0.25
		push.y = 0.0
		visual.position += push
		var tween = create_tween()
		if tween:
			tween.tween_property(visual, "position", Vector3.ZERO, 0.2)

	# Check for Poise Break
	if result.triggered_stagger:
		current_state = State.STAGGERED
		if strike_area:
			strike_area.monitoring = false
		staggered.emit()

	_update_status_display()

	if current_health <= 0:
		_die()

	return result

func _die() -> void:
	current_state = State.DEFEATED
	if strike_area:
		strike_area.monitoring = false
	if collision_shape:
		collision_shape.disabled = true
	remove_from_group("targetable")

	if status_label:
		status_label.text = "✦ DISPELLED ✦"
		status_label.modulate = Color(0.8, 0.8, 0.8, 0.7)

	warrior_defeated.emit(self)

	# Death dissolve tween
	if is_inside_tree():
		var tween = create_tween()
		if tween:
			if visual:
				tween.tween_property(visual, "scale", Vector3(0.05, 0.05, 0.05), 0.6)
				tween.parallel().tween_property(visual, "rotation:y", visual.rotation.y + 4.0, 0.6)
			tween.tween_callback(func(): queue_free())
	else:
		queue_free()

func _update_status_display() -> void:
	if not status_label:
		return
	if current_state == State.STAGGERED or current_state == State.TELEGRAPH or current_state == State.ATTACK:
		return
	status_label.text = "ASURA WARRIOR\nHP: %d / %d  |  Poise: %d" % [current_health, max_health, int(poise.current if poise else 0)]
	status_label.modulate = Color(1.0, 0.3, 0.2)
