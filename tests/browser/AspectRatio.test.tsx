import { createRef, StrictMode } from 'react'
import { expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import { AspectRatio, ThemeScope } from '../../src/index.js'
import { mount } from './familyHarness.js'
const picture = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><rect width="800" height="1200" fill="green"/></svg>')}`
test('CSS reserves identical media geometry before hydration and image loading, including narrow reflow', async () => {
  let before = 0
  const root = createRef<HTMLDivElement>(),
    image = createRef<HTMLImageElement>()
  const { host } = await mount(
    <StrictMode>
      <div style={{ width: 320 }}>
        <AspectRatio
          ref={root}
          ratio={16 / 9}
        >
          <img
            ref={image}
            alt="Green portrait"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </AspectRatio>
      </div>
    </StrictMode>,
    true,
    node => {
      before = node.querySelector('[data-slot="aspect-ratio"]')!.getBoundingClientRect().height
      expect(before).toBeCloseTo(180, 1)
    }
  )
  expect(root.current).toBe(host.querySelector('[data-slot="aspect-ratio"]'))
  expect(root.current!.getBoundingClientRect().height).toBe(before)
  image.current!.src = picture
  await image.current!.decode()
  expect(root.current!.getBoundingClientRect().height).toBe(before)
  expect(image.current!.getBoundingClientRect().height).toBe(before)
  expect(getComputedStyle(image.current!).objectFit).toBe('cover')
  host.firstElementChild!.setAttribute('style', 'width:160px')
  expect(root.current!.getBoundingClientRect().height).toBeCloseTo(90, 1)
  expect(root.current!.getBoundingClientRect().width).toBe(160)
  expect(root.current!.getAttribute('role')).toBeNull()
  expect(root.current!.hasAttribute('tabindex')).toBe(false)
})
test('intrinsic content cannot expand the box; native hosts and caller styles remain usable in themed and forced-color layouts', async () => {
  const ref = createRef<HTMLDivElement>()
  const { host, render } = await mount(
    <ThemeScope mode="dark">
      {/* Restore the browser default without overriding component utilities. */}
      <style>{`@layer base { div { box-sizing: content-box; } }`}</style>
      <AspectRatio
        ref={ref}
        ratio={4 / 3}
        data-slot="embed"
        style={{ width: 240, borderRadius: '9px', border: '3px solid', padding: '8px' }}
      >
        <iframe
          title="Embedded article"
          srcDoc="<!doctype html><html lang='en'><title>Article</title><p>Article</p></html>"
          style={{ width: '100%', height: '100%', border: 0 }}
        />
      </AspectRatio>
    </ThemeScope>
  )
  expect(ref.current!.getBoundingClientRect().height).toBe(180)
  expect(getComputedStyle(ref.current!).borderRadius).toBe('9px')
  expect(ref.current!.dataset.slot).toBe('aspect-ratio embed')
  expect(host.querySelector('iframe')!.title).toBe('Embedded article')
  await render(
    <AspectRatio
      ref={ref}
      ratio={2}
      style={{ width: 240 }}
    >
      <div style={{ width: 1000, height: 1000 }}>Large content</div>
    </AspectRatio>
  )
  expect(ref.current!.getBoundingClientRect().height).toBe(120)
  expect(ref.current!.getBoundingClientRect().width).toBe(240)
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(ref.current!.getBoundingClientRect().height).toBe(120)
  await render(
    <AspectRatio
      ref={ref}
      ratio={2}
      style={{ width: 240, aspectRatio: '3 / 2' }}
    />
  )
  expect(ref.current!.getBoundingClientRect().height).toBe(160)
  await render(null)
  expect(ref.current).toBeNull()
})
