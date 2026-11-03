# Testing

## Commands

| Command                | What it runs                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`           | `check:library` and `check:storybook`                                                                                |
| `pnpm check:library`   | Theme CSS check, `oxfmt`, `oxlint`, build, `tsc --noEmit`, `docs:check`, `tests/*.test.mjs`, and `pnpm test:package` |
| `pnpm check:storybook` | Storybook build plus browser tests in Radiant light and dark                                                         |
| `pnpm test`            | Build, Node tests in `tests/*.test.mjs`, and `pnpm test:package`                                                     |
| `pnpm test:browser`    | Vitest browser suite: every story across all presets (light and dark) with axe, plus `tests/browser/*.test.tsx`      |
| `pnpm test:package`    | Packs the tarball, installs it into a temp directory, and runs `tests/package/` against `@cognitap/radiant`          |

## Browser tests

Install Playwright Chromium once (`pnpm exec playwright install chromium`), then run `pnpm test:browser`. No running Storybook server is required.

To run a single project or file:

```sh
pnpm test:browser --project=storybook-glass-dark src/components/Checkbox/Checkbox.stories.tsx
pnpm test:browser --project=browser-platform -t StrictMode
```

Failures write JUnit XML and screenshots to `output/browser/`.

## Where a test belongs

- **Component story (`src/components/<Family>/<Family>.stories.tsx`):** rendering and axe across themes and modes. Keep interaction `play` functions short; do not duplicate full keyboard or state-machine suites across every theme preset.
- **`tests/browser/*.test.tsx`:** interactive browser behavior (keyboard navigation, form submission and reset, focus management, motion, refs, StrictMode, hydration). Wrap state updates in `act` and clean up mounted roots.
- **`tests/*.test.mjs`:** fast Node checks over source files, pure helpers, SSR output, and architecture invariants.
- **`tests/package/package.test.ts`:** public exports, compiled CSS, TypeScript `NodeNext` and `Bundler` resolution, and token contrast across all exported themes. Imports must use `@cognitap/radiant`, never `src/` or `dist/`.

Manual visual, zoom, and screen-reader checks are covered in [storybook](storybook.md#verification) and [accessibility](accessibility.md).
