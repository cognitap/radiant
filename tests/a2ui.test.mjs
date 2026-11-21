import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { Catalog } from '@a2ui/web_core/catalog'
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_PROTOCOL_VERSION,
  COERCED_NOOP_ACTION_NAME,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  coerceA2uiMessages,
  createA2uiRegistryEntry,
  radiantA2uiRegistry,
  sanitizeA2uiMessages,
  summarizeCatalogDiagnostics
} from '../dist/library/a2ui/index.js'
import { malformedProfileFixtureMessages } from '../dist/library/a2ui/fixtures.js'

const generatedCatalogPath = fileURLToPath(new URL('../src/a2ui/catalog.json', import.meta.url))

test('generated A2UI catalog JSON matches radiantA2uiRegistry and loads into @a2ui/web_core', () => {
  const onDisk = JSON.parse(readFileSync(generatedCatalogPath, 'utf8'))
  const fromRegistry = radiantA2uiRegistry.toCatalogJson()
  assert.deepEqual(onDisk, fromRegistry)

  const parsed = Catalog.fromJson(onDisk, A2UI_PROTOCOL_VERSION)
  assert.equal(parsed.id, radiantA2uiRegistry.catalogId)
  assert.deepEqual([...parsed.components.keys()].sort(), ['Button', 'Column', 'Text', 'TextField'])
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

  const summary = summarizeCatalogDiagnostics(diagnostics)
  assert.equal(summary.defaults, 1)
  assert.equal(summary.stripped, 2)
  assert.equal(summary.fallbacks, 1)
  assert.ok(summary.coercions >= 5)
  assert.equal(summary.total, diagnostics.length)

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

test('coerceA2uiMessages isolates malformed nested actions, dynamic expressions, and prototype names', () => {
  const result = coerceA2uiMessages(
    [
      {
        version: A2UI_PROTOCOL_VERSION,
        createSurface: {
          surfaceId: 's_nested',
          catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
          components: [
            {
              id: 'root',
              component: 'Column',
              children: ['bad_btn', 'bad_expr', 'proto_node', 'ctor_node', 'healthy']
            },
            {
              id: 'bad_btn',
              component: 'Button',
              child: 'btn_label',
              action: { event: { name: 'save', context: 'not-an-object' } }
            },
            { id: 'btn_label', component: 'Text', text: 'Save' },
            {
              id: 'bad_expr',
              component: 'Text',
              text: { '@call': '@index', catalogId: 'invalid-on-system' }
            },
            { id: 'proto_node', component: 'toString', text: 'Prototype name fallback' },
            { id: 'ctor_node', component: 'constructor', label: 'Constructor fallback' },
            { id: 'healthy', component: 'Text', text: 'Sibling remains healthy' }
          ]
        }
      }
    ],
    radiantA2uiRegistry
  )

  const components = result.messages[0].createSurface.components
  const badBtn = components.find(c => c.id === 'bad_btn')
  assert.deepEqual(badBtn.action, { event: { name: 'save' } })
  assert.ok(
    result.diagnostics.some(
      d =>
        d.nodeId === 'bad_btn' &&
        d.prop === 'action' &&
        d.received?.event?.context === 'not-an-object' &&
        d.used?.event?.name === 'save'
    )
  )

  const badExpr = components.find(c => c.id === 'bad_expr')
  assert.equal(typeof badExpr.text, 'string')
  assert.ok(result.diagnostics.some(d => d.nodeId === 'bad_expr' && d.prop === 'text'))

  const protoNode = components.find(c => c.id === 'proto_node')
  assert.equal(protoNode.component, 'Text')
  assert.equal(protoNode.text, 'Prototype name fallback')
  const ctorNode = components.find(c => c.id === 'ctor_node')
  assert.equal(ctorNode.component, 'Text')
  assert.equal(ctorNode.text, 'Constructor fallback')

  const healthy = components.find(c => c.id === 'healthy')
  assert.equal(healthy.text, 'Sibling remains healthy')
})

test('coerceA2uiMessages preserves repeated template expressions, catalogId routing, and container children', () => {
  const result = coerceA2uiMessages(
    [
      {
        version: A2UI_PROTOCOL_VERSION,
        createSurface: {
          surfaceId: 's_template',
          components: [
            {
              id: 'root',
              component: 'UnknownPanel',
              catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
              children: ['list', 'btn']
            },
            {
              id: 'list',
              component: 'Column',
              catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
              children: { componentId: 'item_row', path: '' }
            },
            {
              id: 'item_row',
              component: 'Column',
              catalogId: A2UI_BASIC_CATALOG_ID,
              children: ['idx_cell', 'val_cell']
            },
            {
              id: 'idx_cell',
              component: 'Text',
              catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
              text: { '@call': '@index' }
            },
            {
              id: 'val_cell',
              component: 'Text',
              catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
              text: { '@path': '' }
            },
            {
              id: 'btn',
              component: 'Button',
              catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
              label: 'Submit',
              action: { event: { name: 'submit' } }
            }
          ]
        }
      }
    ],
    radiantA2uiRegistry
  )

  const components = result.messages[0].createSurface.components
  const root = components.find(c => c.id === 'root')
  assert.equal(root.component, 'Column')
  assert.deepEqual(root.children, ['list', 'btn'])
  assert.equal(root.catalogId, RADIANT_A2UI_EXTENSION_CATALOG_ID)

  const list = components.find(c => c.id === 'list')
  assert.deepEqual(list.children, { componentId: 'item_row', path: '' })

  const idxCell = components.find(c => c.id === 'idx_cell')
  assert.deepEqual(idxCell.text, { '@call': '@index' })

  const valCell = components.find(c => c.id === 'val_cell')
  assert.deepEqual(valCell.text, { '@path': '' })

  const btn = components.find(c => c.id === 'btn')
  const synthChild = components.find(c => c.id === btn.child)
  assert.equal(synthChild.catalogId, RADIANT_A2UI_EXTENSION_CATALOG_ID)
})

test('coerceA2uiMessages avoids cross-batch ID collisions, handles custom registries without Text, and isolates direct SSR adapter throws', () => {
  const crossBatch = coerceA2uiMessages(
    [
      {
        version: A2UI_PROTOCOL_VERSION,
        createSurface: {
          surfaceId: 's_ids',
          catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
          components: [
            { id: 'root', component: 'Column', children: ['b1', 'b1__child'] },
            { id: 'b1', component: 'Button', label: 'First' },
            { id: 'b1__child', component: 'Text', text: 'Real colliding node' },
            { component: 'Text', text: 'Nameless batch 1' }
          ]
        }
      },
      {
        version: A2UI_PROTOCOL_VERSION,
        updateComponents: {
          surfaceId: 's_ids',
          components: [
            { id: 'b1', component: 'Button', label: 'Updated first' },
            { component: 'Text', text: 'Nameless batch 2' }
          ]
        }
      }
    ],
    radiantA2uiRegistry
  )

  const batch1 = crossBatch.messages[0].createSurface.components
  const batch2 = crossBatch.messages[1].updateComponents.components
  const b1First = batch1.find(c => c.id === 'b1')
  const b1Second = batch2.find(c => c.id === 'b1')
  assert.notEqual(b1First.child, 'b1__child')
  assert.notEqual(b1Second.child, 'b1__child')
  assert.notEqual(b1Second.child, b1First.child)
  const nameless1 = batch1.find(c => c.text === 'Nameless batch 1')
  const nameless2 = batch2.find(c => c.text === 'Nameless batch 2')
  assert.notEqual(nameless1.id, nameless2.id)

  const script = `
    import assert from 'node:assert/strict';
    import { createElement as h } from 'react';
    import { renderToString } from 'react-dom/server';
    const {
      A2UI_PROTOCOL_VERSION,
      A2uiSurface,
      coerceA2uiMessages,
      createA2uiRegistry,
      createA2uiRegistryEntry,
      RADIANT_A2UI_EXTENSION_CATALOG_ID
    } = await import('./dist/library/a2ui/index.js');

    const textOnlyRegistry = createA2uiRegistry({
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      title: 'Text only',
      description: 'Text only registry',
      entries: [
        createA2uiRegistryEntry({
          name: 'Text',
          component: () => null,
          description: 'Plain text',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['text'],
            properties: { text: { $ref: '#/$defs/DynamicString' } }
          },
          adapter: (props) => h('span', null, String(props.text ?? ''))
        })
      ]
    });

    const descendantFallback = coerceA2uiMessages(
      [{
        version: A2UI_PROTOCOL_VERSION,
        createSurface: {
          surfaceId: 's_desc',
          catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
          components: [
            { id: 'root', component: 'MysteryBox', children: ['c1', 'c2'] },
            { id: 'c1', component: 'Text', text: 'First line' },
            { id: 'c2', component: 'Text', text: 'Second line' }
          ]
        }
      }],
      textOnlyRegistry
    );
    const rootDesc = descendantFallback.messages[0].createSurface.components.find(c => c.id === 'root');
    assert.equal(rootDesc.component, 'Text');
    assert.equal(rootDesc.text, 'First line Second line');

    const noTextRegistry = createA2uiRegistry({
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      title: 'No text',
      description: 'Registry without Text',
      entries: [
        createA2uiRegistryEntry({
          name: 'Box',
          component: () => null,
          description: 'Container',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: { children: { $ref: '#/$defs/ChildList' } }
          },
          adapter: (props, ctx) =>
            h(
              'div',
              null,
              Array.isArray(props.children)
                ? props.children.map(child => ctx.renderNode(child))
                : null
            )
        }),
        createA2uiRegistryEntry({
          name: 'Action',
          component: () => null,
          description: 'Needs child',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['child'],
            properties: { child: { $ref: '#/$defs/ComponentId' } }
          },
          adapter: (props, ctx) => h('button', null, props.child ? ctx.renderNode(props.child) : null)
        }),
        createA2uiRegistryEntry({
          name: 'Badge',
          component: () => null,
          description: 'Healthy badge',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['label'],
            properties: { label: { type: 'string' } }
          },
          adapter: (props) => h('strong', null, props.label)
        }),
        createA2uiRegistryEntry({
          name: 'Boom',
          component: () => null,
          description: 'Throws synchronously in adapter',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: { text: { type: 'string' } }
          },
          adapter: () => { throw new Error('direct adapter boom'); }
        })
      ]
    });

    const noTextResult = coerceA2uiMessages(
      [{
        version: A2UI_PROTOCOL_VERSION,
        createSurface: {
          surfaceId: 's_notext',
          catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
          components: [
            { id: 'root', component: 'Box', children: ['broken_action', 'ok_badge'] },
            { id: 'broken_action', component: 'Action' },
            { id: 'ok_badge', component: 'Badge', label: 'Still healthy' }
          ]
        }
      }],
      noTextRegistry
    );
    const ids = noTextResult.messages[0].createSurface.components.map(c => c.id);
    assert.equal(ids.includes('broken_action'), false);
    assert.equal(ids.includes('ok_badge'), true);
    assert.ok(noTextResult.diagnostics.some(d => d.nodeId === 'broken_action' && d.kind === 'fallback'));

    const ssrHtml = renderToString(h(A2uiSurface, {
      surfaceId: 's_ssr_throw',
      registry: noTextRegistry,
      messages: [{
        version: A2UI_PROTOCOL_VERSION,
        createSurface: {
          surfaceId: 's_ssr_throw',
          catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
          components: [
            { id: 'root', component: 'Box', children: ['bad', 'good'] },
            { id: 'bad', component: 'Boom', text: 'Direct throw fallback text' },
            { id: 'good', component: 'Badge', label: 'Sibling rendered on SSR' }
          ]
        }
      }]
    }));
    assert.match(ssrHtml, /data-slot="a2ui-fallback"/);
    assert.match(ssrHtml, /Direct throw fallback text/);
    assert.match(ssrHtml, /Sibling rendered on SSR/);
  `
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    stdio: 'pipe'
  })
})
