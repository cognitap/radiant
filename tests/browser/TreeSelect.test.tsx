import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { Field, LocaleProvider, TreeSelect, type TreeItem } from '../../src/index.js'
import { click, key, mount, pause, shown } from './familyHarness.js'

const files: readonly TreeItem[] = [
  {
    value: 'reports',
    label: 'Reports',
    children: [
      { value: 'draft', label: 'Draft' },
      { value: 'blocked', label: 'Blocked', disabled: true },
      { value: 'final', label: 'Final' }
    ]
  },
  { value: 'notes', label: 'Notes' }
]

function picker(host: HTMLElement) {
  const trigger = host.querySelector<HTMLButtonElement>('[data-slot~="tree-select-trigger"]')!
  const popup = host.querySelector<HTMLElement>('[data-slot~="tree-select-content"]')!
  const tree = popup.querySelector<HTMLElement>('[role="tree"]')!
  const item = (value: string) => tree.querySelector<HTMLElement>(`[data-value="${value}"]`)!
  const tags = () =>
    Array.from(trigger.querySelectorAll('[data-slot~="tree-select-tag"]'), tag => tag.textContent)
  return { trigger, popup, tree, item, tags }
}

test('single selection submits one key, restores focus, and resets native form state', async () => {
  const { host } = await mount(
    <form>
      <Field
        label="Destination"
        required
      >
        <TreeSelect
          items={files}
          name="destination"
        />
      </Field>
      <button type="reset">Reset</button>
    </form>,
    true
  )
  const form = host.querySelector('form')!
  const { trigger, popup, tree } = picker(host)
  expect(trigger).toHaveAccessibleName('Destination Select an item')
  await act(async () => expect(form.reportValidity()).toBe(false))
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-invalid', 'true')
  await key('{ArrowDown}')
  expect(shown(popup)).toBe(true)
  expect(tree).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-controls', tree.id)
  expect(tree).toHaveAccessibleName('Destination')
  await key('{ArrowRight}{ArrowDown}{Enter}')
  expect(shown(popup)).toBe(false)
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAccessibleName('Destination Reports / Draft')
  expect(trigger).not.toHaveAttribute('aria-invalid')
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).get('destination')).toBe('draft')
  await key('{Enter}{Enter}')
  expect(shown(popup)).toBe(false)
  expect(trigger).toHaveFocus()
  await key('{ArrowDown}')
  await act(async () => form.reset())
  await expect.poll(() => trigger.textContent).toBe('Select an item')
  expect(shown(popup)).toBe(false)
  expect(new FormData(form).get('destination')).toBe('')
})

test('multiple tags reflect checkbox selection and repeated values in an external form', async () => {
  const onChange = vi.fn()
  const { host, render } = await mount(view())
  function view(disabled = false) {
    return (
      <>
        <form id="export-form" />
        <TreeSelect
          aria-label="Files to export"
          items={files}
          name="file"
          form="export-form"
          type="multiple"
          checkboxes
          defaultValue={['draft']}
          onValueChange={onChange}
          disabled={disabled}
        />
      </>
    )
  }
  const form = host.querySelector('form')!
  const { trigger, popup, item, tags } = picker(host)
  expect(tags()).toEqual(['Reports / Draft'])
  await click(trigger)
  expect(item('reports')).toHaveAttribute('aria-checked', 'mixed')
  await click(item('reports').querySelector<HTMLElement>('[data-slot="tree-checkbox"]')!)
  expect(shown(popup)).toBe(true)
  expect(onChange).toHaveBeenCalledExactlyOnceWith(['draft', 'final'])
  expect(tags()).toEqual(['Reports / Draft', 'Reports / Final'])
  expect(new FormData(form).getAll('file')).toEqual(['draft', 'final'])
  form.addEventListener('reset', event => event.preventDefault(), { once: true })
  await act(async () => form.reset())
  await pause(20)
  expect(tags()).toEqual(['Reports / Draft', 'Reports / Final'])
  await act(async () => form.reset())
  await expect.poll(tags).toEqual(['Reports / Draft'])
  expect(shown(popup)).toBe(false)
  await render(view(true))
  expect(trigger).toBeDisabled()
  expect(new FormData(form).has('file')).toBe(false)
})

