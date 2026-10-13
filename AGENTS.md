# Radiant

Use PascalCase for component names and component filenames: `Button` in
`Button.tsx`. Match that casing in colocated stories and tests:
`Button.stories.tsx` and `Button.test.tsx`. Update imports and public
exports to match the filename exactly, including case.

Style components with Tailwind utilities. Keep complete class names in source
so Tailwind can detect them. Define semantic tokens in `src/styles.css` and
use their utilities in components. Storybook imports that file directly;
consuming applications import `@cognitap/radiant/styles.css`.

Write hover, active, and disabled utilities with those prefixes (`hover:`,
`active:`, `disabled:`). Matching prefixes let a caller `className` replace
them, and `disabled:` wins over `hover:` and `active:` in the cascade.

Register each new non-color token in `src/cn.ts` under its utility group.
`rounded-control` is registered on `rounded` so `rounded-full` replaces it.
Color utilities already share a conflict group.
