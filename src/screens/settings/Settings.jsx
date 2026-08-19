import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../game/constants';
import { POWERUP_META } from '../../game/powerups';
import { NeonButton, Panel } from '../../components/ui';
import { useProfile } from '../../context/ProfileContext';

export default function Settings({ navigate }) {
  const insets = useSafeAreaInsets();
  const { profile, toggleSfx, toggleMusic, reset } = useProfile();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <NeonButton title="‹ BACK" variant="ghost" size="sm" onPress={() => navigate('home')} />
        <Text style={styles.title}>SETTINGS</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <Panel style={styles.panel}>
          <Row label="Sound effects" value={profile.sfx} onChange={toggleSfx} />
          <Row label="Background music" value={profile.music} onChange={toggleMusic} />
        </Panel>

        <Panel style={styles.panel}>
          <Text style={styles.sectionTitle}>POWER-UPS</Text>
          {Object.entries(POWERUP_META).map(([type, meta]) => (
            <View key={type} style={styles.powerRow}>
              <View style={[styles.badge, { borderColor: meta.color }]}>
                <Text style={styles.badgeIcon}>{meta.icon}</Text>
              </View>
              <View style={styles.powerText}>
                <Text style={[styles.powerName, { color: meta.color }]}>{meta.label}</Text>
                <Text style={styles.powerHint}>{meta.hint}</Text>
              </View>
              <Text style={styles.duration}>
                {meta.duration ? `${meta.duration}s` : 'instant'}
              </Text>
            </View>
          ))}
        </Panel>

        <Panel style={styles.panel}>
          <Text style={styles.sectionTitle}>PROGRESS</Text>
          <Text style={styles.progressText}>
            Unlocked up to level {profile.unlockedLevel + 1} · {profile.coins} coins
          </Text>
          <NeonButton title="RESET PROGRESS" variant="danger" onPress={reset} />
        </Panel>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, onChange }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.panelAlt, true: COLORS.accent2 }}
        thumbColor={value ? COLORS.accent : COLORS.textDim}
      />
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
  title: { color: COLORS.text, fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  spacer: { width: 74 },

  scroll: { gap: 16 },
  panel: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { color: COLORS.text, fontSize: 15, fontWeight: '600' },

  sectionTitle: {
    color: COLORS.textDim,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '800',
  },
  powerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgAlt,
  },
  badgeIcon: { fontSize: 16 },
  powerText: { flex: 1 },
  powerName: { fontSize: 14, fontWeight: '800' },
  powerHint: { color: COLORS.textDim, fontSize: 12, marginTop: 1 },
  duration: { color: COLORS.textDim, fontSize: 12, fontWeight: '700' },

  progressText: { color: COLORS.textDim, fontSize: 13 },
});
