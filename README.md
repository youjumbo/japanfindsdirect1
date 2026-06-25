# Box-Throw Platformer — learning prototype

A small, original platformer built to **learn game mechanics** by recreating the
classic NES rescue-platformer feel: run, jump, crouch, **pick up a crate and
throw it at an enemy**, and collect acorns.

All art is **original pixel art drawn from data** (see `art.js`) — each sprite is
a character grid with a palette, outline, and shading, rendered to a texture at
runtime. There are no imported game rips. Phaser is vendored in `vendor/` so the
whole thing runs **fully offline**, no build step.

## How to run

Because browsers restrict `file://` scripts, run a tiny local web server from
this folder and open the page:

```bash
# Python 3 (already on most systems)
python3 -m http.server 8000
# then visit http://localhost:8000 in your browser
```

No internet connection needed — Phaser is vendored in `vendor/`.

## Controls

| Key            | Action              |
| -------------- | ------------------- |
| ← / →          | Move                |
| ↑ or **Z**     | Jump                |
| ↓              | Crouch              |
| **X**          | Grab / throw crate  |

Throw a crate **into an enemy** to defeat it. Walking into an enemy costs a life.

## How the code is organized (`main.js`)

- **`TUNING`** — all the "feel" numbers (speed, gravity, jump height) in one
  place. Tweak and reload to feel each one.
- **`makeTextures()`** — draws every shape once and bakes it into a reusable
  texture. This is how we ship art with zero asset files.
- **`GameScene`** — Phaser's lifecycle:
  - `create()` builds the level (platforms, hero, crates, enemies, acorns) and
    sets up the collision rules.
  - `update()` runs ~60×/second and handles input + per-frame logic.
- **Grab/throw** lives in `tryGrabCrate()`, `throwCrate()`, and `dropCrate()`.
  A crate only hurts an enemy while its `thrown` flag is `true`.

## Ideas for next steps (good learning exercises)

1. Add a second player (co-op) sharing the same controls scheme.
2. Make crates **break** after a thrown hit instead of bouncing.
3. Add a "hide inside the box" stealth state.
4. Scroll the camera and build a longer level.
5. Redraw any sprite by editing its character grid in `art.js`.
