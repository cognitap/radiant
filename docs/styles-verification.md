# Standalone stylesheet verification

DEV-38 evidence, recorded 13 October 2026. This checks the existing Button and
stylesheet distribution contract. Full installed-package type, SSR/hydration
and release validation remain in DEV-41; no registry publication is performed.

## Build and archive

With the repository's pinned Node 26.11.1 and pnpm 12.11.2:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm pack --pack-destination dist/package
tar -tzf dist/package/cognitap-radiant-0.1.0.tgz
```

The six package tests, source and consumer declaration checks, formatting,
lint and Storybook build passed. CSS tests require compiled styles/reset with
no unresolved imports or Tailwind directives, component state utilities,
exclusion of story-only utilities, and a real customization build through the
public export with automatic scanning disabled. The customization test discovers
library and explicit application utilities once, without adding a reset.

The archive contains the compiled JS/types/maps, `dist/library/styles.css`,
`dist/library/reset.css`, `src/styles.css` for the `tailwind.css` export, library
sources, README, changelog, release policy and MIT LICENSE. It excludes stories,
tests, build inputs and Storybook output. All three public CSS exports resolve
from the installed archive; CSS is declared as a side effect, and Tailwind is
an optional peer.

## Consumer without Tailwind

Copy the fixture outside the repository so a parent `node_modules` cannot hide
missing dependencies. The fixture declares React 19.3.0, React DOM 19.3.0 and
Vite 8.3.4, with no Tailwind integration or source aliases.

From the Radiant repository root:

```sh
radiant_repo="$PWD"
radiant_proof=$(mktemp -d)
mkdir "$radiant_proof/consumer"
cp tests/fixtures/styles/* "$radiant_proof/consumer/"
pnpm pack --pack-destination "$radiant_proof"
cd "$radiant_proof/consumer"
pnpm add "$radiant_proof/cognitap-radiant-0.1.0.tgz" --ignore-scripts
node --input-type=module -e "import { createRequire } from 'node:module'; import assert from 'node:assert/strict'; assert.throws(() => createRequire(import.meta.url).resolve('tailwindcss'), { code: 'MODULE_NOT_FOUND' })"
pnpm build
pnpm dev
```

Use a fresh local browser session at `http://127.0.0.1:4175`. With Playwright CLI
installed, the saved entry function runs reproducible browser assertions:

```sh
playwright-cli -s=radiant-styles open http://127.0.0.1:4175
playwright-cli -s=radiant-styles run-code --filename verify-browser.js
playwright-cli -s=radiant-styles close
```

The installation and production build passed with Tailwind absent both from
the dependency graph and from module resolution. Chromium 155.0.8059.40 passed
the saved browser checks:

| Check                               | Observed result                                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Component import without stylesheet | Native appearance matches the native control; page defaults match the page before the React entry runs      |
| Default compiled stylesheet         | Primary background/foreground, 8px radius, solid 1px border and border-box sizing                           |
| Application font                    | Georgia at 20px inherited without Preflight                                                                 |
| Hover/active/disabled               | Expected token colors; disabled treatment wins over hover                                                   |
| React event handler                 | Pointer and Space activation increment the counter                                                          |
| Keyboard focus                      | 3px blue outline with 3px offset; disabled Button skipped in tab order                                      |
| Forced colors                       | Visible system-color borders, disabled text/border matching                                                 |
| Subtree theme and ordinary CSS      | Primary token changes background; unlayered custom class overrides radius                                   |
| Unrelated global defaults           | Body margin 8px, heading margin 26.8px/font 40px, native button outset border; unchanged with component CSS |
| Explicit `?reset` route             | Body/heading margins become 0px; heading and native control inherit 20px font                               |

The browser entry fails on application exceptions. This is a Chromium
distribution proof, not a complete browser or accessibility conformance audit.

## Optional Tailwind route

Use a separate copy of the fixture for this check; preserve the no-Tailwind
consumer as a control. Install the same archive, then Tailwind and its matching
CLI as development dependencies:

```sh
pnpm add --save-dev --save-exact tailwindcss@4.3.3 @tailwindcss/cli@4.3.3
```

Create `customization.css`:

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities) source(none);
@import '@cognitap/radiant/tailwind.css';
@source './main.js';
```

In `main.js`, replace the `styles.css` import with `./generated.css` and replace
the custom Button's `custom` class with `rounded-full px-8 hover:bg-red-500`.
Compile and build:

```sh
pnpm exec tailwindcss -i customization.css -o generated.css --minify
pnpm build
pnpm exec vite --host 127.0.0.1 --port 4176 --strictPort
```

This passed from the installed archive. Generated CSS contained each tested
library/custom selector exactly once and no reset or unresolved Tailwind
directives. In Chromium, the custom Button used full rounding, 32px inline
padding and its red hover treatment instead of the default hover color. Library
utilities were discovered through the installed source entry; application
classes were discovered through the application-relative `@source`.

Default `styles.css` and optional `tailwind.css` are alternative routes. Using
both would duplicate component utility generation. Storybook exercises the
Tailwind route with its own reset; ordinary consumers choose their reset
independently.
