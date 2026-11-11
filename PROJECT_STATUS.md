# Puzzle Bloom — Project Status

Updated: 2026-11-11 (America/Sao_Paulo)

## Goal

Commercial casual 2D Android game in Godot 4: color-match projectile puzzle. Original IP.

## Repo

https://github.com/PakalTheGreat/PuzzleBloom (`main`)

## Latest: playtest polish (post “ficou muito melhor”)

Lucas liked Petal Pals look; applied ASAP fixes:

1. **Grey hatch gone** — leftover checker/mesh was baked into petal PNGs; flood-cleaned sprites + removed reveal mist panel. Garden shows clean under the cluster.
2. **Debug window fits screen** — viewport stays 720×1280; window override **405×720** with `canvas_items` + `keep` so the full portrait (incl. launcher) fits a ~1080p / 125% DPI desktop.
3. **CURRENT / NEXT clarity** — large launcher petal (148px) labeled CURRENT; NEXT chip StyleBox with bigger preview petal.

### Visual (kept)
- Petal Pals pastel jelly sprites, soft garden BG, faces only on CURRENT + AoE hero
- StyleBoxes / AnimationPlayer / GPUParticles (not bare ColorRects)

### How to run
Godot 4.7 → open repo → F5 (DEBUG window ~405×720). Theme title: **Petal Pals**.

## Etapa status

- **A** playable + visual redesign + hatch/window/ammo polish: iterating on Lucas playtest
- **B–E**: not started
