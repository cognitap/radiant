# Radiant

Before changing public props, themes, named parts or composition examples, read
[the architecture doc](docs/architecture.md) for the shared contract and canonical sources.

Use PascalCase for component names and component filenames: `Button` in
`Button.tsx`. Match that casing in colocated stories and tests:
`Button.stories.tsx` and `Button.test.tsx`. Update imports and public
exports to match the filename exactly, including case.

Style components with Tailwind utilities. Keep complete class names in source
so Tailwind can detect them. Define shared token roles in `src/themes/tokens.ts`
and component overrides in `src/themes/components.ts`; `pnpm theme:generate`
maintains the generated baseline CSS. Storybook's stylesheet imports Tailwind
and the `src/styles.css` source entry. Ordinary consumers import the compiled
`@cognitap/radiant/styles.css`; the reset is a separate opt-in export.
Tailwind consumers import `@cognitap/radiant/tailwind.css` alongside their own
Tailwind entry, generating component utilities once in the application build.

Write hover, active, and disabled utilities with those prefixes (`hover:`,
`active:`, `disabled:`). Matching prefixes let a caller `className` replace
them, and `disabled:` wins over `hover:` and `active:` in the cascade.

Register each new non-color token in `src/cn.ts` under its utility group.
Color utilities already share a conflict group.

## Documentation

Write for someone new to Radiant. Keep each fact in one place and link to it.
When behavior changes, rewrite the existing text; do not append. Use short,
plain sentences without ticket IDs, dates or disclaimers. Verification
evidence, research and test counts go in the pull request, never the repo.

`pnpm docs:check` enforces the word budgets in `docs-policy.json`. When a file
is over budget, cut text. Never raise a budget or add a `legacy` entry.

Where things go:

- Component props and behavior: that component's page on the docs site
  (cognitap/radiant-docs), not this repo.
- Design decisions and cross-family rules: `docs/architecture.md`.
- Themes and tokens: `docs/theming.md`. Motion: `docs/motion.md`.
- Setup and commands: `CONTRIBUTING.md` and `docs/testing.md`.
- `README.md` stays a short introduction.
- `CHANGELOG.md`: one line per user-visible change under Unreleased. Give a
  breaking change a short before and after. Leave out tests, CI and refactors.

## Releases

Follow [the release policy](RELEASE_POLICY.md) for versions and the workflow.
Every release takes the same steps, in order:

1. Open a pull request named `Release Radiant <version>`. Run
   `pnpm version patch --no-git-tag-version`, move the Unreleased notes under
   `## <version>` and leave an empty Unreleased heading above it. Run
   `pnpm release:prepare` after committing; it needs a clean checkout.
2. Squash-merge once CI passes.
3. Run the **Release Radiant** workflow on `main` with `publish` selected.
4. Confirm the release: `pnpm view @cognitap/radiant@<version> dist.integrity`
   must match `integrity` in the workflow's `release.json` artifact. If the
   publish step passed but the integrity step failed, npm was still catching
   up; check again before doing anything else. Never rerun publish for a
   version npm already has.
5. Create the GitHub release `v<version>`, titled `Radiant <version>`, at the
   `sourceCommit` in `release.json`. Open with "Experimental 0.x release.", list
   the changelog lines, link the npm version page and name the source commit.
6. Bump `@cognitap/radiant` in cognitap/radiant-docs: `package.json`, the
   `minimumReleaseAgeExclude` entry in `pnpm-workspace.yaml` and the lockfile.
   Rewrite its releases page for the new version.

The npmjs.com package page can show the previous version for a while after
publishing. The registry, `pnpm view` and installs are what count.
