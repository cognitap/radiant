import { act, createRef, StrictMode, useState, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent, commands } from 'vitest/browser'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  Field,
  ThemeScope,
  defineTheme,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const click = async (target: Element) =>
  act(async () => {
    await userEvent.click(target)
  })
const keys = async (text: string) =>
  act(async () => {
    await userEvent.keyboard(text)
  })
const items = [
  { value: 'oslo', label: 'Oslo' },
  { value: 'paris', label: 'Paris', disabled: true },
  { value: 'rome', label: 'Rome' },
  { value: 'tokyo', label: 'Tokyo' }
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
  return { host, root, render: (tree: ReactNode) => act(async () => root.render(tree)) }
}
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await commands.emulatePreferences({ reducedMotion: 'no-preference', forcedColors: 'none' })
})
const trigger = (host: HTMLElement) =>
  host.querySelector<HTMLButtonElement>('[data-slot~="select-trigger"]')!
const native = (host: HTMLElement) => host.querySelector<HTMLSelectElement>('select')!
const popup = (host: HTMLElement) =>
  host.querySelector<HTMLElement>('[data-slot="select-content"]')!

test('picker has trigger width on its first visible frame and remains stable across reopening and resize', async () => {
  const { host } = await mount(
    <div style={{ width: 280 }}>
      <Field label="City">
        <Select
          items={items}
          defaultValue="rome"
        />
      </Field>
    </div>
  )
  for (const width of [280, 360, 220]) {
    await act(async () => {
      ;(host.firstElementChild as HTMLElement).style.width = `${width}px`
    })
    for (let opening = 0; opening < 2; opening++) {
      const frames: number[] = []
      let frame = 0
      const sample = () => {
        if (popup(host).matches(':popover-open'))
          frames.push(popup(host).getBoundingClientRect().width)
        frame = requestAnimationFrame(sample)
      }
      frame = requestAnimationFrame(sample)
      try {
        await click(trigger(host))
        await expect.poll(() => frames.length).toBeGreaterThanOrEqual(5)
        const expected = trigger(host).getBoundingClientRect().width
        expect(
          frames.every(measured => Math.abs(measured - expected) <= 1),
          JSON.stringify({ expected, frames })
        ).toBe(true)
      } finally {
        cancelAnimationFrame(frame)
      }
      await keys('{Escape}')
    }
  }
})

test('popup motion fades from its initial opacity without a visible flash or geometry animation', async () => {
  const theme = defineTheme({
    id: 'select-opening',
    name: 'Opening',
    motion: { spring: { stiffness: 100, damping: 30, mass: 1 } }
  })
  const { host } = await mount(
    <ThemeScope theme={theme}>
      <MotionProvider>
        <div style={{ width: 280 }}>
          <Field label="City">
            <Select
              items={items}
              defaultValue="rome"
            />
          </Field>
        </div>
      </MotionProvider>
    </ThemeScope>
  )
  const frames: { width: number; opacity: number }[] = []
  let frame = 0
  const sample = () => {
    if (popup(host).matches(':popover-open'))
      frames.push({
        width: popup(host).getBoundingClientRect().width,
        opacity: Number(getComputedStyle(popup(host)).opacity)
      })
    frame = requestAnimationFrame(sample)
  }
  frame = requestAnimationFrame(sample)
  try {
    await click(trigger(host))
    await expect.poll(() => frames.length).toBeGreaterThanOrEqual(8)
    expect(
      frames.every(value => Math.abs(value.width - 280) <= 1),
      JSON.stringify(frames)
    ).toBe(true)
    expect(frames[0].opacity).toBeLessThan(1)
    expect(
      frames.every(
        (value, index) => index === 0 || value.opacity >= frames[index - 1].opacity - 0.001
      ),
      JSON.stringify(frames)
    ).toBe(true)
  } finally {
    cancelAnimationFrame(frame)
  }
  await keys('{Escape}')
})

test('item focus, disabled skipping, typeahead, selection, Escape and form notifications', async () => {
  const requested = vi.fn()
  const changed = vi.fn()
  const { host } = await mount(
    <form onChange={changed}>
      <Field
        label="City"
        description="A destination"
        required
      >
        <Select
          items={items}
          name="city"
          defaultValue="oslo"
          onValueChange={requested}
        />
      </Field>
    </form>
  )
  expect(native(host).value).toBe('oslo')
  await click(trigger(host))
  expect(popup(host).matches(':popover-open')).toBe(true)
  expect(document.activeElement?.textContent).toContain('Oslo')
  await keys('{ArrowDown}')
  expect(document.activeElement?.textContent).toContain('Rome')
  await keys('{Tab}')
  expect(popup(host).matches(':popover-open')).toBe(true)
  expect(document.activeElement?.textContent).toContain('Rome')
  expect(native(host).value).toBe('oslo')
  await keys('{Enter}')
  expect(native(host).value).toBe('rome')
  expect(new FormData(host.querySelector('form')!).get('city')).toBe('rome')
  expect(requested).toHaveBeenCalledExactlyOnceWith('rome')
  expect(changed).toHaveBeenCalledTimes(1)
  expect(popup(host).matches(':popover-open')).toBe(false)
  expect(document.activeElement).toBe(trigger(host))
  await keys('t')
  expect(native(host).value).toBe('tokyo')
  await click(trigger(host))
  await keys('{Home}')
  expect(document.activeElement?.textContent).toContain('Oslo')
  await keys('{Escape}')
  expect(native(host).value).toBe('tokyo')
  expect(document.activeElement).toBe(trigger(host))
})

