extends Node2D

@onready var particles: GPUParticles2D = $Particles
@onready var ring: Polygon2D = $Ring

func play(color: Color) -> void:
	var mat := particles.process_material as ParticleProcessMaterial
	if mat:
		mat.color = color
	particles.restart()
	particles.emitting = true
	if ring:
		ring.color = Color(color.r, color.g, color.b, 0.55)
		ring.scale = Vector2(0.2, 0.2)
		var tw := create_tween()
		tw.set_parallel(true)
		tw.tween_property(ring, "scale", Vector2(2.4, 2.4), 0.28).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		tw.tween_property(ring, "modulate:a", 0.0, 0.28)
	var end := create_tween()
	end.tween_interval(0.75)
	end.tween_callback(queue_free)
