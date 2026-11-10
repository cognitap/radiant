# Motion

Opt-in springs for Radiant components and your own elements. Functions are in `@cognitap/radiant/motion`. Hooks and components are in `@cognitap/radiant/motion/react`. Both wrap Motion's `springValue`. See [ADR 0001](adr/0001-spring-engine-boundaries.md).

`prefers-reduced-motion: reduce` disables spring animation. Duration and easing tokens still apply to CSS transitions.

## Theme profile

A theme sets springs under `motion`:

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

| Field                 | Rule                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------- |
| `spring`              | Default `320` / `30` / `1`. Stiffness and damping in `(0, 10000]`, mass in `(0, 100]`  |
| `interactions.<name>` | `press`, `disclosure`, `dialog`, `follow`, `drag`, or `layout`; each inherits `spring` |
| `mode`                | `system` (default) or `off`                                                            |

`ThemeScope` keeps the profile across light and dark. Theme documents store it at `sections.motion.profile`.

## Component motion

Wrap a subtree in `MotionProvider`. It adds no DOM.

```tsx
import { Button } from '@cognitap/radiant'
import { MotionLink, MotionProvider } from '@cognitap/radiant/motion/react'

export function AccountActions() {
  return (
    <MotionProvider>
      <Button>Save</Button>
      <Button motion="off">No spring</Button>
      <MotionLink
        variant="solid"
        href="/account"
      >
        Account
      </MotionLink>
    </MotionProvider>
  )
}
```

Examples:

| Component                                | Motion                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| `Button`, `DialogTrigger`, `DialogClose` | Compress on press to `--rad-button-press-scale` (default `0.97`, range `0.5`–`1`) |
| `MotionLink`                             | Press scale on button-styled links. `Link` stays server-renderable                |
| `Collapsible`, `Accordion`               | Animate height. Closed content is inert immediately                               |
| `Dialog`                                 | Springs open. The `<dialog>` closes immediately. An inert clone finishes the exit |
| `Select`                                 | Fade the popup in. Close immediately                                              |

The exit clone is skipped when the dialog has more than 500 descendants, or when it contains a nested dialog, media, a canvas, an embed, or a custom element. The clone stops after 2 seconds.

Pass `motion="off"` on `Button`, `MotionLink`, `Collapsible`, `SelectContent`, or `DialogContent`. A caller `scale-*` class, inline `scale`, or scale transition also disables press scaling.

## Spring API

| API                                            | Entry           | Purpose                                                                         |
| ---------------------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| `createSpring(initial, options)`               | `/motion`       | `to`, `jump`, `stop`, `get`, `getVelocity`, `subscribe`, `configure`, `destroy` |
| `bindSpringStyle(el, spring, prop)`            | `/motion`       | `scale`, `opacity`, `width`, `height`, `translateX`, `translateY`               |
| `useSpring`, `useSpringStyle`                  | `/motion/react` | Theme profile and reduced motion                                                |
| `useReducedMotion`                             | `/motion/react` | `prefers-reduced-motion`                                                        |
| `useSpringFollow(target)`                      | `/motion/react` | Follow a number or `SpringSource` (`{ get, subscribe }`)                        |
| `bindSpringSource(spring, source)`             | `/motion`       | `useSpringFollow` outside React                                                 |
| `useSpringDrag(ref, initial, opts)`            | `/motion/react` | One-axis pointer and keyboard drag, with bounds and snap points                 |
| `createSpringDrag`, `bindSpringDrag`           | `/motion`       | Drag controller and element binding                                             |
| `useSpringLayout(ref)`                         | `/motion/react` | Reorder and resize a flex or grid group                                         |
| `bindSpringLayout(root)`, `createLayoutSpring` | `/motion`       | Layout binding and a 4-axis spring                                              |

- Values are finite numbers in one unit. Convert percentages, colors, and CSS variables first.
- `to(next)` keeps position and velocity. `configure` applies at rest.
- When motion is off or reduced, `to` jumps to `reducedValue ?? target`.
- `bindSpringStyle` writes its CSS property and restores the previous inline value on cleanup.
- Hooks do not write animation frames to React state.
- `useSpringLayout` measures each direct child marked `data-rad-layout-slot`. That child has one first-child `data-rad-layout-part`, no padding or border, and stays in normal flow.
