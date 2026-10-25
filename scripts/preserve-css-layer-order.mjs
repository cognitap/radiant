import { readFileSync, writeFileSync } from 'node:fs'

// Tailwind removes empty layers during optimization. Keep their complete order
// ahead of consumer bundlers that hoist the remaining standalone statements.
const order = '@layer properties, theme, base, components, utilities;\n'
for (const name of ['styles.css', 'reset.css']) {
  const file = new URL(`../dist/library/${name}`, import.meta.url)
  const css = readFileSync(file, 'utf8')
  if (!css.startsWith(order)) writeFileSync(file, order + css)
}
