/**
 * Brick Breaker Pro — game engine.
 *
 * Deliberately framework free: no React, no native modules, just a mutable
 * `world` object plus `stepWorld(world, dt)`. The screen owns the render loop
 * and reads the world every frame; the engine only reports what happened via
 * the returned event list (used for sound + score popups).
 */

import {
  BALL_BASE_SPEED,
  BALL_MAX_SPEED,
  BALL_RADIUS,
  BALL_SPEED_PER_LEVEL,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_TYPE,
  EXPLOSION_RADIUS,
  GAME_STATE,
  GRID_TOP,
  MAGNET_PULL,
  MAX_BOUNCE_ANGLE,
  MAX_DT,
  MAX_PARTICLES,
  MIN_VERTICAL_RATIO,
  PADDLE_BASE_WIDTH,
  PADDLE_BOTTOM_OFFSET,
  PADDLE_GROWN_WIDTH,
  PADDLE_HEIGHT,
  POWERUP_DROP_CHANCE,
  POWERUP_FALL_SPEED,
  POWERUP_SIZE,
  SCORE,
  SLOW_MOTION_SCALE,
  START_LIVES,
  WALL_PADDING,
} from './constants';
import { buildBricks } from './levels';
import { POWERUP, POWERUP_META, randomPowerUpType } from './powerups';

let nextEntityId = 1;
const uid = () => nextEntityId++;

// ---------------------------------------------------------------- creation

export function createWorld({ width, height, levelIndex = 0, lives = START_LIVES }) {
  const paddleY = height - PADDLE_BOTTOM_OFFSET;
  const world = {
    width,
    height,
    levelIndex,
    state: GAME_STATE.READY,

    paddle: {
      x: width / 2,
      y: paddleY,
      w: PADDLE_BASE_WIDTH,
      targetW: PADDLE_BASE_WIDTH,
      h: PADDLE_HEIGHT,
    },

    balls: [],
    bricks: buildBricks(levelIndex, width, {
      gap: BRICK_GAP,
      height: BRICK_HEIGHT,
      top: GRID_TOP,
      padding: WALL_PADDING,
    }),
    powerups: [],
    particles: [],

    // active effect timers, in seconds remaining
    effects: {
      [POWERUP.GROW]: 0,
      [POWERUP.FIRE]: 0,
      [POWERUP.SLOW]: 0,
      [POWERUP.MAGNET]: 0,
    },

    lives,
    livesLost: 0,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    bricksDestroyed: 0,
    elapsed: 0,

    baseSpeed: Math.min(
      BALL_MAX_SPEED,
      BALL_BASE_SPEED + levelIndex * BALL_SPEED_PER_LEVEL,
    ),

    // bumped whenever the brick layer changes, so React can skip re-renders
    brickVersion: 0,
  };

  resetBallOnPaddle(world);
  return world;
}

function makeBall(world, x, y, vx, vy) {
  return {
    id: uid(),
    x,
    y,
    vx,
    vy,
    r: BALL_RADIUS,
    speed: world.baseSpeed,
    stuck: false,
  };
}

/** Puts a single ball back on the paddle and waits for the player to launch. */
export function resetBallOnPaddle(world) {
  const { paddle } = world;
  const ball = makeBall(world, paddle.x, paddle.y - BALL_RADIUS - 2, 0, 0);
  ball.stuck = true;
  world.balls = [ball];
  world.state = GAME_STATE.READY;
}

export function launchBall(world) {
  if (world.state !== GAME_STATE.READY) {
    return false;
  }
  let launched = false;
  world.balls.forEach(ball => {
    if (!ball.stuck) {
      return;
    }
    // Fire upward with a small random lean so repeat runs are not identical.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    ball.vx = Math.cos(angle) * ball.speed;
    ball.vy = Math.sin(angle) * ball.speed;
    ball.stuck = false;
    launched = true;
  });
  if (launched) {
    world.state = GAME_STATE.PLAYING;
  }
  return launched;
}

/** Player drag handler — clamps the paddle inside the field. */
export function movePaddle(world, x) {
  const half = world.paddle.w / 2;
  world.paddle.x = clamp(x, half + WALL_PADDING, world.width - half - WALL_PADDING);
}

// ---------------------------------------------------------------- main step

/**
 * Advances the simulation. Returns an array of events, e.g.
 * `[{type:'brickBreak', x, y}, {type:'lifeLost'}]`.
 */
