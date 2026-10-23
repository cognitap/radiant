# Changelog

See the [release policy](RELEASE_POLICY.md) for versioning and migration rules.

## Unreleased

- Breaking: Button is now headless. Radiant no longer ships default colors,
  radius, sizes, or motion. The `--color-*` and `--radius-control` tokens were
  removed from the stylesheet; define them (or use `buttonTheme`) in your app.
  Storybook shows the previous look as the Radiant theme next to a Headless row.
- Button's shape, size, type, elevation, state colors, and motion are CSS
  variables. Press and release take separate durations and easings, and the
  radius and `corner-shape` can change on press. `buttonTheme` maps typed settings
  to those variables. Button sets `data-slot`, `data-variant`, and `data-size`.
- `--ease-spring`, `--ease-snap`, and `--ease-settle` are new easing tokens.
- Migration: `--color-primary-hover` and `--color-primary-active` are removed.
  Hover and press colors are derived from `--color-primary`. Tune them with
  `--button-hover-layer` and `--button-press-layer`. `--color-disabled` and
  `--color-disabled-foreground` are removed. A disabled button fades to
  `--button-disabled-opacity` when a theme sets it.
- Button adds `variant` (primary, secondary, warning, destructive, outline,
  ghost), `size` (small, default, large), `radius` (none, small, default, large,
  full), `iconOnly`, and `fullWidth`. New color tokens back each variant.
- `buttonTheme` adds `fontFamily`, `textTransform`, and `borderStyle`. Each DesignSystems theme
  now sets a matching Google Font, loaded in Storybook. The
  DesignSystems story replaces Midnight and Clay with Jelly (squircle pills,
  deep squishy press, spring release) and Ticket (scooped corners, dashed border).
- `buttonTheme` adds `borderWidth`, `borderColor`, `pressShiftX`,
  `ghostShadow`, and `ghostShadowPressed`. The
  DesignSystems story adds a Sharp 3D theme with square corners, 2px borders,
  and hard offset shadows.
- `class-variance-authority` 0.7.1 is a new runtime dependency.
- `pending` keeps the label's space, shows a spinner, and ignores activation.
  It does not set `disabled`, so focus can stay on the button.
- Keyboard, focus, and screen reader checks were not run in this change.
  Storybook has no interaction runner yet, and Button is not marked ready.

## 0.0.2

- Documentation and maintainer tooling cleanup. The Button API, styles and
  dependency requirements are unchanged; no migration is needed.
- Still experimental, with a single native Button. Automated package checks do
  not replace manual keyboard, focus and screen reader verification.

## 0.0.1

- Public package identity for the first, `0.0.1` release. Do not expect granular updates until package is mature enough to be used by third parties.
