class_name RevealController
extends Node2D

## Soft garden illustration under the petals — NO grey placeholder frame.

var total_cells: int = 1
var cleared: int = 0
var _noise: FastNoiseLite

func _ready() -> void:
	_noise = FastNoiseLite.new()
	_noise.seed = 77
	_noise.frequency = 0.04
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
	var p := progress()
	var rect := Rect2(40, 150, 640, 780)
	# Soft mist that lifts — pastel, never grey mesh
	var mist_a := 0.28 * (1.0 - p)
	if mist_a > 0.02:
		draw_rect(rect, Color(1.0, 0.94, 0.96, mist_a))
	# Gentle painted blooms appear as you clear
	var a := 0.15 + p * 0.7
	_draw_flower(Vector2(360, 520), 34.0 + p * 28.0, a)
	_draw_flower(Vector2(250, 600), 22.0 + p * 16.0, a * 0.9)
	_draw_flower(Vector2(470, 590), 24.0 + p * 18.0, a * 0.9)
	if p > 0.35:
		for i in int(lerp(3.0, 18.0, p)):
			var nx := _noise.get_noise_2d(float(i * 19), 2.0)
			var ny := _noise.get_noise_2d(4.0, float(i * 11))
			var sp := rect.position + Vector2((nx * 0.5 + 0.5) * rect.size.x, (ny * 0.5 + 0.5) * rect.size.y)
			draw_circle(sp, 2.0 + float(i % 3), Color(1, 0.85, 0.95, (p - 0.35) * 0.8))

func _draw_flower(center: Vector2, radius: float, a: float) -> void:
	for i in 5:
		var ang := -PI * 0.5 + TAU * float(i) / 5.0
		var tip := center + Vector2(cos(ang), sin(ang)) * radius
		draw_circle(tip, radius * 0.42, Color(1.0, 0.6, 0.75, a))
	draw_circle(center, radius * 0.3, Color(1.0, 0.88, 0.45, a))
