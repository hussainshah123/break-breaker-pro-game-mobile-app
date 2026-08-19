/**
 * Central tuning values + palette for Brick Breaker Pro.
 * Every distance is in logical pixels, every speed in pixels/second.
 */

export const COLORS = {
  bg: '#070B1A',
  bgAlt: '#0E1430',
  panel: '#141C3C',
  panelAlt: '#1C2650',
  accent: '#4CC9F0',
  accent2: '#7B61FF',
  gold: '#FFC93C',
  danger: '#FF4D6D',
  text: '#EAF0FF',
  textDim: '#8A96C0',
  paddle: '#4CC9F0',
  paddleGlow: '#7B61FF',
  ball: '#FFFFFF',
  ballFire: '#FF8A3D',
};

/** Brick colour ramp indexed by remaining HP (1..5). */
export const BRICK_COLORS = {
  1: '#4CC9F0',
  2: '#4895EF',
  3: '#7B61FF',
  4: '#F72585',
  5: '#FF4D6D',
  steel: '#7A88B8',
  explosive: '#FF8A3D',
};

export const BRICK_TYPE = {
  NORMAL: 'normal',
  STEEL: 'steel',
  EXPLOSIVE: 'explosive',
};

// ---------------------------------------------------------------- geometry
export const GRID_COLS = 8;
export const BRICK_GAP = 4;
export const BRICK_HEIGHT = 24;
export const GRID_TOP = 24; // gap between HUD and first brick row
export const WALL_PADDING = 8;

export const BALL_RADIUS = 8;
export const PADDLE_HEIGHT = 14;
export const PADDLE_BASE_WIDTH = 96;
export const PADDLE_GROWN_WIDTH = 158;
export const PADDLE_BOTTOM_OFFSET = 74; // distance from field bottom to paddle top

// ---------------------------------------------------------------- physics
export const BALL_BASE_SPEED = 330;
export const BALL_SPEED_PER_LEVEL = 8; // each level is a touch faster
export const BALL_MAX_SPEED = 620;
export const MAX_BOUNCE_ANGLE = (Math.PI / 180) * 60; // paddle deflection limit
export const MIN_VERTICAL_RATIO = 0.28; // stops near-horizontal stalemates
export const SLOW_MOTION_SCALE = 0.55;
export const MAGNET_PULL = 420; // lateral acceleration toward paddle centre
export const MAX_DT = 1 / 30; // clamp so a dropped frame never tunnels the ball

// ---------------------------------------------------------------- gameplay
export const START_LIVES = 3;
export const POWERUP_DROP_CHANCE = 0.22;
export const POWERUP_FALL_SPEED = 170;
export const POWERUP_SIZE = 30;
export const EXPLOSION_RADIUS = 1.6; // in brick widths

export const SCORE = {
  BRICK_HIT: 10,
  BRICK_DESTROY: 50,
  POWERUP: 100,
  LIFE_BONUS: 250,
};

export const MAX_PARTICLES = 140;

export const GAME_STATE = {
  READY: 'ready', // ball sitting on the paddle, waiting for launch
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_CLEAR: 'levelClear',
  GAME_OVER: 'gameOver',
};
