/**
 * Top bar: score, level, lives, plus the row of active power-up timers.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../../../game/constants';
import { POWERUP_META } from '../../../game/powerups';
import { formatScore } from '../../../components/ui';

export default function HUD({ score, level, levelName, lives, effects, onPause }) {
  const active = Object.entries(effects).filter(([, time]) => time > 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.score}>{formatScore(score)}</Text>
        </View>

        <View style={[styles.cell, styles.center]}>
          <Text style={styles.label}>LEVEL {level}</Text>
          <Text style={styles.levelName} numberOfLines={1}>
            {levelName}
          </Text>
        </View>

        <View style={[styles.cell, styles.right]}>
          <Text style={styles.label}>LIVES</Text>
          <Text style={styles.lives}>{'♥'.repeat(Math.max(0, lives)) || '—'}</Text>
        </View>

        <Pressable onPress={onPause} hitSlop={12} style={styles.pause}>
          <Text style={styles.pauseIcon}>❚❚</Text>
        </Pressable>
      </View>

      {active.length > 0 ? (
        <View style={styles.effects}>
          {active.map(([type, time]) => {
            const meta = POWERUP_META[type];
            return (
              <View
                key={type}
                style={[styles.chip, { borderColor: meta.color }]}>
                <Text style={styles.chipIcon}>{meta.icon}</Text>
                <Text style={[styles.chipTime, { color: meta.color }]}>
                  {time.toFixed(1)}s
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  cell: { flex: 1 },
  center: { alignItems: 'center' },
  right: { alignItems: 'flex-end', marginRight: 34 },
  label: {
    color: COLORS.textDim,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  score: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  levelName: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },
  lives: { color: COLORS.danger, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  pause: {
    position: 'absolute',
    right: 0,
    top: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.panelAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseIcon: { color: COLORS.textDim, fontSize: 11, fontWeight: '900' },

  effects: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(20,28,60,0.8)',
  },
  chipIcon: { fontSize: 11 },
  chipTime: { fontSize: 11, fontWeight: '800' },
});
