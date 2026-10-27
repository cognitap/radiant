---
status: accepted
---

# Reuse Motion behind Radiant-owned motion boundaries

Use Motion 14.7.1 for spring values and optional gesture behavior, with a Radiant-owned layout adapter. The owner accepted this boundary on 2026-10-27. Its
MIT license, real-host proof and measured numeric core make it preferable to
React Spring plus an additional layout engine; GSAP's visual animation-builder
restriction is unsuitable for an unqualified public workshop dependency.

Use `springValue` for the framework-neutral numeric core. In the same installed
Button/React production bundle it adds 4,793 gzip bytes, compared with 25,233
for generic `animate`/`motionValue` and 48,423 for full React drag/layout. Avoid
pulling generic DOM animation or React projection into every Button. Public
entry points keep this separation; these fixture sizes are not a package-size
promise.

Radiant owns native activation, state, focus, cancellation, mounting/cleanup,
theme policy and live reduced-motion subscription. The engine supplies physics and optional gesture input. Radiant supplies layout
measurement and scheduling, retaining one upstream spring per coordinate axis.
Motion projection resets velocity on retarget and is therefore excluded from the
retained-momentum layout path. Never wait for a spring to finish before accepting a native
close. Button/Dialog scalar presentation reserves and restores individual CSS
`scale`, preserving caller `transform`; a caller-authored `scale` needs an explicit
conflict or opt-out policy. The Radiant layout adapter owns a dedicated motion
part, with semantic native hosts inside it. Arbitrary caller transforms are not
safe on the projection host.

The proof includes native Dialog entry, cancellation, dismissal and focus return.
It does **not** prove a retained top-layer spring exit. Any exit technique must
be proven independently, including immediate native semantics,
interruption and reopen behavior, before enabling it. Do not substitute a delayed native close or sampled CSS bounce curves. Radiant
owns the accepted layout adapter, not a new physical solver. The bounded proof
covers measured local x/y/width/height and real keyed DOM reorder/resize with
retained momentum. Production geometry, scrolling, nesting, clipping, focus and
cancellation must be verified before general layout support ships.

[Research and primary sources](https://github.com/cognitap/radiant/blob/1146ff3/docs/research/dev-171-spring-engines.md)
and [proof, measurements and limits](https://github.com/cognitap/radiant/blob/1146ff3/docs/verification/2026-10-27-spring-engine.md)
are kept at the commit where the decision was made.
