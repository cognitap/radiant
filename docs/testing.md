# Verification for component migrations

`pnpm check:ci` is the routine local and CI gate. It checks generated themes,
formatting, lint, source/contract types, all runtime tests, installed package
exports/types without Tailwind, and the Storybook production build. It then
runs every story's interaction/accessibility checks in Radiant Light and Dark,
plus the complete browser platform project. The platform Appearance cases still
exercise every preset in both modes. CI's **Library checks** job fails if any
stage fails. Keep that status required when configuring repository merge rules.

`pnpm check` remains the exhaustive audit: it additionally builds and renders
production consumers of both styling routes and the canonical compositions,
and repeats every story across all presets in Light and Dark. Use it for
theme/styling/composition changes and release verification. Run it locally or
select **Run workflow → full** in GitHub Actions. Routine PR/main CI does not
run this larger matrix.

Pull requests run CI on their merge revision; pushes to `main` verify the merged
result. Feature branch pushes use the pull request run, avoiding duplicate
push/PR suites. Within a pull request, newer commits cancel older runs.

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

The full `pnpm test:browser` suite in `vitest.config.ts` reads the same public preset registry as the Storybook toolbar.
Every story runs once for each preset in explicit Light and Dark. New presets
and stories join that matrix automatically. Each run renders the shared preview,
executes its play function, and runs axe with `a11y.test: 'error'`. There are no
theme exclusions, retries, or blanket accessibility rule suppressions in the
full suite. `pnpm test:browser:smoke` selects Radiant Light, Radiant Dark and
the browser platform project for routine CI; it does not change the full suite.

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

Its Appearance cases also check rendered nested/default scope isolation and
live system-mode changes, plus reduced-motion/forced-colors emulation across all
presets in both modes using the canonical workspace. Emulation is separate from
actual OS settings and manual screen-reader verification.

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
command above for the complete audit matrix.

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

For the focused installed styling check:

```sh
pnpm test:package --styles
```

The existing archive verifier first runs its isolated no-Tailwind package/type
checks, then builds compiled CSS consumers with and without the optional reset.
Only then does it install the pinned Tailwind CLI in that temporary fixture and
build both documented Tailwind entries. Vite production bundles import the
installed public package; no repository source or Storybook stylesheet is used.
Each route exercises all presets in light/dark, provider-free/default/nested
scopes, component/local/caller overrides, and native Dialog/disclosure visibility.
The same checks run in the full audit through `pnpm check`; routine CI uses
the package/type check without these production browser fixtures.

`output/browser/installed-styles/results.json` records its own environment,
archive integrity, build tools, observed styles and pass/fail cases. Production
bundles and representative Glass/Sharp 3D captures are beside it; a full CI
audit includes them in **browser-results**. This receipt belongs to the installed run,
separately from the subsequent Storybook/platform JUnit report. Ordinary `pnpm test`/`test:package` and release
preparation retain the package/type check without requiring a browser.

For the realistic installed composition checkpoint:

```sh
pnpm test:compositions
```

This reuses the archive verifier and copies the canonical Profile/Workspace
recipes into its isolated consumer, changing only their import target to the
installed public package. Their source hashes are retained. One private harness
selects native/TanStack ownership and standalone/Card/Dialog/Workspace placement;
it does not implement another form. Production server markup hydrates in
Chromium with stable IDs/control identity. Native keyboard input checks errors,
submitted data, reset, radio arrows, modal containment/Escape/restoration,
disclosures, Link navigation and open-modal unmount/remount. All presets run in
both modes, including an inherited input override and an independent default scope.

Results, environment/package integrity, the production page and representative
captures are in `output/browser/installed-compositions/`, included in a full CI
audit's **browser-results** artifact. The full audit includes this check. Serve the retained
page for manual browser/AT testing:

```sh
pnpm exec vite preview --host 127.0.0.1 --port 4175 --strictPort --outDir output/browser/installed-compositions/client
```

The opt-in Cognitap checkpoint requires a clean, fixed checkout and a matching
locally built archive. It snapshots tracked files into a disposable directory,
installs the frozen registry pins, checks the existing production pages, records
the available registry API, then installs the explicit archive and TanStack
adapter into the snapshot. Helicon's Astro island and Terminus's Next client
boundary use their real production builds and Tailwind configuration, with live
development aliases disabled. The original checkout/pins are never modified.

```sh
pnpm build
pnpm pack --out /tmp/radiant-dev57.tgz
pnpm exec node scripts/verify-cognitap.mjs /path/to/cognitap /tmp/radiant-dev57.tgz
```

Keep `output/browser/cognitap-compositions/` with the source revision, temporary
lockfile, builds, registry limitation and archive results. It is a manual
cross-repository checkpoint, not an implicit CI checkout of another project's
moving main branch.

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
