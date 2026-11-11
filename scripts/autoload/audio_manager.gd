extends Node

## Musical SFX hierarchy + soft ambient bed (procedural, intentional).

var _sfx: AudioStreamPlayer
var _bed: AudioStreamPlayer
var _gen: AudioStreamGenerator
var _bed_gen: AudioStreamGenerator
var _busy_until_ms: int = 0
var _bed_phase: float = 0.0
var _bed_on: bool = false

func _ready() -> void:
	_gen = AudioStreamGenerator.new()
	_gen.mix_rate = 22050.0
	_gen.buffer_length = 0.5
	_sfx = AudioStreamPlayer.new()
	_sfx.stream = _gen
	_sfx.volume_db = -6.0
	add_child(_sfx)

	_bed_gen = AudioStreamGenerator.new()
	_bed_gen.mix_rate = 22050.0
	_bed_gen.buffer_length = 0.4
	_bed = AudioStreamPlayer.new()
	_bed.stream = _bed_gen
	_bed.volume_db = -22.0
	add_child(_bed)
	start_bed()

func _process(_delta: float) -> void:
	if not _bed_on:
		return
	if not _bed.playing:
		_bed.play()
	var pb := _bed.get_stream_playback() as AudioStreamGeneratorPlayback
	if pb == null:
		return
	var rate := _bed_gen.mix_rate
	var frames := pb.get_frames_available()
	for i in frames:
		_bed_phase += 1.0 / rate
		var t := _bed_phase
		# Soft pentatonic pad: A3 + C4 + E4 breath
		var s := 0.0
		s += sin(TAU * 220.0 * t) * 0.045
		s += sin(TAU * 261.63 * t) * 0.03
		s += sin(TAU * 329.63 * t) * 0.025
		s *= 0.55 + 0.45 * sin(t * 0.35)
		pb.push_frame(Vector2(s, s))

func start_bed() -> void:
	_bed_on = true
	if not _bed.playing:
		_bed.play()

func stop_bed() -> void:
	_bed_on = false
	_bed.stop()

func play_shoot() -> void:
	_tone([
		{"f": 392.0, "d": 0.04, "a": 0.22, "dec": 18.0},
		{"f": 523.25, "d": 0.07, "a": 0.2, "dec": 14.0, "delay": 0.03},
	])

func play_impact() -> void:
	_tone([{"f": 140.0, "d": 0.07, "a": 0.32, "dec": 22.0}])

func play_miss() -> void:
	_tone([{"f": 110.0, "d": 0.1, "a": 0.28, "dec": 16.0}, {"f": 90.0, "d": 0.08, "a": 0.18, "dec": 12.0, "delay": 0.05}])

func play_match(combo: int = 1) -> void:
	var base := 523.25 * pow(1.05946, float(mini(combo, 7)))
	_tone([
		{"f": base, "d": 0.08, "a": 0.28, "dec": 12.0},
		{"f": base * 1.5, "d": 0.1, "a": 0.18, "dec": 10.0, "delay": 0.04},
	])

func play_chain(depth: int = 1) -> void:
	var f := 659.25 * pow(1.05946, float(depth))
	_tone([
		{"f": f, "d": 0.09, "a": 0.26, "dec": 11.0},
		{"f": f * 1.25, "d": 0.11, "a": 0.2, "dec": 9.0, "delay": 0.05},
	])

func play_aoe() -> void:
	_tone([
		{"f": 180.0, "d": 0.12, "a": 0.35, "dec": 10.0},
		{"f": 360.0, "d": 0.14, "a": 0.22, "dec": 8.0, "delay": 0.06},
		{"f": 540.0, "d": 0.1, "a": 0.16, "dec": 10.0, "delay": 0.12},
	])

func play_win() -> void:
	_tone([
		{"f": 523.25, "d": 0.12, "a": 0.28, "dec": 8.0},
		{"f": 659.25, "d": 0.12, "a": 0.26, "dec": 8.0, "delay": 0.1},
		{"f": 783.99, "d": 0.14, "a": 0.28, "dec": 7.0, "delay": 0.2},
		{"f": 1046.5, "d": 0.22, "a": 0.3, "dec": 6.0, "delay": 0.32},
	])

func play_lose() -> void:
	_tone([
		{"f": 349.23, "d": 0.14, "a": 0.26, "dec": 8.0},
		{"f": 293.66, "d": 0.16, "a": 0.24, "dec": 7.0, "delay": 0.12},
		{"f": 220.0, "d": 0.28, "a": 0.28, "dec": 5.0, "delay": 0.26},
	])

func _tone(notes: Array) -> void:
	var now := Time.get_ticks_msec()
	if now < _busy_until_ms and notes.size() == 1:
		return
	if not _sfx.playing:
		_sfx.play()
	var pb := _sfx.get_stream_playback() as AudioStreamGeneratorPlayback
	if pb == null:
		return
	var rate := _gen.mix_rate
	var max_end := 0
	for n in notes:
		var delay := float(n.get("delay", 0.0))
		var dur := float(n.get("d", 0.08))
		max_end = maxi(max_end, int((delay + dur) * rate) + 4)
	if pb.get_frames_available() < max_end:
		return
	var buf := PackedVector2Array()
	buf.resize(max_end)
	for i in max_end:
		buf[i] = Vector2.ZERO
	for n in notes:
		var f := float(n.get("f", 440.0))
		var dur := float(n.get("d", 0.08))
		var amp := float(n.get("a", 0.2))
		var dec := float(n.get("dec", 12.0))
		var delay := float(n.get("delay", 0.0))
		var start := int(delay * rate)
		var samples := int(dur * rate)
		for i in samples:
			var idx := start + i
			if idx >= max_end:
				break
			var t := float(i) / rate
			var env := exp(-dec * t) * (1.0 - t / maxf(dur, 0.001))
			var sample := sin(TAU * f * t) * amp * env
			# Soft square blend for mobile presence
			sample = lerpf(sample, signf(sample) * amp * env * 0.35, 0.2)
			buf[idx] += Vector2(sample, sample)
	for i in max_end:
		pb.push_frame(buf[i])
	_busy_until_ms = now + int(float(max_end) / rate * 1000.0 * 0.4)
