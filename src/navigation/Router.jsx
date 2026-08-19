/**
 * A four-screen game does not need a navigation library — one piece of state
 * and the Android back button is enough.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import { COLORS } from '../game/constants';
import Game from '../screens/game/Game';
import Home from '../screens/home/Home';
import Levels from '../screens/levels/Levels';
import Settings from '../screens/settings/Settings';

const SCREENS = { home: Home, levels: Levels, game: Game, settings: Settings };

export default function Router() {
  const [route, setRoute] = useState({ screen: 'home', params: null });

  const navigate = useCallback((screen, params = null) => {
    setRoute({ screen, params });
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.screen === 'home') {
        return false; // let Android close the app
      }
      navigate('home');
      return true;
    });
    return () => sub.remove();
  }, [route.screen, navigate]);

  const Screen = SCREENS[route.screen] ?? Home;

  return (
    <View style={styles.root}>
      {/* keyed so leaving and re-entering a screen starts it fresh */}
      <Screen
        key={`${route.screen}:${route.params?.levelIndex ?? ''}`}
        params={route.params}
        navigate={navigate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
});
