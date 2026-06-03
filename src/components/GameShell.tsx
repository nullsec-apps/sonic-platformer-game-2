import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Pause, Volume2, VolumeX } from 'lucide-react';
import { GameCanvas } from './GameCanvas';
import { HUD } from './HUD';
import { StartMenu } from './StartMenu';
import { PauseOverlay } from './PauseOverlay';
import { LevelTransition } from './LevelTransition';
import { GameOverScreen } from './GameOverScreen';
import { MobileControls } from './MobileControls';
import { CrtOverlay } from './CrtOverlay';
import { useGameState } from '../hooks/useGameState';
import { useInput } from '../hooks/useInput';
import { useSonicPhysics } from '../hooks/useSonicPhysics';
import { useLevelManager } from '../hooks/useLevelManager';
import { useCanvasScale } from '../hooks/useCanvasScale';
import { useGameLoop } from '../hooks/useGameLoop';
import { useAudio } from '../hooks/useAudio';
import { useHighScores } from '../hooks/useHighScores';
import { useRunTelemetry } from '../hooks/useRunTelemetry';
import {
  resolveEntities,
  updateParticles,
  updateRingAnims,
  updateScatteredRings,
} from '../hooks/useCollision';
import { renderScene } from '../lib/renderer';
import {
  CAMERA_LERP,
  ENEMY_PATROL_SPEED,
  FIXED_DT_MS,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SCATTER_GRAVITY,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from '../lib/physicsConstants';
import { ENEMY_FRAME_MS, RING_FRAME_MS } from '../lib/spriteAnimations';
import { getLevel } from '../lib/levels';
import type {
  Enemy,
  ParticleScatter,
  PlayerState,
  Ring,
  RunStats,
  Vec2,
} from '../types';

interface EngineRefs {
  player: PlayerState;
  enemies: Enemy[];
  rings: Ring[];
  obstacles: ReturnType<typeof getLevel>['obstacles'] extends never ? never : any[];
  particles: ParticleScatter[];
  camera: Vec2;
  shake: number;
  ringTimer: number;
  enemyTimer: number;
  ringFrame: number;
  enemyFrame: number;
  goalReached: boolean;
  goalTimer: number;
  levelIndex: number;
  timeAcc: number;
}

function freshPlayer(spawn: Vec2): PlayerState {
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    w: PLAYER_WIDTH,
    h: PLAYER_HEIGHT,
    grounded: false,
    facing: 1,
    rolling: false,
    charging: false,
    chargePower: 0,
    invulnMs: 0,
    anim: 'idle',
    animFrame: 0,
    animTimer: 0,
  };
}

