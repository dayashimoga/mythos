import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)

# Load veer_production.blend
blend_path = r"h:\mythologicalgame\godot\assets\characters\veer\veer_production.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

print("Objects in blend:", [o.name for o in bpy.data.objects])
for o in bpy.data.objects:
    if o.type == 'MESH':
        print(f"Mesh Object: {o.name}, vertices: {len(o.data.vertices)}, materials: {[m.name if m else 'None' for m in o.data.materials]}")
        for i, m in enumerate(o.data.materials):
            if m and m.use_nodes:
                bsdf = m.node_tree.nodes.get("Principled BSDF")
                base_color_link = bsdf.inputs["Base Color"].links if bsdf else []
                tex = base_color_link[0].from_node.image.name if base_color_link else "NO_TEX"
                print(f"  Slot {i}: {m.name} -> Base Color: {tex}")
