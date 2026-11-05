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

## Roles

Each part reads one token role.

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

Shared geometry:

- Inset parts subtract their inset from the parent radius. Thin parts cap the radius at half their height. `Checkbox` caps it at a quarter of its size, and `Radio` stays circular.
- Buttons inside a field or chip (`NumberField` steppers, `PasswordInput` toggle, `Tag` remove) stay flat and inherit the field's typography.
- Keyboard focus reads the family's `focus*` overrides, then `tokens.focus`. Menu, listbox, and `Command` items show focus with the item highlight.
- Native scroll containers draw `ScrollArea`'s `thumbColor` at 45% opacity on a transparent track, and use system scrollbars under `forced-colors`.

## Presets

`defaultTheme` ships in `@cognitap/radiant`. Example themes in `@cognitap/radiant/examples` are `radiant`, `soft`, `sharp`, `glass`, `jelly`, `ticket`, `neon`, and `editorial`, also collected in the `themes` and `themeDefinitions` arrays. Themes name font families and do not download them. Load those families in the app, or they fall back to system fonts.

## Typography

`@cognitap/radiant/typography`, also exported from the root, compiles a typesetting preset (`'inter'`, `'source-serif'`, or `'plex'`) into 16 text roles (`typographyRoles`) and prose and UI flow variables. Set it at `sections.typography.typesetting`, with `prose` and `styles` overrides, and compile the document.

| Attribute                 | Effect                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `data-rad-text="<role>"`  | Sets one text role. The element keeps its own semantics                                                       |
| `data-rad-prose`          | Styles direct child headings, paragraphs, lists, blockquotes, and code. `data-rad-not-prose` opts a child out |
| `data-rad-type-container` | Heading sizes scale with container width from `24rem` to `56rem`                                              |

## Color

`@cognitap/radiant/color` exports two pure functions:

- `generateColorWall({ brand, wallPreset })` builds 18 palettes of 11 shades (`50` to `950`) from a six-digit hex brand color.
- `recommendColorPalette(wall, options)` maps `brand`, `support`, `neutral`, `success`, `warning`, and `danger` to light and dark color tokens. `checks` require 4.5:1 for text and 3:1 for borders, focus rings, and checked fills.
