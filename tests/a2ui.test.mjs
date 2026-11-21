import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { Catalog } from '@a2ui/web_core/catalog'
import {
  A2UI_PROTOCOL_VERSION,
  COERCED_NOOP_ACTION_NAME,
  coerceA2uiMessages,
  createA2uiRegistryEntry,
  radiantA2uiRegistry,
  sanitizeA2uiMessages
} from '../dist/library/a2ui/index.js'
import { coerceSchemaProps } from '../dist/library/catalog/index.js'
import { malformedProfileFixtureMessages } from '../dist/library/a2ui/fixtures.js'

const generatedCatalogPath = fileURLToPath(new URL('../src/a2ui/catalog.json', import.meta.url))

test('generated A2UI catalog JSON matches radiantA2uiRegistry and loads into @a2ui/web_core', () => {
  const onDisk = JSON.parse(readFileSync(generatedCatalogPath, 'utf8'))
  const fromRegistry = radiantA2uiRegistry.toCatalogJson()
  assert.deepEqual(onDisk, fromRegistry)

  const parsed = Catalog.fromJson(onDisk, A2UI_PROTOCOL_VERSION)
  assert.equal(parsed.id, radiantA2uiRegistry.catalogId)
  assert.deepEqual([...parsed.components.keys()].sort(), [
    'Button',
    'CheckBox',
    'ChoicePicker',
    'Column',
    'Slider',
    'Text',
    'TextField'
  ])
})

test('createA2uiRegistryEntry rejects forbidden host styling, render, handler, and ARIA props', () => {
  for (const forbidden of ['className', 'style', 'render', 'aria-label', 'role', 'onClick']) {
    assert.throws(
      () =>
        createA2uiRegistryEntry({
          name: 'BadWidget',
          component: 'div',
          description: 'Leaks a forbidden prop.',
          schema: {
            type: 'object',
            properties: {
              component: { const: 'BadWidget' },
              [forbidden]: { type: 'string' }
            }
          },
          adapter: () => null
        }),
      /forbidden props/
    )
  }
})

test('sanitizeA2uiMessages strips agent theme hints without mutating caller messages', () => {
  const input = [
    {
      version: '1.0',
      createSurface: {
        surfaceId: 'demo',
        catalogId: radiantA2uiRegistry.catalogId,
        theme: { primaryColor: '#ff00ff' },
        metadata: {
          theme: { font: 'Comic Sans MS' },
          extensions: { theme: { accent: 'red' }, traceId: 'abc' }
        },
        components: []
      }
    }
  ]
  const snapshot = structuredClone(input)
  const sanitized = sanitizeA2uiMessages(input)

  assert.deepEqual(input, snapshot)
  const createSurface = sanitized[0].createSurface
  assert.equal('theme' in createSurface, false)
  assert.equal('theme' in createSurface.metadata, false)
  assert.equal('theme' in createSurface.metadata.extensions, false)
  assert.equal(createSurface.metadata.extensions.traceId, 'abc')
})

