# Puzzle Bloom — Project Status

Updated: 2026-11-11 (America/Sao_Paulo)

## Goal

Commercial casual 2D Android game in Godot 4: color-match projectile puzzle. Original IP.

## Repo

https://github.com/PakalTheGreat/PuzzleBloom (`main`)

## Latest: hard visual redesign (Petal Pals)

Response to Lucas “péssimo” feedback — not a polish nudge, a look swap.

### Visual
- Original pastel jelly-petal sprites (GenerateImage → transparent PNGs)
- Soft garden dawn background art
- Blocks = `Sprite2D` textures (not ColorRects); AnimationPlayer squash; GPUParticles
- **Faces only** on current projectile/cannon + AoE hero (commons get a brief hit face, then hide)
- Larger pieces (cell 88), tighter blossom layout, less empty void
- Cream/pink portrait HUD StyleBoxes (not dark grey chrome)

### Feel (kept + tuned)
- JuiceDirector shake/hitstop/punch, aim assist, reveal, audio bed

### How to run
Godot 4.7 → open repo → F5. Theme title: **Petal Pals**.

## Etapa status

- **A** playable + visual redesign: done (iterate on Lucas playtest)
- **B–E**: not started
