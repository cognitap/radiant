# Theming

Shared tokens set the design system. Component overrides are per-family exceptions. Keep the contracts in [architecture](architecture.md#customization-limits).

## Setup

Import `@cognitap/radiant/styles.css` once, or `@cognitap/radiant/tailwind.css` in a Tailwind build (see the [README](../README.md#with-tailwind)). Components then use the neutral light and dark baseline, with no provider.

## Define a theme

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

- `id` is a lowercase slug. `name` is the display label.
- Every field is a typed partial of the library defaults. Unknown keys fail typechecking and throw at runtime.
- The returned `Theme` is frozen and JSON-serializable.
- Each mode resolves library defaults, then common `tokens` and `components`, then `modes.<mode>`. A shared color has to work in both modes.
- Token paths are in [`src/themes/tokens.ts`](../src/themes/tokens.ts). Component override keys are in [`src/themes/components.ts`](../src/themes/components.ts).

## Apply a theme

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

`ThemeScope` renders a `div`. It sets custom properties and paints canvas, foreground, and body text on that subtree. Document color, font loading, and storage stay outside the scope.

| Prop                      | Behavior                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `theme`                   | Starts from library defaults, so a nested `defaultTheme` resets an outer theme                                       |
| `mode`                    | `'light'`, `'dark'`, or `'system'`; `'system'` follows `prefers-color-scheme` in CSS so server and client HTML match |
| Omitted `theme` or `mode` | Inherits from the parent scope                                                                                       |
| `style`                   | Overrides the generated custom properties and survives nested mode-only scopes                                       |

## CSS variables

A value resolves as the component override, then the shared token, then the baseline. An override stays on its own component. Each key becomes a kebab-case `--rad-` property: `tokens.control.medium.height` is `--rad-control-medium-height`, and `components.radioGroup.gap` is `--rad-radio-group-gap`. Names starting with `--_` are internal.

```tsx
import { Button, type ThemeStyle } from '@cognitap/radiant'

const local: ThemeStyle = { '--rad-button-radius': '1rem' }

export function Save() {
  return <Button style={local}>Save</Button>
}
```

## Public tokens

Components built outside Radiant, such as an app's catalog entries, read only the names in `PUBLIC_THEME_TOKENS`. Every theme and mode sets them, and they change only in a breaking release. The `PublicThemeToken` type lists the same names, and `themeTokenVar(token, fallback?)` returns `var(<token>)` for an inline style.

| Group      | Tokens                                                                                                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color      | `--rad-color-` `surface`, `foreground`, `muted-foreground`, `border`, `focus`, `invalid`, `disabled-background`, `disabled-border`, and `accent`, `neutral`, `warning`, `danger` with their `-foreground` |
| Typography | `--rad-typography-` `family`, `body-size`, `small-size`, `heading-size`, `body-weight`, `label-weight`, `heading-weight`                                                                                  |
| Control    | `--rad-control-` `radius`, `border-width`, `border-style`                                                                                                                                                 |
| Surface    | `--rad-surface-` `canvas`, `radius`, `border-width`, `border-style`, `padding`, `gap`, `shadow`                                                                                                           |
| Other      | `--rad-focus-` `width`, `offset`, `style`; `--rad-motion-color-duration`; `--rad-spacing-` `tight`, `normal`, `airy`; `--rad-state-disabled-opacity`                                                      |
| Series     | `--rad-series-1-` to `--rad-series-8-` `solid`, `soft`, `border`, `text`                                                                                                                                  |

`--rad-surface-canvas` is the page background that `ThemeScope` paints; `--rad-color-surface` fills cards, fields, and popups on it. Component override and internal names are outside this contract. SVG presentation attributes may not resolve `var()`, so set `fill` and `stroke` in `style`:

```tsx
import { themeTokenVar } from '@cognitap/radiant'

;<polyline style={{ fill: 'none', stroke: themeTokenVar('--rad-color-accent') }} />
```

## Roles

Each part reads one token role.

| Role      | Token group                                  | Parts                                                                                                                 |
| --------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Action    | `control.action`                             | `Button` and parts built on it, button-styled `Link`, `ButtonGroup`, and the typography of tabs and headers           |
| Field     | `control.field`                              | `Input`, `Textarea`, `NativeSelect`, `InputGroup`, `OTPField` slots, `Select`, `Combobox`, `MultiSelect`, `TagsInput` |
| Indicator | `control.indicator`                          | `Checkbox` and `Radio` boxes, `Switch` track, `Switch` and `Slider` thumbs                                            |
| Track     | `control.track`                              | `ToggleGroup` and `Tabs` lists, `Progress`, `Meter`, `Skeleton`, `Slider` and `ScrollArea` rails, `Menubar`           |
| Selected  | `control.selected`                           | Pressed toggles, `ToggleGroup` indicator, active tab, `NavLink`, current page, chosen option, open menu               |
| Surface   | `surface`                                    | `Card`, `Stage`, `Alert`, `Collapsible`, `Accordion`, `TableContainer`, `EmptyState`, `CodeBlock`, `Sidebar`          |
| Overlay   | `surface.overlay*`, `surface.backdropFilter` | `Popover`, `HoverCard`, `Menu`, listboxes, `Tooltip`, `Dialog`, `Drawer`, `NavigationMenu` viewport                   |
| Item      | `control.item`                               | Highlighted rows in menus, listboxes, and `Command`                                                                   |

Shared geometry:

- Inset parts subtract their inset from the parent radius. Thin parts cap the radius at half their height. `Checkbox` caps it at a quarter of its size, and `Radio` stays circular.
- Buttons inside a field or chip (`NumberField` steppers, `PasswordInput` toggle, `Tag` remove) stay flat and inherit the field's typography.
- Keyboard focus reads the family's `focus*` overrides, then `tokens.focus`. Menu, listbox, and `Command` items show focus with the item highlight.
- Native scroll containers draw `ScrollArea`'s `thumbColor` at 45% opacity on a transparent track, and use system scrollbars under `forced-colors`.

## Spacing scale

`tokens.spacing.tight`, `normal`, and `airy` (`--rad-spacing-tight`, and so on) are the semantic gap steps that the model-facing catalog names for layout `gap` props. `normal` defaults to the same 1rem as `surface.gap` but does not follow it. Role-named tokens (`labelGap`, `fieldGap`, `surface.gap`, `surface.padding`) stay independent and keep owning today's layout.

Padding and density keep their own steps, so `normal` is today's value and `airy` cell padding is not a layout gap:

| Prop              | `normal`                                    | `tight` / `airy` default         | Step overrides                                                  |
| ----------------- | ------------------------------------------- | -------------------------------- | --------------------------------------------------------------- |
| `Card` `padding`  | `card.padding`, then `surface.padding`      | Two thirds / four thirds of it   | `card.paddingTight`, `card.paddingAiry`                         |
| `Stage` `padding` | `stage.padding`, then `surface.padding`     | Two thirds / four thirds of it   | None                                                            |
| `Table` `density` | `table.paddingInline`, `table.paddingBlock` | Two thirds / four thirds of each | `table.paddingInlineTight`, `table.paddingBlockAiry`, and so on |

The derived steps scale a single length. When a base padding is a shorthand such as `1rem 2rem`, set both step overrides. Step overrides resolve on the `Card` or `Table` element, so a theme step override wins over a base override set on one instance.

## Series colors

`tokens.series['1']` to `['8']` (the `series` theme-document section) are categorical colors for anything that tells concepts apart by color, such as chart series or highlighted terms. Give a concept one series number and use it in every family. Each series has `solid` for marks, and `soft`, `border`, and `text` for a tag or highlight. `soft`, `border`, and `text` mix `solid` with `--rad-color-surface` or `--rad-color-foreground`, so a theme can set `solid` alone.

The defaults are blue, orange, emerald, pink, sky, amber, violet, and red at the color wall's family hues, with lightness as a second cue. They do not follow role colors such as `accent` or `danger`, so a series carries no status meaning. In every preset and mode, `solid` reaches 3:1 on both the surface and the canvas, `text` on `soft` reaches 4.5:1, and every pair of solids stays apart under simulated protanopia, deuteranopia, and tritanopia. `glass` sets darker light-mode solids for its bright canvas. Bar and pie charts tell series apart by color alone, so keep custom solids as distinct.

Series tokens resolve where `ThemeScope` or `:root` declares them, so overriding a role color on an inner element does not recolor them. `components.chart.series1` to `series8` override a chart only.

A theme generated from the color wall sets its series from `seriesPalette(palette)`, which returns `{ light, dark }` solids for `tokens.series` in each mode, plus `checks` and `pass`. It keeps the default solids when they meet the targets above on the palette's surface, canvas, and foreground. Otherwise it tries up to 40 lightness steps of 0.005, moving all eight solids together or each only as far as it needs, and takes the first that meets every target. With the wall's neutral or any hue family as `neutral`, one always does. When none does, as with some vivid brand palettes as `neutral`, it returns the closest attempt with `pass: false`, and `checks.light` and `checks.dark` name the weakest contrast and the closest pair.

```ts
const palette = recommendColorPalette(generateColorWall({ brand: '#7c3aed' }))
const { light, dark } = seriesPalette(palette)
const themeDocument = updateThemeAppearance(
  themeDocumentFromDefinition({
    id: 'brand',
    name: 'Brand',
    modes: { light: { tokens: { series: light } }, dark: { tokens: { series: dark } } }
  }),
  { palette }
)
```

`chartPalette(palette)` from `@cognitap/radiant/charts` is deprecated. It returns the same solids as `series1` to `series8` chart overrides, which leave tags and highlights on other colors; set `tokens.series` instead.

## Presets

`defaultTheme` ships in `@cognitap/radiant`. Example themes in `@cognitap/radiant/examples` are `radiant`, `soft`, `sharp`, `glass`, `jelly`, `ticket`, `neon`, and `editorial`, also collected in the `themes` and `themeDefinitions` arrays. Themes name font families and do not download them. Load those families in the app, or they fall back to system fonts.

## Typography

`@cognitap/radiant/typography`, also exported from the root, compiles a typesetting preset (`'inter'`, `'source-serif'`, or `'plex'`) into 16 text roles (`typographyRoles`) and prose and UI flow variables. Set it at `sections.typography.typesetting`, with `prose` and `styles` overrides, and compile the document.

| Attribute                 | Effect                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `data-rad-text="<role>"`  | Sets one text role. The element keeps its own semantics                                                                                |
| `data-rad-prose`          | Styles direct child headings, paragraphs, lists, blockquotes, and code, and spaces its children. `data-rad-not-prose` opts a child out |
| `data-rad-type-container` | Heading sizes scale with container width from `24rem` to `56rem`                                                                       |

### Prose layer

A `data-rad-prose` container mixes text and components in one reading flow. Each direct child is text (`p`, `ul`, `ol`, `blockquote`, `pre`, or `h1` to `h6` without `data-slot` or `data-rad-not-prose`; an element with `data-rad-text`; or a wrapper with `data-rad-flow="text"`) or a component (anything else, such as `figure`, `table`, `dl`, `hr`, `details`, and Radiant families). Hidden elements, `script`, `style`, `template`, and closed `dialog` get no spacing.

- **Reading width:** each text child keeps its role's measure (`64ch` body text by default, from `prose.measure`). Components take the container's full width; the container sets no width.
- **Rhythm:** `--rad-typography-flow-paragraph` separates two texts, `--rad-typography-flow-component` separates text and a component in either order, `--rad-typography-flow-component-gap` separates two components, and `--rad-typography-flow-heading-before` and `--rad-typography-flow-heading-after` surround headings. The component tokens default to `spacing.airy` and `spacing.normal`; override them at `tokens.typography.flow`.
- **Headings:** `HeadingLevelProvider level` sets the level at which a subtree's headings start; `useHeadingLevel(depth)` returns that level plus `depth`, clamped to 6, or `undefined` outside a provider. Without a `level` prop, `StageTitle`, `AlertTitle`, `EmptyStateTitle`, and `AccordionTrigger` use it. A Stage with a `StageTitle` in its `StageHeader` puts its other parts one level below the title, and `AccordionContent` sits one level below the provided trigger level. `CardTitle` stays static: pass `level`, from `useHeadingLevel()` in client code.

`A2uiSurface` `prose` makes the surface a type container and its root Column a prose flow: top-level `Text` uses `prose-body` or `prose-small`, and nested Text keeps interface type. Another root type reports a `fallback` diagnostic. Adapters read `flow` and forward it through `renderNode` only for a wrapped node. `headingLevel` sets the level of the surface's top headings, which otherwise follow an enclosing provider.

## Color

`@cognitap/radiant/color` exports three pure functions:

- `generateColorWall({ brand, wallPreset })` builds 18 palettes of 11 shades (`50` to `950`) from a six-digit hex brand color.
- `recommendColorPalette(wall, options)` maps `brand`, `support`, `neutral`, `success`, `warning`, and `danger` to light and dark color tokens. `checks` require 4.5:1 for text and 3:1 for borders, focus rings, and checked fills.
- `seriesPalette(palette)` returns series solids for that palette (see [Series colors](#series-colors)).
