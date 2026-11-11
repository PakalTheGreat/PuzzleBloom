class_name LevelData
extends Resource

@export var level_id: String = "garden_01"
@export var display_name: String = "Dawn Petals"
@export var shot_budget: int = 18
@export var target_score: int = 1200
@export var grid_cols: int = 7
@export var grid_rows: int = 8
@export var seed: int = 42
## Row-major cell codes: "R","A","S","V","L" + optional suffix "2"=durable, "X"=AoE, "."=empty
@export var layout: PackedStringArray = PackedStringArray()

static func etapa_a_level() -> LevelData:
	var data := LevelData.new()
	data.level_id = "garden_01"
	data.display_name = "Dawn Petals"
	data.shot_budget = 20
	data.target_score = 1000
	data.grid_cols = 7
	data.grid_rows = 9
	data.seed = 11011
	# Hand-crafted opening: clear clusters, one durable belt, one AoE seed.
	data.layout = PackedStringArray([
		".", "R", "R", "A", "A", "S", ".",
		"V", "R", "A", "A", "S", "S", "V",
		"V", "V", "R2", "S", "L", "L", "A",
		"R", "A", "S", "L", "L", "V", "R",
		"R", "A", "A", "VX", "S", "S", "R",
		".", "V", "V", "R", "R", "A", ".",
		".", ".", "S", "S", "A", ".", ".",
		".", ".", ".", "L2", ".", ".", ".",
		".", ".", ".", ".", ".", ".", ".",
	])
	return data
