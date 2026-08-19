/**
 * Bricks change far less often than balls do, so this layer re-renders only
 * when `version` (bumped by the engine on any brick change) actually moves.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BRICK_COLORS, BRICK_TYPE } from '../../../game/constants';

function brickColor(brick) {
  if (brick.type === BRICK_TYPE.STEEL) {
    return BRICK_COLORS.steel;
  }
  if (brick.type === BRICK_TYPE.EXPLOSIVE) {
    return BRICK_COLORS.explosive;
  }
  return BRICK_COLORS[Math.min(5, Math.max(1, brick.hp))] ?? BRICK_COLORS[1];
}

function BrickLayer({ bricks }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bricks.map(brick => {
        if (!brick.alive) {
          return null;
        }
        const color = brickColor(brick);
        const damaged = brick.type === BRICK_TYPE.NORMAL && brick.hp < brick.maxHp;
        return (
          <View
            key={brick.id}
            style={[
              styles.brick,
              {
                width: brick.w,
                height: brick.h,
                backgroundColor: color,
                transform: [{ translateX: brick.x }, { translateY: brick.y }],
              },
            ]}>
            <View style={styles.gloss} />
            {damaged ? <View style={styles.crack} /> : null}
            {brick.type === BRICK_TYPE.STEEL ? (
              <Text style={styles.glyph}>▨</Text>
            ) : null}
            {brick.type === BRICK_TYPE.EXPLOSIVE ? (
              <Text style={styles.glyph}>✸</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  brick: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gloss: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '38%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  crack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  glyph: {
    color: 'rgba(0,0,0,0.45)',
    fontSize: 13,
    fontWeight: '900',
  },
});

export default React.memo(BrickLayer, (prev, next) => prev.version === next.version);
