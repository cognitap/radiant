---
status: accepted
---

# Reuse Motion behind Radiant-owned motion boundaries

Accepted on 2026-10-27.

## Decision

Use Motion 14.7.1 `springValue` as the framework-neutral numeric core, with optional gesture input from the same engine and a layout adapter owned by Radiant. Generic DOM animation (`animate`/`motionValue`) and React projection stay out of the Button entry point; public entry points keep that separation.

Motion was chosen because its MIT license and measured numeric core suit a public dependency. React Spring would still require a separate layout engine, and GSAP's visual animation-builder restriction is unsuitable for an unqualified public workshop dependency.

In the same Button/React production bundle, `springValue` adds 4,793 gzip bytes, compared with 25,233 for generic `animate`/`motionValue` and 48,423 for full React drag/layout. These are fixture measurements, not a package-size promise.

## Boundaries

- Radiant owns native activation, state, focus, cancellation, mounting/cleanup, theme policy, and the live reduced-motion subscription. The engine supplies physics and optional gesture input.
- Radiant owns layout measurement and scheduling, with one spring per coordinate axis. Motion projection resets velocity on retarget, so it is excluded from the layout path, where retargeting must retain momentum.
- A native close is never delayed for a spring. Dialog may leave an inert copy behind to finish the visual exit; a delayed native close and sampled CSS bounce curves are not substitutes.
- Button and Dialog press motion reserves and restores the individual CSS `scale` property and leaves caller `transform` alone. Caller scale utilities and inline scale opt out.
- The layout adapter owns a dedicated motion part with the semantic native host inside it. Caller transforms are not safe on that part.

## Layout scope

`useSpringLayout` covers measured local x/y/width/height through keyed reorder and resize, retaining momentum. Nested groups, sticky or fixed slots, shared-element morphs, and scaled, rotated, or zoomed ancestors are outside that support. Production geometry, scrolling, nesting, clipping, focus, and cancellation must be verified before general layout support ships.

The proof covers native Dialog entry, cancellation, dismissal, and focus return. It does not prove a retained top-layer spring exit: any exit technique must be proven independently, including immediate native semantics and interruption/reopen behavior, before it is enabled.