export function stepWorld(world, rawDt) {
  const events = [];
  if (world.state !== GAME_STATE.PLAYING && world.state !== GAME_STATE.READY) {
    return events;
  }

  // A long frame (JS thread hiccup, app resumed) must never teleport the ball.
  const dt = Math.min(rawDt, MAX_DT);
  const scaled = world.effects[POWERUP.SLOW] > 0 ? dt * SLOW_MOTION_SCALE : dt;

  world.elapsed += dt;
  tickEffects(world, dt, events);
  tickPaddle(world, dt);

  if (world.state === GAME_STATE.READY) {
    // Ball rides along with the paddle until launch.
    world.balls.forEach(ball => {
      if (ball.stuck) {
        ball.x = world.paddle.x;
        ball.y = world.paddle.y - ball.r - 2;
      }
    });
  } else {
    for (let i = world.balls.length - 1; i >= 0; i--) {
      const ball = world.balls[i];
      stepBall(world, ball, scaled, events);
      if (ball.y - ball.r > world.height) {
        world.balls.splice(i, 1);
        events.push({ type: 'ballLost' });
      }
    }
  }

  tickPowerUps(world, scaled, events);
  tickParticles(world, scaled);

  if (world.state === GAME_STATE.PLAYING && world.balls.length === 0) {
    loseLife(world, events);
  }

  if (world.state === GAME_STATE.PLAYING && !hasBreakableBricks(world)) {
    world.state = GAME_STATE.LEVEL_CLEAR;
    world.score += world.lives * SCORE.LIFE_BONUS;
    events.push({ type: 'levelClear' });
  }

  return events;
}

// ---------------------------------------------------------------- ball step

function stepBall(world, ball, dt, events) {
  if (ball.stuck) {
    ball.x = world.paddle.x;
    ball.y = world.paddle.y - ball.r - 2;
    return;
  }

  if (world.effects[POWERUP.MAGNET] > 0) {
    applyMagnet(world, ball, dt);
  }

  // Sub-step so the ball can never skip past a brick in a single frame.
  const distance = Math.hypot(ball.vx, ball.vy) * dt;
  const steps = Math.max(1, Math.ceil(distance / (ball.r * 0.5)));
  const sdt = dt / steps;

  for (let i = 0; i < steps; i++) {
    // Axis-separated movement: move on X, resolve, then move on Y, resolve.
    ball.x += ball.vx * sdt;
    resolveWallsX(world, ball, events);
    resolveBricks(world, ball, 'x', events);

    ball.y += ball.vy * sdt;
    resolveWallsY(world, ball, events);
    resolveBricks(world, ball, 'y', events);
    resolvePaddle(world, ball, events);

    if (ball.y - ball.r > world.height) {
      break; // gone — the caller removes it
    }
  }
}

function applyMagnet(world, ball, dt) {
  const { paddle } = world;
  const inRange = ball.y > paddle.y - 220 && ball.vy > 0;
  if (!inRange) {
    return;
  }
  const dir = Math.sign(paddle.x - ball.x);
  ball.vx += dir * MAGNET_PULL * dt;
  normaliseSpeed(ball);
}

function resolveWallsX(world, ball, events) {
  const left = WALL_PADDING + ball.r;
  const right = world.width - WALL_PADDING - ball.r;
  if (ball.x < left) {
    ball.x = left;
    ball.vx = Math.abs(ball.vx);
    events.push({ type: 'wall' });
  } else if (ball.x > right) {
    ball.x = right;
    ball.vx = -Math.abs(ball.vx);
    events.push({ type: 'wall' });
  }
}

function resolveWallsY(world, ball, events) {
  const top = ball.r;
  if (ball.y < top) {
    ball.y = top;
    ball.vy = Math.abs(ball.vy);
    events.push({ type: 'wall' });
  }
}

function resolvePaddle(world, ball, events) {
  const { paddle } = world;
  if (ball.vy <= 0) {
    return; // travelling upward, ignore
  }
  const halfW = paddle.w / 2;
  const withinX = ball.x + ball.r > paddle.x - halfW && ball.x - ball.r < paddle.x + halfW;
  const withinY =
    ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h;
  if (!withinX || !withinY) {
    return;
  }

  ball.y = paddle.y - ball.r;

  // Classic arkanoid deflection: where you hit decides the outgoing angle.
  const offset = clamp((ball.x - paddle.x) / halfW, -1, 1);
  const angle = offset * MAX_BOUNCE_ANGLE;
  ball.vx = Math.sin(angle) * ball.speed;
  ball.vy = -Math.cos(angle) * ball.speed;
  enforceMinVertical(ball);

  world.combo = 0; // combo only counts bricks broken in one paddle-to-paddle trip
  events.push({ type: 'paddle' });
}

