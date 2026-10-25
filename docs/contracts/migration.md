# Harmonisation migration inventory

This is the migration map for DEV-104/DEV-105. The [canonical contract](./README.md)
defines the target. This inventory records the original baseline and migration
destinations; delivery proceeds through the linked harmonisation issues.
The current README and package declarations describe the implemented API.
Shared themes and default Dialog action composition have landed in the
foundation/Storybook work. DEV-117 implements the action vocabulary below;
remaining family and replacement contracts still require their migrations.

DEV-118 implements Link's resolved native anchor/ref replacement contract.
Adapters return one compatible element and preserve the forwarded props/ref;
invalid direct return shapes now fail explicitly. See the README's Link section
for migration details. DEV-119 adds render to Button, including the public
ButtonRenderProps type. DialogTrigger/Close inherit that interface and compose
Button in both host paths. Set presentation on the owner, then forward resolved native
props/ref/children to one button. Replace render→Button adaptations with native
or custom button adapters; resolved children already contain Button's label and
pending mark. Direct null/text/array/fragment/non-button outputs are rejected.
Dialog surface and lifecycle alignment remain with DEV-127.

The baseline is the ten current families in `src/index.ts`: Button, Link, Field,
Input, Checkbox, RadioGroup (including Radio), Dialog, Collapsible, Accordion,
and Card. Preserve flat PascalCase component exports and their named parts.

## Public API migration

The shared runtime conventions now ship through DEV-48: ID reference merging,
cancellable activation, callback-ref cleanup and state ownership/lifecycle for
Dialog, Collapsible and Accordion. See [the binding guide](../react-bindings.md)
for current consumers and the remaining family-specific migration work.

| Current API                                                        | Target migration                                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Button `variant="primary"`                                         | `variant="solid" tone="accent"`                                                                   |
| Button `variant="secondary"`                                       | `variant="soft" tone="neutral"`                                                                   |
| Button `variant="warning"`                                         | `variant="solid" tone="warning"`                                                                  |
| Button `variant="destructive"`                                     | `variant="solid" tone="danger"`                                                                   |
| Button `variant="outline"` / `"ghost"`                             | Same variant, `tone="neutral"`                                                                    |
| Button/Link `size="small" / "default" / "large"`                   | `controlSize="small" / "medium" / "large"`                                                        |
| Button/Link `radius`                                               | Remove the presentation prop; use a scoped component override or local `style`                    |
| Link `variant="button" tone={oldButtonVariant}`                    | Apply the corresponding Button variant/tone mapping above                                         |
| Link `variant="inline" / "subtle"`                                 | Same variant; default `tone="accent"`; tone always means palette role                             |
| Native Input/Checkbox/Radio `size`, `value`, `checked`, `onChange` | Preserve native meanings and types; visual sizing uses `controlSize`                              |
| Ten independent `*Theme()` helpers                                 | One `defineTheme({ id, name, tokens, components, modes })` authoring contract                     |
| `Theme = { name, surface?, style }`                                | Typed definition with stable `id`, shared tokens, optional component overrides and mode overrides |
| Applying `radiantTheme` or `theme.style` to a wrapper              | Apply a resolved theme through `ThemeScope`; local CSS overrides still use `style`                |
| `themes.find(theme => theme.name === 'Ticket')`                    | Select from the shared preset registry using stable `id="ticket"`                                 |
| Exact `[data-slot="button"]` selectors                             | Membership selectors, e.g. `[data-slot~="button"]`                                                |

Button defaults become solid/accent; Link defaults become inline/accent.
Button variants are solid, soft, outline, ghost; Link also supports inline and
subtle. Tones are accent, neutral, warning, danger. Keep `iconOnly`, `fullWidth`,
and `pending` on Button; keep `external` and anchor semantics on Link. Button
remains a button and Link remains navigation even when they share presentation.
`ButtonVariant` and `LinkVariant` now expose the new treatments. `ControlSize`
replaces `ButtonSize`, and `ButtonRadius` is removed in favour of theme/local
CSS. Shared visual sizing uses the canonical `controlSize` vocabulary;
`default` is not a fourth size.

## Families, ownership, and parts

