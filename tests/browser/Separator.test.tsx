import { createRef, StrictMode } from 'react'
import { expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import { Separator, ThemeScope, defineTheme } from '../../src/index.js'
import { mount, click, key } from './familyHarness.js'
test('native hr hydrates, stays outside keyboard navigation and switches orientation and decoration', async () => {
  const ref = createRef<HTMLHRElement>()
  const { host, render } = await mount(
    <StrictMode>
      <button>Before</button>
      <Separator ref={ref} />
      <button>After</button>
    </StrictMode>,
    true
  )
  const hr = host.querySelector('hr')!
  expect(ref.current).toBe(hr)
  expect(hr.getAttribute('aria-orientation')).toBe('horizontal')
  await click(host.querySelector('button')!)
  await key('{Tab}')
  expect(document.activeElement).toBe(host.querySelectorAll('button')[1])
  await render(
    <div style={{ display: 'flex', height: '60px', width: '160px' }}>
      <Separator
        ref={ref}
        orientation="vertical"
        decorative
      />
    </div>
  )
  const vertical = host.querySelector('hr')!
  expect(vertical.getAttribute('aria-hidden')).toBe('true')
  expect(vertical.hasAttribute('aria-orientation')).toBe(false)
  expect(vertical.getBoundingClientRect().height).toBe(60)
  await render(<></>)
  expect(ref.current).toBe(null)
})
test('theme and caller appearance survives narrow layouts, forced colors and reduced motion', async () => {
  const theme = defineTheme({
    id: 'separator-proof',
    name: 'Separator proof',
    components: { separator: { thickness: '3px', style: 'dashed', spacing: '5px' } }
  })
  const { host, render } = await mount(
    <ThemeScope
      theme={theme}
      mode="dark"
      style={{ width: '160px' }}
    >
      <Separator />
    </ThemeScope>
  )
  const hr = host.querySelector('hr')!
  expect(getComputedStyle(hr).borderTopWidth).toBe('3px')
  expect(getComputedStyle(hr).borderTopStyle).toBe('dashed')
  expect(getComputedStyle(hr).marginTop).toBe('5px')
  expect(hr.getBoundingClientRect().width).toBeLessThanOrEqual(160)
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(getComputedStyle(hr).borderTopColor).not.toBe('rgba(0, 0, 0, 0)')
  expect(getComputedStyle(hr).animationName).toBe('none')
  await render(
    <Separator
      className="border-t-4"
      style={{ borderTopWidth: '7px' }}
    />
  )
  expect(getComputedStyle(host.querySelector('hr')!).borderTopWidth).toBe('7px')
})
