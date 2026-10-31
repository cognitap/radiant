# Theming

Radiant has one theme model. Shared tokens define the design system, and
component overrides are deliberate exceptions. For how this fits the rest of the
library, see [architecture](architecture.md).

Import `@cognitap/radiant/styles.css` once. It gives every component a neutral
light and dark baseline without a provider. Tailwind applications can use the
[source route](../README.md#with-tailwind) instead; both read the same theme
variables.

## Make a theme

```tsx
import { defineTheme } from '@cognitap/radiant'

const garden = defineTheme({
  id: 'garden',
  name: 'Garden',
  tokens: {
    color: { accent: '#166534', accentForeground: '#ffffff' },
    typography: { family: 'system-ui, sans-serif' },
    control: { radius: '0.75rem' },
    surface: { radius: '1rem' }
  },
  components: {
    button: { fontWeight: 650, pressScale: 0.97 }
  },
  modes: {
    dark: { tokens: { color: { accent: '#86efac', accentForeground: '#052e16' } } }
  }
})
```

`id` is a stable lowercase slug; store and select themes by it. `name` is the
display label. Every field is a typed partial override of the library defaults,
and the result is immutable, JSON-serializable data.

Unknown groups, roles, components or keys fail the type check and throw at
runtime. Values are CSS strings, weights may be numbers, and opacities are
numbers from 0 to 1. Radiant does not check CSS grammar or contrast:
`var(--brand)` is accepted as is.

Each mode resolves as **library mode defaults → common values → that mode's
values**. Put a color in common `tokens` only if it works in both modes;
otherwise give its dark value too.

## Apply it

```tsx
import { Button, ThemeScope, defaultTheme } from '@cognitap/radiant'

;<ThemeScope
  theme={garden}
  mode="system"
>
  <Button>Save</Button>
  <ThemeScope theme={defaultTheme}>
    <Button>Neutral action</Button>
  </ThemeScope>
</ThemeScope>
```

`ThemeScope` is a plain `div` that takes native props and a ref. It paints its
canvas, foreground and body text for its subtree only. It never touches the
document, loads fonts or stores a preference.

- **`theme`** starts fresh from the library defaults. Nothing from an outer
  theme leaks in, so `defaultTheme` fully resets a subtree, including button
  effects.
- **`mode`** is `light`, `dark` or `system`, independent of the theme. `system`
  uses a CSS media query, so server and client markup match.
- **Omit either** to inherit it. At the root the stylesheet defaults to
  `system`.
- **Inline `style`** on a scope wins over its generated values. Theme variables
  set inline on a scope survive nested mode-only scopes. A new named theme
  clears them.

A mode-only scope recomputes the current theme, so it does not keep token
overrides from a stylesheet rule or plain wrapper above it. Put overrides that
must survive a mode switch in the theme or in a scope's inline `style`.

A native Dialog stays in the scope where it renders.

## Override one component

Values resolve as **component override → shared token → baseline**. For
example, `components.button.radius` changes Button only, while
`tokens.control.radius` changes Button, Input and the other controls. A
component never falls back to another component's override.

Component keys are grouped by family under `components`: `button`, `link`,
`field`, `input`, `textarea`, `slider`, `select`, `combobox`, `checkbox`, `switch`, `radio`, `radioGroup`, `dialog`, `popover`, `tooltip`, `menu`, `alert`, `toast`, `progress`, `collapsible`,
`accordion`, `tabs` and `card`. Every key is listed in
[`src/themes/components.ts`](../src/themes/components.ts). Set fonts, uppercase,
shadows and press motion for every action through the [roles](#roles); use
`components.button` only when Button alone should differ.
`radioGroup.gap` spaces the options, and `radio.labelGap` spaces one option's
label.

Every token and key has a CSS variable named after its path:

| Path                           | CSS variable                  |
| ------------------------------ | ----------------------------- |
| `tokens.color.accent`          | `--rad-color-accent`          |
| `tokens.control.medium.height` | `--rad-control-medium-height` |
| `components.button.radius`     | `--rad-button-radius`         |
| `components.radioGroup.gap`    | `--rad-radio-group-gap`       |

For a one-off change, set the variable in `style`. `ThemeStyle` types it:

```tsx
import { Button, type ThemeStyle } from '@cognitap/radiant'

const local: ThemeStyle = { '--rad-button-radius': '1rem' }

<Button style={local}>Save</Button>
```

Use `ThemeComponentOverrides` to type reusable override objects. Theme values
are inline custom properties, so a stylesheet rule on the same element cannot
override them; use `style`, or set the variable on a descendant. Caller classes
merge after the defaults. Variables starting with `--_` are internal.

Some defaults to know:

- Checkbox caps an inherited radius at a quarter of its size, so it stays a
  box. An explicit `components.checkbox.radius` still wins.
- Radio stays circular under any control shape.
- Input, Textarea, Checkbox, Switch and Radio outlines mix border and foreground colors, so
  controls have more contrast than passive dividers.
- Disabled opacity applies once, not again on a disabled child.

Restyling must keep components usable. See
[what customization must keep](architecture.md#what-customization-must-keep).

## Roles

A theme should not need component overrides to look coherent. Each part of a
component plays one **role**, and each role reads one token group, so one
setting restyles every family that plays it. Overrides stay for exceptions.

| Role      | Token group                                  | Parts                                                                                                                                 |
| --------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Action    | `control.action`                             | Button and the parts built on it, Link's button variants, ButtonGroup; the voice of tabs, chips and Table column headers              |
| Field     | `control.field`                              | Input, Textarea, NativeSelect, InputGroup, OTP slots, Select, Combobox and TagsInput                                                  |
| Indicator | `control.indicator`                          | Checkbox and Radio boxes, the Switch track, Switch and Slider thumbs                                                                  |
| Track     | `control.track`                              | ToggleGroup and Tabs lists, Progress, Meter, Skeleton, Slider and ScrollArea rails, Resizable hover, the Menubar border               |
| Selected  | `control.selected`                           | Pressed toggles, the ToggleGroup indicator, the selected tab, NavLink, the current page, Carousel indicator, chosen option, open menu |
| Surface   | `surface`                                    | Card, Alert, Collapsible, Accordion, TableContainer, EmptyState, CodeBlock, Carousel, Sidebar, Separator, Tabs content                |
| Overlay   | `surface.overlay*`, `surface.backdropFilter` | Popover, HoverCard, Menu, listboxes, Tooltip, Dialog, Drawer, NavigationMenu viewport; Toast's shadow                                 |
| Item      | `control.item`                               | Highlighted rows in menus, listboxes and Command                                                                                      |

Tooltips keep their own background and cap their radius at `0.5rem`. Drawers
round only the edges that face the page.

The rules every family follows:

- **Concentric corners.** A part inset in a rounded parent uses the parent's
  radius minus the inset, and the parent's corner shape.
- **Capped corners.** Thin parts cap their radius at half their thickness, so
  a large radius gives pills and `0px` gives bars. Only parts that are round
  by meaning, such as Radio, always stay round.
- **One depth language.** `action.shadow`, `field.shadow`, `indicator.shadow`,
  `track.shadow` and the surface shadows should read as one material: hard
  offsets, bevels, glows or nothing.
- **One press.** `motion.pressScale`, `pressShiftX`, `pressShiftY` and
  `hoverLift` move every pressable, and `action.radiusPressed` reshapes it.
- **Inline actions.** Buttons inside a field or chip, such as NumberField's
  steppers, PasswordInput's toggle and Tag's remove, stay flat and take the
  field's voice. A Select trigger is a field, not a Button.
- **Chips.** Badge, Tag, Kbd and Avatar take the control radius, corner shape
  and border, capped at half their height. Avatar stays round unless the
  control radius is `0px`.
- **One voice.** `action.fontFamily`, `fontWeight`, `textTransform` and
  `letterSpacing` set how actions and Table column headers read. Labels and
  values keep their roles.
- **One selection.** `control.selected` draws the chosen member of every set.
  An underline is an inset bottom shadow on a transparent background.

Unset selected, item and track keys leave each family its own baseline look.

## Example themes and fonts

The core entry ships one theme, `defaultTheme`. The other presets are examples
to copy or start from, published separately at `@cognitap/radiant/examples`.
Its readonly `themes` registry lists them, each is a named export, and
`themeDefinitions` holds the definition behind each theme in the same order.
Pass a definition to `themeDocumentFromDefinition` to edit it as a document;
the theme workshop starts from these.

```tsx
import { jelly } from '@cognitap/radiant/examples'
```

| ID              | Name          | Export                | Fonts                                  | Language                                            |
| --------------- | ------------- | --------------------- | -------------------------------------- | --------------------------------------------------- |
| `radiant`       | Radiant       | `radiant`             | Inter                                  | Calm product UI, raised white selection             |
| `default`       | Default       | `defaultTheme` (core) | System sans                            | The neutral baseline                                |
| `soft-squircle` | Soft squircle | `soft`                | Nunito                                 | Squircles, filled wells, diffuse shadows            |
| `sharp-3d`      | Sharp 3D      | `sharp`               | System sans; Archivo Black for actions | Neo-brutalist ink outlines and hard offset shadows  |
| `glass`         | Glass         | `glass`               | Manrope                                | Frosted translucent layers over a gradient          |
| `jelly`         | Jelly         | `jelly`               | Baloo 2                                | Clay bevels, pressed-in wells, springy presses      |
| `ticket`        | Ticket        | `ticket`              | Barlow Condensed                       | Notched controls, scooped dashed stubs, inked picks |
| `neon`          | Neon          | `neon`                | IBM Plex Mono                          | Bevel-cut corners and glows on a grid               |
| `editorial`     | Editorial     | `editorial`           | Source Serif 4                         | Serif on paper, hairlines, underlined selection     |

Choosing a theme never downloads a font. Load the families yourself with weights
400, 600 and 700, and Archivo Black 400 for Sharp 3D. Every family falls back
to a system family.

Glass uses a gradient canvas and translucent surfaces, and
`surface.backdropFilter` frosts every floating panel. `surface.backdrop` paints
the overlay behind a dialog. Shapes use CSS `corner-shape`; browsers without it
show ordinary rounded corners.

## Typography

Typesetting is an opt-in recipe compiled into the theme. It assigns Body,
Headings, UI and Code fonts, 16 text styles, and separate prose and UI rhythms.

```tsx
import { ThemeScope, compileThemeDocument, defineThemeDocument } from '@cognitap/radiant'

const theme = compileThemeDocument(defineThemeDocument({
  kind: 'radiant-theme', version: 1, id: 'publication', name: 'Publication',
  sections: { typography: { typesetting: {
    preset: 'source-serif',
    prose: { paragraphSpacing: 1.4 },
    styles: { 'prose-title': { weight: 650 } }
  } } }
}))

<ThemeScope theme={theme}>
  <article data-rad-prose="" data-rad-type-container="">
    <h1>Title</h1>
    <p data-rad-text="prose-lead">Lead paragraph.</p>
  </article>
</ThemeScope>
```

`preset` is `inter` (default), `source-serif` or `plex`. Each of `fonts.body`,
`headings`, `ui` and `code` takes a CSS `family` and an optional `profile`
(`inter`, `source-serif-4`, `plex-sans`, `plex-mono` or `manual`). A profile is
your claim about the font; Radiant does not detect it.

| Setting                    | Range                                                                                                | Default                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `prose.size`               | 12–40px                                                                                              | Inter/Plex 20, Serif 21, manual 20 |
| `prose.lineHeight`         | 1–3                                                                                                  | Inter/Plex 1.6, Serif/manual 1.65  |
| `prose.paragraphSpacing`   | 0–4em                                                                                                | 1.25em                             |
| `prose.measure`            | 20–120ch                                                                                             | Inter/manual 64, Serif/Plex 62     |
| `prose.headingScale`       | 1.1–1.5                                                                                              | 1.25                               |
| `ui.size`, `ui.lineHeight` | 12–32px, 1–3                                                                                         | 16px / 1.5                         |
| `styles[role]`             | `narrow` 8–256px, `wide` 8–512px, weight 1–1000, leading 0.8–3, tracking −0.2–0.5em, measure 0–120ch | From the preset                    |

Explicit `typography.values` override the recipe, and mode values override
both. Out-of-profile weights produce `warnings` rather than being clamped.
To reset a style, omit it and **replace** the typography section; a merge cannot
delete a key. `generateTypography` and the presets are also exported from the
React-free `@cognitap/radiant/typography` entry.

HTML hooks:

- `data-rad-text="<role>"` applies one of the 16 styles listed in
  `typographyRoles`. It does not change heading levels or ARIA.
- `data-rad-prose` styles the container's **direct** headings, paragraphs,
  lists, quotes and code blocks. `data-rad-not-prose` on a child opts it out.
- `data-rad-type-container` makes heading sizes scale with the column's width,
  between 24rem and 56rem. Body and UI sizes stay fixed.

The hooks have low specificity, so utilities, your CSS and inline styles win.
Load real italic and bold faces; synthetic styles are turned off.

Components use the UI roles:

| Text                                                                        | Role                      |
| --------------------------------------------------------------------------- | ------------------------- |
| ThemeScope, Card, DialogContent, Field, disclosure body                     | `ui-body`                 |
| CardTitle, DialogTitle                                                      | `ui-title`                |
| Field label, disclosure triggers, Button, Checkbox, Switch and Radio labels | `ui-label`                |
| Input, Textarea                                                             | `ui-body`                 |
| Field help and error, CardDescription, DialogDescription                    | `ui-supporting`           |
| Inline Link                                                                 | Inherits surrounding text |

Controls keep their own font size from `control.<size>.fontSize`, so changing
the UI role size does not resize buttons or inputs.

## Colors

`generateColorWall` builds 18 palettes of 11 shades (50–950) from one brand
color. `recommendColorPalette` picks a working set from that wall, maps it to
light and dark color roles, and reports contrast checks. Both are pure,
deterministic and exported from the React-free `@cognitap/radiant/color` entry.

```ts
import { generateColorWall, recommendColorPalette } from '@cognitap/radiant/color'
import { updateThemeAppearance, compileThemeDocument } from '@cognitap/radiant'

const wall = generateColorWall({ brand: '#7C3AED', wallPreset: 'expressive' })
const palette = recommendColorPalette(wall, { working: { support: 'teal' } })
const failures = palette.checks.filter(check => check.pass === false)

const theme = compileThemeDocument(
  updateThemeAppearance(document, {
    palette,
    geometry: { values: { spacing: 1.25, controlRadius: 8 } }
  })
)
```

| Wall input       | Default     | Range                                               |
| ---------------- | ----------- | --------------------------------------------------- |
| `brand`          | Required    | Six-digit sRGB hex                                  |
| `fidelity`       | `anchored`  | `anchored` keeps the exact brand color as one shade |
| `wallPreset`     | `balanced`  | `classic`, `balanced`, `expressive`                 |
| `rampPreset`     | `balanced`  | Same values, for the brand palette only             |
| `vividness`      | From preset | 0–1, other palettes                                 |
| `brandVividness` | From preset | 0–1, brand palette                                  |
| `lightness`      | `hue-aware` | `hue-aware` or `shared`                             |
| `distribution`   | `1`         | 0.75–1.35                                           |
| `neutralTint`    | From preset | 0–0.035                                             |
| `hueAlignment`   | From preset | 0–1                                                 |
| `neutralHue`     | `255`       | Degrees, used when the brand is nearly gray         |

`wall.input` holds every effective setting, so passing it back reproduces the
same wall.

By default the working set is Brand (primary), the family nearest the brand
hue plus 150° (support), Neutral, Emerald (success), Amber (warning) and Red
(danger). Text must reach 4.5:1 against its background. Borders, focus rings and
the checked fill must reach 3:1. Disabled pairs are reported but not
required to pass. The checks cover these base pairs only. Recheck gradients,
translucency and overrides in the browser.

`updateThemeAppearance` applies a palette and geometry together without
touching component overrides:

| Geometry                                   | Range                       | Changes                                    |
| ------------------------------------------ | --------------------------- | ------------------------------------------ |
| `spacing`                                  | 0.5–2                       | All spacing gaps, surface padding and gap  |
| `density`                                  | 0.75–1.5                    | Control height, padding and indicator size |
| `controlRadius`                            | 0–32px                      | Control radius                             |
| `surfaceRadius`                            | 0–48px                      | Card, Dialog and Collapsible radius        |
| `controlBorderWidth`, `surfaceBorderWidth` | 0–4px                       | Border widths                              |
| `borderStyle`                              | `solid`, `dashed`, `dotted` | Control and surface borders                |
| `elevation`                                | 0–3                         | Surface and overlay shadows                |
| `backdropOpacity`                          | 0–0.9                       | Modal overlay                              |

Scales apply to the baseline, so applying `spacing: 1.25` twice gives the same
result. Values out of range throw instead of being clamped.

## Theme documents

`ThemeDocument` is the editable, versioned form of a theme, used by the docs
site's theme workshop. It keeps the authored values plus metadata such as
palettes and font descriptors. `compileThemeDocument` turns it into a `Theme`
for `ThemeScope`.

| Function                                        | Does                                                            |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `themeDocumentFromDefinition(definition)`       | Wraps a `defineTheme` input, keeping only explicit values       |
| `updateThemeDocument(doc, sections)`            | Deep-merges the given sections; arrays are replaced whole       |
| `updateThemeDocument(doc, sections, 'replace')` | Replaces each given section; `{ color: {} }` resets color       |
| `exportThemeSections(doc, ['color'])`           | Exports chosen sections without the theme's identity            |
| `parseThemeDocument(json)`                      | Validates a full document or a section export from `JSON.parse` |

Sections match the token groups plus `components`. Updating a section never
touches `components`, so per-component exceptions survive. Font descriptors
record requirements only; your application loads the fonts. Parsing rejects
unknown fields and unsupported versions with the failing path.

## Token reference

CSS names are `--rad-` plus the kebab-case path. The values come from
[`src/themes/tokens.ts`](../src/themes/tokens.ts). `surface.canvas` and
`surface.backdrop` accept any CSS background, including gradients.

| Path                                | Light default                        | Dark default                         |
| ----------------------------------- | ------------------------------------ | ------------------------------------ |
| `color.surface`                     | `oklch(1 0 0)`                       | `oklch(0.21 0.006 286)`              |
| `color.foreground`                  | `oklch(0.21 0.006 286)`              | `oklch(0.985 0 0)`                   |
| `color.mutedForeground`             | `oklch(0.45 0.01 286)`               | `oklch(0.75 0.01 286)`               |
| `color.border`                      | `oklch(0.885 0.005 286)`             | `oklch(0.4 0.008 286)`               |
| `color.placeholder`                 | `oklch(0.5 0.01 286)`                | `oklch(0.7 0.01 286)`                |
| `color.disabledBackground`          | `oklch(0.96 0.005 286)`              | `oklch(0.26 0.006 286)`              |
| `color.disabledBorder`              | `oklch(0.88 0.005 286)`              | `oklch(0.38 0.006 286)`              |
| `color.invalid`                     | `oklch(0.56 0.19 25)`                | `oklch(0.75 0.16 25)`                |
| `color.focus`                       | `oklch(0.55 0.13 255)`               | `oklch(0.75 0.13 255)`               |
| `color.accent`                      | `oklch(0.21 0.006 286)`              | `oklch(0.92 0.005 286)`              |
| `color.accentForeground`            | `oklch(0.985 0 0)`                   | `oklch(0.21 0.006 286)`              |
| `color.neutral`                     | `oklch(0.955 0.004 286)`             | `oklch(0.3 0.006 286)`               |
| `color.neutralForeground`           | `oklch(0.21 0.006 286)`              | `oklch(0.985 0 0)`                   |
| `color.warning`                     | `oklch(0.8 0.14 78)`                 | Same                                 |
| `color.warningForeground`           | `oklch(0.3 0.07 55)`                 | Same                                 |
| `color.danger`                      | `oklch(0.56 0.19 25)`                | `oklch(0.72 0.17 25)`                |
| `color.dangerForeground`            | `oklch(0.99 0 0)`                    | `oklch(0.2 0.04 25)`                 |
| `typography.family`                 | `system-ui, sans-serif`              | Same                                 |
| `typography.bodySize`               | `0.875rem`                           | Same                                 |
| `typography.smallSize`              | `0.8125rem`                          | Same                                 |
| `typography.headingSize`            | `1.125rem`                           | Same                                 |
| `typography.bodyWeight`             | `400`                                | Same                                 |
| `typography.labelWeight`            | `550`                                | Same                                 |
| `typography.headingWeight`          | `600`                                | Same                                 |
| `typography.letterSpacing`          | `-0.011em`                           | Same                                 |
| `control.small.height`              | `2rem`                               | Same                                 |
| `control.small.paddingInline`       | `0.75rem`                            | Same                                 |
| `control.small.fontSize`            | `0.8125rem`                          | Same                                 |
| `control.small.indicatorSize`       | `1rem`                               | Same                                 |
| `control.medium.height`             | `2.5rem`                             | Same                                 |
| `control.medium.paddingInline`      | `1rem`                               | Same                                 |
| `control.medium.fontSize`           | `0.875rem`                           | Same                                 |
| `control.medium.indicatorSize`      | `1.125rem`                           | Same                                 |
| `control.large.height`              | `3rem`                               | Same                                 |
| `control.large.paddingInline`       | `1.375rem`                           | Same                                 |
| `control.large.fontSize`            | `0.9375rem`                          | Same                                 |
| `control.large.indicatorSize`       | `1.25rem`                            | Same                                 |
| `control.radius`                    | `0.5rem`                             | Same                                 |
| `control.cornerShape`               | `round`                              | Same                                 |
| `control.borderWidth`               | `1px`                                | Same                                 |
| `control.borderStyle`               | `solid`                              | Same                                 |
| `control.action.fontFamily`         | UI label family                      | Same                                 |
| `control.action.fontWeight`         | UI label weight                      | Same                                 |
| `control.action.textTransform`      | `none`                               | Same                                 |
| `control.action.letterSpacing`      | UI label tracking                    | Same                                 |
| `control.action.borderColor`        | Unset: each variant's edge           | Same                                 |
| `control.action.shadow`             | `0 1px 2px 0 rgb(0 0 0 / 0.06)`      | Same                                 |
| `control.action.shadowPressed`      | `0 1px 2px 0 rgb(0 0 0 / 0.06)`      | Same                                 |
| `control.action.highlight`          | `0` (0–1)                            | Same                                 |
| `control.action.sheen`              | `0` (0–1)                            | Same                                 |
| `control.action.radiusPressed`      | Unset: keeps the rest radius         | Same                                 |
| `control.action.cornerShapePressed` | Unset: keeps the rest shape          | Same                                 |
| `control.field.background`          | `color.surface`                      | Same                                 |
| `control.field.borderColor`         | Unset: the control outline           | Same                                 |
| `control.field.shadow`              | `none`                               | Same                                 |
| `control.field.backdropFilter`      | `none`                               | Same                                 |
| `control.indicator.shadow`          | `none`                               | Same                                 |
| `control.indicator.checkedShadow`   | `none`                               | Same                                 |
| `control.indicator.thumbShadow`     | `none`                               | Same                                 |
| `control.track.background`          | Unset: each track's own fill         | Same                                 |
| `control.track.borderWidth`         | Unset: each track's own edge         | Same                                 |
| `control.track.shadow`              | `none`                               | Same                                 |
| `control.selected.background`       | Unset                                | Same                                 |
| `control.selected.foreground`       | Unset                                | Same                                 |
| `control.selected.borderColor`      | Unset                                | Same                                 |
| `control.selected.shadow`           | Unset                                | Same                                 |
| `control.item.highlightBackground`  | Unset                                | Same                                 |
| `control.item.highlightForeground`  | Unset                                | Same                                 |
| `surface.canvas`                    | `oklch(1 0 0)`                       | `oklch(0.16 0.006 286)`              |
| `surface.radius`                    | `0.75rem`                            | Same                                 |
| `surface.cornerShape`               | `round`                              | Same                                 |
| `surface.borderWidth`               | `1px`                                | Same                                 |
| `surface.borderStyle`               | `solid`                              | Same                                 |
| `surface.padding`                   | `1.5rem`                             | Same                                 |
| `surface.gap`                       | `1rem`                               | Same                                 |
| `surface.shadow`                    | `0 1px 2px 0 rgb(0 0 0 / 0.06)`      | `0 1px 2px 0 rgb(0 0 0 / 0.25)`      |
| `surface.overlayShadow`             | `0 24px 64px -16px rgb(0 0 0 / 0.3)` | `0 24px 64px -16px rgb(0 0 0 / 0.6)` |
| `surface.backdrop`                  | `rgb(0 0 0 / 0.45)`                  | `rgb(0 0 0 / 0.65)`                  |
| `surface.backdropFilter`            | `none`                               | Same                                 |
| `surface.overlayBackground`         | `color.surface`                      | Same                                 |
| `focus.width`                       | `2px`                                | Same                                 |
| `focus.offset`                      | `2px`                                | Same                                 |
| `focus.style`                       | `solid`                              | Same                                 |
| `motion.pressDuration`              | `80ms`                               | Same                                 |
| `motion.pressEase`                  | `cubic-bezier(0.3, 0, 0, 1)`         | Same                                 |
| `motion.releaseDuration`            | `160ms`                              | Same                                 |
| `motion.releaseEase`                | `cubic-bezier(0.2, 0.8, 0.2, 1)`     | Same                                 |
| `motion.colorDuration`              | `150ms`                              | Same                                 |
| `motion.disclosureDuration`         | `150ms`                              | Same                                 |
| `motion.pressScale`                 | `0.97`                               | Same                                 |
| `motion.pressShiftX`                | `0px`                                | Same                                 |
| `motion.pressShiftY`                | `0px`                                | Same                                 |
| `motion.hoverLift`                  | `0px`                                | Same                                 |
| `spacing.labelGap`                  | `0.5rem`                             | Same                                 |
| `spacing.fieldGap`                  | `0.375rem`                           | Same                                 |
| `spacing.groupGap`                  | `0.75rem`                            | Same                                 |
| `spacing.headerGap`                 | `0.375rem`                           | Same                                 |
| `spacing.footerGap`                 | `0.5rem`                             | Same                                 |
| `state.disabledOpacity`             | `0.5`                                | Same                                 |

Typography recipes add `typography.roles` and `typography.flow` leaves, which
can also be authored directly.
