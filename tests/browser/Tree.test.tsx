import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { LocaleProvider, Tree, type TreeItem } from '../../src/index.js'
import { click, key, mount } from './familyHarness.js'

const records: readonly TreeItem[] = [
  {
    value: 'reports',
    label: 'Reports',
    children: [
      { value: 'alpha', label: 'Alpha' },
      { value: 'blocked', label: 'Blocked', disabled: true },
      { value: 'budget', label: 'Budget' }
    ]
  },
  { value: 'billing', label: 'Billing' },
  { value: 'summary', label: 'Summary' }
]

function widget(host: HTMLElement) {
  const tree = host.querySelector<HTMLElement>('[role="tree"]')!
  const item = (value: string) => tree.querySelector<HTMLElement>(`[data-value="${value}"]`)!
  const active = () =>
    tree.ownerDocument.getElementById(tree.getAttribute('aria-activedescendant')!)?.dataset.value
  const focus = () => act(async () => tree.focus())
  return { tree, item, active, focus }
}

test('hydrated focus, expansion and type-ahead follow visible enabled items in RTL', async () => {
  const request = vi.fn()
  const { host } = await mount(
    <LocaleProvider locale="he-IL">
      <Tree
        aria-label="Files"
        items={records}
        value="reports"
        onValueChange={request}
      />
    </LocaleProvider>,
    true
  )
  const { tree, item, active, focus } = widget(host)
  await focus()
  expect(tree).toHaveFocus()
  expect(active()).toBe('reports')
  expect(item('reports')).toHaveAttribute('aria-expanded', 'false')
  await key('{ArrowLeft}{ArrowLeft}')
  expect(active()).toBe('alpha')
  expect(item('alpha')).toHaveAttribute('aria-level', '2')
  expect(item('alpha').closest('[role=group]')?.id).toBe(item('reports').getAttribute('aria-owns'))
  expect(item('budget')).toHaveAttribute('aria-posinset', '3')
  await key('{ArrowDown}{Enter}')
  expect(active()).toBe('budget')
  expect(request).toHaveBeenCalledExactlyOnceWith('budget')
  expect(item('reports')).toHaveAttribute('aria-selected', 'true')
  await key('bil')
  expect(active()).toBe('billing')
  await key('{End}')
  expect(active()).toBe('summary')
  await key('{Home}{ArrowRight}')
  expect(item('reports')).toHaveAttribute('aria-expanded', 'false')
  expect(item('budget')).toBeNull()
  expect(tree).toHaveFocus()
})

test('multiple checkbox selection cascades to enabled loaded leaves and derives mixed state', async () => {
  const changes = vi.fn()
  const { host } = await mount(
    <Tree
      aria-label="Export files"
      items={records}
      type="multiple"
      checkboxes
      defaultExpanded={['reports']}
      defaultValue={['alpha']}
      onValueChange={changes}
    />
  )
  const { tree, item, active } = widget(host)
  expect(tree).toHaveAttribute('aria-multiselectable', 'true')
  expect(item('reports')).toHaveAttribute('aria-checked', 'mixed')
  expect(item('blocked')).toHaveAttribute('aria-disabled', 'true')
  await click(item('reports').querySelector<HTMLElement>('[data-slot="tree-checkbox"]')!)
  expect(active()).toBe('reports')
  expect(changes).toHaveBeenLastCalledWith(['alpha', 'budget'])
  expect(item('reports')).toHaveAttribute('aria-checked', 'true')
  await key(' ')
  expect(changes).toHaveBeenLastCalledWith([])
  expect(item('alpha')).toHaveAttribute('aria-checked', 'false')
  await click(item('reports').querySelector<HTMLElement>('[data-slot="tree-disclosure"]')!)
  expect(item('alpha')).toBeNull()
  expect(changes).toHaveBeenCalledTimes(2)
})

test('async expansion announces loading, retries a failure, and reuses accepted children', async () => {
  let reject!: (reason?: unknown) => void
  const loader = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<readonly TreeItem[]>((_resolve, fail) => {
          reject = fail
        })
    )
    .mockResolvedValueOnce([{ value: 'monthly', label: 'Monthly' }])
  const items = [{ value: 'archive', label: 'Archive', loadChildren: loader }]
  const { host } = await mount(
    <Tree
      aria-label="Archive"
      items={items}
    />
  )
  const { item, active, focus } = widget(host)
  await focus()
  await key('{ArrowRight}{ArrowRight}')
  expect(item('archive')).toHaveAttribute('aria-busy', 'true')
  expect(item('archive').textContent).toContain('Loading')
  expect(loader).toHaveBeenCalledOnce()
  await act(async () => reject(new Error('Offline')))
  expect(item('archive')).not.toHaveAttribute('aria-busy')
  expect(item('archive').textContent).toContain('Press Enter to retry')
  await key('{Enter}')
  await expect.poll(() => item('monthly')?.textContent).toContain('Monthly')
  await key('{ArrowRight}')
  expect(active()).toBe('monthly')
  await key('{ArrowLeft}{ArrowLeft}{ArrowRight}')
  expect(item('monthly')).toBeTruthy()
  expect(loader).toHaveBeenCalledTimes(2)
})

test('removing a loading node aborts its request and stale children cannot overwrite the replacement', async () => {
  let deliver!: (items: readonly TreeItem[]) => void
  const loader = vi.fn(
    (_signal: AbortSignal) =>
      new Promise<readonly TreeItem[]>(resolve => {
        deliver = resolve
      })
  )
  const oldItems = [{ value: 'archive', label: 'Archive', loadChildren: loader }]
  const view = await mount(
    <Tree
      aria-label="Archive"
      items={oldItems}
      defaultExpanded={['archive']}
    />
  )
  const { item, active } = widget(view.host)
  await expect.poll(() => loader.mock.calls.length).toBe(1)
  await view.render(
    <Tree
      aria-label="Archive"
      items={[{ value: 'replacement', label: 'Replacement' }]}
      defaultExpanded={['archive']}
    />
  )
  expect(loader.mock.calls[0][0].aborted).toBe(true)
  await act(async () => deliver([{ value: 'stale', label: 'Stale' }]))
  expect(active()).toBe('replacement')
  expect(item('stale')).toBeNull()
})

test('virtual rows retain active descendant and sibling metadata when navigation crosses the window', async () => {
  const items = Array.from({ length: 1000 }, (_, index) => ({
    value: String(index),
    label: `Record ${index + 1}`
  }))
  const { host } = await mount(
    <Tree
      aria-label="Records"
      items={items}
      virtual={{ height: 160, rowHeight: 32 }}
    />,
    true
  )
  const { tree, item, active, focus } = widget(host)
  const mounted = () => tree.querySelectorAll('[role="treeitem"]').length
  expect(mounted()).toBeLessThan(20)
  await act(async () => {
    tree.scrollTop = 16000
    tree.dispatchEvent(new Event('scroll'))
  })
  await click(item('501'))
  expect(active()).toBe('501')
  await focus()
  await key('{End}')
  expect(active()).toBe('999')
  expect(item('999')).toHaveAttribute('aria-setsize', '1000')
  expect(item('999')).toHaveAttribute('aria-posinset', '1000')
  expect(tree.scrollTop).toBeGreaterThan(30000)
  await act(async () => {
    tree.scrollTop = 0
    tree.dispatchEvent(new Event('scroll'))
  })
  expect(item('999')).toBeTruthy()
  expect(item('0')).toBeTruthy()
  expect(mounted()).toBeLessThan(20)
  await key('{Home}')
  expect(active()).toBe('0')
  expect(tree.scrollTop).toBe(0)
})
