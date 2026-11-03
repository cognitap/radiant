# Theming

Shared tokens define the design system, and component overrides handle per-family exceptions. See [architecture](architecture.md) for how theming fits the rest of Radiant.

Import `@cognitap/radiant/styles.css` once (or `@cognitap/radiant/tailwind.css` in a Tailwind build; see [README](../README.md#with-tailwind)). Every component gets a neutral light and dark baseline without a provider.

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

`id` is a lowercase slug; `name` is the display label. Every field is a typed partial override of the library defaults, and the returned `Theme` is frozen, JSON-serializable data. Unknown groups, roles, components, or keys fail typechecking and throw at runtime.

Each mode resolves as **library mode defaults → common `tokens` / `components` → `modes.<mode>`**. Put a color in common `tokens` only when it works in both light and dark modes.

## Apply a theme with `ThemeScope`

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

`ThemeScope` is a plain `div` that sets CSS custom properties and paints its canvas, foreground, and body text on its subtree. It never touches `document`, loads fonts, or persists state.

- **`theme`** starts fresh from library defaults, so nesting `defaultTheme` resets any outer theme.
- **`mode`** is `'light'`, `'dark'`, or `'system'`. `'system'` follows `prefers-color-scheme` in CSS so server and client HTML match.
- **Omitting `theme` or `mode`** inherits from the parent scope.
- **Inline `style`** on `ThemeScope` overrides its generated custom properties and survives nested mode-only scopes.

## Component overrides and CSS variables

Values resolve as **component override → shared token → baseline** and never fall back through another family's override. All token paths and defaults are defined in [`src/themes/tokens.ts`](../src/themes/tokens.ts), and all component override keys are defined in [`src/themes/components.ts`](../src/themes/components.ts).

Every token and component key maps to a `--rad-` CSS custom property in kebab-case:

| Path                           | CSS variable                  |
| ------------------------------ | ----------------------------- |
| `tokens.color.accent`          | `--rad-color-accent`          |
| `tokens.control.medium.height` | `--rad-control-medium-height` |
| `components.button.radius`     | `--rad-button-radius`         |
| `components.radioGroup.gap`    | `--rad-radio-group-gap`       |

For one-off inline overrides, type `style` with `ThemeStyle`:

```tsx
import { Button, type ThemeStyle } from '@cognitap/radiant'

const local: ThemeStyle = { '--rad-button-radius': '1rem' }
;<Button style={local}>Save</Button>
```

Variables starting with `--_` are internal. Restyling must preserve the guarantees in [architecture](architecture.md#what-customization-must-keep).

## Roles

Each part of a component reads one token role so a theme looks coherent without per-component overrides:

| Role      | Token group                                  | Parts                                                                                                       |
| --------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Action    | `control.action`                             | `Button` and parts built on it, button-styled `Link`, `ButtonGroup`, and the typography of tabs and headers |
| Field     | `control.field`                              | `Input`, `Textarea`, `NativeSelect`, `InputGroup`, `OTPField` slots, `Select`, `Combobox`, `TagsInput`      |
| Indicator | `control.indicator`                          | `Checkbox` and `Radio` boxes, `Switch` track, `Switch` and `Slider` thumbs                                  |
| Track     | `control.track`                              | `ToggleGroup` and `Tabs` lists, `Progress`, `Meter`, `Skeleton`, `Slider` and `ScrollArea` rails, `Menubar` |
| Selected  | `control.selected`                           | Pressed toggles, `ToggleGroup` indicator, active tab, `NavLink`, current page, chosen option, open menu     |
| Surface   | `surface`                                    | `Card`, `Alert`, `Collapsible`, `Accordion`, `TableContainer`, `EmptyState`, `CodeBlock`, `Sidebar`         |
| Overlay   | `surface.overlay*`, `surface.backdropFilter` | `Popover`, `HoverCard`, `Menu`, listboxes, `Tooltip`, `Dialog`, `Drawer`, `NavigationMenu` viewport         |
| Item      | `control.item`                               | Highlighted rows in menus, listboxes, and `Command`                                                         |

Shared geometry rules:

- **Concentric and capped corners.** Inset parts subtract their inset from the parent radius. Thin parts cap their radius at half their height (`Checkbox` caps inherited radius at a quarter of its size; `Radio` stays circular).
- **Inline actions.** Buttons inside a field or chip (`NumberField` steppers, `PasswordInput` toggle, `Tag` remove) stay flat and inherit the field's typography.
- **Focus rings.** Keyboard focus rings read the family's `focus*` overrides, then `tokens.focus`. Menu, listbox, and `Command` items indicate focus with the item highlight instead.
- **Scrollbars.** Native scroll containers draw `ScrollArea`'s `thumbColor` at 45% opacity on a transparent track, falling back to system scrollbars in `forced-colors` mode.

## Presets and fonts

`defaultTheme` ships in `@cognitap/radiant`. Eight additional presets (`radiant`, `soft`, `sharp`, `glass`, `jelly`, `ticket`, `neon`, `editorial`) and the `themes` / `themeDefinitions` arrays ship in `@cognitap/radiant/examples`. Choosing a theme never downloads fonts; load the referenced font families in your app or let them fall back to system fonts.

## Typography

`@cognitap/radiant/typography` (also re-exported from the root entry) compiles typesetting presets (`'inter'`, `'source-serif'`, `'plex'`) into 16 text roles (`typographyRoles`) and prose/UI flow variables.

```tsx
import { ThemeScope, compileThemeDocument, defineThemeDocument } from '@cognitap/radiant'

const theme = compileThemeDocument(
  defineThemeDocument({
    kind: 'radiant-theme',
    version: 1,
    id: 'publication',
    name: 'Publication',
    sections: {
      typography: {
        typesetting: {
          preset: 'source-serif',
          prose: { paragraphSpacing: 1.4 },
          styles: { 'prose-title': { weight: 650 } }
        }
      }
    }
  })
)
```

HTML attributes:

- `data-rad-text="<role>"` applies one of the 16 text roles without changing semantics.
- `data-rad-prose` styles direct child headings, paragraphs, lists, blockquotes, and code blocks; `data-rad-not-prose` opts a child out.
- `data-rad-type-container` scales heading sizes with container width between `24rem` and `56rem`.

## Color generation and theme documents

`@cognitap/radiant/color` exports two pure functions:

- `generateColorWall({ brand, wallPreset, ... })` builds 18 palettes of 11 shades (`50`–`950`) from a six-digit hex brand color.
- `recommendColorPalette(wall, options)` maps a working set (`brand`, `support`, `neutral`, `success`, `warning`, `danger`) to light and dark color tokens and returns contrast `checks` (4.5:1 for text, 3:1 for borders, focus rings, and checked fills).

`ThemeDocument` is the serializable workshop format that stores authored sections alongside palette and font metadata:

| Function                                            | Purpose                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `themeDocumentFromDefinition(definition)`           | Convert a `defineTheme` input into a `ThemeDocument`                                                                   |
| `updateThemeDocument(doc, sections, mode?)`         | Deep-merge (`'merge'`, default) or replace (`'replace'`) sections on a document                                        |
| `updateThemeAppearance(doc, { palette, geometry })` | Apply a recommended palette and geometry scales (`spacing`, `density`, radii, borders, `elevation`, `backdropOpacity`) |
| `exportThemeSections(doc, ['color'])`               | Export selected sections without theme identity                                                                        |
| `parseThemeDocument(json)`                          | Validate a full document or section export from parsed JSON                                                            |
| `compileThemeDocument(doc)`                         | Compile a `ThemeDocument` into a `Theme` for `ThemeScope`                                                              |
