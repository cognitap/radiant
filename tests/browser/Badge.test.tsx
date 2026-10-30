import { createRef, StrictMode } from 'react'
import { expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import { Badge, ThemeScope, defineTheme } from '../../src/index.js'
import { mount, click, key } from './familyHarness.js'
test('Badge hydrates with a span ref and preserves focus while text, tone and decoration change', async () => {
  const ref = createRef<HTMLSpanElement>()
  const tree = (decorative: boolean) => (
    <StrictMode>
      <button>Before</button>
      <Badge
        ref={ref}
        decorative={decorative}
        tone={decorative ? 'accent' : 'warning'}
      >
        {decorative ? 'Approved' : 'Needs attention'}
      </Badge>
      <button>After</button>
    </StrictMode>
  )
  const { host, render } = await mount(tree(false), true)
  const badge = host.querySelector('span')!
  expect(ref.current).toBe(badge)
  expect(badge.textContent).toBe('Needs attention')
  expect(badge.hasAttribute('role')).toBe(false)
  expect(badge.tabIndex).toBe(-1)
  await click(host.querySelector('button')!)
  await key('{Tab}')
  const after = host.querySelectorAll('button')[1]
  expect(document.activeElement).toBe(after)
  await render(tree(true))
  expect(document.activeElement).toBe(after)
  expect(badge.getAttribute('aria-hidden')).toBe('true')
  expect(badge.textContent).toBe('Approved')
  expect(badge.hasAttribute('aria-live')).toBe(false)
  await render(<></>)
  expect(ref.current).toBe(null)
})
test('theme metrics, long text and caller appearance remain bounded in forced colors and reduced motion', async () => {
  const theme = defineTheme({
    id: 'badge-proof',
    name: 'Badge proof',
    components: {
      badge: {
        radius: '3px',
        borderWidth: '2px',
        fontSize: '17px',
        paddingInline: '8px',
        paddingBlock: '4px'
      }
    }
  })
  const { host, render } = await mount(
    <ThemeScope
      theme={theme}
      mode="dark"
      style={{ width: '120px' }}
    >
      <Badge>UnbrokenCategoryIdentifierThatMustWrap</Badge>
    </ThemeScope>
  )
  const badge = host.querySelector('span')!
  expect(getComputedStyle(badge).borderRadius).toBe('3px')
  expect(getComputedStyle(badge).fontSize).toBe('17px')
  expect(badge.getBoundingClientRect().width).toBeLessThanOrEqual(120)
  expect(badge.scrollWidth).toBeLessThanOrEqual(120)
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(getComputedStyle(badge).borderTopStyle).not.toBe('none')
  expect(getComputedStyle(badge).animationName).toBe('none')
  await render(
    <Badge
      className="rounded-none text-lg"
      style={{ fontSize: '21px' }}
    >
      Ready
    </Badge>
  )
  expect(getComputedStyle(host.querySelector('span')!).fontSize).toBe('21px')
  expect(getComputedStyle(host.querySelector('span')!).borderRadius).toBe('0px')
})
