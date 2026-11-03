# Architecture

Radiant ships sixty-four component families in `@cognitap/radiant`, plus `@cognitap/radiant/charts`, `@cognitap/radiant/motion`, `@cognitap/radiant/examples`, `@cognitap/radiant/color`, and `@cognitap/radiant/typography`. Arbitrary deep imports are unsupported. See the [component docs](https://github.com/cognitap/radiant-docs), [theming](theming.md), [motion](motion.md), and [conventions](conventions.md).

## Native first

Browsers own keyboard, focus, and form semantics. Radiant has no headless-library dependency.

| Responsibility                                        | Owner                                           |
| ----------------------------------------------------- | ----------------------------------------------- |
| Activation, radio grouping, disclosure, modal dialog  | The native element                              |
| Selection rules, ID merging, and reusable policy      | Pure modules in `src/internal/` (no React)      |
| Rendering, context, state hooks, event and ref wiring | React bindings in `src/react/` and family roots |
| Appearance                                            | Shared tokens and component overrides           |
| Content, validation, routing, fetching, persistence   | The consumer                                    |

Import rules, enforced by `tests/architecture.test.mjs`:

1. `src/internal/` never imports React, a binding, a family, or app code.
2. `src/react/` imports `src/internal/` and React, never a family.
3. Families compose other families explicitly (Accordion uses Collapsible, RadioGroup uses Field, Dialog actions use Button). The dependency graph stays acyclic.
4. Nothing touches `window`, `document`, or the DOM at import time. Effects use the host's `ownerDocument` and clean up on unmount.
5. Server markup matches the first client render; dialogs open in effects.

## Composition and native form bridges

Use Button for actions and Link for navigation, even when a Link looks like a button. Field owns label, help, and error relationships. Card groups content. Dialog owns open state; AlertDialog and Drawer compose Dialog. Collapsible owns one `<details>` disclosure, and Accordion composes Collapsible. Toast composes Alert and Button with a local FIFO queue.

Controls that need custom popups or formatting keep a real native form control underneath:

- **Select** renders a themed listbox while a visually hidden `<select>` supplies form submission and native reset.
- **Combobox** keeps DOM focus on its `<input>` and submits the committed key; search text never becomes a selection. **Autocomplete** reuses the listbox but submits the input's text, including off-list values. **MultiSelect** and **TagsInput** submit repeated named values and emit accepted array changes on their nameless JSON carrier.
- **NumberField** edits localized text and submits one raw numeric value.
- **OTPField** uses one native `<input>` for editing, autofill, and form submission; its character slots are decorative.

Select, Combobox, and Popover use the local top layer (`popover="manual"`), preserving theme and modal ancestry.

## Presentation

Actions take three independent props:

| Prop          | Values                                                                    | Default                              |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| `variant`     | `solid`, `soft`, `outline`, `ghost`; Link also accepts `inline`, `subtle` | Button `solid`; Link `inline`        |
| `tone`        | `accent`, `neutral`, `warning`, `danger`                                  | Actions `accent`; feedback `neutral` |
| `controlSize` | `small`, `medium`, `large`                                                | `medium`                             |

Form controls (`Input`, `Textarea`, `Checkbox`, `Switch`, `Slider`, `Radio`, `RadioGroup`, `Combobox`, `Tabs`) share `controlSize` without variants. Native prop names keep their native meanings: `Input.size` is a character count and `Checkbox.value` is submitted form data. Radius comes from the theme, not a prop.

## Themes

A theme is created with `defineTheme({ id, name, tokens, components, modes })`. Values resolve as **component override → shared token → baseline** and never fall back through another family's override.

The core entry ships `defaultTheme`. Styled presets live at `@cognitap/radiant/examples`. `ThemeScope` is a plain `div` that applies a `theme` and `mode` (`light`, `dark`, or `system`) to its subtree without touching `document` or storage. A named `theme` resets to library defaults before applying its overrides; omitting `theme` or `mode` inherits from the parent scope. Token names, roles, and CSS variables are in [theming](theming.md).

## Hosts and targeting

Root `className`, `style`, native props, and `ref` always reach the documented host, never a wrapper. State-only roots (`Dialog`, `AlertDialog`, `Drawer`, `Command`, `Select`, `Combobox`, `Autocomplete`, `Popover`, `HoverCard`, `Tooltip`, `Menu`, `ContextMenu`, `MenuSub`, `MenubarMenu`, and their `Portal` parts) render no DOM element; their `Trigger`, `Content`, and `Input` parts own the hosts.

Internal sub-elements take `className` and `style` through a `parts` map (for example `label`, `description`, `error`, `indicator`, `wrapper`, `options`, `remove`). Caller classes merge after defaults and caller `style` wins, while IDs, ARIA attributes, event handlers, refs, and `data-*` state attributes stay owned by Radiant.

Every host sets `data-slot` as a space-separated set so composed parts keep their base identity (`button dialog-trigger`, `field radio-group`, `collapsible accordion-item`). Match slots with `[data-slot~="button"]`.

Style real state: native `:disabled`, `:checked`, and `[open]`, `aria-busy` for pending, `data-state="open|closed"` on disclosures and overlays, and boolean `data-selected`, `data-disabled`, `data-invalid`, `data-required`, and `data-highlighted` attributes (present as `""` when true, absent when false).

## State and forms

Each state axis has one owner for the life of a mount. Pass `value`, `checked`, `pressed`, or `open` to control it, or `default*` for an initial uncontrolled value. Passing both, or switching between controlled and uncontrolled during a mount, throws; remount with a new `key` instead. A controlled callback is a request that the consumer may refuse. No-op requests and prop syncs fire no callback.

Field owns IDs and `aria-labelledby` / `aria-describedby` wiring. Radiant controls read Field context automatically; plain native controls use `children(controlProps)`. Disabled and required only accumulate from Field to control.

The consumer owns validation, dirty/touched tracking, error text, submission, and persistence. Native form reset restores uncontrolled inputs and Select, and leaves ToggleGroup, Dialog, Tabs, pressed buttons, and disclosures alone. `Form` coordinates native validation and async submission without storing field values.

## Replacement and events

`Button`, `Link`, and Dialog actions accept `render(resolvedProps)` to delegate rendering to a single compatible `<button>` or `<a>` while forwarding all resolved props, refs, and children. There is no `as` or `asChild`.

For cancellable actions, disabled and pending guards run first, then the consumer handler, then the library state request if `defaultPrevented` is false. Native `change`, `toggle`, and `blur` events are observations and cannot veto state changes. Internal hook details are in [React bindings](react-bindings.md).

## What customization must keep

Restyling or replacing a host must preserve:

- Operable native controls with connected labels and descriptions.
- Visible focus, invalid, disabled, and pending cues.
- Hidden content when a dialog or `<details>` is closed, modal focus containment on `Dialog`, and a direct-child `<summary>` inside `<details>`.
- `aria-hidden` on decorative indicators.
- Working `prefers-reduced-motion` and `forced-colors` modes.

Manual verification targets and checks are in [accessibility](accessibility.md).

## Examples and type fixtures

Canonical examples live in Storybook (`src/components/Input/Input.stories.tsx`, `src/components/Form/Form.stories.tsx`, `.storybook/examples/ProfileForm.tsx`, and `src/recipes/Workspace.stories.tsx`). Update a contract and its story together.

`docs/contracts/*.ts(x)` are compile-only type fixtures checked by `pnpm typecheck`, including `@ts-expect-error` assertions for invalid prop combinations such as passing both `value` and `defaultValue`.
