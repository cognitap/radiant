import { act, createRef, StrictMode } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent, commands } from 'vitest/browser'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  ThemeScope,
  defineTheme,
  type ToastProps
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { mount, click, key, pause } from './familyHarness.js'
const viewportStyle = { position: 'relative', inset: 'auto' } as const
function Message(props: ToastProps) {
  return (
    <Toast {...props}>
      <ToastTitle>Saved</ToastTitle>
      <ToastDescription>Your draft is safe.</ToastDescription>
      <ToastAction
        altText="Undo is available from Notifications."
        variant="outline"
      >
        Undo
      </ToastAction>
      <ToastClose variant="ghost">Dismiss</ToastClose>
    </Toast>
  )
}
function roots(host: HTMLElement) {
  return Array.from(host.querySelectorAll<HTMLElement>('[data-slot~=toast]'))
}
function live(host: HTMLElement, role = 'status') {
  return host.querySelector<HTMLElement>(
    role === 'status'
      ? 'output[data-slot=toast-announcer]'
      : '[data-slot=toast-announcer][role=alert]'
  )!
}
test('SSR/hydration queue one visible toast without focus theft and announce only its relevant text', async () => {
  const { host } = await mount(
    <StrictMode>
      <ToastProvider>
        <button>Work</button>
        <ToastViewport style={viewportStyle}>
          <Message defaultOpen />
          <Message defaultOpen />
        </ToastViewport>
      </ToastProvider>
    </StrictMode>,
    true
  )
  const toasts = roots(host)
  expect(toasts[0].hidden).toBe(false)
  expect(toasts[1].hidden).toBe(true)
  expect(toasts[1].inert).toBe(true)
  expect(document.activeElement).not.toBe(toasts[0])
  await pause(60)
  expect(live(host).textContent).toBe(
    'Saved Your draft is safe. Undo is available from Notifications.'
  )
  expect(live(host).textContent).not.toContain('Dismiss')
  expect(toasts[0].getAttribute('role')).toBe('group')
  expect(toasts[0].getAttribute('aria-label')).toBe('Saved')
  expect(toasts[0].getAttribute('data-slot')).toContain('alert toast')
})
test('FIFO promotion supports distinct repeated messages and clears announcers on close', async () => {
  const { host } = await mount(
    <ToastProvider>
      <ToastViewport style={viewportStyle}>
        <Message defaultOpen />
        <Message defaultOpen />
      </ToastViewport>
    </ToastProvider>
  )
  const [first, second] = roots(host)
  await pause(40)
  const records: MutationRecord[] = []
  const observer = new MutationObserver(changes => records.push(...changes))
  observer.observe(live(host), { childList: true, characterData: true, subtree: true })
  await click(first.querySelector('[data-slot~=toast-close]')!)
  await pause(60)
  expect(first.hidden).toBe(true)
  expect(second.hidden).toBe(false)
  expect(live(host).textContent).toContain('Saved')
  expect([...records, ...observer.takeRecords()].length).toBeGreaterThan(0)
  observer.disconnect()
  await click(second.querySelector('[data-slot~=toast-close]')!)
  expect(live(host).textContent).toBe('')
})
test('F8 reaches a toast, actions stay in Tab order, Escape restores the original focus', async () => {
  const { host } = await mount(
    <ToastProvider>
      <Button>Work</Button>
      <ToastViewport style={viewportStyle}>
        <Message defaultOpen />
      </ToastViewport>
    </ToastProvider>
  )
  const work = host.querySelector('button')!
  const toast = roots(host)[0]
  await click(work)
  await key('{F8}')
  expect(document.activeElement).toBe(toast)
  await key('{Tab}')
  expect(document.activeElement).toBe(toast.querySelector('[data-slot~=toast-action]'))
  await key('{Escape}')
  expect(toast.hidden).toBe(true)
  expect(document.activeElement).toBe(work)
})
test('native action guards and cancellation precede closing; native form submission survives', async () => {
  const blocked = vi.fn()
  const submit = vi.fn()
  const action = vi.fn()
  const { host } = await mount(
    <ToastProvider>
      <form
        onSubmit={event => {
          event.preventDefault()
          submit()
        }}
      >
        <ToastViewport style={viewportStyle}>
          <Toast defaultOpen>
            <ToastTitle>Saved</ToastTitle>
            <ToastAction
              disabled
              altText="Unavailable action."
              onClick={blocked}
            >
              Disabled
            </ToastAction>
            <ToastAction
              pending
              altText="Pending action."
              onClick={blocked}
            >
              Pending
            </ToastAction>
            <ToastAction
              altText="Keep open."
              onClick={event => event.preventDefault()}
            >
              Keep open
            </ToastAction>
            <ToastAction
              altText="Save draft."
              type="submit"
              onClick={action}
            >
              Save
            </ToastAction>
          </Toast>
        </ToastViewport>
      </form>
    </ToastProvider>
  )
  const toast = roots(host)[0]
  const buttons = toast.querySelectorAll('button')
  await act(async () => buttons[0].click())
  await click(buttons[1])
  await click(buttons[2])
  expect(blocked).not.toHaveBeenCalled()
  expect(toast.hidden).toBe(false)
  await click(buttons[3])
  expect(action).toHaveBeenCalledTimes(1)
  expect(submit).toHaveBeenCalledTimes(1)
  expect(toast.hidden).toBe(true)
})
test('controlled owners may refuse requests; prop synchronization does not notify', async () => {
  const change = vi.fn()
  const tree = (open: boolean) => (
    <ToastProvider>
      <ToastViewport style={viewportStyle}>
        <Message
          open={open}
          onOpenChange={change}
        />
      </ToastViewport>
    </ToastProvider>
  )
  const { host, render } = await mount(tree(true))
  const toast = roots(host)[0]
  await click(toast.querySelector('[data-slot~=toast-close]')!)
  expect(change).toHaveBeenLastCalledWith(false)
  expect(toast.hidden).toBe(false)
  change.mockClear()
  await render(tree(false))
  expect(change).not.toHaveBeenCalled()
  expect(toast.hidden).toBe(true)
})
test('timers begin only when promoted; default persistent feedback never expires', async () => {
  const { host } = await mount(
    <ToastProvider>
      <button>Outside timer</button>
      <ToastViewport style={viewportStyle}>
        <Message defaultOpen />
        <Message
          defaultOpen
          duration={350}
        />
      </ToastViewport>
    </ToastProvider>
  )
  const [first, second] = roots(host)
  await pause(450)
  expect(first.hidden).toBe(false)
  expect(second.hidden).toBe(true)
  await click(first.querySelector('[data-slot~=toast-close]')!)
  expect(second.hidden).toBe(false)
  await act(async () => userEvent.hover(host.querySelector('button')!))
  await pause(450)
  expect(second.hidden).toBe(true)
})
test('hover and focus pause the remaining timeout rather than restarting it', async () => {
  const { host } = await mount(
    <ToastProvider>
      <button>Outside</button>
      <ToastViewport style={viewportStyle}>
        <Message
          defaultOpen
          duration={700}
        />
      </ToastViewport>
    </ToastProvider>
  )
  const toast = roots(host)[0]
  const outside = host.querySelector('button')!
  await act(async () => userEvent.hover(toast))
  expect(toast.dataset.paused).toBe('true')
  await pause(800)
  expect(toast.hidden).toBe(false)
  await act(async () => toast.querySelector<HTMLElement>('[data-slot~=toast-action]')!.focus())
  await act(async () => userEvent.hover(outside))
  await pause(800)
  expect(toast.hidden).toBe(false)
  await click(outside)
  await pause(800)
  expect(toast.hidden).toBe(true)
})
test('document visibility pauses timing and unmount cancels pending timeouts and announcements', async () => {
  const change = vi.fn()
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  try {
    const { host, render } = await mount(
      <ToastProvider duration={300}>
        <ToastViewport style={viewportStyle}>
          <Message
            defaultOpen
            onOpenChange={change}
          />
        </ToastViewport>
      </ToastProvider>
    )
    const toast = roots(host)[0]
    await pause(400)
    expect(toast.hidden).toBe(false)
    expect(toast.dataset.paused).toBe('true')
    hidden.mockReturnValue(false)
    document.dispatchEvent(new Event('visibilitychange'))
    await pause(30)
    await render(null)
    change.mockClear()
    await pause(400)
    expect(change).not.toHaveBeenCalled()
  } finally {
    hidden.mockRestore()
  }
})
test('unchanged messages and action presentation do not replay announcements; urgency is deliberate', async () => {
  const tree = (pending: boolean) => (
    <ToastProvider>
      <ToastViewport style={viewportStyle}>
        <Toast
          defaultOpen
          announce="assertive"
        >
          <ToastTitle>Connection lost</ToastTitle>
          <ToastAction
            altText="Retry is available."
            pending={pending}
          >
            Retry
          </ToastAction>
          <ToastClose>Dismiss</ToastClose>
        </Toast>
      </ToastViewport>
    </ToastProvider>
  )
  const { host, render } = await mount(tree(false))
  await pause(50)
  expect(live(host).textContent).toBe('')
  expect(live(host, 'alert').textContent).toContain('Connection lost')
  const records: MutationRecord[] = []
  const observer = new MutationObserver(changes => records.push(...changes))
  observer.observe(live(host, 'alert'), { childList: true, characterData: true, subtree: true })
  await render(tree(true))
  await pause(50)
  expect([...records, ...observer.takeRecords()]).toEqual([])
  observer.disconnect()
})
test('F8 never leaves an unrelated modal', async () => {
  const { host } = await mount(
    <ToastProvider>
      <ToastViewport style={viewportStyle}>
        <Message defaultOpen />
      </ToastViewport>
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Editing</DialogTitle>
          <Button>Work in dialog</Button>
        </DialogContent>
      </Dialog>
    </ToastProvider>
  )
  await click(host.querySelector('[data-slot~=dialog-trigger]')!)
  const active = document.activeElement
  await key('{F8}')
  expect(document.activeElement).toBe(active)
  expect(host.querySelector('dialog')!.open).toBe(true)
})
test('local styling, refs, motion off and forced colors retain the reachable notification', async () => {
  const ref = createRef<HTMLDivElement>()
  const theme = defineTheme({
    id: 'toast-proof',
    name: 'Toast proof',
    components: { toast: { padding: '17px', titleSize: '23px', radius: '13px' } }
  })
  const { host } = await mount(
    <ThemeScope
      theme={theme}
      mode="dark"
    >
      <MotionProvider>
        <ToastProvider>
          <ToastViewport style={viewportStyle}>
            <Toast
              ref={ref}
              defaultOpen
              motion="off"
            >
              <ToastTitle>Saved</ToastTitle>
              <ToastClose render={props => <button {...props} />}>Dismiss</ToastClose>
            </Toast>
          </ToastViewport>
        </ToastProvider>
      </MotionProvider>
    </ThemeScope>
  )
  const toast = roots(host)[0]
  expect(ref.current).toBe(toast)
  expect(getComputedStyle(toast).padding).toBe('17px')
  expect(getComputedStyle(toast).borderRadius).toBe('13px')
  expect(getComputedStyle(toast.querySelector('h2')!).fontSize).toBe('23px')
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  await key('{F8}')
  expect(getComputedStyle(toast).outlineStyle).not.toBe('none')
  expect(getComputedStyle(toast).display).not.toBe('none')
})

