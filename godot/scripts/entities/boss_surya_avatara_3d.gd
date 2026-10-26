extends CharacterBody3D
class_name BossSuryaAvatara3D

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	IDLE,
	SOLAR_APPROACH,
	GREATSWORD_CLEAVE_TELEGRAPH,
	GREATSWORD_CLEAVE_EXECUTE,
	SOLAR_BEAM_BARRAGE,
	SUPERNOVA_IGNITION_ROAR,
	SOLAR_PILLAR_QUAKE,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 500
@export var current_health: int = 500
@export var max_poise: float = 200.0
@export var cleave_damage: int = 38
@export var quake_damage: int = 52
@export var beam_damage: int = 26
@export var perception_radius: float = 38.0

var current_state: State = State.IDLE
var current_phase: int = 1
var is_enraged: bool = false
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var attack_cooldown: float = 0.0
var arena_center: Vector3 = Vector3.ZERO
var anim_player: AnimationPlayer = null

@onready var visual_mesh: Node3D = $VisualMesh
@onready var cleave_hitbox: Area3D = $CleaveHitbox
@onready var quake_hitbox: Area3D = $QuakeHitbox
@onready var solar_halo_light: OmniLight3D = $SolarHaloLight

signal boss_health_changed(current: int, max_hp: int)
signal boss_phase_changed(phase: int)
signal boss_defeated()
signal solar_burst_triggered(epicenter: Vector3)

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
	poise = CombatMath.PoiseData.new(200.0, 3.5)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layers 1 (Env) & 2 (Player)

func _ready() -> void:
	arena_center = global_position
	current_health = max_health
	anim_player = _find_anim_player(self)
	_play_anim("boss_idle")
	if cleave_hitbox:
		cleave_hitbox.monitoring = false
		cleave_hitbox.body_entered.connect(_on_cleave_hit_body)
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
		State.SOLAR_APPROACH:
			_process_approach(delta)
		State.GREATSWORD_CLEAVE_TELEGRAPH:
			_process_cleave_telegraph(delta)
		State.GREATSWORD_CLEAVE_EXECUTE:
			_process_cleave_execute(delta)
		State.SOLAR_BEAM_BARRAGE:
			_process_beam_barrage(delta)
		State.SUPERNOVA_IGNITION_ROAR:
			_process_enrage_roar(delta)
		State.SOLAR_PILLAR_QUAKE:
			_process_pillar_quake(delta)
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
	_play_anim("boss_idle")
	if target_player and is_instance_valid(target_player):
		var dist = _get_entity_pos(self).distance_to(_get_entity_pos(target_player))
		if dist <= perception_radius:
			current_state = State.SOLAR_APPROACH
			state_timer = 0.0

func _process_approach(delta: float) -> void:
	state_timer += delta
	_play_anim("boss_walk")
	if not target_player or not is_instance_valid(target_player):
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	_safe_look_at(player_pos)

	var dist = my_pos.distance_to(player_pos)
	var speed = 4.8 if not is_enraged else 7.0
	var dir = (player_pos - my_pos).normalized() if dist > 0.001 else Vector3.FORWARD

	if dist > 7.0:
		velocity = dir * speed
	else:
		velocity = velocity.move_toward(Vector3.ZERO, 10.0 * delta)

	if attack_cooldown <= 0.0 and state_timer >= 1.4:
		state_timer = 0.0
		velocity = Vector3.ZERO
		if dist <= 7.5:
			current_state = State.GREATSWORD_CLEAVE_TELEGRAPH
		elif is_enraged and randf() > 0.4:
			current_state = State.SOLAR_PILLAR_QUAKE
		else:
			current_state = State.SOLAR_BEAM_BARRAGE

func _process_cleave_telegraph(delta: float) -> void:
	state_timer += delta
	_play_anim("boss_cleave_telegraph")
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if solar_halo_light:
		solar_halo_light.light_energy = 3.5 + sin(state_timer * 18.0) * 2.0

	var telegraph_duration = 0.65 if not is_enraged else 0.4
	if state_timer >= telegraph_duration:
		current_state = State.GREATSWORD_CLEAVE_EXECUTE
		state_timer = 0.0
		_play_anim("boss_cleave_attack", 0.05)
		if cleave_hitbox:
			cleave_hitbox.monitoring = true

func _process_cleave_execute(delta: float) -> void:
	state_timer += delta
	# Horizontal sweep rotation
	rotation.y += delta * 10.0

	if state_timer >= 0.45:
		if cleave_hitbox:
			cleave_hitbox.monitoring = false
		attack_cooldown = 1.8 if not is_enraged else 1.0
		current_state = State.SOLAR_APPROACH
		state_timer = 0.0

