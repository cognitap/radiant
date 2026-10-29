import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent, commands } from 'vitest/browser'
import {
  Combobox,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxClear,
  ComboboxContent,
  ComboboxPortal,
  ComboboxItem,
  Field,
  ThemeScope,
  defineTheme,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  useCombobox
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const items = [
  { value: '', label: 'Anywhere' },
  { value: 'berlin', label: 'Berlin', disabled: true },
  { value: 'budapest', label: 'Budapest' },
  { value: 'oslo', label: 'Oslo' },
  { value: 'rome', label: 'Rome' }
]
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
  await commands.emulatePreferences({ reducedMotion: 'no-preference', forcedColors: 'none' })
})
const click = async (target: Element) =>
  act(async () => {
    await userEvent.click(target)
  })
const keys = async (text: string) =>
  act(async () => {
    await userEvent.keyboard(text)
  })
const input = (host: HTMLElement) =>
  host.querySelector<HTMLInputElement>('[data-slot="combobox-input"]')!
const native = (host: HTMLElement) =>
  host.querySelector<HTMLInputElement>('[data-slot="combobox-native"]')!
const popup = (host: HTMLElement) =>
  host.querySelector<HTMLDivElement>('[data-slot="combobox-content"]')!
const options = (host: HTMLElement) => [...host.querySelectorAll<HTMLElement>('[role="option"]')]
const active = (host: HTMLElement) =>
  document.getElementById(input(host).getAttribute('aria-activedescendant') ?? '')
async function replace(host: HTMLElement, text: string) {
  await click(input(host))
  await act(async () => {
    await userEvent.fill(input(host), text)
  })
}

test('hydrates with Field relationships, native hosts and no initial requests', async () => {
  const change = vi.fn()
  const query = vi.fn()
  const expansion = vi.fn()
  const ref = createRef<HTMLInputElement>()
  const { host } = await mount(
    <StrictMode>
      <Field
        label="Destination"
        description="Find a city"
        error="Choose a city"
        controlId="destination"
      >
        <Combobox
          items={items}
          defaultValue="oslo"
          onValueChange={change}
          onQueryChange={query}
          onOpenChange={expansion}
        >
          <ComboboxInput ref={ref} />
          <ComboboxPortal>
            <ComboboxContent />
          </ComboboxPortal>
        </Combobox>
      </Field>
    </StrictMode>,
    true
  )
  expect(ref.current).toBe(input(host))
  expect(ref.current?.id).toBe('destination')
  expect(input(host).labels?.[0]?.textContent).toContain('Destination')
  expect(input(host).getAttribute('aria-describedby')?.split(' ').length).toBe(2)
  expect(input(host).getAttribute('aria-invalid')).toBe('true')
  expect(input(host).value).toBe('Oslo')
  expect(popup(host).matches(':popover-open')).toBe(false)
  expect(change).not.toHaveBeenCalled()
  expect(query).not.toHaveBeenCalled()
  expect(expansion).not.toHaveBeenCalled()
})

test('typing filters local items without committing; arrows skip disabled options and Enter commits', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Field label="City">
      <Combobox
        items={items}
        name="city"
        defaultValue="oslo"
        onValueChange={change}
      />
    </Field>
  )
  await replace(host, 'bu')
  expect(options(host).map(item => item.textContent)).toEqual(['Budapest✓'])
  expect(native(host).value).toBe('oslo')
  expect(change).not.toHaveBeenCalled()
  expect(document.activeElement).toBe(input(host))
  await keys('{ArrowDown}')
  expect(active(host)?.dataset.value).toBe('budapest')
  expect(active(host)?.getAttribute('aria-selected')).toBe('true')
  await keys('{Enter}')
  expect(input(host).value).toBe('Budapest')
  expect(native(host).value).toBe('budapest')
  expect(input(host).getAttribute('aria-expanded')).toBe('false')
  expect(change).toHaveBeenCalledExactlyOnceWith('budapest')
  await keys('{ArrowDown}{ArrowDown}')
  expect(active(host)?.dataset.value).toBe('budapest')
  await keys('{ArrowUp}{ArrowUp}')
  expect(active(host)?.dataset.value).toBe('')
})

