/**
 * Level layouts.
 *
 * Every row is exactly GRID_COLS (8) characters wide:
 *   '.'   empty cell
 *   '1'-'5' normal brick with that much HP
 *   'S'   steel brick — indestructible, always bounces
 *   'X'   explosive brick — takes out its neighbours when it dies
 */

import { BRICK_TYPE, GRID_COLS } from './constants';

export const LEVELS = [
  {
    name: 'First Contact',
    rows: [
      '11111111',
      '11111111',
      '........',
      '........',
    ],
  },
  {
    name: 'Checkers',
    rows: [
      '1.1.1.1.',
      '.2.2.2.2',
      '1.1.1.1.',
      '........',
    ],
  },
  {
    name: 'The Wall',
    rows: [
      '22222222',
      '11111111',
      '22222222',
      '........',
    ],
  },
  {
    name: 'Pyramid',
    rows: [
      '...11...',
      '..1221..',
      '.122221.',
      '12222221',
    ],
  },
  {
    name: 'Steel Gate',
    rows: [
      '2SS22SS2',
      '22222222',
      '.2.22.2.',
      '........',
    ],
  },
  {
    name: 'Fireworks',
    rows: [
      '2.2X2.2.',
      '.22222..',
      '2.2X2.2.',
      '.2.....2',
    ],
  },
  {
    name: 'Hourglass',
    rows: [
      '33333333',
      '.2....2.',
      '..3223..',
      '.2....2.',
      '33333333',
    ],
  },
  {
    name: 'Fortress',
    rows: [
      'SS3333SS',
      '.333333.',
      '.3S..S3.',
      '.333333.',
      '..3333..',
    ],
  },
  {
    name: 'Cross Fire',
    rows: [
      '3..XX..3',
      '.3.33.3.',
      'XX3333XX',
      '.3.33.3.',
      '3..XX..3',
    ],
  },
  {
    name: 'Heavy Metal',
    rows: [
      '44444444',
      'S444444S',
      '44S..S44',
      '.444444.',
      '..4444..',
    ],
  },
  {
    name: 'Snake',
    rows: [
      '44444...',
      '....4...',
      '..X444X4',
      '..4.....',
      '444444S4',
    ],
  },
  {
    name: 'Twin Towers',
    rows: [
      'S44..44S',
      '444..444',
      '44X..X44',
      '44444444',
      '.4S44S4.',
    ],
  },
  {
    name: 'Meltdown',
    rows: [
      '5555S555',
      '4XX44XX4',
      '54444445',
      'S4S44S4S',
      '.554455.',
    ],
  },
  {
    name: 'The Grinder',
    rows: [
      'SS5555SS',
      '55X55X55',
      '5S5445S5',
      '55X55X55',
      'SS5555SS',
    ],
  },
  {
    name: 'Final Break',
    rows: [
      '5S5555S5',
      '5XX55XX5',
      '55555555',
      'S5S55S5S',
      '5XX55XX5',
      '.5S55S5.',
    ],
  },
];

export const TOTAL_LEVELS = LEVELS.length;

function parseCell(ch) {
  if (ch === '.') {
    return null;
  }
  if (ch === 'S') {
    return { type: BRICK_TYPE.STEEL, hp: Infinity };
  }
  if (ch === 'X') {
    return { type: BRICK_TYPE.EXPLOSIVE, hp: 1 };
  }
  const hp = parseInt(ch, 10);
  if (Number.isNaN(hp) || hp <= 0) {
    return null;
  }
  return { type: BRICK_TYPE.NORMAL, hp };
}

/**
 * Turns a level definition into positioned brick objects.
 * `fieldWidth` is the playable width; bricks fill it edge to edge.
 */
export function buildBricks(levelIndex, fieldWidth, options) {
  const { gap, height, top, padding } = options;
  const level = LEVELS[levelIndex % LEVELS.length];
  const usable = fieldWidth - padding * 2 - gap * (GRID_COLS - 1);
  const brickWidth = usable / GRID_COLS;

  const bricks = [];
  let id = 0;

  level.rows.forEach((row, r) => {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = parseCell(row[c] ?? '.');
      if (!cell) {
        continue;
      }
      bricks.push({
        id: id++,
        row: r,
        col: c,
        x: padding + c * (brickWidth + gap),
        y: top + r * (height + gap),
        w: brickWidth,
        h: height,
        type: cell.type,
        hp: cell.hp,
        maxHp: cell.hp,
        alive: true,
        // bumped every time the brick is hit so the view can flash it
        flash: 0,
      });
    }
  });

  return bricks;
}

export function levelName(levelIndex) {
  return LEVELS[levelIndex % LEVELS.length].name;
}
