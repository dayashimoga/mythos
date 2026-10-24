class_name BossKalanemi3D
extends CharacterBody3D

const AudioManager3D = preload("res://scripts/audio/audio_manager_3d.gd")

## Monumental 3D Boss Controller: Kalanemi, Corrupted Asura General
## Multi-phase encounter featuring:
## Phase 1 (100% - 50% HP): Heavy Void Cleaves, Leap Ground Slam with expanding shockwaves
## Phase 2 (< 50% HP): Enraged Tamas Flare (+35% speed, charging rush, rapid combos)
## Full telegraphs, poise break vulnerability (+35% crit punish), and victory triggers.

signal boss_health_changed(current: int, max_hp: int)
signal boss_poise_changed(current: float, max_poise: float)
signal boss_phase_changed(phase: int)
signal boss_defeated()
signal ground_slam_impact(origin: Vector3)

enum BossPhase {
	PHASE_1_NORMAL = 1,
	PHASE_2_ENRAGED = 2
}

enum State {
	DORMANT,
	CHASE,
	TELEGRAPH_CLEAVE,
	ATTACK_CLEAVE,
	LEAP_GROUND_SLAM,
	CHARGE_RUSH,
	ENRAGE_ROAR,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 350
@export var max_poise: float = 140.0
@export var base_move_speed: float = 3.6
@export var enraged_move_speed: float = 5.8
@export var attack_range: float = 3.5

var current_health: int = 350
var poise: CombatMath.PoiseData = null
var current_phase: BossPhase = BossPhase.PHASE_1_NORMAL
var current_state: State = State.DORMANT
var attack_cooldown: float = 2.0
var state_timer: float = 0.0
var gravity: float = 24.0
var is_active: bool = false

var charge_direction: Vector3 = Vector3.FORWARD
var target_jump_pos: Vector3 = Vector3.ZERO

@onready var visual: Node3D = $Visual
@onready var eye_light: OmniLight3D = $Visual/EyeLight if has_node("Visual/EyeLight") else null
@onready var core_light: OmniLight3D = $Visual/CoreLight if has_node("Visual/CoreLight") else null
@onready var status_label: Label3D = $StatusLabel if has_node("StatusLabel") else null
@onready var cleave_area: Area3D = $CleaveArea if has_node("CleaveArea") else null
@onready var ground_slam_indicator: MeshInstance3D = $GroundSlamIndicator if has_node("GroundSlamIndicator") else null
@onready var collision_shape: CollisionShape3D = $CollisionShape3D if has_node("CollisionShape3D") else null

var _target_player: CharacterBody3D = null

func _init() -> void:
	add_to_group("boss")
	add_to_group("enemies")
	add_to_group("targetable")
	current_health = max_health
	poise = CombatMath.PoiseData.new(max_poise, 3.0)

func _ready() -> void:
	current_health = max_health
	if not poise:
		poise = CombatMath.PoiseData.new(max_poise, 3.0)

	if cleave_area:
		cleave_area.body_entered.connect(_on_cleave_body_entered)
		cleave_area.monitoring = false

	if ground_slam_indicator:
		ground_slam_indicator.visible = false

	_update_status_display()

func activate_boss() -> void:
	if is_active:
		return
	is_active = true
	current_state = State.CHASE
	boss_health_changed.emit(current_health, max_health)
	if status_label:
		status_label.text = "⚔ GENERAL KALANEMI AWAKENS ⚔"
		status_label.modulate = Color(1.0, 0.2, 0.2)

func _physics_process(delta: float) -> void:
	if current_state == State.DEFEATED:
		return

	# Apply gravity unless mid-leap
	if current_state != State.LEAP_GROUND_SLAM:
		if not is_on_floor():
			velocity.y -= gravity * delta
		else:
			velocity.y = 0.0

	if not _target_player or not is_instance_valid(_target_player):
		_find_player()

	if not is_active:
		if _target_player and is_instance_valid(_target_player):
			var d = global_position.distance_to(_target_player.global_position)
			if d <= 24.0:
				activate_boss()
		return

	if attack_cooldown > 0.0:
		attack_cooldown -= delta

