import { createRef, StrictMode } from 'react'
import { expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import { Progress, ThemeScope, defineTheme } from '../../src/index.js'
import { mount, click } from './familyHarness.js'
test('native labels and range values survive hydration, including zero and indeterminate transitions', async () => {
  const ref = createRef<HTMLProgressElement>()
  const tree = (value: number | null) => (
    <StrictMode>
      <label htmlFor="export-progress">Export progress</label>
      <Progress
        id="export-progress"
        ref={ref}
        value={value}
        max={5}
      />
    </StrictMode>
  )
  const { host, render } = await mount(tree(0), true)
  const progress = host.querySelector('progress')!
  expect(ref.current).toBe(progress)
  expect(progress.labels?.[0].textContent).toBe('Export progress')
  expect(progress.max).toBe(5)
  expect(progress.position).toBe(0)
  await render(tree(2))
  expect(progress.value).toBe(2)
  expect(progress.position).toBe(0.4)
  await render(tree(null))
  expect(progress.hasAttribute('value')).toBe(false)
  expect(progress.position).toBe(-1)
  expect(progress.matches(':indeterminate')).toBe(true)
  await render(tree(5))
  expect(progress.dataset.state).toBe('complete')
  expect(progress.position).toBe(1)
})
test('updates are immediate and read-only without stealing focus or creating live announcements', async () => {
  const tree = (value: number) => (
    <>
      <button>Continue editing</button>
      <Progress
        aria-label="Export"
        value={value}
        aria-valuetext={`${value} files exported`}
      />
    </>
  )
  const { host, render } = await mount(tree(1))
  const button = host.querySelector('button')!
  await click(button)
  await render(tree(90))
  const progress = host.querySelector('progress')!
  expect(progress.value).toBe(90)
  expect(progress.getAttribute('aria-valuetext')).toBe('90 files exported')
  expect(document.activeElement).toBe(button)
  expect(progress.hasAttribute('aria-live')).toBe(false)
})
test('theme overrides and caller styles retain the native host in dark, forced-colors and reduced motion', async () => {
  const theme = defineTheme({
    id: 'progress-proof',
    name: 'Progress proof',
    components: { progress: { height: '15px', radius: '3px', borderWidth: '2px' } }
  })
  const { host, render } = await mount(
    <ThemeScope
      theme={theme}
      mode="dark"
    >
      <Progress
        aria-label="Export"
        value={25}
      />
    </ThemeScope>
  )
  const progress = host.querySelector('progress')!
  expect(getComputedStyle(progress).height).toBe('15px')
  expect(getComputedStyle(progress).borderRadius).toBe('3px')
  expect(getComputedStyle(progress).borderTopWidth).toBe('2px')
  await commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
  expect(getComputedStyle(progress).animationName).toBe('none')
  expect(getComputedStyle(progress).borderTopStyle).not.toBe('none')
  await render(
    <Progress
      aria-label="Export"
      value={25}
      className="h-8"
      style={{ height: '21px' }}
    />
  )
  expect(getComputedStyle(host.querySelector('progress')!).height).toBe('21px')
})
test('narrow layouts stay bounded and unknown progress has a static non-color cue', async () => {
  const { host } = await mount(
    <div style={{ width: '160px' }}>
      <Progress aria-label="Unknown amount" />
    </div>
  )
  const progress = host.querySelector('progress')!
  expect(progress.getBoundingClientRect().width).toBeLessThanOrEqual(160)
  expect(getComputedStyle(progress).borderTopStyle).toBe('dashed')
  expect(getComputedStyle(progress).animationName).toBe('none')
})
test('fallback content matches Meter and prefers the value text', async () => {
  const tree = (valueText?: string, value: number | null = 2) => (
    <Progress
      aria-label="Upload"
      value={value}
      max={5}
      aria-valuetext={valueText}
    />
  )
  const { host, render } = await mount(tree())
  const progress = () => host.querySelector('progress')!
  expect(progress().textContent).toBe('2 of 5')
  await render(tree('Two files uploaded'))
  expect(progress().textContent).toBe('Two files uploaded')
  await render(tree('Preparing upload', null))
  expect(progress().textContent).toBe('Preparing upload')
  await render(tree(undefined, null))
  expect(progress().textContent).toBe('')
})
