import { act, createRef, StrictMode, useState } from 'react'
import { expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import {
  Pagination,
  PaginationList,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationButton,
  PaginationUnavailable,
  PaginationEllipsis,
  ThemeScope,
  defineTheme
} from '../../src/index.js'
import { mount, click, key } from './familyHarness.js'
test('native page links hydrate, retain router refs and follow keyboard URLs without synthetic navigation', async () => {
  const nav = createRef<HTMLElement>(),
    anchor = createRef<HTMLAnchorElement>()
  const original = location.href
  let clicks = 0
  try {
    const { host } = await mount(
      <StrictMode>
        <button>Before</button>
        <Pagination ref={nav}>
          <PaginationList>
            <PaginationItem>
              <PaginationUnavailable>Previous</PaginationUnavailable>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                ref={anchor}
                href="#pagination-two"
                current
                aria-label="Page 2"
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
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#pagination-three" />
            </PaginationItem>
          </PaginationList>
        </Pagination>
        <div id="pagination-two">Second page</div>
      </StrictMode>,
      true
    )
    expect(nav.current).toBe(host.querySelector('nav'))
    expect(anchor.current).toBe(host.querySelector('a'))
    expect(anchor.current!.dataset.slot).toBe('link pagination-link')
    expect(host.querySelectorAll('ol>li').length).toBe(4)
    await click(host.querySelector('button')!)
    await key('{Tab}')
    expect(document.activeElement).toBe(anchor.current)
    await key('{Tab}')
    expect(document.activeElement).toBe(host.querySelector('[rel="next"]'))
    await key('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(anchor.current)
    await key('{Enter}')
    expect(location.hash).toBe('#pagination-two')
    expect(clicks).toBe(1)
    expect(host.querySelectorAll('[aria-current="page"]').length).toBe(1)
  } finally {
    history.replaceState(null, '', original)
  }
})
test('action mode preserves native disabled and pending guards while the application owns page state', async () => {
  let calls = 0
  const ref = createRef<HTMLButtonElement>()
  function App() {
    const [page, setPage] = useState(1)
    return (
      <>
        <output>{page}</output>
        <Pagination>
          <PaginationList>
            <PaginationItem>
              <PaginationButton disabled>Previous</PaginationButton>
            </PaginationItem>
            {[1, 2].map(n => (
              <PaginationItem key={n}>
                <PaginationButton
                  ref={n === 2 ? ref : undefined}
                  current={n === page}
                  aria-label={`Page ${n}`}
                  onClick={() => {
                    calls++
                    setPage(n)
                  }}
                >
                  {n}
                </PaginationButton>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationButton
                pending
                onClick={() => calls++}
              >
                Next
              </PaginationButton>
            </PaginationItem>
          </PaginationList>
        </Pagination>
      </>
    )
  }
  const { host } = await mount(
    <StrictMode>
      <App />
    </StrictMode>,
    true
  )
  const buttons = host.querySelectorAll('button')
  await act(async () => {
    buttons[0]!.click()
    buttons[3]!.click()
  })
  expect(calls).toBe(0)
  await click(ref.current!)
  expect(calls).toBe(1)
  expect(host.querySelector('output')!.textContent).toBe('2')
  expect(host.querySelector('[aria-current="page"]')).toBe(ref.current)
  expect(document.activeElement).toBe(ref.current)
  await key('{Enter}')
  expect(calls).toBe(2)
})
test('themes, caller overrides and forced colors keep current links visible in a wrapping list', async () => {
  const theme = defineTheme({
    id: 'pagination-proof',
    name: 'Pagination proof',
    components: { pagination: { gap: '9px', radius: '11px', itemMinWidth: '43px' } }
  })
  const { host } = await mount(
    <ThemeScope
      theme={theme}
      mode="dark"
    >
      <Pagination style={{ width: '140px' }}>
        <PaginationList>
          {[1, 2, 3, 4].map(n => (
            <PaginationItem key={n}>
              <PaginationLink
                href={`#${n}`}
                current={n === 2}
                aria-label={`Page ${n}`}
              >
                {n}
              </PaginationLink>
            </PaginationItem>
          ))}
        </PaginationList>
      </Pagination>
    </ThemeScope>
  )
  expect(getComputedStyle(host.querySelector('ol')!).gap).toBe('9px')
  expect(getComputedStyle(host.querySelector('a')!).borderRadius).toBe('11px')
  expect(getComputedStyle(host.querySelector('a')!).minWidth).toBe('43px')
  expect(host.querySelector('nav')!.scrollWidth).toBeLessThanOrEqual(140)
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(getComputedStyle(host.querySelector('a')!).animationName).toBe('none')
  expect(host.querySelector('[aria-current="page"]')).not.toBeNull()
})
