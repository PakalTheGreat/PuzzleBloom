class_name LevelData
extends Resource

@export var level_id: String = "garden_01"
@export var display_name: String = "Dawn Petals"
@export var shot_budget: int = 18
@export var target_score: int = 1200
@export var grid_cols: int = 7
@export var grid_rows: int = 8
@export var rng_seed: int = 42
## Row-major cell codes: R/A/S/V/L + optional 2=durable, X=AoE, .=empty
@export var layout: PackedStringArray = PackedStringArray()

static func etapa_a_level() -> LevelData:
	var data := LevelData.new()
	data.level_id = "garden_01"
	data.display_name = "Dawn Petals"
	data.shot_budget = 22
	data.target_score = 1400
	data.grid_cols = 9
	data.grid_rows = 11
	data.rng_seed = 24011
	# Blossom silhouette with OPEN violet lane into the AoE seed.
	# Teach: shoot violet up the center → AoE detonates → cascade → peel durables.
	data.layout = PackedStringArray([
		".", ".", "R", "R", "S", "R", "R", ".", ".",
		".", "A", "R", "S", "S", "S", "R", "A", ".",
		".", "A", "A", "V", "VX", "V", "A", "A", ".",
		"L", "V", "V", "V", "V", "V", "V", "V", "L",
		"L", "R", "A", "S", "A", "S", "A", "R", "L",
		".", "R", "R", "A", "A", "A", "R", "R", ".",
		".", ".", "S2", "V", "V", "V", "S2", ".", ".",
		".", ".", ".", "R2", ".", "R2", ".", ".", ".",
		".", ".", ".", "V", "V", "V", ".", ".", ".",
		".", ".", ".", ".", ".", ".", ".", ".", ".",
		".", ".", ".", ".", ".", ".", ".", ".", ".",
	])
	return data
