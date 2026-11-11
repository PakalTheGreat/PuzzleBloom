extends Node2D

func _draw() -> void:
	var life := float(get_meta("life", 0.0))
	if life <= 0.0:
		return
	var color: Color = get_meta("color", Color("ffe66d"))
	for i in 16:
		var a := TAU * float(i) / 16.0 + (1.0 - life) * 2.0
		var r := lerpf(20.0, 140.0, 1.0 - life)
		var p := Vector2(cos(a), sin(a)) * r
		draw_circle(p, lerpf(6.0, 1.0, 1.0 - life), Color(color.r, color.g, color.b, life * 0.7))
