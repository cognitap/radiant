# Radiant

React interaction components and presentation primitives, published as
[`@cognitap/radiant`](https://www.npmjs.com/package/@cognitap/radiant) under the
[MIT license](LICENSE). Radiant is experimental: `0.0.2` contains a single native
Button.

## Usage

```sh
pnpm add --save-exact @cognitap/radiant@0.0.2
```

Import the stylesheet once in your application. It needs no Tailwind and only
styles Radiant components:

```tsx
import '@cognitap/radiant/styles.css'
import { Button } from '@cognitap/radiant'

<Button onClick={handleContinue}>Continue</Button>
<Button disabled>Unavailable</Button>
<Button type="submit">Save</Button>
```

For a global reset (Tailwind Preflight), also import `@cognitap/radiant/reset.css`
before `styles.css`. React 19.3+ is a peer dependency.

`Button` takes native button props, including `ref`, `aria-*` and form attributes,
and defaults to `type="button"`. Give every button an accessible name through its
text, `aria-label`, or `aria-labelledby`. The type does not reject a nameless
button. Use a link for navigation.

```tsx
<Button variant="destructive" size="small">Delete</Button>
<Button variant="outline" radius="full">Next</Button>
<Button iconOnly aria-label="Close"><CloseIcon /></Button>
```

| Prop        | Values                                                               | Default   |
| ----------- | -------------------------------------------------------------------- | --------- |
| `variant`   | `primary`, `secondary`, `warning`, `destructive`, `outline`, `ghost` | `primary` |
| `size`      | `small`, `default`, `large`                                          | `default` |
| `radius`    | `none`, `small`, `default`, `large`, `full`                          | `default` |
| `iconOnly`  | Squares the button at its size. Pass `aria-label`.                   | `false`   |
| `fullWidth` | Fills the container width.                                           | `false`   |
| `pending`   | Shows a spinner over the label and ignores activation.               | `false`   |

The style prop is `variant`, because `type` stays the native attribute. An omitted
`type` is `button` even when `formAction` is set. Pass `type="submit"` to submit.
While `pending` is set, the label stays in place, a spinner covers it, and
activation does not run. It does not set `disabled`, so focus stays. Reduced
motion keeps the label and hides the spinner. Child SVGs are sized to the button.

### Adapting Button to a design system

Button has no fixed look. Every design decision is a CSS variable, so a design
system, or an agent reading a design.md, sets values instead of rewriting classes.
Set the variables on `:root`, a subtree, or `[data-slot="button"]`. Button also
exposes `data-variant` and `data-size`, so a rule such as
`[data-variant="destructive"] { --button-glow: 50% }` targets one variant.

`buttonTheme` takes typed settings and returns the matching variables as a style
object. Unknown keys are a type error:

```tsx
import { Button, buttonTheme } from '@cognitap/radiant'

// "Softly rounded squircles that straighten when pressed. Snap in, spring out."
const soft = buttonTheme({
  radius: '1rem',
  radiusPressed: '0.375rem',
  cornerShape: 'squircle',
  pressScale: 0.96,
  pressDuration: '90ms',
  pressEase: 'var(--ease-snap)',
  releaseDuration: '520ms',
  releaseEase: 'var(--ease-spring)'
})

<div style={soft}>
  <Button>Continue</Button>
</div>
```

Hover and press colors are derived from each variant's base color, so one color
per variant is enough. Hover mixes in `hoverLayer` of a state color and press mixes
in `pressLayer`. By default, primary lightens on hover and darkens on press,
warning and destructive darken on both, and the neutral variants mix in their
label color. `stateColor` sets one state color for every variant.

Press and release run separate durations and easings. The press values apply
while the button is held, and the release values apply on the way back. Shape and
motion use them, and colors use `colorDuration`. `--ease-spring`, `--ease-snap`,
and `--ease-settle` are ready to use, and any `cubic-bezier()` or `linear()` value
works.

| `buttonTheme` key    | Variable                        | Default                                                                |
| -------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| `radius`             | `--button-radius`               | `var(--radius-control)`, `0.75rem`                                     |
| `radiusPressed`      | `--button-radius-pressed`       | 75% of the resting radius                                              |
| `cornerShape`        | `--button-corner-shape`         | `squircle`                                                             |
| `cornerShapePressed` | `--button-corner-shape-pressed` | the resting corner shape                                               |
| `height`             | `--button-height`               | `2.5rem`                                                               |
| `heightSmall`        | `--button-height-small`         | `2rem`                                                                 |
| `heightLarge`        | `--button-height-large`         | `3rem`                                                                 |
| `padding`            | `--button-padding`              | `1rem`                                                                 |
| `paddingSmall`       | `--button-padding-small`        | `0.75rem`                                                              |
| `paddingLarge`       | `--button-padding-large`        | `1.375rem`                                                             |
| `fontWeight`         | `--button-font-weight`          | `550`                                                                  |
| `letterSpacing`      | `--button-letter-spacing`       | `-0.011em`                                                             |
| `shadow`             | `--button-shadow`               | a 1px edge and a soft drop shadow                                      |
| `shadowPressed`      | `--button-shadow-pressed`       | the 1px edge and a tight glow                                          |
| `highlight`          | `--button-highlight`            | `0.22` (top edge white alpha)                                          |
| `sheen`              | `--button-sheen`                | `0.08` (top-to-bottom white gradient)                                  |
| `glow`               | `--button-glow`                 | `55%` (colored glow strength)                                          |
| `glowHover`          | `--button-glow-hover`           | `85%`                                                                  |
| `aurora`             | `--button-aurora`               | `0.9` (hue-shifted light strength)                                     |
| `hueShift`           | `--button-hue-shift`            | `60` primary, `-28` warning, `-35` destructive (hue degrees, unitless) |
| `auroraAngle`        | `--button-aurora-angle`         | `150deg`                                                               |
| `auroraAngleHover`   | `--button-aurora-angle-hover`   | `240deg`                                                               |
| `auroraDuration`     | `--button-aurora-duration`      | `700ms`                                                                |
| `backdrop`           | `--button-backdrop`             | `none` (a `backdrop-filter`)                                           |
| `stateColor`         | `--button-state-color`          | per variant, see above                                                 |
| `hoverLayer`         | `--button-hover-layer`          | `7%`                                                                   |
| `pressLayer`         | `--button-press-layer`          | `12%`                                                                  |
| `hoverLift`          | `--button-hover-lift`           | `-1px`                                                                 |
| `pressScale`         | `--button-press-scale`          | `0.97`                                                                 |
| `pressShift`         | `--button-press-shift`          | `0px`                                                                  |
| `pressDuration`      | `--button-press-duration`       | `120ms`                                                                |
| `pressEase`          | `--button-press-ease`           | `var(--ease-snap)`                                                     |
| `releaseDuration`    | `--button-release-duration`     | `450ms`                                                                |
| `releaseEase`        | `--button-release-ease`         | `var(--ease-spring)`                                                   |
| `colorDuration`      | `--button-color-duration`       | `150ms`                                                                |
| `shadowDuration`     | `--button-shadow-duration`      | `300ms`                                                                |
| `disabledOpacity`    | `--button-disabled-opacity`     | `0.45`                                                                 |

Filled variants carry the light. A hue-shifted gradient crosses the face from
`auroraAngle`, and hover turns it to `auroraAngleHover`, lifts the button, and
brightens the colored glow. Sheen, highlight, glow, and the default shadow apply
to the filled variants. Outline and ghost hover with a wash of `--color-primary`.
Secondary is flat, outline draws `--color-border` as a real border, and ghost has
no surface until hover. `shadow` takes a full `box-shadow` list. Use `0 0 #0000`
for no shadow, not `none`, because the glow is appended to it. `cornerShape` takes
[`corner-shape`](https://developer.mozilla.org/docs/Web/CSS/corner-shape) values
such as `squircle` or `round`. Browsers without `corner-shape` draw round corners,
which look rounder at the same radius. `radius="full"` always uses round corners.
A disabled button keeps its variant and fades to `disabledOpacity`.

Colors come from these variables. Each takes any CSS color, including `oklch()`
and translucent values. The defaults are an OKLCH indigo palette.

- `--color-primary`, `--color-secondary`, `--color-warning`, `--color-destructive`,
  each with `-foreground`
- `--color-background`, `--color-foreground`, `--color-border` (outline and ghost)
- `--color-focus`

Reduced motion keeps color changes and drops scale and movement. Variables
starting with `--_btn-` are internal and may change.

Caller utilities such as `rounded-full` paint only on the Tailwind route. That
route is the `@cognitap/radiant/tailwind.css` import. Do not import
`@cognitap/radiant/styles.css` and `@cognitap/radiant/tailwind.css` together.
`cn` is not a public export, so a wrapper passes `className` as a string. The
package has no dark-theme block. The defaults are a light theme, and unlayered
application CSS takes precedence over Radiant's styles.

### With Tailwind

Applications on Tailwind 4.3.3+ can import the source entry instead of
`styles.css`, so their own build generates Radiant's utilities. Use one route,
not both, or the utilities are duplicated:

```css
@import 'tailwindcss';
@import '@cognitap/radiant/tailwind.css';
```

To skip Preflight, replace `@import 'tailwindcss'` with
[Tailwind's separate imports](https://tailwindcss.com/docs/preflight#disabling-preflight).
Utilities passed in `className` replace matching defaults, including `hover:` and
`disabled:` variants: `<Button className="rounded-full hover:bg-red-500">`.

## Development

Use the Node.js version in `.nvmrc`. Any recent pnpm switches itself to the version
pinned in `package.json`:

```sh
nvm install && nvm use
npm install --global pnpm
pnpm install --frozen-lockfile
pnpm storybook
```

Storybook runs at [localhost:6006](http://localhost:6006) and needs no Cognitap
checkout.

| Command                | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `pnpm storybook`       | Develop components in Storybook.                                |
| `pnpm build`           | Build JavaScript, declarations, and CSS into `dist/library`.    |
| `pnpm watch`           | Rebuild on change, except `reset.css` (run `pnpm build` first). |
| `pnpm build:storybook` | Build static Storybook into `dist/storybook`.                   |
| `pnpm lint`            | Run Oxlint, including accessibility rules.                      |
| `pnpm format`          | Format with Oxfmt (`format:check` to check only).               |
| `pnpm typecheck`       | Check TypeScript.                                               |
| `pnpm test`            | Run style tests and verify the packed, installed package.       |
| `pnpm test:package`    | Verify the packed, installed package only.                      |
| `pnpm check`           | Run formatting, lint, types, tests, and builds, as CI does.     |
| `pnpm release:prepare` | Pack and verify a release candidate, then dry-run publishing.   |

Package verification installs the archive with npm, so it needs network access.
A Husky pre-commit hook formats staged files with Oxfmt.
[CI](.github/workflows/ci.yml) runs `pnpm check`.

Modules must stay free of import-time side effects, and client-dependent modules
need their own `use client` directive. Add `*.stories.tsx` next to each component,
like `src/Button.stories.tsx`. Storybook's Accessibility panel runs axe checks on
every story, but automated checks cover only part of WCAG, so still test keyboard,
focus, and screen reader behavior by hand.

## Live development in Cognitap

With this checkout at `../radiant` and its dependencies installed, `pnpm dev` in
Cognitap builds and watches it, points both apps at it, and starts this Storybook.
Cognitap's installed package, manifests, and lockfile stay untouched. See
[Cognitap's guide](https://github.com/cognitap/cognitap#live-radiant-development)
for other checkouts and type checking.

## Further reading

- [Release policy](RELEASE_POLICY.md): versioning, compatibility, and the release workflow
- [Changelog](CHANGELOG.md): consumer-facing changes per release
- [CONTRIBUTING.md](CONTRIBUTING.md): maintainer workflow and bug reports
- [AGENTS.md](AGENTS.md): component and styling conventions