function resolveBricks(world, ball, axis, events) {
  const fire = world.effects[POWERUP.FIRE] > 0;
  const bl = ball.x - ball.r;
  const br = ball.x + ball.r;
  const bt = ball.y - ball.r;
  const bb = ball.y + ball.r;

  let bounced = false;

  for (let i = 0; i < world.bricks.length; i++) {
    const brick = world.bricks[i];
    if (!brick.alive) {
      continue;
    }
    if (
      br <= brick.x ||
      bl >= brick.x + brick.w ||
      bb <= brick.y ||
      bt >= brick.y + brick.h
    ) {
      continue;
    }

    const isSteel = brick.type === BRICK_TYPE.STEEL;
    const burnsThrough = fire && !isSteel;

    if (burnsThrough) {
      // Fire ball keeps its heading and can clear several bricks at once.
      damageBrick(world, brick, brick.hp, events, 0);
      continue;
    }

    if (!bounced) {
      // Push out along the axis we just moved, then flip that component.
      if (axis === 'x') {
        if (ball.vx > 0) {
          ball.x = brick.x - ball.r;
        } else {
          ball.x = brick.x + brick.w + ball.r;
        }
        ball.vx = -ball.vx;
      } else {
        if (ball.vy > 0) {
          ball.y = brick.y - ball.r;
        } else {
          ball.y = brick.y + brick.h + ball.r;
        }
        ball.vy = -ball.vy;
      }
      bounced = true;
    }

    if (isSteel) {
      brick.flash++;
      world.brickVersion++;
      events.push({ type: 'steel', x: brick.x + brick.w / 2, y: brick.y + brick.h / 2 });
    } else {
      damageBrick(world, brick, 1, events, 0);
    }

    if (bounced) {
      break; // one bounce per axis per sub-step keeps the response stable
    }
  }
}

// ---------------------------------------------------------------- bricks

function damageBrick(world, brick, amount, events, depth) {
  if (!brick.alive || brick.type === BRICK_TYPE.STEEL) {
    return;
  }

  brick.hp -= amount;
  brick.flash++;
  world.brickVersion++;
  const cx = brick.x + brick.w / 2;
  const cy = brick.y + brick.h / 2;

  if (brick.hp > 0) {
    world.score += SCORE.BRICK_HIT;
    spawnParticles(world, cx, cy, brick.maxHp, 4);
    events.push({ type: 'brickHit', x: cx, y: cy });
    return;
  }

  brick.alive = false;
  world.bricksDestroyed++;
  world.combo++;
  world.bestCombo = Math.max(world.bestCombo, world.combo);

  const multiplier = 1 + Math.floor(world.combo / 4);
  world.score += SCORE.BRICK_DESTROY * multiplier;
  world.coins += 2;

  spawnParticles(world, cx, cy, brick.maxHp, 12);
  events.push({
    type: 'brickBreak',
    x: cx,
    y: cy,
    multiplier,
    explosive: brick.type === BRICK_TYPE.EXPLOSIVE,
  });

  if (brick.type === BRICK_TYPE.EXPLOSIVE && depth < 4) {
    explode(world, brick, events, depth + 1);
  }

  maybeDropPowerUp(world, cx, cy);
}

function explode(world, source, events, depth) {
  const cx = source.x + source.w / 2;
  const cy = source.y + source.h / 2;
  const radius = source.w * EXPLOSION_RADIUS;

  spawnParticles(world, cx, cy, 5, 20);
  events.push({ type: 'explosion', x: cx, y: cy });

  world.bricks.forEach(other => {
    if (!other.alive || other === source) {
      return;
    }
    const ox = other.x + other.w / 2;
    const oy = other.y + other.h / 2;
    if (Math.hypot(ox - cx, oy - cy) <= radius) {
      damageBrick(world, other, other.hp, events, depth);
    }
  });
}

function hasBreakableBricks(world) {
  return world.bricks.some(b => b.alive && b.type !== BRICK_TYPE.STEEL);
}

// ---------------------------------------------------------------- power-ups

function maybeDropPowerUp(world, x, y) {
  if (Math.random() > POWERUP_DROP_CHANCE) {
    return;
  }
  world.powerups.push({
    id: uid(),
    type: randomPowerUpType(),
    x: x - POWERUP_SIZE / 2,
    y: y - POWERUP_SIZE / 2,
    size: POWERUP_SIZE,
    vy: POWERUP_FALL_SPEED,
    spin: 0,
  });
}

function tickPowerUps(world, dt, events) {
  const { paddle } = world;
  for (let i = world.powerups.length - 1; i >= 0; i--) {
    const p = world.powerups[i];
    p.y += p.vy * dt;
    p.spin += dt * 120;

    const halfW = paddle.w / 2;
    const caught =
      p.y + p.size >= paddle.y &&
      p.y <= paddle.y + paddle.h &&
      p.x + p.size >= paddle.x - halfW &&
      p.x <= paddle.x + halfW;

    if (caught) {
      world.powerups.splice(i, 1);
      applyPowerUp(world, p.type, events);
      world.score += SCORE.POWERUP;
      world.coins += 5;
      spawnParticles(world, p.x + p.size / 2, p.y, 1, 10);
      events.push({ type: 'powerup', powerup: p.type });
    } else if (p.y > world.height) {
      world.powerups.splice(i, 1);
    }
  }
}

