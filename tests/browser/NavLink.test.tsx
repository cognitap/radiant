import { act, createRef, StrictMode } from 'react'
import { expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  NavLink,
  NavLinkGroup,
  NavLinkGroupTrigger,
  NavLinkGroupContent,
  ThemeScope,
  defineTheme,
  type NavLinkRenderProps
} from '../../src/index.js'
import { NavLinkExample } from '../../.storybook/examples/NavLinkExamples.js'
import { mount, click, key, pause } from './familyHarness.js'

function NavRouterAnchor({
  navigate,
  onClick,
  href,
  target,
  download,
  children,
  ...props
}: NavLinkRenderProps & { navigate: (href: string) => void }) {
  return (
    <a
      {...props}
      href={href}
      target={target}
      download={download}
      onClick={event => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (target && target !== '_self') ||
          (download !== undefined && download !== false) ||
          new URL(href, event.currentTarget.ownerDocument.baseURI).origin !==
            event.currentTarget.ownerDocument.location.origin
        )
          return
        event.preventDefault()
        navigate(href)
      }}
    >
      {children}
    </a>
  )
}

test('active navigation hydrates as labelled native anchors with actual refs and protected identities', async () => {
  const ref = createRef<HTMLAnchorElement>(),
    tree = (active: boolean) => (
      <StrictMode>
        <NavLink
          href="#nav-destination"
          ref={ref}
          active={active}
          description="People enrolled"
          icon={
            <svg>
              <title>Decorative icon</title>
            </svg>
          }
          data-slot="custom"
          render={props => (
            <a
              {...props}
              data-adapter="yes"
            >
              {props.children}
            </a>
          )}
        >
          Participants
        </NavLink>
        <div
          id="nav-destination"
          tabIndex={-1}
        >
          Destination
        </div>
      </StrictMode>
    ),
    original = location.href
  try {
    const { host, render } = await mount(tree(true), true),
      link = host.querySelector('a')!
    expect(ref.current).toBe(link)
    expect(link.dataset.slot).toBe('link nav-link custom')
    expect(link.getAttribute('aria-current')).toBe('page')
    expect(link.getAttribute('data-selected')).toBe('')
    expect(link).toHaveAccessibleName('Participants People enrolled')
    link.focus()
    await key('{Enter}')
    expect(location.hash).toBe('#nav-destination')
    await render(tree(false))
    expect(link.hasAttribute('aria-current')).toBe(false)
    expect(link.hasAttribute('data-selected')).toBe(false)
    expect(host.querySelector('a')).toBe(link)
  } finally {
    history.replaceState(null, '', original)
  }
})
test('native group keyboard disclosure excludes closed links from Tab and preserves the controlled owner', async () => {
  const ref = createRef<HTMLDetailsElement>(),
    request = vi.fn(),
    tree = (open?: boolean) => (
      <>
        <button>Before</button>
        <NavLinkGroup
          ref={ref}
          {...(open === undefined ? {} : { open, onOpenChange: request })}
        >
          <NavLinkGroupTrigger>Projects</NavLinkGroupTrigger>
          <NavLinkGroupContent>
            <NavLink href="#project">Project</NavLink>
          </NavLinkGroupContent>
        </NavLinkGroup>
        <button>After</button>
      </>
    ),
    { host, render } = await mount(tree(), true),
    summary = host.querySelector('summary')!,
    buttons = host.querySelectorAll('button')
  expect(ref.current).toBe(host.querySelector('details'))
  expect(getComputedStyle(ref.current!).borderWidth).toBe('0px')
  await click(buttons[0]!)
  await key('{Tab}')
  expect(document.activeElement).toBe(summary)
  await key('{Tab}')
  expect(document.activeElement).toBe(buttons[1])
  summary.focus()
  await key('{Enter}')
  await pause(30)
  expect(ref.current?.open).toBe(true)
  await key('{Tab}')
  expect(document.activeElement).toBe(host.querySelector('a'))
  await render(<div>{tree(false)}</div>)
  const controlledSummary = host.querySelector('summary')!
  expect(ref.current?.open).toBe(false)
  expect(request).not.toHaveBeenCalled()
  controlledSummary.focus()
  await key(' ')
  await pause(30)
  expect(request).toHaveBeenCalledExactlyOnceWith(true)
  expect(ref.current?.open).toBe(false)
})
test('sidebar destinations update the current link and focus through browser history', async () => {
  const original = location.href
  try {
    const { host } = await mount(<NavLinkExample grouped />)
    const details = host.querySelector('details')!
    const summary = host.querySelector('summary')!
    expect(details.open).toBe(false)
    expect(host.querySelector('a[aria-current="page"]')?.textContent).toBe('Overview')
    summary.focus()
    await key('{Enter}')
    await expect.poll(() => details.open).toBe(true)

    const links = host.querySelectorAll('a')
    await click(links[1]!)
    const visiblePage = () => host.querySelector('section:not([hidden])')
    await expect.poll(() => visiblePage()?.textContent).toContain('See who has access')
    expect(links[1]?.getAttribute('aria-current')).toBe('page')
    expect(document.activeElement).toBe(visiblePage())

    history.replaceState(null, '', links[2]!.href)
    await act(async () => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(visiblePage()?.textContent).toContain('Choose your workspace defaults')
    expect(links[2]?.getAttribute('aria-current')).toBe('page')
    history.replaceState(null, '', location.pathname + location.search)
    await act(async () => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(visiblePage()?.textContent).toContain('See the latest workspace activity')
    expect(links[0]?.getAttribute('aria-current')).toBe('page')
    expect(document.activeElement).toBe(visiblePage())
  } finally {
    history.replaceState(null, '', original)
  }
})
test('router example respects cancellation, modified activation, downloads and native target ownership', async () => {
  const navigate = vi.fn(),
    cancel = vi.fn((e: React.MouseEvent<HTMLAnchorElement>) => e.preventDefault()),
    { host } = await mount(
      <>
        <NavLink
          href="#x"
          onClick={cancel}
          render={props => (
            <NavRouterAnchor
              {...props}
              navigate={navigate}
            />
          )}
        >
          Cancelled
        </NavLink>
        <NavLink
          href="#x"
          render={props => (
            <NavRouterAnchor
              {...props}
              navigate={navigate}
            />
          )}
        >
          Normal
        </NavLink>
        <NavLink
          href="#x"
          download
          render={props => (
            <NavRouterAnchor
              {...props}
              navigate={navigate}
            />
          )}
        >
          Download
        </NavLink>
        <NavLink
          href="#x"
          target="_blank"
          render={props => (
            <NavRouterAnchor
              {...props}
              navigate={navigate}
            />
          )}
        >
          New tab
        </NavLink>
      </>
    ),
    links = host.querySelectorAll('a')
  await click(links[0]!)
  expect(cancel).toHaveBeenCalledOnce()
  expect(navigate).not.toHaveBeenCalled()
  // Suppress the browser default after the adapter to observe its decisions without opening tabs.
  host.addEventListener('click', event => event.preventDefault())
  for (const [index, init] of [
    [1, { ctrlKey: true }],
    [1, { button: 1 }],
    [2, {}],
    [3, {}]
  ] as const)
    await act(async () => {
      links[index]!.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, ...init })
      )
    })
  expect(navigate).not.toHaveBeenCalled()
  await click(links[1]!)
  expect(navigate).toHaveBeenCalledExactlyOnceWith('#x')
})
test('theme, host and part styles preserve active hover contrast, narrow wrapping, RTL and shared control sizes', async () => {
  const theme = defineTheme({
    id: 'nav-test',
    name: 'Navigation test',
    components: {
      navLink: {
        gap: '11px',
        activeBackground: 'rgb(20, 30, 40)',
        activeColor: 'rgb(250, 250, 250)',
        indicatorColor: 'rgb(70, 110, 190)',
        indent: '19px'
      }
    }
  })
  for (const [controlSize, height] of [
    ['small', 32],
    ['medium', 40],
    ['large', 48]
  ] as const) {
    const { host } = await mount(
        <ThemeScope theme={theme}>
          <div
            dir="rtl"
            style={{ width: '220px' }}
          >
            <NavLink
              href="#x"
              active
              controlSize={controlSize}
              icon={<svg />}
            >
              Overview
            </NavLink>
            <NavLinkGroup defaultOpen>
              <NavLinkGroupTrigger controlSize={controlSize}>Projects</NavLinkGroupTrigger>
              <NavLinkGroupContent>
                <NavLink
                  href="#long"
                  parts={{ label: { style: { fontWeight: 700 } } }}
                >
                  LongUnbrokenDestinationNameThatMustWrap
                </NavLink>
              </NavLinkGroupContent>
            </NavLinkGroup>
          </div>
        </ThemeScope>
      ),
      link = host.querySelector('a')!,
      summary = host.querySelector('summary')!,
      content = host.querySelector<HTMLElement>('[data-slot~="nav-link-group-content"]')!
    expect(link.getBoundingClientRect().height).toBe(height)
    expect(summary.getBoundingClientRect().height).toBe(height)
    expect(getComputedStyle(link).gap).toBe('11px')
    const linkStyle = getComputedStyle(link)
    expect(linkStyle.borderWidth).toBe('1px')
    expect(linkStyle.borderColor).toBe('rgb(70, 110, 190)')
    const summaryStyle = getComputedStyle(summary)
    expect(summaryStyle.borderBottomLeftRadius).toBe(summaryStyle.borderTopLeftRadius)
    expect(summaryStyle.borderBottomRightRadius).toBe(summaryStyle.borderTopRightRadius)
    expect(getComputedStyle(content).paddingRight).toBe('19px')
    expect(host.querySelector('details')!.scrollWidth).toBeLessThanOrEqual(220)
    await userEvent.hover(link)
    expect(getComputedStyle(link).color).toBe('rgb(250, 250, 250)')
    expect(getComputedStyle(link).backgroundColor).toBe('rgb(20, 30, 40)')
    expect(
      getComputedStyle(
        host.querySelectorAll('a')[1]!.querySelector('span[data-slot="nav-link-label"]')!
      ).fontWeight
    ).toBe('700')
  }
})
test('forced colors retain an active cue and native keyboard focus with reduced disclosure motion', async () => {
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  const { host } = await mount(
      <>
        <button>Before</button>
        <NavLink
          href="#x"
          active
        >
          Overview
        </NavLink>
        <NavLinkGroup>
          <NavLinkGroupTrigger>Projects</NavLinkGroupTrigger>
          <NavLinkGroupContent>
            <NavLink href="#p">Project</NavLink>
          </NavLinkGroupContent>
        </NavLinkGroup>
      </>
    ),
    link = host.querySelector('a')!,
    summary = host.querySelector('summary')!
  await click(host.querySelector('button')!)
  await key('{Tab}')
  expect(document.activeElement).toBe(link)
  expect(getComputedStyle(link).outlineWidth).toBe('2px')
  expect(getComputedStyle(link).color).not.toBe(getComputedStyle(link).backgroundColor)
  await key('{Tab}')
  expect(document.activeElement).toBe(summary)
  await key('{Enter}')
  await pause(30)
  expect(host.querySelector('details')?.open).toBe(true)
  expect(getComputedStyle(summary.querySelector('svg')!).transitionProperty).toBe('none')
})
