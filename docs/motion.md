# Motion

Spring motion is opt-in and lives in `@cognitap/radiant/motion` and `@cognitap/radiant/motion/react`. It wraps Motion's `springValue` behind Radiant-owned bindings; see [ADR 0001](adr/0001-spring-engine-boundaries.md).

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

| Field                 | Rule                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------- |
| `spring`              | Default `320` / `30` / `1`. Stiffness and damping in `(0, 10000]`, mass in `(0, 100]` |
| `interactions.<name>` | `press`, `disclosure`, `dialog`, `follow`, `drag`, `layout`; each inherits `spring`   |
| `mode`                | `system` (default) or `off`                                                           |

`prefers-reduced-motion: reduce` always wins. `ThemeScope` inherits its theme's motion profile across light/dark mode switches, and theme documents store it at `sections.motion.profile`. CSS duration and easing tokens still drive ordinary CSS transitions.

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

- `Button`, `DialogTrigger`, and `DialogClose` compress on press to `--rad-button-press-scale` (default `0.97`, range `0.5`–`1`). Use `MotionLink` for button-styled links; plain `Link` stays server-renderable.
- `Collapsible` and `Accordion` animate height while keeping closed content inert immediately.
- `Dialog` springs open and closes its native `<dialog>` immediately; an inert clone finishes the visual exit (skipped when the dialog has over 500 descendants, nested dialogs, media, canvas, embeds, or custom elements, and capped at 2s).
- `Select` animates popup opacity on open and closes immediately.

Pass `motion="off"` on `Button`, `MotionLink`, `Collapsible`, `SelectContent`, or `DialogContent` to disable springs for one instance. Caller scale utilities (`scale-*`) and inline `scale` / `scale` transitions opt out of press scaling automatically.

## Hooks and functions

| API                                            | Entry           | Purpose                                                                                         |
| ---------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `createSpring(initial, options)`               | `/motion`       | Numeric spring: `to`, `jump`, `stop`, `get`, `getVelocity`, `subscribe`, `configure`, `destroy` |
| `bindSpringStyle(el, spring, prop)`            | `/motion`       | Drive `scale`, `opacity`, `width`, `height`, `translateX`, or `translateY` on an element        |
| `useSpring`, `useSpringStyle`                  | `/motion/react` | React hooks bound to the active theme profile and reduced-motion preference                     |
| `useReducedMotion`                             | `/motion/react` | Live `prefers-reduced-motion` boolean                                                           |
| `useSpringFollow(target)`                      | `/motion/react` | Follow a changing number or `SpringSource` (`{ get, subscribe }`)                               |
| `bindSpringSource(spring, source)`             | `/motion`       | Imperative equivalent of `useSpringFollow`                                                      |
| `useSpringDrag(ref, initial, opts)`            | `/motion/react` | One-axis pointer/keyboard drag with bounds and snap points                                      |
| `createSpringDrag`, `bindSpringDrag`           | `/motion`       | Imperative drag controller and DOM binding                                                      |
| `useSpringLayout(ref)`                         | `/motion/react` | Animate reorder and resize of a flex or grid group                                              |
| `bindSpringLayout(root)`, `createLayoutSpring` | `/motion`       | Imperative layout group binding and 4-axis spring                                               |

Spring rules:

- Values are finite numbers in a single unit; convert percentages, colors, or CSS variables before passing them in.
- Retargeting (`to(next)`) preserves current position and velocity. Parameter changes (`configure`) apply once the spring comes to rest.
- When disabled or under reduced motion, `to` jumps immediately to `reducedValue ?? target`.
- `bindSpringStyle` owns its CSS property until cleanup and restores the prior inline value on `destroy()`.
- Hooks never write animation frames into React state.

## Drag

`bindSpringDrag` samples recent pointer movement to compute release velocity and snaps to the point closest to `position + velocity * 180ms`. Arrow keys step between snap points, Home and End jump to the bounds, Escape cancels and restores the pre-drag position, and a completed drag suppresses the trailing `click` event. Under reduced motion, dragging tracks the pointer and snaps immediately on release.

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
      <div data-rad-layout-part="">
        <Card>{item.title}</Card>
      </div>
    </div>
  ))}
</div>
```

Each direct child of the root is a `[data-rad-layout-slot]` containing one `[data-rad-layout-part]` with a stable React `key`. Slots take no padding, border, transform, or positioning; put visual styles on the part (with no outer margin). `useSpringLayout` measures after React commits; call `measure()` after imperative style changes.

Text reflows at the animated width without scaling or cloning. Added or removed items appear and disappear immediately. Ancestors must not be scaled, rotated, or zoomed, and nested layout groups, sticky/fixed slots, and shared-element morphs are unsupported.
