# Changelog

See the [release policy](RELEASE_POLICY.md) for versioning and migration rules.

## Unreleased

## 0.0.5

- Add opt-in responsive typography: Body/Headings/UI/Code assignments, 16 text
  styles, independent prose/UI rhythm, font-aware starting points, deliberate
  style overrides and weight-range warnings (DEV-163). Export the pure
  `@cognitap/radiant/typography` entry and compile `typography.typesetting` through
  the existing portable theme document. Semantic HTML hooks share generated CSS
  across compiled and Tailwind routes, with local containers and compact fallback.
- Preserve legacy typography tokens and existing component exceptions. Existing
  component role adoption and the public editor remain later chapter work. Font
  loading stays consumer-owned. New authoring keys require matching JavaScript
  and CSS; older parsers reject them. This prepares an experimental release;
  publication and the exact public docs pin remain the chapter acceptance step.

Automated installed Chromium evidence covers roles, widths, modes/scopes, caller
overrides and text probes. It does not establish broad font/script, browser/AT
or final production chapter readiness.

## 0.0.4

- Expose independent Classic, Balanced and Expressive wall/brand-ramp presets,
  with Balanced defaults, separate vividness controls and materialised replay.
  Semantic action fills now choose the nearby readable brand shade at 4.5:1
  text and 3:1 surface boundaries; explicit semantic overrides stay authored.

Experimental, additive workshop APIs for portable theme documents, deterministic
color walls, semantic palettes and bounded appearance controls. Existing 0.0.3
components and themes require no migration. See `docs/theming.md` for the
document format, merge/replace rules, supported controls and installed CSS routes.
Output is opaque sRGB; Display P3 generation and font loading are not included.
Automated Chromium and installed-consumer checks do not establish manual
screen-reader, Safari/Firefox or stable-library readiness. The public workshop
is delivered independently by radiant-docs after it pins this registry release.

- Add `updateThemeAppearance` for generated palette/canvas integration and bounded
  spacing, density, radius, border, elevation and backdrop controls (DEV-155).
  Preserve independent modes, unrelated settings and component exceptions;
  compile ordinary theme documents through the existing runtime and CSS routes.
  Add canonical workspace and installed-package appearance verification.

- Add working-palette recommendations and semantic light/dark mapping (DEV-154).
  `recommendColorPalette` preserves the exact source and full wall, supports
  deliberate family/role overrides and reports unrounded contrast for named
  pairs, including explicit inactive-control exceptions. Return existing color
  and canvas token layers; inspect real component states using the canonical form.

- Add the deterministic OKLCH color-wall generator (DEV-153), available through
  the package root and a React-free `@cognitap/radiant/color` entry. It emits 16
  hue families plus Brand and Neutral ramps, defaults to exact source anchoring
  with reshaped neighbors, exposes bounded calibration controls and returns
  immutable replayable inputs and theme-document-compatible color data. Add
  reference/extreme-case coverage and a Storybook wall inspection story.

- Add versioned theme workshop documents (DEV-152): typed token sections,
  source/palette and portable font metadata, full/selective JSON exports,
  explicit merge/replace/reset updates and compilation through the existing
  `defineTheme`/`ThemeScope` contract. Exact brand anchoring is the default policy;
  palette generation and semantic role selection follow separately. Existing
  themes, component exceptions and scope behavior are preserved.

## 0.0.3

Experimental release of the harmonised ten-family system. **Breaking changes**
to component props, composition and theme interfaces are detailed below, with
migration guidance in `docs/system.md` and `docs/theming.md`. Version 0.0.3 is
explicitly selected for this experimental release. Automated installed-consumer
checks cover native/TanStack flows; actual VoiceOver verification is deferred
and is not claimed by this release.

- Verify the canonical native/TanStack forms and ten-family Workspace composition
  through an installed production archive (DEV-57), including hydration, native
  keyboard/form/reset behavior and modal cleanup. Add an opt-in Cognitap
  production checkpoint that preserves its registry pins and distinguishes the
  historical Button-only package from unreleased archive evidence. Actual AT
  verification remains explicitly pending; these checks do not publish a release.

