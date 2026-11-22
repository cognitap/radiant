import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import ts from 'typescript'
import {
  CATALOG_GUIDANCE_TOKEN_BUDGET,
  CATALOG_SPACING,
  CHOICE_PRESENTATIONS,
  assertValidCatalog,
  describeCatalogEntry,
  estimateCatalogTokens,
  renderCatalogGuidance,
  renderCatalogInstructions,
  coerceSchemaProps,
  createCatalogActionEvent,
  defineCatalog,
  extendCatalog,
  findForbiddenPropsInSchema,
  isForbiddenCatalogProp,
  radiantCatalog,
  snapshotSurfaceState,
  validateCatalog,
  validateCatalogEntry
} from '../dist/library/catalog/index.js'
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_GENERATED_COMPONENT_NAMES,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  findA2uiDescriptionViolations,
  generateA2uiCatalogs
} from '../dist/library/a2ui/catalogGenerator.js'
import {
  CATALOG_TONE_MEANINGS,
  CATALOG_VARIANT_MEANINGS
} from '../dist/library/catalog/guidance.js'

const catalogSourceDir = fileURLToPath(new URL('../src/catalog/', import.meta.url))

test('canonical catalog source has zero host, React, DOM, or protocol imports', () => {
  const files = readdirSync(catalogSourceDir, { recursive: true }).filter(file =>
    file.endsWith('.ts')
  )
  assert.ok(files.length > 0)
  for (const relative of files) {
    const filename = resolve(catalogSourceDir, relative)
    const sourceFile = ts.createSourceFile(
      filename,
      readFileSync(filename, 'utf8'),
      ts.ScriptTarget.Latest,
      true
    )
    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue
      const specifier = statement.moduleSpecifier
      if (!specifier || !ts.isStringLiteral(specifier)) continue
      assert.ok(
        specifier.text.startsWith('./'),
        `${relative} must stay self-contained; found import "${specifier.text}"`
      )
    }
  }
})

test('radiantCatalog passes contract validation, is deeply frozen, and uses intent vocabulary', () => {
  assert.deepEqual(validateCatalog(radiantCatalog), [])
  assert.doesNotThrow(() => assertValidCatalog(radiantCatalog))
  assert.equal(Object.isFrozen(radiantCatalog), true)
  assert.equal(Object.isFrozen(radiantCatalog.entries), true)
  assert.equal(Object.isFrozen(radiantCatalog.entries.Choice.propsSchema.properties), true)
  assert.deepEqual(JSON.parse(JSON.stringify(radiantCatalog)), radiantCatalog)

  // Intent-oriented Choice entry with curated presentations instead of 11 Select parts
  const choice = radiantCatalog.entries.Choice
  assert.deepEqual(choice.propsSchema.properties.presentation.enum, CHOICE_PRESENTATIONS)
  assert.deepEqual(choice.propsSchema.properties.presentation.enum, [
    'list',
    'segmented',
    'chips',
    'cards',
    'dropdown'
  ])
  assert.equal(choice.bindings.value.direction, 'two-way')
  assert.equal(choice.bindings.value.validatable, true)

  // Semantic spacing scale rather than pixel widths or utility classes
  assert.deepEqual(radiantCatalog.entries.Row.propsSchema.properties.gap.enum, CATALOG_SPACING)
  assert.deepEqual(radiantCatalog.entries.Column.propsSchema.properties.gap.enum, [
    'tight',
    'normal',
    'airy'
  ])
  assert.deepEqual(radiantCatalog.entries.Card.propsSchema.properties.padding.enum, CATALOG_SPACING)
})

test('every entry in radiantCatalog has zero forbidden props in props, slots, bindings, or actions', () => {
  for (const [name, entry] of Object.entries(radiantCatalog.entries)) {
    assert.deepEqual(
      findForbiddenPropsInSchema(entry.propsSchema, `${name}.props`),
      [],
      `${name} leaked a forbidden prop`
    )
    for (const bindingName of Object.keys(entry.bindings)) {
      assert.equal(isForbiddenCatalogProp(bindingName), false, `${name}.bindings.${bindingName}`)
    }
    for (const [slotName, slot] of Object.entries(entry.slots)) {
      for (const childProp of Object.keys(slot.childProps ?? {})) {
        assert.equal(
          isForbiddenCatalogProp(childProp),
          false,
          `${name}.slots.${slotName}.childProps.${childProp}`
        )
      }
    }
  }
})

