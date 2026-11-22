import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PUBLIC_THEME_TOKENS, defaultTheme, themeTokenVar } from '@cognitap/radiant'
import { themes } from '@cognitap/radiant/examples'
import {
  extendCatalog,
  radiantCatalog,
  renderCatalogGuidance,
  renderCatalogInstructions,
  validateCatalog,
  type CatalogEntry
} from '@cognitap/radiant/catalog'
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  createA2uiExtensionEntry,
  createA2uiExtensionRegistry,
  createA2uiRegistry,
  radiantA2uiExtensionRegistry,
  radiantA2uiRegistry,
  readA2uiValue,
  runA2uiAction,
  validateA2uiAccessibility,
  writeA2uiBinding,
  type A2uiAccessibilityRule,
  type A2uiActionPayload
} from '@cognitap/radiant/a2ui'

// An application outside Radiant: only public exports, its own component and catalog id.
const HOST_CATALOG_ID = 'https://app.example/a2ui/catalog.json'

const gaugeEntry: CatalogEntry = {
  name: 'Gauge',
  category: 'data',
  description: 'Shows one value on a fixed range as a filled arc.',
  guidance: {
    whenToUse: 'One value against a known maximum. Set `max` when it is not 100.',
    whenNotToUse: 'Trends over time or several values.',
    examples: ['disk usage, `max: 100`', 'tasks done, `max: 12`']
  },
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['label', 'value'],
    properties: {
      label: { type: 'string', minLength: 1, description: 'Accessible name.' },
      value: { type: 'number', minimum: 0, description: 'Current value.' },
      max: { type: 'number', exclusiveMinimum: 0, default: 100, description: 'Range maximum.' },
      tone: {
        type: 'string',
        enum: ['accent', 'neutral', 'warning', 'danger'],
        default: 'accent',
        description: 'Semantic palette intent.'
      }
    }
  },
  slots: {},
  bindings: {
    value: {
      description: 'Current value from surface state.',
      valueType: 'number',
      direction: 'read'
    }
  },
  actions: {}
}

const appCatalog = extendCatalog(radiantCatalog, {
  id: 'app/gauges',
  version: '1.0.0',
  entries: { Gauge: gaugeEntry }
})

function Gauge({ label, value, max }: { label: string; value: number; max: number }) {
  const turn = Math.min(Math.max(value / max, 0), 1)
  return h(
    'svg',
    { role: 'img', 'aria-label': label, viewBox: '0 0 36 36', 'data-app': 'gauge' },
    h('circle', {
      cx: 18,
      cy: 18,
      r: 16,
      pathLength: 1,
      style: { fill: 'none', stroke: themeTokenVar('--rad-color-neutral') }
    }),
    h('circle', {
      cx: 18,
      cy: 18,
      r: 16,
      pathLength: 1,
      strokeDasharray: `${turn} 1`,
      style: { fill: 'none', stroke: themeTokenVar('--rad-color-accent') }
    })
  )
}

const gaugeLabel: A2uiAccessibilityRule = {
  id: 'gauge-label',
  check: component =>
    typeof component.label === 'string' && component.label.trim()
      ? undefined
      : { prop: 'label', message: `Gauge "${String(component.id)}" has no label.` }
}

const gauge = createA2uiExtensionEntry(appCatalog, {
  name: 'Gauge',
  component: Gauge,
  accessibility: [gaugeLabel],
  adapter(props) {
    const label = readA2uiValue(props.label)
    const value = readA2uiValue(props.value)
    const max = readA2uiValue(props.max)
    return h(Gauge, {
      label: typeof label === 'string' ? label : '',
      value: typeof value === 'number' ? value : 0,
      max: typeof max === 'number' ? max : 100
    })
  }
})

const appRegistry = createA2uiExtensionRegistry(appCatalog, {
  catalogId: HOST_CATALOG_ID,
  title: 'App catalog',
  entries: [gauge]
})

const surface = (
  components: readonly Record<string, unknown>[],
  catalogId = HOST_CATALOG_ID,
  dataModel?: Record<string, unknown>
) => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: 'usage',
      catalogId,
      ...(dataModel ? { dataModel } : {}),
      components
    }
  }
]

