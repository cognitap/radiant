import { act, createRef, StrictMode } from 'react'
import { expect, test, vi } from 'vitest'
import { commands } from 'vitest/browser'
import { CheckboxGroup, ThemeScope, defineTheme, type CheckboxGroupItem } from '../../src/index.js'
import { mount, click, key, pause } from './familyHarness.js'
const items: CheckboxGroupItem[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'Text messages' }
]
test('native checkbox edits before hydration are adopted silently, with stable host refs and parent relationships', async () => {
  const root = createRef<HTMLFieldSetElement>(),
    option = createRef<HTMLInputElement>(),
    parent = createRef<HTMLInputElement>()
  const changes: string[][] = []
  const { host } = await mount(
    <StrictMode>
      <CheckboxGroup
        ref={root}
        label="Channels"
        name="channels"
        items={[{ ...items[0]!, ref: option }, items[1]!]}
        defaultValue={['email']}
        selectAll={{ label: 'All channels', ref: parent }}
        description="Choose delivery channels"
        onValueChange={next => changes.push(next)}
      />
    </StrictMode>,
    true,
    node => {
      expect(node.querySelector('[aria-checked="mixed"]')).not.toBeNull()
      node.querySelector<HTMLInputElement>('[value="sms"]')!.checked = true
    }
  )
  expect(root.current).toBe(host.querySelector('fieldset'))
  expect(option.current).toBe(host.querySelector('[value="email"]'))
  expect(parent.current!.checked).toBe(true)
  expect(parent.current!.indeterminate).toBe(false)
  expect(changes).toEqual([])
  expect(root.current!.dataset.slot).toBe('field checkbox-group')
  const controlled = parent.current!.getAttribute('aria-controls')!.split(' ')
  expect(controlled).toHaveLength(2)
  expect(
    controlled.every(id => document.getElementById(id)?.matches('input[type="checkbox"]'))
  ).toBe(true)
  expect(
    document.getElementById(root.current!.getAttribute('aria-describedby')!)!.textContent
  ).toBe('Choose delivery channels')
})
test('select all skips disabled options; native form values and immediate reset retain the original defaults', async () => {
  const changes: string[][] = []
  const { host } = await mount(
    <form>
      <CheckboxGroup
        label="Channels"
        name="channels"
        items={[...items, { value: 'managed', label: 'Managed', disabled: true }]}
        defaultValue={['email', 'managed']}
        selectAll={{ label: 'All available' }}
        onValueChange={next => changes.push(next)}
      />
      <button type="reset">Reset</button>
    </form>
  )
  const form = host.querySelector('form')!,
    parent = host.querySelector<HTMLInputElement>('[aria-controls]')!,
    email = host.querySelector<HTMLInputElement>('[value="email"]')!,
    managed = host.querySelector<HTMLInputElement>('[value="managed"]')!
  expect(parent.indeterminate).toBe(true)
  await click(parent)
  expect(parent.checked).toBe(true)
  expect(managed.checked).toBe(true)
  expect(new FormData(form).getAll('channels')).toEqual(['email', 'sms'])
  expect(changes).toEqual([['email', 'sms', 'managed']])
  await key(' ')
  expect(parent.checked).toBe(false)
  expect(managed.checked).toBe(true)
  expect(new FormData(form).getAll('channels')).toEqual([])
  const before = changes.length
  await act(async () => {
    form.reset()
    expect(new FormData(form).getAll('channels')).toEqual(['email'])
  })
  await pause(10)
  expect(parent.indeterminate).toBe(true)
  expect(email.checked).toBe(true)
  expect(changes).toHaveLength(before)
  await click(email)
  expect(parent.indeterminate).toBe(false)
  expect(parent.getAttribute('aria-checked')).toBe('false')
  expect(new FormData(form).getAll('channels')).toEqual([])
  expect(changes).toHaveLength(before + 1)
  const cancel = (event: Event) => event.preventDefault()
  form.addEventListener('reset', cancel, { once: true })
  await act(async () => form.reset())
  await pause(10)
  expect(email.checked).toBe(false)
  expect(parent.checked).toBe(false)
  expect(parent.indeterminate).toBe(false)
})
test('controlled owners may refuse requests, including restoring a mixed parent and pre-hydration state', async () => {
  const changes: string[][] = []
  const tree = (value: string[]) => (
    <form>
      <CheckboxGroup
        label="Controlled channels"
        name="channels"
        items={items}
        value={value}
        onValueChange={next => changes.push(next)}
        selectAll={{ label: 'All channels' }}
      />
    </form>
  )
  const { host, render } = await mount(tree(['email']), true, node => {
    node.querySelector<HTMLInputElement>('[value="sms"]')!.checked = true
  })
  const parent = host.querySelector<HTMLInputElement>('[aria-controls]')!,
    email = host.querySelector<HTMLInputElement>('[value="email"]')!,
    sms = host.querySelector<HTMLInputElement>('[value="sms"]')!
  expect(sms.checked).toBe(false)
  expect(parent.indeterminate).toBe(true)
  expect(changes).toEqual([])
  await click(parent)
  expect(changes).toEqual([['email', 'sms']])
  expect(parent.checked).toBe(false)
  expect(parent.indeterminate).toBe(true)
  expect(parent.getAttribute('aria-checked')).toBe('mixed')
  await click(sms)
  expect(sms.checked).toBe(false)
  expect(email.checked).toBe(true)
  expect(changes).toHaveLength(2)
  await render(tree(['sms']))
  expect(email.checked).toBe(false)
  expect(sms.checked).toBe(true)
  expect(changes).toHaveLength(2)
  await act(async () => host.querySelector('form')!.reset())
  await pause(10)
  expect(sms.checked).toBe(true)
  expect(parent.indeterminate).toBe(true)
  expect(changes).toHaveLength(2)
})
test('native external form ownership, reset cleanup and themed option layout stay local', async () => {
  const theme = defineTheme({
    id: 'checkbox-group-proof',
    name: 'Checkbox group proof',
    components: { checkboxGroup: { gap: '9px' } }
  })
  const make = (owner: string) => (
    <ThemeScope
      theme={theme}
      mode="dark"
    >
      <form id="group-form-a" />
      <form id="group-form-b" />
      <CheckboxGroup
        label="Notification channels"
        name="channels"
        form={owner}
        items={[
          { ...items[0]!, style: { borderRadius: '7px' } },
          { value: 'sms', label: 'A long notification channel that wraps' }
        ]}
        defaultValue={['email']}
        selectAll={{ label: 'All available' }}
        style={{ width: '180px' }}
      />
    </ThemeScope>
  )
  const { host, render } = await mount(make('group-form-a'))
  const a = host.querySelector<HTMLFormElement>('#group-form-a')!,
    b = host.querySelector<HTMLFormElement>('#group-form-b')!
  const group = host.querySelector('fieldset')!,
    parent = group.querySelector<HTMLInputElement>('[aria-controls]')!
  expect([...group.querySelectorAll('input')].every(node => node.form === a)).toBe(true)
  expect(new FormData(a).getAll('channels')).toEqual(['email'])
  expect(new FormData(b).getAll('channels')).toEqual([])
  expect(getComputedStyle(group.querySelector('[data-slot="checkbox-group-options"]')!).gap).toBe(
    '9px'
  )
  expect(getComputedStyle(group.querySelector('[value="email"]')!).borderRadius).toBe('7px')
  expect(group.scrollWidth).toBeLessThanOrEqual(180)
  await render(make('group-form-b'))
  expect([...group.querySelectorAll('input')].every(node => node.form === b)).toBe(true)
  expect(new FormData(a).getAll('channels')).toEqual([])
  await click(parent)
  await act(async () => a.reset())
  await pause(10)
  expect(parent.checked).toBe(true)
  await act(async () => b.reset())
  await pause(10)
  expect(parent.indeterminate).toBe(true)
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(group.querySelector('legend')!.textContent).toBe('Notification channels')
  const remove = vi.spyOn(b, 'removeEventListener')
  await render(null)
  expect(remove.mock.calls.some(call => call[0] === 'reset')).toBe(true)
  remove.mockRestore()
})
test('required blocks native submission until an enabled option is checked', async () => {
  const submits = vi.fn((event: SubmitEvent) => event.preventDefault())
  const tree = (props: { value?: string[]; disabled?: boolean }) => (
    <form>
      <CheckboxGroup
        key={props.value ? 'controlled' : 'native'}
        label="Channels"
        name="channels"
        required
        items={[{ value: 'managed', label: 'Managed', disabled: true }, ...items]}
        selectAll={{ label: 'All available' }}
        {...(props.value ? { value: props.value } : { defaultValue: ['managed'] })}
        disabled={props.disabled}
      />
    </form>
  )
  const { host, render } = await mount(tree({}))
  const form = host.querySelector('form')!,
    group = host.querySelector('fieldset')!,
    managed = host.querySelector<HTMLInputElement>('[value="managed"]')!,
    email = host.querySelector<HTMLInputElement>('[value="email"]')!,
    sms = host.querySelector<HTMLInputElement>('[value="sms"]')!,
    parent = host.querySelector<HTMLInputElement>('[aria-controls]')!
  form.addEventListener('submit', submits)
  expect(group.dataset.required).toBe('')
  expect(group.querySelector('[data-slot="field-required"]')).not.toBeNull()
  expect(managed.checked).toBe(true)
  expect(email.validationMessage).not.toBe('')
  expect(managed.validity.valid && sms.validity.valid && parent.validity.valid).toBe(true)
  await act(async () => form.requestSubmit())
  expect(submits).not.toHaveBeenCalled()
  await click(sms)
  expect(form.checkValidity()).toBe(true)
  await act(async () => form.requestSubmit())
  expect(submits).toHaveBeenCalledTimes(1)
  await click(sms)
  expect(form.checkValidity()).toBe(false)
  await click(parent)
  expect(form.checkValidity()).toBe(true)
  await act(async () => form.reset())
  await pause(10)
  expect(form.checkValidity()).toBe(false)
  await render(tree({ value: [] }))
  expect(form.checkValidity()).toBe(false)
  await render(tree({ value: ['email'] }))
  expect(form.checkValidity()).toBe(true)
  await render(tree({ value: [], disabled: true }))
  expect(form.checkValidity()).toBe(true)
})