test('validation rejects entries exposing className, style, render, DOM handlers, or ARIA props', () => {
  const forbiddenNames = [
    'className',
    'class',
    'style',
    'render',
    'as',
    'asChild',
    'ref',
    'parts',
    'role',
    'tabIndex',
    'aria-label',
    'aria-describedby',
    'aria-invalid',
    'ariaLabel',
    'ariaHidden',
    'data-slot',
    'onClick',
    'onclick',
    'onkeydown',
    'dangerouslySetInnerHTML'
  ]

  for (const propName of forbiddenNames) {
    assert.equal(isForbiddenCatalogProp(propName), true, `Expected "${propName}" to be forbidden`)
    const badEntry = {
      name: 'LeakyWidget',
      category: 'content',
      description: 'Should be rejected.',
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          [propName]: { type: 'string' }
        }
      },
      slots: {},
      bindings: {},
      actions: {}
    }
    const violations = validateCatalogEntry(badEntry, 'LeakyWidget')
    assert.ok(
      violations.some(message => message.includes(propName) && message.includes('forbidden')),
      `Expected violation for "${propName}", got: ${violations.join('; ')}`
    )
    assert.throws(
      () =>
        defineCatalog({
          id: 'bad/catalog',
          version: '1.0.0',
          description: 'Invalid catalog.',
          entries: { LeakyWidget: badEntry }
        }),
      TypeError
    )
  }

  // Also catches forbidden props nested inside object properties, arrays, or slot childProps
  const nestedViolations = validateCatalogEntry(
    {
      name: 'NestedLeak',
      category: 'layout',
      description: 'Leaks nested styling and ARIA props.',
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                title: { type: 'string' },
                style: { type: 'object' }
              }
            }
          }
        }
      },
      slots: {
        children: {
          description: 'Child nodes.',
          cardinality: 'many',
          childProps: {
            'aria-label': { type: 'string' }
          }
        }
      },
      bindings: {},
      actions: {}
    },
    'NestedLeak'
  )
  assert.ok(nestedViolations.some(message => message.includes('items[].style')))
  assert.ok(nestedViolations.some(message => message.includes('childProps.aria-label')))
})

test('extendCatalog adds custom entries cleanly and forbids shadowing base entries', () => {
  const extended = extendCatalog(radiantCatalog, {
    id: 'example/custom',
    version: '1.0.0',
    description: 'Custom application catalog.',
    entries: {
      Sparkline: {
        name: 'Sparkline',
        category: 'data',
        description: 'Compact inline trend line.',
        guidance: {
          whenToUse: 'A trend beside a metric.',
          whenNotToUse: 'Exact values (Table).',
          examples: ['weekly signups', 'error rate']
        },
        propsSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['label', 'values'],
          properties: {
            label: { type: 'string', minLength: 1 },
            values: { type: 'array', minItems: 2, items: { type: 'number' } },
            tone: { type: 'string', enum: ['accent', 'neutral', 'warning', 'danger'] }
          }
        },
        slots: {},
        bindings: {},
        actions: {}
      }
    }
  })

  assert.equal(extended.extends, radiantCatalog.id)
  assert.ok('Sparkline' in extended.entries)
  assert.ok('Choice' in extended.entries)
  assert.equal('Sparkline' in radiantCatalog.entries, false)
  assert.equal(Object.isFrozen(extended), true)

  assert.throws(
    () =>
      extendCatalog(radiantCatalog, {
        id: 'example/shadow',
        version: '1.0.0',
        entries: {
          Button: {
            name: 'Button',
            category: 'action',
            description: 'Shadow attempt.',
            propsSchema: {
              type: 'object',
              additionalProperties: false,
              properties: { label: { type: 'string' } }
            },
            slots: {},
            bindings: {},
            actions: {}
          }
        }
      }),
    /cannot shadow base entries: Button/
  )
})

// Copy of google/A2UI catalogs/basic/v1/catalog.json (Apache-2.0).
const officialBasicCatalog = JSON.parse(
  readFileSync(new URL('./fixtures/a2ui/basic-catalog-v1_0.json', import.meta.url), 'utf8')
)

// Descriptions are prose, and enum and required order carry no meaning.
function wireShape(value, key) {
  if (Array.isArray(value)) {
    const items = value.map(item => wireShape(item))
    return key === 'enum' || key === 'required' ? items.sort() : items
  }
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([name]) => name !== 'description')
      .map(([name, nested]) => [name, wireShape(nested, name)])
  )
}

