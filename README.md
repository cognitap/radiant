# Radiant

Reusable React interaction components and presentation primitives, maintained in
this standalone repository.

Radiant's source is available under the [MIT license](LICENSE). The library is
experimental: the current implementation is a native Button proof of concept,
and the npm package has not yet been published. Its stylesheet currently requires
Tailwind processing; standalone compiled CSS is planned before npm publication.
See the
[release policy](RELEASE_POLICY.md) for identity, compatibility, support and
publication requirements, and the [changelog](CHANGELOG.md) for release changes.

## Getting started

Use the Node version in `.nvmrc` and the pnpm version in `package.json`:

```sh
nvm install
nvm use
npm install --global "$(node -p 'require("./package.json").packageManager')"
pnpm install --frozen-lockfile
pnpm storybook
```

Open [Storybook](http://localhost:6006) for the primary component development
loop. No Cognitap checkout or private configuration is required.

| Command                                     | Purpose                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm storybook`                            | Edit components in the local workshop                              |
| `pnpm build`                                | Build library JavaScript, declarations and maps                    |
| `pnpm build:storybook`                      | Build the separate static workshop                                 |
| `pnpm typecheck`                            | Check source and Storybook types                                   |
| `pnpm test`                                 | Build and verify public imports, server rendering and declarations |
| `pnpm lint`                                 | Check correctness and accessibility lint rules                     |
| `pnpm fmt`                                  | Format repository files                                            |
| `pnpm fmt:check`                            | Check formatting                                                   |
| `pnpm check`                                | Run all checks, including the Storybook build                      |
| `pnpm pack --pack-destination dist/package` | Create a package archive locally                                   |

CI installs the pinned dependencies with the committed lockfile and runs
`pnpm check` and package creation. Installing dependencies registers the
pre-commit hook, which formats staged files. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the maintainer workflow.

## Library build

From the repository root:

```sh
pnpm build
```

The build uses `rimraf` to remove `dist/library`, then `tsc` with
`tsconfig.build.json` to compile the library. These are development tools; they
are not runtime dependencies of Radiant.

TypeScript emits separate ES2022 ESM modules, `.d.ts` declarations, JavaScript
maps with embedded source, and declaration maps into `dist/library`. Keeping
modules separate preserves `use client` directives and external runtime imports:
React is a peer dependency and `cn` is a runtime dependency. Relative source
imports use `.js` extensions so emitted JavaScript and declarations work in Node
and bundlers, following [TypeScript's library guidance](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options#im-writing-a-library).

Only `@cognitap/radiant` and `@cognitap/radiant/styles.css` are public exports.
JavaScript and types resolve to compiled artifacts. Sources ship for editor
navigation through declaration maps; stories, tests and Storybook output stay
out of the archive. Rebuilding cleans only `dist/library`.

JavaScript modules must remain free of import-time side effects. Bundlers can
discard unused modules; CSS is explicitly marked as having side effects so
stylesheet imports are retained. Browser interactions belong in the component's
lifecycle, and client-dependent modules need their own `use client` directive.

`pnpm test` builds the library, then checks its actual public JavaScript imports,
server rendering, mapped exports, blocked deep imports, and declarations in
NodeNext and bundler resolution modes. The type fixture uses an independent
TypeScript configuration without source aliases. Full installed-archive
verification is tracked in DEV-41.

Storybook reads component source directly for rapid editing. Optional Cognitap
integration checkpoints explicitly build and install the package through its
public exports. The stylesheet export remains Tailwind source until standalone
compiled CSS is delivered in DEV-38.

## Button

```tsx
import { Button } from '@cognitap/radiant'

<Button onClick={handleContinue}>Continue</Button>
<Button disabled>Unavailable</Button>
<Button type="submit">Save</Button>
```

`Button` accepts native React button props (`ButtonProps`), including `ref`,
`className`, `aria-*`, and form attributes. It defaults to `type="button"` to
avoid accidental form submission. Consumers import compiled JavaScript and
generate the CSS through their Tailwind 4 integration.

Native button semantics provide keyboard activation and disabled behavior. Give
every button an accessible name through its text or `aria-label`. Focus indicators
and forced-colors borders are included. Use a link for navigation.

This PoC has one visual treatment, with no variants, sizes, loading state, or
polymorphic rendering. The consumer owns actions and state. React 19.3+ is a peer
dependency.

## Tailwind

Radiant owns its Tailwind 4 entry point and semantic design tokens in
`src/styles.css`, exported as `@cognitap/radiant/styles.css`. Storybook imports
the same source file via a relative import, following workspace import rules,
and processes it with the Tailwind Vite plugin.

Consuming applications should import the shared stylesheet once in their global
stylesheet, processed by their Tailwind Vite or PostCSS integration:

```css
@import '@cognitap/radiant/styles.css';
```

Radiant's stylesheet includes Tailwind's reset and registers its own component
source with `@source '.'`. Tailwind's automatic scanning covers application source in
ordinary setups. Add an explicit `@source` only for source paths that automatic
scanning does not cover. Importing Button alone does not load global styles.

Tokens provide background, foreground, border, primary action states and foreground,
disabled background and foreground, focus color, and control radius. Components
use semantic utilities such as `bg-primary`, `text-primary-foreground`, and
`rounded-control`. Override the corresponding CSS variables to theme an application
or a subtree; these defaults currently define a light theme.

`src/cn.ts` registers the semantic control radius with `cn` so it participates in
class conflict resolution. Components merge classes with this helper, passing the
caller's `className` last so matching utilities override defaults. For example,
`<Button className="rounded-full px-8 hover:bg-red-500">Continue</Button>` replaces
the default corner radius, horizontal padding, and hover color. Disabled
overrides use the same prefix, such as `disabled:bg-slate-300`.

## Storybook

Storybook uses React and Vite and lives in this package. From the repository root:

```sh
pnpm storybook
```

Open http://localhost:6006. The server binds to localhost.

Build a static site:

```sh
pnpm build:storybook
```

Output goes to `dist/storybook`, separate from the library build.
`pnpm check` validates both the library and the static workshop. Each build
preserves the other's output.

### Accessibility checks

Start Storybook, open a story under **Components → Button** (including **Disabled**),
and select the **Accessibility** panel. The official `@storybook/addon-a11y` addon
runs axe-core checks automatically for each story, including new stories. Use
**Rerun accessibility scan** after changing controls to check the updated state.

Review **Violations** for detected issues, **Passes** for successful checks, and
**Inconclusive** for checks that need human judgment. Expand a result to see the
rule, affected elements, and guidance; highlighting elements helps locate them
in the canvas. A disabled button may be exempt from checks such as color contrast.

Automated checks cover only part of WCAG. A clean result does not establish WCAG
conformance: manually review keyboard navigation, focus visibility, screen reader
behavior, and interaction states in the consuming application as well.
See [Storybook's accessibility testing guide](https://storybook.js.org/docs/writing-tests/accessibility-testing).

## Adding stories

Add `*.stories.tsx` beside a component in `src/`. Import `Meta` and `StoryObj`
from `@storybook/react-vite`, define metadata with `satisfies Meta<typeof Component>`,
and export a `StoryObj<typeof meta>` for each supported state. Preview configuration
enables generated documentation globally. Use `fn()` from `storybook/test` for
callback args, so interactions appear in the Actions panel.

`src/Button.stories.tsx` demonstrates the real Button in enabled and disabled states.
