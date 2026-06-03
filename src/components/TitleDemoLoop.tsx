import { useEffect, useRef } from 'react';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../lib/physicsConstants';
import { getLevel } from '../lib/levels';
import {
  clearScene,
  drawParallax,
  drawSolids,
  drawRings,
  drawSonic,
  drawSpeedTrail,
} from '../lib/renderer';
import type { PlayerState, Ring } from '../types';
import { advanceAnim } from '../lib/spriteAnimations';

interface TitleDemoLoopProps {
  className?: string;
}

/**
 * Self-running attract-mode loop: Sonic dashes across the Emerald Zone,
 * rings spin, parallax scrolls. Never a blank screen.
 */
export function TitleDemoLoop({ className }: TitleDemoLoopProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const level = getLevel(0);

    const player: PlayerState = {
      x: 80,
      y: 200,
      vx: 3.6,
      vy: 0,
      w: 16,
      h: 28,
      grounded: true,
      facing: 1,
      rolling: false,
      charging: false,
      chargePower: 0,
      invulnMs: 0,
      anim: 'run',
      animFrame: 0,
      animTimer: 0,
    };

    const rings: Ring[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 200 + i * 60,
      y: 170 + (i % 2) * 14,
      w: 14,
      h: 14,
      collected: false,
      animFrame: 0,
      animTimer: 0,
    }));

    let camX = 0;
    let ringFrame = 0;
    let ringFrameTimer = 0;
    let last = performance.now();
    let jumpTimer = 0;

    const loop = (now: number) => {
      const dtMs = Math.min(48, now - last);
      last = now;

      // Scripted run + occasional jump
      jumpTimer += dtMs;
      if (player.grounded && jumpTimer > 2600) {
        player.vy = -5.6;
        player.grounded = false;
        player.anim = 'jump';
        jumpTimer = 0;
      }
      if (!player.grounded) {
        player.vy += 0.28;
        player.y += player.vy;
        if (player.y >= 200) {
          player.y = 200;
          player.vy = 0;
          player.grounded = true;
          player.anim = 'run';
        }
      }

      player.x += player.vx;
      // wrap the demo run around the level width
      if (player.x - camX > VIEW_WIDTH * 0.55) {
        camX = player.x - VIEW_WIDTH * 0.55;
      }
      if (player.x > level.width - 120) {
        player.x = 80;
        camX = 0;
      }

      // advance sonic anim
      const adv = advanceAnim(
        player.anim,
        player.animFrame,
        player.animTimer,
        dtMs * (player.anim === 'run' ? 1.6 : 1)
      );
      player.animFrame = adv.frame;
      player.animTimer = adv.timer;

      // ring spin
      ringFrameTimer += dtMs;
      if (ringFrameTimer >= 90) {
        ringFrameTimer = 0;
        ringFrame = (ringFrame + 1) % 8;
      }

      // recycle passed rings ahead of sonic
      rings.forEach((r) => {
        if (r.x - camX < -20) {
          r.x += VIEW_WIDTH + 200 + Math.random() * 80;
          r.y = 160 + Math.random() * 30;
        }
      });

      // render
      clearScene(ctx, level.palette.bg);
      drawParallax(ctx, level, camX);
      drawSolids(ctx, level, camX);
      drawRings(ctx, rings, camX, ringFrame);
      drawSpeedTrail(ctx, player, camX);
      drawSonic(ctx, player, camX);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={VIEW_WIDTH}
      height={VIEW_HEIGHT}
      className={className}
      style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }}
      aria-hidden
    />
  );
}

export default TitleDemoLoop;
