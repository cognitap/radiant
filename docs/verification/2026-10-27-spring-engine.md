# DEV-171: installed spring engine suitability proof

The accepted approach is Motion 14.7.1 with a Radiant-owned layout adapter.
The owner accepted [its integration boundaries](../adr/0001-spring-engine-boundaries.md).
DEV-170 is the chapter rollup. DEV-172 through DEV-180 remain downstream work.
No spring runtime or dependency is added to the production package here.

## Run and inspect

Using Node 26 or newer, run:

```sh
node scripts/prove-motion-engine.mjs --require-suitable
node scripts/prove-motion-engine.mjs --serve
```

The first command installs a locked, script-disabled isolated consumer, checks
server import/render, builds/measures the browser entries, runs the focused
Chromium proof and saves results under ignored `output/browser/motion-engine/`.
It cleans up the consumer. The second keeps that fixture available at
`http://127.0.0.1:3011`; Ctrl-C removes it. Neither command publishes or waits on
GitHub. It requires the existing Playwright browser installation used by this
repository; it does not silently download another browser.

`tests/motion-engine/` uses the actual npm Radiant 0.0.5 Button, native
Collapsible/details and Dialog. Motion 14.7.1 and React Spring 10.1.2 are exact
locked candidates, not aliases into Radiant source. The fixture is a compatibility
study with visible values/velocities, not a proposed public motion API or finished
workshop editor. Its 0.9 press scale deliberately makes interruption easy to see;
production restrained defaults are not decided here.

## Recorded behavior

Fourteen recorded cases cover both engines' scalar retargeting, real Button
Space/Enter/form submission, caller transforms, disabled/pending/cancelled input,
native disclosure reversal and content changes, reactive values, runtime work,
drag/snap/keyboard, layout resize/reorder, native Dialog lifecycle, explicit off,
live reduced-motion, actual Chromium touch input/cancellation and cleanup.

The numeric interruption case reverses a target while moving forwards, checks
bounded subframe position change and observes continued forward travel before
returning. It distinguishes retained momentum from restarting a spring at rest.
Motion's generic stop path refreshes its sampled position and frame-estimated
velocity; comparing two immediate `getVelocity()` readings as exact derivatives
would be misleading. The chosen `springValue` path steers its active follower
with analytical velocity; the proof judges the resulting trajectory.

The disclosure changes native open state normally and clips an inert/ARIA-hidden
closed panel while its visual height finishes. Scoped research CSS replaces the
existing pseudo-element height transition; this is an adapter requirement, not
a claim that adding an animation dependency alone upgrades current components.
Native toggle/close effects are observed after their queued events settle.

Dialog proves spring entry and immediate native dismissal, cancelled Escape,
top-layer/modal behavior, unchanged host/ref and caller transform, cancellation
and focus return. It does not prove full visible spring exit or retain a closed
dialog in the top layer. That remains gated in DEV-174.

Layout uses real natural-flow slots and dedicated absolute motion parts. Radiant
measures local pixel bounds and retains four upstream spring values across
retargets. The browser reverses a moving reorder and a width change, observing
continued travel in the old direction before return: position continuity alone
would not pass. Motion projection itself resets velocity and is excluded from
this path.
Caller transforms remain on inner native buttons. The proof does not establish
arbitrary same-host transform composition, every list/grid/table geometry,
fixed-position descendants or window-resize animation.

Motion's [versioned reduced-motion hook](https://unpkg.com/framer-motion@14.7.1/dist/es/utils/reduced-motion/use-reduced-motion.mjs)
reads initial state without a live React subscription. The fixture therefore owns a `matchMedia` change subscription and
explicitly stops/snaps raw spring values. Off/reduced settings suppress Button
transforms and snap spatial values. Production bindings must also verify changes
during every drag/layout/native lifecycle before release.

## Installed bundle/runtime evidence

Production browser ESM, esbuild 0.25.12, minified. Each entry includes the same
React DOM and one actual installed Radiant Button. CSS is identical and excluded.
Gzip delta is the difference between complete bundles, not an additive CDN size.

| Entry                                    | Minified bytes | Gzip bytes | Extra gzip vs same host |
| ---------------------------------------- | -------------: | ---------: | ----------------------: |
| Baseline Button + React DOM              |        313,193 |     91,119 |                       0 |
| Motion numeric `springValue`             |        325,382 |     95,912 |                   4,793 |
| Motion generic `animate` + `motionValue` |        382,556 |    116,352 |                  25,233 |
| React Spring `SpringValue`               |        349,903 |    106,175 |                  15,056 |
| Motion React drag/layout                 |        454,671 |    139,542 |                  48,423 |

Use the small numeric entry for core interactions. Rich drag/layout belongs in a
separate explicitly selected entry/chunk rather than being paid by every Button.
DEV-172 must choose and prove load readiness, early-input fallback, disposal and
entrypoint boundaries on the actual library artifact; no loading latency is hidden
by this already-loaded study.

The browser receipt records 60 successive target updates, resulting change
callbacks, frame intervals and React commits. Spring-following updates caused no
React frame commits. These observations include diagnostic telemetry; they are
not a cross-machine performance guarantee. Off/cleanup checks leave no owned
active spring. The raw receipt contains exact observed values, rather than a
universal frame-rate claim.

## Limits and decision gate

Chromium automation and source/license investigation only. No manual AT,
Safari/Firefox, device-hardware, visual-editor licensing counsel or stable release
certification is claimed. Motion's MIT license is suitable for the proposed reuse;
GSAP's visual-builder restriction needs explicit clearance before reconsideration.
React Spring passes numeric retargeting but does not supply the complete required
layout engine on its own. The accepted Radiant geometry/scheduling adapter reuses Motion physics. Its
production geometry breadth remains DEV-177; no new solver is authorized.

The accepted boundary and bounded proof complete DEV-171 selection. Neither
research nor this proof closes DEV-170 or enables catalog expansion.
