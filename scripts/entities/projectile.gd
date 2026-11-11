class_name ProjectileEntity
extends CharacterBody2D

signal impacted(projectile: ProjectileEntity, block: BlockEntity)
signal left_playfield(projectile: ProjectileEntity)

const SPEED := 860.0
const RADIUS := 20.0

var bloom_color: BlockDefs.BloomColor = BlockDefs.BloomColor.ROSE
var direction: Vector2 = Vector2.UP
var active: bool = false
var _speed: float = SPEED
var _spin: float = 0.0

@onready var visual: Polygon2D = $Visual
@onready var glow: Polygon2D = $Glow
@onready var core: Polygon2D = $Core
@onready var collision: CollisionShape2D = $CollisionShape2D
@onready var trail: GPUParticles2D = $Trail

func _ready() -> void:
	collision_layer = 4
	collision_mask = 2 | 8
	_build()
	set_physics_process(false)

func _build() -> void:
	var pts := PackedVector2Array()
	for i in 12:
		var a := TAU * float(i) / 12.0
		pts.append(Vector2(cos(a), sin(a)) * RADIUS)
	visual.polygon = pts
	var gpts := PackedVector2Array()
	for i in 12:
		var a := TAU * float(i) / 12.0
		gpts.append(Vector2(cos(a), sin(a)) * (RADIUS + 12.0))
	glow.polygon = gpts
	core.polygon = PackedVector2Array([
		Vector2(-6, -6), Vector2(6, -6), Vector2(6, 6), Vector2(-6, 6)
	])
	var shape := CircleShape2D.new()
	shape.radius = RADIUS * 0.9
	collision.shape = shape

func launch(color: BlockDefs.BloomColor, from: Vector2, dir: Vector2) -> void:
	bloom_color = color
	global_position = from
	direction = dir.normalized()
	_speed = SPEED * 0.55
	_apply_color()
	active = true
	visible = true
	modulate.a = 1.0
	scale = Vector2(0.7, 0.7)
	set_physics_process(true)
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "scale", Vector2.ONE, 0.08).set_trans(Tween.TRANS_BACK)
	tw.tween_method(func(v: float) -> void: _speed = v, SPEED * 0.55, SPEED, 0.12)
	if trail:
		trail.emitting = true
		var mat := trail.process_material as ParticleProcessMaterial
		if mat:
			mat.color = BlockDefs.COLOR_HEX[color]

func _apply_color() -> void:
	var c: Color = BlockDefs.COLOR_HEX[bloom_color]
	visual.color = c.lightened(0.12)
	glow.color = Color(c.r, c.g, c.b, 0.42)
	core.color = Color(1, 1, 1, 0.9)

func _physics_process(delta: float) -> void:
	if not active:
		return
	var motion := direction * _speed * delta
	var hit := move_and_collide(motion)
	if hit:
		var collider := hit.get_collider()
		if collider is BlockEntity:
			impacted.emit(self, collider as BlockEntity)
			_deactivate()
			return
		var n := hit.get_normal()
		direction = direction.bounce(n).normalized()
		global_position += n * 1.5
		_speed *= 0.98
	_spin += delta * 10.0
	visual.rotation = _spin
	if global_position.y > 1280.0 or global_position.y < 40.0 or global_position.x < -40.0 or global_position.x > 760.0:
		retire()

func _deactivate() -> void:
	active = false
	set_physics_process(false)
	if trail:
		trail.emitting = false
	visible = false

func retire() -> void:
	_deactivate()
	left_playfield.emit(self)
