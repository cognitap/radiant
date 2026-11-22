import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  radiantA2uiExtensionRegistry,
  validateA2uiAccessibility,
  type A2uiActionPayload,
  type A2uiMessage,
  type A2uiSurfaceLabels,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import {
  accordionFixtureMessages,
  alertFixtureMessages,
  badgeFixtureMessages,
  FEEDBACK_SURFACE_ID,
  progressFixtureMessages,
  tableFixtureMessages,
  TOAST_SURFACE_ID,
  toastFixtureMessages,
  toastRaisedFixtureMessages
} from '../../src/a2ui/feedbackFixtures.js'
import { mount } from './familyHarness.js'

const LABELS: A2uiSurfaceLabels = { notifications: 'Notifications', toastClose: 'Dismiss' }

async function render(
  messages: readonly A2uiMessage[],
  surfaceId = FEEDBACK_SURFACE_ID,
  labels: A2uiSurfaceLabels = LABELS
) {
  const diagnostics: CatalogDiagnostic[] = []
  const onAction = vi.fn<(event: A2uiActionPayload) => void>()
  const surface = (next: readonly A2uiMessage[]) => (
    <A2uiSurface
      surfaceId={surfaceId}
      messages={next}
      labels={labels}
      onAction={onAction}
      onDiagnostic={d => diagnostics.push(d)}
    />
  )
  const view = await mount(surface(messages))
  return {
    ...view,
    diagnostics,
    onAction,
    rerender: (next: readonly A2uiMessage[]) => view.render(surface(next))
  }
}

function withRoot(messages: readonly A2uiMessage[], patch: Record<string, unknown>) {
  const copy = structuredClone(messages) as A2uiMessage[]
  const { components } = (copy[0] as { createSurface: { components: Record<string, unknown>[] } })
    .createSurface
  Object.assign(
    components.find(c => c.id === 'root')!,
    patch
  )
  return copy
}

const click = (target: Element) =>
  act(async () => {
    await userEvent.click(target)
  })

test('Alert keeps its tone, live-region role and follow-up actions', async () => {
  const { host, diagnostics, onAction } = await render(alertFixtureMessages)
  const alert = host.querySelector<HTMLElement>('[data-slot~="alert"]')!
  expect(alert.getAttribute('role')).toBe('status')
  expect(alert.dataset.tone).toBe('warning')
  expect(alert.textContent).toContain('Payment is late')
  expect(alert.textContent).toContain('We will retry the card tomorrow.')
  await click(alert.querySelector('button')!)
  expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'retry_payment' }))
  expect(diagnostics.filter(d => d.kind !== 'defaulted')).toEqual([])
})

test('Alert announce assertive renders role alert', async () => {
  const { host } = await render(withRoot(alertFixtureMessages, { announce: 'assertive' }))
  expect(host.querySelector('[data-slot~="alert"]')!.getAttribute('role')).toBe('alert')
})

test('Badge reads bound text and keeps its curated tone', async () => {
  const { host } = await render(badgeFixtureMessages)
  const badges = Array.from(host.querySelectorAll<HTMLElement>('[data-slot~="badge"]'))
  expect(badges.map(b => b.textContent)).toEqual(['Shipped', '3 items'])
  expect(badges[0]!.dataset.tone).toBe('accent')
})

test('Progress is a labelled native progress bound to the data model', async () => {
  const { host, rerender } = await render(progressFixtureMessages)
  const bar = host.querySelector<HTMLProgressElement>('progress')!
  expect(bar.value).toBe(40)
  expect(bar.max).toBe(100)
  expect(bar.labels?.[0]?.textContent).toBe('Uploading invoice')
  await rerender([
    ...progressFixtureMessages,
    {
      version: A2UI_PROTOCOL_VERSION,
      updateDataModel: { surfaceId: FEEDBACK_SURFACE_ID, path: '/upload/done', value: null }
    }
  ])
  expect(host.querySelector('progress')!.hasAttribute('value')).toBe(false)
})

