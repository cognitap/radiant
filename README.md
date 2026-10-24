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

Button ships with a neutral baseline: sensible sizes, type, an ink-and-gray
palette, a focus ring, and a quiet press. A theme of CSS variables overrides
any of it (see [Adapting Button](#adapting-button-to-a-design-system)).

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

### Link

`Link` is for navigation: a real anchor with `href`, `target`, `download`, and
native click semantics untouched, so modified clicks and keyboard activation
behave normally. Three forms: an underlined accent link for running text, a
subtle link that underlines on hover, and a button-styled link that reuses the
button variants.

```tsx
import { Link } from '@cognitap/radiant'

<p>Read the <Link href="/guide">guide</Link> first.</p>
<Link href="/settings" variant="subtle">Settings</Link>
<Link href="/start" variant="button" tone="destructive" size="small">Delete space</Link>
<Link href="https://example.com" external>Example</Link>
```

| Prop       | Values                                                             | Default   |
| ---------- | ------------------------------------------------------------------ | --------- |
| `variant`  | `inline`, `subtle`, `button`                                       | `inline`  |
| `tone`     | Button variants, for `variant="button"`                            | `primary` |
| `size`     | `small`, `default`, `large`, for `variant="button"`                | `default` |
| `radius`   | Button radii, for `variant="button"`                               | `default` |
| `external` | Adds `target="_blank"` and `rel="noopener noreferrer"` when unset. | `false`   |
| `render`   | Replace the anchor element; see below.                             | —         |

Links paint from `--link-color` and `--link-hover-color` (falling back to the
primary token) and from the shared focus variables, so a design-system theme
styles links and buttons together. `linkTheme` sets them with typed keys:
`color`, `hoverColor`, `underlineOffset`, `decorationThickness`,
`decorationThicknessHover`, `colorDuration`, and `focusColor`, `focusWidth`,
`focusOffset`, `focusStyle`.

Routers stay outside the core. Pass `render` to hand the anchor props —
`href`, `className`, `children`, and every native attribute — to your router's
own link component:

```tsx
<Link
  href="/docs"
  render={props => <RouterLink {...props} />}
/>
```

The adapter must forward `href`, `className`, and `children`, and keep native
anchor semantics. When `render` is absent, `Link` renders a plain `<a>`.

### Field

`Field` is the form anatomy: it connects a label, an optional description, and
an optional error to one control, or captions a group. It does not validate and
it does not read form state. The consumer owns the error. Pass the message when
the value is invalid and clear it when the value recovers. An empty message
removes the invalid state.

```tsx
import { Field } from '@cognitap/radiant'

;<Field
  label="Email"
  description="Work address"
  error={error}
  required
>
  <input
    name="email"
    type="email"
    autoComplete="email"
  />
</Field>
```

A single host control (`input`, `textarea`, `select`) receives `id`,
`required`, `disabled`, `aria-invalid`, `aria-required`, and
`aria-describedby`. The label uses that `id`. A component child calls
`useField()` and forwards `controlProps`. `Input` does this already. A render
function receives the same props, for an adapter that is not a host element:

```tsx
<Field
  label="Email"
  error={error}
>
  {control => (
    <input
      {...control}
      name="email"
    />
  )}
</Field>
```

`useField()` returns `null` outside a Field. Inside a group, `controlProps` is
`null`: the group element owns the description, and each control keeps its own
label.

| Prop                | Role                                                                          | Default   |
| ------------------- | ----------------------------------------------------------------------------- | --------- |
| `label`             | Accessible name. A `<label>` for one control, a `<legend>` for a group.       | —         |
| `description`       | Help text, included in `aria-describedby` while present.                      | —         |
| `error`             | Error message. Presence marks the field invalid and announces it as an alert. | —         |
| `layout`            | `control` or `group` (`<fieldset>`).                                          | `control` |
| `required`          | Sets the control's `required` and `aria-required`. The marker is visual.      | `false`   |
| `disabled`          | Disables the control, or the whole `<fieldset>` for a group.                  | `false`   |
| `requiredIndicator` | Replaceable visual marker, hidden from assistive tech. `null` hides it.       | `*`       |

Group anatomy is a `<fieldset>` and `<legend>`, so a disabled group disables
its descendants natively. Pass `role="radiogroup"` when a later radio group
needs that role. Required and invalid on a group are relationships on the
fieldset, not on each control.

Ids come from `useId()`, so server markup and hydration agree. A host control's
own `id` wins, and its `aria-describedby` is kept alongside the description and
error. There is no built-in English sentence; the label, description, error,
and required marker are all consumer content.

`fieldTheme` maps typed keys to `--field-*` variables: `gap`, `labelColor`,
`labelSize`, `labelWeight`, `descriptionColor`, `descriptionSize`, `errorColor`,
`errorSize`, `requiredColor`, and `disabledOpacity`. The root sets
`data-slot="field"`, `data-layout`, `data-invalid`, `data-disabled`, and
`data-required`. Parts set `data-slot` to `field-label`, `field-description`,
`field-error`, and `field-required`. Style a control from the field, for
example `[data-slot="field"][data-invalid] input`.

A native `<form>` leaves the control uncontrolled: give it a `name`, and on
submit pass the message back through `error`. Text controls follow the value
contract documented on Input.

### Input

`Input` is a native `<input>` with the text-field metrics. It keeps every
native attribute, including `name`, `type`, `autoComplete`, `placeholder`,
`size` (the character width), `defaultValue`, `value`, `onChange`, `onBlur`,
and `ref`. Inside a single-control Field it takes the field id, required,
disabled, and description relationships. Inside a group it keeps its own
identity, because the fieldset owns the description.

```tsx
import { Field, Input } from '@cognitap/radiant'

;<Field
  label="Email"
  description="Work address"
  error={error}
  required
>
  <Input
    name="email"
    type="email"
    autoComplete="email"
    defaultValue="ada@example.com"
  />
</Field>
```

| Mode         | How the value moves                                                                    | Reset                                                                                             |
| ------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Uncontrolled | Omit `value`. `defaultValue` is the initial value. Read it from `FormData` or the ref. | `form.reset()` restores `defaultValue`.                                                           |
| Controlled   | Pass `value` and update it from `onChange`.                                            | The browser reset does not change React state. Reset the state, or call the form library's reset. |

`onChange` and `onBlur` are the native events. Radiant does not store the value
and does not validate on blur. The native `size` attribute stays the character
width. Visual size is `--input-height`, padding, and font tokens, which fall
back to the button metrics so a theme sizes both together.

`inputTheme` maps `height`, `padding`, `fontFamily`, `fontSize`, `fontWeight`,
`color`, `background`, `borderWidth`, `borderStyle`, `borderColor`, `radius`,
`cornerShape`, `shadow`, `placeholder`, `invalidBorder`, `disabledBackground`,
`focusColor`, `focusWidth`, `focusOffset`, and `focusStyle`. An invalid field
uses the destructive border. The element sets `data-slot="input"`.

TanStack Form is a reference integration, not a dependency. Drive Input in
controlled mode and pass the library's message to Field:

```tsx
<form.Field
  name="email"
  validators={{ onBlur: ({ value }) => (value.trim() ? undefined : 'Enter an email.') }}
>
  {field => (
    <Field
      label="Email"
      error={field.state.meta.errors[0]}
    >
      <Input
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={event => field.handleChange(event.target.value)}
      />
    </Field>
  )}
</form.Field>
```

Checkbox, radio, and file inputs are separate families. `type` still accepts
any native value.

### Adapting Button to a design system

Every design decision is a CSS variable, so a design system, or an agent
reading a design.md, sets values instead of rewriting classes. The built-in
values are deliberately neutral; a theme replaces them wholesale.
Set the variables on `:root`, a subtree, or `[data-slot="button"]`. Button also
exposes `data-variant` and `data-size`, so a rule such as
`[data-variant="destructive"] { --button-glow: 50% }` targets one variant.

Radiant also exports shared theme presets, so every component can wear the same
design system. Apply one to a wrapper and all Radiant components inside follow:

```tsx
import { themes } from '@cognitap/radiant'

;<div style={themes.find(theme => theme.name === 'Ticket')?.style}>...</div>
```

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

| `buttonTheme` key    | Variable                        | Default                           |
| -------------------- | ------------------------------- | --------------------------------- |
| `radius`             | `--button-radius`               | `var(--radius-control)`, `0.5rem` |
| `radiusPressed`      | `--button-radius-pressed`       | the resting radius                |
| `cornerShape`        | `--button-corner-shape`         | `round`                           |
| `cornerShapePressed` | `--button-corner-shape-pressed` | the resting corner shape          |
| `height`             | `--button-height`               | `2.5rem`                          |
| `heightSmall`        | `--button-height-small`         | `2rem`                            |
| `heightLarge`        | `--button-height-large`         | `3rem`                            |
| `padding`            | `--button-padding`              | `1rem`                            |
| `paddingSmall`       | `--button-padding-small`        | `0.75rem`                         |
| `paddingLarge`       | `--button-padding-large`        | `1.375rem`                        |
| `fontWeight`         | `--button-font-weight`          | `550`                             |
| `letterSpacing`      | `--button-letter-spacing`       | `-0.011em`                        |
| `shadow`             | `--button-shadow`               | one soft drop shadow              |
| `shadowPressed`      | `--button-shadow-pressed`       | the resting shadow                |
| `highlight`          | `--button-highlight`            | `0`                               |
| `sheen`              | `--button-sheen`                | `0`                               |
| `glow`               | `--button-glow`                 | `0%` (colored glow strength)      |
| `glowHover`          | `--button-glow-hover`           | unset                             |
| `backdrop`           | `--button-backdrop`             | `none`                            |
| `stateColor`         | `--button-state-color`          | per variant, see above            |
| `hoverLayer`         | `--button-hover-layer`          | `5%`                              |
| `pressLayer`         | `--button-press-layer`          | `8%`                              |
| `hoverLift`          | `--button-hover-lift`           | `0px`                             |
| `pressScale`         | `--button-press-scale`          | `0.97`                            |
| `pressShift`         | `--button-press-shift`          | `0px`                             |
| `pressShiftX`        | `--button-press-shift-x`        | `0px`                             |
| `borderWidth`        | `--button-border-width`         | `1px`                             |
| `borderColor`        | `--button-border-color`         | each variant's edge color         |
| `ghostShadow`        | `--button-ghost-shadow`         | no shadow                         |
| `ghostShadowPressed` | `--button-ghost-shadow-pressed` | no shadow                         |
| `fontSize`           | `--button-font-size`            | `0.875rem`                        |
| `fontSizeSmall`      | `--button-font-size-small`      | `0.8125rem`                       |
| `fontSizeLarge`      | `--button-font-size-large`      | `0.9375rem`                       |
| `fontFamily`         | `--button-font-family`          | the inherited font                |
| `textTransform`      | `--button-text-transform`       | `none`                            |
| `borderStyle`        | `--button-border-style`         | `solid`                           |
| `focusColor`         | `--color-focus`                 | `oklch(0.55 0.13 255)`            |
| `focusWidth`         | `--button-focus-width`          | `2px`                             |
| `focusOffset`        | `--button-focus-offset`         | `2px`                             |
| `focusStyle`         | `--button-focus-style`          | `solid`                           |
| `pressDuration`      | `--button-press-duration`       | `80ms`                            |
| `pressEase`          | `--button-press-ease`           | `var(--ease-snap)`                |
| `releaseDuration`    | `--button-release-duration`     | `160ms`                           |
| `releaseEase`        | `--button-release-ease`         | `var(--ease-settle)`              |
| `colorDuration`      | `--button-color-duration`       | `150ms`                           |
| `disabledOpacity`    | `--button-disabled-opacity`     | `0.5`                             |

Filled variants derive a hairline edge in a darker shade of their own color
unless `borderColor` is set. Secondary and outline draw `--color-border`, and
ghost has no surface until hover. A minimal theme is a handful of variables:

```css
:root {
  --color-primary: oklch(0.486 0.086 178);
  --color-primary-foreground: oklch(0.99 0 0);
  --button-height: 2.5rem;
  --button-padding: 1rem;
  --button-radius: 0.5rem;
  --button-font-size: 0.875rem;
}
```

`shadow` takes a full `box-shadow` list. Use `0 0 #0000`
for no shadow, not `none`, because the glow is appended to it. `cornerShape` takes
[`corner-shape`](https://developer.mozilla.org/docs/Web/CSS/corner-shape) values
such as `squircle` or `round`. Browsers without `corner-shape` draw round corners,
which look rounder at the same radius. `radius="full"` always uses round corners.
A disabled button keeps its variant and fades to `disabledOpacity`.

Colors come from these variables. Radiant sets a neutral palette; each takes
any CSS color, including `oklch()` and translucent values.

- `--color-primary`, `--color-secondary`, `--color-warning`, `--color-destructive`,
  each with `-foreground`
- `--color-background`, `--color-foreground`, `--color-border` (outline and ghost)
- `--color-focus`

Reduced motion keeps color changes and drops scale and movement. Variables
starting with `--_btn-` are internal and may change.

Caller utilities such as `rounded-full` paint only on the Tailwind route. That
route is the `@cognitap/radiant/tailwind.css` import. Do not import
`@cognitap/radiant/styles.css` and `@cognitap/radiant/tailwind.css` together.
`cn` is not a public export, so a wrapper passes `className` as a string.
Unlayered application CSS takes precedence over Radiant's styles.

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
