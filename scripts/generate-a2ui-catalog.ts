import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { format } from 'oxfmt'
import { radiantA2uiRegistry } from '../dist/library/a2ui/index.js'

const destination = new URL('../src/a2ui/catalog.json', import.meta.url)
const check = process.argv.includes('--check')

const document = radiantA2uiRegistry.toCatalogJson()
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
