# Moonlight Museum

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/competitions/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/stfu-onad/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/competitions/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/stfu-onad/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/competitions/best-stealth-game-20261121-1759)

SPDX-License-Identifier: MIT

A top-down stealth game written in vanilla JavaScript on canvas — no
libraries, no network requests, every sound synthesized with WebAudio.

**The story:** Wren, the shadow courier, slips into the Moonlight Museum at
midnight. Steal every relic in each of the three halls, reach the green EXIT,
and never let a guard see you.

## How it plays

- **Move:** WASD / arrow keys, or click anywhere to walk there. **Shift**
  runs — faster, but loud: nearby guards come to listen.
- **Guards** patrol routes you can learn, each sweeping a visible yellow
  vision cone. Walls and crates block their sight as well as your path.
- **Suspicion** rises while you are inside a cone. At 100% the alarm sounds
  and the guard chases — but break line of sight and hide, and the alarm
  cools down. You get a chance to recover, not an instant game over.
- **Cover:** duck into the green bushes to vanish (unless a guard is almost
  on top of you). Moonlit floor makes you easier to spot; shadows are safer.
- **Objective:** collect every relic in the hall (2–3 per hall) to unlock
  the EXIT, then slip out. 3 lives, a score with time and ghost-run bonuses,
  and 3 halls: The Marble Gallery, The Vault Corridor, The Rooftop Garden.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshot poses for the camera: `?shot=start`, `?shot=play`,
`?shot=hide`, `?shot=exit`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `game/index.html` — the page, canvas only
- `game/src/main.js` — game loop, state machine, scoring, screenshot poses
- `game/src/levels.js` — the three museum halls
- `game/src/guards.js` — patrol AI, vision cones, suspicion and chase
- `game/src/player.js` — movement, collision, hiding, noise
- `game/src/render.js` — all canvas art, HUD and screens
- `game/src/audio.js` — procedural WebAudio: footsteps, alert, ambient pad
- `game/src/input.js` — keyboard and mouse
- `main.ts` — copies `game/` + `screenshots/` to `/output`, writes `dossier.json`
