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
	# No hatch / mesh / grey panel — garden art shows clean under the cluster.
	var p := progress()
	if p < 0.05:
		return
	var a := clampf((p - 0.05) * 0.85, 0.0, 0.85)
	_draw_flower(Vector2(360, 520), 30.0 + p * 26.0, a)
	_draw_flower(Vector2(250, 600), 20.0 + p * 14.0, a * 0.9)
	_draw_flower(Vector2(470, 590), 22.0 + p * 16.0, a * 0.9)
	if p > 0.25:
		for i in int(lerp(2.0, 16.0, p)):
			var nx := _noise.get_noise_2d(float(i * 19), 2.0)
			var ny := _noise.get_noise_2d(4.0, float(i * 11))
			var sp := Vector2(80.0 + (nx * 0.5 + 0.5) * 560.0, 220.0 + (ny * 0.5 + 0.5) * 560.0)
			draw_circle(sp, 2.0 + float(i % 3), Color(1, 0.85, 0.95, (p - 0.25) * 0.7))

func _draw_flower(center: Vector2, radius: float, a: float) -> void:
	for i in 5:
		var ang := -PI * 0.5 + TAU * float(i) / 5.0
		var tip := center + Vector2(cos(ang), sin(ang)) * radius
		draw_circle(tip, radius * 0.42, Color(1.0, 0.6, 0.75, a))
	draw_circle(center, radius * 0.3, Color(1.0, 0.88, 0.45, a))
