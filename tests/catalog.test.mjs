import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import ts from 'typescript'
import {
  CATALOG_SPACING,
  CHOICE_PRESENTATIONS,
  assertValidCatalog,
  defineCatalog,
  extendCatalog,
  findForbiddenPropsInSchema,
  isForbiddenCatalogProp,
  radiantCatalog,
  validateCatalog,
  validateCatalogEntry
} from '../dist/library/catalog/index.js'
import {
  A2UI_BASIC_CATALOG_ID,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  generateA2uiCatalogs
} from '../dist/library/a2ui/catalogGenerator.js'

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

test('A2UI basic and extension catalogs are generated deterministically from radiantCatalog', () => {
  const first = generateA2uiCatalogs(radiantCatalog)
  const second = generateA2uiCatalogs(radiantCatalog)
  assert.deepEqual(first, second)

  assert.equal(first.basic.catalogId, A2UI_BASIC_CATALOG_ID)
  assert.equal(first.extension.catalogId, RADIANT_A2UI_EXTENSION_CATALOG_ID)
  assert.equal(first.extension.extends, A2UI_BASIC_CATALOG_ID)

  assert.deepEqual(Object.keys(first.basic.components).sort(), [
    'AudioPlayer',
    'Button',
    'Card',
    'CheckBox',
    'ChoicePicker',
    'Column',
    'DateTimeInput',
    'Divider',
    'Icon',
    'Image',
    'List',
    'Modal',
    'Row',
    'Slider',
    'Tabs',
    'Text',
    'TextField',
    'Video'
  ])

  assert.deepEqual(Object.keys(first.extension.components).sort(), [
    'Accordion',
    'Alert',
    'Badge',
    'Combobox',
    'Progress',
    'RadioGroup',
    'Select',
    'Switch',
    'Table',
    'Textarea',
    'Toast'
  ])

  // Bindings, checks, slots, and actions translate from the canonical contract
  assert.equal(first.basic.components.TextField.properties.value.$ref, '#/$defs/DynamicString')
  assert.ok(first.basic.components.TextField.properties.checks)
  assert.equal(first.basic.components.Button.properties.action.$ref, '#/$defs/Action')
  assert.equal(first.basic.components.Row.properties.children.$ref, '#/$defs/ChildList')
  assert.equal(first.basic.components.Card.properties.child.$ref, '#/$defs/ComponentId')
  assert.equal(
    first.basic.components.ChoicePicker.properties.value.$ref,
    '#/$defs/DynamicStringList'
  )
  assert.equal(first.extension.components.Select.properties.presentation, undefined)
  assert.equal(first.extension.components.Select.properties.value.$ref, '#/$defs/DynamicStringList')
  assert.equal(first.extension.components.Textarea.properties.kind, undefined)
  assert.ok(first.extension.components.Textarea.properties.rows)
  assert.equal(first.extension.components.Table.properties.rows.$ref, '#/$defs/ChildList')

  // Every generated A2UI component remains free of forbidden props
  for (const doc of [first.basic, first.extension]) {
    for (const [componentName, schema] of Object.entries(doc.components)) {
      assert.deepEqual(
        findForbiddenPropsInSchema(schema, componentName),
        [],
        `Generated A2UI component ${componentName} leaked a forbidden prop`
      )
    }
  }

  // Custom entries added via extendCatalog flow automatically into the generated extension catalog
  const extended = extendCatalog(radiantCatalog, {
    id: 'example/custom',
    version: '1.0.0',
    entries: {
      MetricTile: {
        name: 'MetricTile',
        category: 'data',
        description: 'Single headline metric.',
        propsSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['label', 'value'],
          properties: {
            label: { type: 'string' },
            value: { type: 'string' }
          }
        },
        slots: {},
        bindings: {},
        actions: {}
      }
    }
  })
  const generatedExtended = generateA2uiCatalogs(extended)
  assert.ok('MetricTile' in generatedExtended.extension.components)
  assert.equal(
    generatedExtended.extension.components.MetricTile.properties.component.const,
    'MetricTile'
  )
})