test('controlled selection waits for its owner and survives native reset', async () => {
  const change = vi.fn()
  const { host, render } = await mount(view('notes'))
  function view(value: string) {
    return (
      <form>
        <TreeSelect
          aria-label="Department file"
          items={files}
          name="file"
          value={value}
          onValueChange={change}
        />
      </form>
    )
  }
  const form = host.querySelector('form')!
  const { trigger, item, popup } = picker(host)
  await click(trigger)
  await click(item('reports'))
  expect(shown(popup)).toBe(false)
  expect(change).toHaveBeenCalledExactlyOnceWith('reports')
  expect(trigger).toHaveAccessibleName('Department file Notes')
  expect(new FormData(form).get('file')).toBe('notes')
  await render(view('reports'))
  await act(async () => form.reset())
  await pause(20)
  expect(trigger).toHaveAccessibleName('Department file Reports')
  expect(new FormData(form).get('file')).toBe('reports')
  expect(change).toHaveBeenCalledTimes(1)
})

test('loaded item paths persist and Escape, Tab, and outside click close the tree', async () => {
  const loader = vi.fn().mockResolvedValue([{ value: 'monthly', label: 'Monthly' }])
  const archive = [{ value: 'archive', label: 'Archive', loadChildren: loader }]
  const { host } = await mount(
    <LocaleProvider locale="he-IL">
      <button type="button">Previous</button>
      <TreeSelect
        aria-label="Archived report"
        items={archive}
      />
      <button type="button">Next</button>
    </LocaleProvider>
  )
  const { trigger, tree, popup, item } = picker(host)
  const next = host.querySelector<HTMLButtonElement>('button:last-child')!
  await click(trigger)
  expect(tree).toHaveFocus()
  await key('{ArrowLeft}')
  await expect.poll(() => item('monthly')).not.toBeNull()
  await key('{ArrowLeft}{Space}')
  expect(trigger).toHaveAccessibleName('Archived report Archive / Monthly')
  expect(trigger).toHaveFocus()
  expect(shown(popup)).toBe(false)
  await key('{ArrowDown}{Escape}')
  expect(shown(popup)).toBe(false)
  expect(trigger).toHaveFocus()
  await key('{Enter}{Shift>}{Tab}{/Shift}')
  expect(shown(popup)).toBe(false)
  expect(trigger).toHaveFocus()
  await key('{ArrowDown}{Tab}')
  expect(shown(popup)).toBe(false)
  expect(next).toHaveFocus()
  await click(trigger)
  await click(host.querySelector<HTMLButtonElement>('button:first-child')!)
  expect(shown(popup)).toBe(false)
  expect(loader).toHaveBeenCalledTimes(1)
})

test('virtual selection opens with the selected item in view and keeps the DOM window bounded', async () => {
  const entries = Array.from({ length: 250 }, (_, index) => ({
    value: `entry-${index}`,
    label: `Entry ${index}`
  }))
  const { host } = await mount(
    <TreeSelect
      aria-label="Entry"
      items={entries}
      virtual={{ height: 160, rowHeight: 32 }}
      defaultValue="entry-249"
    />
  )
  const { trigger, tree, item } = picker(host)
  await click(trigger)
  await expect.poll(() => tree.scrollTop).toBeGreaterThan(7_000)
  expect(item('entry-249').getBoundingClientRect().bottom).toBeLessThanOrEqual(
    tree.getBoundingClientRect().bottom + 1
  )
  expect(tree.querySelectorAll('[role="treeitem"]').length).toBeLessThan(20)
  await key('{Home}{Enter}')
  expect(trigger).toHaveAccessibleName('Entry Entry 0')
})
