import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  radiantA2uiRegistry,
  validateA2uiAccessibility,
  type A2uiActionPayload,
  type A2uiMessage,
  type A2uiSurfaceLabels,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import {
  comboboxFixtureMessages,
  EXTENSION_SURFACE_ID,
  radioGroupFixtureMessages,
  selectFixtureMessages,
  sortableListFixtureMessages,
  switchFixtureMessages,
  textareaFixtureMessages
} from '../../src/a2ui/extensionFixtures.js'
import { a2uiWebCoreCatalogs } from '../../src/a2ui/registry.js'
import { key, mount } from './familyHarness.js'

const click = (target: Element) =>
  act(async () => {
    await userEvent.click(target)
  })
const echo = (host: HTMLElement) =>
  host.querySelector('[data-slot="a2ui-text"][data-variant="caption"]')?.textContent

function withControl(
  messages: readonly A2uiMessage[],
  patch: Record<string, unknown>,
  data: Record<string, unknown> = {},
  savePatch: Record<string, unknown> = {}
): A2uiMessage[] {
  const copy = structuredClone(messages) as A2uiMessage[]
  const create = (
    copy[0] as {
      createSurface: {
        components: Record<string, unknown>[]
        dataModel: Record<string, unknown>
      }
    }
  ).createSurface
  Object.assign(
    create.components.find(c => c.id === 'control')!,
    patch
  )
  Object.assign(
    create.components.find(c => c.id === 'save')!,
    savePatch
  )
  Object.assign(create.dataModel, data)
  return copy
}

async function render(messages: readonly A2uiMessage[], labels?: A2uiSurfaceLabels) {
  const diagnostics: CatalogDiagnostic[] = []
  const onAction = vi.fn<(event: A2uiActionPayload) => void>()
  const view = await mount(
    <A2uiSurface
      surfaceId={EXTENSION_SURFACE_ID}
      messages={messages}
      onAction={onAction}
      onDiagnostic={d => diagnostics.push(d)}
      labels={labels}
    />
  )
  return { ...view, diagnostics, onAction }
}

