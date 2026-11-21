import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  radiantA2uiRegistry,
  validateA2uiAccessibility,
  type A2uiActionPayload,
  type A2uiMessage,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import {
  comboboxFixtureMessages,
  EXTENSION_SURFACE_ID,
  radioGroupFixtureMessages,
  selectFixtureMessages,
  switchFixtureMessages,
  textareaFixtureMessages
} from '../../src/a2ui/extensionFixtures.js'
import { a2uiWebCoreCatalogs } from '../../src/a2ui/registry.js'
import { mount } from './familyHarness.js'

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

async function render(messages: readonly A2uiMessage[]) {
  const diagnostics: CatalogDiagnostic[] = []
  const onAction = vi.fn<(event: A2uiActionPayload) => void>()
  const view = await mount(
    <A2uiSurface
      surfaceId={EXTENSION_SURFACE_ID}
      messages={messages}
      onAction={onAction}
      onDiagnostic={d => diagnostics.push(d)}
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
