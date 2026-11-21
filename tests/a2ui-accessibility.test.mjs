import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  A2UI_PROTOCOL_VERSION,
  createA2uiRegistry,
  createA2uiRegistryEntry,
  radiantA2uiRegistry,
  validateA2uiAccessibility
} from '../dist/library/a2ui/index.js'
import { warnA2uiAccessibility } from '../dist/library/a2ui/accessibility.js'
import {
  INACCESSIBLE_SURFACE_ID,
  inaccessibleFixtureMessages,
  interactivePreferencesFixtureMessages,
  malformedProfileFixtureMessages,
  profileFixtureMessages
} from '../dist/library/a2ui/fixtures.js'

const surfaceId = INACCESSIBLE_SURFACE_ID
const expectedErrors = [
  {
    surfaceId,
    nodeId: 'email_field',
    component: 'TextField',
    rule: 'control-label',
    prop: 'label',
    message: 'TextField "email_field" has no label.',
    fixable: true
  },
  {
    surfaceId,
    nodeId: 'terms_checkbox',
    component: 'CheckBox',
    rule: 'control-label',
    prop: 'label',
    message: 'CheckBox "terms_checkbox" has no label.',
    fixable: true
  },
  {
    surfaceId,
    nodeId: 'submit_button',
    component: 'Button',
    rule: 'button-name',
    prop: 'child',
    message: 'Button "submit_button" has no text content to name it.',
    fixable: false
  },
  {
    surfaceId,
    nodeId: 'seats_slider',
    component: 'Slider',
    rule: 'control-label',
    prop: 'label',
    message: 'Slider "seats_slider" has no label or accessibility.label.',
    fixable: false
  }
]

test('every registry entry declares its accessibility rules', () => {
  const declared = Object.fromEntries(
    Object.values(radiantA2uiRegistry.entries).map(entry => [
      entry.name,
      entry.accessibility.map(rule => rule.id)
    ])
  )
  assert.deepEqual(declared, {
    Column: [],
    Text: [],
    TextField: ['control-label'],
    CheckBox: ['control-label'],
    ChoicePicker: ['control-label'],
    Slider: ['control-label'],
    Button: ['button-name']
  })
  assert.throws(
    () =>
      createA2uiRegistryEntry({
        name: 'Undeclared',
        component: 'div',
        description: 'Declares no accessibility rules.',
        schema: { type: 'object', properties: { component: { const: 'Undeclared' } } },
        adapter: () => null
      }),
    /must declare accessibility rules/
  )
  assert.throws(
    () =>
      createA2uiRegistryEntry({
        name: 'Malformed',
        component: 'div',
        description: 'Declares a rule without a check.',
        schema: { type: 'object', properties: { component: { const: 'Malformed' } } },
        adapter: () => null,
        accessibility: [{ id: 'broken' }]
      }),
    /accessibility rule without an id or check function/
  )
})

test('validateA2uiAccessibility reports exact errors across patches without a DOM', () => {
  assert.equal(typeof document, 'undefined')
  const before = JSON.stringify(inaccessibleFixtureMessages)
  const result = validateA2uiAccessibility(inaccessibleFixtureMessages)
  assert.deepEqual(result.errors, expectedErrors)
  assert.equal(result.messages, inaccessibleFixtureMessages)
  assert.equal(JSON.stringify(inaccessibleFixtureMessages), before)

  assert.deepEqual(validateA2uiAccessibility(profileFixtureMessages).errors, [])
  assert.deepEqual(validateA2uiAccessibility(interactivePreferencesFixtureMessages).errors, [])
  assert.deepEqual(
    validateA2uiAccessibility(malformedProfileFixtureMessages).errors.map(e => e.message),
    ['TextField "name_field" has no label.']
  )
})

test('validateA2uiAccessibility applies safe fixes only on request and never mutates input', () => {
  const before = JSON.stringify(inaccessibleFixtureMessages)
  const result = validateA2uiAccessibility(inaccessibleFixtureMessages, { fix: true })
  assert.deepEqual(result.errors, expectedErrors)
  assert.equal(JSON.stringify(inaccessibleFixtureMessages), before)

  const components = result.messages[0].createSurface.components
  const byId = Object.fromEntries(components.map(c => [c.id, c]))
  assert.equal(byId.email_field.label, 'Email address')
  assert.equal(byId.terms_checkbox.label, 'Accept the terms')
  assert.deepEqual(
    validateA2uiAccessibility(result.messages).errors.map(e => e.nodeId),
    ['submit_button', 'seats_slider']
  )
})

test('validateA2uiAccessibility honors bindings, nested button text, and deleted surfaces', () => {
  const messages = [
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId: 'bound',
        catalogId: radiantA2uiRegistry.catalogId,
        components: [
          { id: 'name', component: 'TextField', label: { '@path': '/label' } },
          { id: 'go', component: 'Button', child: 'go_col', action: { event: { name: 'go' } } },
          { id: 'go_col', component: 'Column', children: ['go_text'] },
          { id: 'go_text', component: 'Text', text: 'Go' }
        ]
      }
    },
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId: 'gone',
        catalogId: radiantA2uiRegistry.catalogId,
        components: [{ id: 'box', component: 'CheckBox', value: true }]
      }
    },
    { version: A2UI_PROTOCOL_VERSION, deleteSurface: { surfaceId: 'gone' } }
  ]
  assert.deepEqual(validateA2uiAccessibility(messages).errors, [])
})

test('warnA2uiAccessibility warns once in development and stays silent in production', t => {
  const registry = createA2uiRegistry({
    catalogId: radiantA2uiRegistry.catalogId,
    title: radiantA2uiRegistry.title,
    description: radiantA2uiRegistry.description,
    entries: Object.values(radiantA2uiRegistry.entries)
  })
  const warn = t.mock.method(console, 'warn', () => {})
  const previous = process.env.NODE_ENV
  try {
    process.env.NODE_ENV = 'production'
    warnA2uiAccessibility(inaccessibleFixtureMessages, registry)
    assert.equal(warn.mock.callCount(), 0)

    process.env.NODE_ENV = 'development'
    warnA2uiAccessibility(inaccessibleFixtureMessages, registry)
    warnA2uiAccessibility(inaccessibleFixtureMessages, registry)
    assert.equal(warn.mock.callCount(), 1)
    const [text] = warn.mock.calls[0].arguments
    for (const error of expectedErrors) assert.ok(text.includes(error.message))
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previous
  }
})