test('Escape and blur discard draft search; Tab exits without committing or trapping focus', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <>
      <Field label="City">
        <Combobox
          items={items}
          defaultValue="oslo"
          onValueChange={change}
        />
      </Field>
      <button>After</button>
    </>
  )
  await replace(host, 'ro')
  await keys('{ArrowDown}{Escape}')
  expect(input(host).value).toBe('Oslo')
  expect(document.activeElement).toBe(input(host))
  expect(change).not.toHaveBeenCalled()
  await replace(host, 'bu')
  await keys('{ArrowDown}{Tab}')
  expect(document.activeElement?.textContent).toBe('After')
  expect(input(host).value).toBe('Oslo')
  expect(change).not.toHaveBeenCalled()
  await keys('{Shift>}{Tab}{/Shift}')
  expect(document.activeElement).toBe(input(host))
})

test('text editing, Home/End, modifier keys and IME do not commit or navigate results', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Field label="City">
      <Combobox
        items={items}
        onValueChange={change}
      />
    </Field>
  )
  await replace(host, 'Rome')
  await keys('{Home}{ArrowRight}{End}')
  expect(input(host).selectionStart).toBe(4)
  expect(active(host)).toBeNull()
  await act(async () => {
    input(host).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true })
    )
  })
  expect(change).not.toHaveBeenCalled()
  expect(input(host).value).toBe('Rome')
  await keys('{Alt>}{ArrowUp}{/Alt}')
  expect(input(host).getAttribute('aria-expanded')).toBe('false')
  await keys('{Alt>}{ArrowDown}{/Alt}')
  expect(active(host)).toBeNull()
  expect(input(host).getAttribute('aria-expanded')).toBe('true')
})

test('pointer selection keeps input focus and honors consumer cancellation', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Field label="City">
      <Combobox
        items={items}
        onValueChange={change}
      >
        <ComboboxInput />
        <ComboboxPortal>
          <ComboboxContent>
            {items.map(item => (
              <ComboboxItem
                key={item.value}
                value={item.value}
                onClick={event => {
                  if (item.value === 'rome') event.preventDefault()
                }}
              />
            ))}
          </ComboboxContent>
        </ComboboxPortal>
      </Combobox>
    </Field>
  )
  await click(input(host))
  await click(options(host).find(item => item.dataset.value === 'rome')!)
  expect(change).not.toHaveBeenCalled()
  expect(document.activeElement).toBe(input(host))
  await click(options(host).find(item => item.dataset.value === 'oslo')!)
  expect(change).toHaveBeenCalledExactlyOnceWith('oslo')
  expect(document.activeElement).toBe(input(host))
})

test('controlled selection refusal does not emit form change; prop sync emits no request or focus', async () => {
  const change = vi.fn()
  const formChange = vi.fn()
  const tree = (value: string) => (
    <form
      onSubmit={event => event.preventDefault()}
      onChange={formChange}
    >
      <Field label="City">
        <Combobox
          items={items}
          value={value}
          onValueChange={change}
        />
      </Field>
      <button>After</button>
    </form>
  )
  const { host, render } = await mount(tree('oslo'))
  await click(input(host))
  await click(options(host).find(item => item.dataset.value === 'rome')!)
  expect(change).toHaveBeenCalledExactlyOnceWith('rome')
  expect(formChange).not.toHaveBeenCalled()
  expect(input(host).value).toBe('Oslo')
  await click(host.querySelector('form > button')!)
  change.mockClear()
  await render(tree('budapest'))
  expect(input(host).value).toBe('Budapest')
  expect(change).not.toHaveBeenCalled()
  expect(formChange).not.toHaveBeenCalled()
  expect(document.activeElement?.textContent).toBe('After')
})

