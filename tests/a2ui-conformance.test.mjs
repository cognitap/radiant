import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_BASIC_CATALOG_REVISION,
  coerceA2uiMessages,
  radiantA2uiRegistry,
  validateA2uiAccessibility
} from '../dist/library/a2ui/index.js'
import {
  A2UI_BASIC_CATALOG_COMPONENTS,
  A2UI_CONFORMANCE_FIXTURE_FILES,
  a2uiConformanceFixtures,
  finalA2uiSurface
} from '../dist/library/a2ui/conformance.js'

const root = new URL('../', import.meta.url)
const webCore = new URL('node_modules/@a2ui/web_core/', root)
const specCatalogFile = new URL('src/v1_0/schemas/catalogs/basic/catalog.json', webCore)
const spec = JSON.parse(readFileSync(specCatalogFile, 'utf8'))
// Fixture files the suite deliberately leaves out, with the reason beside each.
const excludedFixtureFiles = new Set([])
const stories = readFileSync(new URL('src/a2ui/A2uiConformance.stories.tsx', root), 'utf8')

function specRequired(name) {
  const schema = spec.components[name] ?? {}
  return [schema, ...(schema.allOf ?? [])].flatMap(part => part.required ?? [])
}

test('the basic catalog revision pin matches the installed @a2ui/web_core', () => {
  const installed = JSON.parse(readFileSync(new URL('package.json', webCore), 'utf8')).version
  const declared = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')).dependencies[
    '@a2ui/web_core'
  ]
  const pin = A2UI_BASIC_CATALOG_REVISION
  const bump = 'Rerun the A2UI conformance stories, then update A2UI_BASIC_CATALOG_REVISION.'
  assert.equal(declared, pin.webCore, `@a2ui/web_core is ${declared}. ${bump}`)
  assert.equal(installed, pin.webCore, `Installed @a2ui/web_core is ${installed}. ${bump}`)
  const generated = JSON.parse(readFileSync(new URL('src/a2ui/catalog.json', root), 'utf8'))
  assert.ok(generated.description.endsWith(`tested against @a2ui/web_core ${pin.webCore}.`))
  const digest = createHash('sha256').update(readFileSync(specCatalogFile)).digest('hex')
  assert.equal(digest, pin.catalogSha256, `The specification basic catalog changed. ${bump}`)
})

test('Radiant serves the official basic catalog id and every specification component', () => {
  assert.equal(A2UI_BASIC_CATALOG_ID, spec.catalogId)
  assert.equal(radiantA2uiRegistry.catalogId, spec.catalogId)
  assert.deepEqual([...A2UI_BASIC_CATALOG_COMPONENTS].sort(), Object.keys(spec.components).sort())
  for (const name of A2UI_BASIC_CATALOG_COMPONENTS) {
    assert.ok(radiantA2uiRegistry.entries[name], `${name} has no registry entry`)
  }
})

test('the suite reads every A2UI fixture file', () => {
  const files = readdirSync(new URL('src/a2ui/', root)).filter(
    file => /^(\w+F|f)ixtures\.tsx?$/.test(file) && !excludedFixtureFiles.has(file)
  )
  assert.deepEqual(files.sort(), [...A2UI_CONFORMANCE_FIXTURE_FILES].sort())
})

test('every basic catalog component renders in at least one accessible fixture', () => {
  const covered = new Set(
    a2uiConformanceFixtures
      .filter(fixture => fixture.gate === 'accessible')
      .flatMap(fixture => fixture.components)
  )
  const missing = A2UI_BASIC_CATALOG_COMPONENTS.filter(name => !covered.has(name))
  assert.deepEqual(missing, [], `Add an accessible A2UI fixture for: ${missing.join(', ')}`)
})

test('every conformance fixture has its own conformance story', () => {
  const named = [...stories.matchAll(/fixture: '(\w+)'/g)].map(match => match[1])
  assert.deepEqual(
    [...named].sort(),
    a2uiConformanceFixtures.map(fixture => fixture.name).sort(),
    'A2uiConformance.stories.tsx needs exactly one story per fixture'
  )
})

test('accessible fixtures validate without errors or fallbacks; exempt fixtures earn their exemption', () => {
  for (const fixture of a2uiConformanceFixtures) {
    const { errors } = validateA2uiAccessibility(fixture.messages)
    const failures = coerceA2uiMessages(fixture.messages, radiantA2uiRegistry).diagnostics.filter(
      diagnostic => diagnostic.kind === 'error' || diagnostic.kind === 'fallback'
    )
    const label = `${fixture.name} (${fixture.gate})`
    if (fixture.gate === 'accessible') {
      assert.deepEqual(errors, [], `${label} fails validateA2uiAccessibility`)
      assert.deepEqual(failures, [], `${label} reports errors or fallbacks`)
      // Streams may default props mid-way; the final surface may not default a required one.
      const { components, dataModel } = finalA2uiSurface(fixture.messages)
      const final = [
        {
          version: fixture.messages[0].version,
          createSurface: {
            surfaceId: fixture.surfaceId,
            catalogId: A2UI_BASIC_CATALOG_ID,
            dataModel,
            components: [...components.values()]
          }
        }
      ]
      const defaulted = coerceA2uiMessages(final, radiantA2uiRegistry).diagnostics.filter(
        diagnostic =>
          diagnostic.kind === 'defaulted' &&
          specRequired(diagnostic.component).includes(diagnostic.prop)
      )
      assert.deepEqual(defaulted, [], `${label} defaults required props in its final state`)
    } else if (fixture.gate === 'inaccessible') {
      assert.ok(errors.length > 0, `${label} passes validateA2uiAccessibility; drop its exemption`)
    } else {
      assert.ok(failures.length > 0, `${label} has no errors or fallbacks; drop its exemption`)
    }
  }
})