const save = (host: HTMLElement) =>
  click(Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Save')!)

test('Select takes its items from the data model and writes the bound value', async () => {
  const { host, diagnostics, onAction } = await render(selectFixtureMessages)
  const trigger = host.querySelector<HTMLButtonElement>('[data-slot~="select-trigger"]')!
  expect(trigger.textContent).toContain('Hungary')
  expect(trigger.getAttribute('data-control-size')).toBe('large')
  expect(host.textContent).toContain('Used for tax forms.')
  expect(host.textContent).toContain('Account settings')

  await click(trigger)
  const japan = Array.from(host.ownerDocument.querySelectorAll('[role="option"]')).find(o =>
    o.textContent?.startsWith('Japan')
  )!
  await click(japan)
  expect(echo(host)).toBe('jp')
  await save(host)
  expect(onAction.mock.calls[0]![0].context).toEqual({ value: 'jp' })
  expect(diagnostics.filter(d => d.kind === 'error')).toEqual([])
})

test('invalid curated props coerce with diagnostics instead of throwing', async () => {
  const { host, diagnostics } = await render(
    withControl(selectFixtureMessages, { controlSize: 'huge' })
  )
  const trigger = host.querySelector('[data-slot~="select-trigger"]')!
  expect(trigger.getAttribute('data-control-size')).toBe('medium')
  expect(diagnostics).toContainEqual(
    expect.objectContaining({ nodeId: 'control', prop: 'controlSize', received: 'huge' })
  )
})

test('Combobox shows items the host updates and reports committed values', async () => {
  const { host, render: rerender, onAction } = await render(comboboxFixtureMessages)
  const input = host.querySelector<HTMLInputElement>('[data-slot~="combobox-input"]')!
  expect(input.placeholder).toBe('Search cities')

  const results: A2uiMessage[] = [
    ...comboboxFixtureMessages,
    {
      version: A2UI_PROTOCOL_VERSION,
      updateDataModel: {
        surfaceId: EXTENSION_SURFACE_ID,
        path: '/cityResults',
        value: [{ value: 'tok', label: 'Tokyo' }]
      }
    }
  ]
  await rerender(
    <A2uiSurface
      surfaceId={EXTENSION_SURFACE_ID}
      messages={results}
      onAction={onAction}
    />
  )
  await click(input)
  const options = Array.from(host.ownerDocument.querySelectorAll('[role="option"]'))
  expect(options.map(o => o.textContent?.replace('✓', '').trim())).toEqual(['Tokyo'])
  await act(async () => {
    await userEvent.keyboard('{ArrowDown}{Enter}{Escape}')
  })
  await save(host)
  expect(onAction.mock.calls[0]![0].context).toEqual({ value: ['tok'] })
})

test('RadioGroup renders literal options with descriptions and writes the bound value', async () => {
  const { host } = await render(radioGroupFixtureMessages)
  const radios = Array.from(host.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
  expect(radios.map(r => r.value)).toEqual(['solo', 'team', 'org'])
  expect(radios[1]!.checked).toBe(true)
  expect(radios[2]!.disabled).toBe(true)
  expect(host.querySelector('legend')?.textContent).toContain('Plan')
  expect(host.textContent).toContain('Up to ten seats.')
  await click(radios[0]!)
  expect(echo(host)).toBe('solo')
})

test('Switch writes its bound boolean and keeps its curated control size', async () => {
  const { host } = await render(switchFixtureMessages)
  const toggle = host.querySelector<HTMLInputElement>('input[role="switch"]')!
  expect(toggle.getAttribute('data-control-size')).toBe('small')
  expect(toggle.labels?.[0]?.textContent).toContain('Notify me about replies')
  await click(toggle)
  expect(echo(host)).toBe('true')
})

test('Textarea binds text and runs basic-catalog checks', async () => {
  const { host } = await render(textareaFixtureMessages)
  const area = host.querySelector('textarea')!
  expect(area.rows).toBe(3)
  expect(host.textContent).toContain('Write a short bio.')
  expect(area.getAttribute('aria-invalid')).toBe('true')
  await act(async () => {
    await userEvent.fill(area, 'Writes docs.')
  })
  expect(echo(host)).toBe('Writes docs.')
  expect(host.textContent).not.toContain('Write a short bio.')
})

test('a basic-catalog surface treats extension components as unknown', async () => {
  const messages = structuredClone(selectFixtureMessages) as A2uiMessage[]
  ;(messages[0] as { createSurface: { catalogId: string } }).createSurface.catalogId =
    A2UI_BASIC_CATALOG_ID
  const { host, diagnostics } = await render(messages)
  expect(host.querySelector('[data-slot~="select-trigger"]')).toBeNull()
  expect(diagnostics).toContainEqual(
    expect.objectContaining({ code: 'UNKNOWN_COMPONENT_TYPE', component: 'Select' })
  )
  // The basic registry alone never accepts the extension catalog.
  expect(a2uiWebCoreCatalogs(radiantA2uiRegistry)).toHaveLength(1)
})

test('extension controls declare a control-label rule', () => {
  for (const name of ['Select', 'Combobox', 'RadioGroup', 'Switch', 'Textarea']) {
    const { errors } = validateA2uiAccessibility(
      withControl(selectFixtureMessages, { component: name, label: '' })
    )
    expect(errors.map(e => [e.component, e.rule])).toEqual([[name, 'control-label']])
  }
})

const failing = (path: string, message: string) => [
  { condition: { '@call': 'required', args: { value: { '@path': path } } }, message }
]

test.each([
  ['Select', selectFixtureMessages, '/country', { country: '' }],
  ['Combobox', comboboxFixtureMessages, '/cities', { cities: [] }],
  ['RadioGroup', radioGroupFixtureMessages, '/plan', { plan: '' }],
  ['Switch', switchFixtureMessages, '/notify', { notify: false }]
] as const)('%s shows failing checks as its Field error', async (_name, fixture, path, data) => {
  const condition =
    path === '/notify'
      ? [{ condition: { '@path': path }, message: 'Fix this.' }]
      : failing(path, 'Fix this.')
  const { host } = await render(withControl(fixture, { checks: condition }, data))
  expect(host.textContent).toContain('Fix this.')
  expect(host.querySelector('[aria-invalid="true"]')).not.toBeNull()
})

test('a Button with failing checks stays disabled until the bound control passes them', async () => {
  const { host } = await render(
    withControl(
      selectFixtureMessages,
      {},
      { country: '' },
      { checks: failing('/country', 'Pick one.') }
    )
  )
  const save = Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Save')!
  expect(save.disabled).toBe(true)
  await click(host.querySelector('[data-slot~="select-trigger"]')!)
  await click(
    Array.from(host.ownerDocument.querySelectorAll('[role="option"]')).find(o =>
      o.textContent?.startsWith('Japan')
    )!
  )
  expect(save.disabled).toBe(false)
})

test('Select reports a bound value missing from its items', async () => {
  const { diagnostics } = await render(withControl(selectFixtureMessages, {}, { country: 'fr' }))
  await vi.waitFor(() =>
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ code: 'UNKNOWN_VALUE', nodeId: 'control', received: 'fr' })
    )
  )
})

