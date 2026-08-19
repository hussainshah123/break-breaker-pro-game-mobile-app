/**
 * Mounts the real play screen, gives it a field size and pumps a few animation
 * frames, so a crash in the render loop shows up here rather than on a device.
 */

/* eslint-env jest */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Game from '../src/screens/game/Game';
import { ProfileProvider } from '../src/context/ProfileContext';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

function findByProp(tree, prop) {
  return tree.root.findAll(node => typeof node.props?.[prop] === 'function');
}

test('the game screen mounts, lays out and runs frames', async () => {
  const frameCallbacks = [];
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(cb => {
    frameCallbacks.push(cb);
    return frameCallbacks.length;
  });

  let tree;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <ProfileProvider>
          <Game params={{ levelIndex: 0 }} navigate={() => {}} />
        </ProfileProvider>
      </SafeAreaProvider>,
    );
  });

  // Feed the field a size, which is what triggers world creation.
  const field = findByProp(tree, 'onLayout')[0];
  await ReactTestRenderer.act(() => {
    field.props.onLayout({ nativeEvent: { layout: { width: 390, height: 700 } } });
  });

  // Pump a handful of frames through the loop.
  await ReactTestRenderer.act(() => {
    for (let i = 1; i <= 10; i++) {
      const cb = frameCallbacks.shift();
      cb?.(i * 16.7);
    }
  });

  expect(tree.toJSON()).toBeTruthy();

  global.requestAnimationFrame.mockRestore();
});
