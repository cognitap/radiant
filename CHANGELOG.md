# Changelog

[Release policy](RELEASE_POLICY.md)

## Unreleased

- Draw Popover, HoverCard, Menu, ContextMenu, Menubar, Select, Combobox, Command, Tooltip, Dialog, AlertDialog, Drawer and the NavigationMenu viewport with the overlay role: `surface.overlayBackground`, `surface.overlayShadow` and `surface.backdropFilter`. Tooltips keep their own background.
- Highlight rows in menus, listboxes and Command with `control.item`, and give them corners concentric with their panel.
- Mark the chosen Select and Combobox option and the open Menubar menu with `control.selected` when a theme sets it.
- Style menu items as rows. They no longer inherit Button's uppercase, pressed shape, shadow or backdrop.
- Round Drawer's edges that face the page with the surface radius.
- Give Tooltip the surface corner shape and a radius capped at `0.5rem`, and the Menubar the control corner shape and the track border width.
- Fix the NavigationMenu viewport border width, which read a missing token, and use the overlay shadow.
- Set menu, Select and Command group labels in the `ui-label` role.
- Glass frosts every floating panel through `surface.backdropFilter`, without per-component overrides.
- Draw surfaces with the whole `surface` role. Alert, Toast, TableContainer, EmptyState, CodeBlock and the Carousel viewport take the surface corner shape. Table rows and borders, CodeBlock, EmptyState's solid variants and Separator take the surface border style. Card, Alert, Toast and Collapsible take the surface backdrop filter.
- Give Collapsible, Accordion items and TableContainer the surface shadow, overridable with `components.collapsible.shadow` and `components.table.shadow`.
- Tint Collapsible and Accordion triggers on hover.
- Set Table column headers in the action voice at the small control font size.
- Round InlineCode at half the control radius, capped at 0.375em, with the control corner shape.
- Draw the current Carousel indicator with `control.selected`.
- Set the Sidebar label in the UI title typography role.
- `control.indicator.thumbShadow` now defaults to `none`, and `control.track.background` and `control.track.borderWidth` default to unset, so each family keeps its own look until a theme sets them. Before, they defaulted to a small shadow, `color.neutral` and `0px`.
- Give Checkbox, Radio and Switch the `control.indicator` shadows, and the Switch and Slider thumbs `thumbShadow`. Checkbox and Radio boxes scale with `motion.pressScale` while pressed.
- Draw Progress, Meter, Skeleton, the Slider rail, ScrollArea's rail and Resizable's hover with `control.track`: background, border width and shadow.
- Cap Switch, Slider, Progress, Meter and ScrollArea corners at half their thickness, and give them the control corner shape. A `0px` radius gives bars. Progress and Meter no longer force a pill.
- Make the Switch thumb corner concentric with its track.
- Take the Progress and Meter border width and style from the control tokens instead of the surface ones. Skeleton takes the surface corner shape.

## 0.0.71

- Draw Input, Textarea, NativeSelect, InputGroup, OTPField, Select and Combobox wells with `control.field`: background, border color, shadow and backdrop filter. InputGroup gains the control corner shape and border style.
- Style the Select trigger as a field. It no longer inherits Button's uppercase, sheen, hover lift or pressed shape, and it does not scale on press.
- Keep NumberField steppers, the PasswordInput toggle and Tag's remove button flat, in the field's voice, whatever the theme gives Button.
- Add role tokens so a theme styles every family that plays a role at once: `control.action`, `control.field`, `control.indicator`, `control.track`, `control.selected`, `control.item`, `surface.overlayBackground`, `surface.backdropFilter` and the `motion` press keys. Button, ButtonGroup, ToggleGroup and Pagination read them.
- Draw pressed toggles, the current page and the segmented ToggleGroup indicator with `control.selected`. Segments and the indicator now use corners concentric with their track.
- Keep ButtonGroup's inner corners square while a segment is pressed.
- Rewrite the example themes so each shows a distinct design language, and add Neon and Editorial. Breaking: `expressive` is removed from `@cognitap/radiant/examples`; start from `soft` or `jelly` instead.

## 0.0.70

- Add an optional charts entry with SVG line, bar, area and pie charts, palette-derived colors, native data tables and keyboard-reachable tooltips.

