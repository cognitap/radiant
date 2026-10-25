# Shared React composition and lifecycle

The [system guide](system.md) describes public state, event and ref conventions.
This reference covers the private runtime seams delivered by DEV-48 under the
[harmonisation design record](contracts/README.md). They ship inside the single
Radiant package and are not public exports or supported import subpaths.

| Module                              | Responsibility                                                              | Current consumers                                  |
| ----------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------- |
| `src/internal/ids.ts`               | Keep owned IDs first and deduplicate external ID references                 | Field, Input, Checkbox, Radio, Dialog              |
| `src/internal/events.ts`            | Activation guard → consumer → uncancelled library action                    | Button, Dialog actions/backdrop, Accordion trigger |
| `src/internal/selection.ts`         | Accordion membership, equality and single/multiple transitions              | Accordion                                          |
| `src/react/useComposedRefs.ts`      | Deliver one native host to library/caller refs, preserving callback cleanup | Checkbox, Radio, DialogContent                     |
| `src/react/useControllableState.ts` | Fixed state owner, initial default, accepted requests and no-op suppression | Dialog, Collapsible, Accordion                     |
| `src/react/useNativeOwner.ts`       | Diagnose mixed owners and mode changes without storing native values        | Input, Checkbox, standalone Radio, RadioGroup      |

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
behavior. The shared state hook is not a replacement reset engine. RadioGroup
chooses one name/selection owner; null clears a controlled group,
while an empty string remains a real option value. Its uncontrolled default is
an initial snapshot, with native radio selection and reset. Group options may
not supply a competing name or checked/defaultChecked owner. Group change
observations and convenience selection callbacks remain native-event driven;
prop synchronisation and reset do not manufacture requests.

Field's private useFieldControl adapter resolves owned IDs, required/error
relationships, deduplicated descriptions and disabled inheritance for all three
native control families. Group descriptions stay on their fieldset; a plain
Field group does not make every checkbox required. RadioGroup applies its
required state to native radios, which validate one selection together. Native
content retains its platform fieldset behavior, including the first legend.

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
controlSize, inherited by default Dialog actions. DEV-118 implements Link's
resolved native anchor/ref contract and native navigation/adapter verification.
Link forwards the ref and handlers directly; its router owns any interception.
DEV-119 makes Button own `render(resolvedNativeProps)` and compatible button-host
validation. Button prepares its merged classes, guarded activation and rendered
children once, then renders its default host or calls the replacement callback.
DialogTrigger/Close inherit ButtonProps and always compose Button, adding only
protected Dialog relationships, action identities and cancellable open/close
requests. DialogRenderProps aliases ButtonRenderProps; there is no parallel
replacement implementation or cross-family presentation resolver.

Select variant/tone/controlSize on Button or the Dialog action, then forward the
resolved props/ref/children to one button. Do not pass resolved children through
another Button or compose its handler again. Button retains its base identity
when composed slots are added; Dialog protects its accumulated identities and
native relationships.

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
