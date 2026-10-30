# Architecture

How Radiant's fifty-one families fit together and why. Props are on the
[docs site](https://github.com/cognitap/radiant-docs); themes are in [theming](theming.md); springs are in
[motion](motion.md).

The families are PasswordInput, Meter, NativeSelect, InputGroup, Kbd, Button, ButtonGroup, ToggleGroup, Toolbar, Link, Field, Fieldset, Input, OTPField, Textarea, Select, Combobox, MultiSelect, TagsInput, Checkbox, CheckboxGroup, AspectRatio, ScrollArea, Switch, Slider, RadioGroup (with Radio),
Dialog, AlertDialog, Drawer, Popover, HoverCard, Tooltip, Menu, ContextMenu, Menubar, Alert, Toast, Progress, Spinner, Skeleton, Separator, Badge, Tag, Avatar, Breadcrumb, Pagination, Table, Collapsible, Accordion, Tabs and Card. All ship in one package,
`@cognitap/radiant`. Deep imports are unsupported.

## Native first

Each piece of behavior has one owner:

| Responsibility                                         | Owner                                           |
| ------------------------------------------------------ | ----------------------------------------------- |
| Activation, radio grouping, disclosure, modal dialog   | The native element                              |
| Selection rules, ID merging and other reusable policy  | Private modules in `src/internal/`, no React    |
| Rendering, context, state hooks, event and ref wiring  | React bindings in `src/react/` and family roots |
| Appearance                                             | Shared tokens and component overrides           |
| Content, validation, routing, fetching and persistence | The consumer                                    |

Why: the browser already gets keyboard, focus and form behavior right.
Radiant has no headless-library dependency. Select owns its themed listbox and
item focus, while a visually hidden native select supplies form semantics.
Select, Combobox and Popover use the local top layer, preserving theme and modal ancestry.
Combobox keeps DOM focus on its native input and submits the committed key through
native form controls. Search text never becomes a selection. Applications own async
requests, cancellation and selected labels; results never trigger selection.
MultiSelect composes Combobox multiple mode. TagsInput commits free text; both
submit repeated named values. Their nameless JSON carrier emits accepted array changes.
Tag composes Badge and Button for removal.
OTPField keeps one native Input for editing, autofill and forms; its character slots are decorative.
InputGroup shares a boundary around real Input or Textarea controls and their addons.

Import rules:

1. `internal` never imports React, a binding, a family or app code.
2. `react` imports `internal` and React, never a family.
3. Families compose other families explicitly (Accordion uses Collapsible,
   RadioGroup uses Field, Dialog actions use Button). The graph stays acyclic.
4. Nothing touches `window`, `document` or the DOM at import time. Effects use
   the owning document and clean up on unmount.
5. Server markup matches the first client render. For example, a native dialog
   opens in an effect, not during render.

Extract a shared module only when a policy really repeats.

## Composition

Use Button for actions and Link for navigation, even when a Link looks like a
button. Field owns label, help and error relationships. Card groups content.
Dialog owns open state. Toast composes Alert and Button with a local FIFO queue and pausable timing. Collapsible owns one disclosure, and Accordion composes
Collapsible for a set of them.

Drawer composes Dialog with a dedicated Button drag handle. Snap fractions size an internal
scroll viewport; the native dialog remains the host. Its optional spring adapter
animates entry and snapping without delaying native close or focus.

AlertDialog specializes Dialog's native lifecycle, surface tokens and motion for
urgent decisions. Its modal content retains Dialog identities and adds alert-dialog tokens.

Composed families reuse the real thing: DialogTrigger and DialogClose are
Buttons, RadioGroup is a Field, and an Accordion item is a Collapsible, so
theme, keyboard behavior and relationships travel together.

## Presentation

Actions take three independent props:

| Prop          | Values                                                                    | Default                       |
| ------------- | ------------------------------------------------------------------------- | ----------------------------- |
| `variant`     | `solid`, `soft`, `outline`, `ghost`; Link also accepts `inline`, `subtle` | Button `solid`; Link `inline` |
| `tone`        | `accent`, `neutral`, `warning`, `danger`                                  | `accent`                      |
| `controlSize` | `small`, `medium`, `large`                                                | `medium`                      |

A variant picks the treatment and a tone picks the palette. Input, Textarea, Checkbox, Switch, Slider,
Radio, RadioGroup, Combobox and Tabs share `controlSize` but have no variants. Native meanings
win: `Input.size` stays a character count, and a checkbox `value` stays its
submitted data. Radius is a theme decision, not a prop.

Button defaults to `type="button"`. `pending` blocks activation but keeps focus
and the accessible name. Button's optional `pressed` state is independent of press motion.
Link is always an anchor and has no fake `disabled`.

## Themes

A theme is one typed `defineTheme({ id, name, tokens, components, modes })`
definition. Values resolve as **component override → shared token → neutral
baseline**, and never fall back through another family's override. Why: a
change to shared tokens should reach every family, and an exception should stay
local. A Button-only font does not become body text.

The core entry ships only the neutral baseline, `defaultTheme`. Styled presets
are examples at `@cognitap/radiant/examples`, and Storybook, the docs and the
theme workshop all read that one copy. Why: a preset is a starting point to copy
or edit, not a contract the library has to keep stable.

`ThemeScope` is a plain `div` that applies a theme to its subtree. It does not
touch the document or persist anything. Without `theme` or `mode` it inherits.
A named theme starts fresh from the library defaults, so a nested `default`
really resets an outer theme. `mode` (`light`, `dark` or `system`) is
independent of the theme, and `system` uses CSS media queries so server markup
stays stable. Token names, CSS variables, scopes and presets are in
[theming](theming.md).

## Hosts and targeting

Root `className`, `style`, native props and `ref` always reach the documented
host, never a wrapper:

| Family or part                                                             | Host                                                |
| -------------------------------------------------------------------------- | --------------------------------------------------- |
| AspectRatio                                                                | `div`                                               |
| Toolbar                                                                    | `div`                                               |
| ToggleGroup / ToggleGroupItem                                              | `div` / Button's `button`                           |
| ScrollArea                                                                 | Native `div` scroll viewport                        |
| Skeleton                                                                   | `span`                                              |
| Meter                                                                      | Native meter                                        |
| Progress / Spinner                                                         | `progress` / `svg`                                  |
| Button / Link                                                              | `button` / `a`, including through `render`          |
| Field                                                                      | `div` in control layout; `fieldset` in group layout |
| Input / PasswordInput / Checkbox / Switch / Slider / Radio                 | Native `input`                                      |
| Textarea                                                                   | Native `textarea`                                   |
| NativeSelect                                                               | Native select                                       |
| Select / SelectPortal / Combobox / ComboboxPortal                          | None; state / portal                                |
| Popover, HoverCard, Tooltip, Menu, ContextMenu, MenuSub / their Portals    | None; state / portal                                |
| Menubar / MenubarMenu / MenubarPortal                                      | div / None / None                                   |
| ContextMenuTrigger / ContextMenuContent                                    | Named native div / Menu content div                 |
| HoverCardTrigger / HoverCardContent                                        | Link's `a` / Popover's `div`                        |
| MenuTrigger / MenuItem / MenuCheckboxItem / MenuRadioItem / MenuSubTrigger | Button's button                                     |
| MenuContent / MenuSubContent / MenuGroup / MenuLabel / MenuRadioGroup      | div                                                 |
| MenuSeparator                                                              | Separator's hr                                      |
| PopoverTrigger / PopoverClose / PopoverContent                             | Button's `button` / Button's `button` / `div`       |
| SelectTrigger / SelectContent / SelectViewport / SelectItem                | Button's `button` / `div` / `div` / `div`           |
| ComboboxInput / ComboboxContent / ComboboxItem                             | Native `input` / `div` / `div`                      |
| ComboboxTrigger / ComboboxClear                                            | Button's `button`                                   |
| Tabs / TabsList / TabsContent                                              | `div`                                               |
| TabsTrigger                                                                | Button's `button`                                   |
| RadioGroup                                                                 | Field's `fieldset`                                  |
| Dialog / AlertDialog / Drawer                                              | None; state owners                                  |
| Dialog actions / AlertDialog actions                                       | Button's `button`                                   |
| Dialog, AlertDialog and Drawer Content / Title / Description               | `dialog` / `h2` / `p`                               |
| Collapsible / CollapsibleTrigger / CollapsibleContent                      | `details` / `summary` / `div`                       |
| Accordion / AccordionItem / AccordionTrigger / AccordionContent            | `div` / `details` / `summary` / `div`               |
| Card / CardHeader / CardContent / CardFooter                               | `div`                                               |
| CardTitle and AlertTitle / CardDescription and AlertDescription            | Heading chosen by `level` / `p`                     |

MultiSelect parts retain Combobox hosts and add `multi-select-*`. TagsInput props/ref
reach Input; wrapper, tag, removal and message styles use named parts. Tag props/ref
reach Badge’s span; its removal part styles the actual Button.

Internal parts take `className` and `style` through a `parts` map. Field has
`label`, `description`, `error` and `required`. Checkbox, Switch and Radio have
`wrapper`, `label` and `indicator`, and RadioGroup adds `options`. These hooks
cannot replace IDs, ARIA, handlers or refs. Caller classes merge after the
defaults and caller `style` wins. Identity and presentation data attributes
cannot be overridden.

`data-slot` is a space-separated set, so select with `~=`, as in
`[data-slot~="button"]`. Composed parts keep their base identity:
`button dialog-trigger`, `field radio-group`, `collapsible accordion-item`.
Why: styling written for Button still reaches a DialogTrigger.

Style real state: native `:disabled`, `:checked` and `open`, plus `aria-busy`
for pending. Field and RadioGroup set `data-invalid`, `data-disabled` and
`data-required`. Disclosures and DialogContent set `data-state="open|closed"`.
Actions set `data-variant`, `data-tone` and `data-control-size`. Switch uses
`data-dragging` during a provisional pointer gesture; `:checked` stays committed.

## State and forms

Each state axis has one owner for the life of a mount. Pass `value`, `checked`
or `open` to control it, or `default*` to set an initial value. Passing both, or switching owner during
a mount, throws; remount with a new `key` instead. A controlled callback is a request, and the consumer
may refuse it. No-op requests and prop syncs fire no callback.

| Family                                   | State                                              | Callback                                                    | Empty                  |
| ---------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- | ---------------------- |
| Input, Textarea, NativeSelect            | `value` / `defaultValue`                           | Native `onChange`, `onBlur`                                 | `''`                   |
| ToggleGroup single / multiple            | `value` / `defaultValue`                           | `onValueChange(string \| null)` / `onValueChange(string[])` | `null` / `[]`          |
| Button toggle                            | `pressed` / `defaultPressed`                       | `onPressedChange(boolean)`                                  | `false`                |
| Checkbox, Switch, standalone Radio       | `checked` / `defaultChecked`                       | Native `onChange`, `onBlur`                                 | `false`                |
| Slider                                   | `value` / `defaultValue`                           | Native `onChange`, `onBlur`                                 | Native midpoint        |
| RadioGroup                               | `value` / `defaultValue`                           | `onValueChange(string)` or native `onChange`                | `null`                 |
| Select                                   | `value` / `defaultValue`                           | `onValueChange(string \| null)`                             | `null`                 |
| Combobox                                 | `value` / `defaultValue`; `query` / `defaultQuery` | `onValueChange(string \| null)`; `onQueryChange(string)`    | `null`; `''`           |
| Tabs                                     | `value` / `defaultValue`                           | `onValueChange(string)`                                     | Initial value required |
| Dialog, AlertDialog, Drawer, Collapsible | `open` / `defaultOpen`                             | `onOpenChange(boolean)`                                     | `false`                |
| Popover                                  | `open` / `defaultOpen`                             | `onOpenChange(boolean)`                                     | `false`                |
| Accordion single                         | `value` / `defaultValue`                           | `onValueChange(string \| null)`                             | `null`                 |
| Accordion multiple                       | `value` / `defaultValue`                           | `onValueChange(string[])`                                   | `[]`                   |

RadioGroup owns its options' `name` and selection. Use one of `onValueChange`
or `onChange` to write state, not both. `''` is a valid option value, and `null`
clears the group.

Field owns IDs and label, help and error relationships. Set a control's ID with
Field's `controlId`. Radiant controls read Field context. A native control uses
`children(controlProps)` and forwards those props. Disabled and required only
add up: a child cannot re-enable or un-require what its Field set.

The consumer owns validation, touched and dirty state, error text, submission
and persistence. Native reset restores uncontrolled inputs. A controlled adapter
resets its own values. Reset never changes pressed buttons, ToggleGroup, Dialog, Tabs or disclosure state. Why: form
libraries differ, and Radiant should fit any of them without a hidden form
store. TanStack Form is an optional example adapter, not a dependency.

Select takes one `items` registry for SSR labels, native options and typeahead.
Rich labels supply `textValue`. The focused option and committed value are
distinct; activation commits, Escape dismisses and restores trigger focus.
Native reset silently restores uncontrolled selection. Controlled resets stay
with the owner. User selections emit form change; prop syncs do not.

## Replacement and events

Button, Link and the Dialog actions accept `render(resolvedProps)`. Forward all
props, the ref and the children to one compatible `button` or `a`. There is no
`as` or `asChild`. Why: one convention, and the resolved props already carry
presentation, relationships and guards, so an adapter cannot drop them by
accident. Field's `children(controlProps)` adapts relationships and does not
replace Field's host.

For cancellable actions, disabled and pending guards run first, then the
consumer handler, then the state request if `defaultPrevented` is false. Native
change, toggle and blur are observations and cannot veto anything. Library and
caller refs get the same host, and callback-ref cleanup functions are honored.
`useToggleGroup`, `useField`, `useDialog`, `usePopover`, `useTooltip`, `useMenu`, `useCombobox`, `useTabs`, `useCollapsible` and `useAccordion` read and request
state, and return `null` outside their owner. Parts that need a root throw when misplaced. Lifecycle,
SSR and hydration details are in [React bindings](react-bindings.md).

## What customization must keep

Restyling or replacing a host is fine as long as these keep working:

- Native controls and labels stay operable, with names and descriptions connected.
- Focus, invalid, disabled and pending cues stay visible.
- Closed dialog and details content stays hidden. Dialog keeps its bounds,
  scrolling and modal focus, and `details` keeps a direct-child `summary`.
- Decorative indicators stay hidden from assistive technology.
- Reduced-motion and forced-colors modes still work.

Passing the type check alone does not prove any of this. See
[accessibility](accessibility.md) for what to check by hand.

## Examples and type fixtures

The canonical live examples are Storybook stories:
[Input](../src/Input.stories.tsx), [Recipes → Forms](../src/Form.stories.tsx)
(one form, plain or in a Card or Dialog, optionally with TanStack) and
[Recipes → Workspace → Settings](../src/Workspace.stories.tsx) (all ten
families). Change a contract and its example together.

`docs/contracts/*.ts(x)` are compile-only fixtures. `pnpm typecheck:contracts`
checks that they type-check and that contradictory props, such as `value` with
`defaultValue`, are rejected.
