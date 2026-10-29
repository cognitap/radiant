import { createRef, StrictMode } from 'react'
import { expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import { Skeleton, ThemeScope, defineTheme } from '../../src/index.js'
import { mount, click } from './familyHarness.js'

test('decorative empty shapes hydrate with native refs, preserve identities and clean up on removal', async () => {
  const ref = createRef<HTMLSpanElement>()
  const { host, render } = await mount(
    <StrictMode>
      <Skeleton
        ref={ref}
        data-slot="account-shape"
      />
    </StrictMode>,
    true
  )
  const shape = host.querySelector('span')!
  expect(ref.current).toBe(shape)
  expect(shape.getAttribute('aria-hidden')).toBe('true')
  expect(shape.dataset.slot).toBe('skeleton account-shape')
  expect(shape.textContent).toBe('')
  expect(shape.tabIndex).toBe(-1)
  expect(host.querySelector('[aria-live], [role], [aria-busy]')).toBe(null)
  await render(<></>)
  expect(ref.current).toBe(null)
  expect(host.children.length).toBe(0)
})

test('reduced motion, local off and theme off keep static visible shapes; forced colors retain their outline', async () => {
  const { host, render } = await mount(<Skeleton />)
  const shape = () => host.querySelector('span')!
  expect(getComputedStyle(shape()).animationName).toBe('pulse')
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  expect(getComputedStyle(shape()).animationName).toBe('none')
  expect(getComputedStyle(shape()).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  expect(shape().getBoundingClientRect().height).toBeGreaterThan(0)
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
  await render(<Skeleton motion="off" />)
  expect(getComputedStyle(shape()).animationName).toBe('none')
  const theme = defineTheme({
    id: 'skeleton-still',
    name: 'Skeleton still',
    motion: { mode: 'off' }
  })
  await render(
    <ThemeScope theme={theme}>
      <Skeleton />
    </ThemeScope>
  )
  expect(getComputedStyle(shape()).animationName).toBe('none')
  await render(<Skeleton />)
  await commands.emulatePreferences({ forcedColors: 'active' })
  expect(getComputedStyle(shape()).animationName).toBe('none')
  expect(getComputedStyle(shape()).borderTopStyle).toBe('solid')
  expect(getComputedStyle(shape()).borderTopColor).not.toBe('rgba(0, 0, 0, 0)')
})

test('theme dimensions and caller styles stay bounded in a narrow layout without moving focus or announcing', async () => {
  const theme = defineTheme({
    id: 'skeleton-proof',
    name: 'Skeleton proof',
    components: { skeleton: { width: '400px', height: '21px', radius: '3px', duration: '3s' } }
  })
  const tree = (loaded: boolean) => (
    <>
      <button>Continue editing</button>
      <ThemeScope
        theme={theme}
        mode="dark"
        style={{ width: '160px' }}
      >
        <section
          aria-label="Account"
          aria-busy={!loaded}
        >
          {loaded ? <p>Jordan Rivera</p> : <Skeleton />}
        </section>
      </ThemeScope>
      <output aria-label="Result">{loaded ? 'Account loaded.' : ''}</output>
    </>
  )
  const { host, render } = await mount(tree(false))
  const shape = host.querySelector('span')!
  expect(shape.getBoundingClientRect().width).toBeLessThanOrEqual(160)
  expect(getComputedStyle(shape).height).toBe('21px')
  expect(getComputedStyle(shape).borderRadius).toBe('3px')
  expect(getComputedStyle(shape).animationDuration).toBe('3s')
  const button = host.querySelector('button')!
  await click(button)
  await render(tree(true))
  expect(document.activeElement).toBe(button)
  expect(host.querySelector('[data-slot~="skeleton"]')).toBe(null)
  expect(host.querySelector('section')!.getAttribute('aria-busy')).toBe('false')
  expect(host.querySelector('output')!.textContent).toBe('Account loaded.')
  await render(
    <Skeleton
      className="h-8 rounded-none"
      style={{ height: '27px', width: '70px' }}
    />
  )
  const custom = host.querySelector('span')!
  expect(getComputedStyle(custom).height).toBe('27px')
  expect(getComputedStyle(custom).width).toBe('70px')
  expect(getComputedStyle(custom).borderRadius).toBe('0px')
})
