import { act, createRef, StrictMode } from 'react'
import { createPortal } from 'react-dom'
import { expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteClear,
  AutocompletePortal,
  AutocompleteContent,
  Field,
  Button,
  ThemeScope,
  defineTheme
} from '../../src/index.js'
import { mount, click, key, pause, shown } from './familyHarness.js'
const items = [
  { value: 'Budapest', label: 'Budapest' },
  { value: 'Berlin', label: 'Berlin' },
  { value: 'Lisbon', label: 'Lisbon', disabled: true },
  { value: 'maya@example.com', label: 'Maya Chen' }
]
const fill = (node: HTMLInputElement, value: string) =>
  act(async () => {
    await userEvent.fill(node, value)
  })
test('native text hydrates with Field relationships, one submitted host and real composition identities', async () => {
  const ref = createRef<HTMLInputElement>(),
    { host } = await mount(
      <StrictMode>
        <form>
          <Field
            label="Destination"
            description="Choose or write a city"
            required
          >
            <Autocomplete
              items={items}
              name="city"
              defaultValue="Custom city"
            >
              <AutocompleteInput ref={ref} />
              <AutocompletePortal>
                <AutocompleteContent />
              </AutocompletePortal>
            </Autocomplete>
          </Field>
        </form>
      </StrictMode>,
      true
    ),
    input = host.querySelector('input')!
  expect(ref.current).toBe(input)
  expect(host.querySelectorAll('input')).toHaveLength(1)
  expect(input.type).toBe('text')
  expect(input.required).toBe(true)
  expect(input.labels?.[0]?.textContent).toContain('Destination')
  expect(input.dataset.slot).toBe('combobox-input autocomplete-input')
  expect(input.value).toBe('Custom city')
  expect(new FormData(host.querySelector('form')!).getAll('city')).toEqual(['Custom city'])
  expect(input.getAttribute('aria-describedby')).toBe(
    host.querySelector('[data-slot="field-description"]')?.id
  )
})
test('off-list editing survives Escape, blur and native submission without choosing a suggestion', async () => {
  const change = vi.fn(),
    submit = vi.fn(),
    { host } = await mount(
      <form
        onSubmit={e => {
          e.preventDefault()
          submit(new FormData(e.currentTarget).get('topic'))
        }}
      >
        <Autocomplete
          items={items}
          name="topic"
          onValueChange={change}
        >
          <AutocompleteInput aria-label="Topic" />
          <AutocompletePortal>
            <AutocompleteContent />
          </AutocompletePortal>
        </Autocomplete>
        <Button type="submit">Save topic</Button>
      </form>
    ),
    input = host.querySelector('input')!
  await fill(input, 'Research with screen magnifiers')
  await key('{Escape}')
  await key('{Escape}')
  expect(input.value).toBe('Research with screen magnifiers')
  await key('{Tab}')
  expect(document.activeElement).toBe(host.querySelector('button'))
  await key('{Enter}')
  expect(submit).toHaveBeenCalledExactlyOnceWith('Research with screen magnifiers')
  expect(change).toHaveBeenCalledExactlyOnceWith('Research with screen magnifiers')
})
test('keyboard and pointer acceptance edit the same native input with literal completion values and native events', async () => {
  const change = vi.fn(),
    native = vi.fn(),
    { host } = await mount(
      <form onChange={native}>
        <Autocomplete
          items={items}
          name="city"
          onValueChange={change}
        >
          <AutocompleteInput aria-label="City" />
          <AutocompleteClear />
          <AutocompletePortal>
            <AutocompleteContent />
          </AutocompletePortal>
        </Autocomplete>
      </form>
    ),
    input = host.querySelector('input')!
  await fill(input, 'Bu')
  await key('{ArrowDown}')
  expect(input.value).toBe('Bu')
  expect(
    host.querySelector('[role="option"][aria-selected="true"]')?.getAttribute('data-value')
  ).toBe('Budapest')
  await key('{Enter}')
  expect(input.value).toBe('Budapest')
  expect(input.getAttribute('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(input)
  expect(change.mock.calls.map(x => x[0])).toEqual(['Bu', 'Budapest'])
  expect(native).toHaveBeenCalledTimes(2)
  await fill(input, 'maya@')
  await click(host.querySelector<HTMLElement>('[role="option"][data-value="maya@example.com"]')!)
  expect(input.value).toBe('maya@example.com')
  expect(new FormData(host.querySelector('form')!).get('city')).toBe('maya@example.com')
  const clear = host.querySelector<HTMLButtonElement>('[data-slot~="autocomplete-clear"]')!
  expect(clear.dataset.slot).toBe('button combobox-clear autocomplete-clear')
  await click(clear)
  expect(input.value).toBe('')
  expect(host.querySelector('[data-slot~="autocomplete-clear"]')).toBeNull()
  expect(document.activeElement).toBe(input)
  expect(host.querySelector('input')).toBe(input)
})
test('controlled refusal and prop synchronization preserve the owned form value while reset is silent', async () => {
  const requests = vi.fn(),
    tree = (value: string) => (
      <form>
        <Autocomplete
          items={items}
          filter={null}
          name="topic"
          value={value}
          onValueChange={requests}
        >
          <AutocompleteInput aria-label="Topic" />
          <AutocompletePortal>
            <AutocompleteContent />
          </AutocompletePortal>
        </Autocomplete>
      </form>
    ),
    { host, render } = await mount(tree('Original')),
    input = host.querySelector('input')!
  await fill(input, 'Requested')
  expect(input.value).toBe('Original')
  expect(requests).toHaveBeenCalledExactlyOnceWith('Requested')
  requests.mockClear()
  await click(input)
  await click(host.querySelector<HTMLElement>('[role="option"][data-value="Budapest"]')!)
  expect(requests).toHaveBeenCalledExactlyOnceWith('Budapest')
  expect(input.value).toBe('Original')
  expect(new FormData(host.querySelector('form')!).get('topic')).toBe('Original')
  requests.mockClear()
  await render(tree('Parent update'))
  expect(input.value).toBe('Parent update')
  expect(requests).not.toHaveBeenCalled()
  await act(async () => host.querySelector('form')!.reset())
  await pause(20)
  expect(input.value).toBe('Parent update')
  expect(requests).not.toHaveBeenCalled()
})
test('native, cancelled and dynamically associated external resets restore only their uncontrolled text owner', async () => {
  const requests = vi.fn(),
    { host, render } = await mount(
      <Autocomplete
        items={items}
        form="late-form"
        name="city"
        defaultValue="Initial"
        onValueChange={requests}
      >
        <AutocompleteInput aria-label="City" />
      </Autocomplete>
    ),
    input = host.querySelector('input')!,
    owner = document.createElement('form')
  owner.id = 'late-form'
  host.append(owner)
  await fill(input, 'Edited')
  requests.mockClear()
  await act(async () => owner.reset())
  await pause(20)
  expect(input.value).toBe('Initial')
  expect(requests).not.toHaveBeenCalled()
  owner.addEventListener('reset', e => e.preventDefault())
  await fill(input, 'Keep draft')
  await act(async () => owner.reset())
  await pause(20)
  expect(input.value).toBe('Keep draft')
  await render(
    <Autocomplete
      items={items}
      form="other-form"
      name="city"
      defaultValue="Initial"
    >
      <AutocompleteInput aria-label="City" />
    </Autocomplete>
  )
  const other = document.createElement('form')
  other.id = 'other-form'
  host.append(other)
  await act(async () => other.reset())
  await pause(20)
  expect(input.value).toBe('Initial')
  owner.remove()
  other.remove()
})
test('async result, loading and error changes never replace arbitrary text or invalidate an off-list value', async () => {
  const request = vi.fn(),
    tree = (loading: boolean, error?: string) => (
      <form>
        <Autocomplete
          items={loading ? [] : items}
          filter={null}
          loading={loading}
          error={error}
          defaultOpen
          defaultValue="Other destination"
          name="city"
          required
          onValueChange={request}
        >
          <AutocompleteInput aria-label="City" />
          <AutocompletePortal>
            <AutocompleteContent />
          </AutocompletePortal>
        </Autocomplete>
      </form>
    ),
    { host, render } = await mount(tree(true)),
    input = host.querySelector('input')!
  expect(host.querySelector('[role="status"]')?.textContent).toContain('Loading')
  await render(tree(false, 'Catalog unavailable'))
  expect(host.querySelector('[role="status"]')?.textContent).toContain('Catalog unavailable')
  expect(input.value).toBe('Other destination')
  expect(host.querySelector('form')?.checkValidity()).toBe(true)
  await render(tree(false))
  expect(input.value).toBe('Other destination')
  expect(request).not.toHaveBeenCalled()
  expect(host.querySelectorAll('[role="option"]')).toHaveLength(4)
  input.focus()
  await key('{ArrowDown}')
  await key('{Enter}')
  expect(input.value).toBe('Budapest')
  expect(request).toHaveBeenCalledExactlyOnceWith('Budapest')
})
test('shared theme, sizes and caller host styles preserve native required, disabled, readonly and RTL states', async () => {
  for (const [controlSize, height] of [
    ['small', 32],
    ['medium', 40],
    ['large', 48]
  ] as const) {
    const ref = createRef<HTMLInputElement>(),
      { host, render } = await mount(
        <ThemeScope
          theme={defineTheme({
            id: 'autocomplete',
            name: 'Autocomplete',
            components: { combobox: { background: 'rgb(230, 240, 230)' } }
          })}
        >
          <Field
            label="Topic"
            required
          >
            <Autocomplete
              items={items}
              controlSize={controlSize}
            >
              <AutocompleteInput
                ref={ref}
                dir="rtl"
                className="px-0"
                style={{ color: 'red' }}
              />
            </Autocomplete>
          </Field>
        </ThemeScope>
      ),
      input = host.querySelector('input')!
    expect(ref.current).toBe(input)
    expect(input.getBoundingClientRect().height).toBe(height)
    expect(input.required).toBe(true)
    expect(getComputedStyle(input).direction).toBe('rtl')
    expect(getComputedStyle(input).paddingInlineStart).toBe('0px')
    expect(getComputedStyle(input).backgroundColor).toBe('rgb(230, 240, 230)')
    expect(input.style.color).toBe('red')
    await render(
      <Field
        label="Topic"
        disabled
      >
        <Autocomplete items={items}>
          <AutocompleteInput />
        </Autocomplete>
      </Field>
    )
    expect(host.querySelector('input')?.disabled).toBe(true)
    await render(
      <Field label="Topic">
        <Autocomplete
          items={items}
          readOnly
          defaultValue="Fixed"
        >
          <AutocompleteInput />
        </Autocomplete>
      </Field>
    )
    const readonly = host.querySelector('input')!
    expect(readonly.readOnly).toBe(true)
    await click(readonly)
    expect(readonly.getAttribute('aria-expanded')).toBe('false')
  }
})
test('forced colors, reduced motion and composition keys preserve native editing and popup focus', async () => {
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  const { host } = await mount(
      <>
        <button>Before</button>
        <Autocomplete items={items}>
          <AutocompleteInput aria-label="City" />
          <AutocompletePortal>
            <AutocompleteContent />
          </AutocompletePortal>
        </Autocomplete>
      </>
    ),
    input = host.querySelector('input')!,
    content = host.querySelector<HTMLDivElement>('[data-slot~="autocomplete-content"]')!
  await click(host.querySelector('button')!)
  await key('{Tab}')
  expect(document.activeElement).toBe(input)
  expect(getComputedStyle(input).outlineWidth).toBe('2px')
  expect(getComputedStyle(input).borderTopColor).not.toBe(getComputedStyle(input).backgroundColor)
  await fill(input, 'Bu')
  await act(async () =>
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true })
    )
  )
  expect(input.value).toBe('Bu')
  expect(shown(content)).toBe(true)
  await key('{ArrowDown}')
  await key('{Enter}')
  expect(input.value).toBe('Budapest')
  expect(shown(content)).toBe(false)
  expect(document.activeElement).toBe(input)
})
test('native forms inside shadow roots reset the actual named text field', async () => {
  const shell = document.createElement('div')
  document.body.append(shell)
  const shadow = shell.attachShadow({ mode: 'open' })
  let mounted: Awaited<ReturnType<typeof mount>> | undefined
  try {
    mounted = await mount(
      createPortal(
        <form>
          <Autocomplete
            items={items}
            name="topic"
            defaultValue="Initial"
          >
            <AutocompleteInput aria-label="Topic" />
          </Autocomplete>
        </form>,
        shadow
      )
    )
    const input = shadow.querySelector('input')!
    await fill(input, 'Edited')
    await act(async () => shadow.querySelector('form')!.reset())
    await pause(20)
    expect(input.value).toBe('Initial')
    expect(new FormData(shadow.querySelector('form')!).get('topic')).toBe('Initial')
  } finally {
    await mounted?.render(null)
    shell.remove()
  }
})
test('unchanged suggestions are silent and Enter without a highlighted option submits native free text', async () => {
  const changes = vi.fn(),
    native = vi.fn(),
    submit = vi.fn(),
    { host } = await mount(
      <form
        onChange={native}
        onSubmit={event => {
          event.preventDefault()
          submit(new FormData(event.currentTarget).get('city'))
        }}
      >
        <Autocomplete
          items={items}
          name="city"
          defaultValue="Budapest"
          onValueChange={changes}
        >
          <AutocompleteInput aria-label="City" />
          <AutocompletePortal>
            <AutocompleteContent />
          </AutocompletePortal>
        </Autocomplete>
        <Button type="submit">Save</Button>
      </form>
    ),
    input = host.querySelector('input')!
  await click(input)
  await click(host.querySelector<HTMLElement>('[role="option"][data-value="Budapest"]')!)
  expect(changes).not.toHaveBeenCalled()
  expect(native).not.toHaveBeenCalled()
  await fill(input, 'Unlisted destination')
  await key('{Enter}')
  expect(submit).toHaveBeenCalledExactlyOnceWith('Unlisted destination')
  expect(input.getAttribute('aria-expanded')).toBe('false')
  expect(changes).toHaveBeenCalledExactlyOnceWith('Unlisted destination')
  expect(native).toHaveBeenCalledOnce()
  await fill(input, 'Li')
  await act(async () =>
    host.querySelector<HTMLElement>('[role="option"][aria-disabled="true"]')!.click()
  )
  expect(input.value).toBe('Li')
  await fill(input, 'Lisbon')
  expect(new FormData(host.querySelector('form')!).get('city')).toBe('Lisbon')
})
