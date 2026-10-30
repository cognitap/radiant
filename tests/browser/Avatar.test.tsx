import { createRef, StrictMode } from 'react'
import { expect, test, vi } from 'vitest'
import { commands } from 'vitest/browser'
import { Avatar, ThemeScope, defineTheme } from '../../src/index.js'
import { mount, click, pause } from './familyHarness.js'
const image =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#346353"/></svg>'
  )
const broken = 'data:image/png;base64,broken'
test('cached success and failure before hydration reconcile without duplicating the graphic name', async () => {
  for (const [src, state] of [
    [image, 'loaded'],
    [broken, 'error']
  ] as const) {
    const ref = createRef<HTMLSpanElement>()
    const { host } = await mount(
      <StrictMode>
        <Avatar
          alt="Jordan Rivera"
          src={src}
          fallback="JR"
          ref={ref}
        />
      </StrictMode>,
      true,
      async host => {
        const img = host.querySelector('img')!
        await vi.waitFor(() => expect(img.complete).toBe(true))
        expect(img.dataset.state).toBe('loading')
        expect(img.naturalWidth > 0).toBe(state === 'loaded')
      }
    )
    const root = host.querySelector('[data-slot~="avatar"]')!
    expect(ref.current).toBe(root)
    expect(root.getAttribute('role')).toBe('img')
    expect(root.getAttribute('aria-label')).toBe('Jordan Rivera')
    expect(host.querySelectorAll('[role="img"]').length).toBe(1)
    expect(host.querySelector('img')!.dataset.state).toBe(state)
    expect(host.querySelector('img')!.getAttribute('aria-hidden')).toBe('true')
    expect(host.querySelector('img')!.alt).toBe('')
    expect(Boolean(host.querySelector('[data-slot="avatar-fallback"]'))).toBe(state === 'error')
  }
})
test('source changes reset only image content, retain fixed bounds and root focus/ref identity, and clean up', async () => {
  const ref = createRef<HTMLSpanElement>()
  const tree = (src?: string, alt = 'Jordan Rivera') => (
    <>
      <button>Continue editing</button>
      <Avatar
        ref={ref}
        alt={alt}
        src={src}
        fallback="JR"
        parts={{ image: { style: { objectFit: 'contain' } } }}
      />
    </>
  )
  const { host, render } = await mount(tree(image))
  await pause(100)
  const root = ref.current!
  const box = root.getBoundingClientRect()
  expect(host.querySelector('img')!.dataset.state).toBe('loaded')
  expect(getComputedStyle(host.querySelector('img')!).objectFit).toBe('contain')
  const button = host.querySelector('button')!
  await click(button)
  await render(tree(broken))
  await pause(100)
  expect(ref.current).toBe(root)
  expect(host.querySelector('img')!.dataset.state).toBe('error')
  expect(host.querySelector('[data-slot="avatar-fallback"]')!.textContent).toBe('JR')
  await render(tree())
  expect(ref.current).toBe(root)
  expect(host.querySelector('img')).toBe(null)
  expect(host.querySelector('[data-slot="avatar-fallback"]')!.getAttribute('data-state')).toBe(
    'fallback'
  )
  await render(tree(image, ''))
  await pause(100)
  expect(root.getAttribute('aria-hidden')).toBe('true')
  expect(root.hasAttribute('role')).toBe(false)
  expect(root.hasAttribute('aria-label')).toBe(false)
  expect(document.activeElement).toBe(button)
  expect(root.getBoundingClientRect().width).toBe(box.width)
  expect(root.getBoundingClientRect().height).toBe(box.height)
  expect(root.hasAttribute('aria-live')).toBe(false)
  await render(<></>)
  expect(ref.current).toBe(null)
})
test('theme metrics, caller styles and fallback parts survive dark, reduced-motion and forced-colors layouts', async () => {
  const theme = defineTheme({
    id: 'avatar-proof',
    name: 'Avatar proof',
    components: { avatar: { size: '44px', radius: '3px', borderWidth: '2px', fontSize: '17px' } }
  })
  const { host, render } = await mount(
    <ThemeScope
      theme={theme}
      mode="dark"
      style={{ width: '160px' }}
    >
      <Avatar
        alt="Jordan Rivera"
        fallback="JR"
        parts={{ fallback: { style: { opacity: 0.6 } } }}
      />
    </ThemeScope>
  )
  const root = host.querySelector('[data-slot~="avatar"]')!
  expect(getComputedStyle(root).width).toBe('44px')
  expect(getComputedStyle(root).height).toBe('44px')
  expect(getComputedStyle(root).borderRadius).toBe('3px')
  expect(getComputedStyle(root).borderTopWidth).toBe('2px')
  expect(getComputedStyle(host.querySelector('[data-slot="avatar-fallback"]')!).opacity).toBe('0.6')
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(getComputedStyle(root).animationName).toBe('none')
  expect(getComputedStyle(root).borderTopColor).not.toBe('rgba(0, 0, 0, 0)')
  await render(
    <Avatar
      alt="Jordan"
      fallback="JR"
      className="rounded-none size-12"
      style={{ width: '51px' }}
    />
  )
  expect(getComputedStyle(host.querySelector('[data-slot~="avatar"]')!).width).toBe('51px')
  expect(getComputedStyle(host.querySelector('[data-slot~="avatar"]')!).borderRadius).toBe('0px')
})