test('forms submit committed keys including empty strings, clear to null, reset silently and focus invalid input', async () => {
  const change = vi.fn()
  const query = vi.fn()
  const formChange = vi.fn()
  const { host } = await mount(
    <form
      onSubmit={event => event.preventDefault()}
      onChange={formChange}
    >
      <Field
        label="City"
        required
      >
        <Combobox
          items={items}
          name="city"
          defaultValue="oslo"
          onValueChange={change}
          onQueryChange={query}
        />
      </Field>
      <button type="reset">Reset</button>
    </form>
  )
  const form = host.querySelector('form')!
  await click(input(host))
  await click(options(host)[0])
  expect(new FormData(form).get('city')).toBe('')
  expect(form.checkValidity()).toBe(true)
  expect(formChange).toHaveBeenCalledTimes(1)
  await keys('{Escape}')
  expect(change).toHaveBeenLastCalledWith(null)
  expect(form.reportValidity()).toBe(false)
  expect(document.activeElement).toBe(input(host))
  await replace(host, 'ro')
  change.mockClear()
  query.mockClear()
  formChange.mockClear()
  await act(async () => form.reset())
  await expect.poll(() => input(host).value).toBe('Oslo')
  expect(new FormData(form).get('city')).toBe('oslo')
  expect(change).not.toHaveBeenCalled()
  expect(query).not.toHaveBeenCalled()
  expect(formChange).not.toHaveBeenCalled()
})

test('cancelled reset and controlled reset retain selection; external form ownership works', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <>
      <form
        id="trip"
        onReset={event => event.preventDefault()}
      />
      <Field label="City">
        <Combobox
          items={items}
          form="trip"
          name="city"
          value="rome"
          onValueChange={change}
        />
      </Field>
    </>
  )
  const form = host.querySelector('form')!
  await act(async () => form.reset())
  await new Promise(resolve => setTimeout(resolve, 10))
  expect(new FormData(form).get('city')).toBe('rome')
  expect(change).not.toHaveBeenCalled()
})

test('async replacement invalidates stale active options, ignores loading results and retains a chosen label', async () => {
  const change = vi.fn()
  const tree = (results: typeof items, loading = false, error?: string) => (
    <Field label="City">
      <Combobox
        items={results}
        filter={null}
        name="city"
        defaultValue="oslo"
        loading={loading}
        error={error}
        onValueChange={change}
      />
    </Field>
  )
  const { host, render } = await mount(tree(items))
  await click(input(host))
  await keys('{ArrowDown}{ArrowDown}')
  expect(active(host)?.dataset.value).toBe('budapest')
  await render(tree(items, true))
  expect(active(host)).toBeNull()
  expect(options(host)).toHaveLength(0)
  expect(host.querySelector('[role="status"]')?.textContent).toBe('Loading results…')
  await keys('{Enter}')
  expect(change).not.toHaveBeenCalled()
  await render(tree([{ value: 'rome', label: 'Rome' }]))
  expect(active(host)).toBeNull()
  await keys('{Escape}')
  expect(input(host).value).toBe('Oslo')
  expect(native(host).value).toBe('oslo')
  await render(tree([], false, 'Connection lost'))
  await click(input(host))
  expect(host.querySelector('[role="status"]')?.textContent).toBe('Connection lost')
  expect(change).not.toHaveBeenCalled()
})

test('application filtered results bypass local matching and selectedItem supports initially absent selections', async () => {
  const { host } = await mount(
    <Field label="City">
      <Combobox
        items={[{ value: 'rome', label: 'Rome' }]}
        filter={null}
        value="oslo"
        selectedItem={{ value: 'oslo', label: 'Oslo, Norway' }}
      />
    </Field>
  )
  expect(input(host).value).toBe('Oslo, Norway')
  await replace(host, 'italy')
  expect(options(host)).toHaveLength(1)
  await keys('{Escape}')
  expect(input(host).value).toBe('Oslo, Norway')
})

