class_name BlockEntity
extends RigidBody2D

signal damaged(remaining: int)
signal destroyed(block: BlockEntity, reason: String)

const SIZE := 108.0


@export var bloom_color: BlockDefs.BloomColor = BlockDefs.BloomColor.ROSE
@export var kind: BlockDefs.BlockKind = BlockDefs.BlockKind.COMMON
@export var max_hp: int = 1

var hp: int = 1
var grid_pos: Vector2i = Vector2i.ZERO
var is_destroying: bool = false
var _pulse: float = 0.0

@onready var body: Sprite2D = $Body
@onready var face: Sprite2D = $Face
@onready var badge: Label = $Badge
@onready var collision: CollisionShape2D = $CollisionShape2D
@onready var spark: GPUParticles2D = $HitSpark
@onready var aura: GPUParticles2D = $Aura
@onready var anim: AnimationPlayer = $Anim

func _ready() -> void:
	freeze = true
	freeze_mode = RigidBody2D.FREEZE_MODE_KINEMATIC
	gravity_scale = 0.0
	lock_rotation = true
	collision_layer = 2
	collision_mask = 0
	hp = max_hp
	_setup_collision()
	_apply_look()
	_update_badge()
	_configure_particles()
	_pulse = randf() * TAU
	if anim and anim.has_animation("idle_bob"):
		anim.play("idle_bob")

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
		_apply_look()
		_update_badge()
		_configure_particles()

func _setup_collision() -> void:
	var shape := CircleShape2D.new()
	shape.radius = SIZE * 0.40
	collision.shape = shape

func _apply_look() -> void:
	body.texture = PetalAtlas.PETAL[bloom_color]
	body.centered = true
	var tex_size := body.texture.get_size()
	body.scale = Vector2.ONE * (SIZE / maxf(tex_size.x, 1.0))
	# Durables: slightly flatter/darker jelly
	if kind == BlockDefs.BlockKind.DURABLE:
		body.modulate = Color(0.86, 0.88, 0.95, 1.0)
		body.scale *= 0.96
	else:
		body.modulate = Color.WHITE
	# Faces ONLY on hero AoE specials — commons stay cute without eyes.
	if kind == BlockDefs.BlockKind.AOE:
		face.visible = true
		face.texture = PetalAtlas.FACE_SPARKLE
		face.centered = true
		face.scale = Vector2.ONE * (SIZE * 0.55 / maxf(face.texture.get_size().x, 1.0))
		face.position = Vector2(0, 4)
		face.modulate = Color(1, 1, 1, 0.95)
	else:
		face.visible = false

func _configure_particles() -> void:
	if spark and spark.process_material is ParticleProcessMaterial:
		(spark.process_material as ParticleProcessMaterial).color = BlockDefs.COLOR_GLOW[bloom_color]
	if aura:
		aura.emitting = kind == BlockDefs.BlockKind.AOE
		if aura.process_material is ParticleProcessMaterial:
			(aura.process_material as ParticleProcessMaterial).color = Color(BlockDefs.COLOR_GLOW[bloom_color], 0.55)

func _update_badge() -> void:
	if badge == null:
		return
	match kind:
		BlockDefs.BlockKind.DURABLE:
			badge.text = str(hp)
			badge.visible = true
		BlockDefs.BlockKind.AOE:
			badge.text = ""
			badge.visible = false
		_:
			badge.visible = false

func _process(delta: float) -> void:
	if is_destroying:
		return
	_pulse += delta * (2.0 if kind != BlockDefs.BlockKind.AOE else 3.2)
	var breathe := 1.0 + sin(_pulse) * (0.028 if kind != BlockDefs.BlockKind.DURABLE else 0.012)
	if kind == BlockDefs.BlockKind.AOE:
		breathe += sin(_pulse * 1.5) * 0.02
	scale = Vector2.ONE * breathe

func apply_hit(from_color: BlockDefs.BloomColor, is_aoe_wave: bool = false) -> Dictionary:
	var result := {"destroyed": false, "matched": false, "aoe": false, "chipped": false}
	if is_destroying:
		return result
	_flash_hit()
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

func _flash_hit() -> void:
	# Brief emotional face ONLY on hit for commons — then hide. AoE keeps sparkle face.
	if kind != BlockDefs.BlockKind.AOE:
		face.visible = true
		face.texture = PetalAtlas.FACE_HIT
		face.centered = true
		face.scale = Vector2.ONE * (SIZE * 0.5 / maxf(face.texture.get_size().x, 1.0))
		face.modulate.a = 1.0
		var hide_tw := create_tween()
		hide_tw.tween_interval(0.18)
		hide_tw.tween_property(face, "modulate:a", 0.0, 0.12)
		hide_tw.tween_callback(func() -> void:
			if kind != BlockDefs.BlockKind.AOE:
				face.visible = false
				face.modulate.a = 1.0
		)
	var tw := create_tween()
	tw.tween_property(body, "modulate", Color(2.0, 2.0, 2.0, 1.0), 0.04)
	tw.tween_property(body, "modulate", Color.WHITE if kind != BlockDefs.BlockKind.DURABLE else Color(0.86, 0.88, 0.95, 1.0), 0.12)
	if anim and anim.has_animation("squash"):
		anim.play("squash")

func begin_destroy(reason: String) -> void:
	if is_destroying:
		return
	is_destroying = true
	collision.set_deferred("disabled", true)
	destroyed.emit(self, reason)
	if kind == BlockDefs.BlockKind.AOE:
		face.texture = PetalAtlas.FACE_HAPPY
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "scale", Vector2(1.4, 1.4), 0.1).set_trans(Tween.TRANS_BACK)
	tw.tween_property(self, "modulate:a", 0.0, 0.2).set_delay(0.05)
	tw.chain().tween_callback(queue_free)

func fall_to(y: float, duration: float = 0.22) -> void:
	var tw := create_tween()
	tw.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(self, "global_position:y", y, duration)
