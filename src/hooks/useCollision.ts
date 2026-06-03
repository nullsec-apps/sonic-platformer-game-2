import {
  ENEMY_SCORE,
  HURT_KNOCKBACK_X,
  HURT_KNOCKBACK_Y,
  INVULN_MS,
  SCATTER_BASE_SPEED,
  SCATTER_RING_MAX,
  SPRING_FORCE,
  STOMP_BOUNCE,
} from '../lib/physicsConstants';
import type {
  Enemy,
  LevelData,
  Obstacle,
  ParticleScatter,
  PlayerState,
  Rect,
  Ring,
  TileRow,
} from '../types';

// AABB + tile collision resolution between Sonic, the tilemap, rings, enemies,
// and hazards. Pure functions that mutate the passed entities and return events
// for the game loop to react to (sounds, score, life loss, ring scatter).

export interface CollisionEvents {
  ringsPicked: number;
  scoreGained: number;
  enemiesKilled: number;
  damaged: boolean;
  bounced: boolean;
  sprung: boolean;
  goalReached: boolean;
  fellOut: boolean;
  scatteredRings: Ring[];
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function playerRect(p: PlayerState): Rect {
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}

/** Resolve player vs solid tiles. Mutates player position/velocity, sets grounded. */
export function resolveTiles(p: PlayerState, solids: TileRow[]): void {
  p.grounded = false;

  // Vertical resolution first.
  for (const s of solids) {
    const pr = playerRect(p);
    if (!overlaps(pr, s)) continue;
    const prevBottom = p.y + p.h - p.vy;
    const prevTop = p.y - p.vy;
    if (p.vy >= 0 && prevBottom <= s.y + 2) {
      // Landing on top
      p.y = s.y - p.h;
      p.vy = 0;
      p.grounded = true;
    } else if (p.vy < 0 && prevTop >= s.y + s.h - 2) {
      // Hitting head
      p.y = s.y + s.h;
      p.vy = 0;
    }
  }

  // Horizontal resolution.
  for (const s of solids) {
    const pr = playerRect(p);
    if (!overlaps(pr, s)) continue;
    const prevRight = p.x + p.w - p.vx;
    const prevLeft = p.x - p.vx;
    // Only resolve side collisions when there is meaningful vertical overlap
    const vOverlap = Math.min(p.y + p.h, s.y + s.h) - Math.max(p.y, s.y);
    if (vOverlap < 4) continue;
    if (p.vx > 0 && prevRight <= s.x + 2) {
      p.x = s.x - p.w;
      if (p.vx > 0) p.vx = 0;
    } else if (p.vx < 0 && prevLeft >= s.x + s.w - 2) {
      p.x = s.x + s.w;
      if (p.vx < 0) p.vx = 0;
    }
  }
}

/** Scatter rings outward from the player when damaged. */
export function scatterRings(p: PlayerState, count: number, nextId: () => number): Ring[] {
  const total = Math.min(count, SCATTER_RING_MAX);
  const rings: Ring[] = [];
  for (let i = 0; i < total; i++) {
    const angle = (Math.PI * 2 * i) / total + Math.random() * 0.3;
    const speed = SCATTER_BASE_SPEED * (0.6 + Math.random() * 0.6);
    rings.push({
      id: nextId(),
      x: p.x + p.w / 2 - 6,
      y: p.y + p.h / 2 - 6,
      w: 12,
      h: 12,
      collected: false,
      animFrame: Math.floor(Math.random() * 8),
      animTimer: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      scattered: true,
      lifeMs: 0,
    });
  }
  return rings;
}

/**
 * Full collision pass: rings, obstacles (spike/spring/block), enemies, goal,
 * and pit/fall-out. Mutates entities; returns aggregated events.
 */
export function resolveEntities(
  p: PlayerState,
  rings: Ring[],
  enemies: Enemy[],
  obstacles: Obstacle[],
  level: LevelData,
  currentRings: number,
  nextRingId: () => number
): CollisionEvents {
  const events: CollisionEvents = {
    ringsPicked: 0,
    scoreGained: 0,
    enemiesKilled: 0,
    damaged: false,
    bounced: false,
    sprung: false,
    goalReached: false,
    fellOut: false,
    scatteredRings: [],
  };

  const pr = playerRect(p);
  const invulnerable = p.invulnMs > 0;
  const isAttacking = p.rolling || p.charging || p.vy > 0.5 || !p.grounded;

  // Rings
  for (const r of rings) {
    if (r.collected) continue;
    if (r.scattered && (r.lifeMs ?? 0) < 300) continue; // grace before re-pickup
    if (overlaps(pr, r)) {
      r.collected = true;
      events.ringsPicked += 1;
    }
  }

  // Obstacles
  for (const o of obstacles) {
    if (!overlaps(pr, o)) continue;
    if (o.kind === 'spring') {
      p.vy = SPRING_FORCE;
      p.grounded = false;
      events.sprung = true;
    } else if (o.kind === 'spike') {
      if (!invulnerable) {
        applyDamage(p, o.x + o.w / 2);
        events.damaged = true;
        events.scatteredRings = scatterRings(p, currentRings, nextRingId);
      }
    } else if (o.kind === 'block') {
      // Solid block: push out horizontally
      const prevRight = p.x + p.w - p.vx;
      const prevLeft = p.x - p.vx;
      const prevBottom = p.y + p.h - p.vy;
      if (p.vy >= 0 && prevBottom <= o.y + 2) {
        p.y = o.y - p.h;
        p.vy = 0;
        p.grounded = true;
      } else if (p.vx > 0 && prevRight <= o.x + 2) {
        p.x = o.x - p.w;
        p.vx = 0;
      } else if (p.vx < 0 && prevLeft >= o.x + o.w - 2) {
        p.x = o.x + o.w;
        p.vx = 0;
      }
    }
  }

  // Enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    const er: Rect = { x: e.x, y: e.y, w: e.w, h: e.h };
    if (!overlaps(pr, er)) continue;
    const stomping = p.vy > 0 && p.y + p.h - p.vy <= e.y + e.h * 0.6;
    if (stomping || (isAttacking && (p.rolling || p.charging))) {
      e.alive = false;
      events.enemiesKilled += 1;
      events.scoreGained += ENEMY_SCORE;
      if (stomping) {
        p.vy = STOMP_BOUNCE;
        events.bounced = true;
      }
    } else if (!invulnerable) {
      applyDamage(p, e.x + e.w / 2);
      events.damaged = true;
      events.scatteredRings = scatterRings(p, currentRings, nextRingId);
    }
  }

