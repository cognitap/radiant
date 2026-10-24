# Shared React composition and lifecycle

DEV-48 implements the private runtime seams approved by the
[shared contract](contracts/README.md). They ship inside the single Radiant
package and are not public exports or supported import subpaths.

| Module                              | Responsibility                                                              | Current consumers                                  |
| ----------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------- |
| `src/internal/ids.ts`               | Keep owned IDs first and deduplicate external ID references                 | Field, Input, Checkbox, Radio, Dialog              |
| `src/internal/events.ts`            | Activation guard → consumer → uncancelled library action                    | Button, Dialog actions/backdrop, Accordion trigger |
| `src/internal/selection.ts`         | Accordion membership, equality and single/multiple transitions              | Accordion                                          |
| `src/react/useComposedRefs.ts`      | Deliver one native host to library/caller refs, preserving callback cleanup | Checkbox, Radio, DialogContent                     |
| `src/react/useControllableState.ts` | Fixed state owner, initial default, accepted requests and no-op suppression | Dialog, Collapsible, Accordion                     |

The import check in `tests/architecture.test.mjs` keeps `internal` independent
of React and families. Shared bindings may import React, other bindings and
internal policy, but not families. A new external helper dependency requires
an explicit ownership/maintenance/packaging review before changing that check.
Do not introduce a provider or state engine for ordinary native controls.

## State requests and native observations

Dialog, Collapsible and Accordion choose controlled ownership when the state
prop is supplied, including `false` and the permitted `null`. Omit the prop for
uncontrolled ownership. Their defaults are initial snapshots. Supplying both a
controlled value and its default, switching ownership, or changing Accordion's
single/multiple type during a mount throws a descriptive error. Remount with a
new key for a new owner or type.

A request equal to current state does nothing. An uncontrolled accepted request
updates local state and notifies once; subsequent requests in the same event
use the last accepted value. A controlled request notifies the owner without
optimistically changing its value. A new callback is used on the next render.
Prop synchronisation and restoration are not semantic requests.

Native callbacks keep their platform meaning. Collapsible forwards root
`onToggle` observations, including changes caused by props or restoration, but
emits `onOpenChange` only when the native state differs from its owner. A
declined controlled toggle restores the native property; its later native event
must not manufacture another request. Nested toggle/close events do not change
their parent owner.

Text and selection inputs retain React/browser state, change, blur and reset
behavior. The shared state hook is not a replacement reset engine. The remaining
RadioGroup ownership/empty-value rules and monotonic Field metadata migrate in
the form-control stage.

## Activation and refs

Use `composeAction` for cancellable activation: disabled/pending guards run
before the consumer, then `defaultPrevented` decides whether the library
requests a change. Do not apply that cancellation policy to native change,
toggle or blur observations. Do not call a consumer handler again when one
family composes another. Default Dialog actions and existing native replacement
callbacks retain the same guard chain.

Use `useComposedRefs` when library DOM work and a caller ref need the same host.
It combines object refs and callback refs. A callback's returned cleanup runs
when detached; a callback without cleanup receives `null`, and object refs clear.
The composed ref stays stable while its input refs stay stable. Initialising a
native property before attaching a consumer ref must preserve that cleanup.
Mounted property updates must also work without unrelated ref detach/reattach.

The named native `render(props)` callbacks remain the public replacement
convention. DEV-117 aligns Button/Link presentation as variant, tone and
controlSize, inherited by default Dialog actions. DEV-118/119 retain native
navigation/adapter verification and fully resolved Dialog replacement
presentation; existing native Dialog adapters still own their presentation.
The existing shared action recipe has moved to `src/actionStyles.ts` so static
Link rendering does not call across Button's client boundary. The new
presentation mapping consumes that private seam; later adapters must reuse it
rather than extract another recipe.

## Mounted DOM work and server rendering

Native property effects act on their actual host. Dialog opens after mounting,
closes during cleanup, and closes/reopens the same host when `modal` changes.
An earlier queued close notification cannot dismiss a host that has already
reopened. Changed dismissal props and callbacks apply without remounting.
Checkbox keeps its mixed property current; Radio keeps the controlled reset
baseline current. Callback-ref cleanup is preserved through all three bindings.

No module reads browser globals or installs listeners/timers at import time.
There is no new shared listener/timer helper because these bindings do not
need one. Any future effect that installs a resource must use its host's
document/scope and return cleanup for update and unmount. Do not use a global
document to operate on a host in another iframe.

Server markup and the initial hydrated tree retain the same generated IDs and
relationships. A server Dialog stays closed until its mounted effect opens it.
Client directives belong to interactive/context/hook modules; the package
entry, static Card/Link rendering and pure policy stay outside a blanket client
boundary. Client directives do not prevent ordinary React server rendering.

`tests/composition-lifecycle.test.mjs` exercises these rules through public
families and hooks. The architecture test verifies private imports and server
execution without browser globals. `tests/browser/platform.test.tsx` verifies
native keyboard, declined requests, changed modal/dismissal props, StrictMode,
iframe cleanup and hydration. All run in the [required verification gate](testing.md).
