extends Node

## Offline stub for Etapa A — versioned local save, ready for progression later.

const SAVE_PATH := "user://puzzle_bloom_save.json"
const SAVE_VERSION := 1

var _data: Dictionary = {
	"version": SAVE_VERSION,
	"high_scores": {},
	"clears": {},
}

func _ready() -> void:
	load_save()

func load_save() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	if typeof(parsed) == TYPE_DICTIONARY:
		_data = parsed
		if int(_data.get("version", 0)) != SAVE_VERSION:
			_migrate()

func persist() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		return
	f.store_string(JSON.stringify(_data, "\t"))

func record_level_clear(level_id: String, score: int) -> void:
	var highs: Dictionary = _data.get("high_scores", {})
	highs[level_id] = maxi(int(highs.get(level_id, 0)), score)
	_data["high_scores"] = highs
	var clears: Dictionary = _data.get("clears", {})
	clears[level_id] = true
	_data["clears"] = clears
	persist()

func get_high_score(level_id: String) -> int:
	var highs: Dictionary = _data.get("high_scores", {})
	return int(highs.get(level_id, 0))

func _migrate() -> void:
	_data["version"] = SAVE_VERSION
	persist()
