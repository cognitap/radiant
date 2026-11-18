import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { InlineEdit } from '../../src/index.js'
import { click, key, mount } from './familyHarness.js'

test('keyboard save and cancel restore focus, with errors retaining the editable draft', async () => {
  const change = vi.fn()
  const submit = vi.fn(event => event.preventDefault())
  const { host } = await mount(
    <form onSubmit={submit}>
      <InlineEdit
        defaultValue="Launch"
        inputLabel="Project name"
        editLabel="Rename project"
        onValueChange={change}
        validate={draft => (draft.trim() ? undefined : 'Enter a project name.')}
      />
    </form>,
    true
  )
  const trigger = () => host.querySelector<HTMLButtonElement>('[data-slot~=inline-edit-trigger]')!
  trigger().focus()
  await key('{Enter}')
  const input = () => host.querySelector('input')!
  expect(input()).toHaveFocus()
  expect(input()).toHaveAccessibleName('Project name')
  await key(' {Enter}')
  expect(input()).toHaveValue(' ')
  expect(input()).toHaveAccessibleDescription('Enter a project name.')
  expect(input()).toHaveAttribute('aria-invalid', 'true')
  expect(change).not.toHaveBeenCalled()
  await key('{Escape}')
  expect(trigger()).toHaveFocus()
  expect(host.querySelector('[data-slot=inline-edit-value]')).toHaveTextContent('Launch')
  await key('{Enter}Release{Enter}')
  expect(trigger()).toHaveFocus()
  expect(host.querySelector('[data-slot=inline-edit-value]')).toHaveTextContent('Release')
  expect(change).toHaveBeenCalledExactlyOnceWith('Release')
  expect(submit).not.toHaveBeenCalled()
})

test('a controlled rejection retains the draft until the app accepts a value or the user cancels', async () => {
  const change = vi.fn()
  function Rename() {
    const [value, setValue] = useState('Launch')
    return (
      <InlineEdit
        inputLabel="Project name"
        editLabel="Rename"
        value={value}
        onValueChange={next => {
          change(next)
          if (next !== 'Archive') setValue(next)
        }}
      />
    )
  }
  const { host } = await mount(<Rename />)
  const action = (part: string) =>
    host.querySelector<HTMLButtonElement>('[data-slot~=inline-edit-' + part + ']')!
  await click(action('trigger'))
  await key('Archive{Enter}')
  expect(change).toHaveBeenLastCalledWith('Archive')
  expect(host.querySelector('input')).toHaveValue('Archive')
  await key('{ControlOrMeta>}a{/ControlOrMeta}Launch plan')
  await click(action('save'))
  expect(change).toHaveBeenLastCalledWith('Launch plan')
  expect(host.querySelector('input')).toBeNull()
  expect(action('trigger')).toHaveFocus()
})