test('an app entry joins the canonical catalog JSON, its guidance and its validator', () => {
  assert.deepEqual(validateCatalog(appCatalog), [])
  assert.equal(appCatalog.extends, radiantCatalog.id)
  const json = JSON.parse(JSON.stringify(appCatalog))
  assert.equal(json.entries.Gauge.guidance.examples[1], 'tasks done, `max: 12`')
  assert.ok(json.entries.Button, 'Radiant entries stay in the extended catalog')
  assert.match(renderCatalogGuidance(appCatalog), /Gauge[\s\S]*One value against a known maximum/)

  const unguided = { ...gaugeEntry, name: 'Dial', guidance: { whenToUse: 'x' } }
  assert.throws(
    () =>
      extendCatalog(radiantCatalog, {
        id: 'app/bad',
        version: '1.0.0',
        entries: { Dial: unguided as unknown as CatalogEntry }
      }),
    /Dial: guidance\.whenNotToUse must be a non-empty string/
  )
  const unschemed = { ...gaugeEntry, name: 'Dial', propsSchema: undefined }
  assert.throws(
    () =>
      extendCatalog(radiantCatalog, {
        id: 'app/bad',
        version: '1.0.0',
        entries: { Dial: unschemed as unknown as CatalogEntry }
      }),
    /Dial: propsSchema must be an object schema/
  )
})

test('app entries cannot shadow Radiant entries in the catalog or the registry', () => {
  assert.throws(
    () =>
      extendCatalog(radiantCatalog, {
        id: 'app/shadow',
        version: '1.0.0',
        entries: { Button: { ...gaugeEntry, name: 'Button' } }
      }),
    /cannot shadow base entries: Button/
  )
  assert.throws(
    () =>
      createA2uiExtensionEntry(appCatalog, {
        name: 'Button',
        component: Gauge,
        adapter: () => null,
        accessibility: []
      }),
    /"Button" is a Radiant entry/
  )
  assert.throws(
    () =>
      createA2uiRegistry({
        catalogId: HOST_CATALOG_ID,
        title: 'App catalog',
        description: 'Shadowing attempt.',
        entries: [...Object.values(radiantA2uiRegistry.entries), { ...gauge, name: 'Text' }]
      }),
    /Duplicate A2UI registry entry "Text"; an entry cannot shadow/
  )
  assert.throws(
    () =>
      createA2uiExtensionEntry(appCatalog, {
        name: 'Select',
        component: Gauge,
        adapter: () => null,
        accessibility: []
      }),
    /"Select" is a Radiant entry/
  )
  assert.throws(
    () =>
      createA2uiExtensionRegistry(appCatalog, {
        catalogId: HOST_CATALOG_ID,
        entries: [{ ...gauge, name: 'Switch' }]
      }),
    /Duplicate A2UI registry entry "Switch"; an entry cannot shadow/
  )
  assert.throws(
    () =>
      createA2uiExtensionRegistry(appCatalog, { catalogId: 'urn:x', entries: 'Gauge' as never }),
    /requires an input with an entries array/
  )
  assert.throws(
    () =>
      createA2uiExtensionRegistry(appCatalog, {
        catalogId: HOST_CATALOG_ID,
        entries: [{ ...gauge, name: 'Dial' }]
      }),
    /Catalog has no entry for "Dial"/
  )
})

test('an app A2UI entry needs a catalog entry, an adapter and accessibility rules', () => {
  assert.throws(
    () => createA2uiExtensionEntry(appCatalog, undefined as never),
    /requires an entry input object/
  )
  assert.throws(
    () => createA2uiExtensionEntry(appCatalog, { component: Gauge } as never),
    /requires the name of a catalog entry/
  )
  assert.throws(
    () =>
      createA2uiExtensionEntry(appCatalog, {
        name: 'Dial',
        component: Gauge,
        adapter: () => null,
        accessibility: []
      }),
    /Catalog has no entry "Dial"; add it with extendCatalog/
  )
  const { accessibility: _omitRules, ...withoutRules } = {
    name: 'Gauge',
    component: Gauge,
    adapter: () => null,
    accessibility: []
  }
  assert.throws(
    () => createA2uiExtensionEntry(appCatalog, withoutRules as never),
    /"Gauge" must declare accessibility rules/
  )
  assert.throws(
    () =>
      createA2uiExtensionEntry(appCatalog, {
        name: 'Gauge',
        component: Gauge,
        accessibility: []
      } as never),
    /"Gauge" requires an adapter function/
  )
})