test('Progress clamps an out-of-range value with a diagnostic', async () => {
  const { host, diagnostics } = await render(withRoot(progressFixtureMessages, { value: 140 }))
  expect(host.querySelector<HTMLProgressElement>('progress')!.value).toBe(100)
  await vi.waitFor(() =>
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ component: 'Progress', prop: 'value', used: 100 })
    )
  )
})

test('Accordion opens bound sections and writes the open list back', async () => {
  const { host } = await render(accordionFixtureMessages)
  const items = Array.from(host.querySelectorAll<HTMLDetailsElement>('details'))
  expect(items.map(item => item.open)).toEqual([true, false])
  expect(items[0]!.textContent).toContain('Ships within two days.')
  await click(items[1]!.querySelector('summary')!)
  await vi.waitFor(() => expect(items[1]!.open).toBe(true))
  expect(items[0]!.open).toBe(true)
})

test('Table renders templated rows whose cells resolve item-relative paths', async () => {
  const { host, diagnostics } = await render(tableFixtureMessages)
  const table = host.querySelector('table')!
  expect(table.querySelector('caption')!.textContent).toBe('Invoices')
  expect(Array.from(table.querySelectorAll('th')).map(th => th.textContent)).toEqual([
    'Number',
    'Customer',
    'Amount',
    'Status'
  ])
  const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr =>
    Array.from(tr.querySelectorAll('td')).map(td => td.textContent)
  )
  expect(rows).toEqual([
    ['INV-1', 'Ada Lovelace', '€120.00', 'Paid'],
    ['INV-2', 'Alan Turing', '€80.50', 'Due']
  ])
  expect(table.querySelector('tbody td:nth-child(3)')!.className).toContain('text-end')
  expect(diagnostics.filter(d => d.kind === 'fallback' || d.kind === 'error')).toEqual([])
})

test('Table rows follow data-model updates', async () => {
  const { host, rerender } = await render(tableFixtureMessages)
  await rerender([
    ...tableFixtureMessages,
    {
      version: A2UI_PROTOCOL_VERSION,
      updateDataModel: {
        surfaceId: FEEDBACK_SURFACE_ID,
        path: '/invoices',
        value: [{ number: 'INV-3', customer: 'Grace Hopper', amount: '€5.00', status: 'Due' }]
      }
    }
  ])
  const rows = host.querySelectorAll('tbody tr')
  expect(rows).toHaveLength(1)
  expect(rows[0]!.textContent).toContain('Grace Hopper')
})

test('Table reports rows that are not a Row with one child per column', async () => {
  const messages = structuredClone(tableFixtureMessages) as A2uiMessage[]
  const { components } = (
    messages[0] as { createSurface: { components: Record<string, unknown>[] } }
  ).createSurface
  components.find(c => c.id === 'invoice_row')!.children = ['invoice_number']
  const { host, diagnostics } = await render(messages)
  expect(host.querySelectorAll('tbody tr:first-child td')).toHaveLength(4)
  await vi.waitFor(() =>
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ kind: 'fallback', component: 'Table', prop: 'rows' })
    )
  )
  const { errors } = validateA2uiAccessibility(messages, { registry: radiantA2uiExtensionRegistry })
  expect(errors.map(e => e.rule)).toContain('table-cells')
})

test('Toast opens when the host sets its bound open and writes false when dismissed', async () => {
  const { host, onAction, rerender } = await render(toastFixtureMessages, TOAST_SURFACE_ID)
  const viewport = host.querySelector<HTMLElement>('[data-slot~="toast-viewport"]')!
  expect(viewport.getAttribute('aria-label')).toBe('Notifications')
  const toast = () => viewport.querySelector<HTMLElement>('[data-slot~="toast"]')
  expect(toast()?.dataset.state ?? 'closed').toBe('closed')

  await click(
    Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Save draft')!
  )
  expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'save_draft' }))
  expect(toast()?.dataset.state ?? 'closed').toBe('closed')

  await rerender([...toastFixtureMessages, ...toastRaisedFixtureMessages])
  await vi.waitFor(() => expect(toast()!.dataset.state).toBe('open'))
  expect(toast()!.textContent).toContain('Draft saved')
  expect(toast()!.dataset.tone).toBe('accent')
  await vi.waitFor(() =>
    expect(host.querySelector('[data-slot="toast-announcer"]')!.textContent).toContain(
      'Draft saved'
    )
  )

  await click(Array.from(toast()!.querySelectorAll('button')).find(b => b.textContent === 'Undo')!)
  expect(onAction).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'undo_save' }))
  expect(toast()!.dataset.state).toBe('closed')
  // Dismissal wrote false back, so the next action reports the toast closed.
  await click(
    Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Save draft')!
  )
  expect(onAction).toHaveBeenLastCalledWith(
    expect.objectContaining({ state: { toasts: { saved: false } } })
  )
})

