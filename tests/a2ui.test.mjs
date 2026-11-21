import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { Catalog } from '@a2ui/web_core/catalog'
import {
  A2UI_PROTOCOL_VERSION,
  createA2uiRegistryEntry,
  radiantA2uiRegistry,
  sanitizeA2uiMessages
} from '../dist/library/a2ui/index.js'

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
