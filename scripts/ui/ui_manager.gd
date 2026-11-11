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

var _toast_tween: Tween

func _ready() -> void:
	result_panel.visible = false
	combo_label.modulate.a = 0.0
	btn_retry.pressed.connect(func() -> void: restart_pressed.emit())
	btn_ok.pressed.connect(func() -> void: continue_pressed.emit())
	_make_orb(current_orb, 22.0)
	_make_orb(next_orb, 14.0)

func bind_level(level: LevelData) -> void:
	title_label.text = level.display_name
	target_label.text = "Goal %s" % _format_score(level.target_score)
	result_panel.visible = false
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
		combo_label.text = "Bloom x%s" % combo
		combo_label.modulate.a = 1.0
		var tw := create_tween()
		tw.tween_property(combo_label, "scale", Vector2(1.15, 1.15), 0.08)
		tw.tween_property(combo_label, "scale", Vector2.ONE, 0.12)
	else:
		var tw := create_tween()
		tw.tween_property(combo_label, "modulate:a", 0.0, 0.2)

func set_ammo(current: BlockDefs.BloomColor, next: BlockDefs.BloomColor) -> void:
	current_orb.color = BlockDefs.COLOR_HEX[current]
	next_orb.color = BlockDefs.COLOR_HEX[next]

func show_win(score: int, target: int) -> void:
	result_panel.visible = true
	result_title.text = "Garden Cleared"
	var stars := 1
	if score >= target:
		stars = 2
	if score >= int(target * 1.4):
		stars = 3
	result_body.text = "Score %s\n%s" % [_format_score(score), "★".repeat(stars) + "☆".repeat(3 - stars)]
	btn_ok.text = "Bloom Again"
	_pop_result()

func show_lose(score: int) -> void:
	result_panel.visible = true
	result_title.text = "Out of Petals"
	result_body.text = "Score %s\nTry a new aim path." % _format_score(score)
	btn_ok.text = "Retry"
	_pop_result()

func show_toast(text: String) -> void:
	toast.text = text
	toast.modulate.a = 1.0
	toast.scale = Vector2(0.9, 0.9)
	if _toast_tween and _toast_tween.is_running():
		_toast_tween.kill()
	_toast_tween = create_tween()
	_toast_tween.tween_property(toast, "scale", Vector2.ONE, 0.12).set_trans(Tween.TRANS_BACK)
	_toast_tween.tween_interval(0.55)
	_toast_tween.tween_property(toast, "modulate:a", 0.0, 0.25)

func _pop_result() -> void:
	result_panel.scale = Vector2(0.85, 0.85)
	result_panel.modulate.a = 0.0
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(result_panel, "scale", Vector2.ONE, 0.28).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(result_panel, "modulate:a", 1.0, 0.18)

func _make_orb(poly: Polygon2D, radius: float) -> void:
	var pts := PackedVector2Array()
	for i in 14:
		var a := TAU * float(i) / 14.0
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
