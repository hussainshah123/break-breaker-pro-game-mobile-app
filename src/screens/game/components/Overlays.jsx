/**
 * Full-screen overlays drawn on top of the frozen board: pause, level clear
 * and game over.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../../../game/constants';
import { NeonButton, Panel, Stars, formatScore } from '../../../components/ui';

function Backdrop({ children }) {
  return <View style={styles.backdrop}>{children}</View>;
}

export function PauseOverlay({ onResume, onRestart, onHome }) {
  return (
    <Backdrop>
      <Panel style={styles.card}>
        <Text style={styles.title}>PAUSED</Text>
        <View style={styles.buttons}>
          <NeonButton title="RESUME" variant="accent" onPress={onResume} />
          <NeonButton title="RESTART" onPress={onRestart} />
          <NeonButton title="HOME" variant="ghost" onPress={onHome} />
        </View>
      </Panel>
    </Backdrop>
  );
}

export function LevelClearOverlay({
  stars,
  score,
  coins,
  isLastLevel,
  onReplay,
  onNext,
}) {
  return (
    <Backdrop>
      <Panel style={styles.card}>
        <Text style={[styles.title, { color: COLORS.accent }]}>LEVEL CLEAR!</Text>
        <Text style={styles.trophy}>🏆</Text>
        <Stars count={stars} size={34} />

        <View style={styles.scoreBlock}>
          <Text style={styles.smallLabel}>SCORE</Text>
          <Text style={styles.bigScore}>{formatScore(score)}</Text>
        </View>

        <Text style={styles.coins}>🪙 +{formatScore(coins)}</Text>

        <View style={styles.rowButtons}>
          <NeonButton title="REPLAY" variant="ghost" onPress={onReplay} style={styles.flex} />
          <NeonButton
            title={isLastLevel ? 'FINISH' : 'NEXT'}
            variant="accent"
            onPress={onNext}
            style={styles.flex}
          />
        </View>

        {isLastLevel ? (
          <Text style={styles.note}>You cleared every level. Legend.</Text>
        ) : null}
      </Panel>
    </Backdrop>
  );
}

export function GameOverOverlay({ score, best, onRetry, onHome }) {
  return (
    <Backdrop>
      <Panel style={styles.card}>
        <Text style={[styles.title, { color: COLORS.danger }]}>GAME OVER</Text>
        <Text style={styles.trophy}>💔</Text>

        <View style={styles.scoreBlock}>
          <Text style={styles.smallLabel}>SCORE</Text>
          <Text style={styles.bigScore}>{formatScore(score)}</Text>
        </View>

        <View style={styles.scoreBlock}>
          <Text style={styles.smallLabel}>BEST</Text>
          <Text style={[styles.bigScore, styles.best]}>{formatScore(best)}</Text>
        </View>

        <View style={styles.buttons}>
          <NeonButton title="RETRY" variant="accent" onPress={onRetry} />
          <NeonButton title="HOME" variant="ghost" onPress={onHome} />
        </View>
      </Panel>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4,8,22,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 340, alignItems: 'center', gap: 14 },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
  },
  trophy: { fontSize: 52 },
  scoreBlock: { alignItems: 'center' },
  smallLabel: {
    color: COLORS.textDim,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
  },
  bigScore: { color: COLORS.text, fontSize: 32, fontWeight: '900' },
  best: { color: COLORS.gold, fontSize: 24 },
  coins: { color: COLORS.gold, fontSize: 20, fontWeight: '800' },
  buttons: { width: '100%', gap: 10, marginTop: 4 },
  rowButtons: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  flex: { flex: 1 },
  note: { color: COLORS.textDim, fontSize: 12, textAlign: 'center' },
});
