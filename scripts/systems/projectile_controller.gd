class_name ProjectileController
extends Node

signal shot_fired(color: BlockDefs.BloomColor)
signal shot_resolved(payload: Dictionary)
signal ammo_preview_changed(color: BlockDefs.BloomColor, next: BlockDefs.BloomColor)

const CANNON_POS := Vector2(360, 1120)

var projectile_scene: PackedScene
var projectiles_root: Node2D
var aim_line: AimLine
var block_controller: BlockController
var score_system: ScoreSystem

var shots_left: int = 0
var current_color: BlockDefs.BloomColor = BlockDefs.BloomColor.ROSE
var next_color: BlockDefs.BloomColor = BlockDefs.BloomColor.AQUA
var aiming: bool = false
var can_shoot: bool = true
var _rng := RandomNumberGenerator.new()
var _active: ProjectileEntity
var _color_pool: Array = [
	BlockDefs.BloomColor.ROSE,
	BlockDefs.BloomColor.AQUA,
	BlockDefs.BloomColor.SUN,
	BlockDefs.BloomColor.VIOLET,
	BlockDefs.BloomColor.LIME,
]

func setup(
	root: Node2D,
	scene: PackedScene,
	line: AimLine,
	blocks: BlockController,
	scores: ScoreSystem
) -> void:
	projectiles_root = root
	projectile_scene = scene
	aim_line = line
	block_controller = blocks
	score_system = scores

func begin_level(level: LevelData) -> void:
	_rng.seed = level.seed
	shots_left = level.shot_budget
	current_color = BlockDefs.random_color(_rng, _color_pool.slice(0, 4))
	next_color = BlockDefs.random_color(_rng, _color_pool.slice(0, 4))
	can_shoot = true
	aiming = false
	if aim_line:
		aim_line.clear_aim()
	ammo_preview_changed.emit(current_color, next_color)

func handle_input(event: InputEvent) -> void:
	if not can_shoot or GameManager.state != GameManager.GameState.PLAYING:
		return
	if event is InputEventScreenTouch:
		var st := event as InputEventScreenTouch
		if st.pressed:
			_start_aim(st.position)
		else:
			_release_aim(st.position)
	elif event is InputEventScreenDrag:
		_update_aim((event as InputEventScreenDrag).position)
	elif event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				_start_aim(mb.position)
			else:
				_release_aim(mb.position)
	elif event is InputEventMouseMotion and aiming:
		_update_aim((event as InputEventMouseMotion).position)

func _start_aim(pos: Vector2) -> void:
	aiming = true
	_update_aim(pos)

func _update_aim(pos: Vector2) -> void:
	if not aiming:
		return
	var dir := (pos - CANNON_POS)
	# Pull-back aim: drag away from cannon; invert if dragging below.
	if dir.y > -20.0:
		dir = Vector2(dir.x, -absf(dir.y) - 40.0)
	dir = dir.normalized()
	# Clamp to upward hemisphere with slight side freedom.
	if dir.y > -0.15:
		dir.y = -0.15
		dir = dir.normalized()
	aim_line.set_aim(CANNON_POS, dir, current_color)

func _release_aim(pos: Vector2) -> void:
	if not aiming:
		return
	aiming = false
	var dir := (pos - CANNON_POS)
	if dir.y > -20.0:
		dir = Vector2(dir.x, -absf(dir.y) - 40.0)
	dir = dir.normalized()
	if dir.y > -0.15:
		dir.y = -0.15
		dir = dir.normalized()
	aim_line.clear_aim()
	if dir.length() < 0.2:
		return
	_fire(dir)

func _fire(dir: Vector2) -> void:
	if not can_shoot or shots_left <= 0:
		return
	can_shoot = false
	shots_left -= 1
	var proj: ProjectileEntity = projectile_scene.instantiate()
	projectiles_root.add_child(proj)
	_active = proj
	proj.launch(current_color, CANNON_POS, dir)
	proj.impacted.connect(_on_impacted)
	proj.left_playfield.connect(_on_left)
	AudioManager.play_shoot()
	shot_fired.emit(current_color)
	# Advance queue
	current_color = next_color
	next_color = BlockDefs.random_color(_rng, _color_pool.slice(0, 4))
	ammo_preview_changed.emit(current_color, next_color)
	# Safety timeout if projectile never hits
	get_tree().create_timer(3.5).timeout.connect(_timeout_active.bind(proj), CONNECT_ONE_SHOT)

func _on_impacted(proj: ProjectileEntity, block: BlockEntity) -> void:
	if proj != _active:
		return
	AudioManager.play_impact()
	var color := proj.bloom_color
	proj.queue_free()
	_active = null
	var payload := await _resolve(color, block)
	shot_resolved.emit(payload)
	can_shoot = GameManager.state == GameManager.GameState.PLAYING and shots_left > 0 and block_controller.remaining() > 0

func _resolve(color: BlockDefs.BloomColor, block: BlockEntity) -> Dictionary:
	var payload := block_controller.resolve_impact(block, color)
	# Wait for gravity + chains kicked off inside controller
	await get_tree().create_timer(0.55).timeout
	# Extra wait if chains still settling
	await get_tree().create_timer(0.15 * float(maxi(1, int(payload.get("chain_depth", 0))))).timeout
	var destroyed := int(payload.get("destroyed_count", 0))
	if destroyed > 0:
		var delta := score_system.register_match(
			destroyed,
			int(payload.get("chain_depth", 0)),
			bool(payload.get("had_aoe", false)),
			int(payload.get("durable_hits", 0))
		)
		payload["score_delta"] = delta
		AudioManager.play_match(score_system.combo)
		if payload.get("had_aoe", false):
			AudioManager.play_aoe()
	elif int(payload.get("durable_hits", 0)) > 0:
		score_system.register_chip()
		score_system.break_combo()
	else:
		score_system.break_combo()
	payload["shots_left"] = shots_left
	payload["remaining_blocks"] = block_controller.remaining()
	return payload

func _on_left(proj: ProjectileEntity) -> void:
	if proj == _active:
		_active = null
		score_system.break_combo()
		can_shoot = shots_left > 0
		shot_resolved.emit({"destroyed_count": 0, "shots_left": shots_left, "remaining_blocks": block_controller.remaining()})
	proj.queue_free()

func _timeout_active(proj: ProjectileEntity) -> void:
	if is_instance_valid(proj) and proj == _active and proj.active:
		proj.retire()
