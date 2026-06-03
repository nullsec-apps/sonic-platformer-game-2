import type { AnimDef, SonicAnim } from '../types';

// Frame timing tables for Sonic's animation sets. Durations are in ms.
// Sonic is drawn procedurally in the renderer; these drive frame indices.

export const SONIC_ANIMS: Record<SonicAnim, AnimDef> = {
  idle: { frames: [{ duration: 2400 }], loop: true },
  tap: {
    frames: [{ duration: 220 }, { duration: 220 }, { duration: 220 }, { duration: 220 }],
    loop: true,
  },
  run: {
    frames: [
      { duration: 70 },
      { duration: 70 },
      { duration: 70 },
      { duration: 70 },
      { duration: 70 },
      { duration: 70 },
    ],
    loop: true,
  },
  jump: {
    frames: [{ duration: 60 }, { duration: 60 }, { duration: 60 }, { duration: 60 }],
    loop: true,
  },
  spin: {
    frames: [{ duration: 50 }, { duration: 50 }, { duration: 50 }, { duration: 50 }],
    loop: true,
  },
  spindash: {
    frames: [{ duration: 40 }, { duration: 40 }, { duration: 40 }, { duration: 40 }],
    loop: true,
  },
  hurt: { frames: [{ duration: 400 }], loop: false },
};

export const RING_FRAME_COUNT = 8;
export const RING_FRAME_MS = 90;

export const ENEMY_FRAME_COUNT = 2;
export const ENEMY_FRAME_MS = 260;

/** Advance an animation's timer/frame. Mutates and returns the new {frame,timer}. */
export function advanceAnim(
  anim: SonicAnim,
  frame: number,
  timer: number,
  dtMs: number
): { frame: number; timer: number } {
  const def = SONIC_ANIMS[anim];
  let t = timer + dtMs;
  let f = frame;
  const count = def.frames.length;
  if (f >= count) f = 0;
  let guard = 0;
  while (t >= def.frames[f].duration && guard < 16) {
    t -= def.frames[f].duration;
    f += 1;
    if (f >= count) {
      f = def.loop ? 0 : count - 1;
      if (!def.loop) {
        t = 0;
        break;
      }
    }
    guard += 1;
  }
  return { frame: f, timer: t };
}

/** Frame count for a Sonic animation (used by renderer to clamp). */
export function frameCount(anim: SonicAnim): number {
  return SONIC_ANIMS[anim].frames.length;
}

/** Cycle a generic spritesheet (rings, enemies) by elapsed time. */
export function cycleFrame(timer: number, dtMs: number, frameMs: number, count: number): {
  frame: number;
  timer: number;
} {
  let t = timer + dtMs;
  let advanced = 0;
  while (t >= frameMs && advanced < 8) {
    t -= frameMs;
    advanced += 1;
  }
  // We don't track absolute frame here; compute from total accumulated externally if needed.
  return { frame: advanced, timer: t };
}
