/**
 * Headless engine tests — the simulation is plain JS, so it can be driven
 * frame by frame without rendering anything.
 */

import {
  applyPowerUp,
  createWorld,
  launchBall,
  movePaddle,
  starsFor,
  stepWorld,
} from '../src/game/engine';
import { BRICK_TYPE, GAME_STATE, PADDLE_BASE_WIDTH } from '../src/game/constants';
import { POWERUP } from '../src/game/powerups';

const FRAME = 1 / 60;

function newWorld(levelIndex = 0) {
  return createWorld({ width: 360, height: 640, levelIndex });
}

/**
 * Runs the sim with a paddle that tracks the lowest ball. The small weaving
 * offset matters: a paddle that centres perfectly always returns the ball
 * straight up, so it would forever bounce inside a single brick column.
 */
function simulate(world, seconds, { autoPaddle = true } = {}) {
  const frames = Math.round(seconds / FRAME);
  for (let i = 0; i < frames; i++) {
    if (autoPaddle && world.balls.length) {
      const lowest = world.balls.reduce((a, b) => (a.y > b.y ? a : b));
      const weave = Math.sin(i / 37) * 18; // well inside the paddle half-width
      movePaddle(world, lowest.x + weave);
    }
    stepWorld(world, FRAME);
    if (
      world.state === GAME_STATE.LEVEL_CLEAR ||
      world.state === GAME_STATE.GAME_OVER
    ) {
      break;
    }
  }
  return world;
}

describe('world setup', () => {
  it('starts in READY with one stuck ball on the paddle', () => {
    const world = newWorld();
    expect(world.state).toBe(GAME_STATE.READY);
    expect(world.balls).toHaveLength(1);
    expect(world.balls[0].stuck).toBe(true);
    expect(world.balls[0].y).toBeLessThan(world.paddle.y);
  });

  it('lays every brick out inside the field', () => {
    const world = newWorld(0);
    expect(world.bricks.length).toBeGreaterThan(0);
    world.bricks.forEach(brick => {
      expect(brick.x).toBeGreaterThanOrEqual(0);
      expect(brick.x + brick.w).toBeLessThanOrEqual(world.width);
    });
  });

  it('clamps the paddle to the field', () => {
    const world = newWorld();
    movePaddle(world, -500);
    expect(world.paddle.x).toBeGreaterThan(0);
    movePaddle(world, 5000);
    expect(world.paddle.x).toBeLessThan(world.width);
  });
});

describe('launching', () => {
  it('sends the ball upward and switches to PLAYING', () => {
    const world = newWorld();
    expect(launchBall(world)).toBe(true);
    expect(world.state).toBe(GAME_STATE.PLAYING);
    expect(world.balls[0].vy).toBeLessThan(0);
    expect(launchBall(world)).toBe(false); // already launched
  });
});

describe('simulation', () => {
  it('keeps the ball inside the field and free of NaN', () => {
    const world = newWorld(0);
    launchBall(world);
    simulate(world, 20);

    world.balls.forEach(ball => {
      expect(Number.isFinite(ball.x)).toBe(true);
      expect(Number.isFinite(ball.y)).toBe(true);
      expect(ball.x).toBeGreaterThan(-ball.r);
      expect(ball.x).toBeLessThan(world.width + ball.r);
      expect(ball.y).toBeGreaterThan(-ball.r);
    });
  });

  it('destroys bricks and scores points', () => {
    const world = newWorld(0);
    launchBall(world);
    simulate(world, 20);
    expect(world.bricksDestroyed).toBeGreaterThan(0);
    expect(world.score).toBeGreaterThan(0);
  });

  it('clears a level when a perfect paddle keeps the ball alive', () => {
    const world = newWorld(0);
    launchBall(world);
    simulate(world, 180);
    expect(world.state).toBe(GAME_STATE.LEVEL_CLEAR);
    expect(starsFor(world)).toBe(3);
  });

  it('holds a constant ball speed after bouncing around', () => {
    const world = newWorld(0);
    launchBall(world);
    simulate(world, 10);
    world.balls.forEach(ball => {
      expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(ball.speed, 3);
    });
  });
});

describe('losing', () => {
  it('drops a life when the ball falls past the paddle', () => {
    const world = newWorld(0);
    launchBall(world);
    const startingLives = world.lives;
    simulate(world, 30, { autoPaddle: false });
    expect(world.lives).toBeLessThan(startingLives);
  });

  it('reaches GAME_OVER once every life is gone', () => {
    const world = newWorld(0);
    for (let i = 0; i < 5 && world.state !== GAME_STATE.GAME_OVER; i++) {
      launchBall(world);
      simulate(world, 30, { autoPaddle: false });
    }
    expect(world.state).toBe(GAME_STATE.GAME_OVER);
    expect(world.lives).toBe(0);
  });
});

describe('power-ups', () => {
  it('grows the paddle then restores it when the timer runs out', () => {
    const world = newWorld(0);
    launchBall(world);
    applyPowerUp(world, POWERUP.GROW);
    expect(world.paddle.targetW).toBeGreaterThan(PADDLE_BASE_WIDTH);

    simulate(world, 20);
    expect(world.effects[POWERUP.GROW]).toBe(0);
    expect(world.paddle.targetW).toBe(PADDLE_BASE_WIDTH);
  });

  it('turns one ball into three', () => {
    const world = newWorld(0);
    launchBall(world);
    applyPowerUp(world, POWERUP.MULTI);
    expect(world.balls).toHaveLength(3);
  });

  it('lets the fire ball pass through bricks instead of bouncing', () => {
    const world = newWorld(0);
    launchBall(world);
    applyPowerUp(world, POWERUP.FIRE);
    const before = world.bricks.filter(b => b.alive).length;
    simulate(world, 6);
    const after = world.bricks.filter(b => b.alive).length;
    expect(before - after).toBeGreaterThan(1);
  });

  it('slows the simulation down', () => {
    const fast = newWorld(0);
    const slow = newWorld(0);
    launchBall(fast);
    launchBall(slow);
    slow.balls[0].vx = fast.balls[0].vx = 0;
    slow.balls[0].vy = fast.balls[0].vy = -fast.balls[0].speed;
    applyPowerUp(slow, POWERUP.SLOW);

    stepWorld(fast, FRAME);
    stepWorld(slow, FRAME);
    // Same starting point, so the slowed ball must have travelled less.
    expect(slow.balls[0].y).toBeGreaterThan(fast.balls[0].y);
  });
});

describe('brick types', () => {
  it('never destroys steel bricks', () => {
    const steelLevel = require('../src/game/levels').LEVELS.findIndex(l =>
      l.rows.some(r => r.includes('S')),
    );
    const world = newWorld(steelLevel);
    launchBall(world);
    simulate(world, 60);
    world.bricks
      .filter(b => b.type === BRICK_TYPE.STEEL)
      .forEach(b => expect(b.alive).toBe(true));
  });
});
