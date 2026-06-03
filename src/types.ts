export type GameStateName = 'MENU' | 'PLAYING' | 'PAUSED' | 'TRANSITION' | 'GAMEOVER';

export type SonicAnim = 'idle' | 'tap' | 'run' | 'jump' | 'spin' | 'spindash' | 'hurt';
export type Facing = 1 | -1;

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpHeldMs: number;
  crouch: boolean;
  crouchHeldMs: number;
  pause: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  grounded: boolean;
  facing: Facing;
  rolling: boolean;
  charging: boolean;
  chargePower: number;
  invulnMs: number;
  anim: SonicAnim;
  animFrame: number;
  animTimer: number;
}

export type EnemyKind = 'motobug' | 'buzzer' | 'crabmeat';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  baseY: number;
  patrolMin: number;
  patrolMax: number;
  alive: boolean;
  animFrame: number;
  animTimer: number;
}

export interface Ring {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  collected: boolean;
  animFrame: number;
  animTimer: number;
  vx?: number;
  vy?: number;
  scattered?: boolean;
  lifeMs?: number;
}

export type ObstacleKind = 'spike' | 'spring' | 'block';

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ParticleScatter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifeMs: number;
  maxLifeMs: number;
}

export interface ParallaxLayer {
  color: string;
  speed: number;
  kind: 'sky' | 'hills' | 'clouds' | 'mountains' | 'water';
  y: number;
  h: number;
}

export interface LevelPalette {
  bg: string;
  ground: string;
  groundTop: string;
  accent: string;
  hazard: string;
}

export interface TileRow {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LevelData {
  index: number;
  zoneName: string;
  zoneLabel: string;
  width: number;
  height: number;
  timeLimit: number;
  palette: LevelPalette;
  parallax: ParallaxLayer[];
  solids: TileRow[];
  rings: { x: number; y: number }[];
  enemies: { kind: EnemyKind; x: number; y: number; patrolMin: number; patrolMax: number }[];
  obstacles: { kind: ObstacleKind; x: number; y: number }[];
  spawn: Vec2;
  goalX: number;
}

export interface RunStats {
  score: number;
  rings: number;
  levelReached: number;
  timeSeconds: number;
  enemiesDefeated: number;
  deaths: number;
  completed: boolean;
}

export interface ScoreEntry {
  id: string;
  player_name: string;
  score: number;
  rings_collected: number;
  level_reached: number;
  time_seconds: number;
  created_at: string;
  __example?: boolean;
}

export interface AnimFrame {
  duration: number;
}

export interface AnimDef {
  frames: AnimFrame[];
  loop: boolean;
}
