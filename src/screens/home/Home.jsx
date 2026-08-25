import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../game/constants';
import { TOTAL_LEVELS } from '../../game/levels';
import AdBanner from '../../components/AdBanner';
import { NeonButton, formatScore } from '../../components/ui';
import { useProfile } from '../../context/ProfileContext';

export default function Home({ navigate }) {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  const starsCollected = Object.values(profile.stars).reduce((a, b) => a + b, 0);
  const continueLevel = profile.unlockedLevel;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <Text style={styles.kicker}>BRICK</Text>
        <Text style={styles.title}>BREAKER</Text>
        <Text style={styles.pro}>P R O</Text>
        <Text style={styles.tagline}>
          Bounce the ball, smash the bricks, collect boosters.
        </Text>
      </View>

      <View style={styles.bricksArt}>
        {['#4CC9F0', '#4895EF', '#7B61FF', '#F72585'].map((c, row) => (
          <View key={c} style={styles.artRow}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.artBrick,
                  { backgroundColor: c, opacity: 1 - row * 0.15 },
                ]}
              />
            ))}
          </View>
        ))}
        <View style={styles.artBall} />
        <View style={styles.artPaddle} />
      </View>

      <View style={styles.stats}>
        <Stat label="BEST" value={formatScore(profile.bestScore)} color={COLORS.gold} />
        <Stat label="COINS" value={`🪙 ${formatScore(profile.coins)}`} />
        <Stat
          label="STARS"
          value={`★ ${starsCollected}/${TOTAL_LEVELS * 3}`}
          color={COLORS.gold}
        />
      </View>

      <View style={styles.actions}>
        <NeonButton
          title={continueLevel > 0 ? `CONTINUE · LEVEL ${continueLevel + 1}` : 'PLAY'}
          variant="accent"
          size="lg"
          onPress={() => navigate('game', { levelIndex: continueLevel })}
        />
        <NeonButton title="LEVELS" onPress={() => navigate('levels')} />
        <NeonButton title="SETTINGS" variant="ghost" onPress={() => navigate('settings')} />
      </View>

      {/* <AdBanner style={styles.banner} /> */}
    </View>
  );
}

function Stat({ label, value, color = COLORS.text }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 26,
    justifyContent: 'space-between',
  },
  header: { alignItems: 'center' },
  kicker: {
    color: COLORS.textDim,
    fontSize: 18,
    letterSpacing: 10,
    fontWeight: '800',
  },
  title: {
    color: COLORS.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 4,
  },
  pro: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 8,
    marginTop: 2,
  },
  tagline: {
    color: COLORS.textDim,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 19,
  },

  bricksArt: { alignItems: 'center', gap: 5, paddingVertical: 6 },
  artRow: { flexDirection: 'row', gap: 5 },
  artBrick: { width: 40, height: 15, borderRadius: 3 },
  artBall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.ball,
    marginTop: 14,
  },
  artPaddle: {
    width: 80,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
    marginTop: 10,
  },

  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 4 },
  statLabel: {
    color: COLORS.textDim,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  statValue: { fontSize: 17, fontWeight: '900' },

  actions: { gap: 12 },
  banner: { marginTop: 16 },
});