test('the host catalog document carries the app entry with generated schema and guidance', () => {
  const document = appRegistry.toCatalogJson()
  assert.equal(document.catalogId, HOST_CATALOG_ID)
  const component = document.components.Gauge as {
    description: string
    properties: Record<string, unknown>
    required: string[]
  }
  assert.match(component.description, /One value against a known maximum/)
  assert.deepEqual(Object.keys(component.properties).sort(), [
    'component',
    'label',
    'max',
    'tone',
    'value',
    'weight'
  ])
  assert.deepEqual(component.required, ['component', 'label', 'value'])
  assert.ok(
    (component.properties.value as { anyOf?: unknown[] }).anyOf,
    'a prop that shares a binding name accepts a literal or a binding'
  )
  assert.ok(document.components.Button, 'basic components share the document')
  assert.ok(document.components.Switch, 'Radiant extension components share the document')
  assert.equal(document.title, 'App catalog')
  assert.equal(appRegistry.extends, radiantA2uiExtensionRegistry)

  const lines = document.instructions!.split('\n')
  const tone = renderCatalogInstructions({ topics: ['tone'] })
  for (const line of [...radiantA2uiExtensionRegistry.instructions!.split('\n'), tone]) {
    assert.ok(lines.includes(line), `instructions keep ${line}`)
  }
  assert.equal(new Set(lines).size, lines.length, 'instructions repeat no rule')
  assert.ok(
    radiantA2uiExtensionRegistry.instructions!.includes(tone),
    'feedback entries bring tone, so Gauge adds no second copy'
  )
  assert.ok(
    (document.$defs.anyComponent as { oneOf: { $ref: string }[] }).oneOf.some(
      ref => ref.$ref === '#/components/Gauge'
    )
  )
})

test('A2uiSurface renders the app entry beside Radiant entries under the host catalog id', () => {
  const html = renderToStaticMarkup(
    h(A2uiSurface, {
      surfaceId: 'usage',
      registry: appRegistry,
      messages: surface([
        { id: 'root', component: 'Column', children: ['title', 'disk'] },
        { id: 'title', component: 'Text', text: 'Storage' },
        { id: 'disk', component: 'Gauge', label: 'Disk usage', value: 42 }
      ])
    })
  )
  assert.match(html, /Storage/)
  assert.match(html, /<svg[^>]*role="img"[^>]*aria-label="Disk usage"[^>]*data-app="gauge"/)
  assert.match(html, /stroke-dasharray="0\.42 1"/)
  assert.match(html, /stroke:var\(--rad-color-accent\)/)
})

test('the host registry renders basic surfaces and mixes basic, extension and app components', () => {
  const basic = renderToStaticMarkup(
    h(A2uiSurface, {
      surfaceId: 'usage',
      registry: appRegistry,
      messages: surface(
        [{ id: 'root', component: 'Text', text: 'Basic only' }],
        A2UI_BASIC_CATALOG_ID
      )
    })
  )
  assert.match(basic, /Basic only/)

  const diagnostics: unknown[] = []
  const mixed = renderToStaticMarkup(
    h(A2uiSurface, {
      surfaceId: 'usage',
      registry: appRegistry,
      onDiagnostic: diagnostic => diagnostics.push(diagnostic),
      messages: surface(
        [
          { id: 'root', component: 'Column', children: ['title', 'alerts', 'disk'] },
          { id: 'title', component: 'Text', text: 'Storage' },
          { id: 'alerts', component: 'Switch', label: 'Alerts', checked: { '@path': '/alerts' } },
          { id: 'disk', component: 'Gauge', label: 'Disk usage', value: { '@path': '/disk' } }
        ],
        HOST_CATALOG_ID,
        { alerts: true, disk: 42 }
      )
    })
  )
  assert.match(mixed, /Storage/)
  assert.match(mixed, /role="switch"[^>]*checked=""|checked=""[^>]*role="switch"/)
  assert.match(mixed, /aria-label="Disk usage"/)
  assert.match(mixed, /stroke-dasharray="0\.42 1"/, 'readA2uiValue reads the bound app prop')
  assert.deepEqual(diagnostics, [])
})

