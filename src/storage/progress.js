/**
 * Persisted player profile: unlocked levels, per-level stars, coins, best score
 * and audio settings. Reads are cached in memory; writes are fire-and-forget.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@brickbreakerpro/profile/v1';

export const DEFAULT_PROFILE = {
  unlockedLevel: 0, // highest level index the player may enter
  stars: {}, // { [levelIndex]: 1 | 2 | 3 }
  bestScores: {}, // { [levelIndex]: number }
  coins: 0,
  bestScore: 0,
  sfx: true,
  music: true,
};

export async function loadProfile() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return { ...DEFAULT_PROFILE };
    }
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_PROFILE };
  }
}

export async function saveProfile(profile) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(profile));
  } catch (e) {
    // Storage failures are not worth interrupting play over.
  }
}

export async function resetProfile() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    // ignore
  }
  return { ...DEFAULT_PROFILE };
}

/** Merges one finished level into the profile and returns the new profile. */
export function withLevelResult(profile, { levelIndex, stars, score, coins, totalLevels }) {
  const prevStars = profile.stars[levelIndex] ?? 0;
  const prevBest = profile.bestScores[levelIndex] ?? 0;
  const nextUnlocked = Math.min(
    totalLevels - 1,
    Math.max(profile.unlockedLevel, levelIndex + 1),
  );

  return {
    ...profile,
    unlockedLevel: nextUnlocked,
    stars: { ...profile.stars, [levelIndex]: Math.max(prevStars, stars) },
    bestScores: { ...profile.bestScores, [levelIndex]: Math.max(prevBest, score) },
    coins: profile.coins + coins,
    bestScore: Math.max(profile.bestScore, score),
  };
}

export function withGameOver(profile, score) {
  return { ...profile, bestScore: Math.max(profile.bestScore, score) };
}
