extends Node2D

var target: Vector2 = Vector2(120, 70)
var amount: int = 50
var tint: Color = Color("ffe66d")
var _t: float = 0.0
var _start: Vector2
var _mid: Vector2

func setup(from: Vector2, to: Vector2, value: int, color: Color) -> void:
	global_position = from
	_start = from
	target = to
	amount = value
	tint = color
	_mid = from.lerp(to, 0.45) + Vector2(randf_range(-80, 80), randf_range(-120, -40))
	z_index = 40
	queue_redraw()

func _process(delta: float) -> void:
	_t += delta * 1.65
	var u := clampf(_t, 0.0, 1.0)
	# Quadratic bezier
	var a := _start.lerp(_mid, u)
	var b := _mid.lerp(target, u)
	global_position = a.lerp(b, u)
	queue_redraw()
	if _t >= 1.0:
		queue_free()

func _draw() -> void:
	var fade := 1.0 - smoothstep(0.75, 1.0, _t)
	draw_circle(Vector2.ZERO, 7.0, Color(tint.r, tint.g, tint.b, 0.85 * fade))
	draw_circle(Vector2(-2, -2), 2.5, Color(1, 1, 1, 0.7 * fade))
	# Tiny star points
	for i in 4:
		var ang := TAU * float(i) / 4.0 + _t * 6.0
		draw_line(Vector2.ZERO, Vector2(cos(ang), sin(ang)) * 11.0, Color(1, 1, 1, 0.45 * fade), 1.5, true)
