# Puzzle Bloom — Project Status

Updated: 2026-11-11 (America/Sao_Paulo)

## Goal

Commercial casual 2D Android game in Godot 4: color-match projectile puzzle that reveals art and rebuilds a collectible world. Inspired by Jelly Busters–style interaction only (original IP).

## Repo / tooling

| Item | Status |
|---|---|
| Godot | **4.7.2.stable** installed on Windows worker via winget |
| GitHub repo | `PakalTheGreat/PuzzleBloom` (created with Etapa A push) |
| Godot MCP | Available on machine; editor plugin connect optional for live tools |
| Android export | Later (Etapa E) |

## Implementation status

### Done — Etapa A (playable polished core)

- Godot 4 project scaffold (`project.godot`, portrait 720×1280)
- Systems split: GameManager, LevelManager, ProjectileController, BlockController, CollisionSystem, ScoreSystem, UIManager, AudioManager, SaveSystem stub
- Level **Dawn Petals**: aim/shoot, color match clear, chains after gravity, durable (3 HP), AoE bloom, particles/impact juice, score + combo, win/lose, portrait HUD
- Procedural SFX + original garden visual identity (not Jelly Busters IP)
- `README.md` run instructions

### Not started

- Etapa B: authored sprites/audio pack polish
- Etapa C: map, stars, album, world rebuild
- Etapa D: 20 levels, 3 environments, daily
- Etapa E: Android export + QA

## How to run

Open folder in Godot 4.7 → F5. Drag to aim, release to shoot.

## Next action

Etapa B visual/audio polish pass, then progression stubs (C).