  // Goal
  if (p.x + p.w >= level.goalX) {
    events.goalReached = true;
  }

  // Fall out of bounds (pit / below level)
  if (p.y > level.height + 80) {
    events.fellOut = true;
  }

  return events;
}

/** Apply damage knockback + invulnerability + hurt animation. */
export function applyDamage(p: PlayerState, sourceX: number): void {
  const dir = p.x + p.w / 2 < sourceX ? -1 : 1;
  p.vx = dir * HURT_KNOCKBACK_X;
  p.vy = HURT_KNOCKBACK_Y;
  p.invulnMs = INVULN_MS;
  p.rolling = false;
  p.charging = false;
  p.chargePower = 0;
  p.grounded = false;
  p.anim = 'hurt';
}

/** Update scattered rings physics (gravity, life decay). Removes dead/collected. */
export function updateScatteredRings(rings: Ring[], dtMs: number, gravity: number): Ring[] {
  for (const r of rings) {
    if (!r.scattered) continue;
    r.lifeMs = (r.lifeMs ?? 0) + dtMs;
    r.vy = (r.vy ?? 0) + gravity;
    r.x += r.vx ?? 0;
    r.y += r.vy ?? 0;
    r.vx = (r.vx ?? 0) * 0.99;
  }
  return rings;
}

/** Update generic ring spin frames. */
export function updateRingAnims(rings: Ring[], dtMs: number, frameMs: number): void {
  for (const r of rings) {
    if (r.collected) continue;
    r.animTimer += dtMs;
    while (r.animTimer >= frameMs) {
      r.animTimer -= frameMs;
      r.animFrame = (r.animFrame + 1) % 8;
    }
  }
}

/** Update scatter particle bursts (damage feedback). Returns surviving particles. */
export function updateParticles(
  particles: ParticleScatter[],
  dtMs: number,
  gravity: number
): ParticleScatter[] {
  const out: ParticleScatter[] = [];
  for (const p of particles) {
    p.lifeMs -= dtMs;
    if (p.lifeMs <= 0) continue;
    p.vy += gravity;
    p.x += p.vx;
    p.y += p.vy;
    out.push(p);
  }
  return out;
}