test('Escape dismisses a focused toast inside a modal before the dialog and returns focus locally', async () => {
  const { host } = await mount(
    <ToastProvider>
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Editing</DialogTitle>
          <Button>Work in dialog</Button>
          <ToastViewport style={viewportStyle}>
            <Message defaultOpen />
          </ToastViewport>
        </DialogContent>
      </Dialog>
    </ToastProvider>
  )
  const work = host.querySelector('button')!
  const toast = roots(host)[0]
  await click(work)
  await key('{F8}')
  expect(document.activeElement).toBe(toast)
  await key('{Escape}')
  expect(toast.hidden).toBe(true)
  expect(host.querySelector('dialog')!.open).toBe(true)
  expect(document.activeElement).toBe(work)
})

test('long messages scroll within the viewport and keep their dismissal action reachable', async () => {
  const { host } = await mount(
    <ToastProvider>
      <ToastViewport>
        <Toast defaultOpen>
          <ToastTitle>Saved</ToastTitle>
          <ToastDescription>
            {'A long notification with readable words. '.repeat(300)}
          </ToastDescription>
          <ToastClose>Dismiss</ToastClose>
        </Toast>
      </ToastViewport>
    </ToastProvider>
  )
  const toast = roots(host)[0]
  expect(toast.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight - 31)
  await key('{F8}')
  await key('{Tab}')
  const close = toast.querySelector<HTMLButtonElement>('button')!
  expect(document.activeElement).toBe(close)
  expect(close.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    toast.getBoundingClientRect().bottom + 1
  )
  expect(toast.scrollTop).toBeGreaterThan(0)
})
