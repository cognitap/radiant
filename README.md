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

The classes read these variables. The variables work on the compiled stylesheet.
`default` radius reads `--radius-control`. Outline and ghost hover with
`--color-accent` and press with `--color-accent-active`.

- `--color-primary`, `--color-secondary`, `--color-warning`, `--color-destructive`,
  each with `-hover`, `-active`, and `-foreground`
- `--color-accent`, `--color-accent-active`
- `--color-background`, `--color-foreground`, `--color-border`
- `--color-disabled`, `--color-disabled-foreground`
- `--color-focus`
- `--radius-control`

Caller utilities such as `rounded-full` paint only on the Tailwind route. That
route is the `@cognitap/radiant/tailwind.css` import. Do not import
`@cognitap/radiant/styles.css` and `@cognitap/radiant/tailwind.css` together.
`cn` is not a public export, so a wrapper passes `className` as a string. The
package has no dark-theme block.

Components use semantic tokens such as `bg-primary` and `rounded-control`.
Override their CSS variables to theme an application or a subtree; the defaults
are a light theme. Unlayered application CSS takes precedence over Radiant's
styles.

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
