class_name LevelData
extends Resource

@export var level_id: String = "garden_01"
@export var display_name: String = "Dawn Petals"
@export var shot_budget: int = 18
@export var target_score: int = 1200
@export var grid_cols: int = 7
@export var grid_rows: int = 8
@export var rng_seed: int = 42
@export var layout: PackedStringArray = PackedStringArray()

static func etapa_a_level() -> LevelData:
	var data := LevelData.new()
	data.level_id = "garden_01"
	data.display_name = "Petal Pals"
	data.shot_budget = 20
	data.target_score = 1200
	data.grid_cols = 7
	data.grid_rows = 8
	data.rng_seed = 24011
	# Tight cute blossom — larger pieces, less void, open violet lane into AoE hero.
	data.layout = PackedStringArray([
		".", "R", "R", "S", "R", "R", ".",
		"A", "R", "S", "VX", "S", "R", "A",
		"A", "V", "V", "V", "V", "V", "A",
		"L", "A", "S", "A", "S", "A", "L",
		".", "R", "A", "A", "A", "R", ".",
		".", "S2", "V", "V", "V", "S2", ".",
		".", ".", "R2", ".", "R2", ".", ".",
		".", ".", ".", "V", ".", ".", ".",
	])
	return data
