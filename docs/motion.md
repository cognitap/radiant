# Spring motion runtime

Radiant uses Motion 14.7.1 physics with a Radiant-owned layout adapter, as recorded
in the [accepted engine decision](adr/0001-spring-engine-boundaries.md). These APIs
are experimental in 0.x. Built-in Button, disclosure/Dialog, drag and general layout
integration follow in DEV-173–177; importing the runtime does not change their behavior.

## Theme configuration

```tsx
import {defineTheme, ThemeScope} from '@cognitap/radiant'

const theme = defineTheme({
  id: 'brand', name: 'Brand',
  motion: {
    mode: 'system',
    spring: {stiffness: 320, damping: 30, mass: 1},
    interactions: {press: {stiffness: 400, damping: 34}}
  }
})

<ThemeScope theme={theme}>{children}</ThemeScope>
```

Profiles are validated, immutable, JSON-serializable data. Omitted values resolve
to a restrained spring (320/30/1); named interactions are `press`, `disclosure`,
`dialog`, `follow`, `drag` and `layout`. Each interaction inherits the common spring
and accepts individual overrides. Stiffness/damping must be positive and at most
10,000; mass must be positive and at most 100. Zero damping is excluded so every
accepted spring can settle. `mode: 'off'` disables spatial motion. System reduced
motion always wins; there is no forced-animation override.

A nested ThemeScope inherits its selected theme's profile. A new named theme
resets it; changing light/dark mode does not change physical behavior. Theme
profiles are available provider-free using the default profile. Theme documents
retain authoring data at `sections.motion.profile`, independently of legacy
`sections.motion.values` CSS tokens. Compilation and selective section export
preserve the profile; the public workshop/handoff UI is DEV-178/179.

## Numeric and browser interfaces

```ts
import { createSpring, bindSpringStyle } from '@cognitap/radiant/motion'

const position = createSpring(0, {
  parameters: theme.motion.interactions.follow,
  enabled: !matchMedia('(prefers-reduced-motion: reduce)').matches
})
const unbind = bindSpringStyle(element, position, 'translateX')
position.to(160)
position.to(40) // preserve the in-flight position and momentum
// On preference change: position.configure({enabled: false})
// On disposal: unbind(); position.destroy()
```

`createSpring` is framework-neutral and does not read browser preferences or own
DOM. Its owner supplies and updates `enabled`; React bindings do this automatically.
`get`, `getVelocity` (units/second), `isAnimating`, `subscribe`, `to`, `jump`,
`stop`, `configure` and idempotent `destroy` form its supported interface.
Subscriptions run outside React; disposal removes subscriptions and frame work.
`stop()` freezes the current presentation and discards the old goal. `jump()` sets
a new goal immediately with zero velocity. Destroyed controllers ignore further
writes and never resume. Unsubscribe before discarding a standalone subscriber.

All values must be finite numbers in one consistent coordinate/unit system.
There is no mixed-unit, percentage, auto-size, color, CSS-variable or arbitrary
transform-string interpolation. Resolve those to numeric values before animating.
A running follower retains its physics until it rests: `configure({parameters})`
queues the latest physics, avoiding a velocity reset on profile changes. Target
changes continue immediately with the current physics. At rest the pending physics
is applied. Explicit off cancels and snaps to the latest goal, or to `reducedValue`
(e.g. neutral scale 1). Re-enabling never replays an old gesture or animation;
a later `to()` starts new work. An explicitly supplied `reducedValue: undefined`
clears a neutral override.

`bindSpringStyle` reserves one property until cleanup. Supported properties:
`scale`, `opacity`, `width`, `height`, `translateX`, `translateY`. Width/height are
pixels; translation is pixels in one axis and reserves the entire individual
`translate` property. Scale is unitless. Opacity clamps to [0,1]; dimensions and
scale clamp to nonnegative presentation while the numeric spring can overshoot.
The caller must not simultaneously animate/write the reserved property or apply
a CSS transition to it. The binding leaves `transform`, rotate, refs, children,
state and all event handlers untouched. Cleanup restores the prior inline value
and priority unless a caller has reclaimed it since the last spring write.
A dedicated motion part is required when the caller already owns that property.

`createLayoutSpring(bounds, options)` retains independent upstream springs for
local-pixel `{x, y, width, height}`. Measurements must share a stable coordinate
space; dimensions must be nonnegative. Off snaps all axes to the latest measured
bounds. Subscribers observe per-axis updates, not one atomic frame callback.
This is the accepted layout adapter's numeric foundation; it does not measure DOM,
project nested transforms or manage reorder/scroll/resize observers. Production
measurement/host integration and geometry breadth are DEV-177.

## React lifecycle

```tsx
import { useRef } from 'react'
import { Button } from '@cognitap/radiant'
import { useSpringStyle } from '@cognitap/radiant/motion/react'

function Example() {
  const ref = useRef<HTMLButtonElement>(null)
  const scale = useSpringStyle(ref, 'scale', 1, 'press', 1)
  return (
    <Button
      ref={ref}
      style={{ '--rad-button-press-scale': '1' }}
      onPointerDown={event => {
        if (!event.defaultPrevented) scale.to(0.96)
      }}
      onPointerUp={() => scale.to(1)}
      onPointerCancel={() => scale.to(1)}
      onPointerLeave={() => scale.to(1)}
      onBlur={() => scale.to(1)}
    >
      Save
    </Button>
  )
}
```