| Family             | Runtime and public contract migration                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button             | Own action behavior and presentation. Use the shared action vocabulary, shared tokens, and Button-specific overrides. `className`, `style`, and `ref` target the button. Retain the `button` slot.                                                                                                                                                                                                                                                |
| Link               | Consume the shared action presentation for solid/soft/outline/ghost; keep inline/subtle link decoration. Preserve anchor/ref/router-adapter semantics. Retain the `link` slot. Its adapter follows the common replacement and event/ref merge contract.                                                                                                                                                                                           |
| Field              | Keep `label`, `description`, `error`, and `requiredIndicator` conveniences. Add explicit `controlId` and part styling hooks. Discriminate the control `<div>` and group `<fieldset>` hosts and refs. Stop automatically cloning native children; native adapters explicitly use `children(controlProps)`, while Radiant children consume `useField`. Preserve `field`, `field-label`, `field-required`, `field-description`, `field-error` slots. |
| Input              | Replace Button fallbacks with control/typography/focus roles. Add `controlSize`; retain native `size` as character width. Native events, form participation, and Field relationships remain. Styling/ref target the input; retain `input`.                                                                                                                                                                                                        |
| Checkbox           | Replace Input/Button fallback chains with shared roles. Add visual `controlSize`, retain native checked/defaultChecked/onChange and `indeterminate`. Style/ref still target the input despite decorative wrappers; expose label styling through the part contract. Retain `checkbox` and `checkbox-label`.                                                                                                                                        |
| RadioGroup / Radio | RadioGroup continues composing Field; its public root props/ref target the Field host, identified by `data-slot="field radio-group"`. Give the internal options container its own `radio-group-options` part/style hook. Move option spacing from `radio.gap` to `radioGroup.gap`. Radio uses shared border/focus/color/indicator-size roles, stays round by default, retains native radio semantics and `radio`/`radio-label` slots.             |
| Dialog             | Dialog stays a non-DOM state owner; DOM/ref/style belong to DialogContent's `<dialog>`. DialogTrigger and DialogClose compose Button and accept its presentation contract; delete parallel action styling. Their slot token sets include `button dialog-trigger` and `button dialog-close`. Preserve `dialog`, `dialog-title`, `dialog-description` slots and all existing named exports. Move surface/title/focus styling to shared roles.       |
| Collapsible        | Preserve `<details>`/`<summary>` semantics, open/defaultOpen/onOpenChange, native toggle events, and `collapsible`, `collapsible-trigger`, `collapsible-content` slots. Use shared surface/focus/disclosure-motion roles. A summary does not become Button.                                                                                                                                                                                       |
| Accordion          | Preserve single/multiple discriminated value APIs and compose Collapsible. Add identity without overwriting the composed primitive: `collapsible accordion-item`, `collapsible-trigger accordion-trigger`, `collapsible-content accordion-content`. Retain root `accordion`; document the heading host separately from the summary ref/style target.                                                                                              |
| Card               | Keep flat Card/Header/Title/Description/Content/Footer exports and heading `level`. Use shared surface/typography roles. Actions in examples compose Button/Link. Preserve `card`, `card-header`, `card-title`, `card-description`, `card-content`, `card-footer`.                                                                                                                                                                                |

Do not infer event, ref, or styling targets from the outermost DOM wrapper.
Each family follows the host/part rules in the canonical contract. Generated
accessibility IDs, caller IDs, event cancellation, disabled/pending behavior,
and composed refs must survive the migration. Keep native state attributes and
the current public state hooks (`useField`, `useDialog`, `useCollapsible`,
`useAccordion`); align their documented contracts when implementation changes.

Audit current `data-state`, `data-disabled`, `data-invalid`, `data-required`,
`data-layout`, `data-type`, `data-value`, `data-variant`, and `data-size` selectors
and tests during the corresponding family migration. Attribute values must
reflect the new vocabulary; replace `data-size` with `data-control-size` for
visual controlSize rather than a native input's character width. Native `disabled`, `open`, `checked`,
and ARIA attributes remain the source of their respective platform behavior.

## Theme helper keys

The inventory below covers every current helper key. Each grouped destination
is a semantic role, not permission to copy all existing Button values into the
shared theme. Theme authors explicitly choose shared defaults; a value intended
for one family stays in `components.<family>` under its existing camelCase key.

Shared CSS variables use `--rad-`, for example `--rad-color-accent`,
`--rad-control-radius`, and `--rad-focus-width`. Component overrides use
`--rad-<family>-<key>`, e.g. `--rad-button-radius`. An override falls back to a
shared role or its documented component default, never another family's token.
Except for Button's `focusColor` exception below, current helper keys serialize
as `--<family>-<kebab-key>`; all old variable consumers require migration.

### Button: `buttonTheme` / `ButtonTheme`

