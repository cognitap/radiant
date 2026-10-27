# DEV-176 — changing-target followers

The source binding and React follower reuse the accepted persistent Motion spring.
No solver, gesture engine, DOM clone or frame-driven React state is added.

- `bindSpringSource` reads a subscribed snapshot, follows notifications and detaches
  without owning its source or destroying its controller. Invalid initial values
  clean up the subscription; self-binding is rejected.
- `useSpringFollow` accepts numeric props or replaceable subscribed sources. Live
  theme off/reduced motion snaps to the current destination. Initial server output
  hydrates with stable DOM; StrictMode and unmount dispose subscriptions/work.
- System/Motion → FollowingValues provides pointer, native range and autonomous
  moving-target controls, with a destination marker and presentation readout.

Local evidence: 124 runtime tests; 46 actual installed-package tests and both
NodeNext/Bundler declaration contracts; 12 focused Chromium cases (the two follower
platform cases and five Motion stories in each Radiant light/dark mode). Source,
contract and build types, lint, formatting and generated-theme checks pass.
Browser continuity records position and signed velocity immediately before/after
16 frame-driven retargets, verifies forward momentum after reversal, and checks
source replacement, detach/stop, theme off, live preferences and hydration.

The source owns destinations while bound: stop alone pauses only until another
notification. Detach then stop for a persistent freeze. Values use one numeric
unit system. General DOM geometry belongs to DEV-177; the public workshop and
publication remain DEV-178–180. Chromium automation does not establish actual AT
or a stable-release compatibility audit.
