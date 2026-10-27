# DEV-163 — Responsive typography artifact verification

26 October 2026. The complete `pnpm check` audit passed on clean source
`74ba65fb8804db279f455cea684f3283f9cc3d6e`, based on merged DEV-162
`dd9a2270ba953adf0902d4bdb15f16a22eb236ed`. Subsequent edits only add this
evidence record and clarify saved font-profile merge ownership in the theming
guide. Routine PR CI verifies the delivery/merge revision separately.

This verifies the [accepted typography model](../research/dev-162-typography-model.md)
as a library capability. The public editor, existing component-family adoption
and final chapter publication remain their planned issues.

## Environment and archive

| Field   | Observed value                                                              |
| ------- | --------------------------------------------------------------------------- |
| Host    | macOS 27.0.1 build 26A434, arm64, Darwin 27.0.0                             |
| Browser | Headless Chromium 156.0.8078.4                                              |
| Runtime | Node 26.11.1, React 19.3.0, Playwright 1.64.1, Vitest 5.0.5                 |
| Builds  | Vite 8.3.4, Tailwind 4.3.3; TanStack Form 1.33.5 in existing compositions   |
| Package | Local experimental `@cognitap/radiant@0.0.5` archive; not published         |
| Fonts   | Consumer-owned family lists with system fallbacks; no downloaded font files |
| AT      | Not run                                                                     |

The installed styling receipt runs from `2026-10-26T03:25:53.072Z` to
`2026-10-26T03:26:58.813Z`; compositions finish at
`2026-10-26T03:27:19.642Z`. Both use the same archive integrity:

```text
sha512-0MrzcOwg9K7CNOEL8BZOU2+AL+m7jhfD93HFBf0zKyPa62l4qZr6kWl2mpJxkr2UeOjSYyHpwMBnYKg3flwXqA==
```

The subsequent Storybook/platform environment receipt is
`2026-10-26T03:27:23.023Z`, with the same clean source and host/browser.
Its JUnit report records 1,117 tests, zero failures and zero errors across
275 project/file runs. Reports and captures remain ignored build artifacts in
`output/browser/`, with source fixtures/scripts committed for reproduction.

## What passes

`pnpm check` passes generated CSS freshness, formatting, lint, source and contract
types, **115 runtime tests**, **44 installed package/type checks**, production
Storybook build and **1,117 Storybook/platform Chromium tests**.

The installed verifier builds compiled CSS and Tailwind consumers, each with and
without reset, from the public packed package. Compiled consumers run before
Tailwind is installed. Existing coverage passes all **72 route/theme/mode styling
cases** and **128 composition cases**, preserving legacy typography, component
exceptions, native input, hydration and cleanup behavior.

Typography adds **32 width/mode cases**: 320/390/640/800px local containers in
light/dark on all four CSS routes. Every case checks all 16 roles' calculated
size, leading, tracking and weight, with layout-owned UI measure. Other checks
cover compact fallback, nested prose containers, paragraph/heading flow, inline
code, explicit-role precedence, caller CSS/utilities, component overrides,
mode-only and default-reset scopes, long-word wrapping and preformatted overflow.
Enlarged root text (200%) and text-spacing overrides reflow in the fixture.

The six focused runtime tests independently cover profile/role calculations,
replay and manual ownership, immutable output, retained out-of-range weight
warnings, malformed/bounded input, compiler precedence and section round trips,
legacy themes, all role utility conflict groups and the pure subpath with
throwing browser globals. Installed consumers also typecheck public exports in
NodeNext and Bundler resolution modes.

The narrow dark stress captures from compiled CSS and Tailwind were inspected:
heading/paragraph text wraps, long identifiers remain within the column and code
has its own scroll box. The captures retain deliberate spacing overrides and
system fallback fonts; they are not approval of production font rendering.

## Defects found and limits

The first full browser attempt discovered that importing `cn/config` caused Vite
to optimize that subpath during a test, reload the page and leave stories with
zero collected tests. Adding the subpath to the existing Storybook and platform
`optimizeDeps.include` lists removed those reloads. The complete clean audit
above then passed without exclusions or retries.

These results do not establish actual curated-font loading/italic axes, broad
script coverage, browser zoom, other browser engines, manual assistive technology,
universal readability or final workshop release readiness. Root-size/spacing
probes are explicitly distinct from those checks. Follow the existing
[browser/AT evidence matrix](../accessibility.md); DEV-169 retains final production
chapter acceptance. The new text-style hooks remain opt-in, and DEV-167 owns
adoption across existing component families.
