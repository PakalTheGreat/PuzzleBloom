extends Node

## Procedural SFX via AudioStreamGenerator — intentional tones, no missing assets.

var _player: AudioStreamPlayer
var _gen: AudioStreamGenerator
var _playback: AudioStreamGeneratorPlayback
var _busy_until_ms: int = 0

func _ready() -> void:
	_gen = AudioStreamGenerator.new()
	_gen.mix_rate = 22050.0
	_gen.buffer_length = 0.35
	_player = AudioStreamPlayer.new()
	_player.stream = _gen
	_player.volume_db = -8.0
	_player.bus = &"Master"
	add_child(_player)

func play_shoot() -> void:
	_beep(880.0, 0.06, 0.22, 0.35)

func play_impact() -> void:
	_beep(220.0, 0.05, 0.28, 0.4)

func play_match(combo: int = 1) -> void:
	var base := 520.0 + float(mini(combo, 6)) * 70.0
	_beep(base, 0.09, 0.25, 0.45)

func play_chain() -> void:
	_beep(740.0, 0.08, 0.2, 0.5)
	_beep(980.0, 0.1, 0.18, 0.35, 0.05)

func play_aoe() -> void:
	_beep(160.0, 0.16, 0.35, 0.55)

func play_win() -> void:
	_beep(523.25, 0.12, 0.25, 0.4)
	_beep(659.25, 0.12, 0.25, 0.4, 0.1)
	_beep(783.99, 0.18, 0.3, 0.5, 0.2)

func play_lose() -> void:
	_beep(300.0, 0.15, 0.3, 0.4)
	_beep(220.0, 0.22, 0.35, 0.45, 0.12)

func _beep(freq: float, dur: float, amp: float, decay: float, delay: float = 0.0) -> void:
	var now := Time.get_ticks_msec()
	if now < _busy_until_ms and delay <= 0.0:
		# Soft-drop overlapping clicks to avoid garble.
		return
	if not _player.playing:
		_player.play()
	_playback = _player.get_stream_playback() as AudioStreamGeneratorPlayback
	if _playback == null:
		return
	var rate := _gen.mix_rate
	var start := int(delay * rate)
	var samples := int(dur * rate)
	var total := start + samples
	if _playback.get_frames_available() < total:
		return
	for i in total:
		var t := float(i - start) / rate
		var sample := 0.0
		if i >= start:
			var env := exp(-decay * (t / maxf(dur, 0.001)))
			sample = sin(TAU * freq * t) * amp * env
			# Soft triangle blend for less harsh mobile tone.
			sample = lerpf(sample, sample * 0.65 + signf(sample) * 0.12, 0.35)
		_playback.push_frame(Vector2(sample, sample))
	_busy_until_ms = now + int((delay + dur) * 1000.0 * 0.55)
