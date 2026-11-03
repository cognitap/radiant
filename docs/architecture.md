# Architecture

Radiant's sixty-four families. See [props](https://github.com/cognitap/radiant-docs), [themes](theming.md) and [motion](motion.md).

The families are Charts, Carousel, Form, AppShell (with Sidebar), NavigationMenu, Resizable, NumberField, CodeBlock (with InlineCode), EmptyState, Command, Autocomplete, NavLink, PasswordInput, FileInput, Meter, NativeSelect, InputGroup, Kbd, Button, ButtonGroup, ToggleGroup, Toolbar, Link, Field, Fieldset, Input, OTPField, Textarea, Select, Combobox, MultiSelect, TagsInput, Checkbox, CheckboxGroup, AspectRatio, ScrollArea, Switch, Slider, RadioGroup (with Radio),
Dialog, AlertDialog, Drawer, Popover, HoverCard, Tooltip, Menu, ContextMenu, Menubar, Alert, Toast, Progress, Spinner, Skeleton, Separator, Badge, Tag, Avatar, Breadcrumb, Pagination, Table, Collapsible, Accordion, Tabs and Card. All ship in
`@cognitap/radiant`. Charts uses the explicit `@cognitap/radiant/charts` entry; arbitrary deep imports are unsupported.

## Native first

Behavior owners:

| Responsibility                                         | Owner                                           |
| ------------------------------------------------------ | ----------------------------------------------- |
| Activation, radio grouping, disclosure, modal dialog   | The native element                              |
| Selection rules, ID merging and other reusable policy  | Private modules in `src/internal/`, no React    |
| Rendering, context, state hooks, event and ref wiring  | React bindings in `src/react/` and family roots |
| Appearance                                             | Shared tokens and component overrides           |
| Content, validation, routing, fetching and persistence | The consumer                                    |

Browsers own keyboard, focus and form semantics.
Radiant has no headless-library dependency. Select owns its themed listbox and
item focus, while a visually hidden native select supplies form semantics.
Select, Combobox and Popover use the local top layer, preserving theme and modal ancestry.
Combobox keeps DOM focus on its native input and submits the committed key through
native form controls. Search text never becomes a selection. Autocomplete reuses the listbox but submits its native text, including off-list values. Applications own async
requests, cancellation and selected labels; results never trigger selection.
Command combines Dialog with an inline Combobox listbox for explicit actions; applications register shortcuts.
MultiSelect composes Combobox with `type="multiple"`. TagsInput commits free text; both
submit repeated named values. Their nameless JSON carrier emits accepted array changes.
NumberField edits localized text and submits one raw numeric form value.
Resizable composes Separator for adjacent panel sizing; applications persist layouts.
Charts use SVG through an optional entry; pure geometry stays separate from React, reusing Tooltip, Button, Table and palette modes.
AppShell places native landmarks around one Sidebar subtree, reusing Drawer for mobile navigation and optional spring layout.
NavigationMenu composes Button and Link with one shared spring viewport, preserving navigation semantics.
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
5. Server markup matches the first client render; dialogs open in effects.

Extract shared policy only when it repeats.

## Composition

Use Button for actions and Link for navigation, even when a Link looks like a
button. Card groups content.
Dialog owns open state. Toast composes Alert and Button with a local FIFO queue and pausable timing. Collapsible owns one disclosure, and Accordion composes
Collapsible for a set of them.

Drawer composes Dialog with a dedicated Button drag handle. Snap fractions size an internal
scroll viewport; the native dialog remains the host. Its optional spring adapter
animates entry and snapping without delaying native close or focus.

AlertDialog specializes Dialog's native lifecycle, surface tokens and motion for
urgent decisions. Its modal content retains Dialog identities and adds alert-dialog tokens.

## Presentation

Actions take three independent props:

| Prop          | Values                                                                    | Default                              |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| `variant`     | `solid`, `soft`, `outline`, `ghost`; Link also accepts `inline`, `subtle` | Button `solid`; Link `inline`        |
| `tone`        | `accent`, `neutral`, `warning`, `danger`                                  | Actions `accent`; feedback `neutral` |
| `controlSize` | `small`, `medium`, `large`                                                | `medium`                             |

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
baseline**, and never fall back through another family's override. Shared tokens reach every family; overrides stay local.

The core entry ships only the neutral baseline, `defaultTheme`. Styled presets
are examples at `@cognitap/radiant/examples`, and Storybook, the docs and the
theme workshop all read that one copy.

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

