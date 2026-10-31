# Changelog

[Release policy](RELEASE_POLICY.md)

## Unreleased

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
