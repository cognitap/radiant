import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  ThemeScope,
  defineTheme,
  useAlertDialog,
  type AlertDialogProps,
  type AlertDialogActionProps,
  type AlertDialogCancelProps,
  type AlertDialogContentProps
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { DeleteProjectExample } from '../../.storybook/examples/AlertDialogExamples.js'
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
      ? hydrateRoot(host, tree, { onRecoverableError: e => errors.push(e) })
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
  action,
  cancel,
  ...props
}: AlertDialogProps & {
  content?: AlertDialogContentProps
  action?: AlertDialogActionProps
  cancel?: AlertDialogCancelProps
}) {
  return (
    <AlertDialog {...props}>
      <AlertDialogTrigger>Review deletion</AlertDialogTrigger>
      <AlertDialogContent {...content}>
        <AlertDialogTitle>Delete project?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        <AlertDialogAction {...action}>Delete</AlertDialogAction>
        <AlertDialogCancel {...cancel}>Keep project</AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  )
}
function parts(host: HTMLElement) {
  return {
    panel: host.querySelector<HTMLDialogElement>('[data-slot~=alert-dialog]')!,
    trigger: host.querySelector<HTMLButtonElement>('[data-slot~=alert-dialog-trigger]')!,
    action: host.querySelector<HTMLButtonElement>('[data-slot~=alert-dialog-action]')!,
    cancel: host.querySelector<HTMLButtonElement>('[data-slot~=alert-dialog-cancel]')!
  }
}
const click = (node: HTMLElement) => act(async () => userEvent.click(node))
const key = (keys: string) => act(async () => userEvent.keyboard(keys))

test('StrictMode hydration preserves closed SSR, alert relationships, refs and safe focus on every open', async () => {
  const panelRef = createRef<HTMLDialogElement>()
  const cancelRef = createRef<HTMLButtonElement>()
  const tree = (
    <StrictMode>
      <Fixture
        content={{ ref: panelRef, 'aria-describedby': 'external external' }}
        cancel={{ ref: cancelRef, render: props => <button {...props} /> }}
      />
      <p id="external">External help</p>
    </StrictMode>
  )
  const html = renderToString(tree)
  expect(html.match(/<dialog\b[^>]*>/)?.[0]).not.toMatch(/\sopen(?:=|\s|>)/)
  const { host } = await mount(tree, true)
  const { panel, trigger, action, cancel } = parts(host)
  expect(panelRef.current).toBe(panel)
  expect(cancelRef.current).toBe(cancel)
  expect(panel.open).toBe(false)
  expect(panel.getAttribute('role')).toBe('alertdialog')
  expect(panel.getAttribute('aria-modal')).toBe('true')
  expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
  expect(trigger.getAttribute('aria-controls')).toBe(panel.id)
  expect(panel.getAttribute('aria-labelledby')).toBe(host.querySelector('h2')!.id)
  expect(panel.getAttribute('aria-describedby')!.split(' ')).toEqual([
    host.querySelector('[data-slot~=alert-dialog-description]')!.id,
    'external'
  ])
  for (let cycle = 0; cycle < 2; cycle++) {
    await click(trigger)
    expect(panel.matches(':modal')).toBe(true)
    expect(document.activeElement).toBe(cancel)
    await key('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(action)
    await key('{Tab}')
    expect(document.activeElement).toBe(cancel)
    await key('{Enter}')
    expect(panel.open).toBe(false)
    expect(document.activeElement).toBe(trigger)
  }
})

test('backdrop never dismisses; Escape cancels without activating the consequential action', async () => {
  const changes = vi.fn()
  const action = vi.fn()
  const { host } = await mount(
    <Fixture
      onOpenChange={changes}
      action={{ onClick: action }}
    />
  )
  const { panel, trigger } = parts(host)
  await click(trigger)
  await act(async () =>
    panel.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 0, clientY: 0 }))
  )
  expect(panel.open).toBe(true)
  expect(changes).toHaveBeenCalledExactlyOnceWith(true)
  await key('{Escape}')
  await expect.poll(() => panel.open).toBe(false)
  expect(changes.mock.calls).toEqual([[true], [false]])
  expect(action).not.toHaveBeenCalled()
  expect(document.activeElement).toBe(trigger)
})

