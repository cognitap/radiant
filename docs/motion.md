# Spring motion runtime

Radiant uses Motion 14.7.1 physics with a Radiant-owned layout adapter, as recorded
in the [accepted engine decision](adr/0001-spring-engine-boundaries.md). These APIs
are experimental in 0.x. Opt-in bindings cover native Button, disclosure/Dialog,
drag/snap, changing-target values and measured layout groups. Importing numeric
interfaces alone does not enable native component motion.

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
This is the layout adapter's numeric foundation. The grouped browser and React
interfaces described under [layout resize and reorder](#layout-resize-and-reorder)
own natural-flow measurement, scheduling and presentation.

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

## Drag, release and snap

```tsx
import { useRef } from 'react'
import { Button } from '@cognitap/radiant'
import { useSpringDrag } from '@cognitap/radiant/motion/react'

function Handle() {
  const ref = useRef<HTMLButtonElement>(null)
  const drag = useSpringDrag(ref, 0, { min: 0, max: 160, snapPoints: [0, 80, 160] })
  return (
    <>
      <Button
        ref={ref}
        className="transition-colors"
      >
        Drag or use arrow keys
      </Button>
      <Button onClick={() => drag.step('first')}>Start</Button>
      <Button onClick={() => drag.step('last')}>End</Button>
    </>
  )
}
```

The hook reserves the handle's individual translate, keeps transform untouched,
and owns its binding/controller cleanup. It exposes `get`, `getVelocity`,
`subscribe`, `isAnimating`, `to`, `cancel` and `step`. Use a dedicated handle
without competing translate/transform animation. Initial position is mount-only;
changing bounds/snap points/theme updates the existing controller. Replacing a
host rebinds it; it does not replace the native host/ref or create a wrapper.

The framework-neutral `createSpringDrag(initial, options)` additionally exposes
`begin`, `move(position, time)`, `release(time)`, `jump`, `stop`, `configure` and
`destroy`. Bounds are finite pixels with min < max. Snap points are detached,
sorted, deduplicated and must be nonempty/in bounds; omitted points mean the two
bounds. `bindSpringDrag(element, controller, axis?)` supplies native browser input
and presentation; dispose the binding and then its owned controller separately.
The axis is x by default, or y. Geometry conversion/reordering is DEV-177.

Direct manipulation jumps to bounded pointer positions. Release uses signed
velocity from fresh monotonic samples (milliseconds; zero after 80ms inactivity,
clamped to ±3000px/s). It projects 180ms ahead and selects the nearest bounded
snap point; ties choose the lower point. Motion receives the actual signed release
velocity through its public value API. `createSpring.to(target, velocity?)` also
supports an explicitly seeded velocity in units/second. Ordinary target changes
still retain the running follower's momentum; explicit velocity starts a new
trajectory at the current position. No solver, sampled bounce curve or website-only
physics engine is added.

Bounds hard-clamp presentation and direct input, while upstream physics can
overshoot internally. This is not a collision/bounce or free 2D drag engine.
Re-grab freezes the current presentation; cancellation returns to the last
committed goal with zero release velocity. Escape cancels an active drag; arrows
select adjacent points, Home/End choose extremes. Native focus and tap/Enter/Space
click remain native; a completed drag suppresses its following click once.
Consumer prevention/propagation runs before the document-bubble gesture handlers.
Disabled/pending and lost capture/blur cancel the gesture. Horizontal handles use
pan-y and vertical handles pan-x when no inline touch-action is authored, retaining
perpendicular native scrolling; caller touch-action values remain owned by the
caller. Off/reduced motion preserves useful direct manipulation and snaps release
or keyboard goals immediately, rather than disabling functional controls.

See System/Motion → DragSnap for a real handle, explicit native button alternatives,
range target and position readout. The public editor composes these APIs in DEV-178.

## Following changing targets

```tsx
import { useEffect, useRef } from 'react'
import { bindSpringStyle } from '@cognitap/radiant/motion'
import { useSpringFollow } from '@cognitap/radiant/motion/react'

function Follower({ target }: { target: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const spring = useSpringFollow(target)
  useEffect(() => {
    if (ref.current) return bindSpringStyle(ref.current, spring, 'translateX')
  }, [spring])
  return (
    <div
      ref={ref}
      aria-hidden="true"
    />
  )
}
```

`useSpringFollow(target, interaction?, reducedValue?)` accepts either a finite numeric
prop or a `SpringSource` with synchronous `get()` and `subscribe(listener)` methods.
A source notifies with its latest numeric destination; it must offer a server-safe
snapshot when used during SSR. The hook reads props after commit and external
notifications directly, without storing each animated frame in React state. Source
replacement detaches the old subscription and retargets the same spring. Target
changes preserve current position and momentum; theme parameter changes wait until
rest. Off/reduced motion follows the latest destination immediately, or uses the
explicit neutral value. Initial server markup is unchanged by the binding.

For manual ownership, `bindSpringSource(spring, source)` subscribes an existing
controller and reads the current snapshot. Its idempotent cleanup only detaches
the source: the last destination can finish. Call `spring.stop()` after detaching
to freeze presentation, or `destroy()` to dispose an owned controller. Calling
`stop()` while still bound freezes only until the next source notification. Never
bind a source to itself or create cyclic follower chains. One binding owns targets
at a time; the binding never owns or destroys its source. Numeric units, property
ownership and parameter rules are the same as `createSpring`.

System/Motion → FollowingValues offers pointer, native range and moving-target
controls with a visible destination, follower and numeric readout. This is a
library development proof; the public workshop remains DEV-178.

## Layout resize and reorder

```tsx
import { useRef } from 'react'
import { Card, CardTitle } from '@cognitap/radiant'
import { useSpringLayout } from '@cognitap/radiant/motion/react'

function Cards({ items }: { items: { id: string; title: string }[] }) {
  const root = useRef<HTMLDivElement>(null)
  useSpringLayout(root)
  return (
    <div
      ref={root}
      className="grid grid-cols-2 gap-4"
    >
      {items.map(item => (
        <div
          key={item.id}
          data-rad-layout-slot=""
          className="flow-root"
        >
          <Card data-rad-layout-part="">
            <CardTitle>{item.title}</CardTitle>
          </Card>
        </div>
      ))}
    </div>
  )
}
```

The root owns a group of **direct-child** `data-rad-layout-slot` wrappers. Each
slot has one first-child `data-rad-layout-part` containing the actual content.
Keep keys and the slot/part DOM identities stable during reorder; replacement
starts a new item at its natural bounds. New and removed items appear/disappear
immediately; this interface does not provide enter/exit presence or drag sorting.
Native semantic elements stay inside the motion part or, for passive Card, can
be the part itself. A part can have padding, borders, backgrounds and a grid/flex
content layout. Children, text and borders are never scaled or cloned.

`useSpringLayout(ref)` measures the group in a layout effect after each commit,
before paint. It supplies `measure()`, `get(slot)`, `getVelocity(slot)` and
`isAnimating()`. Snapshots use local pixel `{x,y,width,height}` bounds and velocities
in pixels/second, or undefined for an unregistered/disposed slot. Theme `layout`
physics, system reduced motion and lifetime remain hook-owned. The stable handle
survives root replacement; SSR does not measure or alter markup. No animated
frame is stored in React state. See System/Motion → LayoutResizeReorder for a
responsive Card grid with reorder, width and dynamic-content controls.

For manual ownership, `bindSpringLayout(root, options?)` measures a mounted browser
root and returns the same inspection/measurement interface plus `configure` and
idempotent `destroy`. Supply `enabled` from your live reduced-motion policy, as
with `createSpring`. Options use the same physical parameter rules; scalar
`reducedValue` is rejected. Destroy removes observers, listeners, pending adapter
frames and springs, and restores inline properties still owned by the binding.

Every measurement releases **all** slot reservations/projections before reading
natural layout, then retargets one persistent upstream spring per coordinate axis.
Slots reserve their final natural width/height while their motion parts render the
current position and physical width/height. Text reflows at the animated width;
height does not scale or implicitly clip content. The group restores normal flow
at rest. Off/reduced motion snaps to the natural layout immediately. Profile
parameter changes take effect at rest without replacing in-flight momentum.

Root/slot ResizeObservers, subtree content/class/open/hidden/style mutations,
resource loads, viewport resize and font completion schedule a grouped measurement.
Imperative callers can call `measure()` synchronously after a transaction to avoid
a frame before mutation-observer work. Style writes on the reserved slot/part are
ignored by the mutation observer to avoid observing the animation itself: call
`measure()` explicitly after changing their author-owned styles. React commits do
this automatically. Scrolling the root or an outer scroller preserves local
coordinates; scrolling is not a new motion target. Native overflow clipping and
scrollbar ownership remain with the application.

Geometry requirements:

- Use dedicated, normal-flow, unpadded, borderless slots. Slots can carry grid/flex
  placement and margins; use `flow-root` to avoid collapsed content margins.
  Parts must have zero outer margin and fill their slot naturally. Put decoration
  and padding on the part or content. Keep one part as the slot's only element.
- Reserve slot position/width/height/box-sizing/flex and part position/insets/width/
  height/box-sizing/translate for the binding. No competing transitions, transforms
  or individual translate/rotate/scale on these wrappers; transformed native
  controls **inside** a part keep their own presentation. Insets must start at
  their normal-flow defaults. Unsupported wrapper geometry is rejected rather
  than silently projecting distorted measurements.
- The coordinate plane must be unscaled/unrotated, with no CSS zoom/perspective on
  the root/ancestors. Common ancestor translation is supported. Fixed/sticky or
  absolute slots, cross-root shared-element morphing, nested independently animated
  layout groups and arbitrary transformed coordinate systems are outside this
  contract. Ordinary nested content, native modal top layers and internal scrollers
  retain their owners. Scroll-position/sticky pinning is not synthesized.
- Layout motion never delays semantic changes, takes focus, moves DOM or duplicates
  native controls. DOM reorder is still the application's operation; if it removes
  or moves the focused host, apply the application's intended focus policy. Keep
  overflow visible when focus outlines or content must extend beyond animated bounds.

The public workshop and theme handoff remain DEV-178/179; this ships the reusable
library interface and its development proof, without publishing a package.