test('controlled query/open refusals preserve their owners; cancellable input handlers run first', async () => {
  const query = vi.fn()
  const expansion = vi.fn()
  const { host } = await mount(
    <Field label="City">
      <Combobox
        items={items}
        query="os"
        onQueryChange={query}
        open
        onOpenChange={expansion}
      >
        <ComboboxInput
          onKeyDown={event => {
            if (event.key === 'ArrowDown' || event.key === 'Escape') event.preventDefault()
          }}
          onClick={event => event.preventDefault()}
        />
        <ComboboxPortal>
          <ComboboxContent />
        </ComboboxPortal>
      </Combobox>
    </Field>
  )
  await click(input(host))
  await keys('x{ArrowDown}{Escape}')
  expect(query).toHaveBeenCalledWith('osx')
  expect(input(host).value).toBe('os')
  expect(active(host)).toBeNull()
  expect(expansion).not.toHaveBeenCalled()
})

test('disabled Field and native fieldset block edits, requests and form entries', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <form onSubmit={event => event.preventDefault()}>
      <fieldset disabled>
        <Field label="City">
          <Combobox
            items={items}
            name="city"
            defaultValue="oslo"
            onValueChange={change}
          />
        </Field>
      </fieldset>
      <Field
        label="Other"
        disabled
      >
        <Combobox items={items} />
      </Field>
    </form>
  )
  expect(input(host).matches(':disabled')).toBe(true)
  expect(new FormData(host.querySelector('form')!).has('city')).toBe(false)
  expect(host.querySelectorAll('[data-slot="combobox-input"]')[1].matches(':disabled')).toBe(true)
  expect(change).not.toHaveBeenCalled()
})

test('popup has anchor width from first visible frame and remains inside viewport on resize', async () => {
  const { host } = await mount(
    <div style={{ width: 280 }}>
      <Field label="City">
        <Combobox items={items} />
      </Field>
    </div>
  )
  const frames: number[] = []
  let frame = 0
  const sample = () => {
    if (popup(host)?.matches(':popover-open'))
      frames.push(popup(host).getBoundingClientRect().width)
    frame = requestAnimationFrame(sample)
  }
  frame = requestAnimationFrame(sample)
  try {
    await click(input(host))
    await expect.poll(() => frames.length).toBeGreaterThanOrEqual(5)
    expect(frames.every(width => Math.abs(width - 280) <= 1)).toBe(true)
    await act(async () => {
      ;(host.firstElementChild as HTMLElement).style.width = '220px'
    })
    await expect.poll(() => Math.round(popup(host).getBoundingClientRect().width)).toBe(220)
    const rect = popup(host).getBoundingClientRect()
    expect(rect.left).toBeGreaterThanOrEqual(0)
    expect(rect.right).toBeLessThanOrEqual(innerWidth)
  } finally {
    cancelAnimationFrame(frame)
  }
})

test('local portal preserves theme and modal ancestry, dismisses before Dialog Escape', async () => {
  const { host } = await mount(
    <Dialog defaultOpen>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Trip</DialogTitle>
        <ThemeScope
          theme={defineTheme({
            id: 'city',
            name: 'City',
            components: { combobox: { contentBackground: 'rgb(1, 2, 3)' } }
          })}
        >
          <Field label="City">
            <Combobox items={items} />
          </Field>
        </ThemeScope>
      </DialogContent>
    </Dialog>
  )
  await click(input(host))
  expect(popup(host).closest('dialog')).not.toBeNull()
  expect(getComputedStyle(popup(host)).backgroundColor).toBe('rgb(1, 2, 3)')
  await keys('{ArrowDown}{Escape}')
  expect(host.querySelector('dialog')?.open).toBe(true)
  expect(document.activeElement).toBe(input(host))
  expect(popup(host).matches(':popover-open')).toBe(false)
})

