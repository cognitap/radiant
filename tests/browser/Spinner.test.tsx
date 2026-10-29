import { createRef, StrictMode } from 'react'
import { expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import { Button, Spinner, ThemeScope, defineTheme } from '../../src/index.js'
import { mount, click } from './familyHarness.js'

test('hydration retains the SVG ref, owned identities and decorative versus named semantics', async () => {
  const ref = createRef<SVGSVGElement>()
  const tree = (label?: string) => (
    <StrictMode>
      <Spinner
        ref={ref}
        label={label}
        data-slot="custom-spinner"
      />
    </StrictMode>
  )
  const { host, render } = await mount(tree(), true)
  const svg = host.querySelector('svg')!
  expect(ref.current).toBe(svg)
  expect(svg.getAttribute('aria-hidden')).toBe('true')
  expect(svg.getAttribute('role')).toBe(null)
  expect(svg.dataset.slot).toBe('spinner custom-spinner')
  await render(tree('Loading account'))
  expect(svg.getAttribute('role')).toBe('img')
  expect(svg.getAttribute('aria-label')).toBe('Loading account')
  expect(svg.hasAttribute('aria-hidden')).toBe(false)
  expect(host.querySelector('[aria-live], [role="status"], [role="alert"]')).toBe(null)
  await render(<></>)
  expect(ref.current).toBe(null)
})

test('system reduced motion, local off and theme off retain a visible static indicator', async () => {
  const { host, render } = await mount(<Spinner label="Loading" />)
  const spinner = () => host.querySelector('svg')!
  expect(getComputedStyle(spinner()).animationName).toBe('spin')
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  expect(getComputedStyle(spinner()).animationName).toBe('none')
  expect(spinner().getBoundingClientRect().width).toBeGreaterThan(0)
  expect(getComputedStyle(host.querySelector('path')!).stroke).not.toBe('none')
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
  await render(
    <Spinner
      label="Loading"
      motion="off"
    />
  )
  expect(getComputedStyle(spinner()).animationName).toBe('none')
  const theme = defineTheme({ id: 'still', name: 'Still', motion: { mode: 'off' } })
  await render(
    <ThemeScope theme={theme}>
      <Spinner label="Loading" />
    </ThemeScope>
  )
  expect(getComputedStyle(spinner()).animationName).toBe('none')
})

test('theme dimensions, named parts and caller overrides reach the SVG in forced colors', async () => {
  const theme = defineTheme({
    id: 'spinner-proof',
    name: 'Spinner proof',
    components: { spinner: { size: '31px', strokeWidth: '3', duration: '2s', trackOpacity: 0.4 } }
  })
  const { host, render } = await mount(
    <ThemeScope
      theme={theme}
      mode="dark"
    >
      <Spinner
        label="Loading"
        parts={{ track: { style: { opacity: 0.6 } } }}
      />
    </ThemeScope>
  )
  const svg = host.querySelector('svg')!
  expect(getComputedStyle(svg).width).toBe('31px')
  expect(getComputedStyle(svg).strokeWidth).toBe('3px')
  expect(getComputedStyle(svg).animationDuration).toBe('2s')
  expect(getComputedStyle(host.querySelector('circle')!).opacity).toBe('0.6')
  await commands.emulatePreferences({ forcedColors: 'active' })
  expect(getComputedStyle(host.querySelector('path')!).stroke).not.toBe('none')
  await render(
    <Spinner
      className="size-8"
      style={{ width: '39px' }}
    />
  )
  expect(getComputedStyle(host.querySelector('svg')!).width).toBe('39px')
})

test('Button pending keeps its name, focus and activation guard while reusing decorative Spinner', async () => {
  let clicks = 0
  const { host, render } = await mount(
    <Button
      pending
      motion="off"
      onClick={() => clicks++}
    >
      Save settings
    </Button>
  )
  const button = host.querySelector('button')!
  await click(button)
  expect(clicks).toBe(0)
  expect(document.activeElement).toBe(button)
  expect(button.textContent).toBe('Save settings')
  expect(button.getAttribute('aria-busy')).toBe('true')
  const spinner = button.querySelector('svg')!
  expect(spinner.getAttribute('aria-hidden')).toBe('true')
  expect(getComputedStyle(spinner).animationName).toBe('none')
  await render(<Button onClick={() => clicks++}>Save settings</Button>)
  expect(button.querySelector('svg')).toBe(null)
  await click(button)
  expect(clicks).toBe(1)
})
