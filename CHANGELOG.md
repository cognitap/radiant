# Changelog

See the [release policy](RELEASE_POLICY.md) for versioning and migration rules.

## Unreleased

- Button-styled links share Button hover and pressed feedback while retaining
  native anchor navigation. Disabled and pending buttons keep suppressing it.
- Checkbox check and mixed marks stay aligned with the native control when
  an unlabelled checkbox is placed in a stretched grid or Field.
- Storybook has global **Theme** and **Mode** controls, backed by the public
  preset registry and `ThemeScope`. Canvas and Docs share the selection.
  Ordinary stories inherit it; one system comparison replaces repeated family
  theme galleries. Stories use a shared default/state/composition/customisation
  structure and public imports.
- **Breaking: shared theme system (DEV-44).** `defineTheme` now authors typed
  semantic tokens, optional component overrides, and light/dark layers.
  `ThemeScope` applies a theme and independent light/dark/system mode to a
  subtree. The stylesheet supplies a provider-free neutral baseline; nested
  named themes reset omitted tokens and effects. Components consume shared
  roles instead of Button's overrides, and Button focus overrides are local.
- All eight presets have stable IDs and deliberate light/dark palettes. The
  `themes` registry is readonly; individual presets are exported. Font loading
  remains the application's responsibility, with system fallbacks supplied.
- Storybook theme frames use `ThemeScope`, keeping canvases, ghost text and
  shadows in the same mode. Sharp 3D retains its explicit hard borders. The
  Button comparison story checks its rendered canvases, palettes and shadows.
- **Migration:** replace `{ name, style }` themes with `defineTheme` and
  `theme.style` wrappers with `ThemeScope`. `Theme.style`, `Theme.surface`, and
  `radiantTheme` remain deprecated compatibility exports. Family theme helpers
  remain available but emit `--rad-<family>-*` variables; direct old CSS
  overrides must migrate. Shared primary/secondary/destructive roles become
  accent/neutral/danger. `radio.gap` moves to `radioGroup.gap`; inert
  `glowHover` is rejected by the new theme API. See the
  [theming guide](docs/theming.md) for defaults and the complete migration.

Earlier batch entries below record behavior at delivery time; the theme
migration above supersedes their token names and baseline measurements.

- `Card` is a grouped surface. It is a `<div>`, not a button, link, or region.
  The title is a level-2 heading unless `level` says otherwise. Actions inside
  the card stay real controls. In Storybook on Chrome 155, the accessibility
  tree exposed the title as a level-2 heading, the description as a paragraph,
  and the footer actions as a button and a link. The card itself had no role.
  The first Tab landed on Track, and the next Tab landed on the Details link.
  Tab on a card with no actions moved to the document body. A consumer
  section labelled by the title was exposed as a region. The Radiant surface
  was 384px wide in a 24rem frame, with an 8px radius, an 18px title at
  weight 550, and a shadow of 0 1px 2px at 6% black. The Ticket surface used
  the scooped corner. The card does not set a transition. Screen reader
  checks were not run.
- `Accordion` groups `Collapsible` sections. `single` keeps one section open,
  and `multiple` toggles each section on its own. The trigger is the summary,
  and its label is a level-3 heading unless `level` says otherwise. A disabled
  summary stays out of the tab order and does not toggle. In Storybook on
  Chrome 155, the accessibility tree exposed each trigger label as a level-3
  heading. Space and Enter toggled the focused summary and left focus there.
  Tab from a closed summary moved to the next summary. Tab from an open
  summary reached a button in the content. ArrowDown left focus on the summary.
  Opening one section in single mode closed the other. In multiple mode, Enter
  opened a second section and left the first open. Clicking another summary
  while focus was on a button inside the open section closed the first, opened
  the second, and left focus on that summary. Tab skipped a disabled summary.
  Space, Enter, and a click did not open it. Enter on a nested summary left
  the parent section open. A controlled accordion followed `onValueChange`.
  Submitting a form while the section was closed included the hidden field.
  Reduced motion set `transition-property` to `none` on the panel and marker.
  The Radiant surface was 384px wide in a 24rem frame, with an 8px radius.
  The summary focus ring was a 2px solid outline, offset 2px. The Ticket
  surface used the scooped corner. Screen reader checks were not run.
