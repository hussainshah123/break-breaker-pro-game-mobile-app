# Brick Breaker Pro

Bounce the ball to destroy bricks, unlock new levels, and collect powerful boosters.

A complete React Native brick breaker: 15 hand-built levels, five power-ups,
particles, persistent progress and star ratings.

## Running it

```sh
npm start            # Metro
npm run android      # or: npm run ios   (run `pod install` in ios/ first)
npm test             # engine + screen tests
npm run lint
```

## How it is built

The game does **not** use a physics library. Matter.js and
`react-native-game-engine` are great for rigid-body simulations, but a brick
breaker needs exactly one moving circle against an axis-aligned grid — a
purpose-built solver is smaller, faster and gives precise control over the
arcade feel (paddle deflection angles, fire ball pass-through, anti-stall
guards). The whole engine is plain JavaScript with no React and no native
dependency, which is why it can be unit tested headlessly.

```
src/
├── game/                  the simulation — pure JS, no React
│   ├── constants.js       tuning: speeds, sizes, drop rates, palette
│   ├── levels.js          15 levels as ASCII grids + brick builder
│   ├── powerups.js        power-up catalogue and weighted random picker
│   └── engine.js          createWorld / stepWorld / launchBall / movePaddle
├── audio/sound.js         react-native-sound wrapper (missing file = silence)
├── storage/progress.js    AsyncStorage profile: unlocks, stars, coins, best
├── context/               profile provider, keeps audio settings in sync
├── navigation/Router.jsx  four screens, one state value, Android back button
├── components/ui.jsx      buttons, stars, panels
└── screens/
    ├── home/              title, stats, play / levels / settings
    ├── levels/            level select with locks and star ratings
    ├── settings/          audio toggles, power-up guide, reset progress
    └── game/              render loop, HUD, entities, overlays
```

### The loop

`Game.jsx` owns a `requestAnimationFrame` loop. Each frame it calls
`stepWorld(world, dt)`, plays any sounds the engine reported, and asks React to
repaint. The engine mutates one `world` object in place, so no allocation
happens per frame.

Two things keep it smooth:

- **Brick layer is memoised.** The engine bumps `world.brickVersion` whenever a
  brick changes, and `BrickLayer` re-renders only when that number moves. Every
  other frame diffs just the paddle, balls, power-ups and particles.
- **Entities are positioned with `transform`**, not `left`/`top`, so movement
  skips Yoga layout.

### Collision

`dt` is clamped and each frame is split into sub-steps small enough that the
ball never travels more than half its radius at a time — so it can't tunnel
through a brick even after a dropped frame. Movement is axis-separated (move X,
resolve, move Y, resolve), which gives correct corner behaviour on a grid.

The paddle uses classic arkanoid deflection: where you hit decides the outgoing
angle, up to 60°. A minimum vertical velocity is enforced so the ball can never
settle into a horizontal loop between the side walls.

### Power-ups

| Power-up | Effect | Duration |
|---|---|---|
| Paddle Grow | Paddle widens | 12s |
| Multi Ball | One ball becomes three | instant |
| Fire Ball | Ball burns through bricks without bouncing | 9s |
| Slow Motion | Simulation runs at 55% speed | 10s |
| Magnet Paddle | Ball is pulled toward the paddle centre | 11s |

Bricks drop one 22% of the time. Re-catching an active power-up refreshes its
timer rather than stacking.

### Brick types

`.` empty · `1`–`5` normal brick with that much HP · `S` steel (indestructible,
always bounces) · `X` explosive (takes out its neighbours, chains up to 4 deep).

Add a level by appending an 8-column grid to `LEVELS` in `src/game/levels.js` —
nothing else needs to change.

### Scoring

10 per hit, 50 per brick destroyed times a combo multiplier that grows every 4
bricks broken between paddle touches, 100 per power-up caught, and 250 per life
still held at the end of a level. Stars: 3 for a flawless clear, 2 if you lost
one ball, 1 otherwise.

## Sound

`react-native-sound` is wired up but the audio files are not included. Anything
missing simply plays nothing — a failed load is treated as a silent no-op, so
the game runs either way. Per the brief, no haptics are used anywhere.

To add audio, drop these mp3s into `android/app/src/main/res/raw/`:

```
hit.mp3  break.mp3  paddle.mp3  wall.mp3  steel.mp3  explosion.mp3
powerup.mp3  launch.mp3  life.mp3  win.mp3  lose.mp3  tap.mp3  bgm.mp3
```

Names must be **lowercase letters, digits and underscores only** — `res/raw` is
an Android resource directory and the build fails on anything else (an uppercase
or dashed filename will break `mergeDebugResources`).

For iOS, add the same files to the Xcode project under Build Phases → Copy
Bundle Resources. The filename list lives in `FILES` in
[src/audio/sound.js](src/audio/sound.js).

## Ads (AdMob)

Google Mobile Ads via `react-native-google-mobile-ads`, in two placements:

- **Banner** — anchored adaptive banner at the bottom of the Home screen
  ([AdBanner.jsx](src/components/AdBanner.jsx)).
- **Interstitial** — shown when the player taps RETRY after a game over. It is
  preloaded the moment the game-over overlay appears, so the tap does not wait
  on a network round trip.

Both fail soft: if the SDK never initialises or an ad never fills, the banner
renders nothing and the interstitial hands control straight back to the game.
Ads can never block play. All of it lives in [src/ads/ads.js](src/ads/ads.js).

### IDs

The AdMob **app ID** goes in [app.json](app.json) under the
`react-native-google-mobile-ads` key — the library's Gradle plugin and iOS build
script read it from there and inject it into the manifest / Info.plist. The
native SDK crashes at startup without it.

**Ad unit IDs** are in `AD_UNITS` in [src/ads/ads.js](src/ads/ads.js).

> AdMob ad units are **format-specific**: a unit created as a Banner cannot
> serve interstitials and vice versa. Only one unit ID was supplied, so it is
> currently set as the banner unit and the interstitial slot reuses it as a
> placeholder. Create a second unit of type *Interstitial* in the AdMob console
> and paste it into `AD_UNITS.interstitial`.

Debug builds use Google's official **test** unit IDs automatically (`__DEV__`).
Requesting live ads from a dev build counts as invalid traffic and can get the
account limited, so leave that as it is.

Interstitials are rate limited by `MIN_INTERSTITIAL_GAP_MS` (45s) — back-to-back
full-screen ads are both poor UX and an AdMob policy risk. Set it to 0 to show
one on literally every continue.

### Version pin

`react-native-google-mobile-ads` is pinned to **16.0.0** deliberately. From
16.1.0 it pulls `play-services-ads` 25.x, which ships Kotlin 2.3 metadata that
RN 0.86's Kotlin 2.1.20 compiler cannot read — the Android build fails in
`:react-native-google-mobile-ads:compileDebugKotlin`. 16.0.0 uses ads 24.6.0 and
builds cleanly. Do not bump it without also moving the project's Kotlin version.

## Tests

`__tests__/engine.test.js` drives the simulation headlessly frame by frame: ball
containment, constant speed, brick destruction, life loss, game over, each
power-up, and a full level clear using a scripted paddle.
`__tests__/Game.test.jsx` mounts the real play screen and pumps frames through
the render loop.
