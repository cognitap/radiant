import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { format } from 'oxfmt'
import { radiantA2uiRegistry } from '../dist/library/a2ui/index.js'
import { radiantCatalog } from '../dist/library/catalog/index.js'
import {
  A2UI_GENERATED_COMPONENT_NAMES,
  findA2uiDescriptionViolations,
  generateA2uiCatalogs
} from '../dist/library/a2ui/catalogGenerator.js'

const destination = new URL('../src/a2ui/catalog.json', import.meta.url)
const check = process.argv.includes('--check')

// Each registry entry must carry the description generated for its own A2UI projection.
const generated = generateA2uiCatalogs(radiantCatalog)
const drifted = Object.values(radiantA2uiRegistry.entries)
  .filter(entry => {
    const source =
      generated.basic.components[entry.name] ?? generated.extension.components[entry.name]
    return entry.description !== source?.description
  })
  .map(entry => entry.name)
if (drifted.length) {
  throw new Error(
    `A2UI registry descriptions must come from the generated catalog (basicDescription): ${drifted.join(', ')}.`
  )
}

const document = radiantA2uiRegistry.toCatalogJson()
const violations = findA2uiDescriptionViolations(
  document.components,
  new Set(Object.keys(document.components)),
  new Set([...Object.keys(radiantCatalog.entries), ...A2UI_GENERATED_COMPONENT_NAMES])
)
if (violations.length) {
  throw new Error(
    `A2UI catalog descriptions do not fit the registry:\n- ${violations.join('\n- ')}`
  )
}
const raw = `${JSON.stringify(document, null, 2)}\n`
const { code, errors } = await format(fileURLToPath(destination), raw, {
  printWidth: 100,
  tabWidth: 2
})
if (errors.length) {
  throw new Error(`Cannot format generated A2UI catalog JSON: ${JSON.stringify(errors)}`)
}

const current = await readFile(destination, 'utf8').catch(error => {
  if (error.code === 'ENOENT') return ''
  throw error
})

if (current !== code) {
  if (check) {
    throw new Error('A2UI catalog JSON is stale. Run pnpm catalog:generate.')
  }
  await writeFile(destination, code)
}
