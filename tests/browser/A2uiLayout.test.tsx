import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  A2uiSurface,
  validateA2uiAccessibility,
  type A2uiMessage,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import { A2UI_BASIC_CATALOG_ID, A2UI_PROTOCOL_VERSION } from '../../src/a2ui/catalogGenerator.js'
import {
  cardFixtureMessages,
  columnFixtureMessages,
  LAYOUT_SURFACE_ID,
  listFixtureMessages,
  modalFixtureMessages,
  rowFixtureMessages,
  tabsFixtureMessages
} from '../../src/a2ui/layoutFixtures.js'
import { mount } from './familyHarness.js'

const surfaceOf = (
  components: readonly Record<string, unknown>[],
  dataModel?: Record<string, unknown>
): A2uiMessage[] => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: LAYOUT_SURFACE_ID,
      catalogId: A2UI_BASIC_CATALOG_ID,
      ...(dataModel ? { dataModel } : {}),
      components
    }
  }
]

const render = (messages: readonly A2uiMessage[], onDiagnostic?: (d: CatalogDiagnostic) => void) =>
  mount(
    <div style={{ width: '480px' }}>
      <A2uiSurface
        surfaceId={LAYOUT_SURFACE_ID}
        messages={messages}
        onDiagnostic={onDiagnostic}
      />
    </div>
  )

test('Row lays children out on Stack with translated justify, align and child weight', async () => {
  const { host } = await render(rowFixtureMessages)
  const row = host.querySelector<HTMLElement>('[data-slot~="a2ui-row"]')!
  expect(row.getAttribute('data-slot')).toContain('stack')
  const style = getComputedStyle(row)
  expect(style.flexDirection).toBe('row')
  expect(style.justifyContent).toBe('space-between')
  expect(style.alignItems).toBe('flex-end')
  expect(style.columnGap).toBe('16px')
  const weighted = row.querySelector<HTMLElement>(':scope > [data-slot="a2ui-weight"]')!
  expect(weighted.style.flexGrow).toBe('1')
  expect(weighted.querySelector('input')).not.toBeNull()
  const button = row.querySelector('button')!
  expect(button.parentElement).toBe(row)
  expect(
    weighted.getBoundingClientRect().width + button.getBoundingClientRect().width + 16
  ).toBeCloseTo(row.getBoundingClientRect().width, 0)
})

test('Row and Column coerce unknown justify and align values instead of throwing', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await render(
    surfaceOf([
      {
        id: 'root',
        component: 'Column',
        justify: 'sideways',
        align: 'baseline',
        children: ['inner_row']
      },
      { id: 'inner_row', component: 'Row', justify: 42, children: ['note_text'] },
      { id: 'note_text', component: 'Text', text: 'Still here' }
    ]),
    d => diagnostics.push(d)
  )
  expect(diagnostics.filter(d => d.prop === 'render')).toEqual([])
  const column = host.querySelector<HTMLElement>('[data-slot~="a2ui-column"]')!
  expect(getComputedStyle(column).justifyContent).toBe('flex-start')
  expect(getComputedStyle(column).alignItems).toBe('stretch')
  expect(host.textContent).toContain('Still here')
})

test('Column keeps its 1rem default gap on the spacing scale and centres children', async () => {
  const { host } = await render(columnFixtureMessages)
  const column = host.querySelector<HTMLElement>('[data-slot~="a2ui-column"]')!
  const style = getComputedStyle(column)
  expect(style.flexDirection).toBe('column')
  expect(style.rowGap).toBe('16px')
  expect(style.alignItems).toBe('center')
  host.style.setProperty('--rad-spacing-normal', '2rem')
  expect(getComputedStyle(column).rowGap).toBe('32px')
})

test('templated List renders one item per entry and resolves relative paths against it', async () => {
  const { host, render: rerender } = await render(listFixtureMessages)
  const list = host.querySelector<HTMLElement>('[data-slot~="a2ui-list"]')!
  expect(list.getAttribute('role')).toBe('list')
  const names = () =>
    [...list.querySelectorAll('[role="listitem"]')].map(item => item.textContent?.trim())
  expect(names()).toEqual(['Ridge loop', 'Lake shore', 'Pine valley'])
  expect(list.querySelectorAll('[data-slot~="a2ui-card"]')).toHaveLength(3)

  await rerender(
    <div style={{ width: '480px' }}>
      <A2uiSurface
        surfaceId={LAYOUT_SURFACE_ID}
        messages={[
          ...listFixtureMessages,
          {
            version: A2UI_PROTOCOL_VERSION,
            updateDataModel: {
              surfaceId: LAYOUT_SURFACE_ID,
              path: '/trails',
              value: [{ name: 'Lake shore' }, { name: 'Summit' }]
            }
          }
        ]}
      />
    </div>
  )
  await vi.waitFor(() => expect(names()).toEqual(['Lake shore', 'Summit']))
})