## 0.0.69

- Add Carousel with native scroll snap, direction-aware controls, drag navigation and opt-in autoplay that pauses for interaction and reduced motion.

## 0.0.68

- Add Form with native validation, Field error mapping, asynchronous submission and optional form-library integration.

## 0.0.67

- Add Sidebar and AppShell with native landmarks, collapsible navigation, a responsive Drawer and application-owned layout persistence.
- Keep Button motion cleanup safe after its owning iframe is removed.

## 0.0.66

- **Breaking:** CheckboxGroup builds on Field's group layout and takes `label` instead of `legend`. Before: `<CheckboxGroup legend="Channels" parts={{ legend: … }} />`. After: `<CheckboxGroup label="Channels" parts={{ label: … }} />`. Its root `data-slot` is `field checkbox-group`; match `[data-slot~="checkbox-group"]` instead of `fieldset`.
- **Breaking:** CheckboxGroup `value` and `defaultValue` are `string[]`, matching `onValueChange`. Before: `readonly string[]` was accepted. After: pass a mutable array.
- CheckboxGroup adds `required` and `requiredIndicator`. `required` blocks native form submission until at least one enabled option is checked.
- A group Field's label is spaced from its options by the group gap, so RadioGroup's label no longer sits flush against the first radio.
- PasswordInput's reveal button no longer sets `aria-pressed`; its Show and Hide label alone says what it does.
- ButtonGroup keeps a caller's `data-slot` tokens after `button-group` instead of dropping them.
- DrawerHandle accepts `aria-labelledby` as its accessible name, as well as `aria-label`.
- **Breaking:** CommandTrigger's props are DialogTrigger's, so toggle props are rejected the same way. Before: an object holding `pressed: true` could be typed as `CommandTriggerProps`. After: a type error. Runtime is unchanged; the trigger already ignored them.

## 0.0.65

- **Breaking:** MenuItem, MenuSubTrigger, and the ContextMenu and Menubar item and sub-trigger parts no longer accept `pressed`, `defaultPressed`, `onPressedChange` or `aria-pressed`, and ignore them at runtime. Before: `<MenuItem pressed>Bold</MenuItem>` rendered a `menuitem` with `aria-pressed="true"`. After: a type error; use `<MenuCheckboxItem checked onCheckedChange={...}>` for a toggled command.
- **Breaking:** PopoverClose no longer accepts toggle props, matching DialogClose. Before: `<PopoverClose pressed />` rendered `aria-pressed`. After: a type error, ignored at runtime.
- **Breaking:** ToggleGroup chooses its treatment with `variant`. Before: `<ToggleGroup appearance="segmented">`, `data-appearance`, `ToggleGroupAppearance`, `useToggleGroup().appearance`. After: `variant`, `data-variant`, `ToggleGroupVariant`, `useToggleGroup().variant`.
- **Breaking:** ToggleGroupItem marks selection with a boolean `data-selected`. Before: `data-state="on"` / `"off"`. After: `data-selected` on pressed items. `aria-pressed` is unchanged.
- **Breaking:** ToggleGroup and Toolbar use the shared `Orientation` type. Before: `ToggleGroupOrientation`, `ToolbarOrientation`. After: `Orientation`, with the same values.
- Add `ContextMenuRenderProps` and `ToggleGroupRenderProps`. MenuCheckboxItem uses the shared `CheckedOwner` type.

## 0.0.64

- Add NavigationMenu with native navigation links, delayed hover disclosure and a shared spring viewport.

## 0.0.63

- **Breaking:** Combobox chooses one or many with `type`, defaulting to `'single'`. Before: `<Combobox multiple />`, `useCombobox({ multiple: true })`. After: `<Combobox type="multiple" />`, `useCombobox({ type: 'multiple' })`.
- **Breaking:** Combobox, Autocomplete and MultiSelect name their load-failure text `errorText`, matching `loadingText`, `emptyText` and Command. Before: `<Combobox error="Could not load" />`. After: `<Combobox errorText="Could not load" />`.
- **Breaking:** ComboboxTrigger, ComboboxClear and the Autocomplete and MultiSelect triggers and clears no longer accept toggle props, and ignore them at runtime. Before: `<ComboboxTrigger pressed />` rendered `aria-pressed`. After: a type error, and no `aria-pressed`.
- **Breaking:** TagsInput styles its validation message through `parts.error`, with `data-slot="tags-input-error"`. Before: `parts.message`, `[data-slot="tags-input-message"]`.
- Combobox, Autocomplete and MultiSelect accept `aria-invalid` on the root and forward it to the input.
- Add `ComboboxRenderProps` and `AutocompleteRenderProps` for the `render` prop on Trigger and Clear.

