/**
 * Google Mobile Ads (AdMob) integration.
 *
 * Two placements:
 *   - a banner pinned to the bottom of the Home screen
 *   - an interstitial shown when the player continues after a game over
 *
 * Everything here fails soft: if the SDK never initialises or an ad never
 * fills, the banner renders nothing and the interstitial hands control
 * straight back to the game. Ads must never be able to block play.
 */

import mobileAds, {
  AdEventType,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';

/**
 * Live ad unit IDs.
 *
 * IMPORTANT: AdMob ad units are format-specific — a unit created as a Banner
 * cannot serve interstitials, and vice versa. Only one unit ID was supplied,
 * so it is used for the banner below. Create a second unit of type
 * "Interstitial" in the AdMob console and paste it into `interstitial`.
 */
const AD_UNITS = {
  banner: 'ca-app-pub-9318693466829633/6216977418',
  interstitial: 'ca-app-pub-9318693466829633/6216977418', // TODO: replace with a real Interstitial unit ID
};

// Google's test units are mandatory during development: requesting live ads
// from a dev build counts as invalid traffic and can get the account limited.
export const BANNER_UNIT_ID = __DEV__ ? TestIds.BANNER : AD_UNITS.banner;
export const INTERSTITIAL_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : AD_UNITS.interstitial;

/**
 * Back-to-back interstitials are both bad UX and an AdMob policy risk, so a
 * retry within this window of the last ad just restarts the level. Set to 0 to
 * show one on literally every continue.
 */
const MIN_INTERSTITIAL_GAP_MS = 45_000;

const REQUEST_OPTIONS = { requestNonPersonalizedAdsOnly: false };

let initialized = false;
let lastShownAt = 0;
let pending = null; // the interstitial currently loaded or loading

export function initializeAds() {
  if (initialized) {
    return;
  }
  initialized = true;
  mobileAds()
    .initialize()
    .then(() => preloadInterstitial())
    .catch(() => {
      // No SDK, no ads — the game carries on regardless.
    });
}

function disposeEntry(entry) {
  entry.unsubscribe.forEach(fn => {
    try {
      fn();
    } catch (e) {
      // listener already detached
    }
  });
  entry.unsubscribe = [];
}

/** Runs the entry's completion callback exactly once, then rearms. */
function finish(entry) {
  const done = entry.onClosed;
  entry.onClosed = null;
  entry.spent = true;
  disposeEntry(entry);
  if (pending === entry) {
    pending = null;
  }
  if (done) {
    done();
  }
  // An interstitial instance is single use, so line up the next one.
  preloadInterstitial();
}

/**
 * Starts loading an interstitial so it is ready the moment the player taps
 * RETRY. Safe to call repeatedly.
 */
export function preloadInterstitial() {
  if (pending && !pending.spent) {
    return;
  }
  let ad;
  try {
    ad = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, REQUEST_OPTIONS);
  } catch (e) {
    pending = null;
    return;
  }

  const entry = { ad, ready: false, spent: false, onClosed: null, unsubscribe: [] };
  entry.unsubscribe = [
    ad.addAdEventListener(AdEventType.LOADED, () => {
      entry.ready = true;
    }),
    ad.addAdEventListener(AdEventType.CLOSED, () => finish(entry)),
    ad.addAdEventListener(AdEventType.ERROR, () => {
      entry.ready = false;
      finish(entry);
    }),
  ];
  pending = entry;

  try {
    ad.load();
  } catch (e) {
    finish(entry);
  }
}

/**
 * Shows an interstitial if one is loaded and the cooldown has elapsed, then
 * invokes `onDone`. If there is no ad to show, `onDone` runs immediately — the
 * caller can treat this as "carry on" either way.
 */
export function showInterstitialThen(onDone) {
  let called = false;
  const done = () => {
    if (!called) {
      called = true;
      onDone?.();
    }
  };

  const entry = pending;
  const cooledDown = Date.now() - lastShownAt >= MIN_INTERSTITIAL_GAP_MS;

  if (!initialized || !entry || !entry.ready || entry.spent || !cooledDown) {
    preloadInterstitial(); // make sure one is warming up for next time
    done();
    return;
  }

  entry.onClosed = done;
  lastShownAt = Date.now();

  try {
    const result = entry.ad.show();
    if (result && typeof result.catch === 'function') {
      result.catch(() => finish(entry));
    }
  } catch (e) {
    finish(entry);
  }
}
