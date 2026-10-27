# Radiant

Before changing public props, themes, named parts or composition examples, read
[the system guide](docs/system.md) for the shared contract and canonical sources.

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

Write for a person reading Radiant for the first time. Each fact lives in one
place; link to it instead of restating it.

- `README.md`: what Radiant is, install, one example, links.
- `docs/`: guides and reference for using or maintaining Radiant.
- `CHANGELOG.md`: one line per user-visible change.
- The documentation site (`radiant-docs`): per-component usage and examples.
- Pull request description: verification evidence, test counts, environment
  details, research notes and anything else about how the work was done.

When behavior changes, edit the existing text so it describes the current
state. Delete what is no longer true. Do not append a section per change.

Use short, plain sentences. Say what something does and why. Leave out ticket
IDs, dates, commit hashes and disclaimers about what was not tested.

`pnpm docs:check` enforces word budgets, the ban on ticket IDs, and the ban on
`docs/verification/` and `docs/research/`. Rules and budgets live in
`docs-policy.json`. Its baseline lists older files that break the rules. Those
files may shrink but not grow. Never add entries to the baseline or raise a
budget to pass the check: cut the text. After fixing a file, run
`node scripts/check-docs.mjs --prune`.
