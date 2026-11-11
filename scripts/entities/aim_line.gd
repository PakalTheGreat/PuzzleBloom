class_name AimLine
extends Node2D

## Elastic multi-bounce aim preview with soft same-color assist magnet.

var origin: Vector2 = Vector2.ZERO
var aim_dir: Vector2 = Vector2.UP
var raw_dir: Vector2 = Vector2.UP
var bloom_color: BlockDefs.BloomColor = BlockDefs.BloomColor.ROSE
var active: bool = false
var play_rect: Rect2 = Rect2(40, 120, 640, 980)
var assist_target: Vector2 = Vector2.ZERO
var assist_strength: float = 0.0
var _elastic: float = 0.0

func set_aim(from: Vector2, dir: Vector2, color: BlockDefs.BloomColor, blocks: Array = []) -> void:
	origin = from
	raw_dir = dir.normalized()
	bloom_color = color
	_compute_assist(blocks)
	var blended := raw_dir
	if assist_strength > 0.0 and assist_target != Vector2.ZERO:
		var to_assist := (assist_target - from).normalized()
		blended = raw_dir.lerp(to_assist, assist_strength).normalized()
	aim_dir = blended
	active = dir.length() > 0.05
	_elastic = lerpf(_elastic, 1.0, 0.35)
	queue_redraw()

func clear_aim() -> void:
	active = false
	assist_strength = 0.0
	_elastic = 0.0
	queue_redraw()

func _compute_assist(blocks: Array) -> void:
	assist_strength = 0.0
	assist_target = Vector2.ZERO
	if blocks.is_empty():
		return
	var best_score: float = 0.0
	var best_pos: Vector2 = Vector2.ZERO
	for item in blocks:
		var b := item as BlockEntity
		if b == null or not is_instance_valid(b):
			continue
		if b.bloom_color != bloom_color:
			continue
		if b.is_destroying:
			continue
		var to: Vector2 = b.global_position - origin
		var dist: float = to.length()
		if dist < 80.0 or dist > 720.0:
			continue
		var dirn: Vector2 = to.normalized()
		var alignment: float = raw_dir.dot(dirn)
		if alignment < 0.88:
			continue
		var score: float = alignment * (1.0 - dist / 900.0)
		if score > best_score:
			best_score = score
			best_pos = b.global_position
	if best_score > 0.0:
		assist_target = best_pos
		# Soft assist — never locks fully
		assist_strength = clampf((best_score - 0.75) * 1.4, 0.0, 0.28)

func get_fire_dir() -> Vector2:
	return aim_dir

func _draw() -> void:
	if not active:
		return
	var c: Color = BlockDefs.COLOR_HEX[bloom_color]
	var dir := aim_dir
	var pos := origin
	var remaining := 980.0 * (0.85 + _elastic * 0.15)
	var segments: PackedVector2Array = PackedVector2Array([pos])
	var bounces := 0
	while remaining > 0.0 and bounces < 4:
		var dest := pos + dir * remaining
		var hit_x := _wall_hit(pos, dest)
		if hit_x < 0.0:
			segments.append(dest)
			break
		var hit_pos := pos.lerp(dest, hit_x)
		segments.append(hit_pos)
		var traveled := pos.distance_to(hit_pos)
		remaining -= traveled
		pos = hit_pos + Vector2(-signf(dir.x), 0) * 1.2
		dir = Vector2(-dir.x, dir.y).normalized()
		bounces += 1

	# Thick glow ribbon
	for i in range(segments.size() - 1):
		var a := segments[i]
		var b := segments[i + 1]
		var fade := 1.0 - float(i) / float(maxi(segments.size(), 1))
		draw_line(a, b, Color(c.r, c.g, c.b, 0.12 * fade), 16.0, true)
		draw_line(a, b, Color(c.r, c.g, c.b, 0.55 * fade), 5.0, true)
		draw_line(a, b, Color(1, 1, 1, 0.35 * fade), 1.6, true)

	# Elastic beads
	var phase := Time.get_ticks_msec() * 0.012
	var dist_acc := 0.0
	for i in range(segments.size() - 1):
		var a := segments[i]
		var b := segments[i + 1]
		var seg_len := a.distance_to(b)
		var d := fmod(phase * 18.0, 26.0)
		while d < seg_len:
			var p := a.lerp(b, d / seg_len)
			var pulse := 0.55 + 0.45 * sin(phase + dist_acc * 0.08)
			draw_circle(p, 3.6 * pulse, Color(1, 1, 1, 0.4 * pulse))
			d += 26.0
			dist_acc += 26.0

	if assist_strength > 0.05:
		draw_arc(assist_target, 28.0, 0.0, TAU, 32, Color(c.r, c.g, c.b, 0.35 * assist_strength / 0.28), 2.0, true)

	if segments.size() >= 2:
		var tip: Vector2 = segments[segments.size() - 1]
		draw_circle(tip, 10.0, Color(c.r, c.g, c.b, 0.4))
		draw_circle(tip, 4.5, Color.WHITE)

func _wall_hit(from: Vector2, to: Vector2) -> float:
	var left := play_rect.position.x + 22.0
	var right := play_rect.end.x - 22.0
	if to.x <= left and from.x > left:
		return clampf((left - from.x) / (to.x - from.x), 0.0, 1.0)
	if to.x >= right and from.x < right:
		return clampf((right - from.x) / (to.x - from.x), 0.0, 1.0)
	var top := play_rect.position.y + 12.0
	if to.y <= top and from.y > top:
		return clampf((top - from.y) / (to.y - from.y), 0.0, 1.0)
	return -1.0

func _process(_delta: float) -> void:
	if active:
		queue_redraw()