	match current_state:
		State.CHASE:
			_process_chase(delta)
		State.TELEGRAPH_CLEAVE:
			_process_telegraph_cleave(delta)
		State.ATTACK_CLEAVE:
			_process_attack_cleave(delta)
		State.LEAP_GROUND_SLAM:
			_process_leap_ground_slam(delta)
		State.CHARGE_RUSH:
			_process_charge_rush(delta)
		State.ENRAGE_ROAR:
			_process_enrage_roar(delta)
		State.STAGGERED:
			_process_staggered(delta)

	move_and_slide()

func _find_player() -> void:
	var players = get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		_target_player = players[0] as CharacterBody3D

func _process_chase(delta: float) -> void:
	if not _target_player or not is_instance_valid(_target_player):
		return

	var to_player = _target_player.global_position - global_position
	to_player.y = 0.0
	var dist = to_player.length()

	# Face player
	if to_player.length_squared() > 0.01 and visual:
		var target_rot = atan2(to_player.x, to_player.z)
		visual.rotation.y = lerp_angle(visual.rotation.y, target_rot, delta * 5.0)

	# Decide action based on distance & cooldown
	if attack_cooldown <= 0.0:
		if dist <= attack_range:
			_start_telegraph_cleave()
		elif dist > 8.0 and randf() < 0.6:
			# Leap Ground Slam
			_start_leap_ground_slam()
		elif current_phase == BossPhase.PHASE_2_ENRAGED and dist > 6.0:
			# Charge Rush
			_start_charge_rush()
		else:
			# Close in
			var dir = to_player.normalized()
			var spd = enraged_move_speed if current_phase == BossPhase.PHASE_2_ENRAGED else base_move_speed
			velocity.x = dir.x * spd
			velocity.z = dir.z * spd
	else:
		# Pursue
		var dir = to_player.normalized()
		var spd = enraged_move_speed if current_phase == BossPhase.PHASE_2_ENRAGED else base_move_speed
		velocity.x = dir.x * spd
		velocity.z = dir.z * spd

func _start_telegraph_cleave() -> void:
	current_state = State.TELEGRAPH_CLEAVE
	state_timer = 0.85 if current_phase == BossPhase.PHASE_1_NORMAL else 0.55
	velocity.x = 0.0
	velocity.z = 0.0

	if eye_light:
		eye_light.light_energy = 4.0
		eye_light.light_color = Color(1.0, 0.1, 0.2)

	if status_label:
		status_label.text = "✦ VOID GREAT-CLEAVE ✦\n[ Parry (F) or Roll (Dash) ]"
		status_label.modulate = Color(1.0, 0.85, 0.1)

func _process_telegraph_cleave(delta: float) -> void:
	state_timer -= delta
	if visual:
		visual.rotation.x = sin(state_timer * 18.0) * 0.15

	if state_timer <= 0.0:
		_execute_cleave()

func _execute_cleave() -> void:
	current_state = State.ATTACK_CLEAVE
	state_timer = 0.40
	attack_cooldown = 1.8 if current_phase == BossPhase.PHASE_2_ENRAGED else 2.6

	# Forward heavy lunge
	if visual:
		var fwd = -visual.global_transform.basis.z
		velocity.x = fwd.x * 7.5
		velocity.z = fwd.z * 7.5

	if cleave_area:
		cleave_area.monitoring = true

	if status_label:
		status_label.text = "⚔ CLEAVING! ⚔"
		status_label.modulate = Color(1.0, 0.2, 0.1)

func _process_attack_cleave(delta: float) -> void:
	state_timer -= delta
	velocity.x = move_toward(velocity.x, 0.0, 16.0 * delta)
	velocity.z = move_toward(velocity.z, 0.0, 16.0 * delta)

	if state_timer <= 0.0:
		if cleave_area:
			cleave_area.monitoring = false
		if visual:
			visual.rotation.x = 0.0
		current_state = State.CHASE
		_update_status_display()

func _start_leap_ground_slam() -> void:
	if not _target_player:
		return
	current_state = State.LEAP_GROUND_SLAM
	state_timer = 1.4 # Jump ascent + slam descent
	target_jump_pos = _target_player.global_position
	velocity = (target_jump_pos - global_position) * 0.8
	velocity.y = 12.0 # High vertical launch

