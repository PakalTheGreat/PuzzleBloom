# Puzzle Bloom — Project Status

Updated: 2026-11-11 (America/Sao_Paulo)

## Goal

Commercial casual 2D Android game in Godot 4: color-match projectile puzzle that reveals art and rebuilds a collectible world. Inspired by Jelly Busters–style interaction only (original IP).

## Repo

https://github.com/PakalTheGreat/PuzzleBloom (`main`)

## Etapa A — 200% juice / identity pass (shipped)

### Feel
- Elastic multi-bounce aim ribbon + soft same-color aim assist (never hard lock)
- Weighty projectile launch (scale punch + speed ramp)
- JuiceDirector: screen shake, camera punch, hitstop on combos
- Combo banners, score-star flies to HUD
- Progressive garden illustration reveal under blocks

### Visual identity
- Custom `bloom_block.gdshader` volumetric bevel/specular
- Distinct silhouettes: rounded common, hex durable, star-bloom AoE + aura particles
- Polished portrait HUD (shadowed panels, gold primary CTA)
- Celebratory win/lose veil + burst (not bare labels)

### Audio
- Musical SFX hierarchy: shoot / impact / miss thunk / match pop / chain pitch climb / AoE / win sting / lose
- Soft procedural ambient bed loop

### Demo level — Dawn Petals
- Flower silhouette, open violet teaching lane into center AoE
- Durable stem walls, mixed colors, 22 petals, goal 1,400
- Designed for a satisfying first cascade in ~60–90s

### Systems
GameManager, LevelManager, ProjectileController, BlockController, CollisionSystem, ScoreSystem, JuiceDirector, RevealController, UIManager, AudioManager, SaveSystem stub

## How to re-run (debug)

1. Open Godot **4.7.2** → Import `C:\Users\USUARIO\PuzzleBloom` (or clone the GitHub repo)
2. Main scene `scenes/main.tscn` → **F5**
3. Drag to aim (watch assist ring on same colors), release to shoot
4. First tip: fire **violet** up the center lane into the glowing AoE bloom

## Not started

- Etapa B authored sprite/audio pack
- Etapa C progression map / album / world
- Etapa D 20 levels
- Etapa E Android export

## Tooling note

Godot MCP addon is included for editor automation. Cache screenshots are gitignored.
