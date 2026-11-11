class_name ScoreSystem
extends Node

signal score_changed(score: int, delta: int)
signal combo_changed(combo: int)

var score: int = 0
var combo: int = 0
var best_combo: int = 0
var blocks_cleared: int = 0

const BASE_MATCH := 50
const PER_BLOCK := 25
const COMBO_MULT := 0.35
const CHAIN_BONUS := 80
const AOE_BONUS := 120
const DURABLE_BONUS := 40

func reset() -> void:
	score = 0
	combo = 0
	best_combo = 0
	blocks_cleared = 0
	score_changed.emit(score, 0)
	combo_changed.emit(combo)

func register_match(block_count: int, chain_depth: int, had_aoe: bool, durable_hits: int) -> int:
	combo = maxi(1, combo + 1) if chain_depth == 0 else combo + 1
	best_combo = maxi(best_combo, combo)
	var mult := 1.0 + float(combo - 1) * COMBO_MULT + float(chain_depth) * 0.25
	var delta := int((BASE_MATCH + block_count * PER_BLOCK) * mult)
	delta += chain_depth * CHAIN_BONUS
	if had_aoe:
		delta += AOE_BONUS
	delta += durable_hits * DURABLE_BONUS
	blocks_cleared += block_count
	_add(delta)
	combo_changed.emit(combo)
	return delta

func register_chip() -> int:
	_add(10)
	return 10

func break_combo() -> void:
	combo = 0
	combo_changed.emit(combo)

func _add(delta: int) -> void:
	score += delta
	score_changed.emit(score, delta)
