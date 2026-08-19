/**
 * Test-only stubs for the two native modules the game depends on.
 */

/* eslint-env jest */

jest.mock('react-native-sound', () => {
  class SoundMock {
    constructor(_file, _basePath, onLoad) {
      if (onLoad) {
        onLoad(null);
      }
    }
    play(cb) {
      cb?.(true);
      return this;
    }
    stop(cb) {
      cb?.();
      return this;
    }
    pause() {
      return this;
    }
    setVolume() {
      return this;
    }
    setNumberOfLoops() {
      return this;
    }
  }
  SoundMock.MAIN_BUNDLE = 'main';
  SoundMock.setCategory = jest.fn();
  return SoundMock;
});

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    getItem: jest.fn(key => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn(key => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');

  const makeInterstitial = () => ({
    addAdEventListener: jest.fn(() => jest.fn()),
    load: jest.fn(),
    show: jest.fn(() => Promise.resolve()),
  });

  return {
    __esModule: true,
    default: () => ({ initialize: () => Promise.resolve([]) }),
    MobileAds: () => ({ initialize: () => Promise.resolve([]) }),
    TestIds: {
      BANNER: 'test-banner',
      INTERSTITIAL: 'test-interstitial',
    },
    AdEventType: {
      LOADED: 'loaded',
      ERROR: 'error',
      OPENED: 'opened',
      CLOSED: 'closed',
      CLICKED: 'clicked',
      PAID: 'paid',
    },
    BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
    InterstitialAd: { createForAdRequest: jest.fn(makeInterstitial) },
    BannerAd: props => React.createElement('BannerAd', props),
  };
});