const wireProps = schema => (schema.allOf ? schema.allOf.at(-1) : schema).properties

const customEntry = name => ({
  name,
  category: 'data',
  description: 'Custom application entry.',
  guidance: {
    whenToUse: 'Custom data.',
    whenNotToUse: 'Built-in data.',
    examples: ['first', 'second']
  },
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['label'],
    properties: { label: { type: 'string' } }
  },
  slots: {},
  bindings: {},
  actions: {}
})

test('generated A2UI basic catalog matches the A2UI 1.0 specification', () => {
  const { basic } = generateA2uiCatalogs(radiantCatalog)

  assert.equal(basic.catalogId, officialBasicCatalog.catalogId)
  assert.equal(basic.$id, officialBasicCatalog.$id)
  assert.equal(basic.protocolVersion, officialBasicCatalog.protocolVersion)
  assert.deepEqual(
    Object.keys(basic.components).sort(),
    Object.keys(officialBasicCatalog.components).sort()
  )
  for (const [name, official] of Object.entries(officialBasicCatalog.components)) {
    assert.deepEqual(
      wireShape(basic.components[name]),
      wireShape(official),
      `${name} differs from the A2UI basic catalog`
    )
  }
  assert.deepEqual(wireShape(basic.$defs.Weight), wireShape(officialBasicCatalog.$defs.Weight))
  assert.deepEqual(
    wireShape(basic.$defs.anyComponent.oneOf)
      .map(ref => ref.$ref)
      .sort(),
    officialBasicCatalog.$defs.anyComponent.oneOf.map(ref => ref.$ref).sort()
  )
})

test('A2UI catalogs are generated deterministically and stay free of forbidden props', () => {
  const first = generateA2uiCatalogs(radiantCatalog)
  assert.deepEqual(first, generateA2uiCatalogs(radiantCatalog))

  assert.equal(first.basic.catalogId, A2UI_BASIC_CATALOG_ID)
  assert.equal(first.extension.catalogId, RADIANT_A2UI_EXTENSION_CATALOG_ID)
  for (const doc of [first.basic, first.extension]) {
    assert.equal('extends' in doc, false)
    assert.ok(doc.$defs.anyComponent && doc.$defs.anyFunction)
    for (const [componentName, schema] of Object.entries(doc.components)) {
      assert.equal(
        wireProps(schema).id,
        undefined,
        `${componentName} must leave id to the envelope`
      )
      assert.deepEqual(
        findForbiddenPropsInSchema({ properties: wireProps(schema) }, componentName),
        [],
        `Generated A2UI component ${componentName} leaked a forbidden prop`
      )
    }
  }

  assert.deepEqual(Object.keys(first.extension.components).sort(), [
    'Accordion',
    'Alert',
    'Badge',
    'Combobox',
    'Compare',
    'CompareItem',
    'Grid',
    'Progress',
    'RadioGroup',
    'Reveal',
    'Row',
    'Select',
    'Split',
    'Stage',
    'Switch',
    'Table',
    'Textarea',
    'Toast'
  ])
  const ext = first.extension.components
  assert.equal(wireProps(ext.Select).presentation, undefined)
  assert.equal(wireProps(ext.Textarea).kind, undefined)
  assert.ok(wireProps(ext.Textarea).rows)
  assert.equal(wireProps(ext.Table).rows.$ref, 'common_types.json#/$defs/ChildList')
  assert.equal(ext.Switch.allOf[0].$ref, 'common_types.json#/$defs/Checkable')
  assert.equal(wireProps(ext.Switch).controlSize.default, 'medium')
  for (const name of ['Select', 'Combobox']) {
    const props = wireProps(ext[name])
    assert.equal(props.options, undefined)
    assert.deepEqual(
      props.items.anyOf.slice(1).map(branch => branch.$ref),
      ['common_types.json#/$defs/DataBinding', 'common_types.json#/$defs/FunctionCall']
    )
    assert.equal(props.items.anyOf[0].items.properties.description, undefined)
    assert.ok(ext[name].allOf[1].required.includes('items'))
  }
  assert.ok(wireProps(ext.RadioGroup).options.items.properties.description)
})

