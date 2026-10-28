import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Button, Link, ThemeScope, defineTheme, type LinkVariant } from '../../src/index.js'
import { MotionProvider, MotionLink, type MotionLinkProps } from '../../src/motion/react.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
const scale = (node: HTMLElement) => Number(node.style.scale || 1)
const theme = defineTheme({
  id: 'link-motion',
  name: 'Link motion',
  motion: { spring: { stiffness: 180, damping: 14 } }
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
  const root = createRoot(host)
  mounted.push({ root, host })
  await act(async () => root.render(scope(children)))
  return { host, root }
}
async function until(check: () => boolean) {
  for (let i = 0; i < 180; i++) {
    if (check()) return
    await frame()
  }
  throw new Error('Link spring did not reach expected state')
}
function pointer(node: HTMLElement, type: string, pointerId = 1) {
  node.dispatchEvent(
    new PointerEvent(type, { bubbles: true, button: 0, pointerId, isPrimary: true })
  )
}
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await act(async () => commands.emulatePreferences({ reducedMotion: 'no-preference' }))
})

test('lost capture releases the same physical spring as Button and forwards the consumer once', async () => {
  const lost = vi.fn()
  const { host } = await mount(
    <>
      <Button style={{ '--rad-button-press-scale': '.8' }}>Action</Button>
      <MotionLink
        href="#destination"
        variant="solid"
        onLostPointerCapture={lost}
        style={{ '--rad-button-press-scale': '.8' }}
      >
        Destination
      </MotionLink>
    </>
  )
  const link = host.querySelector('a')!
  const button = host.querySelector('button')!
  pointer(link, 'pointerdown')
  pointer(button, 'pointerdown')
  await until(() => scale(link) < 0.85 && scale(button) < 0.85)
  pointer(document.body, 'pointerup', 2)
  for (let i = 0; i < 5; i++) await frame()
  expect(scale(link)).toBeLessThan(0.85)
  expect(getComputedStyle(link).transitionProperty).not.toContain('scale')
  for (const property of [
    'color',
    'background-color',
    'min-height',
    'font-size',
    'border-radius'
  ]) {
    expect(getComputedStyle(link).getPropertyValue(property)).toBe(
      getComputedStyle(button).getPropertyValue(property)
    )
  }
  pointer(link, 'lostpointercapture')
  pointer(button, 'lostpointercapture')
  expect(lost).toHaveBeenCalledOnce()
  await until(() => Math.abs(scale(link) - 1) < 0.001 && Math.abs(scale(button) - 1) < 0.001)
})

test('removing href cancels a held press; an anchor without a destination never compresses', async () => {
  const { host } = await mount(
    <MotionLink
      href="#destination"
      variant="solid"
    >
      Destination
    </MotionLink>
  )
  const link = host.querySelector('a')!
  pointer(link, 'pointerdown')
  await until(() => scale(link) < 0.99)
  link.removeAttribute('href')
  await until(() => scale(link) === 1)
  pointer(link, 'pointerdown')
  for (let i = 0; i < 6; i++) await frame()
  expect(scale(link)).toBe(1)
  link.setAttribute('href', '#destination')
  for (let i = 0; i < 6; i++) await frame()
  expect(scale(link)).toBe(1)
  pointer(link, 'pointerdown')
  await until(() => scale(link) < 0.99)
})

test('re-pressing a rebounding link retains its in-flight momentum', async () => {
  const { host } = await mount(
    <MotionLink
      href="#destination"
      variant="solid"
      style={{ '--rad-button-press-scale': '.8' }}
    >
      Destination
    </MotionLink>
  )
  const link = host.querySelector('a')!
  pointer(link, 'pointerdown')
  await until(() => scale(link) < 0.85)
  pointer(link, 'pointerup')
  await until(() => scale(link) > 0.88 && scale(link) < 0.95)
  const before = scale(link)
  pointer(link, 'pointerdown')
  const samples: number[] = []
  for (let i = 0; i < 3; i++) {
    await frame()
    samples.push(scale(link))
  }
  expect(samples.some(value => value > before + 0.001)).toBe(true)
  pointer(document.body, 'pointerup')
  await until(() => scale(link) === 1)
})

