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

| Command                                     | Purpose                                                      |
| ------------------------------------------- | ------------------------------------------------------------ |
| `pnpm storybook`                            | Edit components in the local workshop                        |
| `pnpm build`                                | Build library JavaScript, declarations, maps and CSS         |
| `pnpm watch`                                | Watch JavaScript, declarations and compiled component styles |
| `pnpm build:storybook`                      | Build the separate static workshop                           |
| `pnpm typecheck`                            | Check source and Storybook types                             |
| `pnpm test`                                 | Verify builds and an independently installed archive         |
| `pnpm test:package`                         | Build, pack and verify an isolated installed package         |
| `pnpm lint`                                 | Check correctness and accessibility lint rules               |
| `pnpm fmt`                                  | Format repository files                                      |
| `pnpm fmt:check`                            | Check formatting                                             |
| `pnpm check`                                | Run all checks, including the Storybook build                |
| `pnpm release:prepare`                      | Pack and verify a release candidate; dry-run publication     |
| `pnpm pack --pack-destination dist/package` | Create a package archive locally                             |

CI installs the pinned dependencies with the committed lockfile and runs
`pnpm check` and package creation. Installing dependencies registers the
pre-commit hook, which formats staged files. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the maintainer workflow.

Releases are independent of Cognitap; see the
[release workflow](RELEASE_POLICY.md#release-workflow).

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

`pnpm test` builds the library, checks the Tailwind customization route locally,
and verifies the public package through an isolated installation.

### Installed archive verification

`pnpm test:package` builds Radiant, packs it into a temporary directory and
installs the archive there with npm. The small `tests/consumer` fixture owns
the public import/SSR, CSS, map, metadata and React-peer checks, plus independent
NodeNext and bundler declaration checks. It uses the repository's pinned React
and TypeScript versions, with no Tailwind or source aliases. Public package
checks run once, against installed artifacts. The directory and archive are
removed after success or failure.

`pnpm test` and `pnpm check` include this verification; npm and registry access
are required. Use `node scripts/verify-package.mjs /absolute/path/to/candidate.tgz`
to verify an existing release candidate without rebuilding or repacking it.
Browser interaction/hydration evidence and registry publication remain separate.

Storybook reads component source directly for rapid editing. `pnpm watch` uses
TypeScript and Tailwind's native watchers to update JavaScript, declarations and
the compiled component stylesheet. Run `pnpm build` first when using the watcher
on its own. The initial build also generates the optional reset; rerun
`pnpm build:css` after editing `styles/reset.css`. The watcher does not start Storybook.

For live integration, install dependencies in this checkout and Cognitap once,
then run `pnpm dev` from Cognitap. It automatically selects a sibling `../radiant`
checkout when present; `pnpm dev /path/to/radiant` selects another location, and
`pnpm dev --installed` selects the installed dependency explicitly. Without a
sibling checkout, development uses the installed dependency.

Cognitap builds the selected package, then starts its watchers and Storybook,
both frontend apps and Trantor together through Nx. The frontend processes resolve
this checkout's public exports through temporary aliases. The apps consume
compiled JavaScript and the documented Tailwind entry. Local Next.js development
uses Webpack for external package watching; ordinary development keeps Turbopack.
`Ctrl+C` stops the session.
Installed dependencies, manifests and lockfiles stay unchanged; ordinary Cognitap
checks and builds use its installed dependency even during a local session.

Run `pnpm dev --typecheck [checkout-path]` from Cognitap to refresh JavaScript,
declarations and maps with the `build:js` helper and check both apps against the
public declarations. The helper preserves the output directory and compiled
stylesheets during a watch session. Local commands select temporary type
configurations; editors normally read the ordinary app configurations, so use
this command to validate new public types. See
[Cognitap's development guide](https://github.com/cognitap/cognitap#live-radiant-development)
for the full workflow and Trantor setup.

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
