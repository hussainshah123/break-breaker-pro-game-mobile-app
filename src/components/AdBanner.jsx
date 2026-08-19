/**
 * Anchored adaptive banner. Collapses to nothing if the ad fails to load, so a
 * blank strip never sits in the layout.
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { BANNER_UNIT_ID } from '../ads/ads';

export default function AdBanner({ style }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <View style={[styles.wrap, style]}>
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
