import { act, StrictMode, useEffect, useRef, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Button, ThemeScope, defineTheme, type Theme } from '../../src/index.js'
import { createSpring, createLayoutSpring, type SpringController } from '../../src/motion/index.js'
import { useSpringStyle } from '../../src/motion/react.js'
import type {} from './mediaCommands.js'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const roots: Root[] = []
const hosts: HTMLElement[] = []
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
async function until(check: () => boolean) {
  for (let i = 0; i < 180; i++) {
    if (check()) return
    await frame()
  }
  throw new Error('Motion condition did not settle')
}
async function mount(node: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  hosts.push(host)
  const root = createRoot(host)
  roots.push(root)
  await act(async () => root.render(node))
  return { host, root }
}
afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount())
  for (const host of hosts.splice(0)) host.remove()
  await act(async () => commands.emulatePreferences({ reducedMotion: 'no-preference' }))
})

test('scalar and layout retargets retain momentum; parameter changes defer until rest', async () => {
  const spring = createSpring(0, { parameters: { stiffness: 260, damping: 24, mass: 1 } })
  const layout = createLayoutSpring(
    { x: 0, y: 0, width: 120, height: 60 },
    { parameters: { stiffness: 260, damping: 24, mass: 1 } }
  )
  try {
    spring.to(100)
    layout.to({ x: 0, y: 100, width: 240, height: 60 })
    await until(() => spring.get() > 35 && spring.get() < 80)
    const before = spring.get()
    const bounds = layout.get()
    spring.configure({ parameters: { stiffness: 420, damping: 36 } })
    spring.to(0)
    layout.to({ x: 0, y: 0, width: 120, height: 60 })
    const scalar: number[] = []
    const positions: number[] = []
    const widths: number[] = []
    for (let i = 0; i < 4; i++) {
      await frame()
      scalar.push(spring.get())
      positions.push(layout.get().y)
      widths.push(layout.get().width)
    }
    expect(scalar.some(value => value > before + 0.1)).toBe(true)
    expect(positions.some(value => value > bounds.y + 0.1)).toBe(true)
    expect(widths.some(value => value > bounds.width + 0.1)).toBe(true)
    await until(() => !spring.isAnimating() && !layout.isAnimating())
    expect(spring.get()).toBe(0)
    spring.to(100)
    await until(() => spring.get() > 1)
    spring.configure({ enabled: false })
    expect(spring.get()).toBe(100)
    expect(spring.isAnimating()).toBe(false)
    spring.configure({ enabled: true })
    expect(spring.isAnimating()).toBe(false)
  } finally {
    spring.destroy()
    layout.destroy()
  }
})
let control: SpringController
let commits = 0
const nativeRefs: HTMLButtonElement[] = []
function BoundButton({ theme, alternate = false }: { theme: Theme; alternate?: boolean }) {
  return (
    <ThemeScope theme={theme}>
      <Binding alternate={alternate} />
    </ThemeScope>
  )
}
function Binding({ alternate }: { alternate: boolean }) {
  const ref = useRef<HTMLButtonElement>(null)
  const spring = useSpringStyle(ref, 'scale', 1, 'press', 1)
  useEffect(() => {
    control = spring
    commits++
    if (ref.current) nativeRefs.push(ref.current)
  })
  return (
    <form onSubmit={event => event.preventDefault()}>
      <Button
        key={String(alternate)}
        ref={ref}
        render={props => <button {...props} />}
        type="submit"
        name="intent"
        value="save"
        style={{ transform: 'rotate(7deg)', '--rad-button-press-scale': '1' }}
        onKeyDown={event => {
          if (event.key === ' ') spring.to(0.9)
        }}
        onKeyUp={() => spring.to(1)}
      >
        Bound submit
      </Button>
    </form>
  )
}
const enabled = defineTheme({
  id: 'motion-enabled',
  name: 'Enabled',
  motion: { interactions: { press: { stiffness: 260, damping: 24 } } }
})
const off = defineTheme({ id: 'motion-off', name: 'Off', motion: { mode: 'off' } })

test('native render/ref/keyboard, live reduced/off, replacement and StrictMode cleanup', async () => {
  await act(async () => commands.emulatePreferences({ reducedMotion: 'no-preference' }))
  const { host, root } = await mount(
    <StrictMode>
      <BoundButton theme={enabled} />
    </StrictMode>
  )
  const button = host.querySelector('button')!
  expect(nativeRefs.at(-1)).toBe(button)
  expect(button.style.transform).toBe('rotate(7deg)')
  await act(async () => userEvent.click(button))
  await act(async () => userEvent.keyboard('[Space>]'))
  await until(() => control.get() < 0.99)
  await act(async () => userEvent.keyboard('[/Space]'))
  const previousCommits = commits
  control.to(0.9)
  await until(() => control.get() < 0.95)
  expect(commits).toBe(previousCommits)
  await act(async () => commands.emulatePreferences({ reducedMotion: 'reduce' }))
  await until(() => !control.isAnimating() && control.get() === 1)
  expect(button.style.scale).toBe('1')
  expect(button.style.transform).toBe('rotate(7deg)')
  await act(async () => commands.emulatePreferences({ reducedMotion: 'no-preference' }))
  await act(async () =>
    root.render(
      <StrictMode>
        <BoundButton theme={off} />
      </StrictMode>
    )
  )
  control.configure({ enabled: true })
  control.to(0.9)
  expect(control.get()).toBe(1)
  await act(async () =>
    root.render(
      <StrictMode>
        <BoundButton
          theme={enabled}
          alternate
        />
      </StrictMode>
    )
  )
  const replacement = host.querySelector('button')!
  expect(replacement).not.toBe(button)
  control.to(0.9)
  await until(() => control.get() < 0.99)
  expect(Number(replacement.style.scale)).toBeLessThan(1)
  expect(button.style.scale).toBe('')
  const old = control
  await act(async () => root.render(null))
  expect(old.isAnimating()).toBe(false)
  expect(replacement.style.scale).toBe('')
  old.to(0.5)
  await frame()
  expect(replacement.style.scale).toBe('')
})

test('server HTML hydrates without mismatch and without motion before preference resolution', async () => {
  const markup = renderToString(<BoundButton theme={enabled} />)
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  hosts.push(host)
  const button = host.querySelector('button')!
  expect(button.style.scale).toBe('')
  const errors: unknown[] = []
  await act(async () => {
    roots.push(
      hydrateRoot(host, <BoundButton theme={enabled} />, {
        onRecoverableError: error => errors.push(error)
      })
    )
  })
  expect(errors).toEqual([])
  expect(host.querySelector('button')).toBe(button)
  expect(button.style.transform).toBe('rotate(7deg)')
})