test('required native validation focuses the visible Field target; reset is silent and cancellation is honored', async () => {
  const requested = vi.fn()
  const submitted = vi.fn()
  const { host } = await mount(
    <form
      onSubmit={event => {
        event.preventDefault()
        submitted()
      }}
    >
      <Field
        label="City"
        required
      >
        <Select
          items={items}
          name="city"
          onValueChange={requested}
        />
      </Field>
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
    </form>
  )
  expect(native(host).willValidate).toBe(true)
  expect(native(host).checkValidity()).toBe(false)
  await click(host.querySelector('button[type=submit]')!)
  expect(submitted).not.toHaveBeenCalled()
  expect(document.activeElement).toBe(trigger(host))
  await click(trigger(host))
  await keys('{End}{Enter}')
  expect(native(host).value).toBe('tokyo')
  expect(native(host).checkValidity()).toBe(true)
  const cancel = (event: Event) => event.preventDefault()
  host.querySelector('form')!.addEventListener('reset', cancel)
  await click(host.querySelector('button[type=reset]')!)
  expect(native(host).value).toBe('tokyo')
  host.querySelector('form')!.removeEventListener('reset', cancel)
  await click(host.querySelector('button[type=reset]')!)
  expect(native(host).value).toBe('')
  expect(trigger(host).textContent).toContain('Select an option')
  expect(requested).toHaveBeenCalledTimes(1)
})

test('controlled owners may refuse value/open requests; prop syncs and reset do not notify', async () => {
  const valueChanges = vi.fn()
  const openChanges = vi.fn()
  const formChanges = vi.fn()
  const make = (value: string) => (
    <form onChange={formChanges}>
      <Field label="City">
        <Select
          items={items}
          value={value}
          onValueChange={valueChanges}
          onOpenChange={openChanges}
          name="city"
        />
      </Field>
      <button type="reset">Reset</button>
    </form>
  )
  const { host, render } = await mount(make('oslo'))
  await click(trigger(host))
  await keys('{End}{Enter}')
  expect(native(host).value).toBe('oslo')
  expect(valueChanges).toHaveBeenCalledExactlyOnceWith('tokyo')
  expect(formChanges).not.toHaveBeenCalled()
  await render(make('rome'))
  expect(native(host).value).toBe('rome')
  expect(formChanges).not.toHaveBeenCalled()
  await click(host.querySelector('button[type=reset]')!)
  expect(native(host).value).toBe('rome')
  expect(valueChanges).toHaveBeenCalledTimes(1)
  const refuse = vi.fn()
  await render(
    <Field label="City">
      <Select
        items={items}
        open={false}
        onOpenChange={refuse}
      />
    </Field>
  )
  await click(trigger(host))
  expect(refuse).toHaveBeenCalledExactlyOnceWith(true)
  expect(popup(host).matches(':popover-open')).toBe(false)
})

test('SSR/hydration retain real hosts, Field IDs, callback refs, external form ownership and autofill bridge', async () => {
  const clean = vi.fn()
  const ref = vi.fn(() => clean)
  const changes = vi.fn()
  function App() {
    const [value, setValue] = useState<string | null>('rome')
    return (
      <StrictMode>
        <form id="external" />
        <Field
          label="City"
          controlId="my-city"
          description="Choose a city"
        >
          <Select
            items={items}
            form="external"
            name="city"
            value={value}
            onValueChange={next => {
              changes(next)
              setValue(next)
            }}
          >
            <SelectTrigger ref={ref}>
              <SelectValue />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent />
            </SelectPortal>
          </Select>
        </Field>
      </StrictMode>
    )
  }
  const { host, root } = await mount(<App />, true)
  expect(trigger(host).id).toBe('my-city')
  expect(native(host).form?.id).toBe('external')
  expect(new FormData(host.querySelector('form')!).get('city')).toBe('rome')
  await act(async () => {
    native(host).value = 'tokyo'
    native(host).dispatchEvent(new Event('change', { bubbles: true }))
  })
  expect(trigger(host).textContent).toContain('Tokyo')
  expect(changes).toHaveBeenCalledExactlyOnceWith('tokyo')
  await act(async () => root.render(null))
  expect(clean).toHaveBeenCalled()
})

