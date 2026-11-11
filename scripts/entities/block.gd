class_name BlockEntity
extends RigidBody2D

signal damaged(remaining: int)
signal destroyed(block: BlockEntity, reason: String)

const SIZE := 68.0

@export var bloom_color: BlockDefs.BloomColor = BlockDefs.BloomColor.ROSE
@export var kind: BlockDefs.BlockKind = BlockDefs.BlockKind.COMMON
@export var max_hp: int = 1

var hp: int = 1
var grid_pos: Vector2i = Vector2i.ZERO
var is_destroying: bool = false
var _pulse: float = 0.0
var _mat: ShaderMaterial
var _shader: Shader = preload("res://assets/shaders/bloom_block.gdshader")

@onready var visual: ColorRect = $Visual
@onready var badge: Label = $Badge
@onready var collision: CollisionShape2D = $CollisionShape2D
@onready var spark: GPUParticles2D = $HitSpark
@onready var aura: GPUParticles2D = $Aura

func _ready() -> void:
	freeze = true
	freeze_mode = RigidBody2D.FREEZE_MODE_KINEMATIC
	gravity_scale = 0.0
	lock_rotation = true
	collision_layer = 2
	collision_mask = 0
	hp = max_hp
	_setup_visual()
	_apply_palette()
	_update_badge()
	_configure_particles()
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
		_configure_particles()

func _setup_visual() -> void:
	visual.size = Vector2(SIZE, SIZE)
	visual.position = Vector2(-SIZE * 0.5, -SIZE * 0.5)
	_mat = ShaderMaterial.new()
	_mat.shader = _shader
	visual.material = _mat
	var shape := CircleShape2D.new()
	shape.radius = SIZE * 0.42
	collision.shape = shape

func _apply_palette() -> void:
	if _mat == null:
		return
	var base: Color = BlockDefs.COLOR_HEX[bloom_color]
	var deep: Color = BlockDefs.COLOR_DEEP[bloom_color]
	var glow: Color = BlockDefs.COLOR_GLOW[bloom_color]
	_mat.set_shader_parameter("base_color", base)
	_mat.set_shader_parameter("deep_color", deep)
	_mat.set_shader_parameter("glow_color", glow)
	_mat.set_shader_parameter("time_offset", randf() * 10.0)
	match kind:
		BlockDefs.BlockKind.COMMON:
			_mat.set_shader_parameter("shape_mode", 0)
			_mat.set_shader_parameter("bevel", 0.74)
			_mat.set_shader_parameter("specular", 0.58)
			_mat.set_shader_parameter("glow_strength", 0.05)
		BlockDefs.BlockKind.DURABLE:
			_mat.set_shader_parameter("shape_mode", 1)
			_mat.set_shader_parameter("bevel", 0.55)
			_mat.set_shader_parameter("specular", 0.35)
			_mat.set_shader_parameter("glow_strength", 0.0)
			_mat.set_shader_parameter("deep_color", deep.darkened(0.2).lerp(Color(0.25, 0.28, 0.35), 0.35))
		BlockDefs.BlockKind.AOE:
			_mat.set_shader_parameter("shape_mode", 2)
			_mat.set_shader_parameter("bevel", 0.7)
			_mat.set_shader_parameter("specular", 0.7)
			_mat.set_shader_parameter("glow_strength", 0.85)

func _configure_particles() -> void:
	if spark and spark.process_material is ParticleProcessMaterial:
		var pm := spark.process_material as ParticleProcessMaterial
		pm.color = BlockDefs.COLOR_GLOW[bloom_color]
	if aura:
		aura.emitting = kind == BlockDefs.BlockKind.AOE
		if aura.process_material is ParticleProcessMaterial:
			var am := aura.process_material as ParticleProcessMaterial
			am.color = Color(BlockDefs.COLOR_GLOW[bloom_color], 0.55)

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
	_pulse += delta * (2.2 if kind != BlockDefs.BlockKind.AOE else 3.4)
	var breathe := 1.0 + sin(_pulse) * (0.03 if kind != BlockDefs.BlockKind.DURABLE else 0.015)
	if kind == BlockDefs.BlockKind.AOE:
		breathe += sin(_pulse * 1.6) * 0.025
	scale = Vector2.ONE * breathe

func apply_hit(from_color: BlockDefs.BloomColor, is_aoe_wave: bool = false) -> Dictionary:
	var result := {"destroyed": false, "matched": false, "aoe": false, "chipped": false}
	if is_destroying:
		return result
	_flash()
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
	if from_color == bloom_color or is_aoe_wave:
		result["matched"] = from_color == bloom_color
		if kind == BlockDefs.BlockKind.AOE and from_color == bloom_color:
			result["aoe"] = true
		result["destroyed"] = true
		begin_destroy("match" if not is_aoe_wave else "aoe")
		return result
	return result

func _flash() -> void:
	if _mat == null:
		return
	_mat.set_shader_parameter("damage_flash", 1.0)
	var tw := create_tween()
	tw.tween_method(func(v: float) -> void:
		if _mat:
			_mat.set_shader_parameter("damage_flash", v)
	, 1.0, 0.0, 0.18)

func begin_destroy(reason: String) -> void:
	if is_destroying:
		return
	is_destroying = true
	collision.set_deferred("disabled", true)
	destroyed.emit(self, reason)
	var burst_color: Color = BlockDefs.COLOR_HEX[bloom_color]
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "scale", Vector2(1.45, 1.45), 0.09).set_trans(Tween.TRANS_BACK)
	tw.tween_property(self, "modulate:a", 0.0, 0.2).set_delay(0.05)
	if _mat:
		tw.tween_method(func(v: float) -> void:
			if _mat:
				_mat.set_shader_parameter("glow_strength", v)
		, float(_mat.get_shader_parameter("glow_strength")), 1.6, 0.12)
	tw.chain().tween_callback(func() -> void:
		# Leave a brief color hint for FX spawner via meta
		set_meta("burst_color", burst_color)
		queue_free()
	)

func fall_to(y: float, duration: float = 0.22) -> void:
	var tw := create_tween()
	tw.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(self, "global_position:y", y, duration)
