/**
 * The play screen. Owns the render loop, feeds finger input to the engine and
 * decides when a run is finished.
 *
 * The engine mutates one `world` object in place; this component just asks
 * React to repaint after every step, keeping the brick layer memoised so only
 * the handful of moving entities are diffed each frame.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, GAME_STATE, START_LIVES } from '../../game/constants';
import {
  coinsFor,
  createWorld,
  launchBall,
  movePaddle,
  starsFor,
  stepWorld,
} from '../../game/engine';
import { TOTAL_LEVELS, levelName } from '../../game/levels';
import { POWERUP } from '../../game/powerups';
import { preloadInterstitial, showInterstitialThen } from '../../ads/ads';
import { playForEvent, playSound } from '../../audio/sound';
import { useProfile } from '../../context/ProfileContext';
import BrickLayer from './components/BrickLayer';
import HUD from './components/HUD';
import { Balls, Paddle, Particles, PowerUps } from './components/Entities';
import {
  GameOverOverlay,
  LevelClearOverlay,
  PauseOverlay,
} from './components/Overlays';

export default function Game({ params, navigate }) {
  const insets = useSafeAreaInsets();
  const { profile, completeLevel, recordGameOver } = useProfile();

  const [levelIndex, setLevelIndex] = useState(params?.levelIndex ?? 0);
  const [field, setField] = useState(null);
  const [world, setWorld] = useState(null);
  const [overlay, setOverlay] = useState(null); // 'pause' | 'clear' | 'over'
  const [result, setResult] = useState(null);
  const [, setFrame] = useState(0);

  // Score accumulated in earlier levels of this run, re-applied on restart.
  const carriedScore = useRef(0);
  const fieldOffsetX = useRef(0);
  const fieldRef = useRef(null);
  const settledRef = useRef(false); // guards against double-counting a result

  // ------------------------------------------------------------- world setup
  const startLevel = useCallback(
    (index, { carry, lives }) => {
      if (!field) {
        return;
      }
      const next = createWorld({
        width: field.width,
        height: field.height,
        levelIndex: index,
        lives,
      });
      next.score = carry;
      carriedScore.current = carry;
      settledRef.current = false;
      setResult(null);
      setOverlay(null);
      setLevelIndex(index);
      setWorld(next);
    },
    [field],
  );

  useEffect(() => {
    if (field && !world) {
      startLevel(params?.levelIndex ?? 0, { carry: 0, lives: START_LIVES });
    }
  }, [field, world, params, startLevel]);

  // ------------------------------------------------------------- render loop
  const paused = overlay !== null;

  useEffect(() => {
    if (!world || paused) {
      return undefined;
    }
    let raf = 0;
    let last = 0;

    const tick = timestamp => {
      raf = requestAnimationFrame(tick);
      if (!last) {
        last = timestamp;
        return;
      }
      const dt = (timestamp - last) / 1000;
      last = timestamp;

      const events = stepWorld(world, dt);
      for (let i = 0; i < events.length; i++) {
        playForEvent(events[i]);
      }

      if (world.state === GAME_STATE.LEVEL_CLEAR) {
        settleLevelClear(world);
      } else if (world.state === GAME_STATE.GAME_OVER) {
        settleGameOver(world);
      }

      setFrame(f => (f + 1) % 1000000);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, paused]);

  // Auto-pause when the app leaves the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        setOverlay(current => (current === null ? 'pause' : current));
      }
    });
    return () => sub.remove();
  }, []);

  // ------------------------------------------------------------- outcomes
  function settleLevelClear(w) {
    if (settledRef.current) {
      return;
    }
    settledRef.current = true;
    const stars = starsFor(w);
    const coins = coinsFor(w, stars);
    completeLevel({ levelIndex: w.levelIndex, stars, score: w.score, coins });
    setResult({ stars, coins, score: w.score });
    setOverlay('clear');
  }

  function settleGameOver(w) {
    if (settledRef.current) {
      return;
    }
    settledRef.current = true;
    recordGameOver(w.score);
    setResult({ stars: 0, coins: w.coins, score: w.score });
    setOverlay('over');
    // Warm one up now so RETRY does not sit waiting on a network round trip.
    preloadInterstitial();
  }

  // ------------------------------------------------------------- input
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: evt => {
          const w = world;
          if (w) {
            movePaddle(w, evt.nativeEvent.pageX - fieldOffsetX.current);
          }
        },
        onPanResponderMove: (evt, gesture) => {
          const w = world;
          if (w) {
            movePaddle(w, gesture.moveX - fieldOffsetX.current);
          }
        },
        onPanResponderRelease: () => {
          const w = world;
          if (w && launchBall(w)) {
            playSound('launch', 0.7);
          }
        },
      }),
    [world],
  );

  const onFieldLayout = useCallback(event => {
    const { width, height } = event.nativeEvent.layout;
    setField(prev =>
      prev && prev.width === width && prev.height === height
        ? prev
        : { width, height },
    );
    fieldRef.current?.measureInWindow(x => {
      fieldOffsetX.current = x;
    });
  }, []);

  // ------------------------------------------------------------- actions
  const isLastLevel = levelIndex >= TOTAL_LEVELS - 1;

  const handleNext = () => {
    if (isLastLevel) {
      navigate('levels');
      return;
    }
    startLevel(levelIndex + 1, {
      carry: world.score,
      lives: Math.max(1, world.lives),
    });
  };

  const handleReplay = () =>
    startLevel(levelIndex, { carry: carriedScore.current, lives: START_LIVES });

  // Continuing after a game over is the interstitial slot. If no ad is ready
  // the callback fires immediately, so the retry is never held up.
  const handleRetry = () =>
    showInterstitialThen(() =>
      startLevel(levelIndex, { carry: 0, lives: START_LIVES }),
    );

  // ------------------------------------------------------------- render
  const showLaunchHint = world?.state === GAME_STATE.READY && !paused;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <HUD
        score={world?.score ?? 0}
        level={levelIndex + 1}
        levelName={levelName(levelIndex)}
        lives={world?.lives ?? START_LIVES}
        effects={world?.effects ?? {}}
        onPause={() => setOverlay('pause')}
      />

      <View
        ref={fieldRef}
        onLayout={onFieldLayout}
        style={[styles.field, { marginBottom: insets.bottom }]}
        {...panResponder.panHandlers}>
        <View style={styles.grid} pointerEvents="none" />

        {world ? (
          <>
            <BrickLayer bricks={world.bricks} version={world.brickVersion} />
            <Particles particles={world.particles} />
            <PowerUps powerups={world.powerups} />
            <Paddle
              paddle={world.paddle}
              magnet={world.effects[POWERUP.MAGNET] > 0}
              grow={world.effects[POWERUP.GROW] > 0}
            />
            <Balls balls={world.balls} fire={world.effects[POWERUP.FIRE] > 0} />
          </>
        ) : null}

        {showLaunchHint ? (
          <View style={styles.hint} pointerEvents="none">
            <Text style={styles.hintText}>DRAG TO AIM · RELEASE TO LAUNCH</Text>
          </View>
        ) : null}

        {overlay === 'pause' ? (
          <PauseOverlay
            onResume={() => setOverlay(null)}
            onRestart={handleReplay}
            onHome={() => navigate('home')}
          />
        ) : null}

        {overlay === 'clear' && result ? (
          <LevelClearOverlay
            stars={result.stars}
            score={result.score}
            coins={result.coins}
            isLastLevel={isLastLevel}
            onReplay={handleReplay}
            onNext={handleNext}
          />
        ) : null}

        {overlay === 'over' && result ? (
          <GameOverOverlay
            score={result.score}
            best={profile.bestScore}
            onRetry={handleRetry}
            onHome={() => navigate('home')}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  field: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: COLORS.bgAlt,
    borderTopWidth: 1,
    borderTopColor: COLORS.panelAlt,
  },
  grid: {
    ...StyleSheet.absoluteFill,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderColor: 'rgba(124,97,255,0.10)',
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 26,
    alignItems: 'center',
  },
  hintText: {
    color: COLORS.textDim,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
});
