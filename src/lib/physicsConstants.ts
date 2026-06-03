// Tuned Sonic-style momentum physics. Units are in game pixels per fixed step.
// Fixed timestep is 1/60s; constants are calibrated to feel like Genesis-era Sonic.

export const FIXED_DT = 1 / 60;
export const FIXED_DT_MS = 1000 / 60;
export const MAX_SUBSTEPS = 5;

// Internal render resolution (16:9). The canvas is integer-scaled to fit viewport.
export const VIEW_WIDTH = 480;
export const VIEW_HEIGHT = 270;

// Gravity / vertical motion
export const GRAVITY = 0.28; // per step
export const MAX_FALL_SPEED = 8;

// Horizontal ground movement
export const ACCELERATION = 0.18;
export const DECELERATION = 0.55; // when pressing opposite direction
export const FRICTION = 0.16; // when no input on ground
export const TOP_SPEED = 4.2;
export const MAX_SPEED_VISUAL = 4.2; // velocity at which speed-trail/blur engages

// Air control (reduced steering in air)
export const AIR_ACCELERATION = 0.12;
export const AIR_FRICTION = 0.02;

// Jumping
export const JUMP_FORCE = -6.4; // initial impulse
export const JUMP_RELEASE_CAP = -2.6; // cap upward velocity when jump released early
export const JUMP_MIN_HOLD_MS = 0;
export const JUMP_MAX_HOLD_MS = 220; // variable jump window

// Rolling
export const ROLL_FRICTION = 0.06;
export const ROLL_DECELERATION = 0.32;
export const MIN_ROLL_SPEED = 0.6; // below this, stop rolling

// Spin dash
export const SPINDASH_CHARGE_RATE = 0.18; // power gained per step while charging
export const SPINDASH_CHARGE_MAX = 8;
export const SPINDASH_RELEASE_BASE = 4.6;
export const SPINDASH_RELEASE_SCALE = 0.55; // multiplied by chargePower
export const SPINDASH_MAX_SPEED = 8.5;
export const SPINDASH_DECAY = 0.045; // friction on the launched roll

// Player collision box
export const PLAYER_WIDTH = 16;
export const PLAYER_HEIGHT = 28;
export const PLAYER_ROLL_HEIGHT = 18;

// Damage / invulnerability
export const INVULN_MS = 1400;
export const HURT_KNOCKBACK_X = 2.4;
export const HURT_KNOCKBACK_Y = -4.2;

// Springs
export const SPRING_FORCE = -9.4;

// Enemy defaults
export const ENEMY_PATROL_SPEED = 0.6;
export const STOMP_BOUNCE = -5.2;

// Ring scatter on damage
export const SCATTER_RING_MAX = 24;
export const SCATTER_GRAVITY = 0.22;
export const SCATTER_LIFE_MS = 4200;
export const SCATTER_BASE_SPEED = 2.8;

// Camera
export const CAMERA_LERP = 0.16;
export const CAMERA_LOOKAHEAD = 0.0;

// Scoring
export const RING_VALUE = 10; // not used directly; rings tracked separately
export const ENEMY_SCORE = 100;
export const TIME_BONUS_PER_SECOND = 10;
export const RING_BONUS_PER_RING = 100;

// Lives / starting state
export const STARTING_LIVES = 3;
