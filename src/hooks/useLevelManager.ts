import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  Enemy,
  LevelData,
  Obstacle,
  Ring,
} from '../types';
import { getLevel, hasNextLevel, TOTAL_LEVELS } from '../lib/levels';
import {
  ENEMY_PATROL_SPEED,
  actClearBonus as computeBonus,
} from '../lib/physicsConstants';
import { actClearBonus, ringBonus, timeBonus } from '../lib/scoreFormat';

// Loads level/zone data and spawns fresh entity instances (enemies, rings,
// obstacles) for a given level index. Owns a monotonic id allocator so rings
// (including scatter rings) and enemies never collide on ids. Computes
// time/ring act-clear bonuses for the transition screen.

export interface SpawnedLevel {
  level: LevelData;
  enemies: Enemy[];
  rings: Ring[];
  obstacles: Obstacle[];
}

export interface UseLevelManager {
  spawnLevel: (index: number) => SpawnedLevel;
  nextRingId: () => number;
  computeActClearBonus: (timeRemaining: number, rings: number) => number;
  bonusBreakdown: (
    timeRemaining: number,
    rings: number
  ) => { time: number; rings: number; total: number };
  hasNext: (index: number) => boolean;
  totalLevels: number;
  currentSpawn: SpawnedLevel | null;
}

let GLOBAL_ID = 1;

function makeEnemies(level: LevelData): Enemy[] {
  return level.enemies.map((e) => {
    const w = e.kind === 'buzzer' ? 22 : 24;
    const h = e.kind === 'buzzer' ? 16 : 22;
    return {
      id: GLOBAL_ID++,
      kind: e.kind,
      x: e.x,
      y: e.y,
      w,
      h,
      vx: ENEMY_PATROL_SPEED * (Math.random() < 0.5 ? -1 : 1),
      vy: 0,
      baseY: e.y,
      patrolMin: e.patrolMin,
      patrolMax: e.patrolMax,
      alive: true,
      animFrame: 0,
      animTimer: 0,
    };
  });
}

function makeRings(level: LevelData): Ring[] {
  return level.rings.map((r) => ({
    id: GLOBAL_ID++,
    x: r.x,
    y: r.y,
    w: 12,
    h: 12,
    collected: false,
    animFrame: Math.floor(Math.random() * 8),
    animTimer: Math.random() * 90,
    scattered: false,
  }));
}

function makeObstacles(level: LevelData): Obstacle[] {
  return level.obstacles.map((o) => {
    let w = 16;
    let h = 16;
    if (o.kind === 'spring') {
      w = 18;
      h = 16;
    } else if (o.kind === 'block') {
      w = 24;
      h = 24;
    } else if (o.kind === 'spike') {
      w = 24;
      h = 16;
    }
    return {
      id: GLOBAL_ID++,
      kind: o.kind,
      x: o.x,
      y: o.y,
      w,
      h,
    };
  });
}

export function useLevelManager(): UseLevelManager {
  const [currentSpawn, setCurrentSpawn] = useState<SpawnedLevel | null>(null);
  const spawnRef = useRef<SpawnedLevel | null>(null);

  const spawnLevel = useCallback((index: number): SpawnedLevel => {
    const level = getLevel(index);
    const spawn: SpawnedLevel = {
      level,
      enemies: makeEnemies(level),
      rings: makeRings(level),
      obstacles: makeObstacles(level),
    };
    spawnRef.current = spawn;
    setCurrentSpawn(spawn);
    return spawn;
  }, []);

  const nextRingId = useCallback(() => GLOBAL_ID++, []);

  const computeActClearBonus = useCallback(
    (timeRemaining: number, rings: number) => {
      // Use shared scoring helpers; computeBonus from constants is identical math.
      void computeBonus;
      return actClearBonus(timeRemaining, rings);
    },
    []
  );

  const bonusBreakdown = useCallback(
    (timeRemaining: number, rings: number) => ({
      time: timeBonus(timeRemaining),
      rings: ringBonus(rings),
      total: actClearBonus(timeRemaining, rings),
    }),
    []
  );

  const hasNext = useCallback((index: number) => hasNextLevel(index), []);

  return useMemo(
    () => ({
      spawnLevel,
      nextRingId,
      computeActClearBonus,
      bonusBreakdown,
      hasNext,
      totalLevels: TOTAL_LEVELS,
      currentSpawn,
    }),
    [
      spawnLevel,
      nextRingId,
      computeActClearBonus,
      bonusBreakdown,
      hasNext,
      currentSpawn,
    ]
  );
}
