class_name BlockController
extends Node

signal blocks_changed(remaining: int)
signal cluster_cleared(count: int)
signal resolution_finished(payload: Dictionary)

const CELL := 102.0
var origin: Vector2 = Vector2(54, 190)

var block_scene: PackedScene
var blocks_root: Node2D
var collision_system: CollisionSystem
var floor_row: int = 10
var _blocks: Array[BlockEntity] = []

func setup(root: Node2D, scene: PackedScene, collisions: CollisionSystem) -> void:
	blocks_root = root
	block_scene = scene
	collision_system = collisions

func clear_all() -> void:
	for b in _blocks:
		if is_instance_valid(b):
			b.queue_free()
	_blocks.clear()
	blocks_changed.emit(0)

func spawn_from_level(level: LevelData) -> void:
	clear_all()
	floor_row = maxi(level.grid_rows - 1, 5)
	# Recenter horizontally for this level width.
	var cols := level.grid_cols
	var total_w := float(cols - 1) * CELL
	origin = Vector2(360.0 - total_w * 0.5, 200.0)
	for i in level.layout.size():
		var code := String(level.layout[i]).strip_edges()
		if code == "." or code.is_empty():
			continue
		var col := i % cols
		var row := int(i / float(cols))
		var parsed := _parse_cell(code)
		var block: BlockEntity = block_scene.instantiate()
		blocks_root.add_child(block)
		block.configure(parsed.color, parsed.kind, Vector2i(col, row))
		block.global_position = cell_to_world(Vector2i(col, row))
		block.destroyed.connect(_on_block_destroyed)
		_blocks.append(block)
		# Staggered spawn pop
		block.scale = Vector2.ZERO
		var tw := block.create_tween()
		tw.tween_property(block, "scale", Vector2.ONE, 0.28).set_delay(0.02 * float(row + col)).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	blocks_changed.emit(_blocks.size())

func cell_to_world(cell: Vector2i) -> Vector2:
	return origin + Vector2(cell.x * CELL, cell.y * CELL)

func world_to_cell(pos: Vector2) -> Vector2i:
	var local := pos - origin
	return Vector2i(roundi(local.x / CELL), roundi(local.y / CELL))

func get_blocks() -> Array[BlockEntity]:
	_prune()
	return _blocks

func remaining() -> int:
	_prune()
	return _blocks.size()

func resolve_impact(block: BlockEntity, color: BlockDefs.BloomColor) -> Dictionary:
	## Returns scoring payload for ScoreSystem.
	var payload := {
		"destroyed_count": 0,
		"chain_depth": 0,
		"had_aoe": false,
		"durable_hits": 0,
		"matched": false,
	}
	if block == null or not is_instance_valid(block):
		return payload

	var hit := block.apply_hit(color)
	if hit.get("chipped", false):
		payload["durable_hits"] = 1
		return payload

	if not hit.get("destroyed", false):
		return payload

	payload["matched"] = hit.get("matched", false)
	var to_clear: Array[BlockEntity] = []

	if hit.get("matched", false):
		var cluster := collision_system.find_cluster(block, get_blocks())
		# Require at least 2 total (projectile color matched into a group of 2+ blocks)
		# or single if it's AOE seed.
		if cluster.size() >= 2 or hit.get("aoe", false):
			for c in cluster:
				if c != block and is_instance_valid(c) and not c.is_destroying:
					to_clear.append(c)
		elif cluster.size() < 2 and not hit.get("aoe", false):
			# Lone wrong-size match: still destroy the one we hit if same color? Keep arcade feel: destroy contacted same-color always, chains need 2+.
			pass

	if hit.get("aoe", false) or (block.kind == BlockDefs.BlockKind.AOE and hit.get("matched", false)):
		payload["had_aoe"] = true
		for n in collision_system.find_aoe_neighbors(block, get_blocks(), 120.0):
			if not to_clear.has(n):
				to_clear.append(n)

	# Destroy primary already animating; destroy cluster
	for c in to_clear:
		if not is_instance_valid(c) or c.is_destroying:
			continue
		if payload["had_aoe"] and c.bloom_color != color:
			c.apply_hit(color, true)
		else:
			c.begin_destroy("chain")

	payload["destroyed_count"] = 1 + to_clear.size()
	cluster_cleared.emit(payload["destroyed_count"])

	# Deferred chain after fall settle
	call_deferred("_run_chains", payload)
	return payload

func _run_chains(payload: Dictionary) -> void:
	await get_tree().create_timer(0.2).timeout
	await _apply_gravity()
	await get_tree().create_timer(0.05).timeout
	var depth := 0
	while depth < 6:
		var clusters: Array = collision_system.settle_matches(get_blocks())
		if clusters.is_empty():
			break
		depth += 1
		payload["chain_depth"] = depth
		for cluster in clusters:
			for b in cluster:
				var be := b as BlockEntity
				if be and is_instance_valid(be) and not be.is_destroying:
					if be.kind == BlockDefs.BlockKind.AOE:
						payload["had_aoe"] = true
						for n in collision_system.find_aoe_neighbors(be, get_blocks(), 120.0):
							if is_instance_valid(n) and not n.is_destroying:
								n.apply_hit(be.bloom_color, true)
					be.begin_destroy("settle_chain")
					payload["destroyed_count"] = int(payload["destroyed_count"]) + 1
		AudioManager.play_chain(depth)
		await get_tree().create_timer(0.2).timeout
		await _apply_gravity()
	payload["remaining_blocks"] = remaining()
	blocks_changed.emit(remaining())
	resolution_finished.emit(payload)

func _apply_gravity() -> void:
	_prune()
	# Column-wise pack downward into empty cells within occupied footprint.
	var by_col: Dictionary = {}
	for b in _blocks:
		var c := world_to_cell(b.global_position).x
		if not by_col.has(c):
			by_col[c] = []
		by_col[c].append(b)
	var tweens := 0
	for col in by_col.keys():
		var list: Array = by_col[col]
		list.sort_custom(func(a: BlockEntity, b: BlockEntity) -> bool: return a.global_position.y > b.global_position.y)
		for i in list.size():
			var block: BlockEntity = list[i]
			# Pack from bottom of level footprint upward.
			var target_row := floor_row - i
			var target := cell_to_world(Vector2i(col, target_row))
			if absf(block.global_position.y - target.y) > 1.0:
				block.fall_to(target.y, 0.2)
				block.grid_pos = Vector2i(col, target_row)
				tweens += 1
	if tweens > 0:
		await get_tree().create_timer(0.22).timeout

func _on_block_destroyed(block: BlockEntity, _reason: String) -> void:
	_blocks.erase(block)
	blocks_changed.emit(remaining())

func _prune() -> void:
	_blocks = _blocks.filter(func(b: BlockEntity) -> bool: return is_instance_valid(b) and not b.is_queued_for_deletion())

func _parse_cell(code: String) -> Dictionary:
	var kind := BlockDefs.BlockKind.COMMON
	var body := code
	if code.ends_with("2"):
		kind = BlockDefs.BlockKind.DURABLE
		body = code.substr(0, code.length() - 1)
	elif code.ends_with("X"):
		kind = BlockDefs.BlockKind.AOE
		body = code.substr(0, code.length() - 1)
	var color := BlockDefs.BloomColor.ROSE
	match body.to_upper():
		"R": color = BlockDefs.BloomColor.ROSE
		"A": color = BlockDefs.BloomColor.AQUA
		"S": color = BlockDefs.BloomColor.SUN
		"V": color = BlockDefs.BloomColor.VIOLET
		"L": color = BlockDefs.BloomColor.LIME
	return {"color": color, "kind": kind}
