class_name JuiceDirector
extends Node

## Central feel bus: shake, hitstop, camera punch, time-scale pulses.

signal combo_banner(text: String, color: Color)

var camera: Camera2D
var _shake_amp: float = 0.0
var _shake_time: float = 0.0
var _punch: Vector2 = Vector2.ZERO
var _base_offset: Vector2 = Vector2.ZERO
var _hitstop_left: float = 0.0
var _restore_scale: float = 1.0

func bind_camera(cam: Camera2D) -> void:
	camera = cam
	if camera:
		_base_offset = camera.offset

func _process(delta: float) -> void:
	if _hitstop_left > 0.0:
		_hitstop_left -= delta / maxf(Engine.time_scale, 0.001)
		if _hitstop_left <= 0.0:
			Engine.time_scale = _restore_scale
	if camera == null:
		return
	var shake_off := Vector2.ZERO
	if _shake_time > 0.0:
		_shake_time -= delta
		var t := clampf(_shake_time, 0.0, 1.0)
		shake_off = Vector2(
			randf_range(-1.0, 1.0),
			randf_range(-1.0, 1.0)
		) * _shake_amp * t
	_punch = _punch.lerp(Vector2.ZERO, 1.0 - exp(-12.0 * delta))
	camera.offset = _base_offset + shake_off + _punch

func shake(amplitude: float = 10.0, duration: float = 0.18) -> void:
	_shake_amp = maxf(_shake_amp, amplitude)
	_shake_time = maxf(_shake_time, duration)

func punch(dir: Vector2, amount: float = 14.0) -> void:
	_punch += dir.normalized() * amount

func hitstop(seconds: float = 0.06, scale: float = 0.08) -> void:
	if seconds <= 0.0:
		return
	_restore_scale = 1.0
	Engine.time_scale = scale
	_hitstop_left = seconds

func big_clear(block_count: int, combo: int) -> void:
	var power := clampf(float(block_count) * 0.35 + float(combo) * 0.5, 1.0, 8.0)
	shake(6.0 + power * 2.2, 0.12 + power * 0.02)
	punch(Vector2(0, 1), 8.0 + power * 1.5)
	if combo >= 2 or block_count >= 4:
		hitstop(0.045 + mini(combo, 5) * 0.012, 0.12)
	if combo >= 2:
		combo_banner.emit("BLOOM x%d" % combo, Color("ffe66d"))
	elif block_count >= 5:
		combo_banner.emit("PETAL BURST", Color("4ecdc4"))

func soft_tap() -> void:
	shake(2.5, 0.08)
	punch(Vector2(0, -1), 4.0)
