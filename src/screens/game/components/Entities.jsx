/**
 * Everything that moves every frame: paddle, balls, falling power-ups and
 * particles. Positioned with `transform` so updates skip Yoga layout.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BRICK_COLORS, COLORS } from '../../../game/constants';
import { POWERUP_META } from '../../../game/powerups';

export function Paddle({ paddle, magnet, grow }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.paddle,
        {
          width: paddle.w,
          height: paddle.h,
          transform: [
            { translateX: paddle.x - paddle.w / 2 },
            { translateY: paddle.y },
          ],
          backgroundColor: grow ? COLORS.paddleGlow : COLORS.paddle,
          shadowColor: magnet ? '#B15CFF' : COLORS.accent,
        },
      ]}>
      <View style={styles.paddleCore} />
      {magnet ? <View style={styles.magnetField} /> : null}
    </View>
  );
}

export function Balls({ balls, fire }) {
  return (
    <>
      {balls.map(ball => (
        <View
          key={ball.id}
          pointerEvents="none"
          style={[
            styles.ball,
            {
              width: ball.r * 2,
              height: ball.r * 2,
              borderRadius: ball.r,
              backgroundColor: fire ? COLORS.ballFire : COLORS.ball,
              shadowColor: fire ? COLORS.ballFire : COLORS.accent,
              transform: [
                { translateX: ball.x - ball.r },
                { translateY: ball.y - ball.r },
              ],
            },
          ]}
        />
      ))}
    </>
  );
}

export function PowerUps({ powerups }) {
  return (
    <>
      {powerups.map(p => {
        const meta = POWERUP_META[p.type];
        return (
          <View
            key={p.id}
            pointerEvents="none"
            style={[
              styles.powerup,
              {
                width: p.size,
                height: p.size,
                borderColor: meta.color,
                transform: [{ translateX: p.x }, { translateY: p.y }],
              },
            ]}>
            <Text style={styles.powerupIcon}>{meta.icon}</Text>
          </View>
        );
      })}
    </>
  );
}

export function Particles({ particles }) {
  return (
    <>
      {particles.map(p => (
        <View
          key={p.id}
          pointerEvents="none"
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              opacity: Math.max(0, p.life / p.maxLife),
              backgroundColor: BRICK_COLORS[Math.min(5, p.tier)] ?? COLORS.accent,
              transform: [{ translateX: p.x }, { translateY: p.y }],
            },
          ]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  paddle: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 8,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
    justifyContent: 'center',
  },
  paddleCore: {
    height: 3,
    marginHorizontal: 10,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  magnetField: {
    position: 'absolute',
    left: -6,
    right: -6,
    top: -10,
    bottom: -6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(177,92,255,0.55)',
  },
  ball: {
    position: 'absolute',
    left: 0,
    top: 0,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  powerup: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'rgba(10,16,38,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerupIcon: { fontSize: 14 },
  particle: { position: 'absolute', left: 0, top: 0 },
});
