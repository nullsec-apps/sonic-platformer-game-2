import { useCallback, useMemo, useState } from 'react';
import type { GameStateName, RunStats } from '../types';
import { STARTING_LIVES } from '../lib/physicsConstants';
import { getLevel, hasNextLevel } from '../lib/levels';

// Central state machine for SONIC SPEEDWAY. Tracks the high-level game phase,
// HUD-facing counters (rings/score/lives/time), the active level index, and
// the final-run stats captured on game over. Pure React state; the engine
// reads/writes via the imperative setters returned here.

export interface GameState {
  state: GameStateName;
  level: number;
  rings: number;
  score: number;
  lives: number;
  timeRemaining: number;
  timeElapsed: number;
  enemiesDefeated: number;
  deaths: number;
  lastBonus: number;
  finalStats: RunStats | null;
  pendingHighlightId: string | null;
}

export interface UseGameState {
  gs: GameState;
  setState: (s: GameStateName) => void;
  startGame: () => void;
  setRings: (fn: number | ((n: number) => number)) => void;
  addScore: (amount: number) => void;
  addRings: (amount: number) => void;
  defeatEnemy: () => void;
  setTimeRemaining: (fn: number | ((n: number) => number)) => void;
  setTimeElapsed: (fn: number | ((n: number) => number)) => void;
  loseLife: () => { gameOver: boolean };
  goToTransition: (bonus: number) => void;
  nextLevel: () => { finished: boolean };
  restart: () => void;
  quitToMenu: () => void;
  pause: () => void;
  resume: () => void;
  setFinalStats: (s: RunStats) => void;
  setHighlightId: (id: string | null) => void;
}

function freshState(level = 0): GameState {
  const lv = getLevel(level);
  return {
    state: 'MENU',
    level,
    rings: 0,
    score: 0,
    lives: STARTING_LIVES,
    timeRemaining: lv.timeLimit,
    timeElapsed: 0,
    enemiesDefeated: 0,
    deaths: 0,
    lastBonus: 0,
    finalStats: null,
    pendingHighlightId: null,
  };
}

export function useGameState(): UseGameState {
  const [gs, setGs] = useState<GameState>(() => freshState());

  const setState = useCallback((s: GameStateName) => {
    setGs((p) => ({ ...p, state: s }));
  }, []);

  const startGame = useCallback(() => {
    const fresh = freshState(0);
    setGs({ ...fresh, state: 'PLAYING' });
  }, []);

  const setRings = useCallback((fn: number | ((n: number) => number)) => {
    setGs((p) => ({ ...p, rings: typeof fn === 'function' ? fn(p.rings) : fn }));
  }, []);

  const addScore = useCallback((amount: number) => {
    setGs((p) => ({ ...p, score: p.score + amount }));
  }, []);

  const addRings = useCallback((amount: number) => {
    setGs((p) => ({ ...p, rings: p.rings + amount }));
  }, []);

  const defeatEnemy = useCallback(() => {
    setGs((p) => ({ ...p, enemiesDefeated: p.enemiesDefeated + 1 }));
  }, []);

  const setTimeRemaining = useCallback((fn: number | ((n: number) => number)) => {
    setGs((p) => ({
      ...p,
      timeRemaining: typeof fn === 'function' ? fn(p.timeRemaining) : fn,
    }));
  }, []);

  const setTimeElapsed = useCallback((fn: number | ((n: number) => number)) => {
    setGs((p) => ({
      ...p,
      timeElapsed: typeof fn === 'function' ? fn(p.timeElapsed) : fn,
    }));
  }, []);

  const loseLife = useCallback((): { gameOver: boolean } => {
    let gameOver = false;
    setGs((p) => {
      const lives = p.lives - 1;
      const deaths = p.deaths + 1;
      if (lives <= 0) {
        gameOver = true;
        return { ...p, lives: 0, deaths, state: 'GAMEOVER', rings: 0 };
      }
      const lv = getLevel(p.level);
      return {
        ...p,
        lives,
        deaths,
        rings: 0,
        timeRemaining: lv.timeLimit,
        state: 'PLAYING',
      };
    });
    return { gameOver };
  }, []);

  const goToTransition = useCallback((bonus: number) => {
    setGs((p) => ({
      ...p,
      score: p.score + bonus,
      lastBonus: bonus,
      state: 'TRANSITION',
    }));
  }, []);

  const nextLevel = useCallback((): { finished: boolean } => {
    let finished = false;
    setGs((p) => {
      if (!hasNextLevel(p.level)) {
        finished = true;
        return { ...p, state: 'GAMEOVER' };
      }
      const nl = p.level + 1;
      const lv = getLevel(nl);
      return {
        ...p,
        level: nl,
        rings: 0,
        timeRemaining: lv.timeLimit,
        state: 'PLAYING',
      };
    });
    return { finished };
  }, []);

  const restart = useCallback(() => {
    const fresh = freshState(0);
    setGs({ ...fresh, state: 'PLAYING' });
  }, []);

  const quitToMenu = useCallback(() => {
    setGs(freshState());
  }, []);

  const pause = useCallback(() => {
    setGs((p) => (p.state === 'PLAYING' ? { ...p, state: 'PAUSED' } : p));
  }, []);

  const resume = useCallback(() => {
    setGs((p) => (p.state === 'PAUSED' ? { ...p, state: 'PLAYING' } : p));
  }, []);

  const setFinalStats = useCallback((s: RunStats) => {
    setGs((p) => ({ ...p, finalStats: s }));
  }, []);

  const setHighlightId = useCallback((id: string | null) => {
    setGs((p) => ({ ...p, pendingHighlightId: id }));
  }, []);

  return useMemo(
    () => ({
      gs,
      setState,
      startGame,
      setRings,
      addScore,
      addRings,
      defeatEnemy,
      setTimeRemaining,
      setTimeElapsed,
      loseLife,
      goToTransition,
      nextLevel,
      restart,
      quitToMenu,
      pause,
      resume,
      setFinalStats,
      setHighlightId,
    }),
    [
      gs,
      setState,
      startGame,
      setRings,
      addScore,
      addRings,
      defeatEnemy,
      setTimeRemaining,
      setTimeElapsed,
      loseLife,
      goToTransition,
      nextLevel,
      restart,
      quitToMenu,
      pause,
      resume,
      setFinalStats,
      setHighlightId,
    ]
  );
}