| Family or part                                                                                                      | Host                                                      |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Charts / ChartDataTable                                                                                             | `figure` / Table's `table`                                |
| Carousel / CarouselViewport / CarouselIndicators                                                                    | `section` / native scroll `div` / `div`                   |
| Form / FormField / FormError                                                                                        | `form` / Field's host / Alert's `div`                     |
| AppShell / AppShellHeader / AppShellMain / Sidebar                                                                  | `div` / `header` / `main` / `nav`                         |
| AppShellSkipLink / SidebarLabel / SidebarContent                                                                    | Link's `a` / `span` / `div`                               |
| AspectRatio, Toolbar, ToggleGroup, ButtonGroup, InputGroup, InputGroupAddon, Alert, Tabs, TabsList                  | `div`                                                     |
| Resizable, ResizablePanel, CodeBlock, CodeBlockHeader, EmptyState, EmptyStateActions, TabsContent                   | `div`                                                     |
| Toast / ToastViewport / ToastProvider                                                                               | Alert's `div` / `section` / None                          |
| ScrollArea / CodeBlockViewport                                                                                      | Native `div` scroll viewport / ScrollArea's `div`         |
| CodeBlockContent / InlineCode / Kbd and KbdGroup                                                                    | `pre` / `code` / `kbd`                                    |
| Avatar, Badge, Skeleton, EmptyStateIcon, TooltipContent                                                             | `span`                                                    |
| Tag                                                                                                                 | Badge's `span`; its removal part styles the actual Button |
| Separator / MenuSeparator and ResizableHandle                                                                       | `hr` / Separator's `hr`                                   |
| Meter / Progress / Spinner                                                                                          | Native `meter` / `progress` / `svg`                       |
| Table / TableContainer / other Table parts                                                                          | `table` / `section` / their native table element          |
| Button / Link / NavLink                                                                                             | `button` / `a`, including through `render`                |
| Breadcrumb, Pagination, NavigationMenu                                                                              | `nav`                                                     |
| BreadcrumbList and PaginationList / NavigationMenuList / their Items                                                | `ol` / `ul` / `li`                                        |
| BreadcrumbLink, PaginationLink, PaginationPrevious, PaginationNext, NavigationMenuLink                              | Link's `a`                                                |
| BreadcrumbPage, BreadcrumbSeparator, PaginationEllipsis, PaginationUnavailable                                      | `span`                                                    |
| NavigationMenuContent / NavigationMenuViewport                                                                      | `div`                                                     |
| Field                                                                                                               | `div` in control layout; `fieldset` in group layout       |
| RadioGroup, CheckboxGroup, Fieldset                                                                                 | Field's `fieldset`                                        |
| Input, InputGroupInput, PasswordInput, FileInput, NumberField, OTPField, TagsInput, Checkbox, Switch, Slider, Radio | Native `input`                                            |
| Textarea, InputGroupTextarea / NativeSelect                                                                         | Native `textarea` / native `select`                       |
| Select, Combobox, Autocomplete, MultiSelect / their Portals                                                         | None; state / portal                                      |
| Popover, HoverCard, Tooltip, Menu, ContextMenu, MenuSub / their Portals                                             | None; state / portal                                      |
| Menubar / MenubarMenu / MenubarPortal                                                                               | `div` / None / None                                       |
| ContextMenuTrigger / ContextMenuContent                                                                             | Named native `div` / Menu content `div`                   |
| HoverCardTrigger / HoverCardContent                                                                                 | Link's `a` / Popover's `div`                              |
| PopoverContent, MenuContent, MenuSubContent, MenuGroup, MenuLabel, MenuRadioGroup                                   | `div`                                                     |
| SelectContent, SelectViewport, SelectItem                                                                           | `div`                                                     |
| ComboboxInput / AutocompleteInput / CommandInput                                                                    | Native `input`                                            |
| ComboboxContent / ComboboxItem / AutocompleteContent / AutocompleteItem / CommandList / CommandItem                 | `div`                                                     |
| PopoverTrigger, PopoverClose, TooltipTrigger, SelectTrigger, TabsTrigger, ToggleGroupItem, SidebarTrigger           | Button's `button`                                         |
| MenuTrigger, MenubarTrigger, MenuItem, MenuCheckboxItem, MenuRadioItem, MenuSubTrigger                              | Button's `button`                                         |
| ComboboxTrigger, ComboboxClear, AutocompleteTrigger, AutocompleteClear, NavigationMenuTrigger                       | Button's `button`                                         |
| Carousel controls, PaginationButton, CodeBlockCopy, ToastAction, ToastClose                                         | Button's `button`                                         |
| Dialog, AlertDialog, Drawer and Command actions                                                                     | Button's `button`                                         |
| Dialog / AlertDialog / Drawer / Command                                                                             | None; state owners                                        |
| Dialog, AlertDialog, Drawer and Command Content / Title / Description                                               | `dialog` / `h2` / `p`                                     |
| Collapsible / NavLinkGroup                                                                                          | `details`                                                 |
| CollapsibleTrigger / NavLinkGroupTrigger                                                                            | `summary`                                                 |
| CollapsibleContent / NavLinkGroupContent                                                                            | `div`                                                     |
| Accordion / AccordionItem / AccordionTrigger / AccordionContent                                                     | `div` / `details` / `summary` / `div`                     |
| Card / CardHeader / CardContent / CardFooter                                                                        | `div`                                                     |
| CardTitle, AlertTitle, ToastTitle, EmptyStateTitle                                                                  | Heading chosen by `level`                                 |
| CardDescription, AlertDescription, ToastDescription, EmptyStateDescription                                          | `p`                                                       |