export function GameShell() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const game = useGameState();
  const { gs } = game;
  const { inputRef, virtual, consumePause } = useInput();
  const physics = useSonicPhysics();
  const levelMgr = useLevelManager();
  const scale = useCanvasScale(containerRef);
  const audio = useAudio();
  const board = useHighScores();
  const telemetry = useRunTelemetry();

  const [velocity, setVelocity] = useState(0);
  const loggedRef = useRef(false);

  const engine = useRef<EngineRefs | null>(null);

  const stateRef = useRef(gs);
  stateRef.current = gs;

  // Init engine entities for a level.
  const loadLevel = useCallback(
    (index: number) => {
      const spawn = levelMgr.spawnLevel(index);
      engine.current = {
        player: freshPlayer(spawn.level.spawn),
        enemies: spawn.enemies,
        rings: spawn.rings,
        obstacles: spawn.obstacles as any,
        particles: [],
        camera: { x: 0, y: 0 },
        shake: 0,
        ringTimer: 0,
        enemyTimer: 0,
        ringFrame: 0,
        enemyFrame: 0,
        goalReached: false,
        goalTimer: 0,
        levelIndex: index,
        timeAcc: 0,
      };
    },
    [levelMgr]
  );

  // React to state transitions that require (re)loading a level.
  const prevState = useRef(gs.state);
  const prevLevel = useRef(gs.level);
  useEffect(() => {
    const becamePlaying = gs.state === 'PLAYING' && prevState.current !== 'PLAYING';
    const levelChanged = gs.level !== prevLevel.current;
    if (gs.state === 'PLAYING' && (becamePlaying || levelChanged || !engine.current)) {
      // Only reload when starting fresh, after death, or new level — not on resume from pause.
      const cameFromPause = prevState.current === 'PAUSED';
      if (!cameFromPause || levelChanged || !engine.current) {
        loadLevel(gs.level);
        audio.startMusic(gs.level);
      }
    }
    if (gs.state === 'MENU') {
      audio.stopMusic();
      engine.current = null;
      loggedRef.current = false;
    }
    prevState.current = gs.state;
    prevLevel.current = gs.level;
  }, [gs.state, gs.level, loadLevel, audio]);

  // Acquire 2D context once.
  useEffect(() => {
    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d');
    }
  }, []);

  // ----- Fixed-step simulation -----
  const step = useCallback(
    (dtMs: number) => {
      const e = engine.current;
      if (!e || stateRef.current.state !== 'PLAYING') return;
      const input = inputRef.current;
      const level = getLevel(e.levelIndex);

      // Pause handling
      if (consumePause()) {
        game.pause();
        audio.play('select');
        return;
      }

      const wasGrounded = e.player.grounded;
      const physEv = physics.step(e.player, input, level.solids, level.width);
      if (physEv.jumped) audio.play('jump');
      if (physEv.spindashCharging && Math.random() < 0.4) audio.play('spindash');
      if (physEv.spindashReleased) audio.play('spinrelease');
      void wasGrounded;

      // Enemy patrol AI
      for (const en of e.enemies) {
        if (!en.alive) continue;
        if (en.kind === 'buzzer') {
          en.x += en.vx;
          if (en.x < en.patrolMin || en.x > en.patrolMax) en.vx *= -1;
          en.baseY = en.baseY || en.y;
          e.enemyTimer; // no-op keep timer
          en.y = en.baseY + Math.sin((performance.now() + en.id * 200) / 360) * 5;
        } else {
          en.x += en.vx;
          if (en.x < en.patrolMin || en.x > en.patrolMax) {
            en.vx = en.vx === 0 ? ENEMY_PATROL_SPEED : -en.vx;
          }
        }
      }

      // Scattered ring physics + ring spin frames
      updateScatteredRings(e.rings, dtMs, SCATTER_GRAVITY);
      updateRingAnims(e.rings, dtMs, RING_FRAME_MS);
      e.rings = e.rings.filter((r) => !(r.scattered && (r.lifeMs ?? 0) > 4200));

      // Particle bursts
      e.particles = updateParticles(e.particles, dtMs, SCATTER_GRAVITY);

      // Collisions / pickups / hazards
      const ev = resolveEntities(
        e.player,
        e.rings,
        e.enemies,
        e.obstacles,
        level,
        stateRef.current.rings,
        levelMgr.nextRingId
      );

      if (ev.ringsPicked > 0) {
        audio.play('ring');
        game.addRings(ev.ringsPicked);
      }
      if (ev.scoreGained > 0) game.addScore(ev.scoreGained);
      if (ev.enemiesKilled > 0) {
        for (let k = 0; k < ev.enemiesKilled; k++) game.defeatEnemy();
        audio.play('pop');
      }
      if (ev.bounced) {
        // small pop already played
      }
      if (ev.sprung) audio.play('spring');

      if (ev.damaged) {
        audio.play('hurt');
        if (stateRef.current.rings > 0) {
          audio.play('ringloss');
          game.setRings(0);
          for (const sr of ev.scatteredRings) e.rings.push(sr);
        }
        e.shake = Math.max(e.shake, 1);
        // damage particle burst
        for (let i = 0; i < 6; i++) {
          e.particles.push({
            x: e.player.x + e.player.w / 2,
            y: e.player.y + e.player.h / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 3 - 1,
            lifeMs: 600,
            maxLifeMs: 600,
          });
        }
      }

      if (ev.fellOut && !e.goalReached) {
        const res = game.loseLife();
        if (res.gameOver) {
          audio.stopMusic();
        } else {
          loadLevel(e.levelIndex);
        }
        return;
      }

      // Goal reached -> act clear after a short celebratory beat
      if (ev.goalReached && !e.goalReached) {
        e.goalReached = true;
        e.goalTimer = 0;
        audio.play('goal');
      }
      if (e.goalReached) {
        e.goalTimer += dtMs;
        e.player.vx *= 0.9;
        if (e.goalTimer > 900) {
          const bonus = levelMgr.computeActClearBonus(
            stateRef.current.timeRemaining,
            stateRef.current.rings
          );
          audio.stopMusic();
          game.goToTransition(bonus);
          return;
        }
      }

      // Timer
      e.timeAcc += dtMs;
      while (e.timeAcc >= 1000) {
        e.timeAcc -= 1000;
        game.setTimeRemaining((t) => {
          const next = t - 1;
          if (next <= 0 && !e.goalReached) {
            const res = game.loseLife();
            if (res.gameOver) audio.stopMusic();
            else loadLevel(e.levelIndex);
            return Math.max(0, next);
          }
          return Math.max(0, next);
        });
        game.setTimeElapsed((t) => t + 1);
      }

      // Camera follow
      const targetX = Math.max(
        0,
        Math.min(level.width - VIEW_WIDTH, e.player.x + e.player.w / 2 - VIEW_WIDTH / 2)
      );
      e.camera.x += (targetX - e.camera.x) * CAMERA_LERP;

      // Shake decay
      if (e.shake > 0) e.shake = Math.max(0, e.shake - dtMs / 400);

      // Ring + enemy global anim frames
      e.ringTimer += dtMs;
      while (e.ringTimer >= RING_FRAME_MS) {
        e.ringTimer -= RING_FRAME_MS;
        e.ringFrame = (e.ringFrame + 1) % 8;
      }
      e.enemyTimer += dtMs;
      while (e.enemyTimer >= ENEMY_FRAME_MS) {
        e.enemyTimer -= ENEMY_FRAME_MS;
        e.enemyFrame = (e.enemyFrame + 1) % 2;
      }
    },
    [audio, consumePause, game, inputRef, levelMgr, loadLevel, physics]
  );

  // ----- Render -----
  const render = useCallback(() => {
    const ctx = ctxRef.current;
    const e = engine.current;
    if (!ctx) return;
    if (!e) {
      ctx.fillStyle = '#0a1a4a';
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      return;
    }
    const level = getLevel(e.levelIndex);
    renderScene(ctx, {
      level,
      player: e.player,
      enemies: e.enemies,
      rings: e.rings,
      obstacles: e.obstacles,
      particles: e.particles,
      camera: e.camera,
      shake: e.shake,
      ringFrame: e.ringFrame,
      enemyFrame: e.enemyFrame,
      goalReached: e.goalReached,
    });
    const v = Math.abs(e.player.vx);
    setVelocity((prev) => (Math.abs(prev - v) > 0.25 ? v : prev));
  }, []);

  useGameLoop({ step, render }, gs.state === 'PLAYING');

  // Capture final stats + telemetry on game over.
  useEffect(() => {
    if (gs.state !== 'GAMEOVER') return;
    if (loggedRef.current) return;
    loggedRef.current = true;
    const completed = !!gs.finalStats?.completed || gs.level >= levelMgr.totalLevels - 1;
    const stats: RunStats = {
      score: gs.score,
      rings: gs.rings,
      levelReached: gs.level + 1,
      timeSeconds: gs.timeElapsed,
      enemiesDefeated: gs.enemiesDefeated,
      deaths: gs.deaths,
      completed: gs.lives > 0 && completed,
    };
    game.setFinalStats(stats);
    telemetry.logRun(stats);
  }, [gs.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // Transition advance handler.
  const handleContinue = useCallback(() => {
    audio.play('select');
    const res = game.nextLevel();
    if (res.finished) {
      // mark as completed win
      game.setFinalStats({
        score: gs.score,
        rings: gs.rings,
        levelReached: levelMgr.totalLevels,
        timeSeconds: gs.timeElapsed,
        enemiesDefeated: gs.enemiesDefeated,
        deaths: gs.deaths,
        completed: true,
      });
    }
  }, [audio, game, gs, levelMgr.totalLevels]);

  const handleStart = useCallback(() => {
    audio.unlock();
    audio.play('select');
    game.startGame();
  }, [audio, game]);

  const handleRetry = useCallback(() => {
    loggedRef.current = false;
    audio.play('select');
    game.restart();
  }, [audio, game]);

  const handleMenu = useCallback(() => {
    loggedRef.current = false;
    audio.play('select');
    game.quitToMenu();
  }, [audio, game]);

  const bonus = useMemo(
    () => levelMgr.bonusBreakdown(gs.timeRemaining, gs.rings),
    [levelMgr, gs.timeRemaining, gs.rings]
  );

  const playing = gs.state === 'PLAYING' || gs.state === 'PAUSED' || gs.state === 'TRANSITION';
  const zoneLabel = `LEVEL ${gs.level + 1}: ${getLevel(gs.level).zoneName.toUpperCase()}`;

  return (
    <div
      className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#0a1a4a]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(20,42,110,0.6) 0%, rgba(10,26,74,1) 70%)',
      }}
    >
      {/* in-game mute toggle */}
      {playing && (
        <div className="absolute right-2 top-2 z-50 flex items-center gap-1.5 sm:right-3 sm:top-3">
          <button
            type="button"
            onClick={() => {
              audio.toggleMute();
            }}
            aria-label={audio.muted ? 'Unmute' : 'Mute'}
            className="flex h-9 w-9 items-center justify-center border-2 border-[#5a78c8] bg-[#142a6e]/90 text-[#ffcc00] transition-colors duration-200 hover:border-[#ffcc00] active:translate-y-0.5"
          >
            {audio.muted ? (
              <VolumeX size={16} strokeWidth={2.5} />
            ) : (
              <Volume2 size={16} strokeWidth={2.5} />
            )}
          </button>
          {gs.state === 'PLAYING' && (
            <button
              type="button"
              onClick={() => {
                audio.play('select');
                game.pause();
              }}
              aria-label="Pause"
              className="flex h-9 w-9 items-center justify-center border-2 border-[#5a78c8] bg-[#142a6e]/90 text-[#ffcc00] transition-colors duration-200 hover:border-[#ffcc00] active:translate-y-0.5"
            >
              <Pause size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {/* The integer-scaled game stage */}
      <div
        ref={containerRef}
        className="relative flex h-full w-full items-center justify-center"
      >
        <div
          className="relative"
          style={{ width: scale.displayWidth, height: scale.displayHeight }}
        >
          <GameCanvas
            ref={canvasRef}
            width={VIEW_WIDTH}
            height={VIEW_HEIGHT}
            displayWidth={scale.displayWidth}
            displayHeight={scale.displayHeight}
          />

          {/* HUD only while in active play states */}
          {playing && (
            <HUD
              rings={gs.rings}
              score={gs.score}
              timeRemaining={gs.timeRemaining}
              lives={gs.lives}
              zoneLabel={zoneLabel}
            />
          )}

          <CrtOverlay velocity={velocity} enabled />

          {/* Mobile touch controls during gameplay */}
          <MobileControls virtual={virtual} visible={gs.state === 'PLAYING'} />

          {/* State overlays */}
          <AnimatePresence mode="wait">
            {gs.state === 'MENU' && (
              <StartMenu
                key="menu"
                board={board}
                muted={audio.muted}
                onToggleMute={audio.toggleMute}
                onStart={handleStart}
              />
            )}
            {gs.state === 'PAUSED' && (
              <PauseOverlay
                key="pause"
                onResume={() => {
                  audio.play('select');
                  game.resume();
                }}
                onRestart={handleRetry}
                onQuit={handleMenu}
              />
            )}
            {gs.state === 'TRANSITION' && (
              <LevelTransition
                key="transition"
                currentLevel={gs.level}
                timeBonus={bonus.time}
                ringBonus={bonus.rings}
                totalBonus={bonus.total}
                onContinue={handleContinue}
              />
            )}
            {gs.state === 'GAMEOVER' && gs.finalStats && (
              <GameOverScreen
                key="gameover"
                stats={gs.finalStats}
                board={board}
                highlightId={gs.pendingHighlightId}
                onSubmitted={(id) => game.setHighlightId(id)}
                onRetry={handleRetry}
                onMenu={handleMenu}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default GameShell;
