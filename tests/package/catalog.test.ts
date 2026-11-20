import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import * as core from '@cognitap/radiant'
import {
  CHOICE_PRESENTATIONS,
  CATALOG_SPACING,
  extendCatalog,
  radiantCatalog,
  validateCatalog
} from '@cognitap/radiant/catalog'

test('installed catalog subpath loads without React, DOM, or protocol dependencies', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { registerHooks } from 'node:module';
    registerHooks({
      resolve(specifier, context, next) {
        assert.ok(
          !/^(?:react(?:-dom)?|motion|@a2ui\\/)(?:\\/|$)/.test(specifier),
          'Catalog entry imported host or protocol dependency: ' + specifier
        );
        return next(specifier, context);
      }
    });
    for (const key of ['window', 'document', 'HTMLElement', 'customElements', 'localStorage']) {
      Object.defineProperty(globalThis, key, {
        get() {
          throw new Error('Catalog entry read browser global: ' + key);
        }
      });
    }
    const catalog = await import('@cognitap/radiant/catalog');
    assert.equal(catalog.validateCatalog(catalog.radiantCatalog).length, 0);
    assert.ok('Choice' in catalog.radiantCatalog.entries);
  `
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: new URL('.', import.meta.url),
    stdio: 'pipe'
  })
})

test('core package entry does not expose catalog symbols and catalog rejects forbidden props', () => {
  assert.equal('radiantCatalog' in core, false)
  assert.equal('extendCatalog' in core, false)
  assert.deepEqual(validateCatalog(radiantCatalog), [])
  assert.deepEqual(CHOICE_PRESENTATIONS, ['segmented', 'chips', 'cards', 'dropdown'])
  assert.deepEqual(CATALOG_SPACING, ['tight', 'normal', 'airy'])

  assert.throws(
    () =>
      extendCatalog(radiantCatalog, {
        id: 'consumer/invalid',
        version: '1.0.0',
        entries: {
          BadCard: {
            name: 'BadCard',
            category: 'layout',
            description: 'Attempts to expose className.',
            propsSchema: {
              type: 'object',
              additionalProperties: false,
              properties: { className: { type: 'string' } }
            },
            slots: {},
            bindings: {},
            actions: {}
          }
        }
      }),
    /forbidden/
  )
})
