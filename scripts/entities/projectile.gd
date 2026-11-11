class_name ProjectileEntity
extends CharacterBody2D

signal impacted(projectile: ProjectileEntity, block: BlockEntity)
signal left_playfield(projectile: ProjectileEntity)

const SPEED := 980.0
const RADIUS := 18.0

var bloom_color: BlockDefs.BloomColor = BlockDefs.BloomColor.ROSE
var direction: Vector2 = Vector2.UP
var active: bool = false
var _trail_timer: float = 0.0

@onready var visual: Polygon2D = $Visual
@onready var glow: Polygon2D = $Glow
@onready var collision: CollisionShape2D = $CollisionShape2D
@onready var trail: GPUParticles2D = $Trail

func _ready() -> void:
	collision_layer = 4
	collision_mask = 2 | 8  # blocks + bounds
	_build()
	set_physics_process(false)

func _build() -> void:
	var pts := PackedVector2Array()
	for i in 10:
		var a := TAU * float(i) / 10.0
		pts.append(Vector2(cos(a), sin(a)) * RADIUS)
	visual.polygon = pts
	var gpts := PackedVector2Array()
	for i in 10:
		var a := TAU * float(i) / 10.0
		gpts.append(Vector2(cos(a), sin(a)) * (RADIUS + 8.0))
	glow.polygon = gpts
	var shape := CircleShape2D.new()
	shape.radius = RADIUS * 0.92
	collision.shape = shape

func launch(color: BlockDefs.BloomColor, from: Vector2, dir: Vector2) -> void:
	bloom_color = color
	global_position = from
	direction = dir.normalized()
	rotation = direction.angle()
	_apply_color()
	active = true
	visible = true
	set_physics_process(true)
	if trail:
		trail.emitting = true
		var mat := trail.process_material as ParticleProcessMaterial
		if mat:
			mat.color = BlockDefs.COLOR_HEX[color]

func _apply_color() -> void:
	var c: Color = BlockDefs.COLOR_HEX[bloom_color]
	visual.color = c.lightened(0.15)
	glow.color = Color(c.r, c.g, c.b, 0.35)

func _physics_process(delta: float) -> void:
	if not active:
		return
	var motion := direction * SPEED * delta
	var hit := move_and_collide(motion)
	if hit:
		var collider := hit.get_collider()
		if collider is BlockEntity:
			impacted.emit(self, collider as BlockEntity)
			_deactivate()
			return
		# Bounce off walls (bounds).
		var n := hit.get_normal()
		direction = direction.bounce(n).normalized()
		# Tiny nudge out of contact.
		global_position += n * 1.5
	_trail_timer += delta
	# Soft spin for life.
	visual.rotation += delta * 8.0

func _deactivate() -> void:
	active = false
	set_physics_process(false)
	if trail:
		trail.emitting = false
	visible = false

func retire() -> void:
	_deactivate()
	left_playfield.emit(self)
