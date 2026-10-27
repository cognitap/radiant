# Theming Radiant

This is the theme authoring, token and migration reference. Start with the
[system guide](system.md) for shared composition, ownership and styling rules.

Radiant has one shared theme model: semantic tokens define the design system,
and component overrides describe deliberate exceptions. `Button` does not own
other components' typography, dimensions, shape, focus, or motion.

Import `@cognitap/radiant/styles.css` once. It supplies the complete neutral
light/dark baseline without a provider. `@cognitap/radiant/reset.css` is a
separate, optional global reset. Tailwind applications can instead use the
[source styling route](../README.md#with-tailwind); both routes consume the same
public theme variables.

## Define and apply a theme

```tsx
import '@cognitap/radiant/styles.css'
import { Button, Field, Input, ThemeScope, defineTheme } from '@cognitap/radiant'

const brand = defineTheme({
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
    dark: {
      tokens: { color: { accent: '#86efac', accentForeground: '#052e16' } }
    }
  }
})

function Settings() {
  return (
    <ThemeScope
      theme={brand}
      mode="system"
    >
      <Field label="Garden name">
        <Input name="garden" />
      </Field>
      <Button>Save</Button>
    </ThemeScope>
  )
}
```

`defineTheme({ id, name, tokens, components, modes })` accepts typed partial
values. `id` is a stable lowercase slug, such as `garden` or `garden-club`;
`name` is a nonempty display label. Select and persist identity by ID, never
by the label. The result is immutable, JSON-serializable theme data.

Unknown token groups, roles, component names, or override keys fail TypeScript
checks and throw at runtime. CSS lengths, colors, durations, and easings are
nonempty strings. Weights accept strings or numbers; numeric effects must be
finite, and opacity values must be between 0 and 1. CSS grammar and contrast
remain the author's responsibility: `var(--brand-accent)` is a valid value,
but Radiant cannot verify what that application variable resolves to.

For each mode the resolution order is **library mode defaults → common theme
values → that theme's mode values**. Missing dark values use the dark baseline
unless a common value already overrides them. Put a common color in `tokens`
only when it works in both modes, or supply its dark counterpart explicitly.

## Portable workshop documents

`ThemeDocument` is the versioned authoring format for the public theme workshop.
It keeps authored values and editor metadata; `Theme` remains the resolved data
accepted by `ThemeScope`. Radiant owns validation, section updates and compilation.
The documentation application owns selection, undo history, persistence and UI.
These APIs are unreleased until the next package publication.

```tsx
import {
  ThemeScope,
  themeDocumentFromDefinition,
  updateThemeDocument,
  compileThemeDocument,
  exportThemeSections,
  parseThemeDocument
} from '@cognitap/radiant'

const initial = themeDocumentFromDefinition({
  id: 'garden',
  name: 'Garden',
  tokens: {
    typography: { family: 'system-ui, sans-serif' },
    surface: { radius: '1rem' }
  },
  components: { button: { radius: '2rem' } }
})

const document = updateThemeDocument(initial, {
  color: {
    brand: { value: '#166534', gamut: 'srgb' },
    palettes: [
      {
        id: 'brand',
        name: 'Brand',
        swatches: [{ stop: 500, value: '#166534' }]
      }
    ],
    anchor: { paletteId: 'brand', stop: 500 },
    values: { accent: '#166534', accentForeground: '#ffffff' },
    modes: { dark: { accent: '#86efac', accentForeground: '#052e16' } }
  }
})

const theme = compileThemeDocument(document)
const scope = (
  <ThemeScope
    theme={theme}
    mode="system"
  >
    Garden
  </ThemeScope>
)

// Full authoring configuration, including font descriptors and component exceptions.
const fullJSON = JSON.stringify(document)
// Resolved application output, accepted directly by ThemeScope after JSON round trip.
const runtimeJSON = JSON.stringify(theme)
// Only these sections; deliberately excludes identity and component exceptions.
const colorJSON = JSON.stringify(exportThemeSections(document, ['color']))

const imported = parseThemeDocument(JSON.parse(colorJSON))
const next =
  imported.kind === 'radiant-theme'
    ? imported // Explicit full replacement of the editor's document.
    : updateThemeDocument(initial, imported.sections, 'replace')
```

`defineThemeDocument` accepts a typed document literal. `parseThemeDocument`
accepts unknown data, such as `JSON.parse` output, and returns either a full
`{ kind: 'radiant-theme', version: 1, id, name, sections }` document or a selective
`{ kind: 'radiant-theme-sections', version: 1, sections }` export. Both are
validated, detached and deeply frozen. Unsupported versions fail with a migration
message; unknown fields and invalid values identify their path. No automatic
version migration or silent dropping of future fields occurs. Parse text with
`JSON.parse` first so malformed JSON errors remain distinct from schema errors.

The section names follow the existing token groups: `color`, `typography`,
`control`, `surface`, `focus`, `motion`, `spacing`, `state`, plus `components`.
Each has optional `values` and `modes.light`/`modes.dark`. Values are exactly the
corresponding partial token group or component override map, retaining its
existing types and validation. Typography and motion will extend these sections
when their richer authoring models are defined; arbitrary runtime or engine
objects are not configuration fields. Editor layout can combine sections: the
spacing/surfaces editor can update `control`, `surface`, `spacing`, `focus` and
`state` together as needed.

Compilation uses the same **mode defaults → common values → mode values**
resolution as `defineTheme`, including all component resets. Metadata does not
change rendered values: a palette or brand input alone never overwrites semantic
roles. The color engine and semantic mapping stages will populate those values.
The original `defineTheme` API, presets, CSS routes and scope behavior are unchanged.
`themeDocumentFromDefinition` imports an authored `ThemeDefinition`, retaining
only explicit overrides rather than baking in library defaults. It does not
reverse-engineer a resolved `Theme` or recover authoring metadata from a preset.

### Section editing and import semantics

| Operation                                                       | Result                                                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `updateThemeDocument(doc, sections)`                            | Merge supplied leaves recursively; preserve omitted leaves and sections. Arrays replace as a whole.        |
| `updateThemeDocument(doc, sections, 'replace')`                 | Replace each supplied section, including all its mode layers and metadata. Omitted sections remain intact. |
| `updateThemeDocument(doc, { color: {} }, 'replace')`            | Reset that section to library fallback values by removing its authored values and metadata.                |
| `updateThemeDocument(doc, { color: {} })`                       | Empty merge is a no-op.                                                                                    |
| Parse a full document and use it as editor state                | Replace identity and every section; no implicit merge.                                                     |
| Parse a selective export, then pass its `sections` to an update | Apply an explicit merge or replacement while retaining the destination identity.                           |

Updates preserve deliberate component exceptions unless `components` is explicitly
included. A typography change therefore retains a Button-only font; a color
change retains an Input-only focus color. Select `components` separately to copy
those exceptions. Resetting `color` does not reset an exception in `components`.
To delete individual leaves, replace their section with the desired retained
values. `null` is invalid, and optional object properties set to `undefined` are
omitted, not deletion markers. Array holes and undefined array elements are invalid.

### Color identity and font boundaries

`color.brand` retains the original `value`, declared `gamut` (`srgb` or
`display-p3`) and optional explicitly labeled `srgbFallback`. Adding a brand
materialises `fidelity: 'anchored'` unless `unanchored` was explicitly selected.
`palettes` holds named ramps with unique stops from 50, 100, 200, …, 900, 950.
Partial ramps can be saved while authoring. An optional `anchor` references a
palette/stop whose value must exactly equal `brand.value`; a stale anchor fails
validation with a regeneration/replacement instruction. An unanchored ramp omits
`anchor`. A fallback cannot stand in for the unchanged original.

This schema preserves the exact-anchoring decision; it does not generate ramps,
parse color syntax, check gamut claims, measure contrast or prove balanced swatches.
Use the color generator and semantic mapper below for those separate responsibilities. A P3 source
and labeled fallback can be retained as data without claiming P3 generation support.
Changing source/fidelity alongside an existing anchor requires a coherent replacement
or regenerated palette; the compiler never silently adjusts the source.

`typography.fonts` contains portable descriptors: unique `id`, `family`, `source`
(`system`, `catalog` or `local`), optional numeric `weights` (1–1000) and `styles`
(`normal`/`italic`). These describe requirements; the consuming application loads
fonts and determines availability. Local font bytes, file paths/handles, URLs,
DOM objects and runtime functions have no fields in the schema. A local family
name can travel with the configuration, but the local font itself does not.
Font metadata does not set `typography.values.family` automatically.

Full and selective authoring JSON preserve those descriptors; only selecting
`typography` exports them. Compiled `Theme` output contains resolved CSS values
and no palette/source/font metadata. Both formats are data: plain objects,
arrays, strings, booleans, null and finite numbers, restricted further by their
field schema. Functions, class/binary instances, cycles, accessors and unsupported
keys fail before import can silently discard data.

## Responsive typography

Typesetting is opt-in and uses the existing theme compiler. The accepted
[role model](research/dev-162-typography-model.md) separates Body/Headings/UI/Code
font assignments, 16 text styles and independent prose/UI rhythms.

```tsx
import { ThemeScope, compileThemeDocument, defineThemeDocument,
  generateTypography, updateThemeDocument } from '@cognitap/radiant'

const document = defineThemeDocument({
  kind: 'radiant-theme', version: 1, id: 'publication', name: 'Publication',
  sections: { typography: { typesetting: {
    preset: 'source-serif',
    prose: { paragraphSpacing: 1.4 },
    styles: { 'prose-title': { weight: 650 } },
  } } },
})
const theme = compileThemeDocument(document)

// Inside your application, with either documented CSS route:
<ThemeScope theme={theme}>
  <article data-rad-prose="" data-rad-type-container="">
    <h1>A shared language for careful work</h1>
    <p data-rad-text="prose-lead">A lead can use its own reusable style.</p>
    <p>Body copy with <em>emphasis</em> and <code>inline.code</code>.</p>
    <h2>A new section</h2>
    <p>Paragraph and heading spacing follow the prose rhythm.</p>
  </article>
</ThemeScope>

const next = updateThemeDocument(document, {
  typography: { typesetting: { ui: { size: 18 } } },
})
const result = generateTypography(next.sections.typography!.typesetting)
```

`generateTypography`, `typographyPresets`, `typographyRoles` and their types also
export from the pure `@cognitap/radiant/typography` entry. It imports no React,
reads no browser globals and loads no fonts. For plain definitions, pass
`result.tokens` as `tokens.typography` to `defineTheme`. `prose`, `ui`, and
`styles` expose calculated settings. Immutable `result.input` is JSON-replayable
and preserves manual/automatic ownership instead of pinning calculated metrics.

### Authoring and precedence

`typography.typesetting` generates common defaults. Explicit `typography.values`
leaves override them, followed by `typography.modes.light/dark` leaves. Existing
component exceptions retain their precedence. Typography-only section exports
carry recipes, explicit values and font descriptors through the existing
merge/replace import rules; no second compiler or loading path is introduced.

`preset` is `inter` (default), `source-serif`, or `plex`. Each `fonts.body`,
`headings`, `ui` and `code` accepts a CSS `family` list and optional `profile`:
`inter`, `source-serif-4`, `plex-sans`, `plex-mono`, or `manual`. A new family
without a profile selects manual defaults. A profile is an explicit claim about
the supplied font, not detection of an installed file. Consumers own that setup.

| Manual setting             | Bounds                  | Default                               |
| -------------------------- | ----------------------- | ------------------------------------- |
| `prose.size`               | 12–40 reference px      | Inter/Plex: 20, Serif: 21, manual: 20 |
| `prose.lineHeight`         | 1–3                     | Inter/Plex: 1.6, Serif/manual: 1.65   |
| `prose.paragraphSpacing`   | 0–4em                   | 1.25em                                |
| `prose.measure`            | 20–120ch                | Inter/manual: 64, Serif/Plex: 62      |
| `prose.headingScale`       | 1.1–1.5                 | 1.25                                  |
| `ui.size`, `ui.lineHeight` | 12–32 reference px, 1–3 | 16px / 1.5                            |

Each `styles[role]` accepts `assignment`, `narrow`, `wide`, `weight`, `lineHeight`,
`tracking` and `measure`. Endpoint sizes are reference pixels at a 16px root,
emitted as rem. Narrow is 8–256px; wide 8–512px and at least narrow. Weight is
1–1000, leading .8–3, tracking -.2–.5em and measure 0–120ch; zero measure means
layout-owned. These are predictable bounds, not a guarantee every combination
will look good.

`recommendations.body/ui` flags known contextual starting points. Other fonts
remain manually tunable. `warnings` identifies style weights outside a claimed
profile's range, retaining the authored value rather than silently clamping it.
Inspect warnings before accepting a theme. There is no universal readability
score or implicit normalization.

Context updates preserve explicit `styles` overrides. To reset a style or return
a metric to automatic behavior, omit that key from the next recipe and **replace**
the typography section, retaining other metadata/explicit values. Merge semantics
cannot delete a stored leaf by omission. To select a fresh starting point,
replace its recipe; merging only a preset ID intentionally retains old overrides.
When merging a saved font assignment, change its family and profile together
(use `manual` for an unfamiliar font), or replace the recipe. Merging only a
family retains a previously stored profile.

### Semantic HTML and local width

- `data-rad-text="prose-title"` selects presentation on any semantic element; it
  does not set heading levels or ARIA roles. `typographyRoles` lists all 16 values:
  prose title/heading/subheading/body/lead/small/quote; UI title/body/label/
  supporting/caption/metric/eyebrow; display; code.
- `data-rad-prose` opts a container into Body typography, maximum measure and
  flow. Its **direct** headings, paragraphs/lists, captions, quotes and `pre`
  blocks receive their corresponding styles. Nested section wrappers can opt
  into prose explicitly.
- Explicit `data-rad-text` wins over automatic element mapping. A direct block
  with `data-rad-not-prose` or a Radiant `data-slot` host skips mapping/flow;
  ordinary inherited font properties still inherit. Opt-out is not a reset.
- `data-rad-type-container` establishes the named `radiant-type` inline-size
  container. Put it on the content column, including nested columns. Heading/
  display sizing interpolates over 24–56rem of local width. Body/UI sizes stay
  fixed rem values. Without an opt-in ancestor, roles use their compact endpoint.

Hooks are low-specificity rules in the components layer. Utilities, ordinary
application CSS and inline styles override them. Token shorthand utilities are
registered by property in the existing class merger, for example
`text-(--rad-typography-roles-prose-title-size)` and
`font-(--rad-typography-roles-prose-title-family)`. An application Tailwind build
must generate new utilities; importing precompiled library CSS does not do that.

Measure is a maximum, not minimum width or exact character count. Prose wraps
long words; preformatted code scrolls within its box. Give scrollable code
keyboard access and an appropriate name where needed. UI styles leave measure
to the layout. Inline code uses .9em and inherited weight/leading, not block-code
line boxes. Actual italic/weight assets are required; text-style hosts disable
synthetic font styles.

Direct token authoring uses `roles[role].size` for the compact endpoint and
`fluidSize` for the responsive expression. Set both to fix a style at all widths,
or set equal `narrow`/`wide` inputs. Other role leaves are `family`, `weight`,
`lineHeight`, `letterSpacing` and `measure`; prose flow leaves are
`flow.paragraph`, `headingBefore` and `headingAfter`.

### Fonts, migration and verification

Load chosen families/styles/weights with your application's font loader or
self-hosted `@font-face`. Presets contain family/fallback lists, not font URLs,
bytes or loaders. `typography.fonts` remains portable metadata; it does not load
fonts or automatically select assignments. The role baseline follows the legacy
shared family, with system monospace for code. Generated presets explicitly
select their named families.

### Component roles and earlier themes

Production families now consume the same UI roles as the workshop specimens:

| Text host                                                                  | Shared role               | Deliberate size owner                                |
| -------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------- |
| ThemeScope, Card, DialogContent, Field, Collapsible and disclosure content | `ui-body`                 | Role; `collapsible.contentSize` remains an exception |
| CardTitle, DialogTitle                                                     | `ui-title`                | Role; component title size/weight overrides win      |
| Field label/legend, CollapsibleTrigger, AccordionTrigger                   | `ui-label`                | Role; Field label overrides win                      |
| Button, action-shaped Link                                                 | `ui-label`                | Existing `controlSize` and Button font-size slots    |
| Input                                                                      | `ui-body`                 | Existing `controlSize` and Input font-size slot      |
| Checkbox/Radio label                                                       | `ui-label`                | Existing `controlSize` and label-size slots          |
| Field help/error, CardDescription, DialogDescription                       | `ui-supporting`           | Role; existing component size slots win              |
| Inline/subtle Link                                                         | Inherits surrounding text | Parent text, including prose and code assignments    |

Roles supply family, weight, line height and tracking. Component UI text uses
`size` (the compact endpoint), without prose measure limits or prose margins.
Control sizes deliberately keep their 13/14/15px font metrics and 32/40/48px
height/min-height defaults. Changing UI rhythm/style size therefore changes
ordinary interface copy and labels, while size-constrained controls retain their
metrics. To change those metrics, author `control.small/medium/large.fontSize`
(and height/padding as needed), or a supported component font-size exception.
Button and action-shaped Link share the Button-only typography exceptions.
Accordion and Dialog actions reuse disclosure/Button styling respectively.

The baseline `ui-body`, `ui-label`, `ui-title` and `ui-supporting` roles alias
legacy family, size, weight and tracking leaves. Earlier themes and every built-in
preset therefore retain their authored families/sizes/weights and deliberate
Button exceptions. Baseline UI leading is now explicit: Body/Supporting 1.5,
Label 1.4 and Title 1.3. Checkbox/Radio labels and disclosure triggers now use the
shared label weight rather than inheriting body weight. These wrapping/rhythm
changes require matching package JavaScript/CSS and layout review.

To migrate a theme, replace `family/bodySize/bodyWeight` with `roles['ui-body']`,
`smallSize` with `roles['ui-supporting'].size`, `headingSize/headingWeight` with
`roles['ui-title']`, and `labelWeight` with `roles['ui-label'].weight`. The earlier
shared family/tracking fields affect all four baseline roles; specify those
leaves on each role to retain that breadth. Prefer a `typesetting` recipe when
you want independently assigned Body/Headings/UI/Code families and repeatable
rhythms. A recipe materializes these roles and then explicit `values`/mode role
leaves override it; legacy leaves no longer control recipe-owned roles. There
is no implicit recipe adoption or destructive migration of stored documents.
Local component variables, caller utilities and ordinary CSS retain precedence.
When migrating a legacy CSS variable applied directly to a text host, set the
corresponding role variable on that host; inherited role aliases may already
have resolved on the enclosing theme scope.

New `roles` and `flow` are ordinary shared token leaves with partial/mode
overrides. Older 0.0.4 parsers reject the new authoring keys; consume matching
package JavaScript/CSS and defer the public docs pin to chapter promotion.

Canonical examples: **System → Typography → Roles / Prose / Components / Serif Interface / Mono Interface**. The installed
artifact gate verifies all 16 roles at 320/390/640/800px, both modes, nested
containers and named/mode-only scopes, caller overrides, flow, inline code and
root-enlargement/text-spacing probes through compiled CSS and Tailwind, each
with/without reset. These fixtures use system fallbacks; actual-font quality
remains bounded by DEV-162's recorded study. Browser zoom, manual AT, more scripts/
browsers, production component adoption and final public review remain chapter
acceptance work.

## Generate a color wall

```ts
import { generateColorWall, colorCalibrationPresets } from '@cognitap/radiant/color'
import { updateThemeDocument } from '@cognitap/radiant'

const wall = generateColorWall({
  brand: '#7C3AED',
  wallPreset: 'expressive',
  rampPreset: 'balanced'
})
// Registry entries supply stable IDs, names and descriptions for public controls.
console.log(colorCalibrationPresets)
// Optional dials are materialised, so this reproduces every output swatch.
const replay = generateColorWall(JSON.parse(JSON.stringify(wall.input)))

// Retain independently authored semantic values/modes; replace generated metadata
// so switching to unanchored fidelity also removes the previous anchor.
const previous = document.sections.color
const next = updateThemeDocument(
  document,
  {
    color: { values: previous?.values, modes: previous?.modes, ...wall.color }
  },
  'replace'
)
```

The generator is available from the package root and from the React-free
`@cognitap/radiant/color` entry. It reads no browser globals, loads no fonts and
uses no randomness or AI. The result is detached, deeply frozen, JSON-safe data.
This is an unreleased API until the next package publication.

`wall.color` fits the existing `ThemeColorSection`: original `brand`, selected
`fidelity`, 18 `palettes` and an `anchor` only for anchored fidelity. Palette order
is Brand, Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue,
Indigo, Violet, Purple, Pink, Rose, Neutral. Each has a stable lowercase ID and
11 swatches at 50, 100, 200, …, 900, 950. Generated values are opaque six-digit
sRGB hex; the exact original preserves its supplied spelling/case.
`wall.neutralInput` reports the low-chroma path. `wall.input` contains all
materialised controls and algorithm `version: 1` for replay. Persist that input
as a generator recipe separately; the current version-1 theme document stores
its color output, not a new untyped generation-settings field.

| Input            | Default                                            | Supported range / meaning                                                                                                                                                |
| ---------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `brand`          | Required                                           | Opaque six-digit sRGB hex. Alpha, CSS functions, named colors and P3 sources are rejected explicitly.                                                                    |
| `version`        | `1`                                                | Only the calibrated algorithm version 1 is supported.                                                                                                                    |
| `gamut`          | `srgb`                                             | Only sRGB output is currently supported. No automatic P3 fallback or source replacement.                                                                                 |
| `fidelity`       | `anchored`                                         | `anchored` preserves the original at its nearest-lightness numbered stop; `unanchored` keeps the regular ramp and separate original.                                     |
| `wallPreset`     | `balanced`                                         | `classic`, `balanced`, `expressive`; selects the supporting wall's curves, automatic vividness, neutral tint and hue alignment.                                          |
| `rampPreset`     | `balanced`                                         | Same three IDs, independently selects brand curves, automatic vividness and anchor reshaping.                                                                            |
| `brandVividness` | Source-derived by ramp preset                      | 0–1 brand-ramp chroma, independent of wall vividness; never changes the exact source.                                                                                    |
| `vividness`      | Source-derived by wall preset                      | 0–1 supporting-wall chroma; it never changes the brand ramp.                                                                                                             |
| `lightness`      | `hue-aware`                                        | `hue-aware` adapts the middle toward each hue's gamut cusp; `shared` uses the common reference curve.                                                                    |
| `distribution`   | `1`                                                | .75–1.35. Redistributes intermediate shades while retaining endpoints/middle in regular chromatic ramps.                                                                 |
| `neutralTint`    | Classic `.012`, Balanced `.008`, Expressive `.016` | 0–.035 peak chroma in the Neutral ramp; zero produces untinted grays.                                                                                                    |
| `hueAlignment`   | Classic `.6`, Balanced `.25`, Expressive `.5`      | 0–1. Rotate the wall so its nearest named family moves toward the brand hue; family order/spacing stays intact.                                                          |
| `neutralHue`     | `255`                                              | Any finite degrees, wrapped into [0, 360). Explicit direction when source C < .02; the near-neutral Brand ramp remains neutral apart from its exact source neighborhood. |

Classic retains the [accepted DEV-151 calibration](https://github.com/cognitap/radiant/blob/50044fc0d6d66c94b2e3dfb02fc17c0d2828aff6/docs/research/dev-151-calibration-proposal.md).
It uses the reference lightness curve .985, .965, .93, .87, .79, .70, .61, .52,
.43, .34, .24, hue-relative gamut fractions and a smooth chroma envelope. Anchored
fidelity reshapes neighboring lightness and chroma around the unchanged source.
Balanced and Expressive use monotone cubic lightness reshaping and local gamut-relative
chroma blending around the anchor; Classic retains linear lightness reshaping.
For automatic settings, let `m = sqrt(clamp(source C / .28, 0, 1))`. Balanced uses
wall strength `.45 + .4m` and brand strength `.18 + .65m`; Expressive uses
`.6 + .3m` and `.28 + .62m`. Classic uses source C / available C, clamped to
.10–.92 (.35 for low-chroma sources), for both. Hue-aware midpoints, envelope
limits and distribution curves follow the selected preset independently.
`distribution` multiplies each preset's exponent (Classic 1, Balanced .95,
Expressive 1.05); `shared` fixes the midpoint at .7. Explicit dials override
preset defaults, and every effective input is materialised for exact replay.
Public editors should clear wall-owned dials (vividness/tint/alignment) when
selecting a wall preset, and brandVividness when selecting a ramp preset; retain
independent controls and explicit semantic pins.

Nearest-lightness ties prefer the earlier/lighter stop. Black and white can
occupy the endpoint stops. Metrics and anchor selection use actual quantized
colors, rather than assuming requested OKLCH values survived mapping unchanged.

The mapper reduces chroma at constant lightness/hue until the result fits sRGB,
then emits 8-bit output. Conversion uses [Ottosson's Oklab matrices](https://bottosson.github.io/posts/oklab/)
and the [CSS Color 4 transfer functions](https://www.w3.org/TR/css-color-4/#color-conversion-code).
This deliberate mapper does not claim to duplicate a browser's gamut-mapping
algorithm. The per-call caches are discarded after generation; past calls cannot
change subsequent results or retain an unbounded history of user colors.

A color wall is palette data. It does not select semantic text/action/state
roles, guarantee contrast on arbitrary surfaces or certify chart distinctions.
Use `recommendColorPalette` below for working sets and named role-pair checks.
`compileThemeDocument` continues to use only
semantic `values`/`modes`; adding this metadata alone does not change a rendered
theme. In Storybook, **System → Color Wall → Reference** exposes the accepted
12 inputs and controls for visual inspection; the public workshop UI remains
separate documentation-application work.

## Recommend a working palette and semantic roles

```ts
import { generateColorWall, recommendColorPalette } from '@cognitap/radiant/color'
import { updateThemeDocument, compileThemeDocument } from '@cognitap/radiant'

const wall = generateColorWall({ brand: '#7C3AED' })
const palette = recommendColorPalette(wall, {
  working: { support: 'teal' },
  modes: { dark: { focus: '#ABCDEF' } }
})

// Replace the complete color section, preserving the original source and all ramps.
// Merge the canvas layer to retain surface radius, spacing and other authored values.
const colored = updateThemeDocument(document, { color: palette.color }, 'replace')
const themed = updateThemeDocument(colored, { surface: palette.surface })
const theme = compileThemeDocument(themed)
const failures = palette.checks.filter(check => check.pass === false)
```

`recommendColorPalette(wall, options?)` consumes a complete version-1 sRGB wall.
It returns deeply frozen, detached, JSON-safe recommendations. The original
brand, fidelity, anchor and all 18 ramps remain unchanged in `palette.color`.
The result has five parts:

- `working`: primary, support, neutral, success, warning and danger, each with a
  wall `paletteId` and independently selected light/dark background/foreground pairs.
- `color`: the original wall metadata plus complete light/dark maps for the
  existing shared color roles. No common-mode values are needed.
- `surface`: light/dark `canvas` layers, using the existing surface token group.
- `checks`: measured pairs with mode, role names, exact colors, unrounded ratio,
  minimum, pass/fail and an actionable failure message.
- `pass`: whether every listed required pair passes. This is a scoped contrast
  result, not a complete accessibility or arbitrary-theme certification.

Defaults use Brand as primary, Neutral for surfaces, Emerald for success, Amber
for warning and Red for danger. The support family is nearest to primary hue +
150°. Low-chroma candidates use the wall's explicit hue direction and nominal
family geometry rather than numerical hue noise. `working` can replace any of
these family IDs with another existing wall family. Duplicate families are
allowed deliberately; color alone does not establish status meaning or chart
separation. Use labels/icons as appropriate.

Light canvas/surface start at Neutral 50/100, dark at 950/900. Foreground,
secondary text, borders, focus, invalid state and action shades are selected
against the actual emitted opaque surfaces, independently for each mode. Solid
pairs require 4.5:1 text contrast. Among eligible primary shades, choose the
smallest Oklab distance to the original brand, including lightness and both
chromatic axes. Primary fill also requires 3:1 against both surfaces because it
identifies checked Checkbox/Radio state. Thus a readable exact source is retained
when its boundaries also pass; otherwise a nearby readable shade is selected. Exact source identity stays separate: yellow may
remain the exact Brand 200 while a darker related shade supplies the light action.
Black/white ink can be selected when it gives the strongest text contrast.

`options.version` defaults to 1. `options.modes.light`/`dark` can override any
existing color role and `canvas`, using opaque six-digit sRGB hex. Provided
surfaces drive automatic dependent choices; explicit foregrounds and other role
colors are retained even if they fail. Unsupported fields, palette IDs, versions,
non-opaque colors and incomplete walls fail with a path or available ID list.
Recipes remain ordinary serializable options; the existing theme document stores
mapped values and wall metadata, without adding an untyped recipe field.

Contrast uses the [WCAG sRGB luminance formula](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
on final hex values. Normal text (including secondary text, placeholder and invalid
text) is checked at 4.5:1 on canvas and surface; solid action/working-palette ink
is checked at 4.5:1 on its fill. Meaningful border, offset focus ring and primary
checked-state fill are checked at 3:1 on both surfaces. These are Radiant's
conservative role policies, not a requirement that every decorative boundary or
hover/rest color differ by 3:1. See [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

Disabled token pairs have `minimum: null` and `pass: null`, explicitly reflecting
the inactive-control exception. Their informational ratios exclude component
opacity/effects. Pending actions remain active and are not exempt. Support/success
are working-palette pairs; the current component tones remain accent, neutral,
warning and danger. No new component tones or runtime token roles are introduced.

Apply color and canvas together before relying on the report. A color-only import,
component/local override, gradient/translucent surface or rendered hover/pressed
effect can change the effective pair. Recheck those contexts in the browser; this
base-pair report does not silently certify them. **System → Color Palette →
Reference** reuses the canonical profile form and inspects invalid, disabled,
checked, pending and keyboard-focus states in both modes. DEV-155 owns the wider
theme-editor integration is described below; the public editor itself remains in radiant-docs.

## Apply palette, spacing and surfaces together

Use `updateThemeAppearance` when the workshop applies generated colors and bounded
geometry together. It produces an ordinary version-1 `ThemeDocument`; compile it
through the existing runtime and use either installed CSS route.

```ts
import {
  themeDocumentFromDefinition,
  updateThemeAppearance,
  compileThemeDocument,
  generateColorWall,
  recommendColorPalette
} from '@cognitap/radiant'

const initial = themeDocumentFromDefinition({
  id: 'brand-workshop',
  name: 'Brand workshop',
  components: { button: { radius: '12px' } } // A deliberate exception survives edits.
})
const palette = recommendColorPalette(generateColorWall({ brand: '#7C3AED' }))
const document = updateThemeAppearance(initial, {
  palette,
  geometry: {
    values: { spacing: 1.25, density: 1.1, controlRadius: 8, surfaceRadius: 16, elevation: 2 },
    modes: { dark: { backdropOpacity: 0.75 } }
  }
})
const theme = compileThemeDocument(document)
// <ThemeScope theme={theme} mode="system">...</ThemeScope>
```

The optional `palette` is the mapped result of `recommendColorPalette`, not raw
wall metadata. Its complete color section replaces previous common/mode colors;
its light/dark canvas leaves merge into surface settings in the same immutable
operation. Applying a palette never erases radii, padding, elevation or component
exceptions. A failing deliberate palette choice is retained; inspect its contrast
report before applying it.

`geometry.values` controls both modes; `geometry.modes.light`/`dark` override
individual controls. Omitted controls retain authored settings. Each provided
control maps to the existing semantic token leaves in both modes, overriding
older common or mode values for those leaves. No recipe metadata or new runtime
token group is added. An empty update changes no values.

| Geometry control                           | Accepted values             | Existing responsibilities                                                                                               |
| ------------------------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `spacing`                                  | 0.5–2                       | Multiplies all five `spacing` gaps plus `surface.padding` and `surface.gap`.                                            |
| `density`                                  | 0.75–1.5                    | Multiplies small/medium/large control height, inline padding and indicator size; retains font sizes.                    |
| `controlRadius`                            | 0–32 px                     | Shared action/input radius; Checkbox caps the inherited radius; Radio remains circular.                                 |
| `surfaceRadius`                            | 0–48 px                     | Card, Dialog and Collapsible shape, including Accordion items.                                                          |
| `controlBorderWidth`, `surfaceBorderWidth` | 0–4 px                      | Respective shared border widths.                                                                                        |
| `borderStyle`                              | `solid`, `dashed`, `dotted` | Both control and surface borders.                                                                                       |
| `elevation`                                | Integer 0–3                 | 0 removes passive/overlay shadows; 1 uses mode defaults; 2/3 select raised/floating shadows with mode-specific opacity. |
| `backdropOpacity`                          | 0–0.9                       | Black modal backdrop opacity; panel backdrop filtering stays a Dialog component exception.                              |

Scale controls derive absolute values from the neutral baseline, retaining rem
units. Reapplying `spacing: 1.25` is idempotent; it never multiplies already-edited
values. `density: 1` restores baseline metric leaves, while fonts and unrelated
settings remain authored. Action-local effects/shadows remain component decisions;
inline Link retains text metrics, and action-shaped Link follows control metrics.
Values outside the bounds, unknown keys/modes and unsupported `version` (default 1)
fail with a path instead of being silently clamped. These bounds support workshop
exploration; border removal, small targets or overrides still need contextual
accessibility review. Focus behavior, state ownership and forced-colors behavior
remain the existing families' responsibility.

Precedence stays **component exception → shared role → baseline**, followed by
caller utility/style overrides on the host. Nested mode scopes resolve the same
compiled theme and retain explicit scope style exceptions; named themes reset
them. **System → Theme Appearance → Workspace** reuses the canonical ten-family
workspace, inspects all three control sizes and demonstrates these precedence
rules. Installed-package checks include the generated theme through compiled CSS
and Tailwind, with and without a reset.

Existing theme definitions, presets, token names, generated baseline CSS and CSS
imports need no migration. Existing documents can be passed directly; authored
`ThemeDefinition` inputs use `themeDocumentFromDefinition`. Resolved presets remain
runtime data and cannot recover their original authoring intent. Advanced CSS
geometry stays available through typed `updateThemeDocument` token sections and
component overrides. Public editing and handoff UI follow in DEV-158/DEV-159.

## Scopes, mode, and overrides

`ThemeScope` renders a normal `div` and accepts its native props and ref. It
paints its canvas, foreground, and body typography within that subtree. It does
not change the document, install event listeners, load fonts, or persist a
preference. A native top-layer Dialog remains in its original scope.

- `theme={theme}` starts a fresh named theme from library defaults. Every shared
  token is materialised and every omitted component override is reset to its
  CSS fallback. An outer theme cannot leak its action font or press effect in.
- Omit `theme` to inherit the current theme. Omit `mode` to inherit the current
  mode. At the application root, the stylesheet defaults to system preference.
- `mode="light"`, `"dark"`, or `"system"` selects appearance independently of
  theme identity. System follows the CSS media query, so server markup and the
  first client render agree. A mode-only scope resolves the current named theme
  in its selected mode.
- An inner scope with neither `theme` nor `mode` follows ordinary CSS inheritance;
  it does not establish a new theme. A root scope also paints the neutral canvas
  and typography.
- Explicit `style` values win over generated values on the same scope host.
  Known theme variables supplied inline to ancestor ThemeScopes are carried
  through mode-only scopes. A new named theme clears these inherited exceptions.

Use `defaultTheme` for a complete reset, including component effects:

```tsx
import { Button, ThemeScope, defaultTheme, ticket } from '@cognitap/radiant'

;<ThemeScope
  theme={ticket}
  mode="light"
>
  <Button>Ticket action</Button>
  <ThemeScope theme={defaultTheme}>
    <Button>Neutral action</Button>
  </ThemeScope>
</ThemeScope>
```

Use shared tokens for local changes that should affect multiple families:

```tsx
<ThemeScope
  theme={brand}
  style={{ '--rad-control-radius': '1.25rem', padding: '2rem' }}
>
  <Input aria-label="Garden name" />
  <Button>Save</Button>
</ThemeScope>
```

Ordinary CSS overrides inherit within their existing scope. A mode-only scope
re-materialises the selected theme, so token overrides from an intervening
stylesheet rule or an ordinary DOM wrapper are not automatically recovered
there. Put exceptions that must survive a mode change on a `ThemeScope` inline
`style`, or include them in the theme definition. No browser computed-style
snapshot is taken. Ordinary body styles, such as a locally changed font size,
still follow the cascade and inheritance appropriate to their host.

Components resolve **local component override → shared semantic role → neutral
baseline**. For example, `components.button.radius` overrides Button without
changing Input; `tokens.control.radius` changes both. Checkbox caps its inherited
radius at a quarter of its indicator size so it remains a box; an explicit
`components.checkbox.radius` still wins. Radio stays circular by default, even
under squircle or scoop control themes. Shared disabled opacity is applied once
to the relevant visual unit.

Input, Checkbox, and Radio derive their default control outline from the shared
border and foreground colors. This gives interactive boundaries more contrast
than passive surface dividers. Their explicit `borderColor`, invalid, disabled,
and focus overrides keep their normal precedence. Disabled selection marks use
the muted foreground unless the component supplies its own `mark` color.

Component overrides use the existing family configuration keys, grouped under
`button`, `link`, `field`, `input`, `checkbox`, `radio`, `radioGroup`, `dialog`,
`collapsible`, `accordion`, and `card`. Public declaration types are the
closed-key reference. `radioGroup.gap` controls group layout;
`radio.labelGap` controls spacing within a single option. Button-only fonts,
uppercase text, sheen, shadows, squash, and pressed shape belong under
`components.button`. Passive surfaces have their own shared surface tokens.

Public variable names are derived from the typed registry:

| Authoring path                 | CSS variable                  |
| ------------------------------ | ----------------------------- |
| `tokens.color.accent`          | `--rad-color-accent`          |
| `tokens.control.medium.height` | `--rad-control-medium-height` |
| `tokens.typography.family`     | `--rad-typography-family`     |
| `components.button.radius`     | `--rad-button-radius`         |
| `components.radioGroup.gap`    | `--rad-radio-group-gap`       |

Matching caller utilities merge with component defaults on the Tailwind route;
application CSS follows the normal cascade. Generated theme values are inline
custom properties, so a normal stylesheet declaration on that same host does
not override them. Put a token override on a descendant or use the host's
`style` prop. Internal variables beginning `--_` are implementation details.

## Preserve functional styles

Appearance overrides must preserve closed Dialog/details visibility, dialog
geometry and scrolling, real control hit targets, and accessible names. Keep
focus, invalid, disabled, and pending cues visible. The library retains
forced-colors system colors and reduced-motion alternatives; a theme must not
erase them with replacement CSS. See the [system guide's functional CSS obligations](system.md#preserve-behavior-when-customising)
for host replacement and the behavior that overrides must preserve. Importing the optional reset is not required for
these behaviors.

## Presets and fonts

The readonly `themes` registry contains these presets, exported individually
from `@cognitap/radiant`. Each has a deliberate light and dark palette.

| Stable ID       | Display name  | Named export   | Shared font family | Action exception                     |
| --------------- | ------------- | -------------- | ------------------ | ------------------------------------ |
| `radiant`       | Radiant       | `radiant`      | Inter              | Weight 550                           |
| `default`       | Default       | `defaultTheme` | System sans        | Library baseline                     |
| `soft-squircle` | Soft squircle | `soft`         | Nunito             | Weight 800                           |
| `expressive`    | Expressive    | `expressive`   | Poppins            | Weight 600                           |
| `glass`         | Glass         | `glass`        | Manrope            | Weight 700; backdrop filter          |
| `sharp-3d`      | Sharp 3D      | `sharp`        | System sans        | Archivo Black, weight 400, uppercase |
| `jelly`         | Jelly         | `jelly`        | Baloo 2            | Weight 700                           |
| `ticket`        | Ticket        | `ticket`       | Barlow Condensed   | Weight 600, uppercase                |

All families have `system-ui, sans-serif` fallbacks. Preset body weight is 400;
load the label and heading weights 600 and 700 as well as the action weight
listed above. Default uses baseline label/heading weights 550/600. Radiant's
Inter action weight 550 requires a variable font or an appropriate supplied
face; the browser chooses an available weight otherwise.

Fonts are application assets. Load the named families with your font loader or
self-hosted `@font-face` rules before showing the themed UI. Defining or choosing
a theme never downloads a font. Storybook's font loading belongs to Storybook,
not the package. `Theme` has no `fonts` field or font-loading API.

Glass uses a gradient `surface.canvas` and translucent `color.surface`.
`components.dialog.backdropFilter` frosts content behind the dialog panel;
`components.dialog.backdrop` paints the surrounding modal overlay. Button's
existing `backdrop` override is also a filter and remains independent. Ticket
uses a compact, solid checkbox outline so small indicators
remain legible alongside its scooped, dashed controls and surfaces.
Shape uses CSS `corner-shape`; browsers that do not support it
retain ordinary rounded corners. A palette definition does not certify contrast
for arbitrary content, custom backgrounds, or translucent combinations.

## Shared token reference

These 66 roles and concrete neutral defaults come from
[`src/themes/tokens.ts`](../src/themes/tokens.ts). CSS names are `--rad-` plus the
kebab-case dotted path. Values shown in both modes differ only where listed.
`color` values are CSS colors; `surface.canvas` and `surface.backdrop` are full
CSS backgrounds and may be gradients. `components.button.backdrop` and
`components.dialog.backdropFilter` are CSS backdrop-filter values. Lengths and
durations remain CSS strings; opacity is numeric.

| Path                           | Light default                        | Dark default                         |
| ------------------------------ | ------------------------------------ | ------------------------------------ |
| `color.surface`                | `oklch(1 0 0)`                       | `oklch(0.21 0.006 286)`              |
| `color.foreground`             | `oklch(0.21 0.006 286)`              | `oklch(0.985 0 0)`                   |
| `color.mutedForeground`        | `oklch(0.45 0.01 286)`               | `oklch(0.75 0.01 286)`               |
| `color.border`                 | `oklch(0.885 0.005 286)`             | `oklch(0.4 0.008 286)`               |
| `color.placeholder`            | `oklch(0.5 0.01 286)`                | `oklch(0.7 0.01 286)`                |
| `color.disabledBackground`     | `oklch(0.96 0.005 286)`              | `oklch(0.26 0.006 286)`              |
| `color.disabledBorder`         | `oklch(0.88 0.005 286)`              | `oklch(0.38 0.006 286)`              |
| `color.invalid`                | `oklch(0.56 0.19 25)`                | `oklch(0.75 0.16 25)`                |
| `color.focus`                  | `oklch(0.55 0.13 255)`               | `oklch(0.75 0.13 255)`               |
| `color.accent`                 | `oklch(0.21 0.006 286)`              | `oklch(0.92 0.005 286)`              |
| `color.accentForeground`       | `oklch(0.985 0 0)`                   | `oklch(0.21 0.006 286)`              |
| `color.neutral`                | `oklch(0.955 0.004 286)`             | `oklch(0.3 0.006 286)`               |
| `color.neutralForeground`      | `oklch(0.21 0.006 286)`              | `oklch(0.985 0 0)`                   |
| `color.warning`                | `oklch(0.8 0.14 78)`                 | Same                                 |
| `color.warningForeground`      | `oklch(0.3 0.07 55)`                 | Same                                 |
| `color.danger`                 | `oklch(0.56 0.19 25)`                | `oklch(0.72 0.17 25)`                |
| `color.dangerForeground`       | `oklch(0.99 0 0)`                    | `oklch(0.2 0.04 25)`                 |
| `typography.family`            | `system-ui, sans-serif`              | Same                                 |
| `typography.bodySize`          | `0.875rem`                           | Same                                 |
| `typography.smallSize`         | `0.8125rem`                          | Same                                 |
| `typography.headingSize`       | `1.125rem`                           | Same                                 |
| `typography.bodyWeight`        | `400`                                | Same                                 |
| `typography.labelWeight`       | `550`                                | Same                                 |
| `typography.headingWeight`     | `600`                                | Same                                 |
| `typography.letterSpacing`     | `-0.011em`                           | Same                                 |
| `control.small.height`         | `2rem`                               | Same                                 |
| `control.small.paddingInline`  | `0.75rem`                            | Same                                 |
| `control.small.fontSize`       | `0.8125rem`                          | Same                                 |
| `control.small.indicatorSize`  | `1rem`                               | Same                                 |
| `control.medium.height`        | `2.5rem`                             | Same                                 |
| `control.medium.paddingInline` | `1rem`                               | Same                                 |
| `control.medium.fontSize`      | `0.875rem`                           | Same                                 |
| `control.medium.indicatorSize` | `1.125rem`                           | Same                                 |
| `control.large.height`         | `3rem`                               | Same                                 |
| `control.large.paddingInline`  | `1.375rem`                           | Same                                 |
| `control.large.fontSize`       | `0.9375rem`                          | Same                                 |
| `control.large.indicatorSize`  | `1.25rem`                            | Same                                 |
| `control.radius`               | `0.5rem`                             | Same                                 |
| `control.cornerShape`          | `round`                              | Same                                 |
| `control.borderWidth`          | `1px`                                | Same                                 |
| `control.borderStyle`          | `solid`                              | Same                                 |
| `surface.canvas`               | `oklch(1 0 0)`                       | `oklch(0.16 0.006 286)`              |
| `surface.radius`               | `0.75rem`                            | Same                                 |
| `surface.cornerShape`          | `round`                              | Same                                 |
| `surface.borderWidth`          | `1px`                                | Same                                 |
| `surface.borderStyle`          | `solid`                              | Same                                 |
| `surface.padding`              | `1.5rem`                             | Same                                 |
| `surface.gap`                  | `1rem`                               | Same                                 |
| `surface.shadow`               | `0 1px 2px 0 rgb(0 0 0 / 0.06)`      | `0 1px 2px 0 rgb(0 0 0 / 0.25)`      |
| `surface.overlayShadow`        | `0 24px 64px -16px rgb(0 0 0 / 0.3)` | `0 24px 64px -16px rgb(0 0 0 / 0.6)` |
| `surface.backdrop`             | `rgb(0 0 0 / 0.45)`                  | `rgb(0 0 0 / 0.65)`                  |
| `focus.width`                  | `2px`                                | Same                                 |
| `focus.offset`                 | `2px`                                | Same                                 |
| `focus.style`                  | `solid`                              | Same                                 |
| `motion.pressDuration`         | `80ms`                               | Same                                 |
| `motion.pressEase`             | `cubic-bezier(0.3, 0, 0, 1)`         | Same                                 |
| `motion.releaseDuration`       | `160ms`                              | Same                                 |
| `motion.releaseEase`           | `cubic-bezier(0.2, 0.8, 0.2, 1)`     | Same                                 |
| `motion.colorDuration`         | `150ms`                              | Same                                 |
| `motion.disclosureDuration`    | `150ms`                              | Same                                 |
| `spacing.labelGap`             | `0.5rem`                             | Same                                 |
| `spacing.fieldGap`             | `0.375rem`                           | Same                                 |
| `spacing.groupGap`             | `0.75rem`                            | Same                                 |
| `spacing.headerGap`            | `0.375rem`                           | Same                                 |
| `spacing.footerGap`            | `0.5rem`                             | Same                                 |
| `state.disabledOpacity`        | `0.5`                                | Same                                 |

## Migration from Button-centred themes

This is a breaking CSS-token migration. Use the JavaScript and stylesheet from
the same version; do not mix new theme data with an old compiled stylesheet.

1. Replace wrappers such as `<div style={theme.style}>` with
   `<ThemeScope theme={theme}>`. `Theme.style`, `Theme.surface`, and the
   `radiantTheme` style alias are removed. Use `radiant` with `ThemeScope`, which
   chooses the canvas for the active mode. A hand-written `{ name, style }`
   object is no longer a `Theme`: author it with `defineTheme`.
2. Move shared settings out of `buttonTheme` into `tokens`: font family into
   `typography.family`, heights/padding/font sizes into the matching `control`
   size group, radius/shape/borders into `control` and `surface`, focus into
   `color.focus`/`focus`, and timing into `motion`. Input, Checkbox, Radio,
   Dialog, Collapsible, Card, and Link no longer fall back through Button's
   overrides. Input's native numeric `size` attribute is unchanged.
3. Replace the removed `buttonTheme`, `linkTheme`, `fieldTheme`, `inputTheme`,
   `checkboxTheme`, `radioTheme`, `dialogTheme`, `collapsibleTheme`,
   `accordionTheme`, and `cardTheme` helpers with `components.<family>` in
   `defineTheme`. Their corresponding `*Theme` type aliases are removed; use
   `ThemeComponentOverrides` or an indexed family type such as
   `NonNullable<ThemeComponentOverrides['button']>` for reusable configuration.
   For a one-off host or named part, use `style` with typed `--rad-*` variables:

   ```tsx
   import { Button, type ThemeStyle } from '@cognitap/radiant'

   const local: ThemeStyle = { '--rad-button-radius': '1rem' }

   ;<Button style={local}>Save</Button>
   ```

   A local style is a partial override; a named `ThemeScope` deliberately resets
   omitted settings to the shared baseline. Do not spread a resolved mode map
   onto a wrapper as a replacement for ThemeScope's theme/mode inheritance.

4. Rename direct CSS overrides using the following map. Button's `focusColor`
   maps to `--rad-button-focus-color`; it no longer changes shared focus.
   Move the old `radioTheme({ gap })` group shortcut to
   `components.radioGroup.gap`; `components.radio.labelGap` remains option-local.
5. Remove `glowHover`: it never had a rendering effect and is rejected by
   `defineTheme`. The library no longer supplies `--ease-spring`, `--ease-snap`,
   or `--ease-settle`; put the required literal `linear(...)`/`cubic-bezier(...)`
   curve in the motion token or a deliberate component exception. Application
   CSS variables are also supported when your application defines them.

| Old variable                                                   | Replacement                                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `--color-background`                                           | `--rad-color-surface` (canvas is `--rad-surface-canvas`)                          |
| `--color-foreground`, `--color-border`, `--color-focus`        | Corresponding `--rad-color-*` role                                                |
| `--color-primary`, `--color-primary-foreground`                | `--rad-color-accent`, `--rad-color-accent-foreground`                             |
| `--color-secondary`, `--color-secondary-foreground`            | `--rad-color-neutral`, `--rad-color-neutral-foreground`                           |
| `--color-warning`, `--color-warning-foreground`                | `--rad-color-warning`, `--rad-color-warning-foreground`                           |
| `--color-destructive`, `--color-destructive-foreground`        | `--rad-color-danger`, `--rad-color-danger-foreground`                             |
| `--radius-control`                                             | `--rad-control-radius`                                                            |
| `--button-*`, `--input-*`, `--field-*`, other family overrides | `--rad-button-*`, `--rad-input-*`, `--rad-field-*`, corresponding prefixed family |
| `--radio-gap`                                                  | `--rad-radio-group-gap`                                                           |
| `--button-focus-color` (stale consumers)                       | `--rad-color-focus` for shared focus; `--rad-button-focus-color` for Button alone |

The source stylesheet no longer registers `background`, `foreground`, `border`,
`primary`, `secondary`, `warning`, `destructive`, or `focus` color aliases, or the
`control` radius alias. Replace classes such as `bg-primary` with
`bg-(--rad-color-accent)` and `rounded-control` with
`rounded-(--rad-control-radius)`, or define your own application aliases.

The theme registry is readonly; choose a preset by
`theme.id` rather than editing the registry or relying on its display name.
Storybook's global Theme and Mode controls use this same preset registry.
Button and Link now share `variant`, `tone`, and `controlSize`; see the
[README action migration table](../README.md#action-api-migration-breaking).
Action-only geometry, elevation and motion remain deliberate Button component
overrides consumed by both Button and action-shaped Link. Inline/subtle Link
retains its own decoration and focus overrides. Soft and unfilled ink mixes the
selected tone toward the scope foreground; explicit Link colour overrides win.

### Cleanup inventory (DEV-132)

| Area                                                                        | Disposition                                                                                  |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Ten family helpers/types, `radiantTheme`, resolved `style`/`surface` fields | Removed directly under the experimental 0.x policy; replacements above                       |
| Old unprefixed color/radius aliases and ambient easing variables            | Removed from the source and compiled styling routes                                          |
| Old action variants, `size`/`radius` presentation props and `data-size`     | Already retired by the action/form migrations; no compatibility path restored                |
| Shared semantic tokens and typed `components` overrides                     | Retained as the canonical theme authoring contract                                           |
| `ThemeStyle`, native props, named parts, state hooks and `render`           | Retained for local styling and native composition                                            |
| Button and action-shaped Link presentation                                  | One private `actionStyles` implementation; action-only Button slots are intentionally shared |
| Dialog actions and Accordion sections                                       | Compose Button and Collapsible respectively; no parallel action/disclosure paint             |

Every component slot in the registry has a reader. Input, Field, Checkbox,
Radio, Dialog, Collapsible and Card resolve their own override, then a shared
role or neutral default. Only Button and action-shaped Link consume action
slots; inline/subtle Link keeps its own decoration/focus contract. Existing
preset values and light/dark mode maps are unchanged by this cleanup.

This removes compatibility paths without publishing a package. The next
release must carry these breaking migration notes under the
[release policy](../RELEASE_POLICY.md); earlier changelog entries describe their
delivery-time behavior.
