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

	# 2. Dandaka Grove Meeting Sequence
	var d1 = DialogueNode.new(
		"tara_dandaka_1",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Veer... you have reached Dandaka Grove. Look to the mountain ridge ahead—Corrupted Asura General Kalanemi has seized the high Watchtower.",
		"veer_dandaka_1"
	)
	var d2 = DialogueNode.new(
		"veer_dandaka_1",
		"Veer",
		"Solar Guardian",
		"His presence chokes the ley lines. How do we break the Tamas seal encircling the fortress?",
		"tara_dandaka_2"
	)
	var d3 = DialogueNode.new(
		"tara_dandaka_2",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Recover the 3 Primal Astra Shards across the valley. Their solar harmonic frequency will dissolve Kalanemi's ward and awaken your blade's full fury. Slay the General, then consecrate the Sun Altar!",
		"veer_dandaka_2"
	)
	var d4 = DialogueNode.new(
		"veer_dandaka_2",
		"Veer",
		"Solar Guardian",
		"By the light of Surya and the cosmic harmony of Rta, Kalanemi shall be cleansed. The flame shall burn bright!",
		""
	)
	nodes[d1.id] = d1
	nodes[d2.id] = d2
	nodes[d3.id] = d3
	nodes[d4.id] = d4

	# 3. Antariksha Sky Realm Meeting Sequence
	var s1 = DialogueNode.new(
		"tara_sky_1",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Veer... you stand within Antariksha, the Aerial Vault of Vayu. The gale winds howl in agony—Matarishvan, ancient lord of storms, has been ensnared by the Void.",
		"veer_sky_1"
	)
	var s2 = DialogueNode.new(
		"veer_sky_1",
		"Veer",
		"Solar Guardian",
		"The sky chasms are vast. How do I cross between these suspended citadels?",
		"tara_sky_2"
	)
	var s3 = DialogueNode.new(
		"tara_sky_2",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Hold Jump in mid-air to spread your Prana Glider upon the wind currents, and press Grapple [G / C / Middle Click] to tether to golden celestial rings. Harmonize the two Vayu Wind Turbines, then ascend to the Cyclone Pinnacle to purify Matarishvan!",
		"veer_sky_2"
	)
	var s4 = DialogueNode.new(
		"veer_sky_2",
		"Veer",
		"Solar Guardian",
		"The winds of Dharma shall guide my flight. I will calm the storm and free Matarishvan!",
		""
	)
	nodes[s1.id] = s1
	nodes[s2.id] = s2
	nodes[s3.id] = s3
	nodes[s4.id] = s4

	# 4. Patala Subterranean Descent Sequence
	var p1 = DialogueNode.new(
		"tara_patala_1",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Veer... we have pierced the crust of the cosmos and entered Patala, the subterranean serpent vaults of King Vasuki.",
		"veer_patala_1"
	)
	var p2 = DialogueNode.new(
		"veer_patala_1",
		"Veer",
		"Solar Guardian",
		"The air is heavy with venomous vapors. Emerald rivers of poison carve through the basalt foundations.",
		"tara_patala_2"
	)
	var p3 = DialogueNode.new(
		"tara_patala_2",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Tread not upon the venom currents! Use the glowing bioluminescent mushroom caps to launch across the abyssal fissures. Shesha's Tormented Echo guards the subterranean vault—awaken the sacred Nagamani Peetham to cleanse the underworld!",
		"veer_patala_2"
	)
	var p4 = DialogueNode.new(
		"veer_patala_2",
		"Veer",
		"Solar Guardian",
		"No shadow is too deep for the solar flame. I shall cleanse Patala!",
		""
	)
	nodes[p1.id] = p1
	nodes[p2.id] = p2
	nodes[p3.id] = p3
	nodes[p4.id] = p4

	# 5. Svarloka Solar Citadel Sequence
	var sv1 = DialogueNode.new(
		"tara_svar_1",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Veer... we have ascended beyond the realm of storm and stone into Svarloka, the celestial sun citadels of Savitr.",
		"veer_svar_1"
	)
	var sv2 = DialogueNode.new(
		"veer_svar_1",
		"Veer",
		"Solar Guardian",
		"The golden radiance is immense... yet the celestial light bridges between the sky bastions have broken down.",
		"tara_svar_2"
	)
	var sv3 = DialogueNode.new(
		"tara_svar_2",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Align the sacred Surya Prisms atop the marble pillars to channel the solar rays and reactivate the light bridges. At the apex stands the corrupted Sun Titan Avatara—purify him and consecrate the Grand Solar Mahapeetham!",
		"veer_svar_2"
	)
	var sv4 = DialogueNode.new(
		"veer_svar_2",
		"Veer",
		"Solar Guardian",
		"By the light of Surya and the truth of Rta, I shall reignite the solar citadel!",
		""
	)
	nodes[sv1.id] = sv1
	nodes[sv2.id] = sv2
	nodes[sv3.id] = sv3
	nodes[sv4.id] = sv4

	# 6. Maharloka Astral Sanctuary Sequence
	var m1 = DialogueNode.new(
		"tara_mahar_1",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Veer... we have crossed into Maharloka, the realm of the great Rishis and cosmic astral libraries where all sacred knowledge is inscribed.",
		"veer_mahar_1"
	)
	var m2 = DialogueNode.new(
		"veer_mahar_1",
		"Veer",
		"Solar Guardian",
		"The silence is profound, yet the air vibrates with Vedic hymns. Towering bookstacks reach into the deep indigo cosmos.",
		"tara_mahar_2"
	)
	var m3 = DialogueNode.new(
		"tara_mahar_2",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Step upon the Astral Levitation Glyphs to soar to the elevated archives. Commune with the ancient Scripture Pedestals to harmonize the archives. In the Grand Observatory awaits Brihaspati's Astral Avatar—prove your spiritual strength and attune the Sage Core at the Mahar Mandala!",
		"veer_mahar_2"
	)
	var m4 = DialogueNode.new(
		"veer_mahar_2",
		"Veer",
		"Solar Guardian",
		"With reverence and unwavering mind, I shall seek the wisdom of Maharloka!",
		""
	)
	nodes[m1.id] = m1
	nodes[m2.id] = m2
	nodes[m3.id] = m3
	nodes[m4.id] = m4

	# 7. Janaloka / Tapoloka Primordial Forge Sequence
	var tp1 = DialogueNode.new(
		"tara_tapo_1",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Veer... we have ascended to Tapoloka, the realm of the Ascetic Flame where all divine weapons and cosmic elements are forged in the primordial fires of Agni.",
		"veer_tapo_1"
	)
	var tp2 = DialogueNode.new(
		"veer_tapo_1",
		"Veer",
		"Solar Guardian",
		"The thermal pressure is immense. Rivers of liquid gold and molten magma boil across the volcanic obsidian crags.",
		"tara_tapo_2"
	)
	var tp3 = DialogueNode.new(
		"tara_tapo_2",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Ride the eruption surges of the Magma Pressure Geysers to leap across the caldera chasms! Attune the two Primordial Anvil Forges to rekindle the cosmic breath of Agni. At the heart of the caldera waits Agni Rudra, Fire Titan of Tapas—purify his wrath and ignite the Sacred Tapas Peetham!",
		"veer_tapo_2"
	)
	var tp4 = DialogueNode.new(
		"veer_tapo_2",
		"Veer",
		"Solar Guardian",
		"My spirit has been tempered through five realms. The fire shall not consume me—it shall forge my purpose!",
		""
	)
	nodes[tp1.id] = tp1
	nodes[tp2.id] = tp2
	nodes[tp3.id] = tp3
	nodes[tp4.id] = tp4

	# 8. Satyaloka / Brahmaloka Meeting Sequence (Chapter VII Final Climax)
	var st1 = DialogueNode.new(
		"tara_satya_1",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Veer... look upon the Lotus of Infinite Reality. You have ascended to Satyaloka—the Highest Apex of Creation and the Abode of Brahman. Here, the boundaries of time and karma dissolve into pure unmanifested light.",
		"veer_satya_1"
	)
	var st2 = DialogueNode.new(
		"veer_satya_1",
		"Veer",
		"Solar Guardian",
		"The Cosmic Wheel has halted its revolution. The Dharmachakra is fractured, and the cosmic fabric trembles. What stands before the core of creation?",
		"tara_satya_2"
	)
	var st3 = DialogueNode.new(
		"tara_satya_2",
		"Devi Tara",
		"Celestial Oracle of Tapas",
		"Brahma Avatara, the Four-Headed Creator Titan, has been caught in the shadow of cosmic dissolution—Mahapralaya! Align the two Cosmic Dharmachakra Resonators across the void to materialize the Transcendent Light Bridges. Defeat the Creator's shadow, free the cosmos from dissolution, and attune the Moksha Mahapeetham to complete your journey!",
		"veer_satya_2"
	)
	var st4 = DialogueNode.new(
		"veer_satya_2",
		"Veer",
		"Solar Guardian",
		"From the dust of Bhumi to the apex of Satyaloka, all my trials lead to this moment. In the name of Rta, Dharma, and all living souls—I shall turn the Wheel of Truth!",
		""
	)
	nodes[st1.id] = st1
	nodes[st2.id] = st2
	nodes[st3.id] = st3
	nodes[st4.id] = st4

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
