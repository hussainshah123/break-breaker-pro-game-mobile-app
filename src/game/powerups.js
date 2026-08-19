/**
 * Power-up catalogue. Each entry is purely descriptive — the engine reads
 * `duration` and applies the matching effect in `applyPowerUp`.
 */

export const POWERUP = {
  GROW: 'grow',
  MULTI: 'multi',
  FIRE: 'fire',
  SLOW: 'slow',
  MAGNET: 'magnet',
};

export const POWERUP_META = {
  [POWERUP.GROW]: {
    label: 'Paddle Grow',
    icon: '━',
    color: '#4CC9F0',
    duration: 12,
    hint: 'Paddle gets wider',
  },
  [POWERUP.MULTI]: {
    label: 'Multi Ball',
    icon: '⚪',
    color: '#4895EF',
    duration: 0, // instant, no timer
    hint: 'One ball becomes three',
  },
  [POWERUP.FIRE]: {
    label: 'Fire Ball',
    icon: '🔥',
    color: '#FF4D6D',
    duration: 9,
    hint: 'Ball burns straight through bricks',
  },
  [POWERUP.SLOW]: {
    label: 'Slow Motion',
    icon: '🐢',
    color: '#FFC93C',
    duration: 10,
    hint: 'Everything moves slower',
  },
  [POWERUP.MAGNET]: {
    label: 'Magnet Paddle',
    icon: '🧲',
    color: '#B15CFF',
    duration: 11,
    hint: 'Ball is pulled toward the paddle centre',
  },
};

/** Weighted pick so Multi Ball / Fire Ball stay a little rarer. */
const WEIGHTS = [
  [POWERUP.GROW, 26],
  [POWERUP.MULTI, 18],
  [POWERUP.FIRE, 16],
  [POWERUP.SLOW, 20],
  [POWERUP.MAGNET, 20],
];

export function randomPowerUpType() {
  const total = WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [type, weight] of WEIGHTS) {
    roll -= weight;
    if (roll <= 0) {
      return type;
    }
  }
  return POWERUP.GROW;
}
