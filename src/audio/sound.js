/**
 * Thin wrapper over react-native-sound.
 *
 * Every call is defensive: if an audio file is missing from the bundle the
 * load simply fails and playback becomes a no-op, so the game never crashes
 * over a missing asset. Drop the files listed in FILES into:
 *
 *   Android  android/app/src/main/res/raw/     (lowercase, no dashes)
 *   iOS      add to the Xcode project so they land in the app bundle
 */

import Sound from 'react-native-sound';

Sound.setCategory('Ambient', true);

const FILES = {
  hit: 'hit.mp3',
  break: 'break.mp3',
  paddle: 'paddle.mp3',
  wall: 'wall.mp3',
  steel: 'steel.mp3',
  explosion: 'explosion.mp3',
  powerup: 'powerup.mp3',
  launch: 'launch.mp3',
  life: 'life.mp3',
  win: 'win.mp3',
  lose: 'lose.mp3',
  tap: 'tap.mp3',
};

// A few sounds fire in quick succession, so each key gets a small voice pool.
const POOL_SIZE = 3;
const pools = {};
const cursors = {};

let sfxEnabled = true;
let musicEnabled = true;
let music = null;

function loadPool(key) {
  const file = FILES[key];
  if (!file) {
    return null;
  }
  const voices = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    // The load callback can fire synchronously, so it must only touch a
    // holder that already exists — never the `new Sound(...)` result itself.
    const entry = { sound: null, failed: false };
    entry.sound = new Sound(file, Sound.MAIN_BUNDLE, error => {
      entry.failed = Boolean(error);
    });
    voices.push(entry);
  }
  pools[key] = voices;
  cursors[key] = 0;
  return voices;
}

/** Warms up every effect so the first hit is not delayed by a disk read. */
export function preloadSounds() {
  Object.keys(FILES).forEach(key => {
    if (!pools[key]) {
      loadPool(key);
    }
  });
}

export function playSound(key, volume = 1) {
  if (!sfxEnabled) {
    return;
  }
  const voices = pools[key] || loadPool(key);
  if (!voices) {
    return;
  }
  const entry = voices[cursors[key] % voices.length];
  cursors[key] = (cursors[key] + 1) % voices.length;
  if (!entry || entry.failed || !entry.sound) {
    return;
  }
  entry.sound.setVolume(volume);
  entry.sound.stop(() => entry.sound.play());
}

function playLoop(sound) {
  sound.setNumberOfLoops(-1);
  sound.setVolume(0.35);
  sound.play();
}

export function startMusic() {
  if (!musicEnabled) {
    return;
  }
  if (music) {
    if (music.sound && !music.failed) {
      music.sound.play();
    }
    return;
  }

  // Same synchronous-callback caveat as loadPool: the callback may run before
  // `entry.sound` is assigned, so starting playback is handled in both places.
  const entry = { sound: null, failed: false, ready: false };
  entry.sound = new Sound('bgm.mp3', Sound.MAIN_BUNDLE, error => {
    entry.failed = Boolean(error);
    entry.ready = !error;
    if (entry.ready && entry.sound && musicEnabled) {
      playLoop(entry.sound); // async load: the handle already exists
    }
  });
  music = entry;

  if (entry.ready && entry.sound && musicEnabled) {
    playLoop(entry.sound); // sync load: start now that the handle exists
  }
}

export function stopMusic() {
  if (music?.sound) {
    music.sound.pause();
  }
}

export function setSfxEnabled(enabled) {
  sfxEnabled = enabled;
}

export function setMusicEnabled(enabled) {
  musicEnabled = enabled;
  if (enabled) {
    startMusic();
  } else {
    stopMusic();
  }
}

/** Maps an engine event to its sound effect. */
export function playForEvent(event) {
  switch (event.type) {
    case 'brickHit':
      return playSound('hit', 0.6);
    case 'brickBreak':
      return playSound('break', 0.8);
    case 'explosion':
      return playSound('explosion', 0.9);
    case 'steel':
      return playSound('steel', 0.5);
    case 'paddle':
      return playSound('paddle', 0.7);
    case 'wall':
      return playSound('wall', 0.35);
    case 'powerup':
      return playSound('powerup');
    case 'lifeLost':
      return playSound('life');
    case 'levelClear':
      return playSound('win');
    case 'gameOver':
      return playSound('lose');
    default:
      return undefined;
  }
}
