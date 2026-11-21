// guards.js — patrol routes you can learn, vision cones you can read, and a
// suspicion meter that gives the thief a chance to slip away before the alarm.

export const CONE_RANGE = 185;
export const CONE_HALF_ANGLE = 0.56; // radians, about 32 degrees each side
export const CATCH_RADIUS = 20;

const TAU = Math.PI * 2;

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle (wall or crate)?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// hasLineOfSight: walls and crates block a guard's gaze; bushes never do.
export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (const r of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return false;
  }
  return true;
}

// canGuardSee: range, cone angle, line of sight, and darkness. A thief
// crouched in a bush is invisible unless the guard is almost on top of them.
export function canGuardSee(guard, player, blockers) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return 0;
  const facing = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(facing, guard.angle)) > CONE_HALF_ANGLE) return 0;
  if (!hasLineOfSight(guard.x, guard.y, player.x, player.y, blockers)) return 0;
  if (player.hidden && dist > 46) return 0;
  // Closer and more exposed means spotted faster; moonlit floor is riskier.
  let rate = 1.6 - dist / CONE_RANGE;
  if (player.running) rate *= 1.5;
  if (player.inMoonlight) rate *= 1.25;
  return Math.max(0.25, rate);
}

export class Guard {
  constructor(def) {
    this.path = def.points;
    this.speed = def.speed;
    this.pause = def.pause;
    this.waypoint = 0;
    this.x = def.points[0][0];
    this.y = def.points[0][1];
    this.angle = 0;
    this.waitTimer = 0;
    this.state = 'patrol'; // patrol | suspicious | chase | investigate | return
    this.suspicion = 0; // 0..100, per guard
    this.lastSeenX = 0;
    this.lastSeenY = 0;
    this.lookTimer = 0;
    this.lookFrom = 0;
    this.alerted = false; // has this guard ever raised a full alarm?
  }

  faceToward(tx, ty) {
    this.angle = Math.atan2(ty - this.y, tx - this.x);
  }

  stepToward(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return true;
    const step = Math.min(d, speed * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
    this.angle = Math.atan2(dy, dx);
    return d - step < 2;
  }

  update(dt, player, blockers, onNoise) {
    const seen = canGuardSee(this, player, blockers);
    if (seen > 0) {
      this.suspicion += seen * 55 * dt;
      this.lastSeenX = player.x;
      this.lastSeenY = player.y;
      if (this.suspicion >= 100) {
        this.suspicion = 100;
        if (this.state !== 'chase') this.alerted = true;
        this.state = 'chase';
      } else if (this.state === 'patrol') {
        this.state = 'suspicious';
      }
    } else if (this.state !== 'chase' && this.state !== 'investigate') {
      this.suspicion = Math.max(0, this.suspicion - 22 * dt);
      if (this.suspicion <= 0 && this.state === 'suspicious') this.state = 'patrol';
    }

    if (this.state === 'chase') {
      if (seen > 0) {
        this.lastSeenX = player.x;
        this.lastSeenY = player.y;
      }
      const arrived = this.stepToward(this.lastSeenX, this.lastSeenY, this.speed * 1.9, dt);
      if (arrived || seen === 0) {
        // Lost the thief: search the spot, then give up and go back.
        this.state = 'investigate';
        this.lookTimer = 2.2;
        this.lookFrom = this.angle;
      }
      if (seen === 0) this.suspicion = Math.max(0, this.suspicion - 30 * dt);
      if (this.suspicion <= 0) this.state = 'return';
      return;
    }

    if (this.state === 'investigate') {
      this.lookTimer -= dt;
      this.angle = this.lookFrom + Math.sin(this.lookTimer * 2.4) * 1.1;
      if (this.lookTimer <= 0) this.state = 'return';
      return;
    }

    if (this.state === 'return') {
      const target = this.path[this.waypoint];
      if (this.stepToward(target[0], target[1], this.speed, dt)) {
        this.state = 'patrol';
        this.waitTimer = this.pause;
      }
      return;
    }

    if (this.state === 'suspicious') {
      // Freeze, stare at the glimpse, then walk over to check it out.
      this.faceToward(this.lastSeenX, this.lastSeenY);
      const arrived = this.stepToward(this.lastSeenX, this.lastSeenY, this.speed * 0.7, dt);
      if (arrived) {
        this.state = 'investigate';
        this.lookTimer = 1.6;
        this.lookFrom = this.angle;
      }
      return;
    }

    // Patrol: walk the route, pausing at each waypoint to look around.
    if (this.waitTimer > 0) {
      this.waitTimer -= dt;
      this.angle += Math.sin(performance.now() / 900 + this.x) * 0.002;
      return;
    }
    const target = this.path[this.waypoint];
    if (this.stepToward(target[0], target[1], this.speed, dt)) {
      this.waypoint = (this.waypoint + 1) % this.path.length;
      this.waitTimer = this.pause;
    }
  }

  // hearNoise: a running thief's footsteps pull a patrolling guard over.
  hearNoise(nx, ny) {
    if (this.state === 'patrol' || this.state === 'suspicious') {
      this.lastSeenX = nx;
      this.lastSeenY = ny;
      this.suspicion = Math.max(this.suspicion, 35);
      this.state = 'suspicious';
    }
  }

  // caughtPlayer: only a chasing guard that actually reaches the thief ends the run.
  caughtPlayer(player) {
    return this.state === 'chase' && Math.hypot(player.x - this.x, player.y - this.y) < CATCH_RADIUS;
  }
}