export function applyPowerUp(world, type, events = []) {
  const meta = POWERUP_META[type];

  if (type === POWERUP.MULTI) {
    spawnExtraBalls(world);
    return;
  }

  // Re-catching an active power-up refreshes rather than stacks its timer.
  world.effects[type] = meta.duration;

  if (type === POWERUP.GROW) {
    world.paddle.targetW = PADDLE_GROWN_WIDTH;
  }
  if (type === POWERUP.FIRE) {
    events.push({ type: 'fireOn' });
  }
}

function spawnExtraBalls(world) {
  const source = world.balls[0];
  if (!source) {
    return;
  }
  const base = Math.atan2(source.vy, source.vx);
  [-0.45, 0.45].forEach(offset => {
    const angle = base + offset;
    const ball = makeBall(
      world,
      source.x,
      source.y,
      Math.cos(angle) * source.speed,
      Math.sin(angle) * source.speed,
    );
    enforceMinVertical(ball);
    world.balls.push(ball);
  });
}

function tickEffects(world, dt, events) {
  Object.keys(world.effects).forEach(key => {
    if (world.effects[key] <= 0) {
      return;
    }
    world.effects[key] = Math.max(0, world.effects[key] - dt);
    if (world.effects[key] === 0) {
      if (key === POWERUP.GROW) {
        world.paddle.targetW = PADDLE_BASE_WIDTH;
      }
      events.push({ type: 'effectEnd', powerup: key });
    }
  });
}

function tickPaddle(world, dt) {
  const { paddle } = world;
  if (paddle.w !== paddle.targetW) {
    // Ease toward the target width so growing/shrinking reads as animated.
    paddle.w += (paddle.targetW - paddle.w) * Math.min(1, dt * 8);
    if (Math.abs(paddle.targetW - paddle.w) < 0.5) {
      paddle.w = paddle.targetW;
    }
    movePaddle(world, paddle.x); // re-clamp: a wider paddle may now overhang
  }
}

// ---------------------------------------------------------------- particles

function spawnParticles(world, x, y, tier, count) {
  const room = MAX_PARTICLES - world.particles.length;
  const n = Math.min(count, Math.max(0, room));
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 180;
    world.particles.push({
      id: uid(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      size: 2 + Math.random() * 4,
      life: 0.45 + Math.random() * 0.35,
      maxLife: 0.8,
      tier,
    });
  }
}

function tickParticles(world, dt) {
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const p = world.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      world.particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 520 * dt; // gravity
  }
}

// ---------------------------------------------------------------- lives

function loseLife(world, events) {
  world.lives -= 1;
  world.livesLost += 1;
  world.combo = 0;
  world.powerups = [];
  Object.keys(world.effects).forEach(key => {
    world.effects[key] = 0;
  });
  world.paddle.targetW = PADDLE_BASE_WIDTH;
  world.paddle.w = PADDLE_BASE_WIDTH;

  if (world.lives <= 0) {
    world.lives = 0;
    world.state = GAME_STATE.GAME_OVER;
    events.push({ type: 'gameOver' });
    return;
  }

  resetBallOnPaddle(world);
  events.push({ type: 'lifeLost' });
}

// ---------------------------------------------------------------- helpers

function normaliseSpeed(ball) {
  const mag = Math.hypot(ball.vx, ball.vy) || 1;
  ball.vx = (ball.vx / mag) * ball.speed;
  ball.vy = (ball.vy / mag) * ball.speed;
  enforceMinVertical(ball);
}

/**
 * Stops the ball settling into a nearly horizontal path, which would have it
 * ping between the side walls forever.
 */
function enforceMinVertical(ball) {
  const minVy = ball.speed * MIN_VERTICAL_RATIO;
  if (Math.abs(ball.vy) < minVy) {
    const sign = ball.vy === 0 ? -1 : Math.sign(ball.vy);
    ball.vy = sign * minVy;
    const remaining = Math.sqrt(
      Math.max(0, ball.speed * ball.speed - ball.vy * ball.vy),
    );
    ball.vx = Math.sign(ball.vx || 1) * remaining;
  }
}

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/** 3 stars for a flawless clear, 2 if you dropped one ball, 1 otherwise. */
export function starsFor(world) {
  if (world.livesLost === 0) {
    return 3;
  }
  if (world.livesLost === 1) {
    return 2;
  }
  return 1;
}

export function coinsFor(world, stars) {
  return world.coins + stars * 50;
}
