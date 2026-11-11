# Puzzle Bloom

Casual portrait puzzle for Android (Godot 4): aim colored blooms, match and clear blocks, chain reactions, durable stones, and AoE sparks.

**Etapa A** — one polished playable level (`Dawn Petals`).

## Requirements

- Godot **4.7.x** (4.x stable OK; developed on 4.7.2)
- Windows / macOS / Linux editor, or headless for import checks

## Run

1. Open Godot → **Import** → select this folder (`project.godot`).
2. Press **F5** (main scene: `scenes/main.tscn`).
3. **Drag** to aim, **release** to shoot. Match colors to clear. Clear all blocks to win; empty your shot budget to lose.

### Headless check

```bash
godot --path . --headless --quit-after 3
```

## Controls

| Input | Action |
|---|---|
| Drag / touch | Aim (bounce preview on walls) |
| Release | Fire current bloom |
| Result buttons | Retry / play again |

## Architecture (Etapa A)

| System | Role |
|---|---|
| `GameManager` | Global play state, win/lose |
| `LevelManager` | Level load + clear/fail rules |
| `ProjectileController` | Aim, fire, ammo queue |
| `BlockController` | Spawn, gravity, clusters, AoE |
| `CollisionSystem` | Flood-fill matches |
| `ScoreSystem` | Score / combo |
| `UIManager` | Portrait HUD + results |
| `AudioManager` | Procedural SFX |
| `SaveSystem` | Versioned offline stub |

## License

Original game code and art direction for Puzzle Bloom. Not affiliated with Moon Active or Jelly Busters.
