@tool
extends SceneTree

func _init() -> void:
	print("--- Checking Asura Warrior GLB Animations ---")
	var asura_scene = load("res://assets/characters/enemies/asura_warrior.glb")
	if asura_scene:
		var inst = asura_scene.instantiate()
		var ap: AnimationPlayer = inst.find_child("AnimationPlayer", true, false)
		if ap:
			print("Asura AnimationPlayer found! Animations:")
			for anim in ap.get_animation_list():
				print("  - ", anim)
		else:
			print("No AnimationPlayer found on Asura instance. Children:")
			for c in inst.get_children():
				print("  child: ", c.name, " (", c.get_class(), ")")
		inst.free()

	print("--- Checking Boss Kalanemi GLB Animations ---")
	var boss_scene = load("res://assets/characters/enemies/boss_kalanemi.glb")
	if boss_scene:
		var inst = boss_scene.instantiate()
		var ap: AnimationPlayer = inst.find_child("AnimationPlayer", true, false)
		if ap:
			print("Boss AnimationPlayer found! Animations:")
			for anim in ap.get_animation_list():
				print("  - ", anim)
		else:
			print("No AnimationPlayer found on Boss instance. Children:")
			for c in inst.get_children():
				print("  child: ", c.name, " (", c.get_class(), ")")
		inst.free()

	quit()