test('Toast close label dismisses it', async () => {
  const { host } = await render(
    [...toastFixtureMessages, ...toastRaisedFixtureMessages],
    TOAST_SURFACE_ID
  )
  const toast = () => host.querySelector<HTMLElement>('[data-slot~="toast"]')!
  await vi.waitFor(() => expect(toast().dataset.state).toBe('open'))
  await click(
    Array.from(toast().querySelectorAll('button')).find(b => b.textContent === 'Dismiss')!
  )
  expect(toast().dataset.state).toBe('closed')
})

test('without labels.notifications a Toast renders nothing and reports why', async () => {
  const { host, diagnostics } = await render(
    [...toastFixtureMessages, ...toastRaisedFixtureMessages],
    TOAST_SURFACE_ID,
    {}
  )
  expect(host.querySelector('[data-slot~="toast-viewport"]')).toBeNull()
  expect(host.querySelector('[data-slot~="toast"]')).toBeNull()
  await vi.waitFor(() =>
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ kind: 'fallback', component: 'Toast', prop: 'open' })
    )
  )
})

test('invalid curated tone and variant values coerce with diagnostics instead of throwing', async () => {
  const { host, diagnostics } = await render(
    withRoot(alertFixtureMessages, { tone: 'success', announce: 'loud' })
  )
  const alert = host.querySelector<HTMLElement>('[data-slot~="alert"]')!
  expect(alert.dataset.tone).toBe('neutral')
  expect(alert.getAttribute('role')).toBeNull()
  expect(diagnostics.map(d => d.prop)).toEqual(expect.arrayContaining(['tone', 'announce']))

  const table = await render(withRoot(tableFixtureMessages, { density: 'cramped' }))
  expect(table.host.querySelector('table')).not.toBeNull()
  expect(table.diagnostics.map(d => d.prop)).toContain('density')
})

test.each([
  ['alertFixtureMessages', alertFixtureMessages],
  ['badgeFixtureMessages', badgeFixtureMessages],
  ['progressFixtureMessages', progressFixtureMessages],
  ['accordionFixtureMessages', accordionFixtureMessages],
  ['tableFixtureMessages', tableFixtureMessages],
  ['toastFixtureMessages', toastFixtureMessages]
])('%s passes the accessibility validator', (_name, messages) => {
  expect(
    validateA2uiAccessibility(messages, { registry: radiantA2uiExtensionRegistry }).errors
  ).toEqual([])
})

test('feedback components declare validator rules for their names', () => {
  const missing = (component: string, extra: Record<string, unknown>) =>
    validateA2uiAccessibility(
      [
        {
          version: A2UI_PROTOCOL_VERSION,
          createSurface: {
            surfaceId: 'empty',
            catalogId: radiantA2uiExtensionRegistry.catalogId,
            components: [{ id: 'root', component, ...extra }]
          }
        }
      ],
      { registry: radiantA2uiExtensionRegistry }
    ).errors.map(e => e.rule)
  expect(missing('Alert', { title: ' ' })).toContain('alert-title')
  expect(missing('Progress', { label: '' })).toContain('progress-label')
  expect(missing('Badge', { text: '' })).toContain('badge-text')
  expect(missing('Toast', { title: '', open: false })).toContain('toast-title')
  expect(missing('Table', { caption: '', columns: [{ label: 'A' }], rows: [] })).toContain(
    'table-caption'
  )
  expect(missing('Accordion', { items: [{ value: 'a', title: 'A' }], panels: [] })).toContain(
    'accordion-panels'
  )
})