test('static List renders its children in order and flows horizontally on request', async () => {
  const { host } = await render(
    surfaceOf([
      { id: 'root', component: 'List', direction: 'horizontal', children: ['a_text', 'b_text'] },
      { id: 'a_text', component: 'Text', text: 'First' },
      { id: 'b_text', component: 'Text', text: 'Second' }
    ])
  )
  const list = host.querySelector<HTMLElement>('[data-slot~="a2ui-list"]')!
  expect(getComputedStyle(list).flexDirection).toBe('row')
  expect([...list.children].map(item => item.textContent)).toEqual(['First', 'Second'])
})

test('Card groups its child and Divider renders a separator on the requested axis', async () => {
  const { host } = await render(cardFixtureMessages)
  const card = host.querySelector<HTMLElement>('[data-slot~="a2ui-card"]')!
  expect(card.getAttribute('data-slot')).toContain('card')
  expect(card.textContent).toBe('Ridge loopModerate')
  const divider = host.querySelector<HTMLElement>('[data-slot~="a2ui-divider"]')!
  expect(divider.tagName).toBe('HR')
  expect(divider.getBoundingClientRect().width).toBeGreaterThan(100)

  const vertical = await render(
    surfaceOf([
      { id: 'root', component: 'Row', children: ['a_text', 'split', 'b_text'] },
      { id: 'a_text', component: 'Text', text: 'A' },
      { id: 'split', component: 'Divider', axis: 'vertical' },
      { id: 'b_text', component: 'Text', text: 'B' }
    ])
  )
  const rule = vertical.host.querySelector<HTMLElement>('[data-slot~="a2ui-divider"]')!
  expect(rule.getAttribute('aria-orientation')).toBe('vertical')
})

test('Tabs switch panels by keyboard and keep the inactive panel state', async () => {
  const { host } = await render(tabsFixtureMessages)
  const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
  expect(tabs.map(tab => tab.textContent)).toEqual(['Overview', 'Gear'])
  expect(tabs[0]!.getAttribute('aria-selected')).toBe('true')
  const panel = () => host.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')!
  expect(panel().textContent).toContain('A loop along the ridge.')

  await userEvent.click(tabs[1]!)
  expect(tabs[1]!.getAttribute('aria-selected')).toBe('true')
  const input = panel().querySelector('input')!
  await userEvent.type(input, 'Poles')
  await userEvent.click(tabs[0]!)
  await userEvent.keyboard('{ArrowRight}')
  expect(document.activeElement).toBe(tabs[1])
  expect(panel().querySelector('input')!.value).toBe('Poles')
})

test('Modal opens from its trigger, is named by it, and restores focus on Escape and close', async () => {
  const actions: unknown[] = []
  const { host } = await mount(
    <A2uiSurface
      surfaceId={LAYOUT_SURFACE_ID}
      messages={modalFixtureMessages}
      onAction={a => actions.push(a)}
    />
  )
  const trigger = host.querySelector<HTMLButtonElement>('button')!
  const dialog = host.querySelector<HTMLDialogElement>('dialog[data-slot~="a2ui-modal"]')!
  expect(dialog.open).toBe(false)

  await userEvent.click(trigger)
  expect(dialog.open).toBe(true)
  expect(dialog.matches(':modal')).toBe(true)
  expect(dialog.getAttribute('aria-labelledby')).toBe(trigger.parentElement!.id)
  expect(dialog.textContent).toContain('Parking opens at dawn.')
  expect(dialog.contains(document.activeElement)).toBe(true)

  await userEvent.keyboard('{Escape}')
  await vi.waitFor(() => expect(dialog.open).toBe(false))
  expect(document.activeElement).toBe(trigger)

  trigger.focus()
  await userEvent.keyboard('{Enter}')
  expect(dialog.open).toBe(true)
  const close = [...dialog.querySelectorAll('button')].find(b => b.textContent === 'Close')!
  await userEvent.click(close)
  await vi.waitFor(() => expect(dialog.open).toBe(false))
  expect(document.activeElement).toBe(trigger)
})

test('layout fixtures pass accessibility validation and the rules flag unnamed tabs and modals', () => {
  for (const messages of [
    rowFixtureMessages,
    columnFixtureMessages,
    listFixtureMessages,
    cardFixtureMessages,
    tabsFixtureMessages,
    modalFixtureMessages
  ]) {
    expect(validateA2uiAccessibility(messages).errors).toEqual([])
  }
  const flagged = validateA2uiAccessibility(
    surfaceOf([
      { id: 'root', component: 'Column', children: ['views', 'text_modal', 'blank_modal'] },
      { id: 'views', component: 'Tabs', tabs: [{ title: ' ', child: 'body' }] },
      { id: 'body', component: 'Text', text: 'Body' },
      { id: 'text_modal', component: 'Modal', trigger: 'body', content: 'body' },
      { id: 'blank_modal', component: 'Modal', trigger: 'icon_button', content: 'body' },
      {
        id: 'icon_button',
        component: 'Button',
        child: 'icon',
        action: { event: { name: 'noop' } }
      },
      { id: 'icon', component: 'Icon', name: 'info' }
    ])
  )
  expect(flagged.errors.filter(e => e.rule !== 'button-name').map(e => [e.nodeId, e.rule])).toEqual(
    [
      ['views', 'tab-titles'],
      ['text_modal', 'modal-trigger'],
      ['blank_modal', 'modal-trigger']
    ]
  )
})
