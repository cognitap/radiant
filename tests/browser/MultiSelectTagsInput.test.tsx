import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  Combobox,
  ComboboxInput,
  ComboboxTags,
  ComboboxContent,
  ComboboxPortal,
  MultiSelect,
  MultiSelectInput,
  MultiSelectClear,
  MultiSelectTags,
  MultiSelectContent,
  MultiSelectPortal,
  TagsInput,
  Tag,
  Field,
  Button,
  useCombobox,
  useMultiSelect,
  type MultiSelectProps
} from '../../src/index.js'
import '../../.storybook/styles.css'
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: { root: Root; host: HTMLDivElement }[] = []
async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  if (hydrate) host.innerHTML = renderToString(tree)
  const errors: unknown[] = []
  let root!: Root
  await act(async () => {
    root = hydrate
      ? hydrateRoot(host, tree, { onRecoverableError: error => errors.push(error) })
      : createRoot(host)
    if (!hydrate) root.render(tree)
  })
  mounted.push({ root, host })
  expect(errors).toEqual([])
  return { host, render: (tree: ReactNode) => act(async () => root.render(tree)) }
}
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})
const click = (node: Element) =>
  act(async () => {
    await userEvent.click(node)
  })
const keys = (text: string) =>
  act(async () => {
    await userEvent.keyboard(text)
  })
const fill = (node: Element, text: string) =>
  act(async () => {
    await userEvent.fill(node, text)
  })
const items = [
  { value: '', label: 'Anywhere' },
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Closed', disabled: true }
]
function Multiple(props: Partial<MultiSelectProps>) {
  return (
    <Field label="Projects">
      <MultiSelect
        items={items}
        {...props}
      />
    </Field>
  )
}
const combo = (host: HTMLElement) =>
  host.querySelector<HTMLInputElement>('[data-slot~="combobox-input"]')!
const text = (host: HTMLElement) =>
  host.querySelector<HTMLInputElement>('[data-slot~="tags-input"]')!
const button = (host: HTMLElement, label: string) =>
  Array.from(host.querySelectorAll('button')).find(
    button => button.getAttribute('aria-label') === label || button.textContent === label
  )!
