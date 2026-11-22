import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const root = fileURLToPath(new URL('../', import.meta.url))

/** Every source module the A2UI renderer reaches: the families behind catalog entries. */
function catalogModules() {
  const seen = new Set()
  const pending = [resolve(root, 'src/a2ui/index.ts')]
  while (pending.length) {
    const file = pending.pop()
    if (seen.has(file)) continue
    seen.add(file)
    const text = readFileSync(file, 'utf8')
    for (const [, specifier] of text.matchAll(/(?:from|import)\s+'(\.[^']+)'/g)) {
      const base = resolve(dirname(file), specifier).replace(/\.js$/, '')
      const target = [`${base}.ts`, `${base}.tsx`].find(existsSync)
      if (target) pending.push(target)
    }
  }
  return [...seen]
}

// Viewport breakpoint variants such as `sm:`, `max-md:` or `min-[40rem]:`; container variants
// start with `@` and stay allowed.
const viewportVariant = /(?<![\w@/[-])(?:max-)?(?:sm|md|lg|xl|2xl):(?=[\w[!-])/g
const minMaxVariant = /(?<![\w@/[-])(?:min|max)-\[[^\]\s]+\]:/g
const widthMediaQuery = /@media[^{'"`]*width/g

test('catalog families respond to their container, not the viewport', () => {
  const modules = catalogModules()
  assert.ok(
    modules.some(file => file.endsWith('src/components/Stage/Stage.tsx')),
    'the module walk should reach the catalog families'
  )
  const violations = []
  for (const file of modules) {
    const text = readFileSync(file, 'utf8')
    for (const pattern of [viewportVariant, minMaxVariant, widthMediaQuery]) {
      for (const match of text.matchAll(pattern)) {
        const line = text.slice(0, match.index).split('\n').length
        violations.push(`${relative(root, file)}:${line} ${match[0]}`)
      }
    }
  }
  assert.deepEqual(violations, [])
})
