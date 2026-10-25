# E135 — Installed styling artifact verification

Date: 25 October 2026. Source baseline:
`6ec835ea77d44deabebfae87cd69d528cb252311` (DEV-135), plus explicitly dirty final
layer-order/evidence refinements, based on merged DEV-134
`77d83681870474babae06fb7aaf12accf4c6f72c`. Method: one locally packed archive, isolated installed React
consumer, Vite production builds and automated Playwright Chromium input.
This is an artifact checkpoint, not registry/Cognitap consumption or a complete
visual, browser/AT or WCAG audit. See the [evidence matrix](../accessibility.md).

## Package and environment

Installed-run receipt: `2026-10-25T15:40:46.191Z`; completed:
`2026-10-25T15:41:46.869Z`. Revision is the baseline above with `dirty: true`
for DEV-135 changes, not a falsely attributed final commit.

| Field       | Observed value                                                            |
| ----------- | ------------------------------------------------------------------------- |
| OS          | macOS 27.0.1 build 26A434; arm64; Darwin kernel 27.0.0                    |
| Browser     | Chromium 156.0.8078.4, headless                                           |
| Runtime     | Node 26.11.1; React 19.3.0; Playwright 1.64.1                             |
| Build tools | Vite 8.3.4; Tailwind CLI/CSS 4.3.3                                        |
| Archive     | `@cognitap/radiant@0.0.2` local archive with unreleased changes           |
| Result      | Pass: all 64 installed route/theme/mode cases; all 41 package/type checks |
| AT          | None; all manual screen-reader combinations not run                       |

Exact archive integrity:

```text
sha512-9qWdqW+ecKSgICsu68tJKGOnkNbo8Z89jpqjkEXMnVaP3c4uJqaOqHrie1D4MhXBvBWM6IF5PriRGm20CwUhbw==
```

All four builds use the same installed `@cognitap/radiant` archive. The compiled
builds complete while Tailwind is absent from the consumer; only afterward is
the pinned Tailwind CLI installed. Vite is supplied by the verifier as build
tooling. The temporary app imports public package exports, and bundle inspection
requires installed `dist/library/Button.js` and rejects repository source imports.
No aliases, linked checkout, Storybook stylesheet or source-tree components are
used. The typed [fixture](../../tests/consumer/Appearance.tsx) compiles against
installed declarations in NodeNext and Bundler resolution modes.

| Production route  | Entry and reset choice                                                          |
| ----------------- | ------------------------------------------------------------------------------- |
| compiled          | `@cognitap/radiant/styles.css`; no reset; no Tailwind in consumer               |
| compiled-reset    | `@cognitap/radiant/reset.css` before `styles.css`; no Tailwind in consumer      |
| tailwind          | Documented `tailwindcss` + `@cognitap/radiant/tailwind.css`; Preflight included |
| tailwind-no-reset | Separate Tailwind theme/utilities imports + source entry; Preflight omitted     |

Each route runs all eight installed preset IDs in explicit light/dark: 16 cases
per route, 64 total. Computed family styles are compared between the two routes
with matching reset choices. Normal text outside Radiant retains its browser
heading margin without a reset and loses it only when reset is selected.
Compiled imports do not acquire a Tailwind dependency or an implicit global reset.

The fixture covers all ten families and checks provider-free baseline versus
default scope, changing selected theme/mode, inherited inline exceptions,
component overrides, isolated nested themes and default reset. Caller classes
are real application CSS in the compiled builds and newly generated arbitrary,
hover and disabled utilities in Tailwind builds. Both must produce the same
31px radius, 23px horizontal padding, hover color and disabled opacity.
Named Field label styling preserves the input's relationship. Native Dialog
open/close and disclosure visibility exercise retained functional CSS.

Each production CSS asset has one copy of the shared action background utility
and no remaining Tailwind/import directives. Actual rendered styles prove CSS
survives production bundling. Installed module checks verify client directives
on the interactive/context modules, their absence on static entry/Card/Link,
public declarations/exports, and the CSS side-effect declaration. This is not
a separate framework/RSC deployment proof.

## Defects found and retested

1. **Action Link depends on reset.** The compiled consumer without Preflight
   rendered action-shaped Link with native underlining. The browser check failed:
   expected `text-decoration-line: none`, observed `underline`. The shared action
   recipe now owns `no-underline`; caller overrides still merge after defaults.
2. **Compiled reset can override component utilities after bundling.** The
   optimized CSS files had only partial layer-order statements. Import processing
   could establish `utilities` before `base`, letting Preflight clear Button,
   Input and disclosure styling. A one-button reproduction observed transparent
   background instead of `rgb(1, 2, 3)`, even with consumer minification disabled.
   Supplying the complete layer order restored the intended color. The CSS build
   now preserves that statement at the front of both compiled exports. Consumers
   continue using the documented imports, without a compensating application rule.
   The compiler's `properties` fallback layer is ordered first, retaining its
   lower priority than utility declarations.
3. **Caller hover utility loses to internal specificity.** A generated
   `hover:bg-[#123456]` failed to replace the guarded internal hover background.
   Color utilities now use the same `hover:`/`active:` prefixes as caller classes;
   separate disabled/busy background utilities retain the guards. The artifact
   checks assert the caller color, and representative disabled/pending controls
   retain their background on hover in both modes and all four builds.

The minimal CSS probe and complete installed consumer both fail on the original
behavior; the final results below refer to the fixed package, not the failed
diagnostic builds. Representative Glass/Sharp 3D captures are manually inspected
for retained surfaces, controls, action appearance and reset isolation. They use
system-font fallbacks; no external font assets are loaded or claimed verified.

## Results and limits

`pnpm check` passes: **80 runtime, 41 installed-package/type, 64 installed
artifact cases, and 1,037 Storybook/platform browser cases** (211 project/file
runs, zero JUnit failures/errors). Formatting, lint, source/contract types,
generated styles and Storybook build also pass. A separate check resolves all
115 repository links/anchors across 14 documents.

The subsequent source-browser receipt is `2026-10-25T15:41:50.050Z`; last JUnit
suite timestamp is `2026-10-25T15:43:25.672Z`. Its environment matches the host
and browser above; the installed report retains its own earlier timestamps and
archive identity. These results are separate evidence categories.

The eight Glass/Sharp 3D light/dark captures from compiled-reset and Tailwind
were reviewed in pairs: surfaces, selection marks, action styles/shadows and
nested reset styling are retained. The scope is this fixture and these captures;
the full Storybook/Docs visual catalog has not been re-audited here. CI must also
pass the delivery commit before merge; the delivery PR/DEV-135 links its run.

The browser is desktop Chromium at 1000×1400 CSS pixels with reduced-motion
emulation for stable comparison. It still waits for real color transitions to
finish rather than disabling functional styling. The native browser scenarios
complement the source Storybook/platform matrix and its existing preference,
hydration, cancellation and cleanup checks; they do not duplicate those suites.

Manual screen-reader/real-OS settings, mobile/other browser engines, measured
contrast/target geometry, complete visual audit and installed Cognitap/pinned
registry compositions remain unverified here. DEV-57 owns realistic installed
native/TanStack flows and registry consumption; DEV-82/83 own full-catalog proof.
The local archive's package version includes unreleased work and is not evidence
that the corresponding registry release contains or passes these changes.
