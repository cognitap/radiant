import { expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import { RingProgress, ThemeScope, defineTheme } from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { mount } from './familyHarness.js'

test('hydrates native progress and meter semantics, with an accessible total for multiple arcs', async () => {
  const { host } = await mount(
    <>
      <RingProgress
        aria-label="Sync"
        label="Syncing"
      />
      <RingProgress
        aria-label="Transfer"
        max={0.3}
        segments={[{ value: 0.1 }, { value: 0.2, tone: 'warning' }]}
      />
      <RingProgress
        kind="meter"
        aria-label="Storage"
        min={10}
        max={30}
        segments={[{ value: 6 }, { value: 4 }]}
      />
    </>,
    true
  )
  const [sync, transfer] = host.querySelectorAll('progress')
  const meter = host.querySelector('meter')!
  expect(sync).toHaveAccessibleName('Sync')
  expect(sync).not.toHaveAttribute('value')
  expect(transfer.value).toBe(0.3)
  expect(meter).toHaveAccessibleName('Storage')
  expect(meter.min).toBe(10)
  expect(meter.max).toBe(30)
  expect(meter.value).toBe(20)
  expect(meter.parentElement?.querySelectorAll('[data-slot="ring-progress-segment"]')).toHaveLength(
    2
  )
  expect(host.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('updates the native reading immediately and animates the arc with the theme spring', async () => {
  const theme = defineTheme({
    id: 'ring-proof',
    name: 'Ring proof',
    motion: { interactions: { follow: { stiffness: 80, damping: 13 } } }
  })
  const tree = (value: number, motion?: 'off') => (
    <ThemeScope theme={theme}>
      <MotionProvider>
        <RingProgress
          aria-label="Sync"
          value={value}
          motion={motion}
        />
      </MotionProvider>
    </ThemeScope>
  )
  const { host, render } = await mount(tree(10))
  const progress = host.querySelector('progress')!
  const arc = host.querySelector<SVGCircleElement>('[data-slot="ring-progress-segment"]')!
  const painted = () => parseFloat(arc.style.strokeDasharray)
  expect(painted()).toBe(10)
  await render(tree(70))
  expect(progress.value).toBe(70)
  await expect.poll(() => painted() > 10 && painted() < 70).toBe(true)
  await commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'none' })
  await render(tree(35))
  await expect.poll(painted).toBe(35)
  await render(tree(50, 'off'))
  expect(arc.style.strokeDasharray).toBe('')
  expect(arc.getAttribute('stroke-dasharray')).toBe('50 100')
})
