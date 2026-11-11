# Puzzle Bloom — Project Status

Updated: 2026-11-11 (America/Sao_Paulo)

## Goal

Commercial casual 2D Android game in Godot 4: color-match projectile puzzle that reveals art and rebuilds a collectible world. Inspired by Jelly Busters–style interaction only (original IP).

## Repo / tooling

| Item | Status |
|---|---|
| Godot | **4.7.2.stable** on Windows worker (winget) |
| GitHub | https://github.com/PakalTheGreat/PuzzleBloom (`main`) |
| Godot MCP | Addon enabled in project for editor automation |
| Android export | Later (Etapa E) |

## Implementation status

### Done — Etapa A (playable polished core)

- Portrait 720×1280 Godot 4 project
- Systems: GameManager, LevelManager, ProjectileController, BlockController, CollisionSystem, ScoreSystem, UIManager, AudioManager, SaveSystem stub
- Level **Dawn Petals**: drag-aim + shoot, color match clear, gravity chains, durable (3 HP), AoE bloom, particles, score/combo HUD, win/lose overlay
- Original garden visual identity (procedural volumetric petals — not Jelly Busters IP)
- Headless import + editor playtest (shot consumed petals 20→19, 0 runtime errors after timeout fix)

### Not started

- Etapa B: authored sprite/audio pack
- Etapa C: map, stars, album, world rebuild
- Etapa D: 20 levels, 3 envs, daily
- Etapa E: Android export + QA

## How to run

1. Install Godot 4.7.x
2. Import this folder → F5 (`scenes/main.tscn`)
3. Drag to aim, release to shoot

## Next action

Etapa B polish pass (sprites/SFX pack), then progression stubs (C).