| Current keys                                                                                     | Destination                                                                                         |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `height`, `heightSmall`, `heightLarge`                                                           | Medium/small/large control height roles                                                             |
| `padding`, `paddingSmall`, `paddingLarge`                                                        | Medium/small/large control inline padding roles                                                     |
| `fontSize`, `fontSizeSmall`, `fontSizeLarge`                                                     | Medium/small/large control font-size roles                                                          |
| `radius`, `cornerShape`, `borderWidth`, `borderStyle`                                            | Shared control shape/border roles, or explicit Button overrides                                     |
| `fontFamily`, `fontWeight`, `letterSpacing`, `textTransform`                                     | `components.button`; promote to typography roles only when deliberately intended across the library |
| `borderColor`                                                                                    | Shared border color when intended across the library, otherwise Button override                     |
| `focusColor`                                                                                     | Shared focus color when intended across the library, otherwise Button-only focusColor               |
| `focusWidth`, `focusOffset`, `focusStyle`                                                        | Shared focus roles, or explicit Button overrides                                                    |
| `pressDuration`, `pressEase`, `releaseDuration`, `releaseEase`, `colorDuration`                  | Corresponding shared motion roles, or Button overrides                                              |
| `disabledOpacity`                                                                                | Shared disabled-opacity role, or Button override                                                    |
| `radiusPressed`, `cornerShapePressed`                                                            | `components.button`, pressed shape                                                                  |
| `shadow`, `shadowPressed`, `ghostShadow`, `ghostShadowPressed`                                   | `components.button`, action elevation; do not implicitly copy into passive surfaces                 |
| `highlight`, `sheen`, `glow`                                                                     | `components.button`, decorative layers                                                              |
| `backdrop`                                                                                       | `components.button.backdrop`, a backdrop-filter value                                               |
| `stateColor`, `hoverLayer`, `pressLayer`, `hoverLift`, `pressScale`, `pressShift`, `pressShiftX` | `components.button`, interaction effects                                                            |
| `glowHover`                                                                                      | Retire: the emitted `--button-glow-hover` has no runtime reader                                     |

Current `buttonTheme({ focusColor })` writes `--color-focus`, changing the
shared focus color. Its target Button override must become local; deliberate
theme-wide focus changes go through the shared token instead.

### Link: `linkTheme` / `LinkTheme`

| Current keys                                                                                | Destination                                    |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `color`, `hoverColor`, `underlineOffset`, `decorationThickness`, `decorationThicknessHover` | `components.link`, inline/subtle decoration    |
| `colorDuration`                                                                             | Shared motion color duration, or Link override |
| `focusColor`, `focusWidth`, `focusOffset`, `focusStyle`                                     | Shared focus roles, or Link overrides          |

Button-styled Link consumes the same action presentation contract as Button;
decorative Link-only settings must not create another action styling system.

### Field: `fieldTheme` / `FieldTheme`

| Current keys                               | Destination                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `gap`                                      | Shared field spacing role, or Field override                                                 |
| `labelColor`, `labelSize`, `labelWeight`   | Foreground/body-size/label-weight roles, or Field overrides                                  |
| `descriptionColor`, `descriptionSize`      | Muted foreground/small text roles, or Field overrides                                        |
| `errorColor`, `errorSize`, `requiredColor` | Invalid/small text/invalid roles, or Field overrides                                         |
| `disabledOpacity`                          | Shared disabled-opacity role, or Field override; avoid compounding opacity with its controls |

### Input: `inputTheme` / `InputTheme`

| Current keys                                                                               | Destination                                                                                                      |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `height`, `padding`, `fontSize`                                                            | Medium control metrics by default; controlSize selects the size family; explicit Input overrides remain possible |
| `fontFamily`, `fontWeight`                                                                 | Input overrides, or explicitly shared typography family/body weight                                              |
| `color`, `background`, `borderColor`, `placeholder`, `invalidBorder`, `disabledBackground` | Foreground/surface/border/placeholder/invalid/disabled-background roles, or Input overrides                      |
| `borderWidth`, `borderStyle`, `radius`, `cornerShape`                                      | Shared control roles, or Input overrides                                                                         |
| `shadow`                                                                                   | `components.input.shadow`                                                                                        |
| `focusColor`, `focusWidth`, `focusOffset`, `focusStyle`                                    | Shared focus roles, or Input overrides                                                                           |

### Checkbox: `checkboxTheme` / `CheckboxTheme`

