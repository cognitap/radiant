import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Button,
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerHandle,
  useDrawer,
  type DrawerProps,
  type DrawerContentProps,
  type DrawerHandleProps
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import '../../.storybook/styles.css'
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const user = {
  click: (...args: Parameters<typeof userEvent.click>) =>
    act(async () => {
      await userEvent.click(...args)
    }),
  keyboard: (...args: Parameters<typeof userEvent.keyboard>) =>
    act(async () => {
      await userEvent.keyboard(...args)
    })
}
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
  return { host, render: (next: ReactNode) => act(async () => root.render(next)) }
}
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await commands.emulatePreferences({ reducedMotion: 'no-preference', forcedColors: 'none' })
})
function Fixture({
  content,
  handle,
  children,
  ...props
}: DrawerProps & { content?: DrawerContentProps; handle?: Partial<DrawerHandleProps> }) {
  return (
    <Drawer {...props}>
      <DrawerTrigger>Open settings</DrawerTrigger>
      <DrawerContent {...content}>
        <DrawerHandle
          aria-label="Resize settings"
          {...handle}
        />
        <DrawerTitle>Settings</DrawerTitle>
        <DrawerDescription>Project preferences</DrawerDescription>
        <input
          aria-label="Project name"
          defaultValue="Atlas"
        />
        <DrawerClose>Close settings</DrawerClose>
        {children}
      </DrawerContent>
    </Drawer>
  )
}
const parts = (host: HTMLElement) => ({
  dialog: host.querySelector('dialog')!,
  handle: host.querySelector<HTMLButtonElement>('[data-slot~="drawer-handle"]')!,
  trigger: host.querySelector<HTMLButtonElement>('[data-slot~="drawer-trigger"]')!,
  viewport: host.querySelector<HTMLElement>('[data-slot="drawer-viewport"]')!
})
test('nested Drawer viewports use only their own edge at a partial snap', async () => {
  for (const [parent, child] of [
    ['left', 'right'],
    ['top', 'bottom']
  ] as const) {
    const { host } = await mount(
      <Fixture
        defaultOpen
        content={{ side: parent, motion: 'off' }}
      >
        <Fixture
          defaultSnapPoint={0.5}
          content={{ side: child, motion: 'off' }}
        />
      </Fixture>
    )
    const nested = host.querySelectorAll<HTMLDialogElement>('dialog')[1]
    const trigger = host.querySelectorAll<HTMLButtonElement>('[data-slot~="drawer-trigger"]')[1]
    await user.click(trigger)
    const viewport = nested.querySelector<HTMLElement>('[data-slot="drawer-viewport"]')!
    const box = viewport.getBoundingClientRect()
    expect(box.right).toBeLessThanOrEqual(innerWidth + 2)
    expect(box.bottom).toBeLessThanOrEqual(innerHeight + 2)
    expect(box.left).toBeGreaterThanOrEqual(-2)
    expect(box.top).toBeGreaterThanOrEqual(-2)
    expect(child === 'right' ? box.width : box.height).toBeGreaterThan(100)
    await user.keyboard('{Escape}')
  }
})
async function settled(dialog: HTMLElement) {
  await act(async () => {
    await vi.waitFor(
      () => expect(parseFloat(dialog.style.getPropertyValue('--_rad-drawer-shift'))).toBe(0),
      { timeout: 4000 }
    )
  })
}
test('Drawer hydrates in StrictMode on its actual native dialog and restores focus without an exit delay', async () => {
  const ref = createRef<HTMLDialogElement>(),
    { host } = await mount(
      <StrictMode>
        <MotionProvider>
          <Fixture content={{ ref }} />
        </MotionProvider>
      </StrictMode>,
      true
    )
  const { dialog, trigger, handle } = parts(host)
  expect(ref.current).toBe(dialog)
  expect(dialog.open).toBe(false)
  await user.click(trigger)
  await settled(dialog)
  expect(dialog.matches(':modal')).toBe(true)
  expect(document.activeElement).toBe(handle)
  expect(dialog.getAttribute('data-slot')).toBe('dialog drawer')
  expect(handle.getAttribute('data-slot')).toContain('button')
  expect(dialog.getAttribute('aria-labelledby')).toBe(host.querySelector('h2')!.id)
  await user.keyboard('{Escape}')
  expect(dialog.open).toBe(false)
  expect(document.activeElement).toBe(trigger)
})
test('every physical edge and logical RTL edge has native keyboard snapping and dismissal', async () => {
  for (const [side, dir, physical, increase, decrease] of [
    ['top', 'ltr', 'top', 'ArrowDown', 'ArrowUp'],
    ['bottom', 'ltr', 'bottom', 'ArrowUp', 'ArrowDown'],
    ['left', 'ltr', 'left', 'ArrowRight', 'ArrowLeft'],
    ['right', 'ltr', 'right', 'ArrowLeft', 'ArrowRight'],
    ['start', 'rtl', 'right', 'ArrowLeft', 'ArrowRight'],
    ['end', 'rtl', 'left', 'ArrowRight', 'ArrowLeft']
  ] as const) {
    const { host } = await mount(
      <div dir={dir}>
        <Fixture
          defaultOpen
          defaultSnapPoint={0.5}
          content={{ side, motion: 'off' }}
        />
      </div>
    )
    const { dialog, handle } = parts(host)
    expect(dialog.getAttribute('data-physical-side')).toBe(physical)
    await user.click(handle)
    expect(host.textContent).toContain('100%')
    await user.keyboard('{Home}')
    expect(host.textContent).toContain('50%')
    await user.keyboard(`{${increase}}`)
    expect(host.textContent).toContain('100%')
    await user.keyboard(`{${decrease}}`)
    expect(host.textContent).toContain('50%')
    await user.keyboard('{End}')
    expect(host.textContent).toContain('100%')
    await user.keyboard('{Home}')
    await user.keyboard(`{${decrease}}`)
    expect(dialog.open).toBe(false)
  }
})
test('controlled owners may refuse pointer and keyboard size/close requests without false committed state', async () => {
  const size = vi.fn(),
    close = vi.fn(),
    { host } = await mount(
      <MotionProvider>
        <Fixture
          open
          snapPoint={1}
          onSnapPointChange={size}
          onOpenChange={close}
          content={{ side: 'right', motion: 'off' }}
        />
      </MotionProvider>
    )
  const { dialog, handle } = parts(host)
  await user.click(handle)
  expect(size).toHaveBeenLastCalledWith(0.5)
  expect(host.textContent).toContain('100%')
  handle.id = 'drawer-refusal'
  await act(async () => commands.dragHandle('#drawer-refusal', 350, false, false))
  expect(close).toHaveBeenLastCalledWith(false)
  expect(dialog.open).toBe(true)
  await settled(dialog)
  await user.keyboard('{Escape}')
  await vi.waitFor(() => expect(dialog.open).toBe(true))
  expect(close).toHaveBeenLastCalledWith(false)
})
test('real mouse and touch handles drag the content, snap, cancel and preserve scroll gestures away from the handle', async () => {
  const changes = vi.fn(),
    { host } = await mount(
      <MotionProvider>
        <Fixture
          defaultOpen
          onSnapPointChange={changes}
          content={{ side: 'right' }}
        />
      </MotionProvider>
    )
  const { dialog, handle } = parts(host)
  handle.id = 'drawer-pointer'
  await settled(dialog)
  await act(async () => commands.dragHandle('#drawer-pointer', 170, false, false, 0, 100))
  await act(async () => {
    await vi.waitFor(() => expect(host.textContent).toContain('50%'))
  })
  expect(changes).toHaveBeenLastCalledWith(0.5)
  await user.keyboard('{End}')
  await settled(dialog)
  const before = changes.mock.calls.length
  await act(async () => commands.dragHandle('#drawer-pointer', 120, true, true))
  await settled(dialog)
  expect(changes).toHaveBeenCalledTimes(before)
  await act(async () => commands.dragHandle('#drawer-pointer', 0, false, true, 90))
  await settled(dialog)
  expect(changes).toHaveBeenCalledTimes(before)
  await act(async () => commands.dragHandle('#drawer-pointer', 360, false, true))
  await vi.waitFor(() => expect(dialog.open).toBe(false))
})
test('bottom drag uses vertical geometry and partial snap keeps all content scrollable', async () => {
  const { host } = await mount(
    <Fixture
      defaultOpen
      defaultSnapPoint={0.5}
      content={{ side: 'bottom', style: { '--rad-drawer-size': '400px' } }}
    >
      <div style={{ height: 900 }}>Long settings</div>
      <Button>Last action</Button>
    </Fixture>
  )
  const { dialog, viewport, handle } = parts(host)
  handle.id = 'drawer-bottom'
  expect(viewport.clientHeight).toBeLessThan(205)
  expect(viewport.clientHeight).toBeGreaterThan(190)
  expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight)
  const box = viewport.getBoundingClientRect()
  expect(box.bottom).toBeLessThanOrEqual(window.innerHeight + 2)
  expect(box.top).toBeGreaterThan(0)
  await act(async () => {
    viewport.scrollTop = viewport.scrollHeight
  })
  expect(viewport.scrollTop).toBeGreaterThan(0)
  await act(async () => {
    viewport.scrollTop = 0
  })
  await act(async () => commands.dragHandle('#drawer-bottom', 0, false, false, 180))
  expect(dialog.open).toBe(false)
})
test('live direction and modal mode changes retain the native owner and geometry', async () => {
  const tree = (dir: 'ltr' | 'rtl', modal: boolean) => (
    <div dir={dir}>
      <Fixture
        defaultOpen
        modal={modal}
        content={{ side: 'start', motion: 'off' }}
      />
    </div>
  )
  const { host, render } = await mount(tree('ltr', true))
  const { dialog } = parts(host)
  expect(dialog.getAttribute('data-physical-side')).toBe('left')
  await render(tree('rtl', false))
  await act(async () => {
    await vi.waitFor(() => expect(dialog.getAttribute('data-physical-side')).toBe('right'))
  })
  expect(dialog.matches(':modal')).toBe(false)
  expect(dialog.open).toBe(true)
  expect(Math.abs(dialog.getBoundingClientRect().right - innerWidth)).toBeLessThan(2)
})
test('reduced motion and off profiles remove entry slide while direct manipulation remains functional', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
  const { host } = await mount(
    <MotionProvider>
      <Fixture
        defaultOpen
        content={{ side: 'bottom' }}
      />
    </MotionProvider>
  )
  const { dialog, handle } = parts(host)
  expect(parseFloat(dialog.style.getPropertyValue('--_rad-drawer-shift'))).toBe(0)
  handle.id = 'drawer-reduced'
  await act(async () => commands.dragHandle('#drawer-reduced', 0, false, true, 170))
  expect(host.textContent).toContain('50%')
  expect(dialog.open).toBe(true)
  expect(getComputedStyle(dialog).borderTopWidth).not.toBe('0px')
})
test('consumer cancellation, disabled and pending handles prevent all activation', async () => {
  let id = 0
  for (const handle of [
    { disabled: true },
    { pending: true },
    {
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault(),
      onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => event.preventDefault(),
      onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => event.preventDefault()
    }
  ]) {
    const change = vi.fn(),
      { host } = await mount(
        <Fixture
          defaultOpen
          onSnapPointChange={change}
          handle={handle}
        />
      )
    const part = parts(host)
    part.handle.id = `drawer-blocked-${id++}`
    if (!part.handle.disabled) {
      await user.click(part.handle)
      await user.keyboard('{Home}')
    }
    await act(async () => commands.dragHandle(`#${part.handle.id}`, 160, false, false))
    expect(change).not.toHaveBeenCalled()
    expect(host.textContent).toContain('100%')
  }
})
test('nested Dialog, native submit/reset and state hooks retain their independent contracts', async () => {
  const submit = vi.fn(),
    ref = createRef<HTMLDialogElement>()
  function State() {
    const state = useDrawer()
    return <Button onClick={() => state?.setSnapPoint(0.5)}>Half size</Button>
  }
  function NestedState() {
    expect(useDrawer()).toBe(null)
    return null
  }
  const { host } = await mount(
    <Fixture
      defaultOpen
      content={{ ref, parts: { viewport: { style: { padding: 12 }, className: 'custom' } } }}
    >
      <State />
      <form
        onSubmit={event => {
          event.preventDefault()
          submit(new FormData(event.currentTarget).get('name'))
        }}
      >
        <input
          name="name"
          defaultValue="Atlas"
          aria-label="Name"
        />
        <Button type="submit">Save project</Button>
        <Button type="reset">Reset project</Button>
      </form>
      <Dialog>
        <DialogTrigger>Nested dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Nested</DialogTitle>
          <NestedState />
          <DialogClose>Close nested</DialogClose>
        </DialogContent>
      </Dialog>
    </Fixture>
  )
  const { dialog, viewport } = parts(host)
  expect(ref.current).toBe(dialog)
  expect(viewport.style.padding).toBe('12px')
  await user.click(
    host.querySelector<HTMLButtonElement>(
      '[data-slot~="dialog-trigger"]:not([data-slot~="drawer-trigger"])'
    )!
  )
  const nested = host.querySelectorAll('dialog')[1]
  expect(nested.open).toBe(true)
  await user.keyboard('{Escape}')
  expect(nested.open).toBe(false)
  expect(dialog.open).toBe(true)
  await user.click(
    Array.from(host.querySelectorAll('button')).find(
      button => button.textContent === 'Save project'
    )!
  )
  expect(submit).toHaveBeenCalledWith('Atlas')
})
