/**
 * Holds the persisted player profile and keeps the audio module in sync with
 * the sound settings.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  preloadSounds,
  setMusicEnabled,
  setSfxEnabled,
  startMusic,
} from '../audio/sound';
import {
  DEFAULT_PROFILE,
  loadProfile,
  resetProfile,
  saveProfile,
  withGameOver,
  withLevelResult,
} from '../storage/progress';
import { TOTAL_LEVELS } from '../game/levels';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    preloadSounds();
    loadProfile().then(loaded => {
      if (!mounted.current) {
        return;
      }
      setProfile(loaded);
      setSfxEnabled(loaded.sfx);
      setMusicEnabled(loaded.music);
      if (loaded.music) {
        startMusic();
      }
      setReady(true);
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  // Every mutation goes through here so persistence can never be forgotten.
  const update = useCallback(updater => {
    setProfile(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveProfile(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      profile,
      ready,

      completeLevel: ({ levelIndex, stars, score, coins }) =>
        update(prev =>
          withLevelResult(prev, {
            levelIndex,
            stars,
            score,
            coins,
            totalLevels: TOTAL_LEVELS,
          }),
        ),

      recordGameOver: score => update(prev => withGameOver(prev, score)),

      toggleSfx: () =>
        update(prev => {
          setSfxEnabled(!prev.sfx);
          return { ...prev, sfx: !prev.sfx };
        }),

      toggleMusic: () =>
        update(prev => {
          setMusicEnabled(!prev.music);
          return { ...prev, music: !prev.music };
        }),

      reset: () =>
        resetProfile().then(fresh => {
          setSfxEnabled(fresh.sfx);
          setMusicEnabled(fresh.music);
          setProfile(fresh);
        }),
    }),
    [profile, ready, update],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used inside a ProfileProvider');
  }
  return ctx;
}