## 0.0.62

- Add Resizable with draggable and keyboard separators, bounded collapsible panels, direction support and application-owned layout persistence.

## 0.0.61

- **Breaking:** Pagination page links and buttons default to `controlSize="medium"`, matching Button and Link. Before: `<PaginationLink href="?page=2">` rendered small. After: it renders medium. Pass `controlSize="small"` to keep the old size.
- Breadcrumb, Pagination and TableContainer check their names with the shared rule. A blank `aria-label` beside a nonempty `aria-labelledby` no longer throws, TableContainer accepts both, and the error reads "<Name> requires aria-label or aria-labelledby."

## 0.0.60

- Add NumberField with locale-aware decimal, percent and currency editing, keyboard stepping, blur clamping and raw native form values.

## 0.0.59

- Add CodeBlock and InlineCode with consumer-supplied highlighting, line numbers, keyboard scrolling and copy feedback.

## 0.0.58

- Progress fallback text matches Meter: `aria-valuetext` when given, otherwise "value of max". Before: "value / max", ignoring `aria-valuetext`.

## 0.0.57

- **Breaking:** DialogTrigger and DialogClose no longer accept `pressed`, `defaultPressed`, `onPressedChange` or `aria-pressed`, and ignore them at runtime. The AlertDialog, Drawer and Command trigger and close parts change with them. Before: `<DialogTrigger defaultPressed>` rendered `aria-pressed` beside `aria-expanded`. After: a type error, and no `aria-pressed`.
- **Breaking:** PopoverTrigger and MenuTrigger no longer accept toggle props. Before: `<PopoverTrigger defaultPressed />` type-checked and rendered `aria-pressed` beside `aria-expanded`. After: `pressed`, `defaultPressed`, `onPressedChange` and `aria-pressed` are rejected by the types and ignored at runtime.
- **Breaking:** ToastAction and ToastClose no longer accept toggle props, because neither is a toggle. Before: `<ToastAction pressed altText="…">` rendered `aria-pressed`. After: a type error, ignored at runtime.

## 0.0.56

- Fix EmptyState's no-results boundary to honor its border-width token.

## 0.0.55

- Add EmptyState for first use, empty searches and recovery, with consumer-chosen headings and actions.

## 0.0.54

- Add the `Orientation` type, used by Slider and Tabs.
- Select accepts `aria-invalid` on the root and forwards it to the trigger. `SelectTrigger`'s own `aria-invalid` still works and wins.
- Select accepts `readOnly`. The trigger stays focusable and sets `aria-readonly`, but opens nothing and the value doesn't change. The value still submits, and a read-only Select is not checked for `required`.
- Add the `SelectRenderProps` and `TabsRenderProps` types for `SelectTrigger` and `TabsTrigger` `render`.
- **Breaking:** SelectItem marks selection with a boolean `data-selected`. Before: `data-state="checked"` / `data-state="unchecked"`. After: `data-selected` present or absent. `aria-selected` is unchanged.
- **Breaking:** SelectTrigger no longer accepts toggle props. Before: `<SelectTrigger defaultPressed />` type-checked and made the trigger a toggle. After: `pressed`, `defaultPressed`, `onPressedChange` and `aria-pressed` are rejected by the types and ignored at runtime.
- **Breaking:** TabsTrigger marks the selected tab with a boolean `data-selected`. Before: `data-state="active"` / `data-state="inactive"`. After: `data-selected` on the selected tab only. `aria-selected` is unchanged.
- **Breaking:** TabsContent no longer sets `data-state`. Before: `[data-state=active]` matched the visible panel. After: target `[role=tabpanel]:not([hidden])`.