func _process_beam_barrage(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO
	_play_anim("boss_solar_beam_channel")

	if state_timer >= 0.3 and state_timer - delta < 0.3:
		_fire_solar_beam(0.0)
	elif state_timer >= 0.6 and state_timer - delta < 0.6:
		_fire_solar_beam(-0.25)
	elif state_timer >= 0.9 and state_timer - delta < 0.9:
		_fire_solar_beam(0.25)

	if state_timer >= 1.2:
		attack_cooldown = 2.2 if not is_enraged else 1.3
		current_state = State.SOLAR_APPROACH
		state_timer = 0.0

func _fire_solar_beam(_offset_angle: float) -> void:
	if not target_player or not is_instance_valid(target_player):
		return
	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	var dist = my_pos.distance_to(player_pos)
	if dist <= 32.0:
		var dmg = beam_damage if not is_enraged else int(beam_damage * 1.25)
		var attack_spec = CombatMath.AttackSpec.new("surya_beam", dmg, 25.0, my_pos)
		if target_player.has_method("take_damage_spec"):
			target_player.take_damage_spec(attack_spec)
		elif target_player.has_method("take_damage"):
			target_player.take_damage(dmg)

func _process_pillar_quake(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO
	_play_anim("boss_supernova_impact")

	if state_timer <= 0.6:
		if solar_halo_light:
			solar_halo_light.light_energy = 6.0
	elif state_timer >= 0.6 and state_timer - delta < 0.6:
		if quake_hitbox:
			quake_hitbox.monitoring = true
		_apply_camera_trauma(0.65)
		solar_burst_triggered.emit(_get_entity_pos(self))
	elif state_timer >= 0.95:
		if quake_hitbox:
			quake_hitbox.monitoring = false
		attack_cooldown = 2.5
		current_state = State.SOLAR_APPROACH
		state_timer = 0.0

func _process_enrage_roar(delta: float) -> void:
	state_timer += delta
	velocity = Vector3.ZERO
	_play_anim("boss_enrage_flare")
	if state_timer < delta * 1.5:
		_apply_camera_trauma(0.50)

	if solar_halo_light:
		solar_halo_light.light_color = Color(1.0, 0.95, 0.7, 1.0)
		solar_halo_light.light_energy = 7.0

	if state_timer >= 2.0:
		current_state = State.SOLAR_APPROACH
		state_timer = 0.0

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 15.0 * delta)
	_play_anim("boss_cleave_telegraph")
	if state_timer >= 2.0:
		current_state = State.SOLAR_APPROACH
		state_timer = 0.0

func _on_cleave_hit_body(body: Node3D) -> void:
	if body == self or not is_instance_valid(body):
		return
	if body.is_in_group("player"):
		var dmg = cleave_damage if not is_enraged else int(cleave_damage * 1.25)
		var attack_spec = CombatMath.AttackSpec.new("surya_cleave", dmg, 45.0, _get_entity_pos(self))
		if body.has_method("take_damage_spec"):
			body.take_damage_spec(attack_spec)
		elif body.has_method("take_damage"):
			body.take_damage(dmg)

func _on_quake_hit_body(body: Node3D) -> void:
	if body == self or not is_instance_valid(body):
		return
	if body.is_in_group("player"):
		var dmg = quake_damage if not is_enraged else int(quake_damage * 1.3)
		var attack_spec = CombatMath.AttackSpec.new("surya_quake", dmg, 65.0, _get_entity_pos(self))
		if body.has_method("take_damage_spec"):
			body.take_damage_spec(attack_spec)
		elif body.has_method("take_damage"):
			body.take_damage(dmg)

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if current_state == State.DEFEATED:
		return CombatMath.CombatHitResult.new()

	var my_pos = _get_entity_pos(self)
	var facing = -global_transform.basis.z if is_inside_tree() else Vector3.FORWARD
	var def_spec = CombatMath.DefenseSpec.new("boss_surya_avatara", my_pos, facing)
	var res = CombatMath.resolve_attack(attack_spec, def_spec)

	current_health = max(0, current_health - res.damage_dealt)
	boss_health_changed.emit(current_health, max_health)

	# Check Enrage Threshold (50% HP = 250)
	if current_health <= 250 and not is_enraged and current_health > 0:
		is_enraged = true
		current_phase = 2
		boss_phase_changed.emit(2)
		current_state = State.SUPERNOVA_IGNITION_ROAR
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

	if current_health <= 250 and not is_enraged and current_health > 0:
		is_enraged = true
		current_phase = 2
		boss_phase_changed.emit(2)
		current_state = State.SUPERNOVA_IGNITION_ROAR
		state_timer = 0.0
		return

	if current_health <= 0:
		_die()

func _die() -> void:
	current_state = State.DEFEATED
	current_health = 0
	velocity = Vector3.ZERO
	_play_anim("boss_defeat", 0.1)
	if cleave_hitbox:
		cleave_hitbox.monitoring = false
	if quake_hitbox:
		quake_hitbox.monitoring = false
	boss_defeated.emit()
	if is_inside_tree():
		var tween = create_tween()
		tween.tween_interval(1.2)
		tween.tween_property(self, "scale", Vector3.ZERO, 1.2)
		tween.tween_callback(queue_free)