test('validateA2uiAccessibility runs the app entry rules', () => {
  const messages = surface([
    { id: 'root', component: 'Column', children: ['disk'] },
    { id: 'disk', component: 'Gauge', label: ' ', value: 42 }
  ])
  const { errors } = validateA2uiAccessibility(messages, { registry: appRegistry })
  assert.deepEqual(
    errors.map(error => [error.nodeId, error.rule, error.prop]),
    [['disk', 'gauge-label', 'label']]
  )
  assert.equal(validateA2uiAccessibility(messages).errors.length, 0, 'Radiant alone skips Gauge')
})

test('every theme and mode sets each public token', () => {
  assert.equal(new Set(PUBLIC_THEME_TOKENS).size, PUBLIC_THEME_TOKENS.length)
  for (const theme of [defaultTheme, ...themes]) {
    for (const mode of ['light', 'dark'] as const) {
      for (const token of PUBLIC_THEME_TOKENS) {
        const value = String(theme.modes[mode][token] ?? '').trim()
        assert.ok(value, `${theme.id}/${mode} lacks ${token}`)
        assert.doesNotMatch(
          value,
          /^(?:initial|unset|inherit|revert)$/,
          `${theme.id}/${mode}: ${token}`
        )
      }
    }
  }
  assert.equal(themeTokenVar('--rad-color-accent'), 'var(--rad-color-accent)')
  assert.equal(themeTokenVar('--rad-spacing-tight', '0.5rem'), 'var(--rad-spacing-tight, 0.5rem)')
})

test('app adapters read and write surface state and run actions through public helpers', async () => {
  const tallyCatalog = extendCatalog(radiantCatalog, {
    id: 'app/tally',
    version: '1.0.0',
    entries: {
      Tally: {
        name: 'Tally',
        category: 'input',
        description: 'Counts taps and saves the total.',
        guidance: {
          whenToUse: 'A count the user raises one step at a time.',
          whenNotToUse: 'Free numeric entry.',
          examples: ['cups of water', 'laps run']
        },
        propsSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['label'],
          properties: { label: { type: 'string', minLength: 1, description: 'Visible name.' } }
        },
        slots: {},
        bindings: {
          count: { description: 'Current total.', valueType: 'number', direction: 'two-way' }
        },
        actions: { save: { description: 'Saves the total.', scope: 'outbound' } }
      }
    }
  })
  const handles: { add?: () => boolean; save?: () => Promise<boolean>; count?: unknown } = {}
  const tally = createA2uiExtensionEntry(tallyCatalog, {
    name: 'Tally',
    component: 'output',
    accessibility: [],
    adapter: props => {
      const count = readA2uiValue(props.count)
      handles.count = count
      handles.add = () => writeA2uiBinding(props.count, Number(count) + 1)
      handles.save = () => runA2uiAction(props.save)
      return h('output', null, `${String(readA2uiValue(props.label))}: ${String(count)}`)
    }
  })
  assert.deepEqual(Object.keys((tally.schema as { properties: object }).properties).sort(), [
    'component',
    'count',
    'label',
    'save',
    'weight'
  ])
  const registry = createA2uiExtensionRegistry(tallyCatalog, {
    catalogId: HOST_CATALOG_ID,
    entries: [tally]
  })
  const actions: A2uiActionPayload[] = []
  const html = renderToStaticMarkup(
    h(A2uiSurface, {
      surfaceId: 'water',
      registry,
      onAction: action => actions.push(action),
      messages: [
        {
          version: A2UI_PROTOCOL_VERSION,
          createSurface: {
            surfaceId: 'water',
            catalogId: HOST_CATALOG_ID,
            dataModel: { cups: 2 },
            components: [
              {
                id: 'root',
                component: 'Tally',
                label: 'Cups',
                count: { '@path': '/cups' },
                save: { event: { name: 'save_cups', context: { cups: { '@path': '/cups' } } } }
              }
            ]
          }
        }
      ]
    })
  )
  assert.match(html, /<output>Cups: 2<\/output>/)
  assert.equal(handles.add?.(), true, 'the two-way binding is writable')
  assert.equal(writeA2uiBinding('literal', 1), false)
  assert.equal(await handles.save?.(), true)
  assert.equal(await runA2uiAction(undefined), false)
  assert.equal(actions.length, 1)
  assert.equal(actions[0]!.action, 'save_cups')
  assert.equal(actions[0]!.nodeId, 'root')
  assert.equal(actions[0]!.surfaceId, 'water')
  assert.deepEqual(actions[0]!.state, { cups: 3 })
  assert.deepEqual(actions[0]!.context, { cups: 3 })
})
