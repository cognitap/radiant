# React bindings

Private modules in `src/internal/` and `src/react/` implement the shared behavior described in [architecture](architecture.md). They are not public exports.

| Module                              | Responsibility                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `src/internal/ids.ts`               | Merge IDs for `aria-labelledby` and `aria-describedby`, keeping owned IDs first       |
| `src/internal/events.ts`            | Run disabled/pending guards, then consumer handler, then uncancelled library action   |
| `src/internal/selection.ts`         | Single and multiple selection membership, equality, and transitions                   |
| `src/react/useComposedRefs.ts`      | Forward one native host to library and caller refs, preserving callback ref cleanups  |
| `src/react/useControllableState.ts` | Enforce a fixed state owner, initial default, and no-op request suppression           |
| `src/react/useNativeOwner.ts`       | Shared controlled/uncontrolled prop types and dev checks for mixed or switched owners |

`tests/architecture.test.mjs` enforces the boundary: `src/internal/` never imports React or a component family, and `src/react/` never imports a component family.

## State

- A request equal to the current state is ignored.
- An uncontrolled request updates state and calls `on*Change` once; subsequent requests in the same event read the updated value.
- A controlled request only calls `on*Change`; the rendered value updates when the prop updates.
- Prop changes and native restorations after a refused controlled request do not fire callbacks.
- `Collapsible` forwards every native `onToggle`, but calls `onOpenChange` only when `<details open>` disagrees with the owner. If a controlled owner refuses the toggle, `Collapsible` restores `element.open` without re-triggering `onOpenChange`.
- Toggle and `close` events from nested disclosures or dialogs are ignored when `event.target !== event.currentTarget`.
- Native inputs (`Input`, `Textarea`, `Slider`, `Checkbox`, `Switch`, `Radio`) keep browser `change`, `blur`, and form `reset` behavior; `useNativeOwner` only checks ownership invariants.

## Activation and refs

`composeAction` runs disabled and pending guards, calls the consumer's event handler, and runs the library action only if `event.defaultPrevented` is false. Use it for cancellable activation (`onClick`, `onKeyDown`), never for `onChange`, `onToggle`, or `onBlur`. When a component composes `Button` (such as `DialogTrigger` or `DialogClose`), attach `composeAction` once so the consumer handler runs once.

`useComposedRefs` supports object refs and React 19 callback ref cleanup functions, and keeps a stable identity while its inputs are unchanged.

Shared button/link class generation lives in `src/components/shared/actionStyles.ts` so `Link` and `Card` can render in React Server Components without importing client hooks.

## Effects and SSR

- Effects read `element.ownerDocument` and `ownerDocument.defaultView` instead of global `document` or `window`, so components work inside iframes.
- Nothing installs listeners or timers at module load time.
- Server markup and the first client render produce the same DOM and IDs. `Dialog` renders closed on the server and calls `showModal()` or `show()` in an effect after mount; changing `modal` closes and reopens the same `<dialog>` host.
- `Collapsible` reconciles `<details open>` once on mount: an uncontrolled instance adopts a pre-hydration user toggle and notifies once, while a controlled instance restores its `open` prop.
- `"use client"` is placed only on modules that use React state, context, refs, or effects.
