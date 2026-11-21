// player.js — Wren, the shadow courier: walks quiet, runs loud, and vanishes
// inside a bush. Movement collides against walls and crates as a circle.

export const PLAYER_RADIUS = 13;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = PLAYER_RADIUS;
    this.running = false;
    this.hidden = false; // inside a bush
    this.inMoonlight = false; // standing in a moonlit patch: seen faster
    this.stepTimer = 0;
    this.moved = 0; // distance walked, drives the footstep sounds
    this.moveTarget = null; // mouse click-to-move destination
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.running = false;
    this.hidden = false;
    this.moveTarget = null;
  }

  collidesWithRect(nx, ny, r) {
    const cx = Math.max(r.x, Math.min(nx, r.x + r.w));
    const cy = Math.max(r.y, Math.min(ny, r.y + r.h));
    return Math.hypot(nx - cx, ny - cy) < this.radius;
  }

  update(dt, input, solids, bushes, moonPools) {
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (dx === 0 && dy === 0 && this.moveTarget) {
      const tx = this.moveTarget.x - this.x;
      const ty = this.moveTarget.y - this.y;
      const d = Math.hypot(tx, ty);
      if (d < 8) {
        this.moveTarget = null;
      } else {
        dx = tx / d;
        dy = ty / d;
      }
    }
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    }
    this.running = !!input.run && len > 0;
    const speed = this.running ? 205 : 128;
    const nx = this.x + dx * speed * dt;
    const ny = this.y + dy * speed * dt;
    // Move axis by axis so the thief slides along walls instead of sticking.
    if (!solids.some((r) => this.collidesWithRect(nx, this.y, r))) this.x = nx;
    if (!solids.some((r) => this.collidesWithRect(this.x, ny, r))) this.y = ny;
    this.x = Math.max(18 + this.radius, Math.min(942 - this.radius, this.x));
    this.y = Math.max(18 + this.radius, Math.min(582 - this.radius, this.y));
    const step = Math.hypot(this.x - (this.px ?? this.x), this.y - (this.py ?? this.y));
    this.moved += step;
    this.px = this.x;
    this.py = this.y;

    this.hidden = bushes.some((b) => Math.hypot(this.x - b.x, this.y - b.y) < b.r - 4);
    this.inMoonlight = moonPools.some((m) => Math.hypot(this.x - m.x, this.y - m.y) < m.r);

    // Footstep timing: quicker while running, which is also what guards hear.
    this.stepTimer -= dt;
    if (len > 0 && this.stepTimer <= 0) {
      this.stepTimer = this.running ? 0.26 : 0.42;
      return { stepped: true, running: this.running };
    }
    return { stepped: false, running: false };
  }
}
