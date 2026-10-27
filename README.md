# Radiant

React components built on native HTML elements, with shared themes. Published
as [`@cognitap/radiant`](https://www.npmjs.com/package/@cognitap/radiant) under
the [MIT license](LICENSE). Radiant is experimental during 0.x.

It has ten families: Button, Link, Field, Input, Checkbox, RadioGroup, Dialog,
Collapsible, Accordion and Card.

## Install

```sh
pnpm add --save-exact @cognitap/radiant
```

React 19.3+ is a peer dependency. Import the stylesheet once. It needs no
Tailwind and styles only Radiant components:

```tsx
import '@cognitap/radiant/styles.css'
import { Button, Field, Input } from '@cognitap/radiant'

export function Signup() {
  return (
    <form>
      <Field label="Email">
        <Input
          name="email"
          type="email"
          autoComplete="email"
        />
      </Field>
      <Button type="submit">Sign up</Button>
    </form>
  )
}
```

For a global reset, also import `@cognitap/radiant/reset.css` before
`styles.css`.

### With Tailwind

Applications on Tailwind 4.3.3+ can import the source entry instead of
`styles.css`, so their own build generates Radiant's utilities. Use one route,
not both:

```css
@import 'tailwindcss';
@import '@cognitap/radiant/tailwind.css';
```

Keep source discovery on so your own utilities are generated. Utilities you pass
in `className` replace the matching defaults, including `hover:` and
`disabled:` variants.

## Documentation

- [Docs site](https://github.com/cognitap/radiant-docs): a guide and live example for each component
- [Architecture](docs/architecture.md): how the families fit together and why
- [Theming](docs/theming.md): tokens, presets, fonts and modes
- [Motion](docs/motion.md): opt-in spring animation
- [Accessibility](docs/accessibility.md): support targets and manual checks
- [Glossary](GLOSSARY.md): shared vocabulary
- [Changelog](CHANGELOG.md): what changed in each release, including unreleased work
- [Contributing](CONTRIBUTING.md): setup, commands and how changes get merged
