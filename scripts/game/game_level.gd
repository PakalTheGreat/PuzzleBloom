extends Node2D

## Etapa A orchestration — wires independent systems into one polished level.

const BlockScene := preload("res://scenes/game/blocks/block.tscn")
const ProjectileScene := preload("res://scenes/game/projectile.tscn")
const ImpactFxScene := preload("res://scenes/fx/impact_burst.tscn")

@onready var world: Node2D = $World
@onready var blocks_root: Node2D = $World/Blocks
@onready var projectiles_root: Node2D = $World/Projectiles
@onready var fx_root: Node2D = $World/FX
@onready var aim_line: AimLine = $World/AimLine
@onready var cannon: Node2D = $World/Cannon
@onready var cannon_glow: Polygon2D = $World/Cannon/Glow
@onready var cannon_body: Polygon2D = $World/Cannon/Body
@onready var background: Node2D = $Background
@onready var ui: UIManager = $UI
@onready var walls: StaticBody2D = $World/Walls

var score_system: ScoreSystem
var collision_system: CollisionSystem
var block_controller: BlockController
var projectile_controller: ProjectileController
var level_manager: LevelManager

func _ready() -> void:
	_build_systems()
	_style_cannon()
	_draw_background()
	ui.restart_pressed.connect(_restart)
	ui.continue_pressed.connect(_restart)
	GameManager.state_changed.connect(_on_state)
	GameManager.request_restart.connect(_restart)
	GameManager.start_level(LevelData.etapa_a_level())
	_boot_level(GameManager.current_level)

func _build_systems() -> void:
	score_system = ScoreSystem.new()
	score_system.name = "ScoreSystem"
	add_child(score_system)

	collision_system = CollisionSystem.new()
	collision_system.name = "CollisionSystem"
	add_child(collision_system)

	block_controller = BlockController.new()
	block_controller.name = "BlockController"
	add_child(block_controller)
	block_controller.setup(blocks_root, BlockScene, collision_system)

	projectile_controller = ProjectileController.new()
	projectile_controller.name = "ProjectileController"
	add_child(projectile_controller)
	projectile_controller.setup(projectiles_root, ProjectileScene, aim_line, block_controller, score_system)

	level_manager = LevelManager.new()
	level_manager.name = "LevelManager"
	add_child(level_manager)
	level_manager.setup(score_system, block_controller, projectile_controller, fx_root)

	score_system.score_changed.connect(func(score: int, delta: int) -> void: ui.set_score(score, delta))
	score_system.combo_changed.connect(func(combo: int) -> void: ui.set_combo(combo))
	projectile_controller.shot_fired.connect(func(_c: BlockDefs.BloomColor) -> void:
		ui.set_shots(projectile_controller.shots_left)
		_pulse_cannon()
	)
	projectile_controller.ammo_preview_changed.connect(func(cur: BlockDefs.BloomColor, nxt: BlockDefs.BloomColor) -> void:
		ui.set_ammo(cur, nxt)
		cannon_body.color = BlockDefs.COLOR_HEX[cur]
		cannon_glow.color = Color(BlockDefs.COLOR_GLOW[cur].r, BlockDefs.COLOR_GLOW[cur].g, BlockDefs.COLOR_GLOW[cur].b, 0.4)
	)
	projectile_controller.shot_resolved.connect(_on_shot_fx)

func _boot_level(level: LevelData) -> void:
	ui.bind_level(level)
	level_manager.load_level(level)
	ui.set_ammo(projectile_controller.current_color, projectile_controller.next_color)
	cannon_body.color = BlockDefs.COLOR_HEX[projectile_controller.current_color]

func _unhandled_input(event: InputEvent) -> void:
	projectile_controller.handle_input(event)

func _restart() -> void:
	get_tree().paused = false
	# Clear leftovers
	for c in blocks_root.get_children():
		c.queue_free()
	for c in projectiles_root.get_children():
		c.queue_free()
	GameManager.start_level(LevelData.etapa_a_level())
	_boot_level(GameManager.current_level)

func _on_state(state: GameManager.GameState) -> void:
	match state:
		GameManager.GameState.WON:
			ui.show_win(score_system.score, GameManager.current_level.target_score)
		GameManager.GameState.LOST:
			ui.show_lose(score_system.score)

func _on_shot_fx(payload: Dictionary) -> void:
	if int(payload.get("destroyed_count", 0)) <= 0:
		return
	var burst: Node2D = ImpactFxScene.instantiate()
	fx_root.add_child(burst)
	burst.global_position = Vector2(360, 480)
	if burst.has_method("play"):
		burst.call("play", BlockDefs.COLOR_HEX[projectile_controller.current_color])

func _style_cannon() -> void:
	cannon.position = ProjectileController.CANNON_POS
	var body_pts := PackedVector2Array()
	for i in 16:
		var a := TAU * float(i) / 16.0
		body_pts.append(Vector2(cos(a), sin(a)) * 34.0)
	cannon_body.polygon = body_pts
	var glow_pts := PackedVector2Array()
	for i in 16:
		var a := TAU * float(i) / 16.0
		glow_pts.append(Vector2(cos(a), sin(a)) * 48.0)
	cannon_glow.polygon = glow_pts
	cannon_glow.color = Color(1, 1, 1, 0.25)

func _pulse_cannon() -> void:
	var tw := create_tween()
	tw.tween_property(cannon, "scale", Vector2(1.12, 0.9), 0.06)
	tw.tween_property(cannon, "scale", Vector2.ONE, 0.12).set_trans(Tween.TRANS_BACK)

func _draw_background() -> void:
	# Procedural garden atmosphere via ColorRects / polygons already in scene.
	pass
