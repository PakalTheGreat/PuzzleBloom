class_name ProjectileEntity
extends CharacterBody2D

signal impacted(projectile: ProjectileEntity, block: BlockEntity)
signal left_playfield(projectile: ProjectileEntity)

const SPEED := 820.0
const SIZE := 78.0

var bloom_color: BlockDefs.BloomColor = BlockDefs.BloomColor.ROSE
var direction: Vector2 = Vector2.UP
var active: bool = false
var _speed: float = SPEED

@onready var body: Sprite2D = $Body
@onready var face: Sprite2D = $Face
@onready var glow: Sprite2D = $Glow
@onready var collision: CollisionShape2D = $CollisionShape2D
@onready var trail: GPUParticles2D = $Trail

func _ready() -> void:
	collision_layer = 4
	collision_mask = 2 | 8
	var shape := CircleShape2D.new()
	shape.radius = SIZE * 0.38
	collision.shape = shape
	set_physics_process(false)

func launch(color: BlockDefs.BloomColor, from: Vector2, dir: Vector2) -> void:
	bloom_color = color
	global_position = from
	direction = dir.normalized()
	_speed = SPEED * 0.5
	_apply_look()
	active = true
	visible = true
	scale = Vector2(0.65, 0.65)
	set_physics_process(true)
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "scale", Vector2.ONE, 0.1).set_trans(Tween.TRANS_BACK)
	tw.tween_method(func(v: float) -> void: _speed = v, SPEED * 0.5, SPEED, 0.14)
	if trail:
		trail.emitting = true
		var mat := trail.process_material as ParticleProcessMaterial
		if mat:
			mat.color = BlockDefs.COLOR_HEX[color]

func _apply_look() -> void:
	body.texture = PetalAtlas.PETAL[bloom_color]
	body.centered = true
	var s := SIZE / maxf(body.texture.get_size().x, 1.0)
	body.scale = Vector2.ONE * s
	glow.texture = body.texture
	glow.centered = true
	glow.scale = Vector2.ONE * s * 1.25
	glow.modulate = Color(1, 1, 1, 0.28)
	# Face always on current projectile (cute emotion)
	face.visible = true
	face.texture = PetalAtlas.FACE_HAPPY
	face.centered = true
	face.scale = Vector2.ONE * (SIZE * 0.55 / maxf(face.texture.get_size().x, 1.0))
	face.position = Vector2(0, 5)

func _physics_process(delta: float) -> void:
	if not active:
		return
	var hit := move_and_collide(direction * _speed * delta)
	if hit:
		var collider := hit.get_collider()
		if collider is BlockEntity:
			face.texture = PetalAtlas.FACE_SPARKLE
			impacted.emit(self, collider as BlockEntity)
			_deactivate()
			return
		var n := hit.get_normal()
		direction = direction.bounce(n).normalized()
		global_position += n * 1.5
		_speed *= 0.98
	body.rotation += delta * 2.2
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
