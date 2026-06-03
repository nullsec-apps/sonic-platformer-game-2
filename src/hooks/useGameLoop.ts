import { useEffect, useRef } from 'react';
import { FIXED_DT_MS, MAX_SUBSTEPS } from '../lib/physicsConstants';

// Fixed-timestep requestAnimationFrame loop with an accumulator. Each frame it
// advances the simulation in fixed FIXED_DT_MS steps (capped by MAX_SUBSTEPS to
// avoid the spiral-of-death after a tab regains focus), then runs a single
// render pass with an interpolation alpha. Stepping is gated by `active`.

export interface GameLoopCallbacks {
  step: (dtMs: number) => void;
  render: (alpha: number) => void;
}

export function useGameLoop(
  callbacks: GameLoopCallbacks,
  active: boolean
): void {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let running = true;

    const frame = (now: number) => {
      if (!running) return;
      let delta = now - last;
      last = now;
      // Clamp huge deltas (tab switch / breakpoint) to prevent runaway stepping.
      if (delta > 250) delta = FIXED_DT_MS;

      if (activeRef.current) {
        acc += delta;
        let steps = 0;
        while (acc >= FIXED_DT_MS && steps < MAX_SUBSTEPS) {
          cbRef.current.step(FIXED_DT_MS);
          acc -= FIXED_DT_MS;
          steps += 1;
        }
        // Drop leftover accumulation if we hit the substep cap.
        if (steps >= MAX_SUBSTEPS) acc = 0;
        const alpha = acc / FIXED_DT_MS;
        cbRef.current.render(alpha);
      } else {
        // Keep timing fresh so resuming doesn't dump a giant accumulated delta.
        acc = 0;
        last = now;
        // Still render once so paused overlays composite over a fresh frame.
        cbRef.current.render(0);
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, []);
}