test('explicit cancellation policy and consumer veto preserve open state', async () => {
  const onCancel = vi.fn()
  const { host, render } = await mount(
    <Fixture
      defaultOpen
      closeOnEscape={false}
      content={{ onCancel }}
    />
  )
  const { panel } = parts(host)
  await key('{Escape}')
  expect(onCancel).toHaveBeenCalledOnce()
  expect(panel.open).toBe(true)
  await render(
    <Fixture
      defaultOpen
      content={{ onCancel: e => e.preventDefault() }}
    />
  )
  await key('{Escape}')
  expect(panel.open).toBe(true)
  await render(<Fixture defaultOpen />)
  await key('{Escape}')
  await expect.poll(() => panel.open).toBe(false)
})

test('action/cancel handlers can veto close, and pending/disabled guard handlers before state requests', async () => {
  const action = vi.fn((event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault())
  const cancel = vi.fn((event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault())
  const changes = vi.fn()
  const { host, render } = await mount(
    <Fixture
      defaultOpen
      onOpenChange={changes}
      action={{ onClick: action }}
      cancel={{ onClick: cancel }}
    />
  )
  const p = parts(host)
  await click(p.action)
  await click(p.cancel)
  expect(action).toHaveBeenCalledOnce()
  expect(cancel).toHaveBeenCalledOnce()
  expect(p.panel.open).toBe(true)
  expect(changes).not.toHaveBeenCalled()
  for (const guard of [{ pending: true }, { disabled: true }]) {
    action.mockClear()
    cancel.mockClear()
    await render(
      <Fixture
        defaultOpen
        onOpenChange={changes}
        action={{ ...guard, onClick: action }}
        cancel={{ ...guard, onClick: cancel }}
      />
    )
    await act(async () => {
      p.action.click()
      p.cancel.click()
    })
    expect(action).not.toHaveBeenCalled()
    expect(cancel).not.toHaveBeenCalled()
    expect(changes).not.toHaveBeenCalled()
  }
  await render(
    <Fixture
      defaultOpen
      onOpenChange={changes}
      action={{ onClick: action }}
    />
  )
  await click(p.cancel)
  expect(p.panel.open).toBe(false)
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
})

test('a controlled owner can refuse actions and native close, then accept prop synchronization silently', async () => {
  const changes = vi.fn()
  const action = vi.fn()
  const { host, render } = await mount(
    <Fixture
      open
      onOpenChange={changes}
      action={{ onClick: action }}
    />
  )
  const { panel, action: button } = parts(host)
  await click(button)
  expect(action).toHaveBeenCalledOnce()
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
  expect(panel.matches(':modal')).toBe(true)
  changes.mockClear()
  await act(async () => {
    const closed = new Promise<void>(resolve =>
      panel.addEventListener('close', () => resolve(), { once: true })
    )
    panel.close()
    await closed
  })
  await expect.poll(() => changes.mock.calls.length === 1 && panel.matches(':modal')).toBe(true)
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
  changes.mockClear()
  await render(
    <Fixture
      open={false}
      onOpenChange={changes}
    />
  )
  expect(panel.open).toBe(false)
  expect(changes).not.toHaveBeenCalled()
})

test('native dialog forms close and ordinary actions do not submit an ancestor form', async () => {
  const submitted = vi.fn()
  const { host } = await mount(
    <>
      <form
        onSubmit={e => {
          e.preventDefault()
          submitted()
        }}
      >
        <Fixture />
      </form>
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogDescription>Choose one.</AlertDialogDescription>
          <form method="dialog">
            <AlertDialogAction type="submit">Confirm</AlertDialogAction>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
  const panels = host.querySelectorAll('dialog')
  await click(panels[1].querySelector('button')!)
  await expect.poll(() => panels[1].open).toBe(false)
  const p = parts(host)
  await click(p.trigger)
  await click(p.action)
  expect(submitted).not.toHaveBeenCalled()
  expect(p.panel.open).toBe(false)
})

test('nested Dialog and AlertDialog keep their owners, focus and cleanup isolated', async () => {
  const changes = vi.fn()
  const cleaned = vi.fn()
  const { host, render } = await mount(
    <StrictMode>
      <MotionProvider>
        <Dialog>
          <DialogTrigger>Outer</DialogTrigger>
          <DialogContent>
            <DialogTitle>Outer task</DialogTitle>
            <Fixture
              onOpenChange={changes}
              cancel={{ ref: () => cleaned }}
            />
            <DialogClose>Close outer</DialogClose>
          </DialogContent>
        </Dialog>
      </MotionProvider>
    </StrictMode>
  )
  const outer = host.querySelector('dialog')!
  await click(host.querySelector('button')!)
  const p = parts(host)
  await click(p.trigger)
  expect(p.panel.matches(':modal')).toBe(true)
  await key('{Escape}')
  await expect.poll(() => p.panel.open).toBe(false)
  expect(outer.matches(':modal')).toBe(true)
  expect(document.activeElement).toBe(p.trigger)
  await click(p.trigger)
  const before = changes.mock.calls.length
  const beforeCleanup = cleaned.mock.calls.length
  await render(null)
  await expect.poll(() => host.querySelector('dialog')).toBeNull()
  expect(p.panel.open).toBe(false)
  expect(outer.open).toBe(false)
  expect(changes).toHaveBeenCalledTimes(before)
  expect(cleaned).toHaveBeenCalledTimes(beforeCleanup + 1)
  expect(document.querySelector('[data-rad-motion-exit]')).toBeNull()
})

test('useAlertDialog reads only its own family, including across nested ordinary Dialogs', async () => {
  function Probe() {
    return <span data-alert-state={String(useAlertDialog()?.open ?? null)} />
  }
  const { host } = await mount(
    <>
      <Probe />
      <AlertDialog>
        <Probe />
        <Dialog>
          <Probe />
        </Dialog>
      </AlertDialog>
    </>
  )
  expect(
    Array.from(host.querySelectorAll('[data-alert-state]'), n => n.getAttribute('data-alert-state'))
  ).toEqual(['null', 'false', 'null'])
})

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: default and customized surfaces keep styling, bounds, forced colors and reduced motion`, async () => {
    const theme = defineTheme({
      id: 'alert-test',
      name: 'Alert test',
      components: { dialog: { width: '28rem' } }
    })
    const { host, render } = await mount(
      <ThemeScope
        theme={theme}
        mode={mode}
      >
        <MotionProvider>
          <Fixture defaultOpen />
        </MotionProvider>
      </ThemeScope>
    )
    const p = parts(host)
    expect(getComputedStyle(p.panel).width).toBe('448px')
    expect(getComputedStyle(p.panel).display).toBe('grid')
    await render(
      <ThemeScope
        theme={theme}
        mode={mode}
      >
        <MotionProvider>
          <Fixture
            defaultOpen
            content={{ className: 'open:p-4', style: { '--rad-dialog-width': '24rem' } }}
          />
        </MotionProvider>
      </ThemeScope>
    )
    expect(getComputedStyle(p.panel).width).toBe('384px')
    expect(getComputedStyle(p.panel).padding).toBe('16px')
    await act(async () =>
      commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
    )
    await expect.poll(() => getComputedStyle(p.panel).transitionProperty).toBe('none')
    await expect.poll(() => p.panel.style.scale).toBe('1')
    const probe = document.createElement('span')
    probe.style.color = 'CanvasText'
    p.panel.append(probe)
    expect(getComputedStyle(p.panel).color).toBe(getComputedStyle(probe).color)
    probe.remove()
    await click(p.cancel)
    expect(getComputedStyle(p.panel).display).toBe('none')
    expect(document.querySelector('[data-rad-motion-exit]')).toBeNull()
  })
}

test('consequential example cancels safely and restores workflow focus when deletion removes the opener', async () => {
  const { host } = await mount(<DeleteProjectExample />, true)
  await click(parts(host).trigger)
  await key('{Enter}')
  expect(host.textContent).toContain('Project: Summer launch')
  await click(parts(host).trigger)
  await click(parts(host).action)
  expect(host.querySelector('dialog')).toBeNull()
  expect(host.textContent).toContain('Project deleted.')
  expect(document.activeElement).toBe(host.querySelector('p'))
})
