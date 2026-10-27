import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Button,
  ThemeScope,
  defineTheme,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose
} from '../../src/index.js'
import { MotionProvider, MotionLink } from '../../src/motion/react.js'
import type {} from './mediaCommands.js'
import type {} from './touchCommands.js'
import '../../.storybook/styles.css'
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const roots: Root[] = []
const hosts: HTMLElement[] = []
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
async function until(check: () => boolean) {
  for (let i = 0; i < 180; i++) {
    if (check()) return
    await frame()
  }
  throw new Error('Button spring did not reach expected state')
}
const theme = defineTheme({
  id: 'press-proof',
  name: 'Press proof',
  motion: { interactions: { press: { stiffness: 180, damping: 14 } } }
})
const scope = (children: ReactNode) => (
  <StrictMode>
    <ThemeScope theme={theme}>
      <MotionProvider>{children}</MotionProvider>
    </ThemeScope>
  </StrictMode>
)
async function mount(children: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  hosts.push(host)
  const root = createRoot(host)
  roots.push(root)
  await act(async () => root.render(scope(children)))
  return { host, root }
}
afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount())
  hosts.splice(0).forEach(node => node.remove())
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
})
function pointer(node: HTMLElement, type: string) {
  node.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      button: 0,
      pointerId: 1,
      isPrimary: true,
      pointerType: 'mouse'
    })
  )
}
const scale = (node: HTMLElement) => Number(node.style.scale || 1)

test('real Button press/release/re-press retains momentum and CSS does not tween scale', async () => {
  const ref = createRef<HTMLButtonElement>()
  const { host } = await mount(
    <Button
      ref={ref}
      style={{ '--rad-button-press-scale': '.8', transform: 'rotate(7deg)' }}
    >
      Spring
    </Button>
  )
  const button = host.querySelector('button')!
  expect(ref.current).toBe(button)
  pointer(button, 'pointerdown')
  await until(() => scale(button) < 0.86)
  pointer(button, 'pointerup')
  await until(() => scale(button) > 0.87 && scale(button) < 0.95)
  const before = scale(button)
  pointer(button, 'pointerdown')
  const samples: number[] = []
  for (let i = 0; i < 3; i++) {
    await frame()
    samples.push(scale(button))
  }
  expect(samples.some(value => value > before + 0.001)).toBe(true)
  expect(getComputedStyle(button).transitionProperty).not.toContain('scale')
  expect(button.style.transform).toBe('rotate(7deg)')
  pointer(document.body, 'pointerup')
  await until(() => Math.abs(scale(button) - 1) < 0.001)
  pointer(button, 'pointerdown')
  await until(() => scale(button) < 0.95)
  pointer(button, 'pointercancel')
  await until(() => Math.abs(scale(button) - 1) < 0.001)
})
test('native submit, Enter/Space, repeat, caller cancellation, disabled/pending and render refs', async () => {
  let submits = 0
  let value: FormDataEntryValue | null = null
  const ref = createRef<HTMLButtonElement>()
  const render = () => (
    <form
      onSubmit={event => {
        event.preventDefault()
        submits++
        value = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter).get(
          'intent'
        )
      }}
    >
      <fieldset>
        <Button
          ref={ref}
          type="submit"
          name="intent"
          value="save"
          render={props => <button {...props} />}
        >
          Save
        </Button>
      </fieldset>
    </form>
  )
  const { host, root } = await mount(render())
  const button = host.querySelector('button')!
  expect(ref.current).toBe(button)
  await userEvent.click(button)
  expect(submits).toBe(1)
  expect(value).toBe('save')
  await userEvent.keyboard('[Space>]')
  await until(() => scale(button) < 0.999)
  button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true }))
  await userEvent.keyboard('[/Space]')
  expect(submits).toBe(2)
  await userEvent.keyboard('{Enter}')
  expect(submits).toBe(3)
  pointer(button, 'pointerdown')
  await until(() => scale(button) < 0.999)
  host.querySelector('fieldset')!.disabled = true
  await until(() => scale(button) === 1)
  await act(async () => root.render(scope(<Button pending>Busy</Button>)))
  const busy = host.querySelector('button')!
  pointer(busy, 'pointerdown')
  await frame()
  expect(scale(busy)).toBe(1)
  await act(async () =>
    root.render(scope(<Button onPointerDown={event => event.preventDefault()}>Cancelled</Button>))
  )
  const cancelled = host.querySelector('button')!
  pointer(cancelled, 'pointerdown')
  await frame()
  expect(scale(cancelled)).toBe(1)
})
test('off/reduced motion, styling ownership, real Dialog actions and hydration', async () => {
  const { host, root } = await mount(
    <>
      <Button motion="off">Off</Button>
      <Button style={{ scale: '.85' }}>Owned</Button>
      <Button className="scale-90">Class owned</Button>
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Modal</DialogTitle>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
  const buttons = host.querySelectorAll('button')
  pointer(buttons[0], 'pointerdown')
  expect(scale(buttons[0])).toBe(1)
  pointer(buttons[1], 'pointerdown')
  expect(scale(buttons[1])).toBe(0.85)
  pointer(buttons[2], 'pointerdown')
  expect(buttons[2].style.scale).toBe('')
  const open = Array.from(buttons).find(node => node.textContent === 'Open')!
  pointer(open, 'pointerdown')
  await until(() => scale(open) < 0.999)
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'reduce' })
    await frame()
  })
  await until(() => scale(open) === 1)
  await userEvent.click(open)
  expect(host.querySelector('dialog')!.matches(':modal')).toBe(true)
  await userEvent.keyboard('{Escape}')
  await until(() => !host.querySelector('dialog')!.open)
  expect(document.activeElement).toBe(open)
  await act(async () =>
    root.render(
      scope(
        <MotionLink
          variant="solid"
          href="#local"
          onClick={event => event.preventDefault()}
        >
          Link
        </MotionLink>
      )
    )
  )
  const link = host.querySelector('a')!
  expect(link.getAttribute('href')).toBe('#local')
  const html = renderToString(scope(<Button>Hydrate</Button>))
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)
  hosts.push(container)
  const original = container.querySelector('button')
  const errors: unknown[] = []
  await act(async () => {
    roots.push(
      hydrateRoot(container, scope(<Button>Hydrate</Button>), {
        onRecoverableError: error => errors.push(error)
      })
    )
  })
  expect(errors).toEqual([])
  expect(container.querySelector('button')).toBe(original)
})

test('actual touch submit and cancellation preserve native activation', async () => {
  let submits = 0
  const { host } = await mount(
    <form
      onSubmit={event => {
        event.preventDefault()
        submits++
      }}
    >
      <Button
        id="touch-spring"
        type="submit"
      >
        Touch
      </Button>
    </form>
  )
  expect(await commands.touchButton('#touch-spring', true)).toBe(true)
  await until(() => Math.abs(scale(host.querySelector('button')!) - 1) < 0.001)
  expect(submits).toBe(0)
  expect(await commands.touchButton('#touch-spring', false)).toBe(true)
  expect(submits).toBe(1)
})