test('action/inline changes, local off and live reduced motion preserve refs, scale ownership and cleanup', async () => {
  const cleanup = vi.fn()
  const ref = vi.fn(() => cleanup)
  const render = (props: Partial<MotionLinkProps> = {}) => (
    <MotionLink
      ref={ref}
      href="#destination"
      variant="solid"
      render={resolved => <a {...resolved}>{resolved.children}</a>}
      {...props}
    >
      Destination
    </MotionLink>
  )
  const { host, root } = await mount(render())
  const link = host.querySelector('a')!
  pointer(link, 'pointerdown')
  await until(() => scale(link) < 0.99)
  await act(async () => commands.emulatePreferences({ reducedMotion: 'reduce' }))
  await until(() => scale(link) === 1)
  await act(async () => commands.emulatePreferences({ reducedMotion: 'no-preference' }))
  for (let i = 0; i < 6; i++) await frame()
  expect(scale(link)).toBe(1)
  for (const variant of ['inline', 'subtle'] as const satisfies readonly LinkVariant[]) {
    await act(async () => root.render(scope(render({ variant }))))
    pointer(link, 'pointerdown')
    for (let i = 0; i < 6; i++) await frame()
    expect(link.style.scale).toBe('')
  }
  await act(async () => root.render(scope(render())))
  pointer(link, 'pointerdown')
  await until(() => scale(link) < 0.99)
  await act(async () => root.render(scope(render({ motion: 'off' }))))
  expect(link.style.scale).toBe('')
  await act(async () =>
    root.render(scope(render({ style: { scale: '.9', transform: 'rotate(3deg)' } })))
  )
  pointer(link, 'pointerdown')
  await frame()
  expect(link.style.scale).toBe('0.9')
  expect(link.style.transform).toBe('rotate(3deg)')
  const cleaned = cleanup.mock.calls.length
  await act(async () => root.render(null))
  expect(cleanup).toHaveBeenCalledTimes(cleaned + 1)
  expect(link.style.scale).toBe('0.9')
})

test('keyboard Enter springs without changing native Space or cancelled input behavior', async () => {
  const clicked = vi.fn<NonNullable<MotionLinkProps['onClick']>>(event => event.preventDefault())
  const { host, root } = await mount(
    <MotionLink
      href="#destination"
      variant="solid"
      onClick={clicked}
    >
      Destination
    </MotionLink>
  )
  const link = host.querySelector('a')!
  await act(async () => link.focus())
  await act(async () => userEvent.keyboard('[Space>]'))
  for (let i = 0; i < 4; i++) await frame()
  expect(scale(link)).toBe(1)
  await act(async () => userEvent.keyboard('[/Space]'))
  expect(clicked).not.toHaveBeenCalled()
  await act(async () => userEvent.keyboard('[Enter>]'))
  await until(() => scale(link) < 0.99)
  expect(clicked).toHaveBeenCalledOnce()
  await act(async () => userEvent.keyboard('[/Enter]'))
  await until(() => scale(link) === 1)
  await act(async () =>
    root.render(
      scope(
        <MotionLink
          href="#destination"
          variant="solid"
          onPointerDown={event => event.preventDefault()}
        >
          Cancelled
        </MotionLink>
      )
    )
  )
  pointer(link, 'pointerdown')
  for (let i = 0; i < 4; i++) await frame()
  expect(scale(link)).toBeCloseTo(1, 3)
})

test('MotionLink hydrates onto one native anchor and ordinary inline Link stays unsprung', async () => {
  const ref = createRef<HTMLAnchorElement>()
  const tree = scope(
    <MotionLink
      ref={ref}
      href="#destination"
      variant="outline"
    >
      Destination
    </MotionLink>
  )
  const html = renderToString(tree)
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.append(host)
  const link = host.querySelector('a')!
  expect(link.style.scale).toBe('')
  const errors: unknown[] = []
  await act(async () => {
    const root = hydrateRoot(host, tree, { onRecoverableError: error => errors.push(error) })
    mounted.push({ root, host })
  })
  expect(errors).toEqual([])
  expect(ref.current).toBe(link)
  const plain = await mount(<Link href="#destination">Inline reference</Link>)
  pointer(plain.host.querySelector('a')!, 'pointerdown')
  await frame()
  expect(plain.host.querySelector('a')!.style.scale).toBe('')
})
