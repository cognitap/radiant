import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  radiantA2uiRegistry,
  validateA2uiAccessibility
} from '@cognitap/radiant/a2ui'

test('core package entry never imports @a2ui/web_core or the a2ui subpath', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { registerHooks } from 'node:module';
    registerHooks({
      resolve(specifier, context, next) {
        assert.ok(
          !/^@a2ui\\//.test(specifier) && !specifier.includes('/a2ui/'),
          'Core entry imported A2UI runtime: ' + specifier
        );
        return next(specifier, context);
      }
    });
    const core = await import('@cognitap/radiant');
    assert.equal('A2uiSurface' in core, false);
    assert.equal('radiantA2uiRegistry' in core, false);
  `
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: new URL('.', import.meta.url),
    stdio: 'pipe'
  })
})

test('installed @cognitap/radiant/a2ui renders a surface on the server and ships catalog.json', () => {
  const html = renderToStaticMarkup(
    h(A2uiSurface, {
      surfaceId: 'welcome',
      messages: [
        {
          version: A2UI_PROTOCOL_VERSION,
          createSurface: {
            surfaceId: 'welcome',
            catalogId: A2UI_BASIC_CATALOG_ID,
            dataModel: { user: { name: 'Ada' } },
            components: [
              { id: 'root', component: 'Column', children: ['greeting', 'name_input', 'go_btn'] },
              { id: 'greeting', component: 'Text', text: 'Welcome back' },
              {
                id: 'name_input',
                component: 'TextField',
                label: 'Name',
                value: { '@path': '/user/name' }
              },
              {
                id: 'go_btn',
                component: 'Button',
                child: 'go_label',
                action: {
                  event: { name: 'continue', context: { name: { '@path': '/user/name' } } }
                }
              },
              { id: 'go_label', component: 'Text', text: 'Continue' }
            ]
          }
        }
      ]
    })
  )
  assert.match(html, /data-slot="a2ui-surface"/)
  assert.match(html, /Welcome back/)
  assert.match(html, /<input\b[^>]*value="Ada"/)
  assert.match(html, /Continue/)

  const shippedJson = JSON.parse(
    readFileSync(new URL(import.meta.resolve('@cognitap/radiant/a2ui/catalog.json')), 'utf8')
  )
  assert.deepEqual(shippedJson, radiantA2uiRegistry.toCatalogJson())
})

test('installed @cognitap/radiant/a2ui validates surface accessibility on the server', () => {
  const messages = [
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId: 'signup',
        catalogId: A2UI_BASIC_CATALOG_ID,
        components: [{ id: 'email', component: 'TextField', placeholder: 'Email' }]
      }
    }
  ]
  const result = validateA2uiAccessibility(messages, { fix: true })
  assert.deepEqual(result.errors, [
    {
      surfaceId: 'signup',
      nodeId: 'email',
      component: 'TextField',
      rule: 'control-label',
      prop: 'label',
      message: 'TextField "email" has no label.',
      fixable: true
    }
  ])
  assert.equal('label' in messages[0]!.createSurface.components[0]!, false)
  assert.equal(validateA2uiAccessibility(result.messages).errors.length, 0)
})

test('the lucide icon adapter is a separate subpath that needs the optional lucide-react peer', async () => {
  const manifest = JSON.parse(
    readFileSync(new URL('node_modules/@cognitap/radiant/package.json', import.meta.url), 'utf8')
  )
  assert.equal(manifest.peerDependenciesMeta['lucide-react'].optional, true)
  assert.ok(manifest.exports['./a2ui/lucide'])
  await assert.rejects(import('@cognitap/radiant/a2ui/lucide'), /lucide-react/)
})
