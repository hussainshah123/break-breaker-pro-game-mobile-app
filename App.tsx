/**
 * Brick Breaker Pro
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializeAds } from './src/ads/ads';
import { ProfileProvider } from './src/context/ProfileContext';
import Router from './src/navigation/Router';

function App() {
  useEffect(() => {
    initializeAds();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#070B1A" />
      <ProfileProvider>
        <Router />
      </ProfileProvider>
    </SafeAreaProvider>
  );
}

export default App;
