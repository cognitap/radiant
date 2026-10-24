# Radiant shared contract

Decision baseline for [DEV-104](https://linear.app/cognitap/issue/DEV-104),
24 October 2026. This is the canonical target for the harmonisation sequence,
not a claim that these interfaces already ship. The current source and package
retain their existing behavior until their owning migration issues land. DEV-44
now implements the theme model; [the theming guide](../theming.md) describes its
shipped API and concrete defaults. Component presentation and composition
contracts below remain targets for their owning stages.

Read [the glossary](../../GLOSSARY.md) for terminology,
[the migration inventory](./migration.md) for current-to-target mappings, and
[the acceptance sketches](./examples.tsx) for concrete usage. The sketches use
[declarations](./target.d.ts) for future component APIs and the real package
types for the implemented theme API.

## Decisions at a glance

| Concern               | Decision                                                                                  | Delivery owner                         |
| --------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------- |
| Internal architecture | Owned, private, React-independent behavior; thin React bindings where justified           | DEV-42; implementation DEV-48          |
| Appearance            | Shared semantic tokens, one typed theme definition, narrow component overrides            | DEV-105; implementation DEV-44         |
| Action presentation   | `variant`, `tone`, `controlSize` have distinct meanings                                   | DEV-105; implementation DEV-117/118    |
| Native state          | Keep `value`, `checked`, `open` and native events; one owner per axis                     | DEV-43; implementation DEV-48/123/128  |
| Composition           | Named parts; default Dialog actions compose Button                                        | DEV-45; implementation DEV-119         |
| Replacement           | One `render(props)` callback convention where replacement is supported                    | DEV-45; implementation DEV-48/118/119  |
| Targeting             | Root props/ref reach the documented host; composed part identities accumulate             | DEV-45; implementation DEV-124/127/128 |
| Examples              | One control, one native form, the same form inside Dialog, optional real TanStack adapter | DEV-106; live examples DEV-125/130     |

## 1. Architecture and ownership

Radiant remains one publishable package. Foundation internals are private; a
second framework adapter and a separately published core are deferred. Zag is
architectural evidence, not a dependency or a requirement to reproduce a state
machine for every native element.

| Responsibility                                                    | Owner                                                                    | Examples                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Reusable transitions, selection rules and semantic relationships  | Private TypeScript modules, independent of React and Cognitap            | Accordion single/multiple selection; ID-list combination                        |
| Browser behavior that already satisfies the contract              | Native element/browser                                                   | Button activation, radio grouping, details/summary, modal dialog                |
| Reusable mounted DOM helpers                                      | Private TypeScript modules accepting their document/element dependencies | Listener cleanup or focus work only when actual shared use justifies extraction |
| Rendering, contexts, state hooks, event/ref adaptation, lifecycle | React bindings and family roots                                          | Field context; Dialog mounting; mapping native events to a change request       |
| Presentation decisions                                            | Shared tokens and explicit component overrides                           | Control metrics, surface shape, focus and motion                                |
| Names, content, validation, routing, fetching, persistence        | Consumer                                                                 | Form errors, submission, router link adapter, theme preference storage          |

The intended internal organisation is `src/internal/` for reusable
React-independent policy and DOM helpers, and `src/react/` for shared React
bindings. Existing family files may stay at `src/`. These directories are created
only when code is actually extracted; DEV-104 does not introduce empty layers.

Import rules:

1. `internal` may import other internal modules and justified narrow dependencies;
   it may not import React, a React binding, a family module, or Cognitap code.
2. `react` may import `internal` and React; shared bindings do not import family
   modules. Family-to-family composition is explicit in the consuming family.
3. Family rendering may depend on shared bindings, internal policy and another
   family with the responsibility it needs. Accordion uses Collapsible; RadioGroup
   uses Field; Dialog actions use Button. Dependencies must remain acyclic.
4. No module reads `window`/`document`, installs listeners, changes theme state or
   mutates the DOM at import time. Mounted effects use the owning document and
   clean up on update/unmount, including React remounts and changed callbacks.
5. Server markup and the first client render agree. Native dialog opening is a
   mounted effect; `defaultOpen` does not justify rendering a falsely modal
   server dialog. Preserve specific client directives instead of making the
   package entry universally client-only.

Extract a shared module only for a real repeated policy or a seam that already
varies. Native controls remain native controls. A dependency is justified only
when its narrow responsibility, accessible behavior, maintenance, runtime cost,
SSR lifecycle and declared packaging requirements have been checked. Broad
Base/Radix/Zag adoption is outside this decision.

## 2. Presentation vocabulary

Actions use three independent concepts:

| Prop                | Values                                   | Default  |
| ------------------- | ---------------------------------------- | -------- |
| `variant` on Button | `solid`, `soft`, `outline`, `ghost`      | `solid`  |
| `variant` on Link   | Those four, plus `inline`, `subtle`      | `inline` |
| `tone`              | `accent`, `neutral`, `warning`, `danger` | `accent` |
| `controlSize`       | `small`, `medium`, `large`               | `medium` |

`soft` preserves the useful quiet filled treatment currently called secondary;
it is independent of the neutral palette. `tone` selects a palette pair, while
`variant` selects its treatment. These axes do not require every possible
combination to receive its own example or public component. Input, Checkbox,
Radio and RadioGroup share `controlSize`; they do not acquire action variants.
RadioGroup supplies the inherited visual size; an explicit Radio size may
override it. Other roots do not acquire meaningless sizing props.

Native `Input.size` remains a number of characters, `type` remains the native
type, and `value` on a checkbox/radio remains its submitted value. The old
Button/Link visual `size` migrates to `controlSize`; `default` becomes `medium`.
Radius is a theme/component override or ordinary local CSS decision, not an
independent Button/Link-only public prop axis. Existing `pending`, `iconOnly`,
`fullWidth`, Link `external`, heading `level` and other purposeful conveniences
remain family-specific.

Button defaults to `type="button"`. Pending suppresses activation while retaining
focus and its accessible name, and exposes busy state. Disabled uses native
disabled behavior. Link always navigates as an anchor, including when it looks
like a Button; it has no invented native `disabled`/`pending` behavior. Shared
action presentation must adapt hover/active selectors for anchors rather than
copying button-only `:enabled` selectors.

## 3. One theme model

The target authoring entry is `defineTheme({ id, name, tokens, components, modes })`.
`id` is a stable slug and `name` is a human-readable label. `tokens` and
`components` are typed partial overrides of library defaults; `modes.light` and
`modes.dark` may override the same typed groups. Arbitrary unknown token names
are errors. `themes` is the readonly preset registry, selected by ID.

Shared token roles:

| Group        | Keys                                                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`      | `surface`, `foreground`, `mutedForeground`, `border`, `placeholder`, `disabledBackground`, `disabledBorder`, `invalid`, `focus`; `accent`, `neutral`, `warning`, `danger` and each corresponding `Foreground` |
| `typography` | `family`, `bodySize`, `smallSize`, `headingSize`, `bodyWeight`, `labelWeight`, `headingWeight`, `letterSpacing`                                                                                               |
| `control`    | `small`, `medium`, `large`, each with `height`, `paddingInline`, `fontSize`, `indicatorSize`; also `radius`, `cornerShape`, `borderWidth`, `borderStyle`                                                      |
| `surface`    | `canvas`, `radius`, `cornerShape`, `borderWidth`, `borderStyle`, `padding`, `gap`, `shadow`, `overlayShadow`, `backdrop`                                                                                      |
| `focus`      | `width`, `offset`, `style`                                                                                                                                                                                    |
| `motion`     | `pressDuration`, `pressEase`, `releaseDuration`, `releaseEase`, `colorDuration`, `disclosureDuration`                                                                                                         |
| `spacing`    | `labelGap`, `fieldGap`, `groupGap`, `headerGap`, `footerGap`                                                                                                                                                  |
| `state`      | `disabledOpacity`                                                                                                                                                                                             |

`color` values are CSS colors. `surface.canvas` and `surface.backdrop` are CSS
backgrounds, so canvas may be a gradient; Button's backdrop filter is a distinct
component override. Lengths/durations/easings are CSS strings, and weights may be
numbers or strings. `disabledOpacity` is a number from 0 to 1. Values may reference
CSS variables; this contract does not promise to validate arbitrary CSS grammar.
Concrete default values are documented in [the theming guide](../theming.md).

Shared custom properties use `--rad-` followed by the kebab-case token path,
such as `--rad-color-accent` and `--rad-control-medium-height`. Component
overrides use `--rad-<component>-<key>`, such as `--rad-button-radius`.
The migration inventory records old names and destinations. New public CSS
variables must be generated from one registry rather than maintained as a
second handwritten vocabulary. Tailwind utility aliases/merge groups are
implementation details; public theme variables have the same behavior through
both styling routes.

Components resolve **local component override → shared semantic role → neutral
baseline**. Global values never fall back through another family's overrides.
A Button-only font or uppercase treatment need not become body typography;
authors explicitly choose when a value belongs in shared tokens. Radio remains
circular by default, even when shared control shape is a squircle. Shared
disabled opacity is applied once to the relevant visual unit, not repeatedly
through a Field and its already-dimmed child.

### Scope and mode rules

The compiled stylesheet supplies a complete neutral baseline, with light/dark
and system preference support, without a provider. The optional `ThemeScope`
is a normal `div` with normal host props/ref. It applies theme, canvas,
foreground and body typography only to its own subtree; it does not mutate the
document, install a global provider or persist a preference.

- No `theme`: inherit the current theme. No `mode`: inherit the current mode;
  the application baseline defaults to `system`.
- An explicit named theme starts from library defaults plus that theme, not
  the ancestor theme. Resolve library mode defaults, theme common values, then
  that theme's selected mode overrides. Missing values use defaults for that
  mode; never advertise a light-only color set as verified dark appearance.
- Materialise the full documented shared token set and reset omitted component
  overrides. Nested `default` must remove an outer Ticket font, border or press
  effect rather than merely apply an empty style object. Reset local override
  slots to their fallback semantics, not a frozen copy that defeats later
  subtree shared-token changes.
- A partial ordinary CSS/style override inherits within its existing scope.
  Selecting another named theme establishes a fresh scope. Explicit local
  `style` wins over generated values on that host; matching caller classes use
  the documented class merge rule and normal CSS cascade.
- `mode="light" | "dark" | "system"` is independent of theme ID. System mode
  follows preference through CSS media rules, keeping server/first-client
  markup stable. Theme selection itself does not silently read browser storage.
- A native top-layer dialog remains in its DOM scope. A future portal that moves
  content elsewhere must explicitly propagate scope; portal support is not
  silently promised by this design.

Storybook will consume this same registry/mechanism through one toolbar
selector and central canvas/docs application. Its comparison page is the
intentional nested-scope example, not a second theme implementation.

## 4. State and forms

Each state axis has one owner for its mounted lifetime. `undefined` means the
controlled prop is omitted; `false`, `''`, and permitted `null` are explicit
values. Do not pass a controlled prop and its default together or switch
ownership/type during the same mount. Remount with a new key for a new owner.
No silent fallback to a different owner is supported. Controlled read-only
native inputs follow React's `readOnly` convention.

| Family                    | Controlled/default state     | Notification                                                                       | Empty state                                   |
| ------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------- |
| Text Input                | `value` / `defaultValue`     | Native `onChange(event)`, `onBlur(event)`                                          | `''`; controlled text is never null/undefined |
| Checkbox/standalone Radio | `checked` / `defaultChecked` | Native `onChange(event)`, `onBlur(event)`                                          | `false`; `value` is submitted data            |
| RadioGroup                | `value` / `defaultValue`     | `onValueChange(string)` for user selection, plus optional native `onChange(event)` | `null`; `''` remains a valid option value     |
| Dialog/Collapsible        | `open` / `defaultOpen`       | `onOpenChange(boolean)`                                                            | `false`                                       |
| Accordion single          | `value` / `defaultValue`     | `onValueChange(string \| null)`                                                    | `null`                                        |
| Accordion multiple        | `value` / `defaultValue`     | `onValueChange(string[])`                                                          | `[]`                                          |

Input types outside the text-value case keep their native type-specific
semantics: file inputs are not made controlled, and Input does not become a
checkbox/radio abstraction. Checkbox's `indeterminate` is a separate visual
DOM property owned by its supplied prop, not a third submitted checked value;
the consumer recomputes it after reset when it derives from other selections.

Composite defaults are initial snapshots. Changing them does not synchronise
live state. Native defaults retain React/browser initialization and reset
semantics, rather than a new custom reset engine; remount for an unambiguous
new baseline. An accepted user request updates uncontrolled state; a controlled
consumer may decline it and the rendered/native state must reconcile to the
unchanged prop. Prop synchronisation, restoration and no-op requests do not
emit another semantic change request. Native `onChange`, `onBlur`, `onToggle`
and similar callbacks remain native event observations; they do not manufacture
semantic requests during reconciliation. Native notification timing is not
changed to simulate identical behavior across unrelated elements.

RadioGroup owns name and selection in both modes. An option's `name`, `checked`
or `defaultChecked` cannot overrule its group; conflicting child ownership is
unsupported and must be diagnosed during development. Radio may still be
used independently with native props. Group `onChange` observes the native
radio event; `onValueChange` supplies a convenient selected string. A consumer
writes its state through one callback, never both. Clearing a controlled group
uses `value={null}`; it is not a fake option or a user radio-selection callback.

Field owns labels, descriptions, required/invalid relationships and error
presentation. It does not own values, dirty/touched flags, validation timing,
submission or reset. Error presence means invalid; the consumer decides when
to show it and formats arbitrary validator output into renderable content.
Disabled inheritance is monotonic: a disabled owner cannot be re-enabled by
a child's `disabled={false}`. Preserve native disabled fieldset behavior,
including the first-legend exception for arbitrary native content. Required
Field metadata is also monotonic: a required Field or group stays required even
if a child supplies `required={false}`. A control may add a requirement when its
Field is optional. The visible marker and native validity must agree; arbitrary
native content in a fieldset retains its actual platform behavior.

A native form reset restores uncontrolled native inputs; it must not
independently overwrite controlled state. A controlled adapter resets its own
values and validation metadata. Reset does not change Dialog/Collapsible/
Accordion open/selection state. Their closed content remains mounted and keeps
its existing form association; no nested forms are introduced by Dialog.

TanStack Form is an optional reference adapter, not a dependency of Radiant's
runtime. Text input forwards `currentTarget.value` to `handleChange`, Checkbox
forwards `currentTarget.checked`, and RadioGroup forwards its selected value.
Native blur calls `handleBlur`; for a group, filter `relatedTarget` containment
if marking touched should mean focus left the whole group. Adapter validation,
error formatting, submit and reset remain explicit. No implicit field
registration or hidden form-state provider is introduced.

## 5. Public parts and composition

Keep the current flat PascalCase family/part exports and `<Family>Props` names.
Simple controls stay simple. Compound families expose the named parts needed
for their real anatomy; a convenience prop does not require a new primitive.
Public `useField`/`useDialog`/`useCollapsible`/`useAccordion` read their family
context and return null outside it; parts requiring a root fail clearly when
misplaced. Internal binding helpers do not become public by accident.

| Family/part                    | Host and prop/ref target                            | Composition/ownership                                                       |
| ------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------- |
| Button                         | `button`                                            | Native action; owns its pending presentation                                |
| Link                           | `a`                                                 | Navigation, even for action-shaped variants                                 |
| Field control                  | `div`                                               | Owns label/description/error; `controlId` names the control                 |
| Field group                    | `fieldset`                                          | Owns legend/description/error; props/ref typed as fieldset                  |
| Input                          | `input`                                             | Inherits Field relationships; otherwise standalone                          |
| Checkbox/Radio                 | Native `input`, even when convenience label exists  | Optional wrapper/label styles use `parts`, not root prop misdirection       |
| RadioGroup                     | Field's `fieldset`, not the options wrapper         | Composes Field; `parts.options` targets the option layout                   |
| Dialog                         | No DOM host; no pretend `className`/`style`/DOM ref | Logical open-state owner                                                    |
| DialogTrigger/Close            | One `button`, through Button by default             | Button presentation plus protected Dialog behavior                          |
| DialogContent                  | `dialog`                                            | Modal/nonmodal native lifecycle                                             |
| DialogTitle/Description        | `h2` / `p`                                          | Owned relationships; meaningful text from consumer                          |
| Collapsible/Trigger/Content    | `details` / `summary` / `div`                       | Native disclosure, no nested action inside summary                          |
| Accordion/Item/Trigger/Content | `div` / Collapsible `details` / `summary` / `div`   | Accordion selection over Collapsible behavior; trigger heading uses `level` |
| Card/Header/Content/Footer     | `div`                                               | Passive grouping, not a control or implicit region                          |
| CardTitle/Description          | Heading selected by `level` / `p`                   | Consumer owns outline and text                                              |

`className`, `style`, native props and `ref` always reach the documented host.
Convenience assemblies use a narrow `parts` map of `className`/`style` hooks for
their internal named parts: Field `label`, `description`, `error`, `required`;
Checkbox/Radio `wrapper`, `label`, `indicator`; RadioGroup also `options`.
These hooks do not replace computed IDs, ARIA, event handlers or root refs.
Consumers use explicit compound parts for different structure where offered.

Field's layout is a discriminated native-prop/ref union. In control layout,
`controlId` explicitly sets the owned ID; otherwise generate one stably through
SSR/hydration. Radiant inputs read Field context. A native/custom adapter uses
`children(controlProps)` and forwards those props to its one control. Retire
implicit native-host child cloning. In group layout, children are normal nodes
and the root is a fieldset. A conflicting child ID must not silently disconnect
the label; set it through `controlId`. Explicit external description IDs are
deduplicated and appended to the owned description/error IDs. Consumer
`aria-invalid` may add an invalid reason but cannot erase an active owned error.

### Stable identity through composition

`data-slot` becomes a space-separated set of public part identities. Use
`[data-slot~="button"]`, not equality selectors, for a part that may be composed.
Composed modules preserve base identities and append their own:

| Part                        | Identity tokens                                                                   |
| --------------------------- | --------------------------------------------------------------------------------- |
| Dialog trigger / close      | `button dialog-trigger` / `button dialog-close`                                   |
| RadioGroup root             | `field radio-group`                                                               |
| Accordion item              | `collapsible accordion-item`                                                      |
| Accordion trigger / content | `collapsible-trigger accordion-trigger` / `collapsible-content accordion-content` |

Other parts retain their current descriptive token (`card-title`, `field-error`,
and so on). Computed identities cannot be overwritten with arbitrary consumer
data attributes. Style a family locally using its identity or component
override; the composed base should still receive its intended styling.

Boolean state attributes use presence (`data-disabled`, `data-required`,
`data-invalid`, `data-pending`); enumerated states use `data-state` (`open`/
`closed`, `checked`/`unchecked`/`indeterminate`) only on relevant elements.
Presentation attributes are `data-variant`, `data-tone`, `data-control-size`.
They reflect resolved effective state/defaults, including inherited disabled
and group size. ARIA and native state remain authoritative for accessibility.

### Replacement and event rules

Where replacement is needed (Link router integration and Dialog actions),
`render(resolvedNativeProps)` returns one compatible element. The resolved props
include native attributes/ref, merged presentation, children and protected
relationships. Forward them to the actual anchor/button host. Returning a
fragment, dropping the ref/relationships or changing the native responsibility
is unsupported. No `as`, `asChild` or unrelated second replacement convention
is added. Field's control-prop callback is explicit accessibility adaptation,
not replacement of Field's host.

Default Dialog actions render Button. Their presentation options have the same
meanings as Button; no separate Dialog action style recipe exists. A replacement
does not create a nested Button inside a button. Link shares presentation policy
with Button but keeps its anchor implementation.

For a cancellable action, guards for native disabled/pending state run first,
then the consumer handler, then the library state request if
`event.defaultPrevented` is false. A replacement must preserve this chain; do not
compose the same consumer handler twice. Non-cancelable observations (such as
native change/toggle/blur) cannot veto the browser by this rule; a controlled
owner can decline a semantic change request and reconcile state instead.
Mandatory relationships, disabled/pending guards and cleanup cannot be removed
by overriding arbitrary props.

Caller classes merge after defaults through the existing class conflict policy;
caller style properties override generated style on the same host. Preserve the
supported Tailwind route for new utility classes. Ordinary consumers use compiled
CSS and ordinary CSS/style overrides. Ref composition delivers the same real host
to library and caller refs, including object refs and React callback-ref cleanup
functions; don't assume every callback ref is a void assignment.

### Functional CSS obligations

Theme and host replacement may change appearance, but must preserve closed
details/dialog content visibility, dialog geometry/scroll containment and native
modal behavior, control and label hit targets, and accessible names/relationships.
Decorative marks stay hidden from assistive technology; visually replacing a
native checkbox/radio must leave its real control operable and focus-visible.
Do not hide active controls or erase focus, invalid, disabled or pending cues.
Preserve forced-colors readability, reduced-motion alternatives and sufficient
contrast for each supported state/mode. A replacement that drops required
classes or hides the focusable host has not preserved the contract even if its
props type-check. The corresponding migration must identify and verify its
functional styles before considering new presentation supported.

Built-in English text/required markers are replaceable through children or the
existing specific props; decorative indicators stay hidden from assistive
technology. Full localization, RTL guarantees and translation packs remain
deferred. Consumers still supply meaningful accessible names.

## 6. Acceptance specifications and handoff

Run `pnpm typecheck:contracts`. It compiles declaration-only target sketches
with strict React types and the installed TanStack dependency. It also checks
rejections of contradictory state/default props, invalid presentation vocabulary,
native-size misuse and mismatched Field refs. This proves internal consistency
and adapter type feasibility, not runtime implementation or accessibility.

| Sketch                    | Acceptance scenario for the owning migration                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Standalone control        | One named theme and local Button override; native Input.size stays numeric; cancel an action before its state request                          |
| Native form               | Field labels/help/errors, text/checkbox/radio data, submit/reset and Button/Link actions share one theme; a disabled owner cannot be escaped   |
| Same form in Dialog       | Reuse the fields/actions with one form host inside DialogContent; Trigger/Close are Button by default; focus restoration and cancellation work |
| Optional TanStack adapter | Values/blur/errors/reset owned by the adapter; no duplicate change writes or unrenderable validator objects                                    |

Required future behavior cases include controlled request rejection, no-op/
reconciliation callback suppression, default changes, controlled mode switches,
empty/null radio selection, reset after an actual controlled checkbox change,
nested theme default reset, group blur moving internally versus leaving, public
part targeting and SSR/hydration/remount cleanup. Existing tests are useful
evidence, but their current behavior does not override these decisions.

DEV-44 implements shared tokens/themes; DEV-48 implements shared runtime/ref
policy; DEV-46/47 own test tooling and evidence conventions. DEV-117–130 apply
the component and example migrations; DEV-132–135 consolidate the actual
implementation and consumer guide. DEV-57 remains the installed-package proof.
Do not mark those deliverables complete from these sketches. A later change to
this decision must update this contract, its migration map, declarations and
examples together rather than introducing a second guide.

### Reference checks

Native ownership and callback conventions are checked against
[React's input reference](https://react.dev/reference/react-dom/components/input).
Adapter-owned validation timing and error formatting are checked against
[TanStack Form's validation guide](https://tanstack.com/form/latest/docs/framework/react/guides/validation)
and the installed dependency's types. These sources support native/adapter facts;
Radiant's vocabulary, theme scopes and composition conventions above are our
design decisions, not claims that those projects prescribe them.
