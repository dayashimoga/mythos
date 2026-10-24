extends CharacterBody3D
class_name WindArcher3D

const CombatMath = preload("res://scripts/domain/combat_math.gd")

enum State {
	HOVER_STRAFE,
	TELEGRAPH_DRAW,
	FIRE_GALE_BURST,
	STAGGERED,
	DEFEATED
}

@export var max_health: int = 70
@export var current_health: int = 70
@export var arrow_damage: int = 20
@export var perception_radius: float = 22.0
@export var preferred_distance: float = 12.0

var current_state: State = State.HOVER_STRAFE
var poise: RefCounted = null
var target_player: Node3D = null
var state_timer: float = 0.0
var strafe_dir: float = 1.0

@onready var visual_mesh: Node3D = $VisualMesh
@onready var bow_light: OmniLight3D = $BowLight
@onready var arrow_spawn_point: Marker3D = $ArrowSpawnPoint

signal archer_defeated(archer: CharacterBody3D)

func _init() -> void:
	add_to_group("enemies")
	poise = CombatMath.PoiseData.new(40.0, 2.0)
	collision_layer = 4 # Layer 3: Enemies
	collision_mask = 3  # Layers 1 (Env) & 2 (Player)

func _ready() -> void:
	current_health = max_health
	if bow_light:
		bow_light.visible = false

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
		State.HOVER_STRAFE:
			_process_hover_strafe(delta)
		State.TELEGRAPH_DRAW:
			_process_telegraph(delta)
		State.FIRE_GALE_BURST:
			_process_fire(delta)
		State.STAGGERED:
			_process_staggered(delta)

func _process_hover_strafe(delta: float) -> void:
	state_timer += delta
	if not target_player:
		return

	var to_player = target_player.global_position - global_position
	var dist = to_player.length()

	look_at(Vector3(target_player.global_position.x, global_position.y, target_player.global_position.z), Vector3.UP)

	if dist <= perception_radius:
		# Strafe left/right while maintaining preferred distance
		var side_vec = transform.basis.x * strafe_dir
		var dist_diff = dist - preferred_distance
		var forward_vec = transform.basis.z * -clamp(dist_diff * 0.5, -1.0, 1.0)

		velocity = (side_vec * 3.5 + forward_vec * 4.0)
		move_and_slide()

		if state_timer >= 2.2:
			_start_draw()
	else:
		velocity = velocity.lerp(Vector3.ZERO, 4.0 * delta)
		move_and_slide()

func _start_draw() -> void:
	current_state = State.TELEGRAPH_DRAW
	state_timer = 0.0
	velocity = Vector3.ZERO
	if bow_light:
		bow_light.visible = true
		bow_light.light_energy = 3.5

func _process_telegraph(delta: float) -> void:
	state_timer += delta
	if target_player:
		look_at(Vector3(target_player.global_position.x, global_position.y, target_player.global_position.z), Vector3.UP)

	if state_timer >= 0.85:
		_fire_arrow()

func _fire_arrow() -> void:
	current_state = State.FIRE_GALE_BURST
	state_timer = 0.0
	if bow_light:
		bow_light.visible = false

	# Direct raycast damage to player if line of sight is clear
	if target_player and target_player.has_method("take_damage"):
		var dist = global_position.distance_to(target_player.global_position)
		if dist <= perception_radius + 4.0:
			target_player.take_damage(arrow_damage, 25.0)

	strafe_dir *= -1.0 # Reverse strafe direction for next volley

func _process_fire(delta: float) -> void:
	state_timer += delta
	if state_timer >= 0.4:
		current_state = State.HOVER_STRAFE
		state_timer = 0.0

func _process_staggered(delta: float) -> void:
	state_timer += delta
	velocity.y -= 9.8 * delta
	move_and_slide()

	if state_timer >= 2.2:
		current_state = State.HOVER_STRAFE
		state_timer = 0.0
		if poise:
			poise.current = poise.max_poise

func take_damage(amount: int, poise_dmg: float = 20.0) -> void:
	if current_state == State.DEFEATED:
		return

	var final_dmg = amount
	if current_state == State.STAGGERED:
		final_dmg = int(amount * 1.35)

	current_health = max(0, current_health - final_dmg)

	if poise:
		var broken = poise.take_poise_damage(poise_dmg)
		if broken and current_state != State.STAGGERED:
			current_state = State.STAGGERED
			state_timer = 0.0
			if bow_light:
				bow_light.visible = false

	if is_inside_tree() and visual_mesh:
		var tween = create_tween()
		tween.tween_property(visual_mesh, "scale", Vector3(1.15, 0.85, 1.15), 0.08)
		tween.tween_property(visual_mesh, "scale", Vector3.ONE, 0.12)

	if current_health <= 0:
		_die()

func _die() -> void:
	current_state = State.DEFEATED
	if bow_light:
		bow_light.visible = false
	archer_defeated.emit(self)

	if is_inside_tree() and visual_mesh:
		var tween = create_tween()
		tween.tween_property(visual_mesh, "scale", Vector3(0.01, 0.01, 0.01), 0.6)
		tween.tween_callback(queue_free)
	elif is_inside_tree():
		queue_free()
