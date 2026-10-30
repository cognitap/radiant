import { act, createRef, StrictMode } from 'react'
import { expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  NavLink,
  NavLinkGroup,
  NavLinkGroupTrigger,
  NavLinkGroupContent,
  ThemeScope,
  defineTheme
} from '../../src/index.js'
import {
  BrowseStudyWorkspace,
  BrowseProjectLibrary,
  NavigateTeamSettings,
  NavRouterAnchor
} from '../../.storybook/examples/NavLinkExamples.js'
import { mount, click, key, pause } from './familyHarness.js'
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
    expect(link).toHaveAccessibleName('Participants People enrolled')
    link.focus()
    await key('{Enter}')
    expect(location.hash).toBe('#nav-destination')
    await render(tree(false))
    expect(link.hasAttribute('aria-current')).toBe(false)
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
test('native task routes update records and current links, focus accepted content and follow history observations', async () => {
  const original = location.href
  try {
    const { host } = await mount(<BrowseStudyWorkspace />),
      links = host.querySelectorAll('a'),
      content = host.querySelector('section')!
    await click(links[1]!)
    await pause(20)
    expect(content.textContent).toContain('Maya — confirmed')
    expect(links[1]?.getAttribute('aria-current')).toBe('page')
    expect(document.activeElement).toBe(content)
    history.replaceState(null, '', links[2]!.href)
    await act(async () => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(content.textContent).toContain('Participant roster.csv')
    expect(links[2]?.getAttribute('aria-current')).toBe('page')
    history.replaceState(null, '', location.pathname + location.search)
    await act(async () => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(content.textContent).toContain('Reader study overview')
    expect(links[0]?.getAttribute('aria-current')).toBe('page')
    expect(document.activeElement).toBe(content)

    const projects = await mount(<BrowseProjectLibrary />)
    await click(projects.host.querySelectorAll('a')[1]!)
    await pause(20)
    expect(projects.host.querySelector('section')?.textContent).toContain('8 participants')
  } finally {
    history.replaceState(null, '', original)
  }
})
test('router task preserves native adapters and exposes accepted settings data without a global router', async () => {
  const original = location.href
  try {
    const { host } = await mount(<NavigateTeamSettings />),
      link = host.querySelectorAll('a')[1]!,
      summary = host.querySelector('summary')!
    await click(link)
    expect(location.hash).toBe(new URL(link.href).hash)
    expect(host.querySelector('section')?.textContent).toContain('Two administrators')
    expect(document.activeElement).toBe(host.querySelector('section'))
    await click(summary)
    await pause(30)
    expect(host.querySelector('details')?.open).toBe(false)
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
    expect(getComputedStyle(link).borderRightWidth).toBe('3px')
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
