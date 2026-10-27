import { act, StrictMode, useEffect, useRef } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands } from 'vitest/browser'
import { ThemeScope, defineTheme } from '../../src/index.js'
import {
  createSpring,
  bindSpringSource,
  bindSpringStyle,
  type SpringController,
  type SpringSource
} from '../../src/motion/index.js'
import { useSpringFollow, useReducedMotion } from '../../src/motion/react.js'
import type {} from './mediaCommands.js'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
let reduced = true
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
async function until(check: () => boolean) {
  for (let i = 0; i < 180; i++) {
    if (check()) return
    await frame()
  }
  throw new Error('Follower did not settle')
}
const roots: Root[] = []
const hosts: HTMLElement[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount())
  hosts.splice(0).forEach(host => host.remove())
  await act(async () => commands.emulatePreferences({ reducedMotion: 'no-preference' }))
})

test('a frame-driven moving destination retains position and signed momentum at every retarget', async () => {
  const source = createSpring(0, { enabled: false })
  const follower = createSpring(0, { parameters: { stiffness: 260, damping: 24 } })
  const off = bindSpringSource(follower, source)
  try {
    source.to(160)
    await until(() => follower.get() > 30 && follower.get() < 130)
    const before = follower.get()
    const velocity = follower.getVelocity()
    expect(velocity).toBeGreaterThan(1)
    source.to(-100)
    expect(follower.get()).toBe(before)
    expect(follower.getVelocity()).toBeCloseTo(velocity, 2)
    const samples: number[] = []
    for (let i = 0; i < 16; i++) {
      await frame()
      const position = follower.get()
      const speed = follower.getVelocity()
      source.to(-100 + i * 3)
      expect(follower.get()).toBe(position)
      expect(follower.getVelocity()).toBeCloseTo(speed, 2)
      samples.push(position)
    }
    expect(samples.some(value => value > before)).toBe(true)
    expect(samples.at(-1)!).toBeLessThan(before)
    off()
    follower.stop()
    const stopped = follower.get()
    source.to(500)
    await frame()
    expect(follower.get()).toBe(stopped)
    expect(follower.isAnimating()).toBe(false)
  } finally {
    off()
    follower.destroy()
    source.destroy()
  }
})

let control: SpringController
let commits = 0
function Follower({ target }: { target: number | SpringSource }) {
  const ref = useRef<HTMLDivElement>(null)
  const spring = useSpringFollow(target)
  const preference = useReducedMotion()
  useEffect(() => {
    reduced = preference
  }, [preference])
  useEffect(() => {
    control = spring
    commits++
    if (ref.current) return bindSpringStyle(ref.current, spring, 'translateX')
  }, [spring])
  return (
    <div
      ref={ref}
      style={{ transform: 'rotate(3deg)' }}
    >
      Useful content
    </div>
  )
}
const offTheme = defineTheme({ id: 'following-off', name: 'Off', motion: { mode: 'off' } })

test('source replacement, live preferences, off, SSR and StrictMode keep one owned follower', async () => {
  await act(async () => commands.emulatePreferences({ reducedMotion: 'no-preference' }))
  const a = createSpring(0, { enabled: false })
  const b = createSpring(80, { enabled: false })
  const host = document.createElement('div')
  hosts.push(host)
  host.innerHTML = renderToString(
    <StrictMode>
      <Follower target={a} />
    </StrictMode>
  )
  const node = host.firstElementChild as HTMLElement
  expect(node.style.translate).toBe('')
  document.body.append(host)
  const errors: unknown[] = []
  let root: Root
  await act(async () => {
    root = hydrateRoot(
      host,
      <StrictMode>
        <Follower target={a} />
      </StrictMode>,
      { onRecoverableError: error => errors.push(error) }
    )
    roots.push(root)
  })
  try {
    expect(errors).toEqual([])
    expect(host.firstElementChild).toBe(node)
    const original = control
    a.to(160)
    await until(() => control.get() > 10)
    const count = commits
    await frame()
    expect(commits).toBe(count)
    await act(async () =>
      root.render(
        <StrictMode>
          <Follower target={b} />
        </StrictMode>
      )
    )
    expect(control).toBe(original)
    a.to(999)
    await until(() => !control.isAnimating())
    expect(control.get()).toBe(80)
    await act(async () => commands.emulatePreferences({ reducedMotion: 'reduce' }))
    await until(() => reduced)
    b.to(40)
    expect(control.get()).toBe(40)
    expect(node.style.transform).toBe('rotate(3deg)')
    await act(async () =>
      root.render(
        <ThemeScope theme={offTheme}>
          <Follower target={30} />
        </ThemeScope>
      )
    )
    expect(control.get()).toBe(30)
    await act(async () =>
      root.render(
        <ThemeScope theme={offTheme}>
          <Follower target={90} />
        </ThemeScope>
      )
    )
    expect(control.get()).toBe(90)
    const old = control
    await act(async () => root.render(null))
    expect(old.isAnimating()).toBe(false)
    b.to(300)
    expect(node.style.translate).toBe('')
  } finally {
    a.destroy()
    b.destroy()
  }
})
