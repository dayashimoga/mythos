class_name TutorialManager3D
extends RefCounted

## Interactive First-Time Player Onboarding & Gameplay Guidance Engine
## Guides novice players through movement, camera controls, combat, and interaction
## using short, contextual actions rather than long static text panels.

signal step_changed(step_id: int, step_title: String, instruction: String, keycap: String)
signal step_completed(step_id: int)
signal tutorial_finished()

enum TutorialStep {
	NONE = 0,
	CAMERA_LOOK = 1,
	MOVE = 2,
	SPRINT = 3,
	JUMP = 4,
	DASH = 5,
	GUARD = 6,
	ATTACK = 7,
	INTERACT = 8,
	COMPLETED = 9
}

enum InputDevice {
	KEYBOARD_MOUSE,
	GAMEPAD,
	TOUCH
}

var current_step: TutorialStep = TutorialStep.NONE
var is_active: bool = false
var current_device: InputDevice = InputDevice.KEYBOARD_MOUSE

# Tracking metrics for current step
var _initial_cam_yaw: float = 0.0
var _yaw_accumulated: float = 0.0
var _initial_player_pos: Vector3 = Vector3.ZERO
var _distance_moved: float = 0.0
var _sprint_timer: float = 0.0

const STEP_DATA = {
	TutorialStep.CAMERA_LOOK: {
		"title": "SURVEY THE REALM",
		"desc": "Rotate the camera to observe your surroundings.",
		"keys": {
			InputDevice.KEYBOARD_MOUSE: "Mouse Look / Right Click Drag",
			InputDevice.GAMEPAD: "Right Analog Stick [R-Stick]",
			InputDevice.TOUCH: "Swipe Right Half of Screen"
		}
	},
	TutorialStep.MOVE: {
		"title": "WALK FORWARD",
		"desc": "Move Veer through the ceremonial sanctum avenue.",
		"keys": {
			InputDevice.KEYBOARD_MOUSE: "Keys: [W] [A] [S] [D]",
			InputDevice.GAMEPAD: "Left Analog Stick [L-Stick]",
			InputDevice.TOUCH: "Virtual Joystick (Left Side)"
		}
	},
	TutorialStep.SPRINT: {
		"title": "HASTE & SPRINT",
		"desc": "Channel solar prana to run with great speed.",
		"keys": {
			InputDevice.KEYBOARD_MOUSE: "Hold [SHIFT] while moving",
			InputDevice.GAMEPAD: "Press Left Stick [L3] or Hold [RT]",
			InputDevice.TOUCH: "Double-Tap Move Joystick"
		}
	},
	TutorialStep.JUMP: {
		"title": "LEAP OF TAPAS",
		"desc": "Jump over stone obstacles and elevations.",
		"keys": {
			InputDevice.KEYBOARD_MOUSE: "Press [SPACE]",
			InputDevice.GAMEPAD: "Press [A / Cross Button]",
			InputDevice.TOUCH: "Tap [JUMP] Button"
		}
	},
	TutorialStep.DASH: {
		"title": "PRANA DASH",
		"desc": "Evade attacks with swift invulnerable dash.",
		"keys": {
			InputDevice.KEYBOARD_MOUSE: "Press [SHIFT] or [F]",
			InputDevice.GAMEPAD: "Press [B / Circle Button]",
			InputDevice.TOUCH: "Tap [DASH] Button"
		}
	},
	TutorialStep.GUARD: {
		"title": "SURYA DEFENSE",
		"desc": "Raise your sacred shield to absorb hostile strikes.",
		"keys": {
			InputDevice.KEYBOARD_MOUSE: "Hold [C] or [Q]",
			InputDevice.GAMEPAD: "Hold Left Bumper [LB / L1]",
			InputDevice.TOUCH: "Hold [GUARD] Button"
		}
	},
	TutorialStep.ATTACK: {
		"title": "SURYA COMBO SLASH",
		"desc": "Strike with curved sunsteel blade Surya-Kripana.",
		"keys": {
			InputDevice.KEYBOARD_MOUSE: "Left Click [LMB]",
			InputDevice.GAMEPAD: "Press [X / Square Button]",
			InputDevice.TOUCH: "Tap [ATTACK] Button"
		}
	},
	TutorialStep.INTERACT: {
		"title": "SEEK GUIDANCE",
		"desc": "Approach Celestial Oracle Devi Tara in Dandaka Grove.",
		"keys": {
			InputDevice.KEYBOARD_MOUSE: "Press [E] or [ENTER]",
			InputDevice.GAMEPAD: "Press [Y / Triangle Button]",
			InputDevice.TOUCH: "Tap [COMMUNE] Prompt"
		}
	}
}

func start_tutorial(force_restart: bool = false) -> void:
	# Check if tutorial was already completed in save data
	if not force_restart:
		var save = SaveSystem.load_game()
		if save.get("tutorialCompleted", false):
			current_step = TutorialStep.COMPLETED
			is_active = false
			return

	is_active = true
	_set_step(TutorialStep.CAMERA_LOOK)

func skip_tutorial() -> void:
	current_step = TutorialStep.COMPLETED
	is_active = false
	_save_tutorial_completion(true)
	tutorial_finished.emit()

func restart_tutorial() -> void:
	_save_tutorial_completion(false)
	start_tutorial(true)

func notify_input_device(device: InputDevice) -> void:
	if current_device != device:
		current_device = device
		if is_active and current_step in STEP_DATA:
			var data = STEP_DATA[current_step]
			var keycap = data["keys"].get(current_device, "")
			step_changed.emit(current_step, data["title"], data["desc"], keycap)

func notify_action(action: String, delta: float = 0.0) -> void:
	if not is_active or current_step == TutorialStep.COMPLETED or current_step == TutorialStep.NONE:
		return

	match current_step:
		TutorialStep.CAMERA_LOOK:
			if action == "look":
				_advance_step()
		TutorialStep.MOVE:
			if action == "move":
				_advance_step()
		TutorialStep.SPRINT:
			if action == "sprint":
				_advance_step()
		TutorialStep.JUMP:
			if action == "jump":
				_advance_step()
		TutorialStep.DASH:
			if action == "dash":
				_advance_step()
		TutorialStep.GUARD:
			if action == "guard":
				_advance_step()
		TutorialStep.ATTACK:
			if action == "attack":
				_advance_step()
		TutorialStep.INTERACT:
			if action == "interact":
				_advance_step()

func _set_step(step: TutorialStep) -> void:
	current_step = step
	if current_step == TutorialStep.COMPLETED:
		is_active = false
		_save_tutorial_completion(true)
		tutorial_finished.emit()
		return

	if current_step in STEP_DATA:
		var data = STEP_DATA[current_step]
		var keycap = data["keys"].get(current_device, "")
		step_changed.emit(current_step, data["title"], data["desc"], keycap)

func _advance_step() -> void:
	var prev = current_step
	step_completed.emit(int(prev))
	var next_idx = int(prev) + 1
	if next_idx >= TutorialStep.COMPLETED:
		_set_step(TutorialStep.COMPLETED)
	else:
		_set_step(next_idx as TutorialStep)

func get_current_instruction() -> Dictionary:
	if current_step in STEP_DATA:
		var data = STEP_DATA[current_step]
		return {
			"step": current_step,
			"title": data["title"],
			"desc": data["desc"],
			"keycap": data["keys"].get(current_device, "")
		}
	return {}

func _save_tutorial_completion(completed: bool) -> void:
	var save = SaveSystem.load_game()
	save["tutorialCompleted"] = completed
	SaveSystem.save_game(save)
