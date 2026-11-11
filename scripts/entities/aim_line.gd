class_name AimLine
extends Node2D

## Smooth quadratic aim preview with wall reflections.

var origin: Vector2 = Vector2.ZERO
var aim_dir: Vector2 = Vector2.UP
var bloom_color: BlockDefs.BloomColor = BlockDefs.BloomColor.ROSE
var active: bool = false
var play_rect: Rect2 = Rect2(40, 120, 640, 980)

func set_aim(from: Vector2, dir: Vector2, color: BlockDefs.BloomColor) -> void:
	origin = from
	aim_dir = dir.normalized()
	bloom_color = color
	active = dir.length() > 0.05
	queue_redraw()

func clear_aim() -> void:
	active = false
	queue_redraw()

func _draw() -> void:
	if not active:
		return
	var c: Color = BlockDefs.COLOR_HEX[bloom_color]
	var dir := aim_dir
	var pos := origin
	var remaining := 920.0
	var segments: PackedVector2Array = PackedVector2Array([pos])
	var bounces := 0
	while remaining > 0.0 and bounces < 3:
		var dest := pos + dir * remaining
		var hit_x := _wall_hit(pos, dest)
		if hit_x < 0.0:
			segments.append(dest)
			break
		var hit_pos := pos.lerp(dest, hit_x)
		segments.append(hit_pos)
		var traveled := pos.distance_to(hit_pos)
		remaining -= traveled
		pos = hit_pos + Vector2(signf(dir.x) * -1.0, 0) * 1.0
		dir = Vector2(-dir.x, dir.y).normalized()
		bounces += 1
	# Glow underlay
	for i in range(segments.size() - 1):
		var a := segments[i]
		var b := segments[i + 1]
		draw_line(a, b, Color(c.r, c.g, c.b, 0.18), 10.0, true)
		draw_line(a, b, Color(c.r, c.g, c.b, 0.75), 3.0, true)
	# Dots along path
	var dist_acc := 0.0
	for i in range(segments.size() - 1):
		var a := segments[i]
		var b := segments[i + 1]
		var seg_len := a.distance_to(b)
		var d := 0.0
		while d < seg_len:
			var p := a.lerp(b, d / seg_len)
			var pulse := 0.55 + 0.45 * sin(Time.get_ticks_msec() * 0.01 + dist_acc * 0.05)
			draw_circle(p, 3.2, Color(1, 1, 1, 0.35 * pulse))
			d += 28.0
			dist_acc += 28.0
	# Tip
	if segments.size() >= 2:
		var tip: Vector2 = segments[segments.size() - 1]
		draw_circle(tip, 7.0, Color(c.r, c.g, c.b, 0.55))
		draw_circle(tip, 3.5, Color.WHITE)

func _wall_hit(from: Vector2, to: Vector2) -> float:
	## Returns 0..1 along segment if hitting left/right wall, else -1.
	var left := play_rect.position.x + 20.0
	var right := play_rect.end.x - 20.0
	if to.x <= left and from.x > left:
		return clampf((left - from.x) / (to.x - from.x), 0.0, 1.0)
	if to.x >= right and from.x < right:
		return clampf((right - from.x) / (to.x - from.x), 0.0, 1.0)
	# Top bound soft stop for preview
	var top := play_rect.position.y + 10.0
	if to.y <= top and from.y > top:
		return clampf((top - from.y) / (to.y - from.y), 0.0, 1.0)
	return -1.0

func _process(_delta: float) -> void:
	if active:
		queue_redraw()