test('A2UI projection keeps the constraints of props that are also bindable', () => {
  const { extension, basic } = generateA2uiCatalogs(radiantCatalog)
  const progressValue = wireProps(extension.components.Progress).value
  assert.deepEqual(progressValue.anyOf[0], { type: ['number', 'null'], minimum: 0 })
  assert.deepEqual(
    progressValue.anyOf.slice(1).map(branch => branch.$ref),
    ['common_types.json#/$defs/DataBinding', 'common_types.json#/$defs/FunctionCall']
  )
  assert.deepEqual(wireProps(extension.components.Alert).title.anyOf[0], {
    type: 'string',
    minLength: 1
  })
  assert.equal(wireProps(basic.components.Text).text.$ref, 'common_types.json#/$defs/DynamicString')
})

test('single-selection A2UI choice components bind a string value', () => {
  const { basic, extension } = generateA2uiCatalogs(radiantCatalog)
  const valueRef = schema => wireProps(schema).value.$ref
  assert.equal(valueRef(extension.components.Select), 'common_types.json#/$defs/DynamicString')
  assert.equal(valueRef(extension.components.RadioGroup), 'common_types.json#/$defs/DynamicString')
  assert.equal(
    valueRef(extension.components.Combobox),
    'common_types.json#/$defs/DynamicStringList'
  )
  assert.equal(
    valueRef(basic.components.ChoicePicker),
    'common_types.json#/$defs/DynamicStringList'
  )
})

test('custom entries join the extension catalog but cannot reuse generated A2UI names', () => {
  const extended = extendCatalog(radiantCatalog, {
    id: 'example/custom',
    version: '1.0.0',
    entries: { MetricTile: customEntry('MetricTile') }
  })
  const generated = generateA2uiCatalogs(extended)
  assert.equal(generated.extension.components.MetricTile.properties.component.const, 'MetricTile')
  assert.equal(generated.basic.components.MetricTile, undefined)

  for (const name of ['Select', 'CheckBox', 'ChoicePicker']) {
    const clashing = extendCatalog(radiantCatalog, {
      id: 'example/clash',
      version: '1.0.0',
      entries: { [name]: customEntry(name) }
    })
    assert.throws(
      () => generateA2uiCatalogs(clashing),
      new RegExp(`"${name}": a custom entry cannot reuse the name`)
    )
  }
})

test('validation rejects actions that share a name with a prop, slot, or binding', () => {
  const entry = {
    ...customEntry('Clashing'),
    bindings: { value: { description: 'Value.', valueType: 'string', direction: 'two-way' } },
    actions: {
      label: { description: 'Clashes with a prop.', scope: 'outbound' },
      value: { description: 'Clashes with a binding.', scope: 'outbound' }
    }
  }
  const violations = validateCatalogEntry(entry, 'Clashing')
  assert.ok(violations.some(message => message.includes('action "label" collides with a prop')))
  assert.ok(violations.some(message => message.includes('action "value" collides with a binding')))
})

test('coerceSchemaProps coerces unknown enum values, missing required labels, and mixed controlled/uncontrolled props', () => {
  const buttonResult = coerceSchemaProps(
    radiantCatalog.entries.Button.propsSchema,
    { label: 'Save', tone: 'neon' },
    { nodeId: 'save_btn', component: 'Button' }
  )
  assert.equal(buttonResult.props.tone, 'accent')
  assert.equal(buttonResult.diagnostics.length, 1)
  assert.equal(buttonResult.diagnostics[0].nodeId, 'save_btn')
  assert.equal(buttonResult.diagnostics[0].prop, 'tone')
  assert.equal(buttonResult.diagnostics[0].received, 'neon')
  assert.equal(buttonResult.diagnostics[0].used, 'accent')

  const fieldSchema = {
    ...radiantCatalog.entries.TextField.propsSchema,
    properties: {
      ...radiantCatalog.entries.TextField.propsSchema.properties,
      value: { type: 'string' }
    }
  }
  const fieldResult = coerceSchemaProps(
    fieldSchema,
    { value: 'Ada', defaultValue: 'Grace' },
    { nodeId: 'display_name', component: 'TextField' }
  )
  assert.equal(fieldResult.props.label, 'Display name')
  assert.equal(fieldResult.props.value, 'Ada')
  assert.equal('defaultValue' in fieldResult.props, false)
  assert.deepEqual(
    fieldResult.diagnostics.map(({ nodeId, prop, received, used }) => ({
      nodeId,
      prop,
      received,
      used
    })),
    [
      {
        nodeId: 'display_name',
        prop: 'defaultValue',
        received: 'Grace',
        used: undefined
      },
      {
        nodeId: 'display_name',
        prop: 'label',
        received: undefined,
        used: 'Display name'
      }
    ]
  )
})

