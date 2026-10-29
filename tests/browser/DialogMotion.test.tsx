import { act, createRef, StrictMode, useState, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  ThemeScope,
  defineTheme
} from '../../src/index.js'
import { MotionProvider, useReducedMotion } from '../../src/motion/react.js'
import {
  DialogProfileExample,
  DialogTransitionExample
} from '../../.storybook/examples/DialogExamples.js'
import { bindDialogMotion } from '../../src/motion/transitions.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []
const disposals: Array<() => void> = []
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
const theme = defineTheme({
  id: 'dialog-proof',
  name: 'Dialog proof',
  motion: { spring: { stiffness: 180, damping: 16 } }
})
async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  if (hydrate) host.innerHTML = renderToString(tree)
  const errors: unknown[] = []
  let root: Root
  await act(async () => {
    root = hydrate
      ? hydrateRoot(host, tree, { onRecoverableError: error => errors.push(error) })
      : createRoot(host)
    if (!hydrate) root.render(tree)
  })
  mounted.push({ root: root!, host })
  expect(errors).toEqual([])
  return { root: root!, host }
}
async function until(check: () => boolean) {
  await expect.poll(check, { timeout: 4_000 }).toBe(true)
}
afterEach(async () => {
  for (const dispose of disposals.splice(0)) dispose()
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
})

function native(content: string, slow = false) {
  const node = document.createElement('dialog')
  node.style.cssText = 'width:300px;height:200px;margin:auto;position:fixed;inset:0;'
  node.innerHTML = content
  document.body.append(node)
  node.showModal()
  const binding = bindDialogMotion(
    node,
    slow
      ? defineTheme({
          id: 'slow',
          name: 'Slow',
          motion: { spring: { stiffness: 1, damping: 1, mass: 100 } }
        }).motion
      : theme.motion
  )
  disposals.push(() => {
    binding.destroy()
    node.close()
    node.remove()
  })
  return node
}

test('nested dialogs, large trees, media and custom elements skip visual exit copies', async () => {
  for (const content of [
    '<h2>Parent</h2><dialog><h2>Nested</h2></dialog>',
    '<p>Row</p>'.repeat(501),
    '<button is="unsafe-custom-button">Custom</button>',
    '<canvas></canvas>',
    '<unsafe-element></unsafe-element>'
  ]) {
    const node = native(content)
    node.close()
    await expect.poll(() => Number(node.style.scale)).toBe(0.94)
    expect(document.querySelector('[data-rad-motion-exit]')).toBeNull()
  }
})

test('a slow exit has a finite lifetime and settles the closed host', async () => {
  const node = native('<h2>Slow dialog</h2><button>Close</button>', true)
  node.close()
  await expect.poll(() => document.querySelector('[data-rad-motion-exit]')).not.toBeNull()
  const ghost = document.querySelector('[data-rad-motion-exit]')!
  await expect.poll(() => ghost.isConnected, { timeout: 4_000 }).toBe(false)
  expect(Number(node.style.scale)).toBe(0.94)
})

