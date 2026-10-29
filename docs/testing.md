# Testing

## Which check to run

| Command             | When                              | What it runs                                                                                                         |
| ------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`        | Every change; CI runs it          | Theme check, format, lint, types, docs policy, build, repo checks, packed package, Storybook, Radiant light and dark |
| `pnpm test`         | Runtime changes                   | Repo checks in `tests/*.test.mjs` and the packed package                                                             |
| `pnpm test:browser` | Story or browser behavior changes | Every story in every preset, light and dark, plus `tests/browser/`                                                   |
| `pnpm test:package` | Package export changes            | The packed package                                                                                                   |

## Browser tests

```sh
pnpm exec playwright install chromium   # --with-deps on Linux
pnpm test:browser
```

They need no running Storybook. Every story renders and fails on any axe
violation. `pnpm check` runs Radiant light and Radiant dark. `pnpm test:browser`
runs every preset. New stories join that matrix automatically.
There are no retries and no rule exclusions.

Focus a run on one project or test:

```sh
pnpm test:browser --project=storybook-glass-dark src/Checkbox.stories.tsx
pnpm test:browser --project=browser-platform -t StrictMode
```

`tests/browser/` is where component behavior lives: keyboard, forms, motion,
refs, StrictMode, hydration, new tabs and downloads. One file owns each
behavior. Motion waits poll for the settled element. Mid-flight spring values
stay in the pure `createSpring` test.

Results go to `output/browser/`: `junit.xml` and failure screenshots in
`attachments/`. CI uploads them as **browser-results** and keeps them for 14 days.

## Where a test belongs

- **Story:** render and axe in light and dark. Do not repeat keyboard, form, or
  motion behavior.
- **`tests/browser/`:** component behavior. Wrap changes in `act`, wait for the
  outcome, and clean up every fixture.
- **`tests/*.test.mjs`:** repo-only checks that read source or the built library.
- **`tests/package/`:** packed exports, types, and contrast for every exported
  theme. Import `@cognitap/radiant`, never `src` or `dist`.

A styling change also needs a browser check against the generated CSS.

## Installed-package checks

```sh
pnpm test:package
```

It packs the library, installs that tarball in a temporary directory, and runs
`tests/package` there. The same files import `@cognitap/radiant`. `tsc` checks
`types.tsx` under NodeNext and Bundler. Node does not execute that file.

## What to put in the pull request

- The scenario that failed before the change and passes after it.
- The commands you ran, the presets and modes affected, and anything left
  unchecked.
- A link to the CI run, plus a screenshot when appearance changed.

Axe passing does not prove contrast on gradients, screen reader behavior or
visual quality. For manual checks, see [Storybook](storybook.md#verification)
and [accessibility](accessibility.md).