async function paste(node: HTMLInputElement, value: string) {
  await act(async () => {
    const data = new DataTransfer()
    data.setData('text', value)
    node.dispatchEvent(
      new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data })
    )
  })
}
async function reset(form: HTMLFormElement) {
  await act(async () => {
    form.reset()
    await new Promise(resolve => setTimeout(resolve, 10))
  })
}
test('multiple Combobox hydrates named native input, actual Tags and a multiselect listbox', async () => {
  const change = vi.fn(),
    ref = createRef<HTMLInputElement>()
  const { host } = await mount(
    <StrictMode>
      <Field
        label="Projects"
        required
      >
        <MultiSelect
          items={items}
          defaultValue={['', 'a']}
          onValueChange={change}
        >
          <MultiSelectTags />
          <MultiSelectInput ref={ref} />
          <MultiSelectPortal>
            <MultiSelectContent />
          </MultiSelectPortal>
        </MultiSelect>
      </Field>
    </StrictMode>,
    true
  )
  expect(ref.current).toBe(combo(host))
  expect(combo(host).value).toBe('')
  expect(combo(host).labels?.[0]?.textContent).toContain('Projects')
  expect(host.querySelectorAll('[data-slot~="tag"]')).toHaveLength(2)
  expect(button(host, 'Remove Anywhere').getAttribute('data-slot')).toContain('button')
  expect(change).not.toHaveBeenCalled()
  await click(combo(host))
  expect(host.querySelector('[role="listbox"]')?.getAttribute('aria-multiselectable')).toBe('true')
  expect(host.querySelector('[data-value="a"]')?.getAttribute('aria-selected')).toBe('true')
})
test('multiple local selection toggles independently of focus and keeps native input focus', async () => {
  const change = vi.fn(),
    { host } = await mount(<Multiple onValueChange={change} />)
  await fill(combo(host), 'Al')
  await keys('{ArrowDown}{Enter}')
  expect(change).toHaveBeenLastCalledWith(['a'])
  expect(combo(host).value).toBe('')
  expect(combo(host).getAttribute('aria-expanded')).toBe('true')
  expect(document.activeElement).toBe(combo(host))
  await fill(combo(host), 'Be')
  await keys('{ArrowDown}{Enter}')
  expect(change).toHaveBeenLastCalledWith(['a', 'b'])
  await click(button(host, 'Remove Alpha'))
  expect(change).toHaveBeenLastCalledWith(['b'])
  expect(document.activeElement).toBe(combo(host))
  await keys('{Backspace}')
  expect(change).toHaveBeenLastCalledWith([])
  await keys('{Escape}{Escape}')
  expect(change).toHaveBeenCalledTimes(4)
})
test('arrays submit original repeated strings and emit native changes when the first key is unchanged', async () => {
  const changes: string[][] = []
  const { host } = await mount(
    <form
      onChange={event =>
        changes.push(new FormData(event.currentTarget).getAll('projects').map(String))
      }
    >
      <Multiple
        name="projects"
        defaultValue={['a']}
      />
    </form>
  )
  await fill(combo(host), 'Be')
  const before = changes.length
  await keys('{ArrowDown}{Enter}')
  expect(new FormData(host.querySelector('form')!).getAll('projects')).toEqual(['a', 'b'])
  expect(changes.slice(before)).toEqual([['a', 'b']])
  await click(button(host, 'Remove Beta'))
  expect(changes.at(-1)).toEqual(['a'])
  await reset(host.querySelector('form')!)
  expect(new FormData(host.querySelector('form')!).getAll('projects')).toEqual(['a'])
})
test('multiple controlled refusal, prop synchronization and query state never manufacture selection events', async () => {
  const request = vi.fn(),
    events = vi.fn()
  const tree = (value: string[]) => (
    <form onChange={events}>
      <Multiple
        value={value}
        onValueChange={request}
      />
    </form>
  )
  const { host, render } = await mount(tree(['a']))
  await click(button(host, 'Remove Alpha'))
  expect(request).toHaveBeenLastCalledWith([])
  expect(host.querySelectorAll('[data-slot~="tag"]')).toHaveLength(1)
  expect(events).not.toHaveBeenCalled()
  await render(tree(['a', 'b']))
  expect(request).toHaveBeenCalledTimes(1)
  expect(events).not.toHaveBeenCalled()
  await fill(combo(host), 'Closed')
  await keys('{ArrowDown}{Enter}')
  expect(request).toHaveBeenCalledTimes(1)
})
test('asynchronous results retain labels for all absent selected keys', async () => {
  const tree = (results: typeof items, loading = false) => (
    <Multiple
      items={results}
      defaultValue={['a', 'b']}
      loading={loading}
    />
  )
  const { host, render } = await mount(tree(items))
  await render(tree([], true))
  expect(button(host, 'Remove Alpha')).toBeTruthy()
  expect(button(host, 'Remove Beta')).toBeTruthy()
  const remote = await mount(
    <Multiple
      items={[]}
      value={['remote']}
      selectedItems={[
        { value: 'remote', label: <strong>Remote project</strong>, textValue: 'Remote project' }
      ]}
    />
  )
  expect(button(remote.host, 'Remove Remote project')).toBeTruthy()
})
test('multiple form reset is silent, cancellable, linked externally and honors native disabled fieldsets', async () => {
  const change = vi.fn(),
    { host } = await mount(
      <>
        <form id="multiple-owner" />
        <Multiple
          name="projects"
          form="multiple-owner"
          defaultValue={['a']}
          onValueChange={change}
        />
      </>
    )
  await click(button(host, 'Remove Alpha'))
  expect(new FormData(host.querySelector('form')!).getAll('projects')).toEqual([])
  const form = host.querySelector('form')!
  form.addEventListener('reset', event => event.preventDefault(), { once: true })
  await reset(form)
  expect(new FormData(form).getAll('projects')).toEqual([])
  await reset(form)
  expect(new FormData(form).getAll('projects')).toEqual(['a'])
  expect(change).toHaveBeenCalledTimes(1)
  const disabled = await mount(
    <form>
      <fieldset disabled>
        <Multiple
          name="projects"
          defaultValue={['a']}
        />
      </fieldset>
    </form>
  )
  expect(new FormData(disabled.host.querySelector('form')!).getAll('projects')).toEqual([])
})
test('required multiple selection validates the array and redirects native invalid focus to the editor', async () => {
  const { host } = await mount(
    <form>
      <Field
        label="Projects"
        required
      >
        <MultiSelect
          items={items}
          name="projects"
        />
      </Field>
      <Button type="submit">Submit</Button>
    </form>
  )
  const form = host.querySelector('form')!
  expect(form.checkValidity()).toBe(false)
  await click(button(host, 'Submit'))
  expect(document.activeElement).toBe(combo(host))
  await click(combo(host))
  await keys('{ArrowDown}{Enter}')
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).getAll('projects')).toEqual([''])
})
test('single and multiple state hooks stay type/mode scoped while custom composition uses the same owner', async () => {
  function Read() {
    expect(useCombobox()).toBe(null)
    const multiple = useCombobox({ multiple: true }),
      alias = useMultiSelect()
    expect(multiple?.value).toEqual(alias?.value)
    return <Button onClick={() => alias?.setValue(['b'])}>Choose Beta</Button>
  }
  const { host } = await mount(
    <Field label="Projects">
      <Combobox
        multiple
        items={items}
      >
        <ComboboxTags />
        <ComboboxInput />
        <Read />
        <ComboboxPortal>
          <ComboboxContent />
        </ComboboxPortal>
      </Combobox>
    </Field>
  )
  await click(button(host, 'Choose Beta'))
  expect(button(host, 'Remove Beta')).toBeTruthy()
})
test('TagsInput commits Enter, desktop/mobile separators and native Backspace/removal', async () => {
  const change = vi.fn(),
    { host } = await mount(
      <Field label="Topics">
        <TagsInput onValueChange={change} />
      </Field>
    )
  await fill(text(host), 'alpha')
  await keys('{Enter}')
  expect(change).toHaveBeenLastCalledWith(['alpha'])
  expect(text(host).value).toBe('')
  await fill(text(host), 'beta,gamma')
  expect(change).toHaveBeenLastCalledWith(['alpha', 'beta'])
  expect(text(host).value).toBe('gamma')
  await keys('{Enter}')
  expect(change).toHaveBeenLastCalledWith(['alpha', 'beta', 'gamma'])
  await keys('{Backspace}')
  expect(change).toHaveBeenLastCalledWith(['alpha', 'beta'])
  await click(button(host, 'Remove alpha'))
  expect(change).toHaveBeenLastCalledWith(['beta'])
  expect(document.activeElement).toBe(text(host))
})
test('TagsInput validates, limits, preserves rejected paste tokens and can recover from an oversized owned array', async () => {
  const { host } = await mount(
    <Field label="Topics">
      <TagsInput
        maxCount={2}
        validate={value => value.length >= 3 || 'Use three letters.'}
      />
    </Field>
  )
  await click(text(host))
  await paste(text(host), 'ok,alpha,beta,gamma')
  expect(host.querySelectorAll('[data-slot~="tag"]')).toHaveLength(2)
  expect(text(host).value).toBe('ok,gamma')
  expect(host.textContent).toContain('Use three letters.')
  await fill(text(host), '')
  const oversized = await mount(
    <form>
      <Field label="Topics">
        <TagsInput
          defaultValue={['alpha', 'beta', 'gamma']}
          maxCount={2}
        />
      </Field>
    </form>
  )
  expect(oversized.host.querySelector('form')!.checkValidity()).toBe(false)
  await click(button(oversized.host, 'Remove gamma'))
  expect(oversized.host.querySelector('form')!.checkValidity()).toBe(true)
})
test('controlled TagsInput refuses additions without losing the draft, and prop sync never notifies', async () => {
  const request = vi.fn(),
    events = vi.fn(),
    tree = (values: string[]) => (
      <form onChange={events}>
        <Field label="Topics">
          <TagsInput
            value={values}
            onValueChange={request}
          />
        </Field>
      </form>
    )
  const { host, render } = await mount(tree([]))
  await fill(text(host), 'alpha')
  const before = events.mock.calls.length
  await keys('{Enter}')
  expect(request).toHaveBeenLastCalledWith(['alpha'])
  expect(text(host).value).toBe('alpha')
  expect(host.querySelectorAll('[data-slot~="tag"]')).toHaveLength(0)
  expect(events).toHaveBeenCalledTimes(before)
  await render(tree(['alpha']))
  expect(text(host).value).toBe('')
  expect(request).toHaveBeenCalledTimes(1)
  expect(events).toHaveBeenCalledTimes(before)
})
test('draft validation stays visible when a controlled owner refuses a partially valid paste', async () => {
  const request = vi.fn()
  const { host } = await mount(
    <TagsInput
      aria-label="Topics"
      value={[]}
      onValueChange={request}
      validate={value => value.length >= 3 || 'Use three letters.'}
    />
  )
  await click(text(host))
  await paste(text(host), 'no,alpha')
  expect(request).toHaveBeenLastCalledWith(['alpha'])
  expect(text(host).value).toBe('no,alpha')
  expect(host.textContent).toContain('Use three letters.')
  expect(host.querySelectorAll('[data-slot~="tag"]')).toHaveLength(0)
})
test('TagsInput Field required uses committed tags, submits arrays and resets without change requests', async () => {
  const ref = createRef<HTMLInputElement>(),
    change = vi.fn(),
    arrays: string[][] = []
  const { host } = await mount(
    <form
      onChange={event =>
        arrays.push(new FormData(event.currentTarget).getAll('topics').map(String))
      }
    >
      <Field
        label="Topics"
        required
      >
        <TagsInput
          ref={ref}
          name="topics"
          defaultValue={['alpha']}
          onValueChange={change}
        />
      </Field>
      <Button type="submit">Submit</Button>
    </form>,
    true
  )
  const form = host.querySelector('form')!
  expect(ref.current).toBe(text(host))
  expect(text(host).required).toBe(false)
  expect(form.checkValidity()).toBe(true)
  await fill(text(host), 'beta')
  const before = arrays.length
  await keys('{Enter}')
  expect(arrays.slice(before)).toEqual([['alpha', 'beta']])
  expect(new FormData(form).getAll('topics')).toEqual(['alpha', 'beta'])
  await reset(form)
  expect(new FormData(form).getAll('topics')).toEqual(['alpha'])
  expect(text(host).value).toBe('')
  expect(change).toHaveBeenCalledTimes(1)
  await click(button(host, 'Remove alpha'))
  expect(form.checkValidity()).toBe(false)
  await click(button(host, 'Submit'))
  expect(document.activeElement).toBe(text(host))
})
test('TagsInput composition does not split interim IME input and native consumer cancellation wins', async () => {
  const change = vi.fn(),
    { host } = await mount(
      <Field label="Topics">
        <TagsInput onValueChange={change} />
      </Field>
    )
  const node = text(host)
  await act(async () =>
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
  )
  await fill(node, 'alpha,')
  expect(change).not.toHaveBeenCalled()
  await act(async () =>
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'alpha,' }))
  )
  expect(change).toHaveBeenLastCalledWith(['alpha'])
  const stopped = await mount(
    <TagsInput
      aria-label="Stopped"
      onKeyDown={event => event.preventDefault()}
      onPaste={event => event.preventDefault()}
      onValueChange={change}
    />
  )
  await fill(text(stopped.host), 'beta')
  const before = change.mock.calls.length
  await keys('{Enter}')
  await paste(text(stopped.host), 'gamma,delta')
  expect(change).toHaveBeenCalledTimes(before)
})
test('TagsInput disabled/read-only native hosts and callback ref cleanup preserve form behavior', async () => {
  const change = vi.fn(),
    cleanup = vi.fn(),
    ref = vi.fn(() => cleanup)
  const { host, render } = await mount(
    <TagsInput
      aria-label="Topics"
      defaultValue={['alpha']}
      readOnly
      ref={ref}
      onValueChange={change}
      parts={{
        wrapper: { style: { gap: 9 } },
        tag: { style: { maxWidth: 180 } },
        remove: { style: { borderRadius: 3 } }
      }}
    />
  )
  expect(text(host).readOnly).toBe(true)
  expect(button(host, 'Remove alpha').disabled).toBe(true)
  expect(host.querySelector<HTMLElement>('[data-slot="tags-input-control"]')!.style.gap).toBe('9px')
  await keys('{Backspace}')
  expect(change).not.toHaveBeenCalled()
  await render(<span>Removed</span>)
  expect(cleanup).toHaveBeenCalled()
})
test('Tag uses Badge and Button identities, keyboard activation, unavailable guards and native host styles', async () => {
  const remove = vi.fn(),
    ref = createRef<HTMLSpanElement>()
  const { host, render } = await mount(
    <Tag
      ref={ref}
      removeLabel="Remove planning"
      onRemove={remove}
      style={{ maxWidth: 200 }}
    >
      Planning
    </Tag>,
    true
  )
  expect(ref.current?.tagName).toBe('SPAN')
  expect(ref.current?.getAttribute('data-slot')).toBe('badge tag')
  expect(ref.current?.style.maxWidth).toBe('200px')
  const action = button(host, 'Remove planning')
  expect(action.type).toBe('button')
  await act(async () => action.focus())
  await keys('{Enter}')
  expect(remove).toHaveBeenCalledTimes(1)
  await render(
    <Tag
      removeLabel="Remove planning"
      onRemove={remove}
      pending
    >
      Planning
    </Tag>
  )
  await click(button(host, 'Remove planning'))
  expect(remove).toHaveBeenCalledTimes(1)
  await render(
    <Tag
      removeLabel="Remove planning"
      onRemove={remove}
      disabled
    >
      Planning
    </Tag>
  )
  expect(button(host, 'Remove planning').disabled).toBe(true)
})

