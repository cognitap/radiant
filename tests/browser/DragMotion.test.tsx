import { act, useEffect, useRef, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Button, ThemeScope, defineTheme } from '../../src/index.js'
import { createSpring, createSpringDrag, bindSpringDrag } from '../../src/motion/index.js'
import { useSpringDrag } from '../../src/motion/react.js'
import type {} from './touchCommands.js'
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
  throw new Error('Drag did not settle')
}
async function mount(children: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  hosts.push(host)
  const root = createRoot(host)
  roots.push(root)
  await act(async () => root.render(children))
  return { host, root }
}
afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount())
  hosts.splice(0).forEach(node => node.remove())
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
})
test('release seeds signed velocity into Motion physics and re-grab freezes current presentation', async () => {
  const spring = createSpring(60)
  spring.to(0, 500)
  try {
    const after: number[] = []
    for (let i = 0; i < 4; i++) {
      await frame()
      after.push(spring.get())
    }
    expect(after.some(value => value > 60.1)).toBe(true)
  } finally {
    spring.destroy()
  }
  const drag = createSpringDrag(0, { min: 0, max: 160, snapPoints: [0, 80, 160] })
  try {
    drag.begin()
    drag.move(20, 10)
    drag.move(60, 30)
    expect(drag.release(30)).toEqual({ target: 160, velocity: 2000 })
    await until(() => drag.get() > 65)
    const before = drag.get()
    drag.begin()
    expect(drag.get()).toBeCloseTo(before, 4)
    expect(drag.isAnimating()).toBe(false)
    drag.move(30, 100)
    drag.cancel()
    await until(() => Math.abs(drag.get() - 160) < 0.01)
  } finally {
    drag.destroy()
  }
})
test('real pointer/touch drag, cancel, keyboard, transform ownership and cleanup', async () => {
  const { host } = await mount(
    <button
      id="drag-native"
      style={{ transform: 'rotate(3deg)', width: 80, height: 40 }}
    >
      Move
    </button>
  )
  const node = host.querySelector('button')!
  let clicks = 0
  node.onclick = () => clicks++
  const drag = createSpringDrag(0, { min: 0, max: 160, snapPoints: [0, 80, 160] })
  const unbind = bindSpringDrag(node, drag)
  try {
    await commands.dragHandle('#drag-native', 100, false, false)
    await until(() => Math.abs(drag.get() - 160) < 0.01)
    expect(clicks).toBe(0)
    expect(node.style.transform).toBe('rotate(3deg)')
    expect(node.style.touchAction).toBe('pan-y')
    await userEvent.click(node)
    expect(clicks).toBe(1)
    await userEvent.keyboard('{Home}')
    await until(() => drag.get() < 0.01)
    await commands.dragHandle('#drag-native', 70, true, true)
    await until(() => drag.get() < 0.01)
    await commands.dragHandle('#drag-native', 90, false, true)
    await until(() => drag.get() > 159.99)
    await userEvent.click(node)
    await userEvent.keyboard('{ArrowLeft}')
    await until(() => Math.abs(drag.get() - 80) < 0.01)
  } finally {
    unbind()
    drag.destroy()
  }
  expect(node.style.translate).toBe('')
  expect(node.style.touchAction).toBe('')
  expect(node.style.transform).toBe('rotate(3deg)')
})
let hookControl: ReturnType<typeof useSpringDrag>
function Handle() {
  const ref = useRef<HTMLButtonElement>(null)
  const drag = useSpringDrag(ref, 0, { min: 0, max: 160, snapPoints: [0, 80, 160] })
  useEffect(() => {
    hookControl = drag
  })
  return (
    <>
      <Button
        id="hook-handle"
        ref={ref}
      >
        Drag or use arrows
      </Button>
      <Button onClick={() => drag.step('first')}>Start</Button>
      <Button onClick={() => drag.step('last')}>End</Button>
    </>
  )
}
test('theme and live reduced motion retain functional controls without animated replay', async () => {
  const { host, root } = await mount(
    <ThemeScope theme={defineTheme({ id: 'drag-proof', name: 'Drag' })}>
      <Handle />
    </ThemeScope>
  )
  hookControl.to(160)
  await until(() => hookControl.get() > 20)
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'reduce' })
    await frame()
  })
  await until(() => !hookControl.isAnimating())
  expect(hookControl.get()).toBe(160)
  await userEvent.click(
    Array.from(host.querySelectorAll('button')).find(node => node.textContent === 'Start')!
  )
  expect(hookControl.get()).toBe(0)
  await commands.dragHandle('#hook-handle', 50, false, true)
  expect([0, 80, 160]).toContain(hookControl.get())
  await act(async () => root.render(null))
  expect(host.querySelector('button')).toBeNull()
  expect(hookControl.isAnimating()).toBe(false)
})

test('horizontal touch handle preserves native vertical scrolling', async () => {
  const { host } = await mount(
    <div
      id="scroll-track"
      style={{ height: 180, overflowY: 'auto' }}
    >
      <div style={{ height: 700 }}>
        <button
          id="scroll-handle"
          style={{ marginTop: 90, width: 100, height: 40 }}
        >
          Drag sideways
        </button>
      </div>
    </div>
  )
  const node = host.querySelector('button')!
  const scroll = host.querySelector('#scroll-track')!
  const drag = createSpringDrag(0, { min: 0, max: 160 })
  const unbind = bindSpringDrag(node, drag)
  try {
    await commands.dragHandle('#scroll-handle', 0, false, true, -60)
    await until(() => scroll.scrollTop > 0)
    expect(drag.get()).toBe(0)
  } finally {
    unbind()
    drag.destroy()
  }
})