test('A2uiSurface renders full Radiant markup on Node SSR without browser globals', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { createElement as h } from 'react';
    import { renderToString } from 'react-dom/server';
    for (const key of ['window', 'document', 'HTMLElement', 'customElements', 'localStorage']) {
      Object.defineProperty(globalThis, key, {
        get() {
          throw new Error('Unexpected browser global read: ' + key);
        }
      });
    }
    const { A2uiSurface } = await import('./dist/library/a2ui/index.js');
    const { PROFILE_SURFACE_ID, profileFixtureWithThemeHintMessages } = await import('./dist/library/a2ui/fixtures.js');
    const html = renderToString(h(A2uiSurface, {
      surfaceId: PROFILE_SURFACE_ID,
      messages: profileFixtureWithThemeHintMessages
    }));
    assert.match(html, /data-slot="a2ui-surface"/);
    assert.match(html, /Update how your name appears across shared workspaces\\./);
    assert.match(html, /<label\\b[^>]*>Display name/);
    assert.match(html, /<input\\b[^>]*value="Ada Lovelace"/);
    assert.match(html, /<button\\b[^>]*>.*Save profile.*<\\/button>/);
    assert.doesNotMatch(html, /ff00ff|Comic Sans/);
  `
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    stdio: 'pipe'
  })
})

test('coerceA2uiMessages coerces invalid props, missing required props, mixed state, and unknown components with structured diagnostics', () => {
  const { messages, diagnostics } = coerceA2uiMessages(
    malformedProfileFixtureMessages,
    radiantA2uiRegistry
  )
  const components = messages[0].createSurface.components
  const byId = Object.fromEntries(components.map(c => [c.id, c]))

  assert.equal(byId.root.align, 'stretch')
  assert.equal(byId.intro_text.text, '42')
  assert.equal(byId.intro_text.variant, 'body')
  assert.equal('className' in byId.intro_text, false)
  assert.equal(byId.unknown_banner.component, 'Text')
  assert.equal(byId.unknown_banner.text, 'Workspace settings remain available.')
  assert.equal(byId.name_field.label, 'Name field')
  assert.equal('defaultValue' in byId.name_field, false)
  assert.equal(byId.name_field.variant, 'shortText')
  assert.equal('style' in byId.name_field, false)
  assert.equal(byId.save_button.variant, 'default')

  // Every diagnostic names nodeId, component, prop, received, and used
  for (const d of diagnostics) {
    assert.equal(typeof d.nodeId, 'string')
    assert.ok(d.nodeId.length > 0)
    assert.equal(typeof d.component, 'string')
    assert.equal(typeof d.prop, 'string')
    assert.ok('received' in d)
    assert.ok('used' in d)
  }

  // Explicit mixed-state pairs (checked/defaultChecked, open/defaultOpen) drop the default variant
  const mixedToggle = coerceSchemaProps(
    {
      type: 'object',
      properties: { checked: { type: 'boolean' }, open: { type: 'boolean' } }
    },
    { checked: true, defaultChecked: false, open: true, defaultOpen: false },
    { nodeId: 'toggle_1', component: 'Toggle' }
  )
  assert.deepEqual(mixedToggle.props, { checked: true, open: true })
  assert.deepEqual(
    mixedToggle.diagnostics.map(d => [d.kind, d.prop, d.received, d.used]),
    [
      ['coerced', 'defaultChecked', false, undefined],
      ['coerced', 'defaultOpen', false, undefined]
    ]
  )

  // Missing required Button child and action are safely synthesized
  const buttonFallback = coerceA2uiMessages(
    [
      {
        version: A2UI_PROTOCOL_VERSION,
        createSurface: {
          surfaceId: 'broken_btn',
          catalogId: radiantA2uiRegistry.catalogId,
          components: [{ id: 'root', component: 'Button', label: 'Continue' }]
        }
      }
    ],
    radiantA2uiRegistry
  )
  const btnComponents = buttonFallback.messages[0].createSurface.components
  const rootBtn = btnComponents.find(c => c.id === 'root')
  assert.equal(rootBtn.action.event.name, COERCED_NOOP_ACTION_NAME)
  const synthChild = btnComponents.find(c => c.id === rootBtn.child)
  assert.equal(synthChild.component, 'Text')
  assert.equal(synthChild.text, 'Continue')
})

test('A2uiSurface renders malformed fixtures cleanly on Node SSR without throwing', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { createElement as h } from 'react';
    import { renderToString } from 'react-dom/server';
    const { A2uiSurface } = await import('./dist/library/a2ui/index.js');
    const { PROFILE_SURFACE_ID, malformedProfileFixtureMessages } = await import('./dist/library/a2ui/fixtures.js');
    const html = renderToString(h(A2uiSurface, {
      surfaceId: PROFILE_SURFACE_ID,
      messages: malformedProfileFixtureMessages
    }));
    assert.match(html, /data-slot="a2ui-surface"/);
    assert.match(html, /Workspace settings remain available\\./);
    assert.match(html, /<label\\b[^>]*>Name field/);
    assert.match(html, /<input\\b[^>]*value="Ada Lovelace"/);
    assert.match(html, /<button\\b[^>]*>.*Save profile.*<\\/button>/);
  `
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    stdio: 'pipe'
  })
})

test('A2uiSurface deduplicates ChoicePicker option values at the boundary and keeps SSR siblings intact', () => {
  const duplicateMessages = [
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId: 'dup_choices',
        catalogId: radiantA2uiRegistry.catalogId,
        dataModel: { picks: [] },
        components: [
          { id: 'root', component: 'Column', children: ['healthy_sibling', 'dup_picker'] },
          { id: 'healthy_sibling', component: 'Text', text: 'Healthy sibling renders' },
          {
            id: 'dup_picker',
            component: 'ChoicePicker',
            label: 'Channels',
            variant: 'multipleSelection',
            options: [
              { label: 'Email', value: 'email' },
              { label: 'Email duplicate', value: 'email' },
              { label: 'SMS', value: 'sms' }
            ],
            value: { '@path': '/picks' }
          }
        ]
      }
    }
  ]

  const { diagnostics } = coerceA2uiMessages(duplicateMessages, radiantA2uiRegistry)
  const dupDiag = diagnostics.find(d => d.nodeId === 'dup_picker' && d.prop === 'options')
  assert.ok(dupDiag)
  assert.equal(dupDiag.kind, 'coerced')
  assert.equal(dupDiag.received.length, 3)
  assert.equal(dupDiag.used.length, 2)

  const script = `
    import assert from 'node:assert/strict';
    import { createElement as h } from 'react';
    import { renderToString } from 'react-dom/server';
    const { A2uiSurface } = await import('./dist/library/a2ui/index.js');
    const html = renderToString(h(A2uiSurface, {
      surfaceId: 'dup_choices',
      messages: ${JSON.stringify(duplicateMessages)}
    }));
    assert.match(html, /Healthy sibling renders/);
    assert.match(html, /Email/);
    assert.doesNotMatch(html, /Email duplicate/);
  `
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    stdio: 'pipe'
  })
})
