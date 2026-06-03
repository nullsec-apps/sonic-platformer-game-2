import type {
  Enemy,
  LevelData,
  Obstacle,
  ParticleScatter,
  PlayerState,
  Ring,
  Vec2,
} from '../types';
import { MAX_SPEED_VISUAL, VIEW_HEIGHT, VIEW_WIDTH } from './physicsConstants';
import { RING_FRAME_COUNT } from './spriteAnimations';

// Pixel-perfect canvas draw helpers for SONIC SPEEDWAY. All draws happen at the
// internal 480x270 resolution; the canvas element is integer-scaled in CSS/transform.

export interface RenderState {
  level: LevelData;
  player: PlayerState;
  enemies: Enemy[];
  rings: Ring[];
  obstacles: Obstacle[];
  particles: ParticleScatter[];
  camera: Vec2;
  shake: number;
  ringFrame: number;
  enemyFrame: number;
  goalReached: boolean;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r},${g},${b})`;
}

export function clearScene(ctx: CanvasRenderingContext2D, bg: string) {
  ctx.imageSmoothingEnabled = false;
  px(ctx, 0, 0, VIEW_WIDTH, VIEW_HEIGHT, bg);
}

export function drawParallax(ctx: CanvasRenderingContext2D, level: LevelData, camX: number) {
  for (const layer of level.parallax) {
    const ox = -(camX * layer.speed) % VIEW_WIDTH;
    if (layer.kind === 'sky') {
      px(ctx, 0, layer.y, VIEW_WIDTH, layer.h, layer.color);
    } else if (layer.kind === 'clouds') {
      for (let i = -1; i <= 3; i++) {
        const bx = ox + i * 180 + 40;
        drawCloud(ctx, bx, layer.y + 6, layer.color);
        drawCloud(ctx, bx + 90, layer.y + 26, layer.color);
      }
    } else if (layer.kind === 'hills') {
      px(ctx, 0, layer.y, VIEW_WIDTH, layer.h, layer.color);
      for (let i = -1; i <= 4; i++) {
        const bx = ox + i * 150;
        drawHill(ctx, bx, layer.y, shade(layer.color, 18));
      }
    } else if (layer.kind === 'mountains') {
      px(ctx, 0, layer.y, VIEW_WIDTH, layer.h, layer.color);
      for (let i = -1; i <= 5; i++) {
        const bx = ox + i * 120;
        drawTriangle(ctx, bx, layer.y + layer.h, 60, layer.h * 0.7, shade(layer.color, -22));
      }
    } else if (layer.kind === 'water') {
      px(ctx, 0, layer.y, VIEW_WIDTH, layer.h, layer.color);
      for (let i = 0; i < VIEW_WIDTH; i += 8) {
        px(ctx, i, layer.y + 3, 4, 1, shade(layer.color, 30));
      }
    }
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  px(ctx, x, y + 6, 34, 8, color);
  px(ctx, x + 8, y, 20, 8, color);
  px(ctx, x + 4, y + 3, 28, 6, color);
}

function drawHill(ctx: CanvasRenderingContext2D, x: number, baseY: number, color: string) {
  for (let i = 0; i < 40; i++) {
    const w = 100 - i * 2;
    px(ctx, x + (100 - w) / 2, baseY - i * 1.4, w, 2, color);
  }
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  halfW: number,
  height: number,
  color: string
) {
  const steps = Math.max(2, Math.floor(height / 2));
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const w = halfW * 2 * (1 - ratio);
    px(ctx, cx - w / 2, baseY - i * 2, w, 2, color);
  }
}

export function drawSolids(ctx: CanvasRenderingContext2D, level: LevelData, camX: number) {
  const { palette } = level;
  for (const s of level.solids) {
    const sx = s.x - camX;
    if (sx + s.w < -20 || sx > VIEW_WIDTH + 20) continue;
    px(ctx, sx, s.y, s.w, s.h, palette.ground);
    px(ctx, sx, s.y, s.w, 5, palette.groundTop);
    for (let i = 0; i < s.w; i += 16) {
      px(ctx, sx + i, s.y + 6, 1, s.h - 6, shade(palette.ground, -24));
    }
  }
}

export function drawObstacles(ctx: CanvasRenderingContext2D, level: LevelData, obstacles: Obstacle[], camX: number) {
  const { palette } = level;
  for (const o of obstacles) {
    const ox = o.x - camX;
    if (ox + o.w < -20 || ox > VIEW_WIDTH + 20) continue;
    if (o.kind === 'spike') {
      for (let i = 0; i < o.w; i += 8) {
        drawTriangle(ctx, ox + i + 4, o.y + o.h, 4, o.h, palette.hazard);
      }
    } else if (o.kind === 'spring') {
      px(ctx, ox, o.y + o.h - 6, o.w, 6, '#cc2222');
      px(ctx, ox + 2, o.y, o.w - 4, o.h - 6, '#ffcc00');
      px(ctx, ox + 2, o.y, o.w - 4, 3, '#ffe680');
    } else if (o.kind === 'block') {
      px(ctx, ox, o.y, o.w, o.h, '#8a5a2a');
      px(ctx, ox, o.y, o.w, 3, '#c98a4a');
      px(ctx, ox + 2, o.y + 2, o.w - 4, 2, shade('#8a5a2a', 20));
    }
  }
}

export function drawRings(ctx: CanvasRenderingContext2D, rings: Ring[], camX: number, frame: number) {
  for (const r of rings) {
    if (r.collected) continue;
    const rx = r.x - camX;
    if (rx + r.w < -20 || rx > VIEW_WIDTH + 20) continue;
    const f = ((r.scattered ? r.animFrame : frame) % RING_FRAME_COUNT + RING_FRAME_COUNT) % RING_FRAME_COUNT;
    const widths = [12, 9, 5, 2, 5, 9, 12, 14];
    const w = widths[f] ?? 12;
    const cx = rx + r.w / 2;
    const inner = Math.max(1, w - 4);
    px(ctx, cx - w / 2, r.y, w, r.h, '#ffcc00');
    px(ctx, cx - inner / 2, r.y + 2, inner, r.h - 4, f < 4 ? '#ffe680' : '#1aa3e0');
    px(ctx, cx - inner / 2, r.y + 2, Math.max(1, inner - 2), 2, '#fff7cc');
  }
}

export function drawEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[], camX: number, frame: number) {
  for (const e of enemies) {
    if (!e.alive) continue;
    const ex = e.x - camX;
    if (ex + e.w < -20 || ex > VIEW_WIDTH + 20) continue;
    const wob = (frame + e.id) % 2 === 0 ? 0 : 1;
    if (e.kind === 'motobug') {
      px(ctx, ex, e.y + 6, e.w, e.h - 6, '#c0392b');
      px(ctx, ex + 2, e.y, e.w - 4, 8, '#34495e');
      px(ctx, ex + 3, e.y + 2, 3, 3, '#ffcc00');
      px(ctx, ex + 1, e.y + e.h - 2, 4, 2 + wob, '#222');
      px(ctx, ex + e.w - 5, e.y + e.h - 2, 4, 2 + wob, '#222');
    } else if (e.kind === 'buzzer') {
      px(ctx, ex + 2, e.y + 4, e.w - 4, e.h - 6, '#e6a817');
      px(ctx, ex, e.y + (wob ? 2 : 4), e.w, 3, 'rgba(255,255,255,0.6)');
      px(ctx, ex + e.w - 4, e.y + 4, 4, 3, '#ff5b5b');
    } else {
      px(ctx, ex, e.y + 6, e.w, e.h - 6, '#d35400');
      px(ctx, ex - 2, e.y + 8, 4, 4, '#a04000');
      px(ctx, ex + e.w - 2, e.y + 8, 4, 4, '#a04000');
      px(ctx, ex + 3, e.y + 2, 3, 3, '#ffcc00');
      px(ctx, ex + e.w - 6, e.y + 2, 3, 3, '#ffcc00');
    }
  }
}

export function drawSpeedTrail(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  camX: number
) {
  const speed = Math.abs(player.vx);
  if (speed < MAX_SPEED_VISUAL * 0.82 || !player.grounded) return;
  const sx = player.x - camX;
  const intensity = Math.min(1, (speed - MAX_SPEED_VISUAL * 0.82) / (MAX_SPEED_VISUAL * 0.4));
  const dir = player.facing;
  for (let i = 1; i <= 5; i++) {
    const tx = sx - dir * i * 8;
    const alpha = intensity * (1 - i / 6) * 0.7;
    ctx.globalAlpha = alpha;
    for (let cy = 0; cy < player.h; cy += 6) {
      const cb = (Math.floor(tx / 6) + Math.floor(cy / 6)) % 2 === 0;
      px(ctx, tx, player.y + cy, 5, 5, cb ? '#ffffff' : '#00b4ff');
    }
  }
  ctx.globalAlpha = 1;
}

export function drawSonic(ctx: CanvasRenderingContext2D, player: PlayerState, camX: number) {
  const sx = Math.round(player.x - camX);
  const sy = Math.round(player.y);
  const f = player.facing;
  const blink = player.invulnMs > 0 && Math.floor(player.invulnMs / 70) % 2 === 0;
  if (blink) return;

  const BLUE = '#1a6ad6';
  const BLUE_D = '#0f4aa0';
  const FLESH = '#f1c27d';
  const SHOE = '#e03b3b';
  const WHITE = '#ffffff';

  if (player.rolling || player.charging || player.anim === 'spin' || player.anim === 'spindash') {
    // Spinning ball
    const cx = sx + player.w / 2;
    const cy = sy + player.h / 2;
    const r = player.h / 2;
    for (let yy = -r; yy < r; yy += 2) {
      const ww = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)) * 2);
      px(ctx, cx - ww / 2, cy + yy, ww, 2, yy % 4 === 0 ? BLUE : BLUE_D);
    }
    // motion arcs
    const spinT = (player.animFrame % 4) * 2;
    px(ctx, cx - r + spinT, cy - 2, 3, 4, FLESH);
    if (player.charging) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.random();
      px(ctx, cx - r - 4 * f, cy + r - 4, 6, 4, '#ffffff');
      ctx.globalAlpha = 1;
    }
    return;
  }

  const jumping = player.anim === 'jump' || !player.grounded;
  const running = player.anim === 'run';
  const tapping = player.anim === 'tap';

  // body (head + torso)
  px(ctx, sx + 1, sy + 2, player.w - 2, player.h - 10, BLUE);
  px(ctx, sx + 2, sy + player.h - 8, player.w - 4, 6, BLUE_D);
  // spikes (back)
  const spikeX = f === 1 ? sx - 3 : sx + player.w - 1;
  px(ctx, spikeX, sy + 4, 4, 4, BLUE);
  px(ctx, spikeX, sy + 9, 4, 4, BLUE);
  px(ctx, spikeX, sy + 14, 4, 4, BLUE);
  // face
  const faceX = f === 1 ? sx + player.w - 7 : sx + 1;
  px(ctx, faceX, sy + 4, 6, 7, FLESH);
  // eye
  const eyeX = f === 1 ? sx + player.w - 5 : sx + 2;
  px(ctx, eyeX, sy + 5, 2, 3, WHITE);
  px(ctx, eyeX + (f === 1 ? 1 : 0), sy + 6, 1, 2, '#000');
  // shoes / legs
  if (jumping) {
    px(ctx, sx + 2, sy + player.h - 4, 5, 4, SHOE);
    px(ctx, sx + player.w - 7, sy + player.h - 4, 5, 4, SHOE);
  } else if (running) {
    const phase = player.animFrame % 6;
    const lift = phase < 3 ? phase : 5 - phase;
    px(ctx, sx + 1, sy + player.h - 4 - lift, 5, 4, SHOE);
    px(ctx, sx + player.w - 6, sy + player.h - 4 - (2 - lift), 5, 4, SHOE);
    // spinning feet blur
    ctx.globalAlpha = 0.4;
    px(ctx, sx, sy + player.h - 3, player.w, 3, WHITE);
    ctx.globalAlpha = 1;
  } else {
    const tap = tapping && player.animFrame % 2 === 0 ? -1 : 0;
    px(ctx, sx + 2, sy + player.h - 4 + tap, 5, 4, SHOE);
    px(ctx, sx + player.w - 7, sy + player.h - 4, 5, 4, SHOE);
  }
  // white sock stripe
  px(ctx, sx + 2, sy + player.h - 5, 5, 1, WHITE);
  px(ctx, sx + player.w - 7, sy + player.h - 5, 5, 1, WHITE);
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: ParticleScatter[], camX: number) {
  for (const p of particles) {
    const alpha = Math.max(0, p.lifeMs / p.maxLifeMs);
    ctx.globalAlpha = alpha;
    px(ctx, p.x - camX, p.y, 5, 5, '#ffcc00');
    px(ctx, p.x - camX + 1, p.y + 1, 2, 2, '#fff7cc');
  }
  ctx.globalAlpha = 1;
}

export function drawGoal(ctx: CanvasRenderingContext2D, level: LevelData, camX: number, reached: boolean) {
  const gx = level.goalX - camX;
  if (gx < -40 || gx > VIEW_WIDTH + 40) return;
  const groundY = 230;
  px(ctx, gx, groundY - 70, 3, 70, '#888');
  const wob = reached ? Math.sin(Date.now() / 80) * 2 : 0;
  px(ctx, gx + 3, groundY - 68 + wob, 22, 16, '#ffcc00');
  px(ctx, gx + 3, groundY - 68 + wob, 22, 5, '#e03b3b');
  px(ctx, gx + 3, groundY - 58 + wob, 22, 5, '#00b4ff');
  px(ctx, gx - 6, groundY - 76, 16, 8, '#cccccc');
}

export function applyShake(ctx: CanvasRenderingContext2D, shake: number) {
  if (shake <= 0) return { x: 0, y: 0 };
  const ox = (Math.random() - 0.5) * shake * 4;
  const oy = (Math.random() - 0.5) * shake * 3;
  ctx.translate(Math.round(ox), Math.round(oy));
  return { x: ox, y: oy };
}

export function renderScene(ctx: CanvasRenderingContext2D, state: RenderState) {
  const { level, camera } = state;
  const camX = camera.x;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  applyShake(ctx, state.shake);
  clearScene(ctx, level.palette.bg);
  drawParallax(ctx, level, camX);
  drawSolids(ctx, level, camX);
  drawGoal(ctx, level, camX, state.goalReached);
  drawObstacles(ctx, level, state.obstacles, camX);
  drawRings(ctx, state.rings, camX, state.ringFrame);
  drawEnemies(ctx, state.enemies, camX, state.enemyFrame);
  drawSpeedTrail(ctx, state.player, camX);
  drawSonic(ctx, state.player, camX);
  drawParticles(ctx, state.particles, camX);
  ctx.restore();
}