test('Combobox sends its query to the host and shows host results unfiltered', async () => {
  const messages = withControl(
    comboboxFixtureMessages,
    {
      selection: 'single',
      value: { '@path': '/city' },
      query: { '@path': '/cityQuery' },
      loading: { '@path': '/loading' },
      search: {
        event: { name: 'search_cities', context: { query: { '@path': '/cityQuery' } } }
      }
    },
    { city: '', cityQuery: '', loading: false },
    {
      action: { event: { name: 'save_settings', context: { value: { '@path': '/cityQuery' } } } }
    }
  )
  const { host, render: rerender, onAction } = await render(messages)
  const input = host.querySelector<HTMLInputElement>('[data-slot~="combobox-input"]')!
  await click(input)
  await act(async () => {
    await userEvent.keyboard('To')
  })
  expect(input.value).toBe('To')
  await vi.waitFor(() => expect(onAction).toHaveBeenCalledTimes(1), { timeout: 2000 })
  expect(onAction.mock.calls[0]![0].action).toBe('search_cities')
  expect(onAction.mock.calls[0]![0].context).toEqual({ query: 'To' })

  await rerender(
    <A2uiSurface
      surfaceId={EXTENSION_SURFACE_ID}
      onAction={onAction}
      messages={[
        ...messages,
        {
          version: A2UI_PROTOCOL_VERSION,
          updateDataModel: {
            surfaceId: EXTENSION_SURFACE_ID,
            path: '/cityResults',
            value: [
              { value: 'tok', label: 'Tokyo' },
              { value: 'osa', label: 'Osaka' }
            ]
          }
        }
      ]}
    />
  )
  const labels = Array.from(host.ownerDocument.querySelectorAll('[role="option"]')).map(o =>
    o.textContent?.replace('✓', '').trim()
  )
  expect(labels).toEqual(['Tokyo', 'Osaka'])
  expect(onAction).toHaveBeenCalledTimes(1)
})

test('updates held before createSurface are coerced against the catalog it names', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const messages: A2uiMessage[] = [
    {
      version: A2UI_PROTOCOL_VERSION,
      updateComponents: {
        surfaceId: 'held',
        components: [
          { id: 'root', component: 'Column', children: ['pick'] },
          { id: 'pick', component: 'Select', label: 'Pick', items: [{ value: 'a', label: 'A' }] }
        ]
      }
    }
  ]
  const view = await mount(
    <A2uiSurface
      surfaceId="held"
      messages={messages}
      onDiagnostic={d => diagnostics.push(d)}
    />
  )
  await view.render(
    <A2uiSurface
      surfaceId="held"
      onDiagnostic={d => diagnostics.push(d)}
      messages={[
        ...messages,
        {
          version: A2UI_PROTOCOL_VERSION,
          createSurface: { surfaceId: 'held', catalogId: A2UI_BASIC_CATALOG_ID }
        }
      ]}
    />
  )
  expect(view.host.querySelector('[data-slot~="select-trigger"]')).toBeNull()
  expect(view.host.textContent).toContain('Pick')
  expect(diagnostics.filter(d => d.kind === 'error').map(d => [d.code, d.component])).toEqual([
    ['UNKNOWN_COMPONENT_TYPE', 'Select']
  ])
})

