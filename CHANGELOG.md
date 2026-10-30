# Changelog

[Release policy](RELEASE_POLICY.md)

## Unreleased

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

- Let Accordion shrink in narrow grid/flex layouts like Collapsible.

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

  Old typography leaves still apply. To move a theme to roles:

  | Before                             | After                         |
  | ---------------------------------- | ----------------------------- |
  | `family`, `bodySize`, `bodyWeight` | `roles['ui-body']`            |
  | `smallSize`                        | `roles['ui-supporting'].size` |
  | `headingSize`, `headingWeight`     | `roles['ui-title']`           |
  | `labelWeight`                      | `roles['ui-label'].weight`    |

  The old `family` and `letterSpacing` applied to all four roles, so set them on each role.

## 0.0.4

- Add versioned, JSON-portable `ThemeDocument` with section merge, replace and reset.
- Add `generateColorWall` in `@cognitap/radiant/color`: 18 palettes from one brand color, with Classic, Balanced and Expressive presets.
- Add `recommendColorPalette`: a working palette, light and dark color roles, and contrast checks.
- Add `updateThemeAppearance` for palettes, spacing, density, radius, border, elevation and backdrops.

## 0.0.3

- Add Link, Field, Input, Checkbox, RadioGroup, Radio, Dialog, Collapsible, Accordion and Card, each built on the native element.
- Add `defineTheme` and `ThemeScope`: typed shared tokens, per-component overrides, and light, dark and system modes.
- Add eight presets as named exports and readonly `themes` entries.
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
