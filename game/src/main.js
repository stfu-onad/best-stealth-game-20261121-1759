// main.js — Moonlight Museum: the game loop, the night's state machine, and
// the staged screenshot poses (?shot=start|play|hide|exit) the maker uses to
// photograph the real game in a browser.

import { LEVELS, buildLevel, WORLD_W, WORLD_H } from './levels.js';
import { Guard, CATCH_RADIUS } from './guards.js';
import { Player } from './player.js';
import { createInput } from './input.js';
import { SoundEngine } from './audio.js';
import {
  MOON_POOLS,
  drawFloor, drawCover, drawWalls, drawRelicsAndExit, drawGuard, drawPlayer,
  drawHUD, drawTitle, drawCaught, drawGameOver, drawWin, drawLevelClear,
} from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const game = {
  screen: 'title', // title | play | caught | levelclear | gameover | win
  levelIndex: 0,
  level: null,
  guards: [],
  player: null,
  score: 0,
  lives: 3,
  levelTime: 0,
  totalTime: 0,
  relicsStolen: 0,
  ghostRun: true,
  alarm: 0,
  message: '',
  messageTimer: 0,
  time: 0,
};

const input = createInput(canvas);
const sound = new SoundEngine();
// A read-only handle for automated play-testing; the game never reads it.
window.__moonlight = game;
let shotMode = null;
let guardStepTimer = 0;

function solidsOf(level) {
  return [...level.walls, ...level.crates];
}

function loadLevel(index) {
  game.levelIndex = index;
  game.level = buildLevel(index);
  game.guards = game.level.guards.map((g) => new Guard(g));
  game.player = new Player(game.level.start.x, game.level.start.y);
  game.levelTime = 0;
  game.alarm = 0;
  game.message = game.level.hint;
  game.messageTimer = 4;
}

function showMessage(text, seconds = 3.5) {
  game.message = text;
  game.messageTimer = seconds;
}

function exitIsOpen() {
  return game.level.relics.every((r) => r.taken);
}

function startGame() {
  sound.ensure();
  game.score = 0;
  game.lives = 3;
  game.totalTime = 0;
  game.relicsStolen = 0;
  game.ghostRun = true;
  loadLevel(0);
  game.screen = 'play';
}

function nextLevel() {
  const bonus = Math.max(100, 600 - Math.floor(game.levelTime) * 5);
  game.score += bonus;
  showMessage(`Hall bonus +${bonus}`, 3);
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.screen = 'win';
    sound.winFanfare();
  } else {
    loadLevel(game.levelIndex + 1);
    game.screen = 'play';
  }
}

function onCaught() {
  game.lives -= 1;
  game.ghostRun = false;
  sound.caughtThud();
  if (game.lives <= 0) {
    game.screen = 'gameover';
  } else {
    game.screen = 'caught';
  }
}

function updatePlay(dt) {
  game.levelTime += dt;
  game.totalTime += dt;
  const solids = solidsOf(game.level);
  const step = game.player.update(dt, input, solids, game.level.bushes, MOON_POOLS);
  if (step.stepped) {
    sound.footstep(step.running, 0);
    if (step.running) {
      // Running is loud: nearby patrolling guards come to listen.
      for (const g of game.guards) {
        if (Math.hypot(g.x - game.player.x, g.y - game.player.y) < 190) g.hearNoise(game.player.x, game.player.y);
      }
    }
  }
  // Guard footsteps, panned by direction, so you hear patrols approaching.
  guardStepTimer -= dt;
  if (guardStepTimer <= 0) {
    guardStepTimer = 0.55;
    let nearest = null;
    let nearestD = 1e9;
    for (const g of game.guards) {
      const d = Math.hypot(g.x - game.player.x, g.y - game.player.y);
      if (d < nearestD) { nearestD = d; nearest = g; }
    }
    if (nearest && nearestD < 260) {
      sound.guardStep((nearest.x - game.player.x) / 260);
    }
  }
  const blockers = solids;
  let topSuspicion = 0;
  let anyChase = false;
  for (const g of game.guards) {
    const before = g.state;
    g.update(dt, game.player, blockers);
    if (g.state === 'chase' && before !== 'chase') sound.alertSting();
    if (g.state === 'chase') anyChase = true;
    topSuspicion = Math.max(topSuspicion, g.suspicion);
    if (g.caughtPlayer(game.player)) {
      onCaught();
      return;
    }
  }
  game.alarm = topSuspicion;
  if (anyChase) game.ghostRun = false;
  // Relic pickup.
  for (const r of game.level.relics) {
    if (!r.taken && Math.hypot(r.x - game.player.x, r.y - game.player.y) < 26) {
      r.taken = true;
      game.relicsStolen += 1;
      game.score += 250;
      sound.pickupChime();
      showMessage(`${r.name} secured! (+250)`);
      if (exitIsOpen()) {
        showMessage('All relics taken — the EXIT is open!', 4);
        sound.exitOpen();
      }
    }
  }
  // Exit.
  const e = game.level.exit;
  const inExit = game.player.x > e.x && game.player.x < e.x + e.w
    && game.player.y > e.y && game.player.y < e.y + e.h;
  if (inExit) {
    if (exitIsOpen()) {
      game.score += 500;
      game.screen = 'levelclear';
      sound.winFanfare();
    } else {
      showMessage('The exit is locked — steal every relic first.', 1.2);
    }
  }
  if (game.messageTimer > 0) {
    game.messageTimer -= dt;
    if (game.messageTimer <= 0) game.message = '';
  }
  statusEl.textContent = `${game.level.name}. Relics ${game.level.relics.filter((r) => r.taken).length} of ${game.level.relics.length}. Alarm ${Math.round(game.alarm)} percent.`;
}

