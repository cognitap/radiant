# E134 — Ten-family regression coverage audit

Date: 25 October 2026. Method: source/contract review, automated Chromium input
and CSS preference emulation. This is the harmonisation regression checkpoint
for Button, Link, Field, Input, Checkbox, RadioGroup/Radio, Dialog, Collapsible,
Accordion and Card. It is not a complete visual, browser/AT or WCAG audit.
Use the [matrix and evidence process](../accessibility.md) for scenario IDs and
the [system guide](../system.md) for the current contract.

## Environment and execution

Based on `62fef64ff999824c5e30745003aea4819cee51a9` (merged DEV-47), with the
DEV-134 audit and browser-check working changes. No component implementation,
theme values, CSS entry, dependencies or public API changes are delivered.

Receipt: `2026-10-25T14:43:33.985Z`; last JUnit suite timestamp:
`2026-10-25T14:45:16.936Z`. Revision is the base above with `dirty: true` for the
audit changes, rather than a falsely attributed final commit.

| Field     | Observed value                                                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| OS        | macOS 27.0.1 build 26A434; arm64; Darwin kernel 27.0.0                                                                             |
| Browser   | Playwright Chromium 156.0.8078.4, headless                                                                                         |
| Tools     | Node 26.11.1; Playwright 1.64.1; Vitest 5.0.5                                                                                      |
| AT        | None; all manual screen-reader scenarios not run                                                                                   |
| Full gate | `pnpm check`: pass — 80 runtime, 40 installed-package and 1,037 browser cases; 211 project/file runs, zero browser failures/errors |
| Selection | 61 stories × 8 presets × 2 explicit modes, plus 61 platform cases, including 34 new Appearance cases                               |

Formatting, lint, source/contract types, generated CSS and Storybook build pass
as part of that gate. All 112 repository links/anchors across 13 documents also
resolve in a separate local check. The receipt and completed JUnit report were
retained together; counts do not establish manual WCAG results.

Rendering uses Storybook's Tailwind entry, opt-in reset and configured Google
font import. Network font availability is not an assertion of these tests.
Browser projects use a 1280×900 CSS-pixel viewport unless a scenario explicitly
resizes it; the bounded Dialog scenario uses 320×480 and restores the viewport.
The preference cases use Playwright emulation, not actual OS accessibility
settings. No assistive technology is attached.

## Coverage reviewed

Each row identifies executable evidence, not a claim that every possible
combination or criterion has passed. Story plays run for every public preset
in explicit light/dark; the platform cases have their own named coverage.

