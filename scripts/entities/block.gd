class_name BlockEntity
extends RigidBody2D

signal damaged(remaining: int)
signal destroyed(block: BlockEntity, reason: String)

const SIZE := 64.0

@export var bloom_color: BlockDefs.BloomColor = BlockDefs.BloomColor.ROSE
@export var kind: BlockDefs.BlockKind = BlockDefs.BlockKind.COMMON
@export var max_hp: int = 1

var hp: int = 1
var grid_pos: Vector2i = Vector2i.ZERO
var is_destroying: bool = false
var _pulse: float = 0.0
var _hit_flash: float = 0.0

@onready var visual: Polygon2D = $Visual
@onready var rim: Polygon2D = $Rim
@onready var highlight: Polygon2D = $Highlight
@onready var badge: Label = $Badge
@onready var collision: CollisionShape2D = $CollisionShape2D
@onready var spark: GPUParticles2D = $HitSpark

func _ready() -> void:
	freeze = true
	freeze_mode = RigidBody2D.FREEZE_MODE_KINEMATIC
	gravity_scale = 0.0
	lock_rotation = true
	collision_layer = 2
	collision_mask = 0
	hp = max_hp
	_build_shapes()
	_apply_palette()
	_update_badge()
	_pulse = randf() * TAU

func configure(color: BlockDefs.BloomColor, block_kind: BlockDefs.BlockKind, cell: Vector2i) -> void:
	bloom_color = color
	kind = block_kind
	grid_pos = cell
	match kind:
		BlockDefs.BlockKind.COMMON:
			max_hp = 1
		BlockDefs.BlockKind.DURABLE:
			max_hp = 3
		BlockDefs.BlockKind.AOE:
			max_hp = 1
	hp = max_hp
	if is_node_ready():
		_apply_palette()
		_update_badge()

func _build_shapes() -> void:
	var pts := PackedVector2Array()
	# Soft octagon — volumetric bloom stone silhouette.
	var r := SIZE * 0.46
	for i in 8:
		var a := TAU * float(i) / 8.0 + PI / 8.0
		var rr := r * (1.0 if i % 2 == 0 else 0.9)
		pts.append(Vector2(cos(a), sin(a)) * rr)
	visual.polygon = pts
	var rim_pts := PackedVector2Array()
	for i in 8:
		var a := TAU * float(i) / 8.0 + PI / 8.0
		rim_pts.append(Vector2(cos(a), sin(a)) * (r + 3.0))
	rim.polygon = rim_pts
	highlight.polygon = PackedVector2Array([
		Vector2(-14, -18), Vector2(8, -22), Vector2(4, -8), Vector2(-10, -6)
	])
	var shape := RectangleShape2D.new()
	shape.size = Vector2(SIZE * 0.82, SIZE * 0.82)
	collision.shape = shape

func _apply_palette() -> void:
	var base: Color = BlockDefs.COLOR_HEX[bloom_color]
	var deep: Color = BlockDefs.COLOR_DEEP[bloom_color]
	var glow: Color = BlockDefs.COLOR_GLOW[bloom_color]
	visual.color = base
	rim.color = deep.darkened(0.15)
	highlight.color = Color(glow.r, glow.g, glow.b, 0.55)
	if kind == BlockDefs.BlockKind.AOE:
		rim.color = Color("ffe66d")
		modulate = Color(1.05, 1.05, 1.1, 1.0)
	elif kind == BlockDefs.BlockKind.DURABLE:
		visual.color = base.lerp(Color(0.85, 0.85, 0.9), 0.18)

func _update_badge() -> void:
	if badge == null:
		return
	match kind:
		BlockDefs.BlockKind.DURABLE:
			badge.text = str(hp)
			badge.visible = true
		BlockDefs.BlockKind.AOE:
			badge.text = "✦"
			badge.visible = true
		_:
			badge.visible = false

func _process(delta: float) -> void:
	if is_destroying:
		return
	_pulse += delta * 2.4
	var breathe := 1.0 + sin(_pulse) * 0.025
	if kind == BlockDefs.BlockKind.AOE:
		breathe += sin(_pulse * 1.7) * 0.02
	scale = Vector2.ONE * breathe
	if _hit_flash > 0.0:
		_hit_flash = maxf(0.0, _hit_flash - delta * 4.0)
		visual.modulate = Color.WHITE.lerp(Color(2, 2, 2), _hit_flash)

func apply_hit(from_color: BlockDefs.BloomColor, is_aoe_wave: bool = false) -> Dictionary:
	## Returns {destroyed:bool, matched:bool, aoe:bool}
	var result := {"destroyed": false, "matched": false, "aoe": false, "chipped": false}
	if is_destroying:
		return result
	_hit_flash = 1.0
	if spark:
		spark.restart()
	if kind == BlockDefs.BlockKind.DURABLE and from_color != bloom_color and not is_aoe_wave:
		hp = maxi(0, hp - 1)
		_update_badge()
		damaged.emit(hp)
		result["chipped"] = true
		if hp <= 0:
			result["destroyed"] = true
			begin_destroy("durable")
		return result
	if from_color == bloom_color or is_aoe_wave or kind == BlockDefs.BlockKind.AOE and from_color == bloom_color:
		result["matched"] = from_color == bloom_color
		if kind == BlockDefs.BlockKind.AOE and from_color == bloom_color:
			result["aoe"] = true
		result["destroyed"] = true
		begin_destroy("match" if not is_aoe_wave else "aoe")
		return result
	# Wrong color on common: bounce impulse only (handled by projectile).
	return result

func begin_destroy(reason: String) -> void:
	if is_destroying:
		return
	is_destroying = true
	collision.set_deferred("disabled", true)
	destroyed.emit(self, reason)
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "scale", Vector2(1.35, 1.35), 0.08)
	tw.tween_property(self, "modulate:a", 0.0, 0.18).set_delay(0.05)
	tw.chain().tween_callback(queue_free)

func fall_to(y: float, duration: float = 0.22) -> void:
	var tw := create_tween()
	tw.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(self, "global_position:y", y, duration)
