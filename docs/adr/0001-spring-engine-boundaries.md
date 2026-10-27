---
status: accepted
---

# Reuse Motion behind Radiant-owned motion boundaries

Use Motion 14.7.1 for spring values and optional gesture behavior, with a Radiant-owned layout adapter. The owner accepted this boundary on 2026-10-27. Its
MIT license, real-host proof and measured numeric core make it preferable to
React Spring plus an additional layout engine; GSAP's visual animation-builder
restriction is unsuitable for an unqualified public workshop dependency. This
is the accepted selection for DEV-171. It does not add
an engine to Radiant's production dependencies or close the DEV-170 chapter.

Use `springValue` for the framework-neutral numeric core. In the same installed
Button/React production bundle it adds 4,793 gzip bytes, compared with 25,233
for generic `animate`/`motionValue` and 48,423 for full React drag/layout. Avoid
pulling generic DOM animation or React projection into every Button. DEV-172
must preserve this separation in its public entrypoints and measure the actual
published artifact; these fixture deltas are not a final package-size promise.

Radiant owns native activation, state, focus, cancellation, mounting/cleanup,
theme policy and live reduced-motion subscription. The engine supplies physics and optional gesture input. Radiant supplies layout
measurement and scheduling, retaining one upstream spring per coordinate axis.
Motion projection resets velocity on retarget and is therefore excluded from the
retained-momentum layout path. Never wait for a spring to finish before accepting a native
close. Button/Dialog scalar presentation reserves and restores individual CSS
`scale`, preserving caller `transform`; a caller-authored `scale` needs an explicit
conflict/opt-out policy in DEV-172/173. The Radiant layout adapter owns a dedicated motion
part, with semantic native hosts inside it. Arbitrary caller transforms are not
safe on the projection host.

The proof includes native Dialog entry, cancellation, dismissal and focus return.
It does **not** prove a retained top-layer spring exit. DEV-174 must prove any
exit-presence technique independently, including immediate native semantics,
interruption and reopen behavior, before enabling it. Do not substitute a delayed native close or sampled CSS bounce curves. Radiant
owns the accepted layout adapter, not a new physical solver. The bounded proof
covers measured local x/y/width/height and real keyed DOM reorder/resize with
retained momentum. DEV-177 must expand and verify production geometry, scrolling,
nesting, clipping, focus and cancellation before general layout support ships.

[Research and primary sources](../research/dev-171-spring-engines.md),
[proof, measurements and limits](../verification/2026-10-27-spring-engine.md).
