import { act, createRef, StrictMode } from 'react'
import { expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Command,
  CommandTrigger,
  CommandContent,
  CommandTitle,
  CommandDescription,
  CommandInput,
  CommandList,
  CommandClose,
  CommandItem,
  Field,
  ThemeScope,
  defineTheme
} from '../../src/index.js'
import type {
  CommandProps,
  CommandOption,
  CommandContentProps,
  CommandInputProps
} from '../../src/index.js'
import { mount, click, key, pause } from './familyHarness.js'
const items = [
  { value: 'new', label: 'Create project', group: 'Projects', shortcut: ['Ctrl', 'N'] },
  { value: 'delete', label: 'Delete project', group: 'Projects', disabled: true },
  { value: 'settings', label: 'Open settings', group: 'Navigation', shortcut: ['G', 'S'] }
]
function Palette({
  content,
  input,
  ...props
}: CommandProps & { content?: CommandContentProps; input?: CommandInputProps }) {
  return (
    <Command {...props}>
      <CommandTrigger>Open commands</CommandTrigger>
      <CommandContent {...content}>
        <CommandTitle>Workspace commands</CommandTitle>
        <CommandDescription>Find and run a workspace action.</CommandDescription>
        <CommandInput {...input} />
        <CommandList />
        <CommandClose>Close commands</CommandClose>
      </CommandContent>
    </Command>
  )
}
const fill = (node: HTMLInputElement, value: string) => act(async () => userEvent.fill(node, value))
test('hydrates a real labelled native modal, focuses input, groups real options and keeps base identities/ref', async () => {
  const ref = createRef<HTMLDialogElement>(),
    inputRef = createRef<HTMLInputElement>()
  const { host } = await mount(
    <StrictMode>
      <Field
        label="Outer form field"
        required
        disabled
      >
        <Palette
          items={items}
          onAction={() => {}}
          content={{ ref }}
          input={{ ref: inputRef }}
        />
      </Field>
    </StrictMode>,
    true
  )
  const input = host.querySelector('input')!,
    dialog = host.querySelector('dialog')!
  expect(dialog.open).toBe(false)
  expect(host.querySelectorAll('input')).toHaveLength(1)
  expect(input.disabled).toBe(false)
  expect(input.required).toBe(false)
  expect(input.getAttribute('aria-describedby')).toBeNull()
  expect(input.getAttribute('name')).toBeNull()
  expect(inputRef.current).toBe(input)
  expect(ref.current).toBe(dialog)
  expect(dialog.dataset.slot).toBe('dialog command')
  expect(host.querySelector('button')!.dataset.slot).toBe('button dialog-trigger command-trigger')
  await click(host.querySelector('button')!)
  expect(dialog.matches(':modal')).toBe(true)
  expect(document.activeElement).toBe(input)
  expect(dialog.getAttribute('aria-labelledby')).toBe(host.querySelector('h2')!.id)
  expect(input.getAttribute('aria-controls')).toBe(host.querySelector('[role="listbox"]')!.id)
  expect(host.querySelector('[popover]')).toBeNull()
  expect(host.querySelectorAll('[role="group"]')).toHaveLength(2)
  expect(host.querySelector('kbd[data-slot~="kbd-group"]')!.getAttribute('dir')).toBe('ltr')
  await key('{Tab}')
  expect(document.activeElement).toBe(host.querySelector('[data-slot~="command-close"]'))
  await key('{Shift>}{Tab}{/Shift}')
  expect(document.activeElement).toBe(input)
  await key('{Escape}')
  await pause(25)
  expect(dialog.open).toBe(false)
  expect(document.activeElement).toBe(host.querySelector('button'))
})
test('keyboard skips disabled actions, never executes merely on highlight and never inserts IDs into the query', async () => {
  const action = vi.fn(),
    change = vi.fn()
  const { host } = await mount(
    <Palette
      items={items}
      onAction={action}
      onQueryChange={change}
    />
  )
  await click(host.querySelector('button')!)
  const input = host.querySelector('input')!
  await key('{ArrowDown}{ArrowDown}')
  expect(input.value).toBe('')
  expect(action).not.toHaveBeenCalled()
  expect(
    host.querySelector('[role="option"][aria-selected="true"]')!.getAttribute('data-value')
  ).toBe('settings')
  await key('{Enter}')
  expect(action).toHaveBeenCalledExactlyOnceWith('settings')
  expect(change).not.toHaveBeenCalled()
  expect(host.querySelector('dialog')!.open).toBe(false)
  await click(host.querySelector('button')!)
  await key('{Enter}')
  expect(action).toHaveBeenCalledTimes(1)
  expect(host.querySelector('dialog')!.open).toBe(true)
  await fill(input, 'Create')
  await key('{ArrowDown}{Enter}')
  expect(action.mock.calls.map(x => x[0])).toEqual(['settings', 'new'])
  expect(input.value).toBe('Create')
  await click(host.querySelector('button')!)
  expect(input.value).toBe('Create')
})
test('controlled owners may refuse actions closing, query requests and native Escape; prop sync remains silent', async () => {
  const action = vi.fn(),
    query = vi.fn(),
    open = vi.fn()
  const tree = (value: string, expanded = true) => (
    <Palette
      items={items}
      filter={null}
      query={value}
      onQueryChange={query}
      open={expanded}
      onOpenChange={open}
      onAction={action}
    />
  )
  const { host, render } = await mount(tree('owned'))
  const input = host.querySelector('input')!,
    dialog = host.querySelector('dialog')!
  await fill(input, 'request')
  expect(query).toHaveBeenCalledExactlyOnceWith('request')
  expect(input.value).toBe('owned')
  await key('{ArrowDown}{Enter}')
  expect(action).toHaveBeenCalledExactlyOnceWith('new')
  expect(open).toHaveBeenCalledExactlyOnceWith(false)
  expect(dialog.open).toBe(true)
  await key('{Escape}')
  await pause(40)
  expect(dialog.open).toBe(true)
  expect(open).toHaveBeenCalledTimes(2)
  await render(tree('synchronized', false))
  expect(query).toHaveBeenCalledTimes(1)
  expect(dialog.open).toBe(false)
  await render(tree('synchronized', true))
  expect(input.value).toBe('synchronized')
  expect(host.querySelector('[aria-selected="true"]')).toBeNull()
})
test('native cancel policy, caller cancellation and disabled pointer activation remain authoritative', async () => {
  const action = vi.fn(),
    cancel = vi.fn()
  const { host, render } = await mount(
    <Palette
      items={items}
      defaultOpen
      onAction={action}
      content={{
        onCancel: e => {
          cancel()
          e.preventDefault()
        }
      }}
    />
  )
  await key('{Escape}')
  await pause(20)
  expect(cancel).toHaveBeenCalledTimes(1)
  expect(host.querySelector('dialog')!.open).toBe(true)
  await act(async () => host.querySelector<HTMLElement>('[data-value="delete"]')!.click())
  expect(action).not.toHaveBeenCalled()
  await render(
    <Command
      items={items}
      defaultOpen
      onAction={action}
      closeOnEscape={false}
    >
      <CommandContent>
        <CommandTitle>Actions</CommandTitle>
        <CommandDescription>Choose an action.</CommandDescription>
        <CommandInput />
        <CommandList>
          <CommandItem
            value="new"
            onClick={e => e.preventDefault()}
          />
        </CommandList>
        <CommandClose>Close</CommandClose>
      </CommandContent>
    </Command>
  )
  await click(host.querySelector<HTMLElement>('[data-value="new"]')!)
  expect(action).not.toHaveBeenCalled()
  await key('{Escape}')
  await pause(20)
  expect(host.querySelector('dialog')!.open).toBe(true)
  await click(host.querySelector('button')!)
  expect(host.querySelector('dialog')!.open).toBe(false)
})
test('no global shortcut is installed; Enter never submits a surrounding native form, including empty and modifier cases', async () => {
  const submit = vi.fn(),
    action = vi.fn()
  const { host } = await mount(
    <form
      onSubmit={e => {
        e.preventDefault()
        submit()
      }}
    >
      <Palette
        items={items}
        onAction={action}
      />
    </form>
  )
  const trigger = host.querySelector('button')!
  await act(async () => trigger.focus())
  await key('{Control>}k{/Control}')
  expect(host.querySelector('dialog')!.open).toBe(false)
  await click(trigger)
  const input = host.querySelector('input')!
  await key('{Enter}')
  await fill(input, 'no results')
  await key('{Enter}{Control>}{Enter}{/Control}')
  expect(submit).not.toHaveBeenCalled()
  expect(action).not.toHaveBeenCalled()
  await act(async () =>
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true })
    )
  )
  expect(action).not.toHaveBeenCalled()
  await fill(input, 'Create')
  await key('{ArrowDown}{Enter}')
  expect(action).toHaveBeenCalledExactlyOnceWith('new')
  expect(submit).not.toHaveBeenCalled()
})
test('application-filtered async results and errors do not run actions or overwrite query; pointer activation is explicit', async () => {
  const action = vi.fn()
  const tree = (options: typeof items, loading = false, error?: string) => (
    <Palette
      items={options}
      defaultOpen
      defaultQuery="remote"
      filter={null}
      onAction={action}
      loading={loading}
      errorText={error}
    />
  )
  const { host, render } = await mount(tree([], true))
  expect(host.querySelector('[role="status"]')!.textContent).toBe('Loading results…')
  await render(tree(items))
  expect(action).not.toHaveBeenCalled()
  expect(host.querySelector('input')!.value).toBe('remote')
  await render(tree([], false, 'Search unavailable'))
  expect(host.querySelector('[role="status"]')!.textContent).toBe('Search unavailable')
  expect(action).not.toHaveBeenCalled()
  await render(tree(items))
  await click(host.querySelector<HTMLElement>('[data-value="settings"]')!)
  expect(action).toHaveBeenCalledExactlyOnceWith('settings')
})
test('group order matches keyboard order, custom filtering sees metadata, and input cancellation stops execution', async () => {
  const action = vi.fn(),
    filter = vi.fn((item: CommandOption, query: string) => item.group?.includes(query) ?? false)
  const { host } = await mount(
    <Palette
      items={[items[0]!, items[2]!, items[1]!]}
      defaultOpen
      defaultQuery="Projects"
      onAction={action}
      filter={filter}
      input={{
        onKeyDown: e => {
          if (e.key === 'Enter') e.preventDefault()
        }
      }}
    />
  )
  expect(host.querySelectorAll('[role="option"]')).toHaveLength(2)
  expect(filter.mock.calls[0]![0].group).toBe('Projects')
  await key('{ArrowDown}{Enter}')
  expect(action).not.toHaveBeenCalled()
  expect(host.querySelector('dialog')!.open).toBe(true)
})
test('host styles, control sizes, direction, bounded result scrolling and forced/reduced modes survive real composition', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
  const { host } = await mount(
    <ThemeScope
      theme={defineTheme({
        id: 'command-test',
        name: 'Command test',
        components: {
          command: { resultsMaxHeight: '120px' },
          dialog: { width: '26rem' },
          combobox: { height: '48px' }
        }
      })}
    >
      <Palette
        items={Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: 'Command ' + i }))}
        defaultOpen
        onAction={() => {}}
        controlSize="large"
        content={{ dir: 'rtl', className: 'custom-modal', style: { borderRadius: '19px' } }}
        input={{ className: 'custom-search' }}
      />
    </ThemeScope>
  )
  const dialog = host.querySelector('dialog')!,
    list = host.querySelector<HTMLElement>('[role="listbox"]')!,
    input = host.querySelector('input')!
  expect(dialog.classList.contains('custom-modal')).toBe(true)
  expect(input.classList.contains('custom-search')).toBe(true)
  expect(getComputedStyle(dialog).borderRadius).toBe('19px')
  expect(getComputedStyle(input).direction).toBe('rtl')
  expect(getComputedStyle(input).height).toBe('48px')
  expect(list.clientHeight).toBeLessThanOrEqual(120)
  expect(list.scrollHeight).toBeGreaterThan(list.clientHeight)
  await key('{ArrowUp}')
  expect(list.scrollTop).toBeGreaterThan(0)
  expect(input.dataset.controlSize).toBe('large')
  expect(document.activeElement).toBe(input)
})
test('consumer shortcuts are scoped to their application and registered action hints run actual project tasks', async () => {
  const { ManageStudyProjects, NavigateWorkspace } =
    await import('../../.storybook/examples/CommandExamples.js')
  const { host } = await mount(
    <>
      <ManageStudyProjects />
      <NavigateWorkspace />
    </>
  )
  const applications = host.querySelectorAll('section[aria-label$="application"]'),
    first = applications[0]!,
    second = applications[1]!
  await act(async () => first.querySelector('button')!.focus())
  await key('{Control>}k{/Control}')
  expect(first.querySelector('dialog')!.open).toBe(true)
  expect(second.querySelector('dialog')!.open).toBe(false)
  expect(first.querySelector('[role="option"] kbd')!.textContent).toBe('Ctrl/⌘N')
  await key('{Control>}n{/Control}')
  expect(first.querySelector('dialog')!.open).toBe(false)
  expect(first.querySelector('output')!.textContent).toBe('Study project 2 created.')
  await act(async () => second.querySelector('button')!.focus())
  await key('{Control>}k{/Control}')
  expect(second.querySelector('dialog')!.open).toBe(true)
  await fill(second.querySelector('input')!, 'settings')
  await key('{ArrowDown}{Enter}')
  expect(second.querySelector('h3')!.textContent).toBe('Workspace settings')
  expect(document.activeElement).toBe(second.querySelector('h3'))
})
test('short modal bounds retain a full-size search and visible results with native scrolling to the close action', async () => {
  const { host } = await mount(
    <Palette
      items={items}
      defaultOpen
      onAction={() => {}}
      content={{ style: { maxHeight: '180px' } }}
    />
  )
  const dialog = host.querySelector('dialog')!,
    input = host.querySelector('input')!,
    list = host.querySelector<HTMLElement>('[role="listbox"]')!
  expect(getComputedStyle(dialog).overflowY).toBe('auto')
  expect(input.getBoundingClientRect().height).toBeGreaterThanOrEqual(39)
  expect(list.clientHeight).toBeGreaterThanOrEqual(39)
  expect(dialog.scrollHeight).toBeGreaterThan(dialog.clientHeight)
  await key('{ArrowDown}')
  expect(
    host.querySelector('[role="option"][aria-selected="true"]')!.getAttribute('data-value')
  ).toBe('new')
  await key('{Tab}')
  const close = host.querySelector<HTMLElement>('[data-slot~="command-close"]')!
  expect(document.activeElement).toBe(close)
  expect(close.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    dialog.getBoundingClientRect().bottom
  )
  await key('{Shift>}{Tab}{/Shift}')
  expect(document.activeElement).toBe(input)
  expect(input.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    dialog.getBoundingClientRect().top
  )
})