| Current keys                                            | Destination                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `size`                                                  | Shared indicator-size role selected by controlSize, or Checkbox override |
| `radius`, `cornerShape`, `borderWidth`, `borderStyle`   | Shared control roles, or Checkbox overrides                              |
| `background`, `borderColor`                             | Surface/border roles, or Checkbox overrides                              |
| `checkedBackground`, `checkedBorder`, `mark`            | Accent/accent/accent-foreground roles, or Checkbox overrides             |
| `invalidBorder`, `disabledBorder`, `disabledBackground` | Matching shared color roles, or Checkbox overrides                       |
| `gap`                                                   | Shared label spacing, or Checkbox override                               |
| `labelColor`, `labelSize`                               | Foreground/body text roles, or Checkbox overrides                        |
| `focusColor`, `focusWidth`, `focusOffset`, `focusStyle` | Shared focus roles, or Checkbox overrides                                |

### Radio: `radioTheme` / `RadioTheme`

| Current keys                                            | Destination                                                                             |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `size`                                                  | Shared indicator-size role selected by controlSize, or Radio override                   |
| `radius`, `cornerShape`                                 | Radio overrides; default shape remains round independently of the control radius        |
| `borderWidth`, `borderStyle`                            | Shared control roles, or Radio overrides                                                |
| `background`, `borderColor`                             | Surface/border roles, or Radio overrides                                                |
| `checkedBackground`, `checkedBorder`, `mark`            | Accent/accent/accent-foreground roles, or Radio overrides                               |
| `invalidBorder`, `disabledBorder`, `disabledBackground` | Matching shared color roles, or Radio overrides                                         |
| `gap`                                                   | `components.radioGroup.gap`, falling back to group spacing; this is the option grid gap |
| `labelGap`                                              | Shared label spacing, or Radio override                                                 |
| `labelColor`, `labelSize`                               | Foreground/body text roles, or Radio overrides                                          |
| `focusColor`, `focusWidth`, `focusOffset`, `focusStyle` | Shared focus roles, or Radio overrides                                                  |

### Dialog: `dialogTheme` / `DialogTheme`

| Current keys                                                            | Destination                                                                                         |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `width`                                                                 | `components.dialog.width`                                                                           |
| `padding`, `gap`, `radius`, `cornerShape`, `borderWidth`, `borderStyle` | Shared surface roles, or Dialog overrides                                                           |
| `background`, `color`, `borderColor`                                    | Surface/foreground/border color roles, or Dialog overrides                                          |
| `shadow`                                                                | Overlay elevation role, or Dialog override                                                          |
| `backdrop`                                                              | Shared surface backdrop background, or Dialog override; unlike Button backdrop this is not a filter |
| `titleSize`, `titleWeight`, `descriptionColor`, `descriptionSize`       | Heading-size/heading-weight/muted-foreground/small-text roles, or Dialog overrides                  |
| `focusColor`, `focusWidth`, `focusOffset`, `focusStyle`                 | Shared focus roles, or Dialog overrides                                                             |

### Collapsible: `collapsibleTheme` / `CollapsibleTheme`

| Current keys                                                            | Destination                                                          |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `radius`, `cornerShape`, `borderWidth`, `borderStyle`, `padding`, `gap` | Shared surface roles, or Collapsible overrides                       |
| `background`, `color`, `borderColor`, `contentColor`                    | Surface/foreground/border/foreground roles, or Collapsible overrides |
| `contentSize`                                                           | Body text role, or Collapsible override                              |
| `duration`                                                              | Shared disclosure duration, or Collapsible override                  |
| `focusColor`, `focusWidth`, `focusOffset`, `focusStyle`                 | Shared focus roles, or Collapsible overrides                         |

### Accordion: `accordionTheme` / `AccordionTheme`

| Current key | Destination                                         |
| ----------- | --------------------------------------------------- |
| `gap`       | Shared group spacing, or `components.accordion.gap` |

Keep Collapsible as the owner of disclosure surface, trigger, content, and
motion. Accordion's own override controls collection layout; its composition
must not silently duplicate the primitive's complete theme interface.

### Card: `cardTheme` / `CardTheme`

| Current keys                                                                      | Destination                                                                      |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `radius`, `cornerShape`, `borderWidth`, `borderStyle`, `padding`, `gap`, `shadow` | Shared surface roles, or Card overrides                                          |
| `background`, `color`, `borderColor`                                              | Surface/foreground/border color roles, or Card overrides                         |
| `headerGap`, `footerGap`                                                          | Shared header/footer spacing roles, or Card overrides                            |
| `titleSize`, `titleWeight`, `descriptionColor`, `descriptionSize`                 | Heading-size/heading-weight/muted-foreground/small-text roles, or Card overrides |

