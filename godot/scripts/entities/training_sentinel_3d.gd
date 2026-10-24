class_name TrainingSentinel3D
extends CharacterBody3D

## 3D Practice Automaton / Corrupted Sentinel entity for combat targeting, combo testing, and parry drills.
## Belongs to group "targetable" for OrbitCamera3D combat targeting.
## Integrates CombatMath for poise stagger and directional defense.

signal health_changed(current: int, max_hp: int)
signal poise_changed(current: float, max_poise: float)
signal staggered()
signal recovered()

@export var max_health: int = 150
@export var max_poise: float = 80.0
@export var practice_attack_interval: float = 5.0

var current_health: int = 150
var poise: CombatMath.PoiseData = CombatMath.PoiseData.new(80.0, 2.2)
var attack_cooldown: float = 3.0
var is_telegraphing: bool = false
var telegraph_timer: float = 0.0

@onready var visual_root: Node3D = $Visual
@onready var core_light: OmniLight3D = $Visual/CoreLight
@onready var ring_mesh: MeshInstance3D = $Visual/OrbitalRing
@onready var status_label: Label3D = $StatusLabel
@onready var practice_strike_area: Area3D = $PracticeStrikeArea

func _ready() -> void:
	add_to_group("targetable")
	current_health = max_health
	if not poise:
		poise = CombatMath.PoiseData.new(max_poise, 2.2)
	_update_status_display()

	if practice_strike_area:
		practice_strike_area.body_entered.connect(_on_strike_body_entered)
		practice_strike_area.monitoring = false

func _process(delta: float) -> void:
	# Rotate orbital ring
	if ring_mesh:
		ring_mesh.rotation.y += delta * 1.8
		ring_mesh.rotation.x += delta * 0.9

	# Handle Poise Stagger recovery
	if poise.is_staggered:
		poise.stagger_timer -= delta
		if status_label:
			status_label.text = "STAGGERED! (+35% CRIT)\n[ %.1fs ]" % poise.stagger_timer
			status_label.modulate = Color(1.0, 0.3, 0.2)
		if poise.stagger_timer <= 0.0:
			poise.is_staggered = false
			poise.current = poise.max_poise
			_update_status_display()
			recovered.emit()
		return

	# Slowly regenerate poise if not damaged recently
	if poise.current < poise.max_poise:
		poise.current = min(poise.max_poise, poise.current + 8.0 * delta)
		_update_status_display()

	# Practice Telegraph & Attack Loop
	if attack_cooldown > 0.0:
		attack_cooldown -= delta
	elif not is_telegraphing:
		_start_practice_telegraph()

	if is_telegraphing:
		telegraph_timer -= delta
		if core_light:
			core_light.light_energy = 2.0 + sin(telegraph_timer * 20.0) * 1.5
		if telegraph_timer <= 0.0:
			_execute_practice_strike()

func _start_practice_telegraph() -> void:
	is_telegraphing = true
	telegraph_timer = 1.2
	if status_label:
		status_label.text = "✦ INCOMING STRIKE! ✦\n[ Guard (Q) or Parry (F) ]"
		status_label.modulate = Color(1.0, 0.85, 0.1)

func _execute_practice_strike() -> void:
	is_telegraphing = false
	attack_cooldown = practice_attack_interval
	if core_light:
		core_light.light_energy = 1.2

	if practice_strike_area:
		practice_strike_area.monitoring = true
		var t = create_tween()
		t.tween_interval(0.2)
		t.tween_callback(func(): practice_strike_area.monitoring = false)

	_update_status_display()

func _on_strike_body_entered(body: Node3D) -> void:
	if body is PlayerController3D and body.has_method("take_damage_spec"):
		var atk = CombatMath.AttackSpec.new("sentinel", 20, 25.0, global_position)
		body.take_damage_spec(atk)

func take_damage_spec(attack_spec: CombatMath.AttackSpec) -> CombatMath.CombatHitResult:
	var def_spec = CombatMath.DefenseSpec.new("sentinel", global_position, -global_transform.basis.z)
	def_spec.poise = poise

	var result = CombatMath.resolve_attack(attack_spec, def_spec)
	current_health = max(0, current_health - result.damage_dealt)

	# Visual hit flash
	if core_light:
		core_light.light_color = Color(1.0, 0.2, 0.1)
		var t = create_tween()
		t.tween_property(core_light, "light_color", Color(0.2, 0.85, 1.0), 0.3)

	# Flinch bounce
	if visual_root:
		var push = (global_position - attack_spec.origin).normalized() * 0.15
		push.y = 0.0
		visual_root.position += push
		var t = create_tween()
		t.tween_property(visual_root, "position", Vector3.ZERO, 0.25).set_ease(Tween.EASE_OUT)

	if result.triggered_stagger:
		staggered.emit()

	if current_health <= 0:
		_on_defeated()
	else:
		_update_status_display()

	health_changed.emit(current_health, max_health)
	poise_changed.emit(poise.current, poise.max_poise)
	return result

func take_damage(amount: int) -> void:
	var atk = CombatMath.AttackSpec.new("player", amount, 25.0, global_position)
	take_damage_spec(atk)

func _update_status_display() -> void:
	if not status_label:
		return
	status_label.text = "ASURA TRAINING SENTINEL\nHP: %d/%d | POISE: %d%%" % [current_health, max_health, int((poise.current / poise.max_poise) * 100)]
	status_label.modulate = Color(0.3, 0.9, 1.0)

func _on_defeated() -> void:
	if status_label:
		status_label.text = "✦ SENTINEL PURIFIED! ✦\n[ Respawning in 3s... ]"
		status_label.modulate = Color(1.0, 0.8, 0.2)

	var t = create_tween()
	t.tween_interval(3.0)
	t.tween_callback(func():
		current_health = max_health
		poise.current = poise.max_poise
		poise.is_staggered = false
		_update_status_display()
	)