	if ground_slam_indicator:
		ground_slam_indicator.global_position = Vector3(target_jump_pos.x, target_jump_pos.y + 0.1, target_jump_pos.z)
		ground_slam_indicator.visible = true
		ground_slam_indicator.scale = Vector3(0.2, 1.0, 0.2)
		var tween = create_tween()
		tween.tween_property(ground_slam_indicator, "scale", Vector3(4.5, 1.0, 4.5), 1.1)

	if status_label:
		status_label.text = "⚠ SEISMIC GROUND SLAM! ⚠\n[ JUMP TO AVOID SHOCKWAVE ]"
		status_label.modulate = Color(1.0, 0.1, 0.1)

func _process_leap_ground_slam(delta: float) -> void:
	state_timer -= delta
	velocity.y -= gravity * 1.5 * delta

	# Check landing impact
	if state_timer <= 0.35 and is_on_floor():
		_execute_ground_slam_impact()

func _execute_ground_slam_impact() -> void:
	velocity = Vector3.ZERO
	ground_slam_impact.emit(global_position)
	AudioManager3D.play_3d("boss_roar", global_position, 0.8)
	AudioManager3D.play_3d("hit_impact", global_position, 0.7)

	if ground_slam_indicator:
		ground_slam_indicator.visible = false

	# Area damage check
	if _target_player and is_instance_valid(_target_player):
		var d = global_position.distance_to(_target_player.global_position)
		if d <= 5.5 and _target_player.is_on_floor():
			var atk = CombatMath.AttackSpec.new("boss_ground_slam", 38, 50.0, global_position)
			_target_player.take_damage_spec(atk)

	# Shockwave screen shake / status
	if status_label:
		status_label.text = "💥 SEISMIC IMPACT! 💥"
		status_label.modulate = Color(1.0, 0.3, 0.0)

	attack_cooldown = 2.4
	current_state = State.CHASE

func _start_charge_rush() -> void:
	if not _target_player:
		return
	current_state = State.CHARGE_RUSH
	state_timer = 1.1
	charge_direction = (_target_player.global_position - global_position).normalized()
	charge_direction.y = 0.0

	if status_label:
		status_label.text = "⚡ VOID CHARGE RUSH! ⚡\n[ Dash Aside! ]"
		status_label.modulate = Color(1.0, 0.2, 0.8)

func _process_charge_rush(delta: float) -> void:
	state_timer -= delta
	velocity.x = charge_direction.x * 14.0
	velocity.z = charge_direction.z * 14.0

	# Collision check with player
	if _target_player and is_instance_valid(_target_player):
		var d = global_position.distance_to(_target_player.global_position)
		if d <= 2.8:
			var atk = CombatMath.AttackSpec.new("boss_charge", 30, 60.0, global_position)
			_target_player.take_damage_spec(atk)
			state_timer = 0.0

	if state_timer <= 0.0:
		velocity = Vector3.ZERO
		attack_cooldown = 2.0
		current_state = State.CHASE
		_update_status_display()

func _trigger_enrage() -> void:
	current_phase = BossPhase.PHASE_2_ENRAGED
	current_state = State.ENRAGE_ROAR
	state_timer = 2.0
	velocity = Vector3.ZERO
	boss_phase_changed.emit(2)
	AudioManager3D.play_3d("boss_roar", global_position, 0.75)

	# Blazing crimson Tamas aura
	if core_light:
		core_light.light_color = Color(1.0, 0.1, 0.0)
		core_light.light_energy = 6.0
	if eye_light:
		eye_light.light_energy = 5.0

	if status_label:
		status_label.text = "🔥 ENRAGED TAMAS FLARE! 🔥\n[ General Kalanemi Unleashes Void Rage ]"
		status_label.modulate = Color(1.0, 0.0, 0.0)

func _process_enrage_roar(delta: float) -> void:
	state_timer -= delta
	if visual:
		visual.rotation.y += delta * 6.0 # Roar spin flare

	if state_timer <= 0.0:
		if visual:
			visual.rotation.y = 0.0
		attack_cooldown = 0.5
		current_state = State.CHASE
		_update_status_display()

func _process_staggered(delta: float) -> void:
	velocity.x = move_toward(velocity.x, 0.0, 14.0 * delta)
	velocity.z = move_toward(velocity.z, 0.0, 14.0 * delta)

