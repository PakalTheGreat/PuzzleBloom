extends Node2D

const BlockScene := preload("res://scenes/game/blocks/block.tscn")
const ProjectileScene := preload("res://scenes/game/projectile.tscn")
const ImpactFxScene := preload("res://scenes/fx/impact_burst.tscn")
const ScoreFlyScript := preload("res://scripts/fx/score_fly.gd")

@onready var world: Node2D = $World
@onready var blocks_root: Node2D = $World/Blocks
@onready var projectiles_root: Node2D = $World/Projectiles
@onready var fx_root: Node2D = $World/FX
@onready var aim_line: AimLine = $World/AimLine
@onready var cannon: Node2D = $World/Cannon
@onready var cannon_body: Sprite2D = $World/Cannon/Body
@onready var cannon_glow: Sprite2D = $World/Cannon/Glow
@onready var cannon_face: Sprite2D = $World/Cannon/Face
@onready var camera: Camera2D = $Camera2D
@onready var ui: UIManager = $UI
@onready var reveal: RevealController = $World/Reveal
@onready var bg_sprite: Sprite2D = $Background/Garden

var score_system: ScoreSystem
var collision_system: CollisionSystem
var block_controller: BlockController
var projectile_controller: ProjectileController
var level_manager: LevelManager
var juice: JuiceDirector

func _ready() -> void:
	_style_background()
	_build_systems()
	_style_cannon()
	ui.restart_pressed.connect(_restart)
	ui.continue_pressed.connect(_restart)
	GameManager.state_changed.connect(_on_state)
	GameManager.request_restart.connect(_restart)
	juice.combo_banner.connect(func(text: String, color: Color) -> void: ui.show_banner(text, color))
	GameManager.start_level(LevelData.etapa_a_level())
	_boot_level(GameManager.current_level)

func _style_background() -> void:
	if bg_sprite:
		bg_sprite.texture = PetalAtlas.BG_GARDEN
		bg_sprite.centered = false
		bg_sprite.position = Vector2.ZERO
		var tex := bg_sprite.texture.get_size()
		bg_sprite.scale = Vector2(720.0 / tex.x, 1280.0 / tex.y)

func _build_systems() -> void:
	juice = JuiceDirector.new()
	juice.name = "JuiceDirector"
	add_child(juice)
	juice.bind_camera(camera)

	score_system = ScoreSystem.new()
	add_child(score_system)

	collision_system = CollisionSystem.new()
	add_child(collision_system)

	block_controller = BlockController.new()
	add_child(block_controller)
	block_controller.setup(blocks_root, BlockScene, collision_system)

	projectile_controller = ProjectileController.new()
	add_child(projectile_controller)
	projectile_controller.setup(projectiles_root, ProjectileScene, aim_line, block_controller, score_system, juice)

	level_manager = LevelManager.new()
	add_child(level_manager)
	level_manager.setup(score_system, block_controller, projectile_controller, fx_root)

	score_system.score_changed.connect(func(score: int, delta: int) -> void: ui.set_score(score, delta))
	score_system.combo_changed.connect(func(combo: int) -> void: ui.set_combo(combo))
	projectile_controller.shot_fired.connect(func(_c: BlockDefs.BloomColor) -> void:
		ui.set_shots(projectile_controller.shots_left)
		_pulse_cannon()
	)
	projectile_controller.ammo_preview_changed.connect(_on_ammo)
	projectile_controller.shot_resolved.connect(_on_shot_fx)
	block_controller.cluster_cleared.connect(func(count: int) -> void: reveal.register_clear(count))

func _boot_level(level: LevelData) -> void:
	ui.bind_level(level)
	level_manager.load_level(level)
	var solid := 0
	for code in level.layout:
		if String(code) != "." and not String(code).is_empty():
			solid += 1
	reveal.configure(solid)
	_on_ammo(projectile_controller.current_color, projectile_controller.next_color)

func _unhandled_input(event: InputEvent) -> void:
	projectile_controller.handle_input(event)

func _restart() -> void:
	get_tree().paused = false
	Engine.time_scale = 1.0
	for c in blocks_root.get_children():
		c.queue_free()
	for c in projectiles_root.get_children():
		c.queue_free()
	for c in fx_root.get_children():
		c.queue_free()
	GameManager.start_level(LevelData.etapa_a_level())
	_boot_level(GameManager.current_level)

func _on_state(state: GameManager.GameState) -> void:
	match state:
		GameManager.GameState.WON:
			juice.shake(16.0, 0.35)
			juice.punch(Vector2(0, 1), 22.0)
			ui.show_win(score_system.score, GameManager.current_level.target_score)
		GameManager.GameState.LOST:
			juice.shake(8.0, 0.22)
			ui.show_lose(score_system.score)

func _on_ammo(cur: BlockDefs.BloomColor, nxt: BlockDefs.BloomColor) -> void:
	ui.set_ammo(cur, nxt)
	if cannon_body:
		# CURRENT shot = large launcher petal at bottom (hero piece).
		const CANNON_SIZE := 148.0
		cannon_body.texture = PetalAtlas.PETAL[cur]
		var s := CANNON_SIZE / maxf(cannon_body.texture.get_size().x, 1.0)
		cannon_body.scale = Vector2.ONE * s
		cannon_glow.texture = cannon_body.texture
		cannon_glow.scale = Vector2.ONE * s * 1.4
		cannon_glow.modulate = Color(1, 1, 1, 0.4)
		cannon_face.texture = PetalAtlas.FACE_HAPPY
		cannon_face.scale = Vector2.ONE * (CANNON_SIZE * 0.55 / maxf(cannon_face.texture.get_size().x, 1.0))
		cannon_face.position = Vector2(0, 8)

func _on_shot_fx(payload: Dictionary) -> void:
	var destroyed := int(payload.get("destroyed_count", 0))
	if destroyed <= 0:
		return
	var impact: Vector2 = payload.get("impact_pos", Vector2(360, 480))
	var burst: Node2D = ImpactFxScene.instantiate()
	fx_root.add_child(burst)
	burst.global_position = impact
	var shot_color: Variant = payload.get("shot_color", projectile_controller.current_color)
	var c: Color = BlockDefs.COLOR_HEX[shot_color as BlockDefs.BloomColor]
	if burst.has_method("play"):
		burst.call("play", c)
	_spawn_score_flies(impact, int(payload.get("score_delta", 50)), destroyed)

func _spawn_score_flies(from: Vector2, score_delta: int, count: int) -> void:
	var n := mini(maxi(count, 1), 8)
	var each := maxi(int(float(score_delta) / float(n)), 10)
	for i in n:
		var fly := Node2D.new()
		fly.set_script(ScoreFlyScript)
		fx_root.add_child(fly)
		var jitter := from + Vector2(randf_range(-30, 30), randf_range(-20, 20))
		fly.call("setup", jitter, ui.score_fly_target, each, Color("ffe66d"))

func _style_cannon() -> void:
	cannon.position = ProjectileController.CANNON_POS
	cannon_body.centered = true
	cannon_glow.centered = true
	cannon_face.centered = true

func _pulse_cannon() -> void:
	var tw := create_tween()
	tw.tween_property(cannon, "scale", Vector2(1.16, 0.88), 0.05)
	tw.tween_property(cannon, "scale", Vector2.ONE, 0.14).set_trans(Tween.TRANS_BACK)
