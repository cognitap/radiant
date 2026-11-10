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

| Command                | Purpose                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `pnpm watch`           | Rebuild on change, except `reset.css`. Run `pnpm build` first.                                                            |
| `pnpm test`            | Build, run `tests/*.test.mjs`, and run `pnpm test:package`.                                                               |
| `pnpm test:package`    | Pack the tarball, install it in a temporary directory, and run `tests/package/`.                                          |
| `pnpm test:browser`    | Run every story in every theme and mode with axe, plus `tests/browser/*.test.tsx`. Writes artifacts to `output/browser/`. |
| `pnpm check:library`   | Check generated theme CSS, formatting, lint, types and docs budgets, then build and run the Node and package tests.       |
| `pnpm check:storybook` | Build Storybook and run every story in the Radiant theme, light and dark.                                                 |

CI runs three jobs: `pnpm check:library`, `pnpm check:storybook`, and `pnpm test:browser --project=browser-platform`. `pnpm check` runs the first two.

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