test('optional multiple Clear is a native Tab stop and restores input focus after clearing', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Field label="Projects">
      <MultiSelect
        items={items}
        defaultValue={['a', 'b']}
        onValueChange={change}
      >
        <MultiSelectTags />
        <MultiSelectInput />
        <MultiSelectClear />
      </MultiSelect>
    </Field>
  )
  await click(combo(host))
  await keys('{Escape}{Tab}')
  expect(document.activeElement).toBe(button(host, 'Clear selection'))
  await keys('{Enter}')
  expect(change).toHaveBeenLastCalledWith([])
  expect(document.activeElement).toBe(combo(host))
})

test('read-only array fields keep native submission and skip native constraint validation', async () => {
  const { host } = await mount(
    <form>
      <Field
        label="Topics"
        required
      >
        <TagsInput
          name="topics"
          readOnly
        />
      </Field>
      <Field
        label="Projects"
        required
      >
        <MultiSelect
          items={items}
          readOnly
        >
          <MultiSelectInput />
        </MultiSelect>
      </Field>
    </form>
  )
  expect(host.querySelector('form')!.checkValidity()).toBe(true)
  const named = await mount(
    <form>
      <TagsInput
        aria-label="Topics"
        name="topics"
        readOnly
        defaultValue={['alpha']}
      />
    </form>
  )
  expect(new FormData(named.host.querySelector('form')!).getAll('topics')).toEqual(['alpha'])
})

