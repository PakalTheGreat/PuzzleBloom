class_name UIManager
extends CanvasLayer

signal restart_pressed
signal continue_pressed

@onready var score_label: Label = %ScoreLabel
@onready var shots_label: Label = %ShotsLabel
@onready var combo_label: Label = %ComboLabel
@onready var title_label: Label = %TitleLabel
@onready var target_label: Label = %TargetLabel
@onready var current_orb: Polygon2D = %CurrentOrb
@onready var next_orb: Polygon2D = %NextOrb
@onready var result_panel: Control = %ResultPanel
@onready var result_title: Label = %ResultTitle
@onready var result_body: Label = %ResultBody
@onready var btn_retry: Button = %BtnRetry
@onready var btn_ok: Button = %BtnOk
@onready var toast: Label = %Toast
@onready var top_bar: PanelContainer = %TopBar
@onready var result_burst: Node2D = %ResultBurst
@onready var veil: ColorRect = %Veil

var _toast_tween: Tween
var score_fly_target: Vector2 = Vector2(140, 70)

func _ready() -> void:
	result_panel.visible = false
	veil.visible = false
	combo_label.modulate.a = 0.0
	btn_retry.pressed.connect(func() -> void: restart_pressed.emit())
	btn_ok.pressed.connect(func() -> void: continue_pressed.emit())
	_make_orb(current_orb, 26.0)
	_make_orb(next_orb, 16.0)

func bind_level(level: LevelData) -> void:
	title_label.text = level.display_name
	target_label.text = "Goal  %s" % _format_score(level.target_score)
	result_panel.visible = false
	veil.visible = false
	set_score(0)
	set_shots(level.shot_budget)
	set_combo(0)

func set_score(score: int, delta: int = 0) -> void:
	score_label.text = "Score  %s" % _format_score(score)
	if delta > 0:
		show_toast("+%s" % delta)

func set_shots(n: int) -> void:
	shots_label.text = "Petals  %s" % n

func set_combo(combo: int) -> void:
	if combo >= 2:
		show_banner("BLOOM x%s" % combo, Color("ffe66d"))
	else:
		var tw := create_tween()
		tw.tween_property(combo_label, "modulate:a", 0.0, 0.2)

func show_banner(text: String, color: Color = Color("ffe66d")) -> void:
	combo_label.text = text
	combo_label.modulate = Color(color.r, color.g, color.b, 0.0)
	combo_label.scale = Vector2(0.6, 0.6)
	var tw := create_tween()
	tw.tween_property(combo_label, "modulate:a", 1.0, 0.08)
	tw.parallel().tween_property(combo_label, "scale", Vector2(1.2, 1.2), 0.12).set_trans(Tween.TRANS_BACK)
	tw.tween_property(combo_label, "scale", Vector2.ONE, 0.1)
	tw.tween_interval(0.55)
	tw.tween_property(combo_label, "modulate:a", 0.0, 0.25)

func set_ammo(current: BlockDefs.BloomColor, next: BlockDefs.BloomColor) -> void:
	# Keep orb polygons as soft color chips in the dock.
	current_orb.color = BlockDefs.COLOR_HEX[current]
	next_orb.color = BlockDefs.COLOR_HEX[next]
	# Prefer textured preview if Sprite2D siblings exist.
	var cur_s := get_node_or_null("%CurrentSprite") as Sprite2D
	var nxt_s := get_node_or_null("%NextSprite") as Sprite2D
	if cur_s:
		cur_s.texture = PetalAtlas.PETAL[current]
		cur_s.scale = Vector2.ONE * (48.0 / maxf(cur_s.texture.get_size().x, 1.0))
		current_orb.visible = false
	if nxt_s:
		nxt_s.texture = PetalAtlas.PETAL[next]
		nxt_s.scale = Vector2.ONE * (34.0 / maxf(nxt_s.texture.get_size().x, 1.0))
		next_orb.visible = false

func show_win(score: int, target: int) -> void:
	veil.visible = true
	veil.modulate.a = 0.0
	result_panel.visible = true
	result_title.text = "Garden Revealed"
	var stars := 1
	if score >= target:
		stars = 2
	if score >= int(float(target) * 1.35):
		stars = 3
	result_body.text = "Score  %s\n%s\nIllustration unlocked" % [
		_format_score(score),
		"★".repeat(stars) + "☆".repeat(3 - stars)
	]
	btn_ok.text = "Bloom Again"
	_pop_result(true)
	_pulse_burst(Color("ffe66d"))

func show_lose(score: int) -> void:
	veil.visible = true
	veil.modulate.a = 0.0
	result_panel.visible = true
	result_title.text = "Petals Spent"
	result_body.text = "Score  %s\nThe garden waits.\nTry a new path." % _format_score(score)
	btn_ok.text = "Try Again"
	_pop_result(false)
	_pulse_burst(Color("4ecdc4"))

func show_toast(text: String) -> void:
	toast.text = text
	toast.modulate.a = 1.0
	toast.scale = Vector2(0.85, 0.85)
	if _toast_tween and _toast_tween.is_running():
		_toast_tween.kill()
	_toast_tween = create_tween()
	_toast_tween.tween_property(toast, "scale", Vector2.ONE, 0.12).set_trans(Tween.TRANS_BACK)
	_toast_tween.tween_interval(0.5)
	_toast_tween.tween_property(toast, "modulate:a", 0.0, 0.25)

func _pop_result(won: bool) -> void:
	result_panel.scale = Vector2(0.7, 0.7)
	result_panel.modulate.a = 0.0
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(veil, "modulate:a", 0.55, 0.2)
	tw.tween_property(result_panel, "scale", Vector2.ONE, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(result_panel, "modulate:a", 1.0, 0.2)
	if won:
		tw.chain().tween_property(result_panel, "rotation_degrees", 1.5, 0.08)
		tw.tween_property(result_panel, "rotation_degrees", -1.0, 0.08)
		tw.tween_property(result_panel, "rotation_degrees", 0.0, 0.08)

func _pulse_burst(color: Color) -> void:
	if result_burst == null:
		return
	result_burst.queue_redraw()
	result_burst.set_meta("color", color)
	result_burst.set_meta("life", 1.0)
	var tw := create_tween()
	tw.tween_method(func(v: float) -> void:
		result_burst.set_meta("life", v)
		result_burst.queue_redraw()
	, 1.0, 0.0, 0.9)

func _make_orb(poly: Polygon2D, radius: float) -> void:
	var pts := PackedVector2Array()
	for i in 16:
		var a := TAU * float(i) / 16.0
		pts.append(Vector2(cos(a), sin(a)) * radius)
	poly.polygon = pts

func _format_score(n: int) -> String:
	var s := str(n)
	var out := ""
	var count := 0
	for i in range(s.length() - 1, -1, -1):
		if count > 0 and count % 3 == 0:
			out = "," + out
		out = s[i] + out
		count += 1
	return out
