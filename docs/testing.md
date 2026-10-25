# Verification for component migrations

`pnpm check` is the required local and CI gate. It runs formatting, lint, source
and contract types, runtime tests, the installed consumer suite, a Storybook
build, and real Chromium tests. CI's **Library checks** job fails if any stage
fails. Keep that status required when configuring repository merge rules.

The [browser/AT matrix and evidence process](accessibility.md) defines support
targets, manual scenarios, WCAG mapping and how to report unverified combinations.
Automated Chromium results are one evidence category within that matrix.

## Running browser checks

After installing dependencies, install the matching browser once:

```sh
pnpm exec playwright install chromium
pnpm test:browser
```

Linux CI installs the browser's system dependencies with
`pnpm exec playwright install --with-deps chromium`. The browser version is
pinned by the lockfile. A running Storybook server is not required, and tests do
not take over the development server on port 6006.

`vitest.config.ts` reads the same public preset registry as the Storybook toolbar.
Every story runs once for each preset in explicit Light and Dark. New presets
and stories join that matrix automatically. Each run renders the shared preview,
executes its play function, and runs axe with `a11y.test: 'error'`. There are no
theme exclusions, retries, or blanket accessibility rule suppressions.

For a focused loop:

```sh
pnpm test:browser --project=storybook-glass-dark src/Checkbox.stories.tsx
pnpm test:browser --project=browser-platform -t StrictMode
```

The browser platform project checks native keyboard input, modal focus and
dismissal, event cancellation, action refs, StrictMode cleanup/remount, and
server hydration in light and dark. It uses Vitest's Playwright-backed input,
because synthetic keyboard events in a story cannot prove native Escape, Tab,
summary activation, or `method="dialog"` behavior.

Link scenarios also observe actual new-tab and download events. The platform
project's narrow server commands perform trusted clicks, return the observed
URL/filename, and close the new page/delete the download. Destinations are local
fixtures; no router dependency or external site is required. These checks prove
browser navigation rather than inferring it from event flags or DOM attributes.

Before each browser suite, `scripts/record-browser-environment.mjs` records
`output/browser/environment.json` with the exact installed browser/tool versions,
host OS/build, revision and dirty flag. Preflight clears the previous environment
and JUnit files before recording a run. This receipt is metadata, not a pass;
pair it with that run's JUnit report and case selection. No AT is run by the
recorder or the current Chromium suite.

JUnit results identify the preset/mode project and story in
`output/browser/junit.xml`. Failure screenshots are saved under
`output/browser/attachments/`. CI uploads both as **browser-results**, even
when a test fails. Artifacts expire after 14 days; preserve the environment and
result summary/captures in a reviewed evidence record before expiry. Story failures also link to the corresponding local Canvas.
Use the Storybook testing widget to run and debug plays interactively; use the
command above for the complete required matrix.

## Where a regression belongs

Prefer adding a play to an existing public story when it describes the same
behavior. Query by role and accessible name, act through the control, and assert
the visible result, native form data, or accessible relationship. Avoid testing
private React state, exact class strings, or a replacement that bypasses the
broken default composition. Keep assertions meaningful when the story is also
used in Docs; interacting plays should run in Canvas, rather than moving focus
through an entire Docs page.

Use `tests/browser/` for behavior requiring native browser input or lifecycle
sequencing. Wrap React changes and native input in `act`, wait for the observable
outcome, and unmount/remove every fixture. Tests must leave no open modal,
listener, timer, ref, or document style behind. Keep these scenarios focused;
they complement story plays rather than copying each component's examples.

The existing `tests/*.test.mjs` suite covers SSR/hydration, controlled versus
uncontrolled state, cancellation/ref composition and form interoperability.
`tests/consumer/` checks the packed, installed package and its public types.
Reuse those seams for nonvisual contracts rather than moving every check into a
browser. A styling change also needs browser evidence against the generated CSS.

## Evidence and readiness

Each migration issue and PR should record:

- The originating defect or contract, and the public scenario that fails before
  the fix and passes afterward.
- The commands and results, affected themes/modes, relevant states, and any
  explicit remaining gaps. Attach the CI run and a screenshot when appearance
  is part of the change.
- The checks for native semantics, keyboard/focus, forms, cancellation/refs and
  cleanup/hydration that apply to this migration. Extend the existing scenario
  instead of creating a parallel implementation-only suite.

A passing axe scan is necessary but does not prove visual quality, every
contrast combination, screen reader behavior, or the complete component
contract. Incomplete axe results need manual inspection, particularly on Glass
gradients and translucent surfaces. Use the [Storybook inspection guide](storybook.md)
for Canvas/Docs, all theme/mode combinations, mobile layouts, hover/press,
forced colors and manual visual review. Record those results separately from
automated test counts.

DEV-46 supplies this infrastructure and representative scenarios. DEV-48 owns
the shared composition/lifecycle policy; component migration issues add their
own focused regressions. DEV-57 verifies installed compositions, DEV-134 checks
final harmonisation coverage, DEV-47 owns the browser/assistive-technology
matrix, and DEV-83 owns the complete catalog release audit. Passing this gate
does not mark those later scopes complete.

The integration follows Storybook's [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
and [accessibility test behavior](https://storybook.js.org/docs/writing-tests/accessibility-testing#test-behavior).
