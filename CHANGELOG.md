# Changelog

One line per user-visible change. See the [release policy](RELEASE_POLICY.md)
for versioning. Use the JavaScript and CSS from the same version.

## Unreleased

- Release MotionLink springs on lost pointer capture or removed destinations while preserving native anchor navigation.

- Keep Button presses tied to their active input, cancel unavailable motion cleanly, and honor theme motion off for CSS lift and shift.

## 0.0.6

- Add opt-in spring motion in `@cognitap/radiant/motion` and `/motion/react`, with serializable motion profiles in themes. Root imports stay free of the engine.
- Add `MotionProvider` for spring press feedback on Button and Dialog actions, disclosure height and Dialog presentation. Dismissal and focus stay immediate.
- Add `MotionLink` for spring feedback on action-shaped links.
- Add one-axis drag with release, snapping, cancellation and keyboard alternatives.
- Add `useSpringFollow` for changing targets and `useSpringLayout` for grid and flex resize and reorder.
- Motion follows live reduced-motion settings, `motion="off"` and the theme's motion profile. See [motion](docs/motion.md).

## 0.0.5

- Add typography recipes (`typography.typesetting`): Body, Headings, UI and Code fonts, 16 text styles and separate prose and UI rhythms.
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

- Add `ThemeDocument`: a versioned, JSON-portable theme format with section merge, replace and reset.
- Add `generateColorWall` in `@cognitap/radiant/color`: 18 palettes from one brand color, with Classic, Balanced and Expressive presets.
- Add `recommendColorPalette`: a working palette, light and dark color roles, and contrast checks.
- Add `updateThemeAppearance`: apply a palette with spacing, density, radius, border, elevation and backdrop settings.

## 0.0.3

- Add Link, Field, Input, Checkbox, RadioGroup, Radio, Dialog, Collapsible, Accordion and Card, each built on the native element.
- Add `defineTheme` and `ThemeScope`: typed shared tokens, per-component overrides, and light, dark and system modes.
- Add eight presets in the readonly `themes` registry, each also a named export.
- Add Button `variant`, `tone`, `controlSize`, `pending`, `iconOnly`, `fullWidth` and `render`.
- Add `ThemeStyle` for typed `--rad-*` variables in `style`.
- `data-slot` holds a set of identities. Select with `~=`, as in `[data-slot~="button"]`.
- Passing a controlled value together with its default, or switching owner during a mount, throws.
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

- Documentation and tooling cleanup. No API change.

## 0.0.1

- First public release.
