import subprocess

script_content = """extends SceneTree

func _init():
\tvar sc = load("res://assets/characters/veer/veer.glb")
\tif sc:
\t\tvar n = sc.instantiate()
\t\tprint("Root: " + n.name + " (" + n.get_class() + ")")
\t\t_print_tree(n, "  ")
\t\tn.free()
\telse:
\t\tprint("Failed to load veer.glb")
\tquit()

func _print_tree(node: Node, indent: String):
\tfor child in node.get_children():
\t\tprint(indent + child.name + " (" + child.get_class() + ")")
\t\tif child is Skeleton3D:
\t\t\tprint(indent + "  Bones count: " + str(child.get_bone_count()))
\t\t\tfor i in range(child.get_bone_count()):
\t\t\t\tprint(indent + "    Bone " + str(i) + ": " + child.get_bone_name(i))
\t\tif child is AnimationPlayer:
\t\t\tprint(indent + "  Anim list: " + str(child.get_animation_list()))
\t\t_print_tree(child, indent + "  ")
"""

with open("godot/tests/inspect_veer_tree.gd", "w") as f:
    f.write(script_content)

res = subprocess.run([
    "tools/godot/Godot_v4.3-stable_win64_console.exe",
    "--headless",
    "--path", "./godot",
    "-s", "res://tests/inspect_veer_tree.gd"
], capture_output=True, text=True)

print(res.stdout)
print(res.stderr)