const annotated = (props: Record<string, unknown>): A2uiMessage[] => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: EXTENSION_SURFACE_ID,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      components: [{ id: 'root', component: 'AnnotatedText', ...props }]
    }
  }
]

test('AnnotatedText drops invalid data with one coerced report per prop and renumbers the rest', async () => {
  const { host, diagnostics } = await render(
    annotated({
      label: 'Review',
      tokens: [{ text: 'delay', labels: ['binding', ' ', ''] }, { text: ' ' }, { text: 'retry' }],
      spans: [
        { start: 0, end: 2, label: 'Statement', series: 1 },
        { start: 1, end: 1, label: 'Blank', series: 2 },
        { start: 2, end: 0, label: 'Backwards', series: 3 }
      ],
      arcs: [
        { from: 0, to: 2, label: 'assigned from' },
        { from: 2, to: 2 }
      ]
    })
  )
  const tokens = Array.from(host.querySelectorAll('[data-slot~="annotated-text-token"]'))
  expect(tokens.map(token => token.getAttribute('aria-label'))).toEqual(['delay', 'retry'])
  expect(tokens[0]!.querySelector('[data-slot~="annotated-text-description"]')!.textContent).toBe(
    'binding. Statement. delay → retry: assigned from'
  )
  const coerced = diagnostics
    .filter(d => d.component === 'AnnotatedText' && d.kind === 'coerced')
    .map(({ prop, received, used }) => ({ prop, received, used }))
  expect(coerced).toEqual([
    { prop: 'tokens', received: 3, used: 2 },
    { prop: 'tokens.labels', received: 3, used: 1 },
    { prop: 'spans', received: 3, used: 1 },
    { prop: 'arcs', received: 2, used: 1 }
  ])
})

test('AnnotatedText without tokens reports a fallback and renders nothing', async () => {
  const { host, diagnostics } = await render(
    annotated({ label: 'Review', tokens: [{ text: ' ' }] })
  )
  expect(host.querySelector('[data-slot~="annotated-text"]')).toBeNull()
  expect(
    diagnostics.some(
      d => d.component === 'AnnotatedText' && d.kind === 'fallback' && d.prop === 'tokens'
    )
  ).toBe(true)
})

test('the AnnotatedText label rule accepts a bound label and flags a missing one', () => {
  const rules = (label: unknown) =>
    validateA2uiAccessibility(annotated({ label, tokens: [{ text: 'a' }] })).errors.map(
      error => error.rule
    )
  expect(rules({ path: '/title' })).not.toContain('annotated-text-label')
  expect(rules('Review')).not.toContain('annotated-text-label')
  expect(rules(' ')).toContain('annotated-text-label')
})

const sortableLabels: A2uiSurfaceLabels = {
  sortableInstructions: 'Space picks up, arrows move, Space drops, Escape cancels.',
  sortablePickUp: 'Picked up {item}, {position} of {count}.',
  sortableMove: (item, index, count) => `${item}: ${index + 1} of ${count}.`,
  sortableDrop: 'Dropped {item} at {position} of {count}.',
  sortableCancel: 'Cancelled {item}.'
}
const stops = (host: HTMLElement) =>
  Array.from(host.querySelectorAll('[data-slot~="sortable-list-item-content"]'), n => n.textContent)

