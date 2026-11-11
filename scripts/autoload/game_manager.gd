extends Node

signal state_changed(state: GameState)
signal level_ready(level: LevelData)
signal request_restart

enum GameState { BOOT, PLAYING, WON, LOST, PAUSED }

var state: GameState = GameState.BOOT
var current_level: LevelData
var high_score: int = 0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func start_level(level: LevelData = null) -> void:
	current_level = level if level else LevelData.etapa_a_level()
	_set_state(GameState.PLAYING)
	level_ready.emit(current_level)

func win(final_score: int) -> void:
	if state != GameState.PLAYING:
		return
	high_score = maxi(high_score, final_score)
	SaveSystem.record_level_clear(current_level.level_id, final_score)
	_set_state(GameState.WON)
	AudioManager.play_win()

func lose() -> void:
	if state != GameState.PLAYING:
		return
	_set_state(GameState.LOST)
	AudioManager.play_lose()

func toggle_pause() -> void:
	if state == GameState.PLAYING:
		_set_state(GameState.PAUSED)
		get_tree().paused = true
	elif state == GameState.PAUSED:
		get_tree().paused = false
		_set_state(GameState.PLAYING)

func restart() -> void:
	get_tree().paused = false
	request_restart.emit()
	start_level(current_level)

func _set_state(next: GameState) -> void:
	state = next
	state_changed.emit(state)
