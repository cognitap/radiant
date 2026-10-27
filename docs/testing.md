# Testing

## Which check to run

| Command                   | When                                                 | What it runs                                                                                           |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `pnpm check:ci`           | Every change; CI runs it on pull requests and `main` | Generated themes, format, lint, types, runtime and package tests, Storybook build, smoke browser tests |
| `pnpm check`              | Theme, styling or composition changes, and releases  | Everything above, every story in every preset and mode, installed styling and composition checks       |
| `pnpm test`               | Runtime changes                                      | `tests/*.test.mjs` and the packed, installed package                                                   |
| `pnpm test:browser`       | Story or browser behavior changes                    | Every story in every preset, light and dark, plus `tests/browser/`                                     |
| `pnpm test:browser:smoke` | A quick browser pass                                 | Every story in Radiant light and dark, plus `tests/browser/`                                           |

In GitHub Actions, run the full check with **Run workflow → full**. The
**Library checks** job must stay a required status.

## Browser tests

```sh
pnpm exec playwright install chromium   # --with-deps on Linux
pnpm test:browser
```

They need no running Storybook. Every story renders, runs its play function and
fails on any axe violation, in every preset and mode. New stories and presets
join the matrix automatically. There are no retries and no rule exclusions.

Focus a run on one project or test:

```sh
pnpm test:browser --project=storybook-glass-dark src/Checkbox.stories.tsx
pnpm test:browser --project=browser-platform -t StrictMode
```

The `browser-platform` project in `tests/browser/` uses real browser input. It
covers what a story play cannot prove: native Escape, Tab, summary activation,
`method="dialog"`, modal focus, refs, StrictMode remounts, hydration, new tabs
and downloads. It also emulates reduced motion and forced colors across every
preset.

Results go to `output/browser/`: `junit.xml`, failure screenshots in
`attachments/`, and `environment.json` with the exact browser, OS and commit.
CI uploads them as **browser-results** and keeps them for 14 days.

## Where a test belongs

- **Story play:** visible behavior of a public story. Query by role and name, act
  through the control, and assert what a user sees or what the form submits.
  Don't test private state or class strings.
- **`tests/browser/`:** behavior that needs native input or lifecycle ordering.
  Wrap changes in `act`, wait for the outcome, and clean up every fixture.
- **`tests/*.test.mjs`:** SSR, hydration, state ownership, cancellation, refs and
  form behavior that need no browser.
- **`tests/consumer/`:** the packed package's exports and types.

A styling change also needs a browser check against the generated CSS.

## Installed-package checks

```sh
pnpm test:package --styles   # both CSS routes, with and without the reset
pnpm test:compositions       # the canonical forms and Workspace, installed
```

Both install the packed package into a temporary consumer and build it for
production, using no repository source. They cover every preset in both modes.
Results and captures go to `output/browser/installed-styles/` and
`output/browser/installed-compositions/`. To try the composition build by hand:

```sh
pnpm exec vite preview --host 127.0.0.1 --port 4175 --strictPort --outDir output/browser/installed-compositions/client
```

To check a build inside Cognitap without changing its checkout:

```sh
pnpm build
pnpm pack --out /tmp/radiant.tgz
pnpm exec node scripts/verify-cognitap.mjs /path/to/cognitap /tmp/radiant.tgz
```

## What to put in the pull request

- The scenario that failed before the change and passes after it.
- The commands you ran, the presets and modes affected, and anything left
  unchecked.
- A link to the CI run, plus a screenshot when appearance changed.

Axe passing does not prove contrast on gradients, screen reader behavior or
visual quality. For manual checks, see [Storybook](storybook.md#verification)
and [accessibility](accessibility.md).
