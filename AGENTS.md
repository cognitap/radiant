# Radiant

Before changing public props, themes, named parts, or composition examples, read [docs/architecture.md](docs/architecture.md) for the shared contract and canonical sources.

## Structure and styling

Each component lives in `src/components/<Family>/<Family>.tsx` with its stories in `<Family>.stories.tsx`. Single-component helpers stay in that folder; styles shared across families live in `src/components/shared/`. Match imports and exports to the exact filename case.

Style components with complete Tailwind utility names in source. Shared tokens live in `src/themes/tokens.ts` and component overrides in `src/themes/components.ts`; `pnpm theme:generate` generates `src/themes/baseline.css`. Consumers import compiled `@cognitap/radiant/styles.css` (plus optional `reset.css`) or source `@cognitap/radiant/tailwind.css`.

Use `hover:`, `active:`, and `disabled:` prefixes so caller `className` utilities override them cleanly. Give token utilities for sizes, widths, styles, and font families a type hint, such as `text-[length:var(--rad-x)]`; Tailwind reads an unhinted `text-(--rad-x)` as a color.

## Component conventions

- **State:** Use `x`, `defaultX`, and `onXChange(x)` (passing the next value only) typed with `ValueOwner`, `CheckedOwner`, or `StateOwner` from `src/react/useNativeOwner.ts`. Booleans use `open`, `checked`, or `pressed`; native inputs keep `onChange`. Selection mode is `type: 'single' | 'multiple'` (`string | null` vs. `string[]`).
- **Forms:** Put `name`, `form`, `required`, `disabled`, and `aria-invalid` on the root and forward them to the focus/form host. Expose `readOnly` only when enforced at runtime. `error` is a validation message; status messages end in `Text` (`loadingText`, `emptyText`, `errorText`). Option groups build on `Field` and take `label` (`legend` is `Fieldset` only). Take `items` only when all options are needed up front.
- **Props and parts:** Use `variant`, `tone`, and `controlSize` (`'small' | 'medium' | 'large'`). Every `parts` entry is a `PartStyle` (`wrapper`, `label`, `description`, `error`, `indicator`, `options`, `remove`). Sub-parts are named exports (no `as` or `asChild`). Button and anchor hosts accept `render(props)` and export `<Family>RenderProps`. Popup triggers and dialog actions omit `pressed`.
- **Accessible names:** Hosts without visible text require `AccessibleName` and `requireAccessibleName` with no English fallback. Visible labels use `label: ReactNode`; internal control labels end in `Label` (`removeLabel`, `nextLabel`); replacement announcement text uses `altText`.
- **Stories:** Start with `Default`, then `WithField`, `SharedControlSizes`, and `Controlled` where applicable. Never set a theme, mode, or canvas in a story; use `#fragment` links, keep radio/form names isolated, fit both Canvas and Docs widths, and never mount modal `<dialog>` elements open.

## Documentation

Keep each fact in one place and rewrite existing text when behavior changes. Do not include ticket IDs, dates, disclaimers, or test counts in the repo. `pnpm docs:check` enforces the word budgets in `docs-policy.json`; cut text rather than raising budgets.

- Component guides (`Usage`, `Examples`, `State`, `Accessibility`, `Motion`, `Styling`, `API`): `cognitap/radiant-docs`.
- Cross-family architecture and rules: `docs/architecture.md`.
- Themes: `docs/theming.md`. Motion: `docs/motion.md`. Accessibility checks: `docs/accessibility.md`.
- Setup and commands: `CONTRIBUTING.md`.
- `CHANGELOG.md`: one line per user-visible change under `## Unreleased` (with before/after for breaking changes).

## Releases

Follow [RELEASE_POLICY.md](RELEASE_POLICY.md):

1. Open PR `Release Radiant <version>`: run `pnpm version patch --no-git-tag-version`, move Unreleased notes under `## <version>`, commit, and run `pnpm release:prepare`.
2. Squash-merge after CI passes, then run the **Release Radiant** workflow on `main` with `publish`.
3. Verify `pnpm view @cognitap/radiant@<version> dist.integrity` matches `release.json` (never rerun `publish` for an existing version).
4. Create GitHub release `v<version>` titled `Radiant <version>` at `sourceCommit`, then bump `@cognitap/radiant` and the releases page in `cognitap/radiant-docs`.
