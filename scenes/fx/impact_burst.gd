extends Node2D

@onready var particles: GPUParticles2D = $Particles

func play(color: Color) -> void:
	var mat := particles.process_material as ParticleProcessMaterial
	if mat:
		mat.color = color
	particles.restart()
	particles.emitting = true
	var tw := create_tween()
	tw.tween_interval(0.7)
	tw.tween_callback(queue_free)