test('popup inherits local theme, fits narrow viewport and dismisses before its modal', async () => {
  const themed = defineTheme({
    id: 'select-local',
    name: 'Local',
    tokens: { color: { surface: '#102030', foreground: '#ffffff' } }
  })
  const { host } = await mount(
    <ThemeScope
      theme={themed}
      mode="dark"
    >
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Destination</DialogTitle>
          <Field label="City">
            <Select
              items={items}
              defaultValue="rome"
            />
          </Field>
          <DialogClose>Done</DialogClose>
        </DialogContent>
      </Dialog>
    </ThemeScope>
  )
  await click(host.querySelector('[data-slot~="dialog-trigger"]')!)
  await click(trigger(host))
  expect(popup(host).closest('dialog')?.open).toBe(true)
  expect(getComputedStyle(popup(host)).backgroundColor).toBe('rgb(16, 32, 48)')
  const rect = popup(host).getBoundingClientRect()
  expect(rect.left).toBeGreaterThanOrEqual(0)
  expect(rect.right).toBeLessThanOrEqual(innerWidth)
  await keys('{Escape}')
  expect(host.querySelector('dialog')!.open).toBe(true)
  expect(document.activeElement).toBe(trigger(host))
  await keys('{Escape}')
  expect(host.querySelector('dialog')!.open).toBe(false)
})

test('disabled Field and fieldset prevent activation, disabled items cannot commit, caller handlers can cancel', async () => {
  const ref = createRef<HTMLButtonElement>()
  const requested = vi.fn()
  const { host, render } = await mount(
    <Field
      label="City"
      disabled
    >
      <Select
        items={items}
        onValueChange={requested}
      >
        <SelectTrigger ref={ref} />
      </Select>
    </Field>
  )
  expect(ref.current).toBe(trigger(host))
  expect(trigger(host).disabled).toBe(true)
  expect(native(host).disabled).toBe(true)
  await render(
    <fieldset disabled>
      <Select
        items={items}
        name="city"
      />
    </fieldset>
  )
  expect(native(host).matches(':disabled')).toBe(true)
  await render(
    <Field label="City">
      <Select items={items}>
        <SelectTrigger onClick={event => event.preventDefault()} />
        <SelectContent />
      </Select>
    </Field>
  )
  await click(trigger(host))
  expect(popup(host).matches(':popover-open')).toBe(false)
  expect(requested).not.toHaveBeenCalled()
})

test('provider-free, spring, off and reduced motion keep the same immediate selection semantics', async () => {
  const { host, render } = await mount(
    <MotionProvider>
      <Field label="City">
        <Select items={items} />
      </Field>
    </MotionProvider>
  )
  await click(trigger(host))
  expect(popup(host).matches(':popover-open')).toBe(true)
  await keys('{End}{Enter}')
  expect(native(host).value).toBe('tokyo')
  expect(popup(host).matches(':popover-open')).toBe(false)
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  await click(trigger(host))
  expect(getComputedStyle(popup(host)).opacity).toBe('1')
  await keys('{Escape}')
  await render(
    <Field label="City">
      <Select items={items}>
        <SelectTrigger />
        <SelectContent motion="off" />
      </Select>
    </Field>
  )
  await click(trigger(host))
  expect(getComputedStyle(popup(host)).opacity).toBe('1')
})

test('dynamic item removal keeps keyboard focus usable; outside press and unmount release the popup', async () => {
  const content = (options: typeof items) => (
    <>
      <Field label="City">
        <Select
          items={options}
          defaultValue="rome"
        />
      </Field>
      <button
        type="button"
        style={{ position: 'fixed', right: 8, bottom: 8 }}
      >
        Outside
      </button>
    </>
  )
  const { host, render } = await mount(content(items))
  await click(trigger(host))
  expect(document.activeElement?.textContent).toContain('Rome')
  await render(content(items.filter(item => item.value !== 'rome')))
  expect(popup(host).matches(':popover-open')).toBe(true)
  expect((document.activeElement as HTMLElement)?.dataset.value).toBe('oslo')
  await keys('{End}{Enter}')
  expect(native(host).value).toBe('tokyo')
  await click(trigger(host))
  await click(host.querySelector('button:not([data-slot])')!)
  expect(popup(host).matches(':popover-open')).toBe(false)
  await click(trigger(host))
  const old = popup(host)
  await render(<p>Unmounted</p>)
  expect(old.isConnected).toBe(false)
  expect(document.querySelector('[data-slot="select-content"]')).toBe(null)
})