test('live root read-only changes update every multiple selection affordance and native validity', async () => {
  const tree = (readOnly: boolean) => (
    <form>
      <Field
        label="Projects"
        required
      >
        <MultiSelect
          items={items}
          readOnly={readOnly}
        >
          <MultiSelectTags />
          <MultiSelectInput />
          <MultiSelectClear />
        </MultiSelect>
      </Field>
    </form>
  )
  const { host, render } = await mount(tree(true))
  expect(combo(host).readOnly).toBe(true)
  expect(host.querySelector('form')!.checkValidity()).toBe(true)
  await render(tree(false))
  expect(combo(host).readOnly).toBe(false)
  expect(host.querySelector('form')!.checkValidity()).toBe(false)
  await render(tree(true))
  expect(host.querySelector('form')!.checkValidity()).toBe(true)
})
test('the open popup follows the editor when committed tags add rows above it', async () => {
  const { host } = await mount(
    <div style={{ width: 190 }}>
      <Field label="Projects">
        <MultiSelect
          items={items}
          defaultOpen
        />
      </Field>
    </div>
  )
  const input = combo(host),
    popup = host.querySelector<HTMLElement>('[data-slot~="combobox-content"]')!
  const before = input.getBoundingClientRect().top
  await click(host.querySelector('[data-value="a"]')!)
  expect(input.getBoundingClientRect().top).toBeGreaterThan(before + 20)
  await act(async () => {
    await vi.waitFor(() =>
      expect(
        Math.abs(popup.getBoundingClientRect().top - input.getBoundingClientRect().bottom - 4)
      ).toBeLessThan(2)
    )
  })
  expect(popup.matches(':popover-open')).toBe(true)
})