	if poise and poise.is_staggered:
		poise.stagger_timer -= delta
		if status_label:
			status_label.text = "BOSS STAGGERED! (+35% CRITICAL)\n[ %.1fs ]" % poise.stagger_timer
			status_label.modulate = Color(1.0, 0.6, 0.1)
		if poise.stagger_timer <= 0.0:
			poise.is_staggered = false
			poise.current = poise.max_poise
			current_state = State.CHASE
			_update_status_display()
	else:
		current_state = State.CHASE
		_update_status_display()

func _on_cleave_body_entered(body: Node3D) -> void:
	if body is PlayerController3D and body.has_method("take_damage_spec"):
		var dmg = 32 if current_phase == BossPhase.PHASE_1_NORMAL else 42
		var atk = CombatMath.AttackSpec.new("boss_kalanemi_cleave", dmg, 38.0, global_position)
		body.take_damage_spec(atk)

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if current_state == State.DEFEATED or current_state == State.ENRAGE_ROAR:
		return CombatMath.CombatHitResult.new()

	var def_pos = global_position if is_inside_tree() else position
	var def_facing = -transform.basis.z
	if visual and visual.is_inside_tree():
		def_facing = -visual.global_transform.basis.z
	elif is_inside_tree():
		def_facing = -global_transform.basis.z

	var def_spec = CombatMath.DefenseSpec.new("boss_kalanemi", def_pos, def_facing)
	def_spec.poise = poise

	var result = CombatMath.resolve_attack(attack_spec, def_spec)
	current_health = max(0, current_health - result.damage_dealt)
	boss_health_changed.emit(current_health, max_health)
	AudioManager3D.play_3d("hit_impact", global_position, 0.8)

	# Flinch bounce
	if visual and is_inside_tree() and current_state != State.LEAP_GROUND_SLAM and current_state != State.CHARGE_RUSH:
		var push = (global_position - attack_spec.origin).normalized() * 0.15
		push.y = 0.0
		visual.position += push
		var tween = create_tween()
		if tween:
			tween.tween_property(visual, "position", Vector3.ZERO, 0.25)

	# Check for Phase 2 Enrage transition at 50% HP
	if current_phase == BossPhase.PHASE_1_NORMAL and current_health <= int(max_health * 0.5):
		_trigger_enrage()
		return result

	# Check for Poise Break
	if result.triggered_stagger and current_state != State.ENRAGE_ROAR:
		current_state = State.STAGGERED
		if cleave_area:
			cleave_area.monitoring = false

	_update_status_display()

	if current_health <= 0:
		_die()

	return result

func _die() -> void:
	current_state = State.DEFEATED
	if cleave_area:
		cleave_area.monitoring = false
	if collision_shape:
		collision_shape.disabled = true
	remove_from_group("targetable")

	if status_label:
		status_label.text = "☀️ GENERAL KALANEMI PURIFIED ☀️\n[ High Astra Core Released ]"
		status_label.modulate = Color(1.0, 0.9, 0.3)

	boss_defeated.emit()

	# Victory dissolution sequence
	if is_inside_tree():
		var tween = create_tween()
		if tween:
			if visual:
				tween.tween_property(visual, "scale", Vector3(0.02, 0.02, 0.02), 1.5)
				tween.parallel().tween_property(visual, "rotation:y", visual.rotation.y + 8.0, 1.5)
			if core_light:
				tween.parallel().tween_property(core_light, "light_energy", 10.0, 0.8)
				tween.tween_property(core_light, "light_energy", 0.0, 0.7)
			tween.tween_callback(func(): queue_free())
	else:
		queue_free()

func _update_status_display() -> void:
	if not status_label:
		return
	if current_state in [State.STAGGERED, State.TELEGRAPH_CLEAVE, State.ATTACK_CLEAVE, State.LEAP_GROUND_SLAM, State.CHARGE_RUSH, State.ENRAGE_ROAR]:
		return
	var phase_str = "PHASE 2 (ENRAGED)" if current_phase == BossPhase.PHASE_2_ENRAGED else "PHASE 1"
	status_label.text = "KALANEMI — ASURA GENERAL [%s]\nHP: %d / %d  |  Poise: %d" % [phase_str, current_health, max_health, int(poise.current if poise else 0)]
	status_label.modulate = Color(1.0, 0.25, 0.15)