MultiSelect parts keep Combobox hosts and add `multi-select-*` identities. TagsInput
styles its wrapper, tags, removal buttons and error message through `parts`.

Internal parts take `className` and `style` through a `parts` map. Field has
`label`, `description`, `error` and `required`. Checkbox, Switch and Radio have
`wrapper`, `label` and `indicator`, and RadioGroup and CheckboxGroup add `options`. These hooks
cannot replace IDs, ARIA, handlers or refs. Caller classes merge after the
defaults and caller `style` wins. Identity and presentation data attributes
cannot be overridden.

`data-slot` is a space-separated set, so select with `[data-slot~="button"]`.
Hosts keep their base identity first, then caller tokens:
`button dialog-trigger`, `field radio-group`, `collapsible accordion-item`.
Why: styling written for Button still reaches a DialogTrigger.

Style real state: native `:disabled`, `:checked` and `open`, plus `aria-busy`
for pending. Field and RadioGroup set `data-invalid`, `data-disabled` and
`data-required`. Disclosures, triggers and DialogContent set `data-state="open|closed"`.
Actions set `data-variant`, `data-tone` and `data-control-size`. Switch uses
`data-dragging` during a provisional pointer gesture; `:checked` stays committed.

## State and forms

Each state axis has one owner for the life of a mount. Pass `value`, `checked`
or `open` to control it, or `default*` to set an initial value. Passing both, or switching owner during
a mount, throws; remount with a new `key` instead. A controlled callback is a request, and the consumer
may refuse it. No-op requests and prop syncs fire no callback.

| Family                                                                              | State                                                           | Callback                                               | Empty                  |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ | ---------------------- |
| Input, Textarea, NativeSelect, PasswordInput, OTPField                              | `value` / `defaultValue`                                        | Native `onChange`, `onBlur`                            | `''`                   |
| Checkbox, Switch, standalone Radio                                                  | `checked` / `defaultChecked`                                    | Native `onChange`, `onBlur`                            | `false`                |
| Slider                                                                              | `value` / `defaultValue`                                        | `onValueChange(number)` or native `onChange`, `onBlur` | Native midpoint        |
| RadioGroup                                                                          | `value` / `defaultValue`                                        | `onValueChange(string)` or native `onChange`           | `null`                 |
| NumberField                                                                         | `value` / `defaultValue`                                        | `onValueChange(number \| null)`                        | `null`                 |
| Select, MenuRadioGroup; Combobox, ToggleGroup and Accordion single                  | `value` / `defaultValue`                                        | `onValueChange(string \| null)`                        | `null`                 |
| Menubar and NavigationMenu open item                                                | `value` / `defaultValue`                                        | `onValueChange(string \| null)`                        | `null`                 |
| MultiSelect, Combobox, ToggleGroup and Accordion multiple, CheckboxGroup, TagsInput | `value` / `defaultValue`                                        | `onValueChange(string[])`                              | `[]`                   |
| Autocomplete text                                                                   | `value` / `defaultValue`                                        | `onValueChange(string)`                                | `''`                   |
| Carousel current slide                                                              | `value` / `defaultValue`                                        | `onValueChange(string \| null)`                        | First item             |
| Tabs                                                                                | `value` / `defaultValue`                                        | `onValueChange(string)`                                | Initial value required |
| Resizable panel sizes                                                               | `value` / `defaultValue`                                        | `onValueChange(number[])`                              | Initial value required |
| Combobox, MultiSelect, Command search                                               | `query` / `defaultQuery`                                        | `onQueryChange(string)`                                | `''`                   |
| Button toggle                                                                       | `pressed` / `defaultPressed`                                    | `onPressedChange(boolean)`                             | `false`                |
| MenuCheckboxItem                                                                    | `checked` / `defaultChecked`                                    | `onCheckedChange(boolean)`                             | `false`                |
| Dialog, AlertDialog, Drawer, Command, Collapsible, Toast, Tooltip                   | `open` / `defaultOpen`                                          | `onOpenChange(boolean)`                                | `false`                |
| Popover, HoverCard, Menu, ContextMenu, Select, Combobox, Autocomplete, MultiSelect  | `open` / `defaultOpen`                                          | `onOpenChange(boolean)`                                | `false`                |
| AppShell                                                                            | `collapsed` / `defaultCollapsed`; mobile `open` / `defaultOpen` | `onCollapsedChange(boolean)`; `onOpenChange(boolean)`  | `false`                |
| Drawer                                                                              | `snapPoint` / `defaultSnapPoint`                                | `onSnapPointChange(number)`                            | Largest snap point     |
| Form                                                                                | `errors` / `defaultErrors`                                      | `onErrorsChange(FormErrors)`                           | `{}`                   |

