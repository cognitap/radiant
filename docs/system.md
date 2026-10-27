# Radiant system guide

Use this guide to theme, compose and customise the ten families in the current
source: Button, Link, Field, Input, Checkbox, RadioGroup (including Radio),
Dialog, Collapsible, Accordion and Card. Their public props and types are in the
[README](../README.md) and package declarations. Changes under
[Unreleased](../CHANGELOG.md#unreleased) require a release before npm consumers
can use them; keep JavaScript and CSS on the same version. Radiant remains
experimental during 0.x.

## Compose by responsibility

Use Button for actions and Link for navigation, including when a Link looks
like a button. Use Field for label/help/error relationships, and native controls
for values and selection. Card groups content; Dialog owns open state and its
native modal lifecycle; Collapsible owns a disclosure; Accordion composes
Collapsible for a selection of sections.

DialogTrigger and DialogClose compose Button in both default and replacement
paths. They accept Button's presentation and `render` interface. RadioGroup
composes Field. Action-shaped Link shares Button's presentation while retaining
an anchor. Reuse these families when assembling an interface so their theme,
keyboard behavior and relationships travel together.

Action presentation uses three independent choices:

| Prop          | Values                                                                    | Default                       |
| ------------- | ------------------------------------------------------------------------- | ----------------------------- |
| `variant`     | `solid`, `soft`, `outline`, `ghost`; Link also accepts `inline`, `subtle` | Button `solid`; Link `inline` |
| `tone`        | `accent`, `neutral`, `warning`, `danger`                                  | `accent`                      |
| `controlSize` | `small`, `medium`, `large`                                                | `medium`                      |

Input, Checkbox, Radio and RadioGroup share `controlSize`. Input's numeric native
`size` still measures character width. A variant selects treatment; a tone
selects its semantic palette.

## Set up styles and themes

Choose one CSS route: import `@cognitap/radiant/styles.css` once for compiled
styles, or import `@cognitap/radiant/tailwind.css` alongside your application's
Tailwind entry. The reset is a separate opt-in import. Compiled CSS supplies a
neutral light/dark baseline without a provider. Follow the
[setup examples](../README.md#usage) and [Tailwind route](../README.md#with-tailwind).

Author a theme with `defineTheme({ id, name, tokens, components, modes })`.
It validates typed partial definitions and resolves immutable light/dark maps.
Choose a built-in preset from the readonly `themes` registry by stable `id`, or
use its named export, such as `radiant`, `glass` or `defaultTheme`. Load preset
fonts in your application; choosing a theme never downloads a font. The
[theming reference](theming.md#define-and-apply-a-theme) owns the authoring
example, token defaults, preset IDs, font families/weights and migration steps.

For public workshop editing, use the versioned `ThemeDocument` authoring API.
Its token sections compile through `defineTheme` into the same `ThemeScope`
contract. Section imports preserve unrelated settings and deliberate component
exceptions. See [portable documents and import semantics](theming.md#portable-workshop-documents). The pure
`generateTypography` interface and `typography.typesetting` recipe supply opt-in
font assignments, 16 text styles and independent prose/UI rhythms through the
same compiler. Use the semantic HTML hooks and local container documented under
[responsive typography](theming.md#responsive-typography); existing component
typography retains its legacy leaves until its deliberate adoption. The pure
`generateColorWall` interface supplies calibrated sRGB palette metadata through
`@cognitap/radiant/color`; see [color-wall inputs and output](theming.md#generate-a-color-wall). Use
`colorCalibrationPresets` for independent wall/ramp treatments (Classic, Balanced,
Expressive; Balanced by default), and `recommendColorPalette` to select a limited working set, map light/dark color and
canvas layers, and inspect named contrast pairs before compiling a theme.
Apply these together with bounded geometry using `updateThemeAppearance`; it
updates existing spacing, control and surface roles without removing authored
component exceptions. See [appearance settings](theming.md#apply-palette-spacing-and-surfaces-together).

| Token group  | Shared responsibility                                                              |
| ------------ | ---------------------------------------------------------------------------------- |
| `color`      | Surface, foreground, borders, focus, invalid/disabled colors and action tone pairs |
| `typography` | Body, label and heading font decisions                                             |
| `control`    | Small/medium/large metrics, control shape and borders                              |
| `surface`    | Canvas background, panel shape, spacing, elevation and backdrop                    |
| `focus`      | Outline width, offset and style                                                    |
| `motion`     | Press/release, color and disclosure timing                                         |
| `spacing`    | Label, field, group, header and footer gaps                                        |
| `state`      | Disabled opacity                                                                   |

Apply a theme with `ThemeScope`, a normal `div` whose props/ref target that
host. `mode` is independently `light`, `dark` or `system`; system follows the
browser preference through CSS. Omitted theme/mode inherit. An explicit named
theme starts afresh from library defaults, then common values, then its mode
layer. Nested `defaultTheme` resets inherited effects as well as colors.

Within a scope, precedence is **component override → shared role → neutral
baseline**. Promote a decision to `tokens` when it should affect several
families; put a deliberate exception in `components.<family>`. Button-only
fonts/effects stay action-local. `components.radioGroup.gap` spaces options;
`components.radio.labelGap` spaces an option's label. Passive surfaces use
surface roles, and Radio stays round by default.

Use `ThemeComponentOverrides` for reusable component configuration and
`ThemeStyle` for local `style` values. Public CSS variables follow their typed
paths: `tokens.control.radius` becomes `--rad-control-radius`, and
`components.input.radius` becomes `--rad-input-radius`. Local styles override
generated values on the same host; caller classes merge after defaults. Use the
Tailwind route to generate new utility classes supplied by your application.

A mode-only scope re-materialises its selected theme. Put token exceptions that
must survive it on a ThemeScope's inline `style` or in the theme definition;
intervening ordinary DOM/stylesheet overrides are not recovered automatically.
A new named theme clears inherited exceptions. See the precise
[scope and override rules](theming.md#scopes-mode-and-overrides).

## Find the actual styling and ref target

Root `className`, `style`, native attributes and `ref` reach the documented
host. A convenience label does not move input props to its wrapper.

| Public family / parts                                           | Host and target                                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Button / Link                                                   | `button` / `a`, including through a compatible `render` adapter                                          |
| Field                                                           | `div` in control layout; `fieldset` in group layout                                                      |
| Input / Checkbox / Radio                                        | Native `input`; Checkbox/Radio wrapper, label and indicator use `parts`                                  |
| RadioGroup                                                      | Field's `fieldset`; `parts.options` styles its internal option grid                                      |
| Dialog                                                          | Logical state owner with no DOM/style/ref target                                                         |
| DialogTrigger / DialogClose                                     | Button's `button` host                                                                                   |
| DialogContent / DialogTitle / DialogDescription                 | `dialog` / `h2` / `p`                                                                                    |
| Collapsible / CollapsibleTrigger / CollapsibleContent           | `details` / `summary` / `div`                                                                            |
| Accordion / AccordionItem / AccordionTrigger / AccordionContent | `div` / Collapsible `details` / `summary` / `div`; trigger `level` adds a heading without moving the ref |
| Card / CardHeader / CardContent / CardFooter                    | Passive `div` hosts                                                                                      |
| CardTitle / CardDescription                                     | Heading selected by `level` / `p`                                                                        |

Field exposes `parts.label`, `description`, `error` and `required`;
Checkbox/Radio expose `parts.wrapper`, `label` and `indicator`. RadioGroup adds
`parts.options` to Field's hooks. Each hook accepts only `className` and `style`.
Use the explicit compound parts for layout where a family provides them.

`data-slot` is a set of identity tokens. Select with membership, for example
`[data-slot~="dialog-trigger"]`. Composed identities retain their base:
`button dialog-trigger`, `button dialog-close`, `field radio-group`,
`collapsible accordion-item`, `collapsible-trigger accordion-trigger`, and
`collapsible-content accordion-content`. Caller identities are additive only
where the family's props support them; owned identities remain protected.

Style actual state: native `:disabled`, `:checked`, `:indeterminate` and `open`;
Button pending uses `aria-busy`; Field/RadioGroup expose presence-based
`data-invalid`, `data-disabled` and `data-required`. DialogContent and the
disclosure parts expose `data-state="open" | "closed"`. Actions expose
`data-variant`, `data-tone` and `data-control-size`; controls expose
`data-control-size` independently of native Input `size`. There is no universal
synthetic state attribute to substitute for native or ARIA state.

## State and forms

Keep one owner per state axis for a mount. Use `value`/`checked`/`open` for
controlled state and their `default*` counterparts for initial uncontrolled
state. Accordion uses `value`/`defaultValue` and a fixed single/multiple type.
Remount to change ownership or selection type. Controlled callbacks request a
change; the consumer decides whether to accept it. No-op requests and prop
synchronisation do not create another semantic change callback.

Text changes and blur retain native event meanings. RadioGroup owns its options'
name/selection; `value={null}` clears a controlled group and `""` remains a real
option value. Choose one state-writing callback, `onValueChange` or `onChange`.
Checkbox's `checked` is boolean state; its `value` is submitted data.

Field owns IDs, label/help/error relationships and inherited metadata. Give an
explicit control ID through Field's `controlId`. Radiant controls consume those
relationships; a native adapter uses `children(controlProps)` and forwards them
to its control. Owned error/disabled/required state cannot be erased by a child.
A plain Field group preserves native fieldset/first-legend behavior and does
not make every checkbox required. RadioGroup applies its requirement to the
mutually exclusive native choice.

The consumer owns validation rules/timing, touched/dirty state, error text,
submission and persistence. Native reset restores uncontrolled controls; a
controlled adapter resets its values and validation metadata together. Form
reset does not reset Dialog or disclosure state. Dialog retains its DOM form
association; compose one form without nesting forms. TanStack is an optional
reference adapter, outside the runtime dependency and public export surface.

For cancellable activation, guards run first, the consumer handler runs next,
and the library requests a change only when `defaultPrevented` is false.
Native change/toggle/blur are observations, not vetoable requests. Preserve one
handler chain and the real host ref, including callback-ref cleanup. Public
`useField`, `useDialog`, `useCollapsible` and `useAccordion` return null outside
their owner; required parts fail clearly when misplaced. The
[React binding reference](https://github.com/cognitap/radiant/blob/main/docs/react-bindings.md)
details lifecycle, reconciliation, SSR and hydration behavior.

## Preserve behavior when customising

Button, Link and Dialog actions support `render(resolvedNativeProps)`. Forward
all resolved props, ref and children to one compatible button or anchor;
presentation is already resolved. A router adapter keeps native modified-click,
target and download behavior. Preserve Button's resolved pending children and
guarded handler; passing them through another Button would wrap/style them
again. Field's control-prop callback adapts relationships rather than replacing
Field's host.

Keep native controls and labels operable, accessible names/description IDs
connected, and focus/invalid/disabled/pending cues visible. Closed Dialog/details
content stays mounted and hidden by the native/functional styles. Preserve
Dialog bounds, scrolling, top-layer modal focus behavior, and a direct-child
summary for details. Keep decorative indicators hidden from assistive technology.
Preserve reduced-motion alternatives and forced-colors readability when changing
paint, motion or hosts. A type-correct adapter alone does not prove these behaviors.

## Reuse the canonical examples

Use the global Storybook **Theme** and **Mode** controls in Canvas and Docs.
Ordinary stories inherit them; **System → Theming → Comparison** is the named
preset comparison. Follow the [Storybook inspection guide](https://github.com/cognitap/radiant/blob/main/docs/storybook.md).

| Need                                                                  | Canonical live source                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One labelled control and local override                               | [Input Default / Customisation](https://github.com/cognitap/radiant/blob/main/src/Input.stories.tsx)                                                                                                                                  |
| Native form, optional TanStack owner, the same form in Card or Dialog | [ProfileExample](https://github.com/cognitap/radiant/blob/main/.storybook/examples/ProfileForm.tsx), exposed by [Recipes → Forms](https://github.com/cognitap/radiant/blob/main/src/Form.stories.tsx); choose its `placement` control |
| Assembled interface across all ten families                           | [WorkspaceSettings](https://github.com/cognitap/radiant/blob/main/.storybook/examples/WorkspaceSettings.tsx), exposed by [Recipes → Workspace → Settings](https://github.com/cognitap/radiant/blob/main/src/Workspace.stories.tsx)    |

These are development examples using public Radiant names, not package exports.
Adapt the existing form's state owner and placement rather than copying a second
form or replacing its actions with bespoke styled hosts. Application imports
come from `@cognitap/radiant`; implementation deep imports are unsupported.

The installed composition checkpoint reuses these exact recipes with public
package imports. When copying TypeScript recipe sources into an application,
follow its local module-resolution rules: Cognitap's current Next/Turbopack
setup needs extensionless local TSX imports, whereas the NodeNext installed
fixture uses `.js` specifiers. This adaptation does not change Radiant's compiled
JavaScript imports. See the [checkpoint commands](https://github.com/cognitap/radiant/blob/main/docs/testing.md#evidence-and-readiness).
An older registry package cannot verify newer exported components; use a matching
build/archive checkpoint and keep the registry limitation explicit until release.

For a change to this contract, update its guide/reference and canonical example
together, then run the [verification gate](https://github.com/cognitap/radiant/blob/main/docs/testing.md).
Use the [browser/AT matrix](accessibility.md) for target combinations, manual
scenarios, exact-version evidence and unverified gaps.
Check relevant keyboard/form/ref behavior and actual appearance in both modes;
automated accessibility results do not establish complete visual or assistive
technology readiness. Historical design decisions and acceptance sketches remain
in the [harmonisation record](https://github.com/cognitap/radiant/blob/main/docs/contracts/README.md).
