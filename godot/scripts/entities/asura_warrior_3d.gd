class_name AsuraWarrior3D
extends CharacterBody3D

const AudioManager3D = preload("res://scripts/audio/audio_manager_3d.gd")

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
var anim_player: AnimationPlayer = null
var current_anim: String = ""
var strafe_direction: float = 1.0

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

	strafe_direction = 1.0 if randf() < 0.5 else -1.0
	anim_player = find_child("AnimationPlayer", true, false)
	_play_anim("idle")
	_update_status_display()

func _play_anim(anim_name: String, blend_time: float = 0.15) -> void:
	if not anim_player or current_anim == anim_name:
		return
	if anim_player.has_animation(anim_name):
		anim_player.play(anim_name, blend_time)
		current_anim = anim_name
	elif anim_player.has_animation(anim_name + "_AsuraWarriorRig"):
		anim_player.play(anim_name + "_AsuraWarriorRig", blend_time)
		current_anim = anim_name

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
	var players = get_tree().get_nodes_in_group("player") if is_inside_tree() else []
	if players.size() > 0:
		_target_player = players[0] as CharacterBody3D

func _process_idle(delta: float) -> void:
	velocity.x = move_toward(velocity.x, 0.0, 10.0 * delta)
	velocity.z = move_toward(velocity.z, 0.0, 10.0 * delta)
	_play_anim("idle")

	if _target_player and is_instance_valid(_target_player):
		var dist = global_position.distance_to(_target_player.global_position)
		if dist <= perception_radius:
			current_state = State.CHASE
			_update_status_display()

func _process_chase(delta: float) -> void:
	if not _target_player or not is_instance_valid(_target_player):
		current_state = State.IDLE
		_play_anim("idle")
		return

	var to_player = _target_player.global_position - global_position
	to_player.y = 0.0
	var dist = to_player.length()

	if dist > perception_radius * 1.5:
		current_state = State.IDLE
		_play_anim("idle")
		_update_status_display()
		return

	# Rotate toward player
	if to_player.length_squared() > 0.01 and visual:
		var target_rot = atan2(to_player.x, to_player.z)
		visual.rotation.y = lerp_angle(visual.rotation.y, target_rot, delta * 6.0)

	# Group spacing: Add gentle repulsion from nearby allies to prevent clumping
	var separation = Vector3.ZERO
	if is_inside_tree():
		var allies = get_tree().get_nodes_in_group("enemies")
		for ally in allies:
			if ally != self and is_instance_valid(ally):
				var to_self = global_position - ally.global_position
				to_self.y = 0.0
				var d_sq = to_self.length_squared()
				if d_sq > 0.01 and d_sq < 6.25: # within 2.5m
					separation += to_self.normalized() * (2.5 - sqrt(d_sq)) * 0.8

	if dist <= attack_range and attack_cooldown <= 0.0:
		_start_telegraph()
	elif attack_cooldown > 0.0 and dist <= 4.2:
		# Tactical lateral strafing/circling around player while on cooldown
		var dir = to_player.normalized()
		var tangent = Vector3(-dir.z, 0.0, dir.x) * strafe_direction
		var combined = (tangent + separation).normalized()
		velocity.x = combined.x * (move_speed * 0.75)
		velocity.z = combined.z * (move_speed * 0.75)
		_play_anim("walk")
	else:
		# Pursue (run if far, walk if closing in)
		var dir = to_player.normalized()
		var spd = move_speed * 1.35 if dist > 6.0 else move_speed
		var combined = (dir + separation).normalized()
		velocity.x = combined.x * spd
		velocity.z = combined.z * spd
		_play_anim("run" if dist > 6.0 else "walk")

func _start_telegraph() -> void:
	current_state = State.TELEGRAPH
	state_timer = 0.75 # Telegraph anticipation window
	velocity.x = 0.0
	velocity.z = 0.0
	_play_anim("telegraph", 0.1)

	if eye_light:
		eye_light.light_color = Color(1.0, 0.1, 0.1)
		eye_light.light_energy = 3.5
	AudioManager3D.play_3d("boss_roar", global_position, 1.3)

	if status_label:
		status_label.text = "✦ ASURA SCYTHE STRIKE ✦\n[ Guard or Parry Now! ]"
		status_label.modulate = Color(1.0, 0.8, 0.1)

func _process_telegraph(delta: float) -> void:
	state_timer -= delta
	if state_timer <= 0.0:
		_execute_attack()

func _execute_attack() -> void:
	current_state = State.ATTACK
	state_timer = 0.40
	attack_cooldown = attack_cooldown_duration
	_play_anim("attack", 0.08)

	# Forward explosive lunge
	if visual:
		var fwd = -visual.global_transform.basis.z
		velocity.x = fwd.x * 6.5
		velocity.z = fwd.z * 6.5

	if status_label:
		status_label.text = "⚔ SLASHING! ⚔"
		status_label.modulate = Color(1.0, 0.2, 0.2)

func _process_attack(delta: float) -> void:
	state_timer -= delta
	velocity.x = move_toward(velocity.x, 0.0, 15.0 * delta)
	velocity.z = move_toward(velocity.z, 0.0, 15.0 * delta)

	# Accurate active strike frame synchronization
	if strike_area:
		strike_area.monitoring = (state_timer <= 0.32 and state_timer >= 0.10)

	if state_timer <= 0.0:
		if strike_area:
			strike_area.monitoring = false
		current_state = State.CHASE
		_update_status_display()

func _process_staggered(delta: float) -> void:
	velocity.x = move_toward(velocity.x, 0.0, 12.0 * delta)
	velocity.z = move_toward(velocity.z, 0.0, 12.0 * delta)
	_play_anim("stagger", 0.1)

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
		var res = body.take_damage_spec(atk)
		if res and res.was_parried:
			_on_attack_parried()

func _on_attack_parried() -> void:
	if strike_area:
		strike_area.monitoring = false
	current_state = State.STAGGERED
	_play_anim("stagger", 0.05)
	AudioManager3D.play_3d("hit_impact", global_position, 1.3)
	if poise:
		poise.take_poise_damage(40.0)
	if status_label:
		status_label.text = "✦ ATTACK PARRIED! ✦\n[ +35% CRITICAL STAGGER ]"
		status_label.modulate = Color(0.2, 1.0, 0.4)
	staggered.emit()

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
	AudioManager3D.play_3d("hit_impact", global_position)

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
		_play_anim("stagger", 0.08)
		if strike_area:
			strike_area.monitoring = false
		staggered.emit()

	_update_status_display()

	if current_health <= 0:
		_die()

	return result

func _die() -> void:
	current_state = State.DEFEATED
	_play_anim("death", 0.1)
	if strike_area:
		strike_area.monitoring = false
	if collision_shape:
		collision_shape.disabled = true
	remove_from_group("targetable")

	if status_label:
		status_label.text = "✦ DISPELLED ✦"
		status_label.modulate = Color(0.8, 0.8, 0.8, 0.7)

	warrior_defeated.emit(self)

	# Death dissolve sequence
	if is_inside_tree():
		var tween = create_tween()
		if tween:
			tween.tween_interval(1.1) # Allow death animation to finish
			if visual:
				tween.tween_property(visual, "scale", Vector3(0.05, 0.05, 0.05), 0.5)
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
