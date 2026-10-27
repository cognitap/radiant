# DEV-173–175: completed native motion stack

The stack builds on DEV-171/172 with one review branch per issue:
Button press/release → native disclosure/Dialog transitions → drag/release/snap.
The [public motion guide](../motion.md) defines supported interfaces, input,
property ownership and the deliberately bounded geometry/snapshot policies.
The full public workshop remains DEV-178 and general layout motion remains DEV-177.

## Verification

- 122 local runtime tests pass, including deterministic drag bounds, velocity
  freshness/projection, snap selection, cancellation, disabled-animation goals,
  malformed input and disposal. Existing form/composition/ref/state tests pass.
- 221 Chromium tests across 43 light/dark story/platform files pass. New cases
  exercise visible Button re-press momentum, actual touch submit/cancel, native
  form/keyboard/disabled/pending/render/ref behavior, caller cancellation/style,
  disclosure reversal/content resizing, Accordion, native modal/focus/cancel,
  inert visual exit/reopen, release velocity/re-grab, real mouse/touch drag,
  perpendicular native touch scrolling, keyboard controls and live reduced motion.
- The exact packed archive passes all 45 installed-consumer cases and both
  NodeNext/Bundler declaration checks. Root imports stay engine-free, static Link
  stays server-renderable, and runtime/native/drag public subpaths load on the
  server without browser setup. Compiled CSS is self-contained, with no Tailwind
  requirement for ordinary consumers.
- Generated themes, formatting/lint, source/contracts/build types and the
  Storybook production build pass. Canonical System/Motion stories provide native
  Button, transition and drag/snap proofs with native keyboard alternatives.

No native click/submit/navigation or semantic Dialog close is synthesized or
postponed. The combined gate caught and fixed React cancellation being lost when
passing a non-cancelable native event to the adapter. That fix belongs to DEV-173.
Dialog copies strip inline event attributes and capture native pre-close geometry;
those integration hardening changes belong to DEV-174.

## Installed production bundle evidence

esbuild 0.25.12, minified browser ESM from the actual unreleased archive. Every entry
includes the same installed Button and React DOM; CSS is excluded. Gzip deltas
compare whole bundles, not independently downloaded package sizes.

| Entry                          | Minified bytes | Gzip bytes | Extra gzip |
| ------------------------------ | -------------: | ---------: | ---------: |
| Root Button + React DOM        |        316,295 |     92,164 |          0 |
| Numeric spring                 |        329,693 |     97,399 |      5,235 |
| Layout numeric foundation      |        330,854 |     97,766 |      5,602 |
| Scalar React binding           |        332,339 |     98,251 |      6,087 |
| Native MotionProvider          |        336,148 |     99,607 |      7,443 |
| React drag binding             |        336,712 |     99,793 |      7,629 |
| Numeric drag + browser binding |        335,078 |     99,213 |      7,049 |

The root bridge adds 1,045 gzip bytes over DEV-172's root baseline. It adds no
Motion engine. Metafile checks find no emitted projection module in any entry.
All interpolation uses the accepted upstream physics; Radiant owns native input,
snap policy, bounds, measurement and lifecycle. No heavier Motion React gesture
engine, new dependency, lazy first-input download or website-only solver is added.

This is automated Chromium, package and server evidence. It does not claim manual
assistive-technology or cross-browser certification, arbitrary geometry, media or
custom-element snapshot fidelity, or a completed motion workshop release.
