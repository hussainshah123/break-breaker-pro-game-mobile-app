/**
 * Small shared presentation pieces used across the menu screens.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../game/constants';
import { playSound } from '../audio/sound';

export function NeonButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
}) {
  const palette = VARIANTS[variant] ?? VARIANTS.primary;
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        playSound('tap', 0.6);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        size === 'lg' && styles.buttonLg,
        size === 'sm' && styles.buttonSm,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text
        style={[
          styles.buttonText,
          size === 'lg' && styles.buttonTextLg,
          size === 'sm' && styles.buttonTextSm,
          { color: palette.text },
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const VARIANTS = {
  primary: { bg: '#1B2A6B', border: COLORS.accent, text: COLORS.text },
  accent: { bg: COLORS.accent, border: '#9BE8FF', text: '#04121F' },
  ghost: { bg: 'transparent', border: COLORS.panelAlt, text: COLORS.textDim },
  danger: { bg: '#3A1230', border: COLORS.danger, text: COLORS.danger },
};

export function Stars({ count, size = 26, max = 3 }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: max }).map((_, i) => (
        <Text
          key={i}
          style={[
            styles.star,
            { fontSize: size, opacity: i < count ? 1 : 0.18 },
          ]}>
          ★
        </Text>
      ))}
    </View>
  );
}

export function StatBlock({ label, value, color = COLORS.text }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

export function Panel({ children, style }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

/** 12450 -> "12,450" (avoids relying on Intl being present in Hermes). */
export const formatScore = n =>
  String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLg: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 18 },
  buttonSm: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 10 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.35 },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  buttonTextLg: { fontSize: 20, letterSpacing: 2 },
  buttonTextSm: { fontSize: 13, letterSpacing: 1 },

  starRow: { flexDirection: 'row', gap: 8 },
  star: { color: COLORS.gold },

  stat: { alignItems: 'center', gap: 4 },
  statLabel: {
    color: COLORS.textDim,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  statValue: { fontSize: 26, fontWeight: '900', letterSpacing: 1 },

  panel: {
    backgroundColor: COLORS.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.panelAlt,
    padding: 20,
  },
});