test('caller styles, native refs and independent themes preserve selected and forced-color cues', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
  const ref = createRef<HTMLInputElement>()
  const popupRef = createRef<HTMLDivElement>()
  const { host } = await mount(
    <MotionProvider>
      <ThemeScope
        theme={defineTheme({
          id: 'independent',
          name: 'Independent',
          components: {
            input: { fontSize: '50px' },
            select: { fontSize: '60px' },
            combobox: { fontSize: '17px' }
          }
        })}
      >
        <Field label="City">
          <Combobox
            items={items}
            defaultValue="oslo"
          >
            <ComboboxInput
              ref={ref}
              className="rounded-none"
              style={{ letterSpacing: '1px' }}
            />
            <ComboboxPortal>
              <ComboboxContent
                ref={popupRef}
                className="border-2"
              />
            </ComboboxPortal>
          </Combobox>
        </Field>
      </ThemeScope>
    </MotionProvider>
  )
  expect(ref.current).toBe(input(host))
  expect(popupRef.current).toBe(popup(host))
  expect(getComputedStyle(input(host)).fontSize).toBe('17px')
  expect(getComputedStyle(input(host)).borderRadius).toBe('0px')
  await click(input(host))
  await keys('{ArrowDown}')
  expect(active(host)?.hasAttribute('data-highlighted')).toBe(true)
  expect(getComputedStyle(popup(host)).opacity).toBe('1')
})

test('hook is null outside owner and requests retain the same state/form contract', async () => {
  function Outside() {
    expect(useCombobox()).toBeNull()
    return null
  }
  function Clear() {
    const box = useCombobox()!
    return <button onClick={() => box.setValue(null)}>Clear from owner</button>
  }
  const { host } = await mount(
    <>
      <Outside />
      <Field label="City">
        <Combobox
          items={items}
          defaultValue="oslo"
        >
          <ComboboxInput />
          <Clear />
          <ComboboxPortal>
            <ComboboxContent />
          </ComboboxPortal>
        </Combobox>
      </Field>
    </>
  )
  await click(host.querySelector('button')!)
  expect(input(host).value).toBe('')
  expect(native(host).value).toBe('')
})

test('default control has one integrated Select chevron, independent of Button styling', async () => {
  const { host } = await mount(
    <ThemeScope
      theme={defineTheme({
        id: 'adornment',
        name: 'Adornment',
        components: {
          button: {
            height: '80px',
            borderWidth: '8px',
            ghostShadow: '0 0 12px red',
            fontSize: '40px'
          }
        }
      })}
    >
      <Field label="City">
        <Combobox
          items={items}
          defaultValue="oslo"
        />
      </Field>
    </ThemeScope>
  )
  const trigger = host.querySelector<HTMLButtonElement>('[data-slot~="combobox-trigger"]')!
  expect(host.querySelectorAll('button')).toHaveLength(1)
  expect(host.querySelector('[data-slot~="combobox-clear"]')).toBeNull()
  const css = getComputedStyle(trigger)
  expect(css.borderWidth).toBe('0px')
  expect(css.boxShadow).not.toContain('255, 0, 0')
  expect(css.backgroundColor).toBe('rgba(0, 0, 0, 0)')
  expect(trigger.querySelector('path')?.getAttribute('d')).toBe('m4 6 4 4 4-4')
  expect(trigger.getBoundingClientRect().height).toBe(input(host).getBoundingClientRect().height)
  expect(trigger.getBoundingClientRect().right).toBe(input(host).getBoundingClientRect().right)
  await click(trigger)
  expect(document.activeElement).toBe(input(host))
  expect(input(host).getAttribute('aria-expanded')).toBe('true')
  await click(trigger)
  expect(input(host).getAttribute('aria-expanded')).toBe('false')
})

test('opt-in clear action forwards its native ref/render and clears without stealing input focus', async () => {
  const ref = createRef<HTMLButtonElement>()
  const change = vi.fn()
  const { host } = await mount(
    <Field label="City">
      <Combobox
        items={items}
        defaultValue="oslo"
        onValueChange={change}
      >
        <div className="relative">
          <ComboboxInput />
          <ComboboxClear
            ref={ref}
            render={props => <button {...props} />}
          />
          <ComboboxTrigger />
        </div>
        <ComboboxPortal>
          <ComboboxContent />
        </ComboboxPortal>
      </Combobox>
    </Field>
  )
  const clear = ref.current!
  expect(clear.dataset.slot).toContain('combobox-clear')
  await click(clear)
  expect(change).toHaveBeenCalledExactlyOnceWith(null)
  expect(input(host).value).toBe('')
  expect(document.activeElement).toBe(input(host))
  expect(host.querySelector('[data-slot~="combobox-clear"]')).toBeNull()
})