## 0.0.53

- Add Command.

## 0.0.52

- Field passes `aria-invalid` and `aria-describedby` from its root to the control it labels.
- RadioGroup `name` is optional. Without it, a generated name keeps grouping, arrow keys and form submission working.
- **Breaking:** Checkbox no longer accepts `readOnly`, which a native checkbox ignores. Before: `<Checkbox readOnly />` still toggled and submitted. After: a type error; use `disabled` or show the value as text.
- **Breaking:** Radio no longer accepts `readOnly`, for the same reason. Before: `<Radio readOnly />` still checked on click. After: a type error.

## 0.0.51

- Add Autocomplete.

## 0.0.50

- Add NavLink.

## 0.0.49

- Add PasswordInput.

## 0.0.48

- Add Meter.

## 0.0.47

- Add NativeSelect.

## 0.0.46

- Fix InputGroup addon focus.

## 0.0.45

- Add InputGroup.

## 0.0.44

- Add Kbd.

## 0.0.43

- Add ButtonGroup.

## 0.0.42

- Fix OTPField selection.

## 0.0.41

- Add OTPField: numeric/alphanumeric slots over one native input.

## 0.0.40

- Add Combobox multiple mode, MultiSelect, TagsInput and removable Tag.

## 0.0.39

- Fix nested Drawer alignment.

## 0.0.38

- Add Drawer.

## 0.0.37

- Add Menubar.

## 0.0.36

- Add ContextMenu.
- Add Menu groups, labels and separators.
- Add checkable Menu items.
- Add Menu submenus.
- Add MenuItem.closeOnSelect.

## 0.0.35

- Add HoverCard.
- Track inline anchor text changes in popup placement.
- Keep popup portals outside phrasing-only hosts.

## 0.0.34

- Add Toolbar.

## 0.0.33

- Breaking: ButtonProps union. Before: `interface` extension. After: type intersection and distributive omission.
- Add ToggleGroup.
- Add Button pressed/defaultPressed/onPressedChange.

## 0.0.32

- Add ScrollArea.

## 0.0.31

- Add AspectRatio.

## 0.0.30

- Add CheckboxGroup.

## 0.0.29

- Add Fieldset.

## 0.0.28

- Add Table.
- Preserve external Link defaults in Pagination direction links.

## 0.0.27

- Add Pagination.

## 0.0.26

- Add Breadcrumb.

## 0.0.25

- Add Avatar.

## 0.0.24

- Add Badge.

## 0.0.23

- Add Separator.

## 0.0.22

- Add Skeleton.

## 0.0.21

- Add Spinner.

## 0.0.20

- Add Progress.

## 0.0.19

- Add Toast.

## 0.0.18

- Add Alert.

## 0.0.17

- Add Menu.

## 0.0.16

- Add Tooltip.

## 0.0.15

- Add Popover.

## 0.0.14

- Add AlertDialog.

## 0.0.13

- Add Combobox.

## 0.0.12

- Add Tabs.

## 0.0.11

- Add Slider.

## 0.0.10

- Add draggable Switch: Field, forms, sizing, themes.

## 0.0.9

- Add Textarea: Field, forms, themes, resizing.

## 0.0.8

- Add Select: item focus, Field/forms, themes, springs, stable trigger-width alignment.

## 0.0.7

- Breaking: example themes moved from core. Before: `import { jelly, themes } from '@cognitap/radiant'`. After: `import { jelly, themes } from '@cognitap/radiant/examples'`. `defaultTheme` stays in core; `themeDefinitions` exposes example definitions.

- Reconcile pre-hydration disclosures: Collapsible adopts local changes once; controlled Collapsible/Accordion restore ownership without requests.

- Align Card/compound-part minimum widths.

- Let Accordion shrink in narrow grid/flex layouts.

- Update disclosure resize/inert cleanup; retain native pre-hydration fallback and motion-off height/markers.

- Bound Dialog exits to two seconds/500 descendants; skip nested dialogs and customized built-ins.

- Wrap Radio/Checkbox labels; retain indicator size.

- Release MotionLink springs on lost capture/removed destinations; preserve native navigation.

- Bind Button presses to active input; cancel unavailable motion and theme-off lift/shift.

