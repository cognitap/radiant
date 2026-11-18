import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { commands } from 'vitest/browser'
import { Spoiler, ThemeScope, defineTheme } from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { click, key, mount } from './familyHarness.js'

test('clips one subtree, keeps clipped controls out of Tab, and expands from the keyboard', async () => {
  const { host } = await mount(
    <>
      <Spoiler
        maxHeight={80}
        motion="off"
      >
        <div style={{ height: 240 }}>
          <a href="#details">Full notes</a>
        </div>
      </Spoiler>
      <button>After</button>
    </>,
    true
  )
  const details = host.querySelector('details')!
  const trigger = details.querySelector('summary')!
  const content = details.querySelector<HTMLElement>('[data-slot~="spoiler-content"]')!
  const link = details.querySelector('a')!
  expect(details.open).toBe(false)
  expect(getComputedStyle(details, '::details-content').height).toBe('80px')
  expect(trigger.getBoundingClientRect().top).toBeGreaterThan(content.getBoundingClientRect().top)
  expect(link.parentElement?.parentElement).toHaveAttribute('inert')
  await key('{Tab}')
  expect(trigger).toHaveFocus()
  await key('{Tab}')
  expect(host.querySelector('button')).toHaveFocus()
  await key('{Shift>}{Tab}{/Shift}')
  await key('{Enter}')
  expect(details.open).toBe(true)
  expect(trigger).toHaveTextContent('Show less')
  await key('{Tab}')
  expect(link).toHaveFocus()
  expect(details.querySelectorAll('a')).toHaveLength(1)
})

test('shows the trigger only when useful and retains the controlled expanded state', async () => {
  const change = vi.fn()
  const tree = (height: number, open: boolean) => (
    <Spoiler
      maxHeight={100}
      open={open}
      onOpenChange={change}
      parts={{ content: { className: 'p-0' } }}
    >
      <div style={{ height }}>Work notes</div>
    </Spoiler>
  )
  const { host, render } = await mount(tree(40, false))
  const details = host.querySelector('details')!
  const summary = details.querySelector('summary')!
  expect(summary).not.toBeVisible()
  expect(details.open).toBe(true)
  await render(tree(200, false))
  await act(async () => {
    await new Promise(requestAnimationFrame)
  })
  await expect.poll(() => details.open).toBe(false)
  expect(summary).toBeVisible()
  await click(summary)
  expect(change).toHaveBeenCalledExactlyOnceWith(true)
  expect(details.open).toBe(false)
  await render(tree(200, true))
  expect(details.open).toBe(true)
})

test('disclosure springs target the preview height when closing and honor reduced motion', async () => {
  const theme = defineTheme({
    id: 'spoiler-proof',
    name: 'Spoiler proof',
    motion: { spring: { stiffness: 175, damping: 16 } }
  })
  const { host } = await mount(
    <ThemeScope theme={theme}>
      <MotionProvider>
        <Spoiler
          maxHeight={65}
          parts={{ content: { className: 'p-0' } }}
        >
          <div style={{ height: 240 }}>Extended work notes</div>
        </Spoiler>
      </MotionProvider>
    </ThemeScope>
  )
  const details = host.querySelector('details')!
  const summary = details.querySelector('summary')!
  const height = () => parseFloat(details.style.getPropertyValue('--_rad-spring-details-height'))
  expect(height()).toBe(65)
  await click(summary)
  await expect.poll(height).toBeGreaterThan(90)
  await click(summary)
  await expect.poll(height, { timeout: 4000 }).toBeCloseTo(65, 1)
  await commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'none' })
  await click(summary)
  await expect.poll(height).toBe(240)
})
