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
  // Basic-catalog functions load too; openUrl is left to the host
  const functionNames = [...parsed.functions.keys()]
  assert.ok(functionNames.includes('required') && functionNames.includes('email'))
  assert.ok(!functionNames.includes('openUrl'))
  assert.deepEqual(
    onDisk.$defs.anyFunction.oneOf.map(ref => ref.$ref),
    Object.keys(onDisk.functions).map(name => `#/functions/${name}`)
  )
  const executable = radiantA2uiRegistry.toWebCoreCatalog('de-DE')
  assert.deepEqual([...executable.functions.keys()].sort(), [...functionNames].sort())
})

test('createA2uiRegistryEntry rejects forbidden host styling, render, handler, and ARIA props', () => {
  for (const forbidden of ['className', 'style', 'render', 'aria-label', 'role', 'onClick']) {
    assert.throws(
      () =>
        createA2uiRegistryEntry({
          name: 'BadWidget',
          accessibility: [],
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

test('wire message cloning detaches nested values and isMessagePrefix matches identical, appended, repeated, and edited histories', async () => {
  const { cloneMessageValue, isMessagePrefix } =
    await import('../dist/library/a2ui/surfaceRuntime.js')

  const createMsg = {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: 's_history',
      catalogId: radiantA2uiRegistry.catalogId,
      dataModel: { draft: { note: 'Initial', tags: ['v1'] } },
      components: [{ id: 'root', component: 'Column', children: [] }]
    }
  }
  const updateDataMsg = {
    version: A2UI_PROTOCOL_VERSION,
    updateDataModel: {
      surfaceId: 's_history',
      path: '/draft',
      value: { note: 'Seeded', tags: ['a', 'b'] }
    }
  }
  const updateCompMsg = {
    version: A2UI_PROTOCOL_VERSION,
    updateComponents: {
      surfaceId: 's_history',
      components: [{ id: 'status', component: 'Text', text: 'Updated' }]
    }
  }

  // Cloning detaches nested objects and arrays in createSurface and updateDataModel
  const baseHistory = [createMsg, updateDataMsg]
  const detached = baseHistory.map(message => cloneMessageValue(message))
  detached[0].createSurface.dataModel.draft.note = 'Mutated locally'
  detached[0].createSurface.dataModel.draft.tags.push('mutated')
  detached[1].updateDataModel.value.note = 'Mutated update'
  detached[1].updateDataModel.value.tags[0] = 'z'
  assert.equal(createMsg.createSurface.dataModel.draft.note, 'Initial')
  assert.deepEqual(createMsg.createSurface.dataModel.draft.tags, ['v1'])
  assert.equal(updateDataMsg.updateDataModel.value.note, 'Seeded')
  assert.deepEqual(updateDataMsg.updateDataModel.value.tags, ['a', 'b'])

  // Identical recreated history matches as a no-op prefix
  assert.equal(isMessagePrefix(baseHistory, structuredClone(baseHistory)), true)

  // Unchanged prefix with an appended mixed suffix matches
  const withSuffix = [
    ...structuredClone(baseHistory),
    updateCompMsg,
    structuredClone(updateDataMsg)
  ]
  assert.equal(isMessagePrefix(baseHistory, withSuffix), true)

  // Repeated payloads at different positions preserve exact positional ordering
  assert.equal(
    isMessagePrefix(
      [createMsg, updateDataMsg, updateCompMsg],
      [createMsg, updateDataMsg, updateDataMsg, updateCompMsg]
    ),
    false
  )
  assert.equal(
    isMessagePrefix(
      [createMsg, updateDataMsg, updateDataMsg],
      [createMsg, updateDataMsg, updateDataMsg, updateCompMsg]
    ),
    true
  )

  // Editing an earlier message or shortening history fails prefix matching
  const editedEarlier = structuredClone(withSuffix)
  editedEarlier[1].updateDataModel.value.note = 'Changed earlier'
  assert.equal(isMessagePrefix(baseHistory, editedEarlier), false)
  assert.equal(isMessagePrefix(withSuffix, baseHistory), false)

  // Deep JSON (> 64 levels) detaches and compares structurally across full depth
  const buildDeep = (depth, leaf) => {
    let current = { leaf }
    for (let i = 0; i < depth; i++) current = { nested: current }
    return current
  }
  const deepA = {
    version: A2UI_PROTOCOL_VERSION,
    updateDataModel: { surfaceId: 's_history', path: '/deep', value: buildDeep(75, 'ok') }
  }
  const deepB = cloneMessageValue(deepA)
  assert.equal(isMessagePrefix([deepA], [deepB]), true)
  let cursor = deepB.updateDataModel.value
  for (let i = 0; i < 75; i++) cursor = cursor.nested
  cursor.leaf = 'changed'
  assert.equal(isMessagePrefix([deepA], [deepB]), false)
  let origCursor = deepA.updateDataModel.value
  for (let i = 0; i < 75; i++) origCursor = origCursor.nested
  assert.equal(origCursor.leaf, 'ok')

  // Cloning preserves own JSON keys named "__proto__" on both structuredClone and fallback paths
  const withProto = JSON.parse('{"__proto__":{"role":"admin"},"ok":true}')
  const clonedProto = cloneMessageValue(withProto)
  assert.equal(Object.hasOwn(clonedProto, '__proto__'), true)
  assert.deepEqual(clonedProto['__proto__'], { role: 'admin' })
  assert.notEqual(clonedProto['__proto__'], withProto['__proto__'])
  assert.equal(
    isMessagePrefix(
      [{ version: A2UI_PROTOCOL_VERSION, updateDataModel: { surfaceId: 's', value: withProto } }],
      [{ version: A2UI_PROTOCOL_VERSION, updateDataModel: { surfaceId: 's', value: clonedProto } }]
    ),
    true
  )

  const withProtoAndFn = Object.assign(JSON.parse('{"__proto__":{"flag":1}}'), {
    fn: () => {}
  })
  const fallbackClone = cloneMessageValue(withProtoAndFn)
  assert.equal(Object.hasOwn(fallbackClone, '__proto__'), true)
  assert.deepEqual(fallbackClone['__proto__'], { flag: 1 })
  assert.notEqual(fallbackClone['__proto__'], withProtoAndFn['__proto__'])

  // Cyclic objects and arrays terminate cleanly for both equivalent cycles and real differences
  const cycleA = { label: 'same' }
  cycleA.self = cycleA
  const cycleB = cloneMessageValue(cycleA)
  const cycleC = { label: 'same' }
  cycleC.self = cycleC
  const cycleDiff = { label: 'different' }
  cycleDiff.self = cycleDiff
  const wrap = value => [
    { version: A2UI_PROTOCOL_VERSION, updateDataModel: { surfaceId: 's', value } }
  ]
  assert.equal(isMessagePrefix(wrap(cycleA), wrap(cycleB)), true)
  assert.equal(isMessagePrefix(wrap(cycleA), wrap(cycleC)), true)
  assert.equal(isMessagePrefix(wrap(cycleA), wrap(cycleDiff)), false)

  const arrA = [1]
  arrA.push(arrA)
  const arrB = [1]
  arrB.push(arrB)
  const arrDiff = [2]
  arrDiff.push(arrDiff)
  assert.equal(isMessagePrefix(wrap(arrA), wrap(arrB)), true)
  assert.equal(isMessagePrefix(wrap(arrA), wrap(arrDiff)), false)
})

test('the extension registry extends the basic registry and publishes its own catalog', async () => {
  const {
    A2UI_BASIC_CATALOG_ID,
    RADIANT_A2UI_EXTENSION_CATALOG_ID,
    createA2uiRegistry,
    findA2uiRegistry,
    radiantA2uiExtensionRegistry: extension
  } = await import('../dist/library/a2ui/index.js')
  const { a2uiWebCoreCatalogs } = await import('../dist/library/a2ui/registry.js')
  const onDisk = JSON.parse(
    readFileSync(new URL('../src/a2ui/extension-catalog.json', import.meta.url), 'utf8')
  )
  assert.deepEqual(onDisk, extension.toCatalogJson())
  assert.equal(onDisk.catalogId, RADIANT_A2UI_EXTENSION_CATALOG_ID)
  for (const name of [...Object.keys(radiantA2uiRegistry.entries), 'Select', 'Switch']) {
    assert.ok(onDisk.components[name], `${name} is in the extension catalog`)
  }
  assert.deepEqual(
    Object.keys(onDisk.functions),
    Object.keys(radiantA2uiRegistry.toCatalogJson().functions)
  )
  assert.deepEqual(
    a2uiWebCoreCatalogs(extension).map(catalog => catalog.id),
    [A2UI_BASIC_CATALOG_ID, RADIANT_A2UI_EXTENSION_CATALOG_ID]
  )
  assert.equal(findA2uiRegistry(extension, A2UI_BASIC_CATALOG_ID), radiantA2uiRegistry)
  assert.ok(extension.instructions.startsWith(radiantA2uiRegistry.instructions))
  const app = createA2uiRegistry({
    catalogId: 'example/app',
    title: 'App',
    description: 'App.',
    extends: extension,
    entries: [{ ...radiantA2uiRegistry.entries.Text, name: 'Note' }]
  })
  assert.equal(app.instructions, extension.instructions)
  assert.equal(app.entries.Row, extension.entries.Row)
  assert.equal(app.toCatalogJson().components.Row.properties.wrap.default, false)
  assert.deepEqual(
    a2uiWebCoreCatalogs(app).map(catalog => [catalog.id, catalog.functions.has('required')]),
    [
      [A2UI_BASIC_CATALOG_ID, true],
      [RADIANT_A2UI_EXTENSION_CATALOG_ID, true],
      ['example/app', true]
    ]
  )

  const base = { catalogId: 'example/x', title: 'X', description: 'X.', extends: extension }
  assert.throws(
    () => createA2uiRegistry({ ...base, entries: [radiantA2uiRegistry.entries.Text] }),
    /Duplicate A2UI registry entry "Text"/
  )
  assert.throws(
    () =>
      createA2uiRegistry({
        ...base,
        catalogId: A2UI_BASIC_CATALOG_ID,
        entries: [{ ...radiantA2uiRegistry.entries.Text, name: 'Note' }]
      }),
    /already extended/
  )
})

test('extension coercion scopes components to the catalog their surface names', async () => {
  const { radiantA2uiExtensionRegistry, RADIANT_A2UI_EXTENSION_CATALOG_ID } =
    await import('../dist/library/a2ui/index.js')
  const surface = catalogId => ({
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: 's',
      catalogId,
      components: [{ id: 'root', component: 'Switch', label: 'Dark mode', controlSize: 'huge' }]
    }
  })
  const basic = coerceA2uiMessages(
    [surface(radiantA2uiRegistry.catalogId)],
    radiantA2uiExtensionRegistry
  )
  assert.equal(basic.messages[0].createSurface.components[0].component, 'Text')
  const ext = coerceA2uiMessages(
    [surface(RADIANT_A2UI_EXTENSION_CATALOG_ID)],
    radiantA2uiExtensionRegistry
  )
  assert.equal(ext.messages[0].createSurface.components[0].controlSize, 'medium')
  assert.ok(ext.diagnostics.some(d => d.prop === 'controlSize' && d.kind === 'coerced'))
})

test('the extension catalog overrides the basic Row with wrap, scoped to its own catalog', async () => {
  const { radiantA2uiExtensionRegistry: extension, RADIANT_A2UI_EXTENSION_CATALOG_ID } =
    await import('../dist/library/a2ui/index.js')
  const { createOverridingA2uiRegistry } = await import('../dist/library/a2ui/registry.js')
  assert.equal(radiantA2uiRegistry.toCatalogJson().components.Row.properties.wrap, undefined)
  assert.equal(extension.toCatalogJson().components.Row.properties.wrap.default, false)
  assert.notEqual(extension.entries.Row, radiantA2uiRegistry.entries.Row)
  assert.equal(extension.entries.Column, radiantA2uiRegistry.entries.Column)

  const row = catalogId => ({
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: 's',
      catalogId,
      components: [{ id: 'root', component: 'Row', wrap: true, children: [] }]
    }
  })
  const basic = coerceA2uiMessages([row(radiantA2uiRegistry.catalogId)], extension)
  assert.equal(basic.messages[0].createSurface.components[0].wrap, undefined)
  assert.ok(basic.diagnostics.some(d => d.prop === 'wrap' && d.kind === 'stripped'))
  const ext = coerceA2uiMessages([row(RADIANT_A2UI_EXTENSION_CATALOG_ID)], extension)
  assert.equal(ext.messages[0].createSurface.components[0].wrap, true)

  const base = { catalogId: 'example/x', title: 'X', description: 'X.', extends: extension }
  const note = { ...radiantA2uiRegistry.entries.Text, name: 'Note' }
  assert.throws(
    () => createOverridingA2uiRegistry({ ...base, entries: [note] }, ['Missing']),
    /override "Missing" names no entry/
  )
  assert.throws(
    () => createOverridingA2uiRegistry({ ...base, entries: [note] }, ['Text']),
    /overrides Text without an entry/
  )
  const text = radiantA2uiRegistry.entries.Text
  assert.throws(
    () => createOverridingA2uiRegistry({ ...base, entries: [text, text] }, ['Text']),
    /Duplicate A2UI registry entry "Text"/
  )
  const overridden = createOverridingA2uiRegistry({ ...base, entries: [text] }, ['Text'])
  assert.equal(overridden.entries.Text.adapter, text.adapter)
})

test('components naming an unknown catalog degrade, and accessibility follows the surface catalog', async () => {
  const {
    radiantA2uiExtensionRegistry,
    RADIANT_A2UI_EXTENSION_CATALOG_ID,
    validateA2uiAccessibility
  } = await import('../dist/library/a2ui/index.js')
  const surface = (catalogId, extra = {}) => ({
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: 's',
      catalogId,
      components: [{ id: 'root', component: 'Select', label: '', items: [], ...extra }]
    }
  })
  for (const catalogId of ['example/missing', '']) {
    const { messages, diagnostics } = coerceA2uiMessages(
      [surface(RADIANT_A2UI_EXTENSION_CATALOG_ID, { catalogId })],
      radiantA2uiExtensionRegistry
    )
    const [root] = messages[0].createSurface.components
    assert.equal(root.component, 'Text')
    assert.equal('catalogId' in root, false)
    assert.ok(diagnostics.some(d => d.code === 'UNKNOWN_COMPONENT_TYPE'))
  }
  const rules = catalogId => validateA2uiAccessibility([surface(catalogId)]).errors.map(e => e.rule)
  assert.deepEqual(rules(RADIANT_A2UI_EXTENSION_CATALOG_ID), ['control-label'])
  assert.deepEqual(rules(radiantA2uiRegistry.catalogId), [])
})
