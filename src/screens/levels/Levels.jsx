import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../game/constants';
import { LEVELS } from '../../game/levels';
import { NeonButton } from '../../components/ui';
import { playSound } from '../../audio/sound';
import { useProfile } from '../../context/ProfileContext';

export default function Levels({ navigate }) {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <NeonButton title="‹ BACK" variant="ghost" size="sm" onPress={() => navigate('home')} />
        <Text style={styles.title}>LEVELS</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {LEVELS.map((level, index) => {
          const locked = index > profile.unlockedLevel;
          const stars = profile.stars[index] ?? 0;
          return (
            <Pressable
              key={level.name}
              disabled={locked}
              onPress={() => {
                playSound('tap', 0.6);
                navigate('game', { levelIndex: index });
              }}
              style={({ pressed }) => [
                styles.tile,
                locked && styles.tileLocked,
                pressed && styles.tilePressed,
              ]}>
              <Text style={[styles.number, locked && styles.dim]}>
                {locked ? '🔒' : index + 1}
              </Text>
              <Text style={[styles.name, locked && styles.dim]} numberOfLines={1}>
                {locked ? 'LOCKED' : level.name}
              </Text>
              <Text style={styles.stars}>
                {locked ? ' ' : '★★★'.slice(0, stars).padEnd(3, '☆')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  spacer: { width: 74 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  tile: {
    width: 104,
    height: 104,
    borderRadius: 16,
    backgroundColor: COLORS.panel,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: 6,
  },
  tileLocked: { borderColor: COLORS.panelAlt, backgroundColor: COLORS.bgAlt },
  tilePressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  number: { color: COLORS.text, fontSize: 28, fontWeight: '900' },
  name: { color: COLORS.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  dim: { color: COLORS.textDim },
  stars: { color: COLORS.gold, fontSize: 13, letterSpacing: 2 },
});
