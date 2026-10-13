# Radiant

Reusable React interaction components and presentation primitives, maintained in
this standalone repository.

Radiant's source is available under the [MIT license](LICENSE). The library is
experimental: the current implementation is a native Button proof of concept,
and the npm package has not yet been published. The build includes standalone
component CSS, a separate optional reset and a Tailwind customization entry.
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

| Command                                     | Purpose                                                          |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `pnpm storybook`                            | Edit components in the local workshop                            |
| `pnpm build`                                | Build library JavaScript, declarations, maps and CSS             |
| `pnpm watch`                                | Watch JavaScript, declarations and both compiled stylesheets     |
| `pnpm build:storybook`                      | Build the separate static workshop                               |
| `pnpm typecheck`                            | Check source and Storybook types                                 |
| `pnpm test`                                 | Verify public imports, server rendering, declarations and styles |
| `pnpm lint`                                 | Check correctness and accessibility lint rules                   |
| `pnpm fmt`                                  | Format repository files                                          |
| `pnpm fmt:check`                            | Check formatting                                                 |
| `pnpm check`                                | Run all checks, including the Storybook build                    |
| `pnpm pack --pack-destination dist/package` | Create a package archive locally                                 |

CI installs the pinned dependencies with the committed lockfile and runs
`pnpm check` and package creation. Installing dependencies registers the
pre-commit hook, which formats staged files. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the maintainer workflow.

## Library build

From the repository root:

```sh
pnpm build
```

The build removes `dist/library`, compiles JavaScript and declarations with
`tsc`, and compiles the two stylesheets with the Tailwind CLI. These are
development tools; ordinary consumers need only React and the packaged CSS.

TypeScript emits separate ES2022 ESM modules, `.d.ts` declarations, JavaScript
maps with embedded source, and declaration maps into `dist/library`. Keeping
modules separate preserves `use client` directives and external runtime imports:
React is a peer dependency and `cn` is a runtime dependency. Relative source
imports use `.js` extensions so emitted JavaScript and declarations work in Node
and bundlers, following [TypeScript's library guidance](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options#im-writing-a-library).

The package root and three stylesheet entries are public exports. JavaScript,
types, component styles and the reset resolve to compiled artifacts. Sources ship for editor
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

Storybook reads component source directly for rapid editing. `pnpm watch` uses
TypeScript and Tailwind's native watchers to update the public library artifacts;
run `pnpm build` first when using the watcher on its own. It does not start Storybook.

For live integration, install dependencies in this checkout and Cognitap once,
then run `pnpm dev:radiant` from Cognitap. It defaults to a sibling `../radiant`
checkout; an optional path selects another location. Cognitap builds this package,
starts the watchers and both frontend apps, and temporarily links their package
resolution. The apps consume compiled JavaScript/types and the documented public
Tailwind entry. `Ctrl+C` stops the session and restores installed dependencies;
after an uncatchable interruption, stop surviving servers/watchers and run
`pnpm dev:radiant --restore` in Cognitap. See
[Cognitap's development guide](https://github.com/cognitap/cognitap#live-radiant-development)
for verified refresh behavior and recovery. Its manifests and lockfiles retain
their ordinary dependency, and production commands reject a local session.

Independent Storybook development needs no Cognitap checkout. Live integration
complements installed-archive and registry verification; it does not replace them.

## Button

```tsx
import { Button } from '@cognitap/radiant'

<Button onClick={handleContinue}>Continue</Button>
<Button disabled>Unavailable</Button>
<Button type="submit">Save</Button>
```

`Button` accepts native React button props (`ButtonProps`), including `ref`,
`className`, `aria-*`, and form attributes. It defaults to `type="button"` to
avoid accidental form submission. Import its stylesheet once in your application:

```tsx
import '@cognitap/radiant/styles.css'
```

This route needs no Tailwind installation or CSS compiler. Components do not
import CSS themselves. The stylesheet contains component utilities and tokens;
it does not reset headings, body margins or unrelated native controls. Button
sets its own border style and box sizing and inherits the application's font.

The optional reset is a separate, application-wide choice:

```tsx
import '@cognitap/radiant/reset.css'
import '@cognitap/radiant/styles.css'
```

`reset.css` contains Tailwind Preflight, compiled and self-contained. It changes
global element defaults; importing it is not required for Radiant components.

Native button semantics provide keyboard activation and disabled behavior. Give
every button an accessible name through its text or `aria-label`. Focus indicators
and forced-colors borders are included. Use a link for navigation.

This PoC has one visual treatment, with no variants, sizes, loading state, or
polymorphic rendering. The consumer owns actions and state. React 19.3+ is a peer
dependency.

## Tailwind customization

For an application with Tailwind 4.3.3+, use the source customization entry
instead of the compiled component sheet. It provides the semantic theme and
registers Radiant's shipped component sources for scanning; your application
generates the utilities once with its own Tailwind integration:

```css
@import 'tailwindcss';
@import '@cognitap/radiant/tailwind.css';
```

The application's `tailwindcss` import includes Preflight. To keep the reset
disabled, use [Tailwind's separate imports](https://tailwindcss.com/docs/preflight#disabling-preflight):

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
@import '@cognitap/radiant/tailwind.css';
```

Choose one component-style route: compiled `styles.css` or generated
`tailwind.css`. Combining them duplicates the component utilities. The source
entry does not import Tailwind or generate a second utility sheet. Its `@source`
is relative to the installed source entry, so library scanning works inside
`node_modules`; stories and tests are excluded. Application scanning belongs to
your Tailwind setup. Configure its source base or add an application-relative
`@source` when automatic scanning does not cover your files. See
[Tailwind's source detection guide](https://tailwindcss.com/docs/detecting-classes-in-source-files).

Tokens provide background, foreground, border, primary action states and foreground,
disabled background and foreground, focus color, and control radius. Components
use semantic utilities such as `bg-primary`, `text-primary-foreground`, and
`rounded-control`. Override the corresponding CSS variables to theme an application
or a subtree; these defaults currently define a light theme.

`src/cn.ts` registers the semantic control radius with `cn` so it participates in
class conflict resolution. Components merge classes with this helper, passing the
caller's `className` last so matching utilities override defaults. In a Tailwind app, for example,
`<Button className="rounded-full px-8 hover:bg-red-500">Continue</Button>` replaces
the default corner radius, horizontal padding, and hover color. Disabled
overrides use the same prefix, such as `disabled:bg-slate-300`. The compiled
sheet only includes utilities used by library components; arbitrary caller
utilities need your own generated CSS. Without Tailwind, use ordinary CSS
classes or override the semantic variables. Unlayered application CSS takes
precedence over Radiant's layered utilities.

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
