// render.js — all of the game's art is drawn on canvas: moonlit marble, the
// guards' yellow vision cones, green hiding bushes, crates for cover, and a
// glowing exit. The HUD and every screen are drawn here too, so the game
// needs no image files at all.

import { WORLD_W, WORLD_H } from './levels.js';
import { CONE_RANGE, CONE_HALF_ANGLE } from './guards.js';

export const MOON_POOLS = [
  { x: 480, y: 150, r: 130 },
  { x: 180, y: 420, r: 110 },
  { x: 780, y: 450, r: 120 },
];

const FONT = "'Trebuchet MS', 'Segoe UI', sans-serif";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawFloor(ctx) {
  ctx.fillStyle = '#1a2036';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  // Marble tiles.
  ctx.strokeStyle = 'rgba(120, 140, 200, 0.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD_W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_H); ctx.stroke();
  }
  for (let y = 0; y <= WORLD_H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke();
  }
  // Moonlight pools: bright floor, riskier to cross.
  for (const m of MOON_POOLS) {
    const g = ctx.createRadialGradient(m.x, m.y, 10, m.x, m.y, m.r);
    g.addColorStop(0, 'rgba(190, 210, 255, 0.20)');
    g.addColorStop(1, 'rgba(190, 210, 255, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawCover(ctx, level) {
  for (const b of level.bushes) {
    ctx.fillStyle = '#1e4d2b';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2e6b3e';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const lx = b.x + Math.cos(a) * b.r * 0.55;
      const ly = b.y + Math.sin(a) * b.r * 0.55;
      ctx.beginPath(); ctx.arc(lx, ly, b.r * 0.32, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(220, 255, 220, 0.75)';
    ctx.font = '11px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('HIDE', b.x, b.y + b.r + 14);
  }
  for (const c of level.crates) {
    ctx.fillStyle = '#6b4a26';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#8a6234';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h);
    ctx.moveTo(c.x + c.w, c.y); ctx.lineTo(c.x, c.y + c.h);
    ctx.stroke();
  }
}

export function drawWalls(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = '#39406b';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#4d5690';
    if (w.w >= w.h) ctx.fillRect(w.x, w.y, w.w, 4);
    else ctx.fillRect(w.x, w.y, 4, w.h);
  }
}

export function drawRelicsAndExit(ctx, level, exitOpen, time) {
  for (const r of level.relics) {
    if (r.taken) continue;
    const pulse = 0.6 + 0.4 * Math.sin(time * 3 + r.x);
    const g = ctx.createRadialGradient(r.x, r.y, 2, r.x, r.y, 26);
    g.addColorStop(0, `rgba(255, 215, 90, ${0.55 * pulse})`);
    g.addColorStop(1, 'rgba(255, 215, 90, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(r.x, r.y, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd75a';
    ctx.beginPath(); ctx.arc(r.x, r.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a5a00';
    ctx.beginPath(); ctx.arc(r.x, r.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 240, 180, 0.9)';
    ctx.font = '11px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText(r.name.toUpperCase(), r.x, r.y + 24);
  }
  const e = level.exit;
  const glow = exitOpen ? 0.8 : 0.25;
  const g = ctx.createRadialGradient(e.x + e.w / 2, e.y + e.h / 2, 4, e.x + e.w / 2, e.y + e.h / 2, 70);
  g.addColorStop(0, exitOpen ? `rgba(80, 255, 140, ${glow})` : 'rgba(120, 160, 120, 0.25)');
  g.addColorStop(1, 'rgba(80, 255, 140, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(e.x + e.w / 2, e.y + e.h / 2, 70, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = exitOpen ? '#1f7a3d' : '#3a4a3a';
  roundRect(ctx, e.x, e.y, e.w, e.h, 6);
  ctx.fill();
  ctx.strokeStyle = exitOpen ? '#4dff88' : '#5a6a5a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = exitOpen ? '#b8ffc9' : '#8a9a8a';
  ctx.font = 'bold 15px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 5);
}

export function drawGuard(ctx, guard, time) {
  // Vision cone first, so the guard body draws on top of it.
  const color = guard.state === 'chase' ? '255, 70, 70'
    : guard.state === 'suspicious' || guard.state === 'investigate' ? '255, 190, 60'
    : '255, 220, 90';
  const grad = ctx.createRadialGradient(guard.x, guard.y, 8, guard.x, guard.y, CONE_RANGE);
  grad.addColorStop(0, `rgba(${color}, 0.34)`);
  grad.addColorStop(1, `rgba(${color}, 0.02)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, CONE_RANGE, guard.angle - CONE_HALF_ANGLE, guard.angle + CONE_HALF_ANGLE);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${color}, 0.5)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, CONE_RANGE, guard.angle - CONE_HALF_ANGLE, guard.angle + CONE_HALF_ANGLE);
  ctx.closePath();
  ctx.stroke();
  // Guard body: navy uniform, brass helmet, facing wedge.
  ctx.fillStyle = '#22315e';
  ctx.beginPath(); ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#c9a227';
  ctx.beginPath(); ctx.arc(guard.x, guard.y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8ecff';
  ctx.beginPath();
  ctx.moveTo(guard.x + Math.cos(guard.angle) * 18, guard.y + Math.sin(guard.angle) * 18);
  ctx.arc(guard.x, guard.y, 6, guard.angle - 0.5, guard.angle + 0.5);
  ctx.closePath();
  ctx.fill();
  // Suspicion meter above the guard's head.
  if (guard.suspicion > 2) {
    const w = 34;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(guard.x - w / 2, guard.y - 30, w, 6);
    ctx.fillStyle = guard.suspicion >= 100 ? '#ff4646' : '#ffc93c';
    ctx.fillRect(guard.x - w / 2, guard.y - 30, (w * guard.suspicion) / 100, 6);
    if (guard.state === 'chase') {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 12px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 36);
    } else if (guard.state === 'suspicious') {
      ctx.fillStyle = '#ffd75a';
      ctx.font = 'bold 12px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, guard.y - 36);
    }
  }
}

export function drawPlayer(ctx, player, time) {
  // A hooded thief: dark cloak, pale scarf, soft shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath(); ctx.ellipse(player.x, player.y + 8, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = player.hidden ? '#2e6b3e' : '#2b2f45';
  ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8f7bff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8ecff';
  ctx.beginPath(); ctx.arc(player.x - 4, player.y - 2, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(player.x + 4, player.y - 2, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8f7bff';
  ctx.fillRect(player.x - 7, player.y + 4, 14, 3);
  if (player.hidden) {
    ctx.fillStyle = 'rgba(220, 255, 220, 0.9)';
    ctx.font = 'bold 11px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', player.x, player.y - 20);
  }
  if (player.running) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 6 + Math.sin(time * 10) * 2, 0, Math.PI * 2); ctx.stroke();
  }
}

export function drawHUD(ctx, game) {
  ctx.fillStyle = 'rgba(6, 8, 18, 0.82)';
  ctx.fillRect(0, 0, WORLD_W, 46);
  ctx.fillStyle = '#e8ecff';
  ctx.font = 'bold 15px ' + FONT;
  ctx.textAlign = 'left';
  ctx.fillText(game.level.name, 14, 20);
  ctx.font = '13px ' + FONT;
  ctx.fillStyle = '#aab4e0';
  ctx.fillText(game.level.hint, 14, 38);
  // Objective: relics.
  const got = game.level.relics.filter((r) => r.taken).length;
  const total = game.level.relics.length;
  ctx.fillStyle = '#ffd75a';
  ctx.font = 'bold 14px ' + FONT;
  ctx.textAlign = 'right';
  ctx.fillText(`RELICS ${got}/${total}   SCORE ${game.score}   TIME ${Math.floor(game.levelTime)}s`, WORLD_W - 14, 20);
  ctx.fillStyle = '#ff6b6b';
  ctx.fillText(`♥`.repeat(Math.max(0, game.lives)) + `♡`.repeat(Math.max(0, 3 - game.lives)), WORLD_W - 14, 38);
  // Alarm meter: the louder the colour, the closer the chase.
  const alarm = game.alarm;
  const ax = WORLD_W / 2 - 130;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  roundRect(ctx, ax, 52, 260, 12, 6);
  ctx.fill();
  const ag = ctx.createLinearGradient(ax, 0, ax + 260, 0);
  ag.addColorStop(0, '#3fae5a');
  ag.addColorStop(0.6, '#ffc93c');
  ag.addColorStop(1, '#ff4646');
  ctx.fillStyle = ag;
  if (alarm > 0) {
    roundRect(ctx, ax, 52, (260 * alarm) / 100, 12, 6);
    ctx.fill();
  }
  ctx.fillStyle = alarm > 66 ? '#ff8080' : '#c9d2ff';
  ctx.font = 'bold 11px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillText(alarm >= 100 ? 'ALARM! HIDE!' : alarm > 40 ? 'SUSPICION RISING…' : 'ALARM', WORLD_W / 2, 74);
  if (game.message) {
    ctx.fillStyle = 'rgba(6, 8, 18, 0.75)';
    const mw = ctx.measureText(game.message).width + 28;
    roundRect(ctx, WORLD_W / 2 - mw / 2, WORLD_H - 44, mw, 28, 8);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '14px ' + FONT;
    ctx.fillText(game.message, WORLD_W / 2, WORLD_H - 25);
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5, 7, 16, 0.78)';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillText(title, WORLD_W / 2, 210);
  ctx.fillStyle = '#e8ecff';
  ctx.font = '17px ' + FONT;
  lines.forEach((line, i) => ctx.fillText(line, WORLD_W / 2, 258 + i * 28));
}

export function drawTitle(ctx, game) {
  overlay(ctx, 'MOONLIGHT MUSEUM', [
    'Wren, the shadow courier, slips into the museum at midnight.',
    'Steal every relic, reach the green EXIT — and never let a guard see you.',
    '',
    'Move: WASD / arrows   •   Run (loud): Shift   •   Click: walk there',
    'Hide in the bushes. Moonlight makes you easier to spot.',
    '',
    'Press ENTER or click to begin — 3 halls, 8 relics, one quiet night.',
  ], '#c9b8ff');
  ctx.fillStyle = '#8f7bff';
  ctx.font = 'bold 15px ' + FONT;
  ctx.fillText('A stealth game — guards, vision cones, cover, and an exit to reach unseen.', WORLD_W / 2, 480);
}

export function drawCaught(ctx, game) {
  overlay(ctx, 'CAUGHT!', [
    `A guard grabbed Wren in ${game.level.name}.`,
    game.lives > 0 ? `${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left — press ENTER to slip back in.` : 'No lives left.',
  ], '#ff6b6b');
}

export function drawGameOver(ctx, game) {
  overlay(ctx, 'THE NIGHT ENDS', [
    'The museum guards know every shadow now.',
    `Final score: ${game.score} — relics stolen: ${game.relicsStolen} of 8.`,
    'Press ENTER to try the night again.',
  ], '#ff6b6b');
}

export function drawWin(ctx, game) {
  overlay(ctx, 'THE QUIET GETAWAY', [
    'Every relic is gone and no alarm ever caught Wren for long.',
    `Final score: ${game.score}   •   Time: ${Math.floor(game.totalTime)}s   •   Relics: ${game.relicsStolen} of 8`,
    game.ghostRun ? 'GHOST RUN — never fully spotted. The perfect night.' : 'Press ENTER to play the night again.',
  ], '#7dff9e');
}

export function drawLevelClear(ctx, game) {
  overlay(ctx, 'HALL CLEARED', [
    `${game.level.name} — relics secured.`,
    `Score: ${game.score}`,
    'Press ENTER for the next hall.',
  ], '#7dff9e');
}
