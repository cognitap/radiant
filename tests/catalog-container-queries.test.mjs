import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
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

/** Component source outside the catalog walk, such as Cascader. Stories are examples. */
function componentModules() {
  return readdirSync(resolve(root, 'src/components'), { recursive: true })
    .filter(file => /\.tsx?$/.test(file) && !file.endsWith('.stories.tsx'))
    .map(file => resolve(root, 'src/components', file))
}

// Files that still use viewport variants; the self-check below fails once a listed file no longer
// needs its exclusion.
const knownExclusions = []

// Viewport breakpoint variants such as `sm:`, `max-md:` or `min-[40rem]:`; container variants
// start with `@` and stay allowed.
const viewportVariant = /(?<![\w@/[-])(?:max-)?(?:sm|md|lg|xl|2xl):(?=[\w[!-])/g
const minMaxVariant = /(?<![\w@/[-])(?:min|max)-\[[^\]\s]+\]:/g
const widthMediaQuery = /@media[^{'"`]*width/g

test('component families respond to their container, not the viewport', () => {
  const modules = [...new Set([...catalogModules(), ...componentModules()])]
  assert.ok(
    modules.some(file => file.endsWith('src/components/Stage/Stage.tsx')),
    'the module walk should reach the catalog families'
  )
  assert.ok(modules.some(file => file.endsWith('src/components/Cascader/CascaderColumn.tsx')))
  const violations = []
  const excluded = new Set()
  for (const file of modules) {
    const path = relative(root, file).split(sep).join('/')
    const text = readFileSync(file, 'utf8')
    for (const pattern of [viewportVariant, minMaxVariant, widthMediaQuery]) {
      for (const match of text.matchAll(pattern)) {
        if (knownExclusions.includes(path)) {
          excluded.add(path)
          continue
        }
        const line = text.slice(0, match.index).split('\n').length
        violations.push(`${path}:${line} ${match[0]}`)
      }
    }
  }
  assert.deepEqual(violations, [])
  assert.deepEqual(
    knownExclusions.filter(path => !excluded.has(path)),
    [],
    'remove exclusions for files that no longer use viewport variants'
  )
})