| Contract / scenario                                | Executable evidence and boundary                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme definition and isolation                     | [Theme definition tests](../../tests/theme-definition.test.mjs) check complete immutable mode maps, component-local exceptions, unknown keys and fresh default resets. [Scope tests](../../tests/theme-scope.test.mjs) check host/SSR behavior and inline-override rules.                                                                                                                                                                                               |
| Rendered inheritance, reset and preference changes | [Appearance checks](../../tests/browser/Appearance.test.tsx) exercise inherited scopes, a mode-only scope, an isolated sibling, default reset of radii/paint/shadows and a live system-preference switch. These two cases use a deliberately distinct custom theme in both starting modes.                                                                                                                                                                              |
| Button and Link actions (K1)                       | [Button stories](../../src/Button.stories.tsx) compare all four action variants × four tones and sizes with Link. [Native Link checks](../../tests/browser/Link.test.tsx) observe click/Enter/Space, cancellation, modified/middle clicks, actual popup/download and form behavior. [Dialog action tests](../../tests/dialog-form.test.mjs) cover Button composition, pending/disabled guards and host replacement.                                                     |
| Field, Input and native form semantics (K2)        | [Installed package tests](../../tests/consumer/package.test.mjs) check IDs, parts, group layout and protected relationships. [Field hydration](../../tests/field-hydration.test.mjs) and [Input form tests](../../tests/input-form.test.mjs) cover native hosts, reset, blur, submit and the optional TanStack owner.                                                                                                                                                   |
| Checkbox and RadioGroup/Radio (K2)                 | [Checkbox](../../tests/checkbox-form.test.mjs) and [RadioGroup](../../tests/radio-group-form.test.mjs) exercise native form data/reset, controlled state, mixed state, selection, disabled behavior and input/fieldset refs. [Platform cases](../../tests/browser/platform.test.tsx) additionally check real sizes, Field/legend inheritance and null versus empty radio values. State stories check disabled mark contrast/alignment.                                  |
| Dialog, Collapsible and Accordion (K3/K4)          | [Platform cases](../../tests/browser/platform.test.tsx) use native keys/focus, modal/nonmodal reconciliation, bounded scrolling, Escape, method=dialog, default/replacement actions, ancestor forms and disclosure restoration. [Dialog](../../tests/dialog-form.test.mjs), [Collapsible](../../tests/collapsible-form.test.mjs) and [Accordion](../../tests/accordion-form.test.mjs) add owner cancellation, nesting, selection and closed-content form participation. |
| Card and assembled tasks (K5)                      | [Card tests](../../tests/card.test.mjs) check passive semantics, headings and every part's ref. [Workspace](../../src/Workspace.stories.tsx) and [Forms](../../src/Form.stories.tsx) reuse the canonical all-ten-family assembly and native/TanStack form. Platform cases exercise the same form in Card and Dialog without nested forms.                                                                                                                               |
| Root/part targets and native props                 | Installed [runtime](../../tests/consumer/package.test.mjs) and [type](../../tests/consumer/types.ts) fixtures exercise supported host refs, native attributes and styling hooks. Card hydration and platform Dialog/disclosure checks verify real host targets and composed identity tokens. These are representative assertions, not every native attribute permutation.                                                                                               |
| Public declarations and architecture seams         | [Installed type fixtures](../../tests/consumer/types.ts) and [theme types](../../tests/consumer/theme-types.ts) compile against the packed declarations, with positive and rejected uses. [Architecture tests](../../tests/architecture.test.mjs) enforce private import seams, static/client boundaries and browser-free server rendering. Historical contract sketches are not substituted for package declarations.                                                  |
| Hydration, cleanup and state ownership             | [Shared lifecycle tests](../../tests/composition-lifecycle.test.mjs) cover fixed owners, no-op/prop-sync suppression, batched selection and callback-ref cleanup. Native platform cases check hydration IDs/form state, StrictMode unmount/remount and host-document cleanup inside an iframe, in addition to family hydration tests.                                                                                                                                   |
| Reduced motion (V3, emulated)                      | Appearance checks run for all eight presets × light/dark on the canonical workspace: pending text stays visible, the spinner is hidden, held Space activates the default Dialog trigger without scale/translate, action transitions retain color feedback, and surface/disclosure/icon transitions stop. Switching back to no-preference verifies themed press scale still works. Escape restores trigger focus.                                                        |
| Forced colors (V3, emulated)                       | The same 16 combinations check selected/mixed/disabled Checkbox and Radio marks against their rendered fill/system colors, disabled Button border/text/opacity, real keyboard focus outlines inside Dialog and Escape focus return. This is a bounded emulation check, not Windows contrast-theme or AT evidence.                                                                                                                                                       |
| Existing CSS/package guards                        | [Style tests](../../tests/styles.test.mjs) generate the Tailwind entry once with an application utility and check functional rules. Installed tests check compiled self-contained CSS, separate reset, export boundaries and no Tailwind runtime requirement. Full rendered parity of both installed styling routes remains DEV-135's scope.                                                                                                                            |

## Gaps closed and failure sensitivity

The migration already had meaningful interaction, native forms, public types,
root/part and lifecycle tests. Two coverage gaps were found: scope expectations
were mostly SSR/style-map assertions, and preference fallbacks were mostly
generated-CSS text checks. Added 34 focused browser cases for these gaps, reusing
the canonical workspace and existing Vitest/Playwright command mechanism.
No duplicate form implementation or second test infrastructure was introduced.

Failure control: temporarily removed `motion-safe` from the action press-scale
utility and ran the `radiant light: reduced motion` case through
`pnpm test:browser --project=browser-platform tests/browser/Appearance.test.tsx`.
With that case selected, the command exited **1**: expected scale `none`, observed
`0.97`. The original source was restored before the final gate. This is an
intentional regression probe, not a shipped defect or a passing audit run.

## Required gate and readiness decision

`pnpm check` chains theme generation consistency, formatting, lint, source and
contract types, runtime and installed-package tests, Storybook build and the
browser matrix. Failures stop the chain; axe violations are errors. Existing
CI runs the same command and uploads the browser receipt/JUnit and failures.

Read-only verification of `main` protection on this date confirms **Library
checks** is required, requires an up-to-date branch and applies to administrators.
Force pushes and branch deletion are disabled. The browser negative control
confirms that a failing scenario makes its required command fail; no protection
setting was changed for this audit.

Automated regression checkpoint: **pass locally**, ready for PR review. CI must
also pass the delivery commit before merge; its run is linked from the delivery
PR/DEV-134. This decision covers the rows above and retains the following gaps.

Remaining evidence is explicitly **not run** here: NVDA+Firefox/Windows,
VoiceOver+Safari/macOS and iOS, TalkBack+Chrome/Android; version-complete other
desktop browsers; real OS reduced-motion/contrast themes; a fresh full visual
review, measured contrast/target geometry, zoom/text-spacing and mobile touch.
These are not promoted to pass by automation or emulation. No individual manual
WCAG criterion, overall conformance or full release readiness is established.

DEV-135 next owns rendered compiled-CSS/Tailwind artifact parity; DEV-57 owns
installed Cognitap/pinned-registry compositions; DEV-83 owns the complete-catalog
release audit and remaining browser/AT evidence. The DEV-131 rollup remains open
until its children and exit criteria have actual evidence.
