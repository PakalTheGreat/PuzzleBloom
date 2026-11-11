class_name RevealController
extends Node2D

## Progressive illustration under the blocks — garden dawn vignette painted procedurally.

var total_cells: int = 1
var cleared: int = 0
var _noise: FastNoiseLite

func _ready() -> void:
	_noise = FastNoiseLite.new()
	_noise.seed = 77
	_noise.frequency = 0.035
	z_index = -5
	queue_redraw()

func configure(cell_count: int) -> void:
	total_cells = maxi(cell_count, 1)
	cleared = 0
	queue_redraw()

func register_clear(n: int) -> void:
	cleared = mini(total_cells, cleared + n)
	queue_redraw()

func progress() -> float:
	return clampf(float(cleared) / float(total_cells), 0.0, 1.0)

func _draw() -> void:
	var rect := Rect2(48, 160, 624, 760)
	var p := progress()
	# Dim veil that lifts as blocks clear
	var veil := 0.82 - p * 0.72
	draw_rect(rect, Color(0.06, 0.1, 0.14, veil))

	# Soft painted garden (always under veil)
	_draw_sky(rect, p)
	_draw_hills(rect, p)
	_draw_flower(rect.position + Vector2(rect.size.x * 0.5, rect.size.y * 0.58), 38.0 + p * 22.0, p)
	_draw_flower(rect.position + Vector2(rect.size.x * 0.32, rect.size.y * 0.66), 22.0 + p * 12.0, p)
	_draw_flower(rect.position + Vector2(rect.size.x * 0.68, rect.size.y * 0.64), 26.0 + p * 14.0, p)

	# Sparkle dust when nearly clear
	if p > 0.45:
		var spark_n := int(lerp(4.0, 28.0, p))
		for i in spark_n:
			var nx := _noise.get_noise_2d(float(i * 17), 3.0)
			var ny := _noise.get_noise_2d(9.0, float(i * 13))
			var sp := rect.position + Vector2((nx * 0.5 + 0.5) * rect.size.x, (ny * 0.5 + 0.5) * rect.size.y)
			var a := (p - 0.45) * 1.6
			draw_circle(sp, 2.0 + (i % 3), Color(1, 0.95, 0.75, a * 0.55))

func _draw_sky(rect: Rect2, p: float) -> void:
	var top := Color(0.35, 0.55, 0.72, 0.35 + p * 0.45)
	var bot := Color(0.95, 0.72, 0.55, 0.25 + p * 0.4)
	for i in 12:
		var t := float(i) / 12.0
		var y0 := rect.position.y + rect.size.y * t
		var y1 := rect.position.y + rect.size.y * (t + 1.0 / 12.0)
		draw_rect(Rect2(rect.position.x, y0, rect.size.x, y1 - y0), top.lerp(bot, t))

func _draw_hills(rect: Rect2, p: float) -> void:
	var base_y := rect.end.y - 40.0
	var pts := PackedVector2Array([Vector2(rect.position.x, rect.end.y), Vector2(rect.end.x, rect.end.y)])
	for i in 16:
		var t := float(i) / 15.0
		var x := rect.position.x + rect.size.x * t
		var h := 70.0 + sin(t * TAU * 1.5) * 28.0 + _noise.get_noise_1d(t * 40.0) * 20.0
		pts.insert(pts.size() - 1, Vector2(x, base_y - h * (0.55 + p * 0.45)))
	draw_colored_polygon(pts, Color(0.18, 0.42, 0.34, 0.35 + p * 0.45))
	# Front hill
	var pts2 := PackedVector2Array([Vector2(rect.position.x, rect.end.y), Vector2(rect.end.x, rect.end.y)])
	for i in 12:
		var t := float(i) / 11.0
		var x := rect.position.x + rect.size.x * t
		var h := 40.0 + cos(t * TAU) * 16.0
		pts2.insert(pts2.size() - 1, Vector2(x, base_y - h * (0.4 + p * 0.5) + 20.0))
	draw_colored_polygon(pts2, Color(0.14, 0.34, 0.28, 0.4 + p * 0.4))

func _draw_flower(center: Vector2, radius: float, p: float) -> void:
	var a := 0.2 + p * 0.75
	for i in 5:
		var ang := -PI * 0.5 + TAU * float(i) / 5.0
		var tip := center + Vector2(cos(ang), sin(ang)) * radius
		draw_circle(tip, radius * 0.42, Color(1.0, 0.55, 0.72, a))
	draw_circle(center, radius * 0.32, Color(1.0, 0.85, 0.35, a))
	draw_circle(center, radius * 0.14, Color(1.0, 0.55, 0.2, a))
