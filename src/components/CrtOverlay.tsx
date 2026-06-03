import { useMemo } from 'react';
import { MAX_SPEED_VISUAL } from '../lib/physicsConstants';

interface CrtOverlayProps {
  /** Current absolute horizontal velocity, used to intensify the speed-blur tint. */
  velocity?: number;
  /** Hide scanlines/vignette entirely (e.g. user preference). */
  enabled?: boolean;
}

/**
 * Top-layer CRT effect: subtle scanlines, vignette, and a max-velocity
 * speed-stretch blur tint. Always pointer-events: none so it never blocks input.
 */
export function CrtOverlay({ velocity = 0, enabled = true }: CrtOverlayProps) {
  const speedIntensity = useMemo(() => {
    const v = Math.abs(velocity);
    const threshold = MAX_SPEED_VISUAL * 0.82;
    if (v < threshold) return 0;
    return Math.min(1, (v - threshold) / (MAX_SPEED_VISUAL * 0.4));
  }, [velocity]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      style={{ mixBlendMode: 'normal' }}
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)',
          opacity: 0.55,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(5,12,40,0.55) 100%)',
        }}
      />

      {/* Subtle RGB phosphor sheen */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(0,180,255,0.025) 0px, rgba(255,204,0,0.025) 2px, transparent 4px)',
          opacity: 0.4,
        }}
      />

      {/* Max-velocity speed-stretch blur tint */}
      {speedIntensity > 0 && (
        <div
          className="absolute inset-0 transition-opacity duration-150"
          style={{
            background:
              'linear-gradient(90deg, rgba(0,180,255,0.0) 0%, rgba(0,180,255,0.10) 30%, rgba(255,204,0,0.06) 70%, rgba(0,180,255,0.0) 100%)',
            opacity: speedIntensity * 0.7,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* Edge glow brackets for arcade-cabinet feel */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 0 2px rgba(90,120,200,0.25)',
        }}
      />
    </div>
  );
}

export default CrtOverlay;
