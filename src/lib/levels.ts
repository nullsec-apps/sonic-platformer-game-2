import type { LevelData } from '../types';

// Multi-zone level data for SONIC SPEEDWAY. Each zone defines a tilemap of solid
// platforms, parallax layers, ring trails, badniks, obstacles, and a goalpost.
// Coordinates are in internal render pixels (see VIEW_WIDTH/VIEW_HEIGHT).

const GROUND_Y = 230; // top of main ground surface

function ringTrail(
  startX: number,
  y: number,
  count: number,
  gap = 22
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) out.push({ x: startX + i * gap, y });
  return out;
}

function ringArc(
  startX: number,
  baseY: number,
  count: number,
  gap = 20
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const mid = (count - 1) / 2;
  for (let i = 0; i < count; i++) {
    const dist = Math.abs(i - mid);
    out.push({ x: startX + i * gap, y: baseY - (mid - dist) * 12 });
  }
  return out;
}

export const LEVELS: LevelData[] = [
  {
    index: 0,
    zoneName: 'EMERALD ZONE',
    zoneLabel: 'LEVEL 1: EMERALD ZONE',
    width: 3200,
    height: 270,
    timeLimit: 120,
    palette: {
      bg: '#1aa3e0',
      ground: '#2e8b2e',
      groundTop: '#5fd35f',
      accent: '#ffcc00',
      hazard: '#e03b3b',
    },
    parallax: [
      { color: '#1aa3e0', speed: 0, kind: 'sky', y: 0, h: 270 },
      { color: '#7fd6ff', speed: 0.12, kind: 'clouds', y: 30, h: 60 },
      { color: '#1f7a1f', speed: 0.35, kind: 'hills', y: 150, h: 120 },
    ],
    solids: [
      { x: 0, y: GROUND_Y, w: 640, h: 40 },
      { x: 700, y: GROUND_Y, w: 520, h: 40 },
      { x: 520, y: 180, w: 120, h: 16 },
      { x: 900, y: 170, w: 100, h: 16 },
      { x: 1280, y: GROUND_Y, w: 700, h: 40 },
      { x: 1120, y: 185, w: 110, h: 16 },
      { x: 1500, y: 165, w: 120, h: 16 },
      { x: 1740, y: 140, w: 120, h: 16 },
      { x: 2040, y: GROUND_Y, w: 600, h: 40 },
      { x: 1980, y: 190, w: 90, h: 16 },
      { x: 2260, y: 160, w: 130, h: 16 },
      { x: 2700, y: GROUND_Y, w: 500, h: 40 },
      { x: 2560, y: 185, w: 110, h: 16 },
    ],
    rings: [
      ...ringTrail(180, 200, 6),
      ...ringArc(540, 165, 5),
      ...ringTrail(740, 200, 5),
      ...ringArc(920, 150, 5, 18),
      ...ringTrail(1140, 165, 4),
      ...ringArc(1510, 140, 6),
      ...ringTrail(1760, 115, 5),
      ...ringTrail(2080, 200, 6),
      ...ringArc(2270, 135, 6),
      ...ringTrail(2740, 200, 5),
    ],
    enemies: [
      { kind: 'motobug', x: 760, y: GROUND_Y - 22, patrolMin: 710, patrolMax: 1100 },
      { kind: 'buzzer', x: 1340, y: 150, patrolMin: 1300, patrolMax: 1900 },
      { kind: 'motobug', x: 1400, y: GROUND_Y - 22, patrolMin: 1290, patrolMax: 1900 },
      { kind: 'crabmeat', x: 2120, y: GROUND_Y - 22, patrolMin: 2050, patrolMax: 2600 },
      { kind: 'buzzer', x: 2780, y: 150, patrolMin: 2710, patrolMax: 3120 },
    ],
    obstacles: [
      { kind: 'spring', x: 1200, y: GROUND_Y - 16 },
      { kind: 'spike', x: 1050, y: GROUND_Y - 16 },
      { kind: 'spring', x: 1960, y: GROUND_Y - 16 },
      { kind: 'spike', x: 2640, y: GROUND_Y - 16 },
      { kind: 'block', x: 870, y: GROUND_Y - 24 },
    ],
    spawn: { x: 60, y: GROUND_Y - 30 },
    goalX: 3120,
  },
  {
    index: 1,
    zoneName: 'AQUA ZONE',
    zoneLabel: 'LEVEL 2: AQUA ZONE',
    width: 3400,
    height: 270,
    timeLimit: 130,
    palette: {
      bg: '#0a5fb0',
      ground: '#1a6e8b',
      groundTop: '#3fb8d3',
      accent: '#ffcc00',
      hazard: '#ff5b5b',
    },
    parallax: [
      { color: '#0a5fb0', speed: 0, kind: 'sky', y: 0, h: 270 },
      { color: '#2a9fe0', speed: 0.18, kind: 'water', y: 200, h: 70 },
      { color: '#0d4f7a', speed: 0.4, kind: 'mountains', y: 120, h: 150 },
    ],
    solids: [
      { x: 0, y: GROUND_Y, w: 560, h: 40 },
      { x: 480, y: 175, w: 110, h: 16 },
      { x: 660, y: 145, w: 110, h: 16 },
      { x: 840, y: 175, w: 110, h: 16 },
      { x: 1020, y: GROUND_Y, w: 600, h: 40 },
      { x: 1180, y: 160, w: 130, h: 16 },
      { x: 1440, y: 130, w: 120, h: 16 },
      { x: 1720, y: GROUND_Y, w: 520, h: 40 },
      { x: 1660, y: 185, w: 90, h: 16 },
      { x: 1980, y: 150, w: 120, h: 16 },
      { x: 2340, y: GROUND_Y, w: 640, h: 40 },
      { x: 2280, y: 170, w: 110, h: 16 },
      { x: 2560, y: 140, w: 120, h: 16 },
      { x: 2820, y: 115, w: 120, h: 16 },
      { x: 3080, y: GROUND_Y, w: 400, h: 40 },
    ],
    rings: [
      ...ringTrail(150, 200, 6),
      ...ringArc(490, 150, 5),
      ...ringArc(670, 120, 5),
      ...ringTrail(1060, 200, 6),
      ...ringArc(1190, 135, 6),
      ...ringArc(1450, 105, 5),
      ...ringTrail(1760, 200, 5),
      ...ringArc(1990, 125, 6),
      ...ringTrail(2380, 200, 6),
      ...ringArc(2570, 115, 6),
      ...ringArc(2830, 90, 5),
      ...ringTrail(3100, 200, 6),
    ],
    enemies: [
      { kind: 'buzzer', x: 600, y: 120, patrolMin: 560, patrolMax: 1000 },
      { kind: 'crabmeat', x: 1080, y: GROUND_Y - 22, patrolMin: 1020, patrolMax: 1580 },
      { kind: 'motobug', x: 1780, y: GROUND_Y - 22, patrolMin: 1720, patrolMax: 2200 },
      { kind: 'buzzer', x: 2080, y: 130, patrolMin: 1980, patrolMax: 2500 },
      { kind: 'crabmeat', x: 2420, y: GROUND_Y - 22, patrolMin: 2340, patrolMax: 2940 },
      { kind: 'motobug', x: 3120, y: GROUND_Y - 22, patrolMin: 3080, patrolMax: 3440 },
    ],
    obstacles: [
      { kind: 'spring', x: 980, y: GROUND_Y - 16 },
      { kind: 'spike', x: 1640, y: GROUND_Y - 16 },
      { kind: 'spring', x: 2300, y: GROUND_Y - 16 },
      { kind: 'spike', x: 2700, y: GROUND_Y - 16 },
      { kind: 'block', x: 2960, y: GROUND_Y - 24 },
    ],
    spawn: { x: 60, y: GROUND_Y - 30 },
    goalX: 3400,
  },
  {
    index: 2,
    zoneName: 'FLAME ZONE',
    zoneLabel: 'LEVEL 3: FLAME ZONE',
    width: 3600,
    height: 270,
    timeLimit: 140,
    palette: {
      bg: '#4a0e0e',
      ground: '#6e1a1a',
      groundTop: '#d35f2e',
      accent: '#ffcc00',
      hazard: '#ff8a00',
    },
    parallax: [
      { color: '#4a0e0e', speed: 0, kind: 'sky', y: 0, h: 270 },
      { color: '#7a1d0d', speed: 0.16, kind: 'clouds', y: 40, h: 70 },
      { color: '#3a0808', speed: 0.42, kind: 'mountains', y: 130, h: 140 },
    ],
    solids: [
      { x: 0, y: GROUND_Y, w: 500, h: 40 },
      { x: 420, y: 180, w: 100, h: 16 },
      { x: 600, y: 150, w: 100, h: 16 },
      { x: 780, y: 120, w: 100, h: 16 },
      { x: 960, y: GROUND_Y, w: 540, h: 40 },
      { x: 1100, y: 165, w: 120, h: 16 },
      { x: 1380, y: 135, w: 120, h: 16 },
      { x: 1640, y: GROUND_Y, w: 480, h: 40 },
      { x: 1580, y: 190, w: 90, h: 16 },
      { x: 1900, y: 155, w: 120, h: 16 },
      { x: 2240, y: GROUND_Y, w: 560, h: 40 },
      { x: 2180, y: 175, w: 110, h: 16 },
      { x: 2460, y: 145, w: 120, h: 16 },
      { x: 2720, y: 115, w: 120, h: 16 },
      { x: 2960, y: GROUND_Y, w: 500, h: 40 },
      { x: 3240, y: 165, w: 120, h: 16 },
      { x: 3500, y: GROUND_Y, w: 300, h: 40 },
    ],
    rings: [
      ...ringTrail(130, 200, 5),
      ...ringArc(430, 155, 5),
      ...ringArc(610, 125, 5),
      ...ringArc(790, 95, 5),
      ...ringTrail(1000, 200, 6),
      ...ringArc(1110, 140, 6),
      ...ringArc(1390, 110, 5),
      ...ringTrail(1680, 200, 5),
      ...ringArc(1910, 130, 6),
      ...ringTrail(2280, 200, 6),
      ...ringArc(2470, 120, 6),
      ...ringArc(2730, 90, 5),
      ...ringTrail(3000, 200, 6),
      ...ringArc(3250, 140, 6),
    ],
    enemies: [
      { kind: 'buzzer', x: 560, y: 120, patrolMin: 420, patrolMax: 900 },
      { kind: 'crabmeat', x: 1020, y: GROUND_Y - 22, patrolMin: 960, patrolMax: 1500 },
      { kind: 'motobug', x: 1700, y: GROUND_Y - 22, patrolMin: 1640, patrolMax: 2120 },
      { kind: 'buzzer', x: 2000, y: 130, patrolMin: 1900, patrolMax: 2400 },
      { kind: 'crabmeat', x: 2320, y: GROUND_Y - 22, patrolMin: 2240, patrolMax: 2800 },
      { kind: 'motobug', x: 3040, y: GROUND_Y - 22, patrolMin: 2960, patrolMax: 3460 },
      { kind: 'buzzer', x: 3300, y: 130, patrolMin: 3240, patrolMax: 3580 },
    ],
    obstacles: [
      { kind: 'spring', x: 920, y: GROUND_Y - 16 },
      { kind: 'spike', x: 1560, y: GROUND_Y - 16 },
      { kind: 'spring', x: 2200, y: GROUND_Y - 16 },
      { kind: 'spike', x: 2620, y: GROUND_Y - 16 },
      { kind: 'spike', x: 2900, y: GROUND_Y - 16 },
      { kind: 'block', x: 3160, y: GROUND_Y - 24 },
    ],
    spawn: { x: 60, y: GROUND_Y - 30 },
    goalX: 3700,
  },
];

export const TOTAL_LEVELS = LEVELS.length;

export function getLevel(index: number): LevelData {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
}

export function hasNextLevel(index: number): boolean {
  return index < LEVELS.length - 1;
}