test('catalog action contract delivers isolated state snapshots and interactive entries bind locally', () => {
  const liveState = { note: 'Draft', nested: { count: 1 }, tags: ['a'] }
  const event = createCatalogActionEvent({
    action: 'check',
    surfaceId: 's_1',
    nodeId: 'check_btn',
    state: liveState
  })

  // Mutating the source state later must not affect the delivered snapshot
  liveState.note = 'Edited later'
  liveState.nested.count = 99
  liveState.tags.push('b')

  assert.deepEqual(event, {
    action: 'check',
    surfaceId: 's_1',
    nodeId: 'check_btn',
    state: { note: 'Draft', nested: { count: 1 }, tags: ['a'] }
  })
  assert.equal(Object.isFrozen(event), true)
  assert.equal(Object.isFrozen(event.state), true)
  assert.equal(Object.isFrozen(event.state.nested), true)
  assert.equal(Object.isFrozen(event.state.tags), true)

  // Preserves JSON root values (arrays, primitives, null) and normalizes undefined/unsupported roots to {}
  const arrayRoot = snapshotSurfaceState([{ enabled: false }])
  assert.deepEqual(arrayRoot, [{ enabled: false }])
  assert.equal(Object.isFrozen(arrayRoot), true)
  assert.equal(Object.isFrozen(arrayRoot[0]), true)
  assert.equal(snapshotSurfaceState('ok'), 'ok')
  assert.equal(snapshotSurfaceState(42), 42)
  assert.equal(snapshotSurfaceState(null), null)
  assert.deepEqual(snapshotSurfaceState(undefined), {})
  assert.deepEqual(snapshotSurfaceState(new Map([['a', 1]])), {})
  assert.deepEqual(snapshotSurfaceState(new Date()), {})

  // Unsupported mutable instances are omitted from objects and nulled in arrays
  const sanitized = snapshotSurfaceState({
    ok: 'yes',
    map: new Map([['k', 'v']]),
    date: new Date('2026-01-01T00:00:00Z'),
    list: [1, new Date('2026-01-01T00:00:00Z'), new Map()]
  })
  assert.deepEqual(sanitized, { ok: 'yes', list: [1, null, null] })
  assert.equal(Object.isFrozen(sanitized.list), true)
  assert.throws(
    () => createCatalogActionEvent({ action: '  ', surfaceId: 's_1', nodeId: 'n_1', state: {} }),
    TypeError
  )

  // Every interactive input entry binds two-way local state without outbound actions
  const inputEntries = Object.values(radiantCatalog.entries).filter(e => e.category === 'input')
  assert.ok(inputEntries.length > 0)
  for (const entry of inputEntries) {
    assert.ok(
      Object.values(entry.bindings).some(binding => binding.direction === 'two-way'),
      `${entry.name} should bind two-way local state`
    )
    assert.deepEqual(entry.actions, {}, `${entry.name} should not declare outbound actions`)
  }
  assert.equal(radiantCatalog.entries.Button.actions.action.scope, 'outbound')
})

test('every entry carries guidance within the token budget, including app entries', () => {
  for (const entry of Object.values(radiantCatalog.entries)) {
    assert.equal(entry.guidance.examples.length, 2, entry.name)
    assert.ok(
      estimateCatalogTokens(describeCatalogEntry(entry)) <= CATALOG_GUIDANCE_TOKEN_BUDGET,
      entry.name
    )
  }

  const { guidance, ...unguided } = customEntry('Unguided')
  assert.match(validateCatalogEntry(unguided).join('\n'), /guidance must be an object/)
  assert.match(
    validateCatalogEntry({
      ...customEntry('OneExample'),
      guidance: { ...guidance, examples: ['a'] }
    }).join('\n'),
    /two non-empty strings/
  )
  assert.match(
    validateCatalogEntry({
      ...customEntry('Verbose'),
      guidance: { ...guidance, whenToUse: 'word '.repeat(200) }
    }).join('\n'),
    /the budget is/
  )
  assert.throws(
    () =>
      extendCatalog(radiantCatalog, {
        id: 'example/unguided',
        version: '1.0.0',
        entries: { Unguided: unguided }
      }),
    /guidance must be an object/
  )
})