## 0.0.6

- Add opt-in `/motion` and `/motion/react` springs with serializable theme profiles; root imports stay engine-free.
- Add `MotionProvider` for Button/Dialog actions, disclosure height and Dialog presentation; dismissal/focus stay immediate.
- Add `MotionLink` spring feedback for action-shaped links.
- Add one-axis drag with release, snapping, cancellation and keyboard alternatives.
- Add `useSpringFollow` for changing targets and `useSpringLayout` for grid and flex resize and reorder.
- Motion follows live reduced-motion settings, `motion="off"` and the theme's motion profile. See [motion](docs/motion.md).

## 0.0.5

- Add typography recipes (`typography.typesetting`): Body/Headings/UI/Code fonts, 16 styles and separate prose/UI rhythms.
- Add the React-free `@cognitap/radiant/typography` entry with `generateTypography`.
- Add `data-rad-prose`, `data-rad-text` and `data-rad-type-container` HTML hooks.
- Add font axis ranges (`ThemeFontAxis`) to theme document font metadata.
- **Breaking:** component text now uses the UI typography roles. UI line heights are explicit, and checkbox, radio and disclosure labels use the label weight. Check wrapping in your layouts.

  Earlier leaves still apply. Migrate to roles:

  | Before                             | After                         |
  | ---------------------------------- | ----------------------------- |
  | `family`, `bodySize`, `bodyWeight` | `roles['ui-body']`            |
  | `smallSize`                        | `roles['ui-supporting'].size` |
  | `headingSize`, `headingWeight`     | `roles['ui-title']`           |
  | `labelWeight`                      | `roles['ui-label'].weight`    |

  Apply `family` and `letterSpacing` to all four roles.

## 0.0.4

- Add versioned, JSON-portable `ThemeDocument` with section merge, replace and reset.
- Add `generateColorWall` in `@cognitap/radiant/color`: 18 palettes from one brand color, with Classic, Balanced and Expressive presets.
- Add `recommendColorPalette`: a working palette, light and dark color roles, and contrast checks.
- Add `updateThemeAppearance` for palettes, spacing, density, radius, border, elevation and backdrops.

## 0.0.3

- Add Link, Field, Input, Checkbox, RadioGroup, Radio, Dialog, Collapsible, Accordion and Card using native elements.
- Add `defineTheme` and `ThemeScope`: typed shared tokens, per-component overrides, and light, dark and system modes.
- Add eight presets as named exports and readonly `themes`.
- Add Button `variant`, `tone`, `controlSize`, `pending`, `iconOnly`, `fullWidth` and `render`.
- Add `ThemeStyle` for typed `--rad-*` variables in `style`.
- `data-slot` holds a set of identities. Select with `~=`, as in `[data-slot~="button"]`.
- Controlled/default pairs and ownership changes during a mount throw.
- **Breaking:** CSS variables gain the `--rad-` prefix and semantic names.

  ```css
  /* Before */
  --color-primary: #166534;
  /* After */
  --rad-color-accent: #166534;
  ```

  | Before                                                  | After                                                                                      |
  | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
  | `--color-background`                                    | `--rad-color-surface`; the page canvas is `--rad-surface-canvas`                           |
  | `--color-foreground`, `--color-border`, `--color-focus` | `--rad-color-foreground`, `--rad-color-border`, `--rad-color-focus`                        |
  | `--color-primary`, `--color-primary-foreground`         | `--rad-color-accent`, `--rad-color-accent-foreground`                                      |
  | `--color-primary-hover`, `--color-primary-active`       | Removed; hover and press colors derive from the accent                                     |
  | `--color-disabled`, `--color-disabled-foreground`       | Removed; disabled controls use `--rad-color-disabled-*` and `--rad-state-disabled-opacity` |
  | `--radius-control`                                      | `--rad-control-radius`                                                                     |

- **Breaking:** the Tailwind route no longer registers unprefixed aliases. Replace `bg-primary` with `bg-(--rad-color-accent)` and `rounded-control` with `rounded-(--rad-control-radius)`.

## 0.0.2

- Tooling/documentation cleanup; no API change.

## 0.0.1

- First public release.