RadioGroup owns its options' `name`, generating one when none is given, and selection. Use one of `onValueChange`
or `onChange` to write state, not both. `''` is a valid option value, and `null`
clears the group.

Field owns IDs and label, help and error relationships. Set a control's ID with
Field's `controlId`. Radiant controls read Field context. A native control uses
`children(controlProps)` and forwards those props. Disabled and required only
add up: a child cannot re-enable or un-require what its Field set.

The consumer owns validation, touched and dirty state, error text, submission
and persistence. Native reset restores uncontrolled inputs. A controlled adapter
resets its own values. Reset never changes pressed buttons, ToggleGroup, Dialog, Tabs or disclosure state. TanStack Form is an optional example adapter.

Select takes one `items` registry for SSR labels, native options and typeahead.
Rich labels supply `textValue`. The focused option and committed value are
distinct; activation commits, Escape dismisses and restores trigger focus.
Native reset silently restores uncontrolled selection. Controlled resets stay
with the owner. User selections emit form change; prop syncs do not.

Carousel uses native scroll snap and Button controls; opt-in autoplay pauses for interaction, visibility and reduced motion.
Form coordinates native validation and asynchronous submission without storing values. FormField composes Field; FormError composes Alert.
A nameless validating control names its FormField with `data-form-name`.

## Replacement and events

Button, Link and the Dialog actions accept `render(resolvedProps)`. Forward all
props, the ref and the children to one compatible `button` or `a`. There is no
`as` or `asChild`. Forwarding keeps the contract intact. Field's `children(controlProps)` adapts relationships and does not
replace Field's host.

For cancellable actions, disabled and pending guards run first, then the
consumer handler, then the state request if `defaultPrevented` is false. Native
change, toggle and blur are observations and cannot veto anything. Library and
caller refs get the same host, and callback-ref cleanup functions are honored.
Exported hooks read and request their owner's state and return `null` outside it:
`useAccordion`, `useAlertDialog`, `useAppShell` (alias `useSidebar`), `useCarousel`,
`useCollapsible`, `useCombobox`, `useContextMenu`, `useDialog`, `useDrawer`, `useField`,
`useForm`, `useHoverCard`, `useMenu`, `useMenubar`, `useMultiSelect`, `useNavigationMenu`,
`usePopover`, `useResizable`, `useSelect`, `useTabs`, `useToast`, `useToggleGroup` and `useTooltip`. Parts that need a root throw when misplaced. Lifecycle,
SSR and hydration details are in [React bindings](react-bindings.md).

## What customization must keep

Restyling or replacing a host is fine as long as these keep working:

- Native controls and labels stay operable, with names and descriptions connected.
- Focus, invalid, disabled and pending cues stay visible.
- Closed dialog and details content stays hidden. Dialog keeps its bounds,
  scrolling and modal focus, and `details` keeps a direct-child `summary`.
- Decorative indicators stay hidden from assistive technology.
- Reduced-motion and forced-colors modes still work.

Verify these behaviors manually: [accessibility](accessibility.md).

## Examples and type fixtures

The canonical live examples are Storybook stories:
[Input](../src/components/Input/Input.stories.tsx), [Form](../src/components/Form/Form.stories.tsx)
(native validation, server recovery and optional TanStack values) and
[Recipes → Workspace → Settings](../src/recipes/Workspace.stories.tsx) (all ten
families). Change a contract and its example together.

`docs/contracts/*.ts(x)` are compile-only fixtures. `pnpm typecheck:contracts`
checks that they type-check and that contradictory props, such as `value` with
`defaultValue`, are rejected.