test('guidance renders into llms.txt Markdown and generated A2UI catalogs', () => {
  const extended = extendCatalog(radiantCatalog, {
    id: 'example/custom',
    version: '1.0.0',
    entries: { MetricTile: customEntry('MetricTile') }
  })
  const markdown = renderCatalogGuidance(extended, { title: 'Example', summary: 'Agent catalog.' })
  assert.match(markdown, /^# Example\n\n> Agent catalog\. Catalog example\/custom 1\.0\.0\.\n/)
  assert.ok(markdown.includes(renderCatalogInstructions()))
  assert.match(markdown, /### Button\n[\s\S]*- Avoid: Navigation/)
  assert.match(
    markdown,
    /### MetricTile\n[\s\S]*- Use: Custom data\.\n- Avoid: Built-in data\.\n- Example: first\n- Example: second/
  )
  assert.doesNotMatch(markdown, /\b[A-Z]{2,}-\d+\b|\b20\d\d-\d\d-\d\d\b/)

  const { basic, extension } = generateA2uiCatalogs(extended)
  assert.match(extension.components.MetricTile.description, /^Custom application entry\.\nUse: /)
  // Each document carries only the rules for the props it exposes.
  assert.match(basic.instructions, /Button runs actions/)
  assert.doesNotMatch(basic.instructions, /Tone|Spacing|Control size/)
  assert.match(extension.instructions, /Tone is/)
  assert.doesNotMatch(extension.instructions, /Button|Bind input/)
  assert.throws(
    () => describeCatalogEntry({ ...customEntry('Bare'), guidance: undefined }),
    /"Bare" has no guidance/
  )
})

test('A2UI descriptions name only props, values and components their catalog has', () => {
  const { basic, extension } = generateA2uiCatalogs(radiantCatalog)
  const known = new Set([...Object.keys(radiantCatalog.entries), ...A2UI_GENERATED_COMPONENT_NAMES])
  const basicNames = new Set(Object.keys(basic.components))
  assert.deepEqual(findA2uiDescriptionViolations(basic.components, basicNames, known), [])
  assert.deepEqual(
    findA2uiDescriptionViolations(
      extension.components,
      new Set([...basicNames, ...Object.keys(extension.components)]),
      known
    ),
    []
  )
  for (const document of [basic, extension]) {
    for (const [name, schema] of Object.entries(document.components)) {
      assert.ok(estimateCatalogTokens(schema.description) <= CATALOG_GUIDANCE_TOKEN_BUDGET, name)
    }
  }
  assert.match(basic.components.CheckBox.description, /\(ChoicePicker\)/)
  assert.doesNotMatch(basic.components.Text.description, /Alert/)

  // Canonical guidance names props the basic projections rename or drop.
  for (const [a2uiName, entryName] of [
    ['Button', 'Button'],
    ['TextField', 'TextField'],
    ['Slider', 'Slider'],
    ['Text', 'Text'],
    ['ChoicePicker', 'Choice'],
    ['CheckBox', 'Checkbox'],
    ['Image', 'Image'],
    ['Divider', 'Divider'],
    ['Row', 'Row']
  ]) {
    const canonical = {
      [a2uiName]: {
        ...basic.components[a2uiName],
        description: describeCatalogEntry(radiantCatalog.entries[entryName])
      }
    }
    assert.notDeepEqual(findA2uiDescriptionViolations(canonical, basicNames, known), [], a2uiName)
  }

  const shipped = JSON.parse(
    readFileSync(fileURLToPath(new URL('../src/a2ui/catalog.json', import.meta.url)), 'utf8')
  )
  assert.equal(shipped.instructions, basic.instructions)
  assert.deepEqual(
    findA2uiDescriptionViolations(
      shipped.components,
      new Set(Object.keys(shipped.components)),
      known
    ),
    []
  )
})

test('tone and variant meanings come from GLOSSARY.md', () => {
  const glossary = readFileSync(
    fileURLToPath(new URL('../GLOSSARY.md', import.meta.url)),
    'utf8'
  ).replace(/\s+/g, ' ')
  for (const [name, meaning] of [
    ...Object.entries(CATALOG_TONE_MEANINGS),
    ...Object.entries(CATALOG_VARIANT_MEANINGS)
  ]) {
    assert.ok(glossary.includes(`${name} for ${meaning}`), `${name} for ${meaning}`)
  }
})
