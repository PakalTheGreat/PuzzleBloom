class_name BlockDefs
extends RefCounted

## Bloom palette — enchanted garden, original IP (not jelly clones).
enum BloomColor {
	ROSE,
	AQUA,
	SUN,
	VIOLET,
	LIME,
}

enum BlockKind {
	COMMON,
	DURABLE,
	AOE,
}

const COLOR_HEX := {
	BloomColor.ROSE: Color("ff6b9d"),
	BloomColor.AQUA: Color("4ecdc4"),
	BloomColor.SUN: Color("ffe66d"),
	BloomColor.VIOLET: Color("a78bfa"),
	BloomColor.LIME: Color("95e06c"),
}

const COLOR_DEEP := {
	BloomColor.ROSE: Color("c44569"),
	BloomColor.AQUA: Color("2a9d8f"),
	BloomColor.SUN: Color("f4a261"),
	BloomColor.VIOLET: Color("7c3aed"),
	BloomColor.LIME: Color("3d8b37"),
}

const COLOR_GLOW := {
	BloomColor.ROSE: Color("ffb3d1"),
	BloomColor.AQUA: Color("a8f0ea"),
	BloomColor.SUN: Color("fff3b0"),
	BloomColor.VIOLET: Color("ddd6fe"),
	BloomColor.LIME: Color("d4f5b8"),
}

static func color_name(c: BloomColor) -> String:
	match c:
		BloomColor.ROSE: return "Rose"
		BloomColor.AQUA: return "Aqua"
		BloomColor.SUN: return "Sun"
		BloomColor.VIOLET: return "Violet"
		BloomColor.LIME: return "Lime"
	return "Unknown"

static func random_color(rng: RandomNumberGenerator, pool: Array = []) -> BloomColor:
	if pool.is_empty():
		pool = [BloomColor.ROSE, BloomColor.AQUA, BloomColor.SUN, BloomColor.VIOLET]
	return pool[rng.randi() % pool.size()]
