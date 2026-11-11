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
var juice: JuiceDirector

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
	scores: ScoreSystem,
	juice_dir: JuiceDirector = null
) -> void:
	projectiles_root = root
	projectile_scene = scene
	aim_line = line
	block_controller = blocks
	score_system = scores
	juice = juice_dir

func begin_level(level: LevelData) -> void:
	_rng.seed = level.rng_seed
	shots_left = level.shot_budget
	# Bias opening colors toward layout density for teachable first shots
	current_color = BlockDefs.BloomColor.VIOLET
	next_color = BlockDefs.BloomColor.SUN
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
			_start_aim(_to_world(st.position))
		else:
			_release_aim(_to_world(st.position))
	elif event is InputEventScreenDrag:
		_update_aim(_to_world((event as InputEventScreenDrag).position))
	elif event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				_start_aim(_to_world(mb.position))
			else:
				_release_aim(_to_world(mb.position))
	elif event is InputEventMouseMotion and aiming:
		_update_aim(_to_world((event as InputEventMouseMotion).position))

func _to_world(pos: Vector2) -> Vector2:
	# Normalize input across stretch / window overrides into playfield space.
	var vp := get_viewport()
	if vp == null:
		return pos
	return vp.get_canvas_transform().affine_inverse() * pos

func _start_aim(pos: Vector2) -> void:
	aiming = true
	_update_aim(pos)

func _dir_from(pos: Vector2) -> Vector2:
	var dir := pos - CANNON_POS
	if dir.y > -20.0:
		dir = Vector2(dir.x, -absf(dir.y) - 40.0)
	dir = dir.normalized()
	if dir.y > -0.12:
		dir.y = -0.12
		dir = dir.normalized()
	return dir

func _update_aim(pos: Vector2) -> void:
	if not aiming:
		return
	var dir := _dir_from(pos)
	aim_line.set_aim(CANNON_POS, dir, current_color, block_controller.get_blocks())

func _release_aim(pos: Vector2) -> void:
	if not aiming:
		return
	aiming = false
	_update_aim(pos)
	var dir := aim_line.get_fire_dir()
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
	if juice:
		juice.soft_tap()
	shot_fired.emit(current_color)
	current_color = next_color
	next_color = BlockDefs.random_color(_rng, _color_pool)
	ammo_preview_changed.emit(current_color, next_color)
	_arm_timeout(proj)

func _on_impacted(proj: ProjectileEntity, block: BlockEntity) -> void:
	if proj != _active:
		return
	AudioManager.play_impact()
	var color := proj.bloom_color
	var impact_pos := block.global_position
	proj.queue_free()
	_active = null
	var payload := await _resolve(color, block, impact_pos)
	shot_resolved.emit(payload)
	can_shoot = GameManager.state == GameManager.GameState.PLAYING and shots_left > 0 and block_controller.remaining() > 0

func _resolve(color: BlockDefs.BloomColor, block: BlockEntity, impact_pos: Vector2) -> Dictionary:
	var payload := block_controller.resolve_impact(block, color)
	payload["impact_pos"] = impact_pos
	payload["shot_color"] = color
	var destroyed_now := int(payload.get("destroyed_count", 0))
	var durable_only := int(payload.get("durable_hits", 0)) > 0 and destroyed_now == 0
	if destroyed_now > 0:
		var finished: Dictionary = await block_controller.resolution_finished
		payload = finished
		payload["impact_pos"] = impact_pos
		payload["shot_color"] = color
		var destroyed := int(payload.get("destroyed_count", 0))
		var chain := int(payload.get("chain_depth", 0))
		var delta := score_system.register_match(
			destroyed,
			chain,
			bool(payload.get("had_aoe", false)),
			int(payload.get("durable_hits", 0))
		)
		payload["score_delta"] = delta
		AudioManager.play_match(score_system.combo)
		if chain > 0:
			AudioManager.play_chain(chain)
		if payload.get("had_aoe", false):
			AudioManager.play_aoe()
		if juice:
			juice.big_clear(destroyed, score_system.combo)
	elif durable_only:
		score_system.register_chip()
		score_system.break_combo()
		if juice:
			juice.soft_tap()
	else:
		score_system.break_combo()
		AudioManager.play_miss()
	payload["shots_left"] = shots_left
	payload["remaining_blocks"] = block_controller.remaining()
	return payload

func _on_left(proj: ProjectileEntity) -> void:
	if proj == _active:
		_active = null
		score_system.break_combo()
		AudioManager.play_miss()
		can_shoot = shots_left > 0
		shot_resolved.emit({"destroyed_count": 0, "shots_left": shots_left, "remaining_blocks": block_controller.remaining()})
	proj.queue_free()

func _arm_timeout(proj: ProjectileEntity) -> void:
	await get_tree().create_timer(3.5).timeout
	if is_instance_valid(proj) and proj == _active and proj.active:
		proj.retire()
