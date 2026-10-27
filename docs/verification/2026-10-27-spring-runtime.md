# DEV-172: theme-driven spring runtime

Implements the [accepted DEV-171 boundary](../adr/0001-spring-engine-boundaries.md)
with Motion 14.7.1. Public interfaces and migration are in the
[motion runtime contract](../motion.md). This is an unreleased candidate, not a
replacement for npm 0.0.5 or evidence that DEV-170 is complete.

## Implementation and limits

- The root entry exposes serializable profile configuration/types only. Numeric
  controllers and style bindings are opt-in at `/motion`; lifecycle hooks are at
  `/motion/react`. Motion React projection is absent from emitted bundles.
- Profiles resolve a restrained 320/30/1 spring and per-interaction overrides.
  ThemeScope inheritance/reset, theme document compilation and selective motion
  section export retain the policy independently of legacy CSS durations.
- Persistent upstream followers retain momentum on retarget. Physics changes are
  deferred until rest; turning motion off or enabling reduced motion cancels and
  snaps immediately. Re-enabling does not replay an old gesture.
- React hooks own preference subscriptions, effects and disposal. They reserve
  individual style properties on real native hosts and retain caller transforms.
  No per-frame React state updates or wrapper/event interception is introduced.
- Layout foundations retain x/y/width/height springs in one measured local pixel
  space. Production measurement/projection, nested geometry, scrolling and general
  resize/reorder host integration remain DEV-177. Button and disclosure/Dialog
  integration, gesture policies and the workshop remain their subsequent issues.

## Verification

Source generation/format/lint and both source/contract type checks pass. All 120
local runtime tests pass. The packed package passes 45 installed-consumer cases
and NodeNext/Bundler TypeScript contracts, including the public motion subpaths,
server imports, no Tailwind dependency and an engine-free root import.

Focused Chromium checks prove numeric/layout target reversal with continued
momentum, parameter changes during flight, immediate off, native replacement
render/ref/keyboard, no React frame commits, live system preference changes,
StrictMode replay/disposal, host replacement, and SSR hydration without mismatch.
The Storybook production build includes the canonical System/Motion binding.
The routine Radiant light/dark story and browser-platform gate passes all 204
tests across 40 files.

This is automated Chromium and server/package evidence. Manual assistive
technology, other browser engines and broad production layout geometry are not
claimed here. DEV-174 still owns proof of native Dialog visual exit.

## Installed bundle cost

The actual candidate archive was installed into an isolated consumer. esbuild
0.25.12, production browser ESM, minified; React DOM and one actual installed
Radiant Button are identical in every entry. CSS is excluded. Deltas compare
whole-bundle gzip, not separate CDN package sizes.

| Entry                         | Minified bytes | Gzip bytes | Extra gzip |
| ----------------------------- | -------------: | ---------: | ---------: |
| Root Button + React DOM       |        313,193 |     91,119 |          0 |
| Numeric `createSpring`        |        327,582 |     96,708 |      5,589 |
| Per-axis `createLayoutSpring` |        328,743 |     97,085 |      5,966 |
| React `useSpringStyle`        |        330,131 |     97,498 |      6,379 |

The numeric adapter adds 796 gzip bytes beyond DEV-171's 4,793-byte upstream
numeric proof. The root Button baseline remains byte-identical. Metafile checks
find no emitted Motion projection in any entry and no emitted engine in the root
baseline. There is no lazy engine download or first-input initialization race;
consumer route imports can supply chunk boundaries. No rich drag engine is added
to the runtime entry. Motion's dependency archive includes upstream React modules,
but those are tree-shaken from these emitted browser entries.

Measurements are local and describe these exact entry shapes; they are not a
portable frame-rate or future stable package-size guarantee.
