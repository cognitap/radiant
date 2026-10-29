# React bindings

The private modules behind the public behavior in
[architecture](architecture.md). They are not exports or supported import
paths.

| Module                              | Responsibility                                                              | Current consumers                                       |
| ----------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------- |
| `src/internal/ids.ts`               | Keep owned IDs first and deduplicate external ID references                 | Field, Input, Textarea, Checkbox, Radio, Dialog         |
| `src/internal/events.ts`            | Activation guard → consumer → uncancelled library action                    | Button, Dialog actions/backdrop, Accordion trigger      |
| `src/internal/selection.ts`         | Accordion membership, equality and single/multiple transitions              | Accordion                                               |
| `src/react/useComposedRefs.ts`      | Deliver one native host to library/caller refs, preserving callback cleanup | Checkbox, Radio, DialogContent, Collapsible             |
| `src/react/useControllableState.ts` | Fixed state owner, initial default, accepted requests and no-op suppression | Dialog, Collapsible, Accordion                          |
| `src/react/useNativeOwner.ts`       | Diagnose mixed owners and mode changes without storing native values        | Input, Textarea, Checkbox, standalone Radio, RadioGroup |

`tests/architecture.test.mjs` enforces the import rules: `internal` never imports
React or a family, and bindings never import a family. Adding an outside helper
dependency needs a review of ownership, maintenance and packaging first. Don't
add a provider or state engine for plain native controls.

## State

- A request equal to the current state does nothing.
- An uncontrolled request updates local state and notifies once. Later requests
  in the same event see that new value.
- A controlled request only notifies; the value changes when the prop does.
- Prop syncs and restorations are not requests and fire no callback.
- Collapsible forwards every native `onToggle`, but fires `onOpenChange` only
  when the native state differs from its owner. A refused controlled toggle
  restores the native state without firing again.
- Nested toggle and close events never change a parent owner.
- Input, Textarea, Checkbox and Radio keep React and browser change, blur and reset
  behavior. The state hook is not a reset engine.
- RadioGroup owns the name and selection, and options cannot supply their own.
- Field's private `useFieldControl` resolves IDs, descriptions, required, error
  and disabled for all three control types. A plain Field group does not make
  every checkbox required.

## Activation and refs

`composeAction` runs disabled and pending guards, then the consumer handler,
then the library request if `defaultPrevented` is false. Use it only for
cancellable activation, never for change, toggle or blur. When one family
composes another, don't call the consumer handler twice.

`useComposedRefs` gives library and caller refs the same host. It handles object
refs and callback refs, runs a callback's returned cleanup on detach, and stays
stable while its inputs do.

Button prepares its classes, guarded handler and children once, then renders its
host or calls `render`. DialogTrigger and DialogClose always compose Button and
add only Dialog relationships, identities and open/close requests.
`DialogRenderProps` is `ButtonRenderProps`. Link forwards its ref and handlers
directly, and a router adapter owns interception. The shared action styles live
in `src/actionStyles.ts`, so Link can render on the server without crossing
Button's client boundary.

## Effects and server rendering

- Effects act on their own host and its document, never the global `document`,
  so iframes work.
- Dialog opens after mount, closes on cleanup, and reopens the same host when
  `modal` changes. A queued close cannot dismiss a dialog that has reopened.
- Checkbox keeps its `indeterminate` property current.
- Nothing installs listeners or timers at import time. Any new effect that does
  must clean up on update and unmount.
- Server markup and the first client render share IDs and relationships. A
  server-rendered Dialog stays closed until its effect opens it.
- Collapsible reconciles its native host once at mount. Local state adopts a
  completed pre-hydration toggle and notifies once; controlled hosts restore
  their owner's value silently. Accordion's root owns its item hosts. Only the
  editable details host suppresses expected hydration attribute warnings.
- `use client` goes only on interactive, context and hook modules. The package
  entry, Card, static Link and pure policy stay server-safe.

These rules are tested in `tests/composition-lifecycle.test.mjs`,
`tests/architecture.test.mjs` and `tests/browser/platform.test.tsx`.
