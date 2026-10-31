/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Verify caller-supplied semantics on PopoverContent's native div host. */
import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverPortal,
  usePopover,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  ThemeScope,
  defineTheme,
  type PopoverProps,
  type PopoverContentProps,
  type PopoverTriggerProps,
  type PopoverCloseProps
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { DeliveryTimePopover } from '../../.storybook/examples/PopoverExamples.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: { host: HTMLDivElement; root: Root }[] = []
async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  if (hydrate) host.innerHTML = renderToString(tree)
  const errors: unknown[] = []
  let root!: Root
  await act(async () => {
    root = hydrate
      ? hydrateRoot(host, tree, { onRecoverableError: e => errors.push(e) })
      : createRoot(host)
    if (!hydrate) root.render(tree)
  })
  mounted.push({ host, root })
  expect(errors).toEqual([])
  return { host, render: (next: ReactNode) => act(async () => root.render(next)) }
}
afterEach(async () => {
  for (const { host, root } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await commands.emulatePreferences({ reducedMotion: 'no-preference', forcedColors: 'none' })
})

test('native pointer dismissal includes empty page space and controlled owners receive one request per pointer gesture', async () => {
  const changes = vi.fn()
  const { host, render } = await mount(
    <>
      <Fixture defaultOpen />
      <input aria-label="Outside" />
    </>
  )
  const p = parts(host)
  await act(async () =>
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  )
  expect(shown(p.panel)).toBe(false)
  await render(
    <>
      <Fixture
        key="controlled"
        open
        onOpenChange={changes}
      />
      <input aria-label="Outside" />
    </>
  )
  await click(host.querySelector('input')!)
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
  expect(shown(parts(host).panel)).toBe(true)
})

test('closing an ancestor Popover or Dialog hides descendants even when their owner refuses close', async () => {
  const changes = vi.fn()
  const tree = (open: boolean) => (
    <Popover open={open}>
      <PopoverTrigger>Outer</PopoverTrigger>
      <PopoverContent>
        <Fixture
          open
          onOpenChange={changes}
        />
      </PopoverContent>
    </Popover>
  )
  const { host, render } = await mount(tree(true))
  const outer = parts(host)
  const inner = parts(outer.panel)
  expect(shown(inner.panel)).toBe(true)
  await render(tree(false))
  await expect.poll(() => shown(inner.panel)).toBe(false)
  expect(shown(outer.panel)).toBe(false)
  await render(
    <Dialog defaultOpen>
      <DialogContent>
        <DialogTitle>Task</DialogTitle>
        <Fixture defaultOpen />
      </DialogContent>
    </Dialog>
  )
  const child = parts(host)
  expect(shown(child.panel)).toBe(true)
  await act(async () => {
    const dialog = host.querySelector('dialog')!
    const closed = new Promise<void>(resolve =>
      dialog.addEventListener('close', () => resolve(), { once: true })
    )
    dialog.close()
    await closed
  })
  await expect.poll(() => shown(child.panel)).toBe(false)
})

test('an inner modal receives Escape before its containing popover', async () => {
  const { host } = await mount(
    <Popover defaultOpen>
      <PopoverTrigger>Outer</PopoverTrigger>
      <PopoverContent>
        <Dialog>
          <DialogTrigger>Open modal</DialogTrigger>
          <DialogContent>
            <DialogTitle>Inner task</DialogTitle>
            <DialogClose>Close modal</DialogClose>
          </DialogContent>
        </Dialog>
        <PopoverClose>Done</PopoverClose>
      </PopoverContent>
    </Popover>
  )
  const p = parts(host)
  await click(p.panel.querySelector<HTMLButtonElement>('[data-slot~=dialog-trigger]')!)
  const modal = host.querySelector('dialog')!
  expect(modal.matches(':modal')).toBe(true)
  await key('{Escape}')
  await expect.poll(() => modal.open).toBe(false)
  expect(shown(p.panel)).toBe(true)
})

test('independent controlled surfaces can coexist without native auto-stack dismissal loops', async () => {
  const changes = vi.fn()
  const { host } = await mount(
    <>
      <Fixture
        open
        onOpenChange={changes}
      />
      <Fixture
        open
        onOpenChange={changes}
      />
    </>,
    true
  )
  expect(
    Array.from(host.querySelectorAll('[popover]'), node => shown(node as HTMLElement))
  ).toEqual([true, true])
  expect(changes).not.toHaveBeenCalled()
})

test('unmounting a focused nested tree restores focus without emitting close requests or leaving listeners', async () => {
  const changes = vi.fn()
  const closeRef = createRef<HTMLButtonElement>()
  const { render } = await mount(
    <Popover defaultOpen>
      <PopoverTrigger>Outer</PopoverTrigger>
      <PopoverContent>
        <Fixture
          defaultOpen
          onOpenChange={changes}
          close={{ ref: closeRef }}
          content={{ initialFocusRef: closeRef }}
        />
      </PopoverContent>
    </Popover>
  )
  expect(document.activeElement).toBe(closeRef.current)
  await render(null)
  await act(async () => {
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    window.dispatchEvent(new Event('resize'))
  })
  expect(changes).not.toHaveBeenCalled()
})

test('a local portal hydrates closed markup then opens against its actual anchor', async () => {
  const { host } = await mount(
    <StrictMode>
      <Fixture
        portal
        defaultOpen
      />
    </StrictMode>,
    true
  )
  const p = parts(host)
  expect(shown(p.panel)).toBe(true)
  expect(
    Math.abs(p.panel.getBoundingClientRect().top - p.trigger.getBoundingClientRect().bottom - 8)
  ).toBeLessThan(1)
})

test('collision flips, content mutations and scrolling update placement without moving focus', async () => {
  const { host } = await mount(
    <div style={{ height: 200, overflow: 'auto' }}>
      <div style={{ height: 1200, paddingTop: 80 }}>
        <Fixture trigger={{ style: { position: 'fixed', bottom: 12, right: 12 } }} />
      </div>
    </div>
  )
  const p = parts(host)
  await click(p.trigger)
  expect(p.panel.dataset.side).toBe('top')
  expect(p.panel.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth - 7)
  expect(
    Math.abs(p.panel.getBoundingClientRect().bottom + 8 - p.trigger.getBoundingClientRect().top)
  ).toBeLessThan(1)
  await act(async () => {
    p.panel.querySelector('p')!.textContent = 'Long description. '.repeat(500)
  })
  await expect.poll(() => p.panel.scrollHeight > p.panel.clientHeight).toBe(true)
  await expect.poll(() => p.panel.getBoundingClientRect().top >= 7).toBe(true)
  expect(document.activeElement).toBe(p.trigger)
})

test('motion entry, live reduced/off preferences, caller styles and ref cleanup retain their owners', async () => {
  const cleaned = vi.fn()
  const ref = () => cleaned
  const tree = (motion: 'inherit' | 'off' = 'inherit') => (
    <MotionProvider>
      <Fixture
        defaultOpen
        content={{
          ref,
          motion,
          className: 'p-0',
          style: { transform: 'rotate(0deg)', '--rad-popover-padding': '1rem' }
        }}
      />
    </MotionProvider>
  )
  const { host, render } = await mount(tree())
  const p = parts(host)
  await expect.poll(() => Number(p.panel.style.getPropertyValue('--_rad-popup-enter'))).toBe(1)
  expect(p.panel.style.transform).toBe('rotate(0deg)')
  expect(getComputedStyle(p.panel).padding).toBe('0px')
  await act(async () =>
    commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
  )
  await expect.poll(() => getComputedStyle(p.panel).transitionProperty).toBe('none')
  expect(getComputedStyle(p.panel).forcedColorAdjust).toBe('auto')
  await render(tree('off'))
  expect(p.panel.style.getPropertyValue('--_rad-popup-enter')).toBe('')
  const before = cleaned.mock.calls.length
  await render(null)
  expect(cleaned).toHaveBeenCalledTimes(before + 1)
  expect(p.panel.style.transform).toBe('rotate(0deg)')
  expect(document.querySelector('[data-rad-motion-exit]')).toBeNull()
})

test('the delivery-time example hydrates, saves local form data and restores its opener', async () => {
  const { host } = await mount(<DeliveryTimePopover />, true)
  const p = parts(host)
  await click(p.trigger)
  const input = p.panel.querySelector('input')!
  expect(document.activeElement).toBe(input)
  await act(async () => {
    input.value = '14:30'
    p.panel.querySelector('form')!.requestSubmit()
  })
  expect(host.querySelector('output')!.textContent).toContain('14:30')
  expect(shown(p.panel)).toBe(false)
  expect(document.activeElement).toBe(p.trigger)
})

test('PopoverTrigger ignores toggle props and stays a disclosure', async () => {
  const onPressedChange = vi.fn()
  const { host } = await mount(
    <Fixture
      trigger={
        {
          defaultPressed: true,
          'aria-pressed': 'true',
          onPressedChange
        } as unknown as PopoverTriggerProps
      }
    />
  )
  const p = parts(host)
  expect(p.trigger.hasAttribute('aria-pressed')).toBe(false)
  await click(p.trigger)
  expect(p.trigger.getAttribute('aria-expanded')).toBe('true')
  expect(p.trigger.hasAttribute('aria-pressed')).toBe(false)
  expect(shown(p.panel)).toBe(true)
  expect(onPressedChange).not.toHaveBeenCalled()
})
const click = (node: HTMLElement) => act(async () => userEvent.click(node))
const key = (keys: string) => act(async () => userEvent.keyboard(keys))
const shown = (node: HTMLElement) => node.matches(':popover-open')
function Fixture({
  content,
  trigger,
  close,
  portal = false,
  ...props
}: PopoverProps & {
  content?: PopoverContentProps
  trigger?: PopoverTriggerProps
  close?: PopoverCloseProps
  portal?: boolean
}) {
  const panel = (
    <PopoverContent {...content}>
      <p>Useful details</p>
      <PopoverClose {...close}>Done</PopoverClose>
    </PopoverContent>
  )
  return (
    <Popover {...props}>
      <PopoverTrigger {...trigger}>Details</PopoverTrigger>
      {portal ? <PopoverPortal>{panel}</PopoverPortal> : panel}
    </Popover>
  )
}
function parts(host: HTMLElement) {
  return {
    trigger: host.querySelector<HTMLButtonElement>('[data-slot~=popover-trigger]')!,
    panel: host.querySelector<HTMLDivElement>('[data-slot~=popover-content]')!,
    close: host.querySelector<HTMLButtonElement>('[data-slot~=popover-close]')!
  }
}

test('SSR and StrictMode hydration preserve relationships, native hosts, caller semantics and initial focus', async () => {
  const ref = createRef<HTMLDivElement>()
  const triggerRef = createRef<HTMLButtonElement>()
  const tree = (
    <StrictMode>
      <Fixture
        content={{ ref }}
        trigger={{ ref: triggerRef, render: props => <button {...props} /> }}
      />
      <Button>After</Button>
    </StrictMode>
  )
  const html = renderToString(tree)
  expect(html).toContain('popover="manual"')
  expect(html).not.toMatch(/role="(?:menu|listbox|dialog)"|aria-haspopup|aria-modal/)
  const { host } = await mount(tree, true)
  const p = parts(host)
  expect(ref.current).toBe(p.panel)
  expect(triggerRef.current).toBe(p.trigger)
  expect(shown(p.panel)).toBe(false)
  expect(p.trigger.getAttribute('aria-controls')).toBe(p.panel.id)
  await click(p.trigger)
  expect(shown(p.panel)).toBe(true)
  expect(document.activeElement).toBe(p.trigger)
  expect(p.trigger.getAttribute('aria-expanded')).toBe('true')
  await key('{Tab}')
  expect(document.activeElement).toBe(p.close)
  await key('{Tab}')
  expect(document.activeElement?.textContent).toBe('After')
  expect(shown(p.panel)).toBe(false)
})

test('Escape and explicit close restore trigger focus; outside interaction keeps its own focus', async () => {
  const changes = vi.fn()
  const { host } = await mount(
    <>
      <Fixture onOpenChange={changes} />
      <input aria-label="Outside" />
    </>
  )
  const p = parts(host)
  await click(p.trigger)
  await click(p.close)
  expect(document.activeElement).toBe(p.trigger)
  await click(p.trigger)
  await key('{Escape}')
  expect(shown(p.panel)).toBe(false)
  expect(document.activeElement).toBe(p.trigger)
  await click(p.trigger)
  await click(host.querySelector('input')!)
  expect(shown(p.panel)).toBe(false)
  expect(document.activeElement).toBe(host.querySelector('input'))
  expect(changes.mock.calls).toEqual([[true], [false], [true], [false], [true], [false]])
})

test('controlled owners can refuse dismissal and native hide without reopening unrelated layers repeatedly', async () => {
  const changes = vi.fn()
  const { host, render } = await mount(
    <Fixture
      open
      onOpenChange={changes}
    />
  )
  const p = parts(host)
  await key('{Escape}')
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
  expect(shown(p.panel)).toBe(true)
  changes.mockClear()
  await act(async () => {
    const toggled = new Promise<void>(resolve =>
      p.panel.addEventListener('toggle', () => resolve(), { once: true })
    )
    p.panel.hidePopover()
    await toggled
  })
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
  expect(shown(p.panel)).toBe(true)
  changes.mockClear()
  await render(
    <Fixture
      open={false}
      onOpenChange={changes}
    />
  )
  expect(shown(p.panel)).toBe(false)
  expect(changes).not.toHaveBeenCalled()
})

test('Button guards, caller veto, render adapters and native form ownership are preserved', async () => {
  const submitted = vi.fn()
  const action = vi.fn((e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault())
  const { host, render } = await mount(<Fixture trigger={{ onClick: action }} />)
  const p = parts(host)
  await click(p.trigger)
  expect(action).toHaveBeenCalledOnce()
  expect(shown(p.panel)).toBe(false)
  for (const guard of [{ disabled: true }, { pending: true }]) {
    action.mockClear()
    await render(<Fixture trigger={{ ...guard, onClick: action }} />)
    await act(async () => p.trigger.click())
    expect(action).not.toHaveBeenCalled()
  }
  await render(
    <form
      onSubmit={e => {
        e.preventDefault()
        submitted()
      }}
    >
      <Fixture
        portal
        close={{ type: 'submit', onClick: action, render: props => <button {...props} /> }}
      />
    </form>
  )
  const n = parts(host)
  await click(n.trigger)
  await click(n.close)
  expect(shown(n.panel)).toBe(true)
  expect(submitted).not.toHaveBeenCalled()
  await render(
    <form
      onSubmit={e => {
        e.preventDefault()
        submitted()
      }}
    >
      <Fixture
        portal
        close={{ type: 'submit' }}
      />
    </form>
  )
  await click(parts(host).close)
  expect(submitted).toHaveBeenCalledOnce()
  expect(shown(parts(host).panel)).toBe(false)
})

test('an explicit initial target is focused on reopen and positioning updates preserve current focus', async () => {
  const input = createRef<HTMLInputElement>()
  function Example({ side = 'bottom' }: { side?: 'top' | 'bottom' }) {
    return (
      <Popover>
        <PopoverTrigger>Details</PopoverTrigger>
        <PopoverContent
          side={side}
          initialFocusRef={input}
          role="dialog"
          aria-label="Preferences"
        >
          <input
            ref={input}
            aria-label="Name"
          />
          <PopoverClose>Done</PopoverClose>
        </PopoverContent>
      </Popover>
    )
  }
  const { host, render } = await mount(<Example />)
  const p = parts(host)
  await click(p.trigger)
  expect(document.activeElement).toBe(input.current)
  await click(p.close)
  await click(p.trigger)
  expect(document.activeElement).toBe(input.current)
  await act(async () => p.close.focus())
  await render(<Example side="top" />)
  expect(document.activeElement).toBe(p.close)
  expect(p.panel.getAttribute('role')).toBe('dialog')
})

test('nested popovers dismiss only the top Escape layer and clean up on unmount', async () => {
  const clean = vi.fn()
  const { host, render } = await mount(
    <StrictMode>
      <Popover>
        <PopoverTrigger>Outer</PopoverTrigger>
        <PopoverContent>
          <Fixture
            portal
            content={{ ref: () => clean }}
          />
          <PopoverClose>Close outer</PopoverClose>
        </PopoverContent>
      </Popover>
    </StrictMode>
  )
  const outer = parts(host)
  await click(outer.trigger)
  const inner = parts(outer.panel)
  await click(inner.trigger)
  expect(shown(outer.panel) && shown(inner.panel)).toBe(true)
  await key('{Escape}')
  expect(shown(inner.panel)).toBe(false)
  expect(shown(outer.panel)).toBe(true)
  expect(document.activeElement).toBe(inner.trigger)
  await key('{Escape}')
  expect(shown(outer.panel)).toBe(false)
  await click(outer.trigger)
  await click(inner.trigger)
  const before = clean.mock.calls.length
  await render(null)
  expect(shown(outer.panel)).toBe(false)
  expect(shown(inner.panel)).toBe(false)
  expect(clean).toHaveBeenCalledTimes(before + 1)
})

test('Select inside a popover and Popover inside a modal retain their nearest Escape layer', async () => {
  const { host } = await mount(
    <Dialog>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogTitle>Task</DialogTitle>
        <Popover>
          <PopoverTrigger>Options</PopoverTrigger>
          <PopoverPortal>
            <PopoverContent>
              <Select items={[{ value: 'a', label: 'Alpha' }]}>
                <SelectTrigger aria-label="Choice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent />
              </Select>
              <PopoverClose>Done</PopoverClose>
            </PopoverContent>
          </PopoverPortal>
        </Popover>
        <DialogClose>Close dialog</DialogClose>
      </DialogContent>
    </Dialog>
  )
  await click(host.querySelector('button')!)
  const p = parts(host)
  await click(p.trigger)
  await click(p.panel.querySelector<HTMLButtonElement>('[data-slot~=select-trigger]')!)
  await key('{Escape}')
  expect(shown(p.panel)).toBe(true)
  expect(host.querySelector('dialog')!.matches(':modal')).toBe(true)
  await key('{Escape}')
  expect(shown(p.panel)).toBe(false)
  expect(host.querySelector('dialog')!.matches(':modal')).toBe(true)
  await key('{Escape}')
  await expect.poll(() => host.querySelector('dialog')!.open).toBe(false)
})

test('default-open nesting orders descendants above ancestors and hook state is null outside the owner', async () => {
  function Probe() {
    return <span data-owner={String(usePopover()?.open ?? null)} />
  }
  const { host } = await mount(
    <>
      <Probe />
      <Popover defaultOpen>
        <PopoverTrigger>Outer</PopoverTrigger>
        <PopoverContent>
          <Fixture defaultOpen />
          <Probe />
        </PopoverContent>
      </Popover>
    </>,
    true
  )
  const outer = parts(host)
  const inner = parts(outer.panel)
  expect(
    Array.from(host.querySelectorAll('[data-owner]'), n => n.getAttribute('data-owner'))
  ).toEqual(['null', 'true'])
  await key('{Escape}')
  expect(shown(inner.panel)).toBe(false)
  expect(shown(outer.panel)).toBe(true)
})

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: surfaces inherit themes through the local portal, reposition and stay bounded`, async () => {
    const theme = defineTheme({
      id: 'popover-proof',
      name: 'Popover proof',
      components: { popover: { width: '18rem', padding: '1rem', radius: '1rem' } }
    })
    const { host } = await mount(
      <ThemeScope
        theme={theme}
        mode={mode}
      >
        <div style={{ overflow: 'hidden', height: 32 }}>
          <Fixture portal />
        </div>
      </ThemeScope>
    )
    const p = parts(host)
    await click(p.trigger)
    const css = getComputedStyle(p.panel)
    expect(css.width).toBe('288px')
    expect(css.padding).toBe('16px')
    expect(css.borderRadius).toBe('16px')
    expect(p.panel.parentElement).toBe(p.trigger.parentElement)
    const before = p.panel.getBoundingClientRect().top
    await act(async () => {
      p.trigger.style.marginTop = '120px'
    })
    await act(async () => window.dispatchEvent(new Event('resize')))
    await expect.poll(() => p.panel.getBoundingClientRect().top > before + 100).toBe(true)
    await act(async () => {
      p.panel.style.setProperty('--rad-popover-width', '2000px')
      p.panel.style.height = '2000px'
    })
    await expect
      .poll(() => p.panel.getBoundingClientRect().right <= window.innerWidth - 7)
      .toBe(true)
    expect(p.panel.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight - 7)
  })
}