function update(dt) {
  game.time += dt;
  if (input.click && game.screen === 'play') {
    game.player.moveTarget = input.click;
    input.click = null;
  } else if (input.click && game.screen === 'title') {
    input.click = null;
    startGame();
    return;
  } else {
    input.click = null;
  }
  const enter = input.pressed.Enter || input.pressed.Space;
  if (game.screen === 'title' && (enter || input.pressed.MouseClick)) startGame();
  else if (game.screen === 'caught' && enter) { loadLevel(game.levelIndex); game.screen = 'play'; }
  else if (game.screen === 'levelclear' && enter) nextLevel();
  else if ((game.screen === 'gameover' || game.screen === 'win') && enter) startGame();
  input.pressed = {};
  if (game.screen === 'play') updatePlay(dt);
  if (shotMode) freezeForShot();
}

function render() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cw = canvas.clientWidth || window.innerWidth;
  const ch = canvas.clientHeight || window.innerHeight;
  if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
  }
  const scale = Math.min(canvas.width / WORLD_W, canvas.height / WORLD_H);
  const ox = (canvas.width - WORLD_W * scale) / 2;
  const oy = (canvas.height - WORLD_H * scale) / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#05060f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, ox, oy);
  drawFloor(ctx);
  drawCover(ctx, game.level);
  drawWalls(ctx, game.level);
  drawRelicsAndExit(ctx, game.level, exitIsOpen(), game.time);
  for (const g of game.guards) drawGuard(ctx, g, game.time);
  drawPlayer(ctx, game.player, game.time);
  drawHUD(ctx, game);
  if (game.screen === 'title') drawTitle(ctx, game);
  else if (game.screen === 'caught') drawCaught(ctx, game);
  else if (game.screen === 'gameover') drawGameOver(ctx, game);
  else if (game.screen === 'win') drawWin(ctx, game);
  else if (game.screen === 'levelclear') drawLevelClear(ctx, game);
}

// freezeForShot poses a real, running game state for the camera: the world,
// guards and cones are live renders, only the actors are placed for the shot.
function freezeForShot() {
  if (shotMode === 'play') {
    game.player.x = 500; game.player.y = 340;
    game.player.hidden = false;
    game.guards[0].x = 420; game.guards[0].y = 330;
    game.guards[0].angle = 0.1; game.guards[0].suspicion = 62; game.guards[0].state = 'suspicious';
    game.guards[1].x = 760; game.guards[1].y = 180;
    game.guards[1].angle = Math.PI / 2; game.guards[1].suspicion = 12;
    game.alarm = 62;
  } else if (shotMode === 'hide') {
    game.player.x = 250; game.player.y = 300;
    game.player.hidden = true;
    game.guards[0].x = 340; game.guards[0].y = 300;
    game.guards[0].angle = Math.PI; game.guards[0].suspicion = 45; game.guards[0].state = 'suspicious';
    game.guards[1].x = 700; game.guards[1].y = 120;
    game.guards[1].angle = Math.PI / 2;
    game.alarm = 45;
    game.message = 'Hidden in the bushes — the guard walks right past.';
    game.messageTimer = 99;
  } else if (shotMode === 'exit') {
    loadLevelOnceForShot();
    game.player.x = 840; game.player.y = 120;
    game.guards[2].x = 480; game.guards[2].y = 300;
    game.guards[2].angle = -Math.PI / 2; game.guards[2].suspicion = 8;
    game.guards[0].x = 300; game.guards[0].y = 200;
    game.guards[0].angle = 0;
    game.guards[1].x = 700; game.guards[1].y = 380;
    game.guards[1].angle = Math.PI;
    game.alarm = 8;
    game.message = 'All relics taken — slip through the EXIT unseen.';
    game.messageTimer = 99;
  }
}

let exitShotLoaded = false;
function loadLevelOnceForShot() {
  if (exitShotLoaded) return;
  exitShotLoaded = true;
  loadLevel(2);
  for (const r of game.level.relics) { r.taken = true; game.relicsStolen += 1; }
  game.score = 1750;
}

function applyShotParam() {
  const params = new URLSearchParams(window.location.search);
  shotMode = params.get('shot');
  if (!shotMode) return;
  if (shotMode === 'start') {
    loadLevel(0);
    game.screen = 'title';
  } else if (shotMode === 'play' || shotMode === 'hide') {
    loadLevel(0);
    game.screen = 'play';
    game.score = 250;
    game.level.relics[0].taken = true;
    game.relicsStolen = 1;
  } else if (shotMode === 'exit') {
    loadLevel(2);
    game.screen = 'play';
    game.score = 1750;
    for (const r of game.level.relics) { r.taken = true; game.relicsStolen += 1; }
    exitShotLoaded = true;
  }
}

loadLevel(0);
applyShotParam();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shotMode) update(dt);
  else { game.time += dt; freezeForShot(); }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
