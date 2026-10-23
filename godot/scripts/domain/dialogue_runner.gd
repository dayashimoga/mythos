class_name DialogueRunner
extends RefCounted

## Dialogue Tree Traversal Engine ported from legacy DialogueTree.ts
## Manages branching dialogue nodes, speaker attributions, and choice triggers.

class DialogueChoice:
	var text: String = ""
	var target_node_id: String = ""
	var action_key: String = ""

	func _init(p_text: String, p_target: String, p_action: String = "") -> void:
		text = p_text
		target_node_id = p_target
		action_key = p_action

class DialogueNode:
	var id: String = ""
	var speaker: String = "Narrator"
	var speaker_role: String = ""
	var text: String = ""
	var choices: Array[DialogueChoice] = []
	var next_node_id: String = ""

	func _init(p_id: String, p_speaker: String, p_role: String, p_text: String, p_next: String = "") -> void:
		id = p_id
		speaker = p_speaker
		speaker_role = p_role
		text = p_text
		next_node_id = p_next
		choices = []

var nodes: Dictionary = {} # id -> DialogueNode
var current_node_id: String = ""
var is_active: bool = false
var history: Array[String] = []

signal dialogue_started(node: DialogueNode)
signal node_displayed(node: DialogueNode)
signal dialogue_ended()

func _init() -> void:
	_register_canonical_nodes()

func _register_canonical_nodes() -> void:
	# 1. Devi Tara greeting
	var n1 = DialogueNode.new(
		"tara_intro",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Arise, Child of the Sun. The Wheel of Time falters upon its axis. The seal of Surya has shattered, and Tamas claims the thresholds of the realm.",
		"veer_reply"
	)
	var n2 = DialogueNode.new(
		"veer_reply",
		"Veer",
		"Solar Guardian",
		"The Sanctum... has the corruption of Mahisha reached this sacred ground? My gauntlet pulses with turbulent heat.",
		"tara_instruction"
	)
	var n3 = DialogueNode.new(
		"tara_instruction",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"The sentinels have fallen into shadow slumber. Gather the three radiant Astra Shards scattered across this chamber. Bring them to the Sun Altar and rekindle the primal flame.",
		"veer_resolution"
	)
	var n4 = DialogueNode.new(
		"veer_resolution",
		"Veer",
		"Solar Guardian",
		"The flame will not die while I draw breath. For the light of Rta—I shall calibrate the Sanctum!",
		""
	)

	nodes[n1.id] = n1
	nodes[n2.id] = n2
	nodes[n3.id] = n3
	nodes[n4.id] = n4

func start(start_id: String = "tara_intro") -> bool:
	if not nodes.has(start_id):
		return false
	current_node_id = start_id
	is_active = true
	var node: DialogueNode = nodes[current_node_id]
	history.append(node.id)
	dialogue_started.emit(node)
	node_displayed.emit(node)
	return true

func advance() -> bool:
	if not is_active or not nodes.has(current_node_id):
		return false
	var current: DialogueNode = nodes[current_node_id]
	if current.next_node_id.is_empty():
		is_active = false
		current_node_id = ""
		dialogue_ended.emit()
		return false
	return start(current.next_node_id)

func select_choice(choice_index: int) -> bool:
	if not is_active or not nodes.has(current_node_id):
		return false
	var current: DialogueNode = nodes[current_node_id]
	if choice_index < 0 or choice_index >= current.choices.size():
		return false
	var choice: DialogueChoice = current.choices[choice_index]
	if choice.target_node_id.is_empty():
		is_active = false
		current_node_id = ""
		dialogue_ended.emit()
		return false
	return start(choice.target_node_id)
