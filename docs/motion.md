# Motion

Radiant's spring motion is opt-in. It uses Motion's physics behind
Radiant-owned bindings; see the [engine decision](adr/0001-spring-engine-boundaries.md).
The root package carries only configuration and types. Import
`@cognitap/radiant/motion` or `/motion/react` to use the runtime.

## Theme profiles

```tsx
const theme = defineTheme({
  id: 'brand',
  name: 'Brand',
  motion: {
    spring: { stiffness: 320, damping: 30, mass: 1 },
    interactions: { press: { stiffness: 400, damping: 34 } }
  }
})
```

| Field                 | Rule                                                                                |
| --------------------- | ----------------------------------------------------------------------------------- |
| `spring`              | Default 320 / 30 / 1. Stiffness and damping in (0, 10000], mass in (0, 100]         |
| `interactions.<name>` | `press`, `disclosure`, `dialog`, `follow`, `drag`, `layout`; each inherits `spring` |
| `mode`                | `system` (default) or `off`                                                         |

The system reduced-motion setting always wins. A nested ThemeScope inherits its
theme's profile, and switching light or dark mode does not change it. Theme
documents store it at `sections.motion.profile`. The CSS duration and easing
tokens still drive ordinary CSS transitions.

## Component motion

```tsx
import { MotionProvider, MotionLink } from '@cognitap/radiant/motion/react'

;<MotionProvider>
  <Button>Save</Button>
  <Button motion="off">No spring</Button>
  <MotionLink
    variant="solid"
    href="/account"
  >
    Account
  </MotionLink>
</MotionProvider>
```

`MotionProvider` adds no DOM. Inside it:

- Button, DialogTrigger and DialogClose compress on press, using
  `--rad-button-press-scale` (default 0.97, range 0.5–1). Use `MotionLink` for
  action-shaped links; plain Link stays server-renderable. Only the active
  pointer or key releases its press.
- Collapsible and Accordion animate natural height, including replacement and
  resized content. Closed content is inert immediately. Before hydration,
  native details controls visibility. Neither scales its children.
- Dialog springs open and closes natively immediately. An inert copy finishes
  exit, bounded to 500 descendants and two seconds. Nested dialogs, media,
  canvas, embeds and custom elements (including customized built-ins) skip it.

Set `motion="off"` on Button, MotionLink, Collapsible or DialogContent.
Theme off and reduced motion suppress springs and CSS lift/shift. Pending and
disabled cancel a held press; re-enabling never replays it. Native activation,
focus and Escape stay immediate; `preventDefault` cancels compression.
Caller scale utilities and inline scale/scale transitions opt out. Other scale
styles need `motion="off"`. Explore [Link](../src/Link.stories.tsx) and [Button](../src/Button.stories.tsx).

## Hooks and functions

| API                                            | Entry           | Use                                                                                               |
| ---------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| `createSpring(initial, options)`               | `/motion`       | A numeric spring: `to`, `jump`, `stop`, `get`, `getVelocity`, `subscribe`, `configure`, `destroy` |
| `bindSpringStyle(el, spring, prop)`            | `/motion`       | Drive `scale`, `opacity`, `width`, `height`, `translateX` or `translateY`                         |
| `useSpring`, `useSpringStyle`                  | `/motion/react` | The same, owned by a component and the theme profile                                              |
| `useReducedMotion`                             | `/motion/react` | The live system preference                                                                        |
| `useSpringFollow(target)`                      | `/motion/react` | Follow a changing number or a `SpringSource` (`get`, `subscribe`)                                 |
| `bindSpringSource(spring, source)`             | `/motion`       | The same, managed by hand                                                                         |
| `useSpringDrag(ref, initial, opts)`            | `/motion/react` | One-axis drag with bounds and snap points                                                         |
| `createSpringDrag`, `bindSpringDrag`           | `/motion`       | The same, managed by hand                                                                         |
| `useSpringLayout(ref)`                         | `/motion/react` | Animate resize and reorder of a grid or flex group                                                |
| `bindSpringLayout(root)`, `createLayoutSpring` | `/motion`       | The same, managed by hand                                                                         |

Hooks follow the theme profile and reduced motion for you. With the plain
functions, you pass `enabled` and call `destroy`.

Rules for every spring:

- Values are finite numbers in one unit. Convert percentages, colors and CSS
  variables first.
- A new target keeps the current position and momentum. New physics apply once
  the spring rests.
- With motion off or reduced, a spring jumps straight to its target, or to
  `reducedValue` if you set one.
- A bound style property belongs to the spring until cleanup. Don't animate it
  or give it a CSS transition elsewhere. Cleanup restores the previous value.
- Server rendering never animates, and hooks never store frames in React state.

## Drag

Release velocity comes from recent pointer samples. The handle settles on the
snap point nearest to where it would land 180ms ahead. Arrow keys move between
snap points, Home and End go to the ends, and Escape cancels. A finished drag
swallows the click that follows it. With reduced motion, dragging still works
and only the settling is instant.

## Layout

```tsx
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
      <Card data-rad-layout-part="">{item.title}</Card>
    </div>
  ))}
</div>
```

Each direct child of the root is a slot with one part inside. Keep their keys
stable. Text reflows at the animated width; nothing is scaled or cloned. Items
that enter or leave appear at once.

- Slots carry no padding, border or positioning. Put decoration on the part,
  which needs no outer margin.
- Don't transform, transition or position the slot or part yourself.
- The root and its ancestors must not be scaled, rotated or zoomed.
- Nested layout groups, sticky or fixed slots and shared-element morphs are not
  supported.

React commits measure automatically. Call `measure()` after changing a slot's
or part's own styles. Moving focus during a reorder is the application's job.

Wrap Fields in dedicated parts with stable slots, as in the
[Field example](../.storybook/examples/FieldExamples.tsx). Only surrounding space
moves; errors and relationships stay immediate. Keep validation and focus in the
consumer. The [Input editor](../.storybook/examples/InputExamples.tsx) springs a
separate focus cue, preserving the native ring, caret and caller styles.

The [Checkbox permissions example](../.storybook/examples/CheckboxExamples.tsx)
uses `useSpring` and `parts.indicator` for decorative entry feedback. Checked and
mixed semantics stay native. Disabled changes settle the glyph, and indicator
customization takes ownership. The local adapter keeps frame writes outside React.