- Verify installed styling artifacts through production builds (DEV-135):
  compiled CSS and Tailwind, with both reset choices, across all eight presets
  in light/dark. The required gate now retains versioned results and captures.
- Preserve complete CSS layer order in both compiled exports so consumer
  bundling cannot put Preflight above component utilities. Action-shaped Links
  explicitly remove native underlining without depending on a global reset.
- Let caller `hover:`/`active:` color utilities replace the shared action defaults,
  while explicit disabled/busy backgrounds preserve paint guards.

- Audit the ten-family harmonisation coverage (DEV-134), adding focused rendered
  scope and reduced-motion/forced-colors browser checks. Record the required gate
  and explicit manual/browser/artifact gaps without expanding support claims.

- Publish the browser/assistive-technology target matrix and evidence process
  (DEV-47), including manual scenarios, WCAG 2.2 A/AA mapping and explicit gaps.
  Browser runs now capture exact environment versions with their existing
  result artifacts. This does not declare untested browser/screen-reader support.

- Add the concise Radiant system guide (DEV-133), shipped with the package and
  linked from introductory, theming, Storybook and agent documentation. It covers
  the current ten-family contract and points to canonical live recipes; the
  original harmonisation sketches remain labelled as historical design evidence.

- **Breaking: remove superseded theme paths (DEV-132).** Remove all ten family
  `*Theme()` helpers and their corresponding type aliases, `radiantTheme`, and
  the resolved `Theme.style`/`Theme.surface` compatibility fields. Author shared
  themes with `defineTheme`, apply them with `ThemeScope`, and use
  `ThemeComponentOverrides` for reusable exceptions or `ThemeStyle` for local
  `--rad-*` styles. The old Radio gap shortcut moves to `components.radioGroup.gap`.
