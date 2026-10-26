extends CharacterBody3D
class_name SolarGryphon3D

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	AERIAL_HOVER,
	SUNFLARE_SCREECH_TELEGRAPH,
	DIVE_POUNCE,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 95
@export var current_health: int = 95
@export var pounce_damage: int = 24
@export var perception_radius: float = 26.0

var current_state: State = State.AERIAL_HOVER
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var strafe_angle: float = 0.0
var anim_player: AnimationPlayer = null

@onready var visual_mesh: Node3D = $VisualMesh
@onready var sunflare_light: OmniLight3D = $SunflareLight

signal gryphon_defeated(gryphon: CharacterBody3D)
signal sunflare_screech(origin: Vector3, direction: Vector3)

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

func _init() -> void:
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(60.0, 2.0)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layer 1: Env, Layer 2: Player

func _ready() -> void:
	current_health = max_health
	anim_player = _find_anim_player(self)
	_play_anim("idle")
	if sunflare_light:
		sunflare_light.visible = false

func _physics_process(delta: float) -> void:
	if current_state == State.DEFEATED:
		return

	if not target_player:
		var players = get_tree().get_nodes_in_group("player") if is_inside_tree() else []
		if players.size() > 0:
			target_player = players[0] as Node3D

	if poise:
		poise.update(delta)

	match current_state:
		State.AERIAL_HOVER:
			_process_hover(delta)
		State.SUNFLARE_SCREECH_TELEGRAPH:
			_process_telegraph(delta)
		State.DIVE_POUNCE:
			_process_dive_pounce(delta)
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

func _process_hover(delta: float) -> void:
	state_timer += delta
	if not target_player or not is_instance_valid(target_player):
		velocity = velocity.move_toward(Vector3.ZERO, 10.0 * delta)
		_play_anim("idle")
		return

	var my_pos = _get_entity_pos(self)
	var player_pos = _get_entity_pos(target_player)
	var dist = my_pos.distance_to(player_pos)

	if dist > perception_radius:
		velocity = velocity.move_toward(Vector3.ZERO, 8.0 * delta)
		_play_anim("idle")
		return

	_safe_look_at(player_pos)
	strafe_angle += delta * 2.0
	var to_player = (player_pos - my_pos).normalized() if dist > 0.001 else Vector3.FORWARD
	var perp = Vector3(-to_player.z, 0, to_player.x)
	var move_vec = perp * sin(strafe_angle) + to_player * 0.4

	var separation = Vector3.ZERO
	if is_inside_tree():
		for enemy in get_tree().get_nodes_in_group("enemies"):
			if enemy != self and is_instance_valid(enemy):
				var diff = global_position - enemy.global_position
				var d = diff.length()
				if d > 0.001 and d < 3.0:
					separation += (diff / d) * (3.0 - d) * 1.5

	velocity = move_vec.normalized() * 5.0 + separation
	_play_anim("fly_locomotion")

	if state_timer >= 2.0:
		current_state = State.SUNFLARE_SCREECH_TELEGRAPH
		state_timer = 0.0
		velocity = Vector3.ZERO
		_play_anim("telegraph_screech")
		if sunflare_light:
			sunflare_light.visible = true

func _process_telegraph(delta: float) -> void:
	state_timer += delta
	_play_anim("telegraph_screech")
	if target_player and is_instance_valid(target_player):
		_safe_look_at(_get_entity_pos(target_player))

	if sunflare_light:
		sunflare_light.light_energy = 2.0 + sin(state_timer * 20.0) * 2.0

	if state_timer >= 0.7:
		current_state = State.DIVE_POUNCE
		state_timer = 0.0
		_play_anim("dive_strike", 0.05)
		var my_pos = _get_entity_pos(self)
		var player_pos = _get_entity_pos(target_player) if target_player else my_pos + Vector3.FORWARD
		var dir = (player_pos - my_pos).normalized() if my_pos.distance_to(player_pos) > 0.001 else Vector3.FORWARD
		velocity = dir * 15.0
		sunflare_screech.emit(my_pos, dir)

func _process_dive_pounce(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 16.0 * delta)

	if state_timer >= 0.2 and state_timer - delta < 0.2:
		if target_player and is_instance_valid(target_player):
			var dist = _get_entity_pos(self).distance_to(_get_entity_pos(target_player))
			if dist <= 4.0:
				var attack_spec = CombatMath.AttackSpec.new("solar_gryphon", pounce_damage, 30.0, _get_entity_pos(self))
				if target_player.has_method("take_damage_spec"):
					var res = target_player.take_damage_spec(attack_spec)
					if res and res.is_parried:
						current_state = State.STAGGERED
						state_timer = 0.0
						_play_anim("stagger")
						if sunflare_light:
							sunflare_light.visible = false
						if poise:
							poise.take_poise_damage(35.0)
				elif target_player.has_method("take_damage"):
					target_player.take_damage(pounce_damage)

	if state_timer >= 0.6:
		if sunflare_light:
			sunflare_light.visible = false
		current_state = State.AERIAL_HOVER
		state_timer = 0.0

func _process_stagger(delta: float) -> void:
	state_timer += delta
	velocity = velocity.move_toward(Vector3.ZERO, 15.0 * delta)
	_play_anim("stagger")
	if state_timer >= 1.3:
		current_state = State.AERIAL_HOVER
		state_timer = 0.0

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	if current_state == State.DEFEATED:
		return CombatMath.CombatHitResult.new()

	var my_pos = _get_entity_pos(self)
	var facing = -global_transform.basis.z if is_inside_tree() else Vector3.FORWARD
	var def_spec = CombatMath.DefenseSpec.new("solar_gryphon", my_pos, facing)
	var res = CombatMath.resolve_attack(attack_spec, def_spec)

	current_health = max(0, current_health - res.damage_dealt)

	var poise_broken = false
	if poise and poise.has_method("take_poise_damage"):
		poise_broken = poise.take_poise_damage(attack_spec.poise_damage)

	if current_health <= 0:
		_die()
	elif poise_broken or res.is_critical:
		current_state = State.STAGGERED
		state_timer = 0.0
		_play_anim("stagger")
		if sunflare_light:
			sunflare_light.visible = false

	return res

func take_damage(amount: int) -> void:
	if current_state == State.DEFEATED:
		return
	current_health = max(0, current_health - amount)
	if current_health <= 0:
		_die()
	else:
		current_state = State.STAGGERED
		state_timer = 0.0
		_play_anim("stagger")
		if sunflare_light:
			sunflare_light.visible = false

func _die() -> void:
	current_state = State.DEFEATED
	velocity = Vector3.ZERO
	_play_anim("death", 0.1)
	if sunflare_light:
		sunflare_light.visible = false
	gryphon_defeated.emit(self)
	if is_inside_tree():
		var tween = create_tween()
		tween.tween_interval(0.6)
		tween.tween_property(self, "scale", Vector3.ZERO, 0.4)
		tween.tween_callback(queue_free)