This illustrates the interface, not the finished Button policy. The canonical
[System/Motion story](../src/Motion.stories.tsx) includes keyboard handling.
Consumers keep native activation, cancellation/disabled guards and semantic state
with the host. A replacement `render` must forward the resolved native ref and
props as usual. There is no wrapper or event interception in these hooks.

`useSpring(initial, interaction?, reducedValue?)` supplies a stable controller;
`useSpringStyle(ref, property, initial, interaction?, reducedValue?)` also binds the
real host. `initial` is mount-only. Replaced render hosts rebind after commit.
`useReducedMotion` live-subscribes to the system preference, removing listeners
when the last owner unmounts. SSR/hydration uses a conservative reduced snapshot;
there is no animation or browser access during server rendering, and no required
movement to reveal useful content. Effects create/dispose owned springs, including
StrictMode replay; frame updates do not set React state. Use the framework-neutral
controller for explicit manual lifecycle ownership instead of manually destroying
a hook-owned controller while its component remains mounted.

## Loading and migration

The root export carries configuration and types only; it does not import Motion
physics or React projection. Opt in synchronously through `/motion` or
`/motion/react`. There is no runtime download, first-input race or lazy global
engine singleton. The consumer's bundler can place the opt-in import in its own
route/chunk. Rich gesture integration will have an explicit heavier boundary;
Motion React projection is excluded from the retained-momentum layout path.

Existing duration/easing tokens continue to control existing CSS transitions.
There is no reliable conversion from a CSS bounce curve to physical spring
parameters. Add `motion` to the theme, opt into these runtime bindings and disable
competing CSS presentation on the reserved property; migrate each built-in family
in its issue. Color fades may continue to use CSS durations. No tokens are removed
or renamed here. JavaScript and CSS still need matching package versions.

## Native action springs

```tsx
import { Button } from '@cognitap/radiant'
import { MotionProvider, MotionLink } from '@cognitap/radiant/motion/react'

;<MotionProvider>
  <Button type="submit">Save</Button>
  <Button motion="off">Immediate spatial feedback</Button>
  <MotionLink
    variant="solid"
    href="/account"
  >
    Account
  </MotionLink>
</MotionProvider>
```

MotionProvider adds no DOM wrapper. Within it, real Button hosts and composed
DialogTrigger/DialogClose actions use the theme's press spring for compression
and release, including re-press during rebound. The pressed scale comes from
`--rad-button-press-scale` (default .97, supported .5–1). MotionLink is an opt-in
client adapter for action-shaped Link; ordinary Link keeps its server contract.
Inline/subtle links do not compress, and Space keeps native anchor scrolling.

Native clicks/submission/navigation are never synthesized or delayed. Consumer
handlers run first; cancelling press input prevents compression. Pointer/touch,
Enter/Space, repeat, outside release, pointer cancellation, lost capture, blur,
disabled fieldsets and pending changes retain their native meanings. Off and
system reduced-motion cancel to neutral. The adapter reserves individual scale,
leaves caller transform intact, and removes scale from CSS transitions. Recognized
caller scale utilities or inline scale/scale transitions retain ownership and opt
out of the spring. For arbitrary external scale styles, set `motion="off"` and
keep one owner. Cleanup restores prior presentation and removes listeners.

See [System/Motion → ButtonPress](../src/Motion.stories.tsx) for the canonical
interactive proof. The public workshop composes these production APIs in DEV-178.

## Disclosure and Dialog transitions

The same MotionProvider enables native Collapsible/Accordion height springs and
Dialog entry/exit presentation. `Collapsible motion="off"` and
`DialogContent motion="off"` opt out locally; theme off and live system reduced
motion snap immediately. Native open state, callbacks, Escape cancellation,
modal/top-layer behavior and focus restoration keep their existing owners.

Disclosure animates the `::details-content` height using a reserved internal CSS
variable. Real children keep natural size and are measured with ResizeObserver;
there is no child/border scaling. Closed content can finish a visual collapse,
but is inert and ARIA-hidden immediately. Authored inert/hidden values are restored
on opening/disposal. Custom layouts whose direct content margins/positioning do
not fit this measurement should opt out. Browsers without `::details-content`
visibility support retain native immediate collapse as progressive fallback.

Dialog closes natively immediately. For safe ordinary HTML content, an inert,
ARIA-hidden presentation `div` can finish a spring exit outside the top layer.
It carries no IDs, form names, autofocus or event handlers; form controls are
disabled, and pointer events pass through. It is removed at rest, reduced motion,
reopen or disposal. Reopening reuses the current spring state and cancels the copy.
Caller transform remains intact; authored scale/scale transitions retain ownership.

Nested native dialogs, custom elements, scripts/styles, embedded documents,
canvas and media use immediate visual exit: cloning those could trigger behavior
or fail to reproduce their content. The visual copy is not a retained modal or
interactive surface. Exotic containing blocks/positioning and live content during
exit are outside this snapshot contract; use local off when they need a different
presentation. See System/Motion → Transitions and the native browser proof.