## Shared variables and presets

| Current shared token                                    | Target semantic role                                                                                                                                                                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--color-background`                                    | `color.surface`; the application canvas is a separate background role                                                                                                                                                   |
| `--color-foreground`, `--color-border`                  | `color.foreground`, `color.border`                                                                                                                                                                                      |
| `--color-primary`, `--color-primary-foreground`         | `color.accent`, `color.accentForeground`                                                                                                                                                                                |
| `--color-secondary`, `--color-secondary-foreground`     | Neutral soft-action palette; retain equivalent neutral surface/foreground values in the typed palette                                                                                                                   |
| `--color-warning`, `--color-warning-foreground`         | Warning palette pair                                                                                                                                                                                                    |
| `--color-destructive`, `--color-destructive-foreground` | Danger palette pair                                                                                                                                                                                                     |
| `--color-focus`                                         | Shared focus color                                                                                                                                                                                                      |
| `--radius-control`                                      | Shared control radius                                                                                                                                                                                                   |
| `--ease-spring`, `--ease-snap`, `--ease-settle`         | Move the required curve values into `motion.pressEase` / `motion.releaseEase` or the deliberate component override; preserve the selected spring, snap or settle behavior without relying on old ambient variable names |
| `Theme.surface`                                         | `surface.canvas`, a CSS background value that may contain a gradient                                                                                                                                                    |

The neutral palette needs the soft background and matching readable foreground
currently supplied by secondary. New muted/placeholder/invalid/disabled roles
replace repeated local color mixtures; components no longer invent their own
theme-wide colors independently.

| Current preset                      | Stable target id | Migration concern                                                                                                                                         |
| ----------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `radiant` / exported `radiantTheme` | `radiant`        | Replace the CSSProperties-only alias with the typed theme contract; intentionally choose shared typography instead of promoting every action font setting |
| `defaultTheme`                      | `default`        | Resolve a complete default theme; `{ style: {} }` cannot reset an inherited custom theme                                                                  |
| `soft` / Soft squircle              | `soft-squircle`  | Separate shared squircle control/surface shape from pressed Button shape                                                                                  |
| `expressive`                        | `expressive`     | Preserve its intentional focus treatment and action motion without imposing action font weight on body text                                               |
| `glass`                             | `glass`          | Move the gradient frame to surface.canvas; keep translucent component color.surface and backdrop-filter separate                                          |
| `sharp` / Sharp 3D                  | `sharp-3d`       | Separate canvas, shared borders, and Button's offset pressed shadows; uppercase remains an explicit action choice                                         |
| `jelly`                             | `jelly`          | Preserve action squash/spring effects without animating passive surfaces                                                                                  |
| `ticket`                            | `ticket`         | Separate canvas, dashed borders, scoop shape, and uppercase action typography                                                                             |

`themes` becomes one typed readonly preset registry used by consumers and
Storybook. Keep display names human-readable; never use them as persistent
identity. Fonts need documented loading and fallbacks. Theme mode is independent
of identity, and preset light/dark completeness is verified in the later preset
issue rather than claimed by this inventory.

## Removal and verification ledger

The runtime migration must remove Button fallback chains from Input,
Checkbox, Radio, Dialog, Collapsible, and Card; Link also stops inheriting
Button focus/motion variables. Input/Checkbox/Radio currently reference
`--button-focus-color`, although Button's helper emits `--color-focus` instead.
Replace that stale path with shared focus roles. Dialog's independent
`dialogActionVariants` must disappear when its actions compose Button.

Audit hardcoded font sizes, icon/indicator dimensions, `min-h-6`, gaps, and
colors as well as exported variables. A complete token map alone does not fix
those consumers. Register new non-color utilities with `cn` as required by
AGENTS.md and verify caller class overrides in the later implementation issues.

Storybook removes per-story theme wrappers, `--themes` story-id exceptions,
copied frame helpers, and repeated component theme galleries. A global selector
uses the same preset registry and ThemeScope behavior for Canvas and Docs;
one intentional comparison page covers cross-theme inspection.

Later changes must verify named-theme resets, local partial overrides, mode
inheritance, Button-only override isolation, native input size preservation,
part/ref/event composition, disabled/pending/form behavior, and both compiled
CSS and Tailwind consumption. Documentation-only DEV-104 does not implement
or claim those checks pass. Mark public API/token/part changes breaking and
provide release migration notes under RELEASE_POLICY.md; do not leave old
helpers or exports in an undocumented indefinite compatibility layer.