test('a modal exit stays at its viewport position after the native panel closes', async () => {
  const node = native('<h2>Position</h2>')
  const before = node.getBoundingClientRect()
  node.close()
  await expect.poll(() => document.querySelector('[data-rad-motion-exit]')).not.toBeNull()
  const ghost = document.querySelector('[data-rad-motion-exit]')!
  expect(ghost).not.toBeNull()
  const after = ghost.getBoundingClientRect()
  expect(Math.abs(after.left + after.width / 2 - before.left - before.width / 2)).toBeLessThan(1)
  expect(Math.abs(after.top + after.height / 2 - before.top - before.height / 2)).toBeLessThan(1)
})

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: action adapters keep native hosts, close/focus are immediate and reopening clears the copy`, async () => {
    const triggerRef = createRef<HTMLButtonElement>()
    const contentRef = createRef<HTMLDialogElement>()
    const changes = vi.fn()
    function Controlled() {
      const [open, setOpen] = useState(false)
      return (
        <Dialog
          open={open}
          onOpenChange={next => {
            changes(next)
            setOpen(next)
          }}
        >
          <DialogTrigger
            ref={triggerRef}
            render={props => (
              <button
                {...props}
                data-adapter=""
              />
            )}
          >
            Open
          </DialogTrigger>
          <DialogContent
            ref={contentRef}
            style={{ transform: 'rotate(0deg)' }}
          >
            <DialogTitle>Motion panel</DialogTitle>
            <DialogDescription>Native focus stays immediate.</DialogDescription>
            <input
              name="details"
              aria-label="Details"
              defaultValue="Current text"
            />
            <DialogClose
              render={props => (
                <button
                  {...props}
                  data-close-adapter=""
                />
              )}
            >
              Close
            </DialogClose>
          </DialogContent>
        </Dialog>
      )
    }
    const { root } = await mount(
      <StrictMode>
        <ThemeScope
          theme={theme}
          mode={mode}
        >
          <MotionProvider>
            <Controlled />
          </MotionProvider>
        </ThemeScope>
      </StrictMode>
    )
    const trigger = triggerRef.current!
    await act(async () => {
      trigger.focus()
      await userEvent.keyboard('[Space>]')
    })
    await until(() => Number(trigger.style.scale) < 0.99)
    expect(contentRef.current!.open).toBe(false)
    await act(async () => userEvent.keyboard('[/Space]'))
    const panel = contentRef.current!
    expect(panel.matches(':modal')).toBe(true)
    expect(changes).toHaveBeenCalledExactlyOnceWith(true)
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.style.transform).toBe('rotate(0deg)')
    expect(panel.contains(document.activeElement)).toBe(true)
    await until(() => Number(panel.style.scale) > 0.99)
    await act(async () => userEvent.keyboard('{Escape}'))
    await until(() => !panel.open)
    expect(document.activeElement).toBe(trigger)
    expect(panel.matches(':modal')).toBe(false)
    await expect.poll(() => document.querySelector('[data-rad-motion-exit]')).not.toBeNull()
    const ghost = document.querySelector<HTMLElement>('[data-rad-motion-exit]')!
    expect(ghost.inert).toBe(true)
    expect(ghost.getAttribute('aria-hidden')).toBe('true')
    expect(ghost.querySelector('[id],[name],[form],[autofocus]')).toBeNull()
    expect(ghost.querySelector('input')!.disabled).toBe(true)
    await act(async () => trigger.click())
    expect(panel.open).toBe(true)
    expect(document.querySelector('[data-rad-motion-exit]')).toBeNull()
    const close = panel.querySelector<HTMLButtonElement>('[data-close-adapter]')!
    await act(async () => {
      close.focus()
      await userEvent.keyboard('[Space>]')
    })
    await until(() => Number(close.style.scale) < 0.99)
    expect(panel.open).toBe(true)
    await act(async () => userEvent.keyboard('[/Space]'))
    await until(() => !panel.open)
    expect(document.activeElement).toBe(trigger)
    await act(async () => root.render(null))
    expect(panel.style.scale).toBe('')
    expect(panel.open).toBe(false)
    expect(document.querySelector('[data-rad-motion-exit]')).toBeNull()
  })
}

function Preference() {
  return <span data-reduced={String(useReducedMotion())} />
}
test('live reduced/off policy, caller scale and callback ref cleanup keep their owners', async () => {
  const cleaned = vi.fn()
  const ref = vi.fn(() => cleaned)
  const tree = (
    open: boolean,
    off = false,
    motion: 'inherit' | 'off' = 'inherit',
    custom = false
  ) => (
    <StrictMode>
      <ThemeScope theme={off ? { ...theme, motion: { ...theme.motion, mode: 'off' } } : theme}>
        <MotionProvider>
          <Preference />
          <Dialog
            open={open}
            onOpenChange={() => {}}
          >
            <DialogContent
              ref={ref}
              motion={motion}
              style={custom ? { scale: '.8' } : undefined}
            >
              <DialogTitle>Live policy</DialogTitle>
              <DialogDescription>Change preferences live.</DialogDescription>
              <DialogClose>Close</DialogClose>
            </DialogContent>
          </Dialog>
        </MotionProvider>
      </ThemeScope>
    </StrictMode>
  )
  const { host, root } = await mount(tree(true))
  const node = host.querySelector('dialog')!
  await until(() => Number(node.style.scale) > 0.99)
  await act(async () => root.render(tree(false)))
  expect(node.open).toBe(false)
  await expect.poll(() => document.querySelector('[data-rad-motion-exit]')).not.toBeNull()
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'reduce' })
    await frame()
  })
  await until(() => host.querySelector('[data-reduced]')?.getAttribute('data-reduced') === 'true')
  expect(document.querySelector('[data-rad-motion-exit]')).toBeNull()
  await act(async () => root.render(tree(true)))
  expect(node.style.scale).toBe('1')
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'no-preference' })
    await frame()
  })
  await until(() => host.querySelector('[data-reduced]')?.getAttribute('data-reduced') === 'false')
  await act(async () => root.render(tree(false, true)))
  expect(document.querySelector('[data-rad-motion-exit]')).toBeNull()
  await act(async () => root.render(tree(true, false, 'off')))
  expect(node.style.scale).toBe('')
  await act(async () => root.render(tree(true, false, 'inherit', true)))
  expect(node.style.scale).toBe('0.8')
  const before = cleaned.mock.calls.length
  await act(async () => root.render(null))
  expect(cleaned).toHaveBeenCalledTimes(before + 1)
})

test('a controlled owner can refuse native Escape dismissal without duplicate requests', async () => {
  const changes = vi.fn()
  const { host } = await mount(
    <MotionProvider>
      <Dialog
        open
        onOpenChange={changes}
      >
        <DialogContent>
          <DialogTitle>Held open</DialogTitle>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>
    </MotionProvider>
  )
  const panel = host.querySelector('dialog')!
  await act(async () => userEvent.keyboard('{Escape}'))
  await until(() => changes.mock.calls.length > 0 && panel.matches(':modal'))
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
  expect(panel.open).toBe(true)
  expect(document.querySelector('[data-rad-motion-exit]')).toBeNull()
})

test('a dialog keeps owned and external description ids together', async () => {
  const { host } = await mount(
    <Dialog>
      <DialogContent aria-describedby="help help extra">
        <DialogTitle>Panel</DialogTitle>
        <DialogDescription>Owned description</DialogDescription>
        <DialogClose>Close</DialogClose>
      </DialogContent>
      <p id="help">Help</p>
      <p id="extra">Extra</p>
    </Dialog>
  )
  const owned = host.querySelector('[data-slot="dialog-description"]')!.id
  expect(host.querySelector('dialog')!.getAttribute('aria-describedby')!.split(' ')).toEqual([
    owned,
    'help',
    'extra'
  ])
})

test('the profile flow hydrates, validates, protects pending work, saves and restores focus', async () => {
  const { host } = await mount(
    <StrictMode>
      <DialogProfileExample />
    </StrictMode>,
    true
  )
  const trigger = host.querySelector<HTMLButtonElement>('[data-profile-trigger]')!
  expect(host.querySelector('dialog')!.open).toBe(false)
  await act(async () => userEvent.click(trigger))
  const panel = host.querySelector('dialog')!
  const [name, email] = panel.querySelectorAll('input')
  const form = panel.querySelector('form')!
  const submit = form.querySelector<HTMLButtonElement>('[type=submit]')!
  await act(async () => userEvent.clear(name))
  await act(async () => submit.click())
  expect(document.activeElement).toBe(name)
  expect(name.getAttribute('aria-invalid')).toBe('true')
  for (const id of name.getAttribute('aria-describedby')!.split(/\s+/))
    expect(document.getElementById(id)).not.toBeNull()
  await act(async () => {
    await userEvent.type(name, 'Grace Hopper')
    await userEvent.clear(email)
    await userEvent.type(email, 'invalid')
  })
  await act(async () => submit.click())
  expect(document.activeElement).toBe(email)
  await act(async () => form.reset())
  expect(name.value).toBe('Ada Lovelace')
  await act(async () => {
    await userEvent.clear(name)
    await userEvent.type(name, 'Grace Hopper')
  })
  await act(async () => userEvent.click(submit))
  expect(submit.getAttribute('aria-busy')).toBe('true')
  expect(name.matches(':disabled')).toBe(true)
  expect(document.activeElement).toBe(submit)
  await act(async () => userEvent.keyboard('{Escape}'))
  expect(panel.open).toBe(true)
  await until(() => !panel.open)
  expect(host.textContent).toContain('Saved locally: Grace Hopper · ada@example.com.')
  expect(document.activeElement).toBe(trigger)
  await act(async () => userEvent.click(trigger))
  expect(name.value).toBe('Grace Hopper')
})

test('the transition lab keeps native form close, bounded content and pending replay cleanup', async () => {
  const { host, root } = await mount(<DialogTransitionExample />)
  const trigger = host.querySelector('button')!
  const panel = host.querySelector('dialog')!
  await act(async () => userEvent.click(trigger))
  const [large] = panel.querySelectorAll('input')
  await act(async () => large.click())
  expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight)
  await act(async () => panel.querySelector('form')!.requestSubmit())
  await until(() => !panel.open)
  expect(document.activeElement).toBe(trigger)
  await act(async () => userEvent.click(trigger))
  const replay = [...panel.querySelectorAll('button')].find(
    button => button.textContent === 'Close and reopen'
  )!
  await act(async () => replay.click())
  expect(panel.open).toBe(false)
  await act(async () => root.render(null))
  await new Promise(resolve => setTimeout(resolve, 120))
  expect(document.querySelector('[data-rad-motion-exit]')).toBeNull()
  expect(host.querySelector('dialog')).toBeNull()
})