- Remove unused unprefixed Tailwind color/radius aliases and ambient
  `--ease-spring`, `--ease-snap`, `--ease-settle` variables. Use prefixed roles
  directly and define literal motion curves or application-owned variables.
  See the [migration steps and cleanup inventory](docs/theming.md#migration-from-button-centred-themes).
  Preset mode values, native composition and shared action styling are preserved.
  Button/Link local styles now accept typed CSS custom properties directly.

Earlier entries below record behavior at delivery time; DEV-132 supersedes their
compatibility-export and ambient-token availability notes.

- **Button-owned host replacement (DEV-119).** Button now accepts
  `render(resolvedNativeProps)` and exports ButtonRenderProps. DialogTrigger/Close
  inherit ButtonProps and compose Button in both default and replacement paths.
  Button owns resolved presentation and compatible-host validation.
- **Breaking: Dialog action replacement contract (DEV-119).** `render` now
  receives Button's resolved native presentation, including merged classes,
  children/pending markup, native attributes/ref and protected Dialog semantics.
  Set presentation props on DialogTrigger/Close and forward to one native/custom
  button; replace render→Button adapters, which would style and wrap children
  twice. Null, text, arrays, fragments and direct non-button hosts are rejected.
  `DialogRenderProps` exposes required, typed resolved presentation attributes.
- Both Dialog paths compose Button; guards run before the consumer once and
  then uncancelled Dialog requests. Pending busy state and computed presentation attributes are protected;
  composed actions retain both Button and Dialog part identities.

- **Breaking: Link replacement contract (DEV-118).** `render` returns one
  compatible `ReactElement`; null, text, arrays, fragments and direct native
  hosts other than anchors are rejected. Return your router element directly
  and forward its resolved native props to one anchor. `LinkRenderProps` now
  exposes the real anchor ref and required, typed resolved presentation attributes.
- Link protects its computed identity and presentation attributes from caller
  overrides. Native handlers/attributes/ref and merged presentation reach
  default and router anchors unchanged, including React callback-ref cleanup.
- Real Chromium checks cover Link click/Enter/Space, form behaviour, consumer
  cancellation, router interception, modified/middle-click tabs, external
  targets and downloads in Light/Dark. Storybook's router example now performs
  visible navigation and verifies it under every theme/mode.

- **Breaking: action presentation API (DEV-117).** Button and action-shaped
  Link use `variant="solid|soft|outline|ghost"`, `tone="accent|neutral|warning|danger"`
  and `controlSize="small|medium|large"`. Button defaults to solid/accent/medium;
  Link defaults to inline/accent/medium and also retains subtle decoration.
  Dialog actions inherit these props. `size`, `radius`, Link's `button` variant,
  and the old colour-named variants/tones are removed. Replace `ButtonSize` with
  `ControlSize`; remove `ButtonRadius` and use theme/local CSS. `ButtonVariant`
  and `LinkVariant` reflect the new vocabulary; `Tone` is a shared export.
  Selectors migrate from `data-size` to `data-control-size`, with `data-tone`
  recording palette independently. See the README's action migration table.
- Soft actions support all four tones; unfilled action/text-link ink derives
  from the selected palette and scope foreground. Neutral soft/outline/ghost
  preserve the previous neutral palette. The private shared recipe retains
  theme shape, motion, focus and elevation for both native buttons and anchors.
- Storybook controls and examples use the new API. Button's treatment/tone and
  size comparisons verify matching Link presentation across every theme/mode;
  inline/subtle links have a corresponding tone comparison.

- Shared private React bindings now preserve composed callback-ref cleanup,
  deduplicate owned/external description IDs and apply one cancellable activation
  order. Disabled Accordion activation guards run before consumer handlers.
- Dialog, Collapsible and Accordion share state ownership and no-op suppression.
  Composite defaults remain initial snapshots; prop synchronisation/restoration
  no longer emit semantic change requests. Ownership/type switches and supplying
  a controlled value together with its default now throw a descriptive error;
  remount with a new key for a new owner/type.
- An open Dialog now responds to changes in `modal` and preserves cleanup when
  rendered in another document. Interactive/context modules retain individual
  client boundaries; the package entry and pure modules remain server-safe.
- Storybook plays and axe now run as a required part of `pnpm check` and CI,
  across every preset in Light and Dark. Native Chromium scenarios cover modal
  keyboard/focus, cancellation, refs, StrictMode cleanup and hydration. CI saves
  JUnit results and failure screenshots; see the verification guide.
- Field groups no longer emit unsupported `aria-required` on fieldsets. Native
  radio `required` behavior is preserved. Disabled Field help/error text remains
  readable while its controls and labels dim once.
- Dialog ignores a queued native close notification when the same element has
  already reopened, preventing StrictMode effect cleanup from dismissing it.
- Storybook paints the real Canvas page background once instead of using a
  pseudo-element, so accessibility checks resolve the same backdrop as viewers.
- DialogTrigger and DialogClose now compose Button by default, inheriting its
  presentation options, theme effects, interaction states, and pending behavior.
  The separate Dialog action style recipe is removed. Action slots now include
  both identities (`button dialog-trigger` / `button dialog-close`); migrate
  equality selectors to `[data-slot~="dialog-trigger"]` / `[data-slot~="dialog-close"]`.
  DEV-119 subsequently migrates native render callbacks to resolved presentation.
- Dialog's default Storybook play compares its actual rendered actions against
  Button. The theme comparison uses default Dialog composition rather than
  manually opting into Button, exposing future drift at the default call site.
- A complete Storybook audit covers all 58 stories and 11 Docs pages across
  eight themes in light and dark. Form controls have clearer outlines, Checkbox
  keeps a box shape, and disabled checked/mixed marks remain visible, including
  forced colors. Nested disclosure arrows follow their own open state and focus
  rings follow the themed shape. Glass dialogs frost underlying content, and
  Sharp 3D links retain readable hover text. Responsive examples and Docs frames
  avoid clipping; Docs controls follow the selected palette and open dialogs no
  longer scroll the page on load. Demo actions and navigation show useful results.
- Browser play checks guard disabled selection visibility/alignment and the
  custom native Field input. These complement the theme comparison and now run
  in the required browser matrix.
- Ticket checkboxes use a compact solid outline instead of inheriting the
  scooped, dashed shape intended for larger controls and surfaces.
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