test('SortableList follows its bound order and writes reorders back', async () => {
  const { host, onAction } = await render(sortableListFixtureMessages, sortableLabels)
  const list = host.querySelector('ol[data-slot~="sortable-list"]')!
  const legend = host.querySelector('legend')!
  expect(legend.textContent).toContain('Order of stops')
  expect(list.getAttribute('aria-labelledby')).toBe(legend.id)
  expect(stops(host)).toEqual(['Market', 'Museum', 'Park'])
  const park = Array.from(
    host.querySelectorAll<HTMLButtonElement>('[data-slot~="sortable-list-handle"]')
  ).at(-1)!
  await act(async () => park.focus())
  await key(' {Home} ')
  expect(stops(host)).toEqual(['Park', 'Market', 'Museum'])
  await expect
    .poll(() => host.querySelector('[data-slot="sortable-list-status"]')!.textContent, {
      timeout: 2_000
    })
    .toBe('Dropped Park at 1 of 3.')
  await save(host)
  expect(onAction.mock.calls.at(-1)?.[0].action).toBe('save_settings')
  expect(onAction.mock.calls.at(-1)?.[0].context).toEqual({ value: ['park', 'market', 'museum'] })
})

test('SortableList appends streamed items and shows a static list without host labels', async () => {
  const { host, render: rerender } = await render(sortableListFixtureMessages, sortableLabels)
  await rerender(
    <A2uiSurface
      surfaceId={EXTENSION_SURFACE_ID}
      labels={sortableLabels}
      messages={[
        ...sortableListFixtureMessages,
        {
          version: A2UI_PROTOCOL_VERSION,
          updateDataModel: {
            surfaceId: EXTENSION_SURFACE_ID,
            path: '/stops',
            value: [
              { value: 'museum', label: 'Museum' },
              { value: 'cafe', label: 'Cafe' },
              { value: 'market', label: 'Market' },
              { value: 'park', label: 'Park' }
            ]
          }
        }
      ]}
    />
  )
  expect(stops(host)).toEqual(['Market', 'Museum', 'Park', 'Cafe'])

  const plain = await render(sortableListFixtureMessages)
  expect(plain.host.querySelector('[data-slot~="sortable-list-handle"]')).toBeNull()
  expect(
    Array.from(
      plain.host.querySelectorAll('[data-slot="a2ui-sortable-list"] li'),
      n => n.textContent
    )
  ).toEqual(['Market', 'Museum', 'Park'])
  await vi.waitFor(() =>
    expect(plain.diagnostics).toContainEqual(
      expect.objectContaining({ kind: 'defaulted', component: 'SortableList', nodeId: 'control' })
    )
  )
})

test('SortableList drops repeated and unknown bound values and fills templates once', async () => {
  const { host } = await render(
    withControl(sortableListFixtureMessages, {}, { route: ['park', 'park', 'zoo', 'market'] }),
    {
      ...sortableLabels,
      sortablePickUp: 'Picked up {item} at {position}/{count}.',
      sortableHandle: 'Move {item}'
    }
  )
  expect(stops(host)).toEqual(['Park', 'Market', 'Museum'])
  expect(host.querySelectorAll('[data-slot~="sortable-list-item"]')).toHaveLength(3)
  const handles = Array.from(
    host.querySelectorAll<HTMLButtonElement>('[data-slot~="sortable-list-handle"]')
  )
  expect(handles.map(node => node.getAttribute('aria-label'))).toEqual([
    'Move Park',
    'Move Market',
    'Move Museum'
  ])
  await act(async () => handles[0]!.focus())
  await key(' ')
  await act(async () => {
    await vi.waitFor(
      () =>
        expect(host.querySelector('[data-slot="sortable-list-status"]')!.textContent).toBe(
          'Picked up Park at 1/3.'
        ),
      { timeout: 2_000 }
    )
  })
  await key('{Escape}')

  const plain = await render(
    withControl(sortableListFixtureMessages, {}, { route: ['park', 'park', 'zoo'] })
  )
  expect(
    Array.from(
      plain.host.querySelectorAll('[data-slot="a2ui-sortable-list"] li'),
      node => node.textContent
    )
  ).toEqual(['Park', 'Museum', 'Market'])
})
