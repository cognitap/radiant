import { createRef, StrictMode } from 'react'
import { expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  ThemeScope,
  defineTheme
} from '../../src/index.js'
import { mount, click, key } from './familyHarness.js'
test('ordered navigation hydrates with native refs, keyboard links and a non-focusable current page', async () => {
  const navRef = createRef<HTMLElement>(),
    linkRef = createRef<HTMLAnchorElement>()
  let clicks = 0
  const original = location.href
  try {
    const { host } = await mount(
      <StrictMode>
        <button>Before</button>
        <Breadcrumb ref={navRef}>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                ref={linkRef}
                href="#breadcrumb-home"
                onClick={() => clicks++}
                render={props => (
                  <a
                    {...props}
                    data-adapter="yes"
                  >
                    {props.children}
                  </a>
                )}
              >
                Home
              </BreadcrumbLink>
              <BreadcrumbSeparator />
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div id="breadcrumb-home">Destination</div>
      </StrictMode>,
      true
    )
    expect(navRef.current).toBe(host.querySelector('nav'))
    expect(linkRef.current).toBe(host.querySelector('a'))
    expect(host.querySelectorAll('ol > li').length).toBe(2)
    expect(host.querySelector('[aria-current="page"]')?.tagName).toBe('SPAN')
    expect(
      host.querySelector('[data-slot~="breadcrumb-separator"]')!.getAttribute('aria-hidden')
    ).toBe('true')
    await click(host.querySelector('button')!)
    await key('{Tab}')
    expect(document.activeElement).toBe(linkRef.current)
    await key('{Enter}')
    expect(clicks).toBe(1)
    expect(location.hash).toBe('#breadcrumb-home')
    expect(linkRef.current!.dataset.slot).toBe('link breadcrumb-link')
  } finally {
    history.replaceState(null, '', original)
  }
})
test('long content, named themes and caller styles preserve native navigation in forced colors', async () => {
  const theme = defineTheme({
    id: 'breadcrumb-proof',
    name: 'Breadcrumb proof',
    components: { breadcrumb: { gap: '9px', fontSize: '17px' } }
  })
  const { host, render } = await mount(
    <ThemeScope
      theme={theme}
      mode="dark"
    >
      <Breadcrumb
        aria-label="Project location"
        style={{ width: '160px' }}
      >
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#long">UnbrokenProjectCategoryThatMustWrap</BreadcrumbLink>
            <BreadcrumbSeparator />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="#current"
              current
            >
              Current project location
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </ThemeScope>
  )
  const nav = host.querySelector('nav')!
  expect(getComputedStyle(nav).fontSize).toBe('17px')
  expect(getComputedStyle(host.querySelector('ol')!).gap).toBe('9px')
  expect(nav.scrollWidth).toBeLessThanOrEqual(160)
  expect(host.querySelectorAll('[aria-current="page"]').length).toBe(1)
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(getComputedStyle(host.querySelector('a')!).animationName).toBe('none')
  await render(
    <Breadcrumb
      className="text-lg"
      style={{ fontSize: '21px' }}
    >
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>Current</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
  expect(getComputedStyle(host.querySelector('nav')!).fontSize).toBe('21px')
})
test('the navigation landmark keeps a name: a default, a caller label, or a caller labelledby', async () => {
  const { host } = await mount(
    <>
      <span id="breadcrumb-location">Project location</span>
      <Breadcrumb data-case="default" />
      <Breadcrumb
        data-case="label"
        aria-label="Docs trail"
      />
      <Breadcrumb
        data-case="labelledby"
        aria-labelledby=" breadcrumb-location "
      />
      <Breadcrumb
        data-case="blank-label-with-labelledby"
        aria-label=" "
        aria-labelledby="breadcrumb-location"
      />
    </>
  )
  const nav = (name: string) => host.querySelector(`nav[data-case="${name}"]`)!
  expect(nav('default').getAttribute('aria-label')).toBe('Breadcrumb')
  expect(nav('label').getAttribute('aria-label')).toBe('Docs trail')
  expect(nav('labelledby').hasAttribute('aria-label')).toBe(false)
  expect(nav('labelledby').getAttribute('aria-labelledby')).toBe('breadcrumb-location')
  expect(nav('blank-label-with-labelledby').getAttribute('aria-labelledby')).toBe(
    'breadcrumb-location'
  )
})
