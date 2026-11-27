# Maintaining Radiant

The owner and maintainers decide what goes into Radiant. Discuss proposed changes with a maintainer before you start work.

Report bugs and accessibility problems through [GitHub issues](https://github.com/cognitap/radiant/issues). Include reproduction steps and the browser, operating-system, and assistive-technology versions.

Changes to `main` go through pull requests with passing CI, including for administrators. Force pushes and branch deletion are blocked on `main`.

See [docs/architecture.md](docs/architecture.md) for the component contract, [docs/theming.md](docs/theming.md) for themes, and [RELEASE_POLICY.md](RELEASE_POLICY.md) for compatibility and releases. Manual visual, zoom, and screen-reader checks are in docs/accessibility.md.

## Development

Use the Node.js version in `.nvmrc`. Any recent pnpm switches itself to the version pinned in `package.json`:

```sh
nvm install && nvm use
npm install --global pnpm
pnpm install --frozen-lockfile
pnpm storybook
```

Storybook runs at [http://localhost:6006](http://localhost:6006), where the toolbar switches **Theme** and **Mode**. To inspect a story without running its `play` function, add `&embed=true` to the iframe URL.

| Command                  | Purpose                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `pnpm build`             | Build `dist/library` in place, then delete output of removed sources. The folder stays readable during the build.         |
| `pnpm watch`             | Rebuild on change, except `reset.css`. Run `pnpm build` first.                                                            |
| `pnpm test`              | Build, run `tests/*.test.mjs`, and run `pnpm test:package`.                                                               |
| `pnpm test:package`      | Pack the tarball, install it in a temporary directory, and run `tests/package/`.                                          |
| `pnpm test:browser`      | Run every story in every theme and mode with axe, plus `tests/browser/*.test.tsx`. Writes artifacts to `output/browser/`. |
| `pnpm check:library`     | Check generated theme CSS, formatting, lint, types and docs budgets, then build and run the Node and package tests.       |
| `pnpm check:storybook`   | Build Storybook and run every story in the Radiant theme, light and dark.                                                 |
| `pnpm check:conformance` | Run the A2UI conformance stories in every other theme and mode.                                                           |
| `pnpm test:visual`       | Screenshot every catalog combination and compare it with the approved image.                                              |

CI runs five jobs: `pnpm check:library`, `pnpm check:storybook`, `pnpm check:conformance`, `pnpm test:browser --project=browser-platform`, and `pnpm test:visual`. `pnpm check` runs the first three.

Install the headless Chromium shell once before running browser tests:

```sh
pnpm exec playwright install --only-shell chromium
```

To run a single Vitest project, file, or test name:

```sh
pnpm test:browser --project=storybook-glass-dark src/components/Checkbox/Checkbox.stories.tsx
pnpm test:browser --project=browser-platform -t Dialog
```

Put new tests in the matching suite:

- `src/components/<Family>/<Family>.stories.tsx` renders each story and runs axe across themes and modes.
- `tests/browser/*.test.tsx` tests interactive behavior, refs, and hydration in Chromium.
- `tests/*.test.mjs` runs fast Node checks over source files, helpers, SSR output, and architecture rules.
- `tests/package/package.test.ts` tests the packed package, including exports, compiled CSS, TypeScript resolution, and token contrast.
- `tests/visual/catalogMatrix.ts` builds the visual matrix from `src/a2ui/extension-catalog.json`. A new component needs a seed there; new enum and boolean props join automatically.

## Visual matrix

`pnpm test:visual` renders all-pairs combinations of each component's enum and boolean props, plus nested containers, in light and dark at 360px and 720px. Screenshots differ by platform, so only the Linux images in `tests/visual/__screenshots__/` are committed. Locally the first run fails every case while it records your own references; later runs compare against them.

When CI reports a visual change, download `visual-diffs` and review the reference, actual and diff images. For an intended change, add the `visual-baselines` label to render the merge with `main`, then review and commit the images. CI skips the comparison while the label is present and reruns it when you remove the label. A manual render uses the branch as is, so rebase on `main` first.

```sh
gh workflow run visual-baselines.yml --ref <branch>
rm -r tests/visual/__screenshots__
gh run download <run-id> --name visual-baselines --dir tests/visual/__screenshots__
```

Commit only the `.png` files, especially from a fork's run. Adding an enum value reshuffles that component's pairwise cases, so expect many of its images to change. When several pull requests touch visuals, rebase and rerun the visual job just before merging. If a combination cannot look right, remove it from the catalog rather than from the matrix.
