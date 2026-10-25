# Theming Radiant

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
erase them with replacement CSS. See the [functional CSS contract](https://github.com/cognitap/radiant/blob/main/docs/contracts/README.md#functional-css-obligations)
for the full obligations. Importing the optional reset is not required for
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
