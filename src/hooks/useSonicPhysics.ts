import { useCallback } from 'react';
import type { InputState, PlayerState, TileRow, SonicAnim } from '../types';
import {
  ACCELERATION,
  AIR_ACCELERATION,
  AIR_FRICTION,
  DECELERATION,
  FRICTION,
  GRAVITY,
  JUMP_FORCE,
  JUMP_MAX_HOLD_MS,
  JUMP_RELEASE_CAP,
  MAX_FALL_SPEED,
  MIN_ROLL_SPEED,
  PLAYER_HEIGHT,
  PLAYER_ROLL_HEIGHT,
  ROLL_DECELERATION,
  ROLL_FRICTION,
  SPINDASH_CHARGE_MAX,
  SPINDASH_CHARGE_RATE,
  SPINDASH_DECAY,
  SPINDASH_MAX_SPEED,
  SPINDASH_RELEASE_BASE,
  SPINDASH_RELEASE_SCALE,
  TOP_SPEED,
} from '../lib/physicsConstants';
import { advanceAnim } from '../lib/spriteAnimations';
import { resolveTiles } from './useCollision';

export interface PhysicsEvents {
  jumped: boolean;
  spindashCharging: boolean;
  spindashReleased: boolean;
  spindashPower: number;
  landed: boolean;
}

export interface UseSonicPhysics {
  step: (
    p: PlayerState,
    input: InputState,
    solids: TileRow[],
    levelWidth: number
  ) => PhysicsEvents;
}

function noEvents(): PhysicsEvents {
  return {
    jumped: false,
    spindashCharging: false,
    spindashReleased: false,
    spindashPower: 0,
    landed: false,
  };
}

/**
 * Momentum-based Sonic controller. Mutates the player state in place each
 * fixed step and returns events the caller (audio/fx) can react to.
 */
