# Radiant

Use PascalCase for component names and component filenames: `Button` in
`Button.tsx`. Match that casing in colocated stories and tests:
`Button.stories.tsx` and `Button.test.tsx`. Update imports and public
exports to match the filename exactly, including case.

Style components with Tailwind utilities. Keep complete class names in source
so Tailwind can detect them. Define semantic tokens in `src/styles.css` and
use their utilities in components. Storybook's stylesheet imports Tailwind and
that source entry. Ordinary consumers import the compiled
`@cognitap/radiant/styles.css`; the reset is a separate opt-in export.
Tailwind consumers import `@cognitap/radiant/tailwind.css` alongside their own
Tailwind entry, generating component utilities once in the application build.

Write hover, active, and disabled utilities with those prefixes (`hover:`,
`active:`, `disabled:`). Matching prefixes let a caller `className` replace
them, and `disabled:` wins over `hover:` and `active:` in the cascade.

Register each new non-color token in `src/cn.ts` under its utility group.
`rounded-control` is registered on `rounded` so `rounded-full` replaces it.
Color utilities already share a conflict group.
