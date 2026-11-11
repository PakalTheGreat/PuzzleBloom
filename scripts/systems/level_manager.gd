class_name LevelManager
extends Node

signal level_cleared(score: int)
signal level_failed(score: int)

var level: LevelData
var score_system: ScoreSystem
var block_controller: BlockController
var projectile_controller: ProjectileController
var fx_root: Node2D

func setup(scores: ScoreSystem, blocks: BlockController, projectiles: ProjectileController, fx: Node2D) -> void:
	score_system = scores
	block_controller = blocks
	projectile_controller = projectiles
	fx_root = fx
	block_controller.cluster_cleared.connect(_on_cluster)
	projectile_controller.shot_resolved.connect(_on_shot_resolved)

func load_level(data: LevelData) -> void:
	level = data
	score_system.reset()
	block_controller.spawn_from_level(data)
	projectile_controller.begin_level(data)

func _on_cluster(count: int) -> void:
	_spawn_burst_at_center(count)

func _on_shot_resolved(payload: Dictionary) -> void:
	if GameManager.state != GameManager.GameState.PLAYING:
		return
	var remaining: int = int(payload.get("remaining_blocks", block_controller.remaining()))
	var shots: int = int(payload.get("shots_left", projectile_controller.shots_left))
	if remaining <= 0:
		level_cleared.emit(score_system.score)
		GameManager.win(score_system.score)
		return
	if shots <= 0:
		level_failed.emit(score_system.score)
		GameManager.lose()

func _spawn_burst_at_center(count: int) -> void:
	if fx_root == null:
		return
	# Lightweight juice ring — actual particles live on blocks / impact FX node.
	var ring := Node2D.new()
	fx_root.add_child(ring)
	ring.position = Vector2(360, 520)
	ring.set_meta("life", 0.35)
	ring.set_meta("count", count)
	ring.queue_free()