export function useSonicPhysics(): UseSonicPhysics {
  const step = useCallback(
    (
      p: PlayerState,
      input: InputState,
      solids: TileRow[],
      levelWidth: number
    ): PhysicsEvents => {
      const ev = noEvents();
      const wasGrounded = p.grounded;
      const hurt = p.invulnMs > 0 && p.anim === 'hurt' && !p.grounded;

      // --- Spin-dash charge: crouch on ground (no horizontal momentum) + jump ---
      const canSpindash = p.grounded && input.crouch && Math.abs(p.vx) < 0.4;
      if (canSpindash && input.jump) {
        if (!p.charging) {
          p.charging = true;
          p.chargePower = 0;
          ev.spindashCharging = true;
        }
      }
      if (p.charging) {
        // Keep charging while crouch held; rev on each jump tap.
        if (input.jump && input.jumpHeldMs < 60) {
          p.chargePower = Math.min(SPINDASH_CHARGE_MAX, p.chargePower + SPINDASH_CHARGE_RATE * 4);
          ev.spindashCharging = true;
        } else if (input.crouch) {
          // Slow bleed while held without revving.
          p.chargePower = Math.max(0, p.chargePower - SPINDASH_CHARGE_RATE * 0.2);
        }
        if (!input.crouch) {
          // Release!
          const launch = Math.min(
            SPINDASH_MAX_SPEED,
            SPINDASH_RELEASE_BASE + p.chargePower * SPINDASH_RELEASE_SCALE
          );
          p.vx = launch * p.facing;
          p.rolling = true;
          p.charging = false;
          ev.spindashReleased = true;
          ev.spindashPower = p.chargePower;
          p.chargePower = 0;
        }
      }

      // --- Horizontal movement ---
      const moveLeft = input.left && !p.charging;
      const moveRight = input.right && !p.charging;
      const accel = p.grounded ? ACCELERATION : AIR_ACCELERATION;

      if (!hurt && !p.charging) {
        if (moveLeft) {
          if (p.vx > 0) p.vx -= p.rolling ? ROLL_DECELERATION : DECELERATION;
          else p.vx -= accel;
          p.facing = -1;
        } else if (moveRight) {
          if (p.vx < 0) p.vx += p.rolling ? ROLL_DECELERATION : DECELERATION;
          else p.vx += accel;
          p.facing = 1;
        } else {
          // Friction / roll friction
          if (p.grounded) {
            const fr = p.rolling ? ROLL_FRICTION : FRICTION;
            if (p.vx > 0) p.vx = Math.max(0, p.vx - fr);
            else if (p.vx < 0) p.vx = Math.min(0, p.vx + fr);
          } else {
            if (p.vx > 0) p.vx = Math.max(0, p.vx - AIR_FRICTION);
            else if (p.vx < 0) p.vx = Math.min(0, p.vx + AIR_FRICTION);
          }
        }
      }

      // Rolling decay (launched spin-dash / roll)
      if (p.rolling && p.grounded) {
        if (p.vx > 0) p.vx = Math.max(0, p.vx - SPINDASH_DECAY);
        else if (p.vx < 0) p.vx = Math.min(0, p.vx + SPINDASH_DECAY);
        if (Math.abs(p.vx) < MIN_ROLL_SPEED && Math.abs(p.vx) < 0.05) {
          p.rolling = false;
        }
      }

      // Start rolling when crouching while moving fast on ground
      if (p.grounded && input.crouch && !p.charging && Math.abs(p.vx) >= MIN_ROLL_SPEED) {
        p.rolling = true;
      }
      if (p.grounded && !input.crouch && Math.abs(p.vx) < MIN_ROLL_SPEED && !ev.spindashReleased) {
        p.rolling = false;
      }

      // Clamp top speed (rolling/launch allowed faster)
      const cap = p.rolling ? SPINDASH_MAX_SPEED : TOP_SPEED;
      if (p.vx > cap) p.vx = cap;
      if (p.vx < -cap) p.vx = -cap;

      // --- Jumping (variable height) ---
      if (!p.charging && !hurt) {
        if (p.grounded && input.jump && input.jumpHeldMs < 30 && !input.crouch) {
          p.vy = JUMP_FORCE;
          p.grounded = false;
          ev.jumped = true;
        }
        // Variable jump: cap upward velocity if released early
        if (!p.grounded && p.vy < JUMP_RELEASE_CAP) {
          if (!input.jump || input.jumpHeldMs > JUMP_MAX_HOLD_MS) {
            p.vy = JUMP_RELEASE_CAP;
          }
        }
      }

      // --- Gravity ---
      p.vy += GRAVITY;
      if (p.vy > MAX_FALL_SPEED) p.vy = MAX_FALL_SPEED;

      // --- Collision box height (crouch/roll shrinks) ---
      const targetH = p.rolling || (p.grounded && input.crouch) ? PLAYER_ROLL_HEIGHT : PLAYER_HEIGHT;
      if (targetH !== p.h) {
        const diff = p.h - targetH;
        p.y += diff; // keep feet planted
        p.h = targetH;
      }

      // --- Integrate + resolve tiles ---
      p.x += p.vx;
      p.y += p.vy;
      const groundedBefore = p.grounded;
      p.grounded = false;
      resolveTiles(p, solids);

      // World bounds
      if (p.x < 0) {
        p.x = 0;
        if (p.vx < 0) p.vx = 0;
      }
      if (p.x + p.w > levelWidth) {
        p.x = levelWidth - p.w;
        if (p.vx > 0) p.vx = 0;
      }

      // Landing event
      if (p.grounded && !wasGrounded) {
        ev.landed = true;
        if (input.crouch && Math.abs(p.vx) >= MIN_ROLL_SPEED) p.rolling = true;
        else if (!input.crouch) p.rolling = false;
      }
      void grounundedNoop(grounded => grounded);
      void grounudGuard(grounudBefore => grounudBefore);

      // --- Decrement invuln ---
      if (p.invulnMs > 0) {
        p.invulnMs = Math.max(0, p.invulnMs - 1000 / 60);
        if (p.invulnMs === 0 && p.anim === 'hurt') p.anim = 'idle';
      }

      // --- Choose animation ---
      let nextAnim: SonicAnim = p.anim;
      if (p.invulnMs > 0 && p.anim === 'hurt' && !p.grounded) {
        nextAnim = 'hurt';
      } else if (p.charging) {
        nextAnim = 'spindash';
      } else if (!p.grounded) {
        nextAnim = p.rolling ? 'spin' : 'jump';
      } else if (p.rolling && Math.abs(p.vx) >= MIN_ROLL_SPEED) {
        nextAnim = 'spin';
      } else if (Math.abs(p.vx) > 0.4) {
        nextAnim = 'run';
      } else if (input.crouch || input.left || input.right) {
        nextAnim = 'tap';
      } else {
        nextAnim = 'idle';
      }

      if (nextAnim !== p.anim) {
        p.anim = nextAnim;
        p.animFrame = 0;
        p.animTimer = 0;
      }

      // --- Advance animation (run/spin cycle scales with speed) ---
      const speedFactor = nextAnim === 'run' || nextAnim === 'spin'
        ? Math.min(3.2, 0.6 + Math.abs(p.vx) / 1.4)
        : 1;
      const dtMs = (1000 / 60) * speedFactor;
      const adv = advanceAnim(p.anim, p.animFrame, p.animTimer, dtMs);
      p.animFrame = adv.frame;
      p.animTimer = adv.timer;

      return ev;
    },
    []
  );

  return { step };
}

// no-op helpers kept tiny so the closure above stays referentially stable
function grounundedNoop<T>(fn: (g: boolean) => T): void {
  void fn;
}
function grounudGuard<T>(fn: (g: boolean) => T): void {
  void fn;
}
