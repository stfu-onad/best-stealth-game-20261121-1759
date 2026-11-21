// levels.js — the museum at night: three halls, each a top-down stealth level.
// Every level is plain data: walls block movement and sight, crates block both
// too, bushes hide the thief but not the guards, relics are the objective and
// the exit only opens once every relic in the hall is taken.

export const WORLD_W = 960;
export const WORLD_H = 600;

function wall(x, y, w, h) { return { x, y, w, h }; }
function crate(x, y, w = 44, h = 44) { return { x, y, w, h }; }
function bush(x, y, r = 30) { return { x, y, r }; }
function relic(x, y, name, kind) { return { x, y, name, kind, taken: false }; }
function guardPath(points, speed = 52, pause = 1.1) { return { points, speed, pause }; }

export const LEVELS = [
  {
    name: 'Hall 1 — The Marble Gallery',
    hint: 'Learn the patrols. Bushes hide you; running is loud.',
    start: { x: 70, y: 530 },
    exit: { x: 872, y: 44, w: 56, h: 56 },
    walls: [
      wall(0, 0, 960, 18), wall(0, 582, 960, 18), wall(0, 0, 18, 600), wall(942, 0, 18, 600),
      wall(300, 0, 20, 150), wall(300, 210, 20, 130),
      wall(620, 260, 20, 190), wall(620, 510, 20, 72),
      wall(470, 120, 150, 20),
    ],
    crates: [
      crate(180, 120), crate(228, 120), crate(180, 168),
      crate(700, 420), crate(748, 420),
      crate(430, 380), crate(430, 428),
      crate(150, 420),
    ],
    bushes: [bush(250, 300, 34), bush(560, 180, 32), bush(820, 300, 34), bush(120, 250, 28)],
    relics: [
      relic(880, 520, 'Moon Vase', 'vase'),
      relic(380, 90, 'Jade Mask', 'mask'),
    ],
    guards: [
      guardPath([[360, 300], [360, 480], [560, 480], [560, 300]], 55, 1.2),
      guardPath([[700, 120], [880, 120], [880, 260], [700, 260]], 48, 1.5),
    ],
  },
  {
    name: 'Hall 2 — The Vault Corridor',
    hint: 'Two guards cross the corridor. Wait for the gap, then slip through.',
    start: { x: 70, y: 300 },
    exit: { x: 872, y: 44, w: 56, h: 56 },
    walls: [
      wall(0, 0, 960, 18), wall(0, 582, 960, 18), wall(0, 0, 18, 600), wall(942, 0, 18, 600),
      wall(220, 0, 20, 200), wall(220, 260, 20, 170), wall(220, 490, 20, 92),
      wall(520, 110, 20, 200), wall(520, 370, 20, 212),
      wall(760, 0, 20, 150), wall(760, 210, 20, 150),
    ],
    crates: [
      crate(300, 90), crate(348, 90),
      crate(600, 470), crate(648, 470),
      crate(820, 330), crate(820, 378),
    ],
    bushes: [bush(160, 120, 30), bush(400, 520, 32), bush(660, 140, 30), bush(880, 520, 30)],
    relics: [
      relic(300, 520, 'Sun Coin', 'coin'),
      relic(660, 300, 'Star Scroll', 'scroll'),
      relic(880, 150, 'Pearl Fan', 'fan'),
    ],
    guards: [
      guardPath([[280, 60], [280, 540]], 62, 0.8),
      guardPath([[470, 540], [470, 60]], 62, 0.8),
      guardPath([[700, 200], [900, 200], [900, 540], [700, 540]], 50, 1.0),
    ],
  },
  {
    name: 'Hall 3 — The Rooftop Garden',
    hint: 'The last hall. The head guard never stops. Use the hedges.',
    start: { x: 70, y: 530 },
    exit: { x: 872, y: 44, w: 56, h: 56 },
    walls: [
      wall(0, 0, 960, 18), wall(0, 582, 960, 18), wall(0, 0, 18, 600), wall(942, 0, 18, 600),
      wall(200, 120, 260, 20), wall(200, 420, 20, 162),
      wall(560, 60, 20, 200), wall(560, 320, 200, 20),
      wall(760, 380, 20, 202),
    ],
    crates: [
      crate(120, 120), crate(120, 168),
      crate(420, 300), crate(468, 300), crate(420, 348),
      crate(680, 480), crate(728, 480),
    ],
    bushes: [bush(300, 300, 36), bush(640, 200, 32), bush(860, 300, 34), bush(160, 470, 30), bush(500, 520, 30)],
    relics: [
      relic(880, 520, 'Moonstone Crown', 'crown'),
      relic(320, 70, 'Silver Owl', 'owl'),
      relic(660, 440, 'Amber Key', 'key'),
    ],
    guards: [
      guardPath([[260, 200], [520, 200], [520, 480], [260, 480]], 58, 0.9),
      guardPath([[640, 100], [880, 100], [880, 420], [640, 420]], 58, 0.9),
      guardPath([[540, 60], [540, 540]], 70, 0.6),
    ],
  },
];

// buildLevel returns a fresh, mutable copy of a level definition so a retry
// never inherits taken relics or moved guards from the previous attempt.
export function buildLevel(index) {
  const def = LEVELS[index % LEVELS.length];
  return JSON.parse(JSON.stringify(def));
}
