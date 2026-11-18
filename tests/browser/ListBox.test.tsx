import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { Field, ListBox, LocaleProvider, type ListBoxOption } from '../../src/index.js'
import { click, key, mount, pause } from './familyHarness.js'

const items: ListBoxOption[] = [
  {
    value: 'launch',
    textValue: 'Product launch',
    label: (
      <>
        <strong>Product launch</strong>
        <div>Coordinate the rollout.</div>
      </>
    )
  },
  { value: 'archive', label: 'Archive', disabled: true },
  { value: 'research', label: 'Études' },
  { value: 'design', label: 'Design brief' }
]

test('rich options and localized typeahead keep keyboard focus independent of selection', async () => {
  const { host } = await mount(
    <form>
      <LocaleProvider locale="fr-FR">
        <Field
          label="Template"
          description="Choose a starting point"
          required
        >
          <ListBox
            name="template"
            items={items}
          />
        </Field>
      </LocaleProvider>
    </form>,
    true
  )
  const form = host.querySelector('form')!
  const box = host.querySelector<HTMLElement>('[role=listbox]')!
  const active = () => document.getElementById(box.getAttribute('aria-activedescendant')!)
  expect(box).toHaveAccessibleName('Template')
  expect(box).toHaveAccessibleDescription('Choose a starting point')
  await click(host.querySelector('label')!)
  expect(box).toHaveFocus()
  expect(form.checkValidity()).toBe(false)
  expect(active()).toHaveAccessibleName('Product launch')
  await key('{ArrowDown}')
  expect(active()).toHaveAccessibleName('Études')
  expect(active()).toHaveAttribute('aria-selected', 'false')
  await key('{End}')
  expect(active()).toHaveAccessibleName('Design brief')
  await act(async () =>
    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'é', bubbles: true }))
  )
  expect(active()).toHaveAccessibleName('Études')
  await key('{Enter}')
  expect(new FormData(form).getAll('template')).toEqual(['research'])
  expect(form.checkValidity()).toBe(true)
  await key('{Home}')
  expect(active()).toHaveAccessibleName('Product launch')
  expect(active()).toHaveAttribute('aria-selected', 'false')
  await act(async () => form.reset())
  await pause(15)
  expect(new FormData(form).get('template')).toBe('')
})

test('multiple submits repeated values and reset restores uncontrolled defaults and controlled values', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <>
      <form id="project-form" />
      <ListBox
        aria-label="Templates"
        type="multiple"
        items={items}
        name="templates"
        form="project-form"
        defaultValue={['launch']}
      />
      <ListBox
        aria-label="Pinned"
        type="multiple"
        items={items}
        name="pinned"
        form="project-form"
        value={['design']}
        onValueChange={change}
      />
    </>
  )
  const form = host.querySelector('form')!
  const [box, controlled] = host.querySelectorAll('[role=listbox]')
  const options = box.querySelectorAll('[role=option]')
  expect(options[1]).toHaveAttribute('aria-disabled', 'true')
  await act(async () => (options[1] as HTMLElement).click())
  expect(new FormData(form).getAll('templates')).toEqual(['launch'])
  await click(options[2] as HTMLElement)
  await key('{End} ')
  expect(new FormData(form).getAll('templates')).toEqual(['launch', 'research', 'design'])
  await click(controlled.querySelector<HTMLElement>('[role=option]')!)
  expect(change).toHaveBeenCalledWith(['design', 'launch'])
  expect(new FormData(form).getAll('pinned')).toEqual(['design'])
  await act(async () => form.reset())
  await pause(15)
  expect(new FormData(form).getAll('templates')).toEqual(['launch'])
  expect(new FormData(form).getAll('pinned')).toEqual(['design'])
  expect(change).toHaveBeenCalledTimes(1)
})
