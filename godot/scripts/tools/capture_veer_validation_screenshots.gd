@tool
extends SceneTree

## Tool to capture comprehensive multi-angle validation screenshots of reconstructed Veer
## Captures: Front, Back, Left, Right, Three-Quarter, Face Close-up, and Character Studio

const OUTPUT_DIR = "h:/mythologicalgame/docs/images/veer_validation"
const BRAIN_DIR = "C:/Users/dayan/.gemini/antigravity-ide/brain/4a5bfbbb-2b05-4ffa-a9b4-fd46b2031671"

func _init():
	print("[Screenshot Tool] Initializing Veer visual validation capturer...")
	DirAccess.make_dir_recursive_absolute(OUTPUT_DIR)
	_run_captures()
	quit(0)

func _run_captures():
	var root = Node3D.new()
	get_root().add_child(root)

	# World environment & Lighting
	var env = Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.12, 0.13, 0.16)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.55, 0.52, 0.50)
	env.ambient_light_energy = 1.0
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.glow_enabled = true
	env.glow_intensity = 0.5
	env.glow_bloom = 0.1

	var world_env = WorldEnvironment.new()
	world_env.environment = env
	root.add_child(world_env)

	# Key Light (Warm Surya Sunlight)
	var sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-35, 45, 0)
	sun.light_color = Color(1.0, 0.95, 0.85)
	sun.light_energy = 1.8
	sun.shadow_enabled = true
	root.add_child(sun)

	# Fill Light (Cool sky fill)
	var fill = DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(20, -135, 0)
	fill.light_color = Color(0.65, 0.75, 0.90)
	fill.light_energy = 0.8
	root.add_child(fill)

	# Rim Light
	var rim = DirectionalLight3D.new()
	rim.rotation_degrees = Vector3(-15, 180, 0)
	rim.light_color = Color(1.0, 0.85, 0.60)
	rim.light_energy = 1.2
	root.add_child(rim)

	# Subview for Rendering
	var vp = SubViewport.new()
	vp.size = Vector2i(1280, 960)
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	vp.own_world_3d = true
	vp.world_3d = root.get_world_3d()
	root.add_child(vp)

	# Camera
	var cam = Camera3D.new()
	cam.fov = 42.0
	vp.add_child(cam)

	# Instantiate Reconstructed Veer Model
	var veer_scene = load("res://assets/characters/veer/veer.glb")
	if not veer_scene:
		print("[Screenshot Tool] Error: Could not load veer.glb")
		return
	var veer_inst: Node3D = veer_scene.instantiate()
	root.add_child(veer_inst)

	var shots = [
		{
			"id": "veer_front",
			"pos": Vector3(0, 1.05, 2.8),
			"target": Vector3(0, 0.95, 0),
			"fov": 38.0
		},
		{
			"id": "veer_back",
			"pos": Vector3(0, 1.05, -2.8),
			"target": Vector3(0, 0.95, 0),
			"fov": 38.0
		},
		{
			"id": "veer_left",
			"pos": Vector3(2.8, 1.05, 0),
			"target": Vector3(0, 0.95, 0),
			"fov": 38.0
		},
		{
			"id": "veer_right",
			"pos": Vector3(-2.8, 1.05, 0),
			"target": Vector3(0, 0.95, 0),
			"fov": 38.0
		},
		{
			"id": "veer_three_quarter",
			"pos": Vector3(-1.8, 1.2, 2.2),
			"target": Vector3(0, 1.0, 0),
			"fov": 36.0
		},
		{
			"id": "veer_closeup_face",
			"pos": Vector3(-0.35, 1.62, 0.95),
			"target": Vector3(0, 1.62, 0),
			"fov": 22.0
		},
		{
			"id": "veer_sword_detail",
			"pos": Vector3(-0.95, 1.05, 0.85),
			"target": Vector3(-0.44, 0.95, 0),
			"fov": 25.0
		}
	]

	# Render frames
	RenderingServer.render_loop_enabled = true

	for shot in shots:
		cam.fov = shot["fov"]
		cam.position = shot["pos"]
		cam.look_at(shot["target"], Vector3.UP)

		# Force multiple frame updates for rendering engine
		for i in range(4):
			RenderingServer.force_draw(true)

		var img: Image = vp.get_texture().get_image()
		if img:
			var path_out = OUTPUT_DIR + "/" + shot["id"] + ".png"
			img.save_png(path_out)
			print("[Screenshot Tool] Saved validation capture: ", path_out)
			# Also copy to brain dir for artifact embedding
			var brain_path = BRAIN_DIR + "/" + shot["id"] + ".png"
			img.save_png(brain_path)
			print("[Screenshot Tool] Saved to brain artifact directory: ", brain_path)
		else:
			print("[Screenshot Tool] Failed to get image for shot: ", shot["id"])

	root.free()
	print("[Screenshot Tool] All Veer validation captures successfully generated.")
