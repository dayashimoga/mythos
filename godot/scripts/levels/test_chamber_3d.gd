class_name TestChamber3D
extends Node3D

## Scene Controller for genuine 3D Test Chamber (Sanctum of Astra).
## Manages 3D lighting, physics environment, quest progression, and player signals.

@onready var player: PlayerController3D = $Player
@onready var shrine: SunShrine3D = $Environment/SunShrine
@onready var hud: HUD3D = $HUD3D
@onready var sun_light: DirectionalLight3D = $DirectionalLight3D
@onready var world_env: WorldEnvironment = $WorldEnvironment

var quest_mgr: QuestManager = QuestManager.new()
var dialogue_runner: DialogueRunner = DialogueRunner.new()

func _ready() -> void:
	# 1. Initialize Quest
	quest_mgr.start_mission("sanctum_calibration")
	if hud:
		hud.update_objective("Recover 3 Astra Shards & Kindle the Sun Altar")
		hud.update_shards(0, 3)
		hud.update_health(player.max_health, player.max_health)

	# 2. Wire Player Signals
	if player:
		player.health_changed.connect(_on_player_health_changed)
		player.shards_changed.connect(_on_player_shards_changed)
		player.interacted_with.connect(_on_player_interacted)

	# 3. Wire Shrine Consecration
	if shrine:
		shrine.consecrated.connect(_on_shrine_consecrated)

	# 4. Wire Shards
	for child in $Environment/Shards.get_children():
		if child is AstraShard3D:
			child.collected.connect(_on_shard_collected)

	# 5. Display Welcome Banner
	if hud:
		hud.show_banner("✦ SANCTUM OF ASTRA — 3D TECHNICAL DEMONSTRATION ✦\nW/A/S/D: Move | Mouse Right-Click: Orbit | Shift: Dash | Space: Jump | K: Attack", 5.0)

func _on_player_health_changed(current: int, max_val: int) -> void:
	if hud:
		hud.update_health(current, max_val)

func _on_player_shards_changed(count: int) -> void:
	if hud:
		hud.update_shards(count, 3)
		if count >= 3:
			hud.update_objective("✦ All Shards Collected! Ascend the stairs and Kindle the Sun Altar!")
			hud.show_banner("All Astra Shards Collected! Kindle the Sun Altar!", 3.0)

	quest_mgr.update_objective_progress("sanctum_calibration", "collect_shards", 1)

func _on_shard_collected(shard_id: String) -> void:
	pass

func _on_player_interacted(target_name: String) -> void:
	pass

func _on_shrine_consecrated() -> void:
	quest_mgr.update_objective_progress("sanctum_calibration", "kindle_altar", 1)
	if hud:
		hud.update_objective("✦ SANCTUM CALIBRATED — THE PRIMAL FLAME IS RESTORED! ✦")
		hud.show_banner("✦ VICTORY! SANCTUM CALIBRATION COMPLETE ✦\nThe seal of Surya is rekindled across the realm.", 8.0)

	# Grand lighting flare
	if sun_light:
		var tween = create_tween()
		tween.tween_property(sun_light, "light_energy", 1.8, 1.5)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_F1:
			get_tree().change_scene_to_file("res://scenes/studio/CharacterStudio3D.tscn")