- `Collapsible` is a native `<details>` element. The summary toggles it, and
  `open` is the browser's open state. Uncontrolled disclosures use
  `defaultOpen`. Controlled disclosures use `open` and `onOpenChange`; if
  `open` stays unchanged, the disclosure restores that value. A shared `name`
  is the native exclusive group. Closed content stays mounted, so a field
  inside it still submits with an ancestor form. The panel height and marker
  animate for 200ms, and `prefers-reduced-motion` sets `transition-property`
  to `none`. In Storybook on Chrome 155, Space and Enter toggled the summary
  and left focus there. Tab reached a button in the content only while open;
  while closed, Tab moved to the document body. Clicking the summary while
  focus was inside the content closed the disclosure and moved focus to the
  summary. Enter on a second disclosure with the same `name` opened it and
  closed the first. Enter on a nested summary left the parent open. A
  controlled disclosure followed `onOpenChange`. Submitting a form while the
  disclosure was closed included the hidden field. The Radiant surface was
  384px wide in a 24rem frame, with an 8px radius. The Ticket surface used the
  scooped corner. The summary focus ring was a 2px solid outline, offset 2px.
  Screen reader checks were not run.
- `Dialog` is a native `<dialog>`. `showModal()` supplies the modal layer, so
  the component does not add a portal, a focus trap, or a body scroll lock.
  Uncontrolled dialogs use `defaultOpen`. Controlled dialogs use `open` and
  `onOpenChange`; if `open` stays true after the browser closes, the dialog
  opens again. `closeOnBackdrop` and `closeOnEscape` default to true. A form
  with `method="dialog"` closes it. The panel stays in its document, so an
  ancestor form still owns its fields. `dialogTheme` maps typed settings to
  `--dialog-*` variables, and the panel inherits the button radius and corner
  shape. In Storybook on Chrome 155, the first focusable control was focused,
  and an `autoFocus` field took focus instead. Shift+Tab wrapped from the first
  control to the last. Tab from the last control focused the document body, and
  the next Tab returned to the first control without focusing the trigger.
  Escape closed the top dialog and restored the opener, including a nested
  dialog and a dialog opened without a trigger. A backdrop click closed and
  restored the trigger. Turning backdrop or Escape dismissal off left the
  dialog open. Submitting `method="dialog"` closed it. A field inside the
  dialog submitted with its ancestor form. A wheel and `scrollTo` still moved
  the page behind the open dialog. The Radiant panel was 512px wide with an
  8px radius, and the Ticket panel used the scooped corner. Screen reader
  checks were not run.
- `RadioGroup` is a fieldset of native radios. Uncontrolled groups use
  `defaultValue` and `form.reset()`. Controlled groups use `value` and
  `onValueChange` or `onChange`. Each `Radio` keeps its own label. A disabled
  choice stays in the group and is not selected. `radioTheme` maps typed
  settings to `--radio-*` variables. The disk stays a circle instead of
  inheriting the button corner shape. Arrow keys, focus entry, and focus exit
  were checked in Storybook: Tab entered on the selected radio, ArrowDown and
  ArrowUp skipped a disabled choice, and Tab left the group. Screen reader
  checks were not run.
- `Checkbox` is a native checkbox. Uncontrolled boxes use `defaultChecked` and
  `form.reset()`. Controlled boxes use `checked` and `onChange`. `indeterminate`
  is a visual mixed state on the DOM property, not a submitted value. A `label`
  wraps the input so the text toggles it, and a single-control Field supplies
  the accessible name. `checkboxTheme` maps typed settings to `--checkbox-*`
  variables. Space activation was checked in Storybook. Screen reader checks
  were not run.
- `Input` is a native text field. Uncontrolled inputs use `defaultValue` and
  `form.reset()`. Controlled inputs use `value` and `onChange`; `onBlur` stays
  the native event. Inside Field it takes the label, description, and error
  relationships. `inputTheme` maps typed settings to `--input-*` variables, which
  fall back to the button metrics. The native `size` attribute stays the
  character width. A plain form and a TanStack Form 1.33.5 reference (value,
  change, blur, reset) were verified. TanStack Form is not a package dependency.
  Keyboard, focus, and screen reader checks were not run.
- `Field` is the form anatomy for one control or a group. A host control receives
  its label, description, and error relationships; component controls read them
  with `useField()`. The consumer owns the error message. `fieldTheme` maps typed
  settings to `--field-*` variables. Keyboard, focus, and screen reader checks
  were not run. A native form submit was verified.
- `Link` joins the library: a native anchor for navigation with `inline`,
  `subtle`, and `button` variants (the button form reuses Button's variants via
  `tone`, `size`, and `radius`). `external` adds a safe target and rel when the
  consumer has not set them. A `render` prop hands the anchor props to a router
  adapter, keeping routers outside the core. `linkTheme` maps typed settings to
  `--link-*` variables, and links share the button focus variables and the shared
  themes. Keyboard, focus, and screen reader checks were not run for Link either.
- Themes moved to a shared `themes` export (with a `Theme` type), so future
  components wear the same design systems. Button stories consume the registry.
- Button ships with a neutral baseline (sizes, type, an ink-and-gray palette,
  focus ring, quiet press). Every value is a CSS variable, and Storybook shows
  the baseline next to fully themed variants, including the pine Radiant theme.
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
