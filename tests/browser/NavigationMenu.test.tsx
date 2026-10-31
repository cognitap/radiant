import { act, StrictMode, createRef } from 'react'
import { expect, test, vi } from 'vitest'
import { createPortal } from 'react-dom'
import { userEvent, commands } from 'vitest/browser'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuContent,
  NavigationMenuViewport,
  useNavigationMenu,
  ThemeScope,
  defineTheme,
  type NavigationMenuProps,
  type NavigationMenuTriggerProps
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import {
  NavigateResearchLibrary,
  FindHelpResources,
  SwitchResearchWorkspace
} from '../../.storybook/examples/NavigationMenuExamples.js'
import { mount, click, key, pause } from './familyHarness.js'
import type {} from './touchCommands.js'
const items = [{ value: 'learn' }, { value: 'disabled', disabled: true }, { value: 'about' }]
type Options = Omit<Partial<NavigationMenuProps>, 'value' | 'defaultValue' | 'children'> & {
  value?: string | null
  initial?: string | null
  trigger?: Partial<NavigationMenuTriggerProps>
  motion?: 'inherit' | 'off'
  extra?: boolean
}
function Sample({ value, initial = null, trigger, motion, extra, ...options }: Options) {
  const owner = value === undefined ? { defaultValue: initial } : { value }
  return (
    <>
      <NavigationMenu
        {...options}
        {...owner}
        items={items}
        aria-label="Test site"
        style={{ width: '500px', maxWidth: '100%', ...options.style }}
      >
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              {...trigger}
              data-testid="nav-touch"
              value="learn"
            >
              Learn
            </NavigationMenuTrigger>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger value="disabled">Unavailable</NavigationMenuTrigger>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger value="about">About</NavigationMenuTrigger>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#nav-direct">Direct</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuViewport motion={motion}>
          <NavigationMenuContent
            value="learn"
            style={{ width: '260px' }}
          >
            <NavigationMenuLink href="#nav-guide">Guide</NavigationMenuLink>
            <input aria-label="Query" />
            {extra && <p>Additional material makes this panel taller.</p>}
          </NavigationMenuContent>
          <NavigationMenuContent value="disabled">Unavailable content</NavigationMenuContent>
          <NavigationMenuContent
            value="about"
            style={{ width: '170px' }}
          >
            <NavigationMenuLink href="#nav-team">Team</NavigationMenuLink>
            <NavigationMenuLink href="#nav-contact">Contact</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuViewport>
      </NavigationMenu>
      <button
        data-nav-outside=""
        style={{ position: 'fixed', right: 0, bottom: 0 }}
      >
        Outside
      </button>
    </>
  )
}
const trigger = (host: HTMLElement, value = 'learn') =>
  host.querySelector<HTMLButtonElement>(
    `[data-slot~="navigation-menu-trigger"][aria-controls$="panel-${value === 'learn' ? 0 : 2}"]`
  )!
const viewport = (host: HTMLElement) =>
  host.querySelector<HTMLDivElement>('[data-slot~="navigation-menu-viewport"]')!
const content = (host: HTMLElement, index = 0) =>
  host.querySelectorAll<HTMLDivElement>('[data-slot~="navigation-menu-content"]')[index]!
const open = (host: HTMLElement) => !viewport(host).hidden

test('SSR hydration preserves native navigation, actual hosts, names, IDs and caller refs', async () => {
  const nav = createRef<HTMLElement>(),
    button = createRef<HTMLButtonElement>(),
    link = createRef<HTMLAnchorElement>(),
    panel = createRef<HTMLDivElement>(),
    view = createRef<HTMLDivElement>()
  const { host } = await mount(
    <StrictMode>
      <NavigationMenu
        aria-label="Project"
        items={[{ value: 'learn' }]}
        defaultValue="learn"
        ref={nav}
      >
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              value="learn"
              ref={button}
            >
              Learn
            </NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuViewport ref={view}>
          <NavigationMenuContent
            value="learn"
            ref={panel}
          >
            <NavigationMenuLink
              href="#guide"
              ref={link}
            >
              Guide
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuViewport>
      </NavigationMenu>
    </StrictMode>,
    true
  )
  expect(nav.current?.tagName).toBe('NAV')
  expect(button.current?.tagName).toBe('BUTTON')
  expect(link.current?.tagName).toBe('A')
  expect(panel.current?.tagName).toBe('DIV')
  expect(view.current?.getAttribute('data-slot')).toBe('scroll-area navigation-menu-viewport')
  expect(button.current?.getAttribute('aria-controls')).toBe(panel.current?.id)
  expect(view.current).toHaveAccessibleName('Learn')
  expect(host.querySelector('[role="menu"],[role="menubar"],[role="menuitem"]')).toBeNull()
})
test('keyboard disclosure preserves normal tab stops, enters content on arrows and Escape returns focus immediately', async () => {
  const { host } = await mount(<Sample />),
    first = trigger(host),
    last = trigger(host, 'about')
  await act(async () => first.focus())
  await key('{ArrowRight}')
  expect(last).toHaveFocus()
  expect(open(host)).toBe(false)
  await key('{Home}')
  expect(first).toHaveFocus()
  await key('{ArrowDown}')
  expect(open(host)).toBe(true)
  expect(content(host).querySelector('a')).toHaveFocus()
  await key('{Escape}')
  expect(open(host)).toBe(false)
  expect(first).toHaveFocus()
  await key('{Tab}')
  expect(last).toHaveFocus()
  await key('{ArrowUp}')
  expect(content(host, 2).querySelectorAll('a')[1]).toHaveFocus()
  await key('{Escape}')
  expect(last).toHaveFocus()
})
test('hover intent waits before opening, bridges the placement gap, switches one viewport and cancels pending work on dismissal', async () => {
  const { host } = await mount(
      <Sample
        openDelay={80}
        closeDelay={45}
      />
    ),
    first = trigger(host),
    last = trigger(host, 'about'),
    outside = host.querySelector<HTMLButtonElement>('[data-nav-outside]')!
  await act(async () => userEvent.hover(first))
  expect(open(host)).toBe(false)
  await pause(110)
  expect(open(host)).toBe(true)
  const a = first.getBoundingClientRect(),
    b = viewport(host).getBoundingClientRect()
  await act(async () => {
    first.dispatchEvent(
      new PointerEvent('pointerout', {
        bubbles: true,
        pointerType: 'mouse',
        relatedTarget: document.body
      })
    )
    document.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        pointerType: 'mouse',
        clientX: (a.left + a.right) / 2,
        clientY: (a.bottom + b.top) / 2
      })
    )
  })
  await pause(70)
  expect(open(host)).toBe(true)
  await act(async () => userEvent.hover(last))
  await pause(25)
  expect(last.getAttribute('aria-expanded')).toBe('true')
  expect(content(host).hidden).toBe(true)
  await act(async () => userEvent.hover(outside))
  await pause(80)
  expect(open(host)).toBe(false)
  await act(async () => userEvent.hover(first))
  await click(outside)
  await pause(110)
  expect(open(host)).toBe(false)
})
test('controlled refusal never forks visibility or focus; accepted prop sync emits no request', async () => {
  const changes = vi.fn(),
    { host, render } = await mount(
      <Sample
        value="learn"
        onValueChange={changes}
      />
    ),
    first = trigger(host)
  await act(async () => content(host).querySelector('a')!.focus())
  await key('{Escape}')
  expect(open(host)).toBe(true)
  expect(content(host).querySelector('a')).toHaveFocus()
  expect(changes).toHaveBeenCalledExactlyOnceWith(null)
  changes.mockClear()
  await render(
    <Sample
      value={null}
      onValueChange={changes}
    />
  )
  expect(open(host)).toBe(false)
  expect(first).toHaveFocus()
  expect(changes).not.toHaveBeenCalled()
  await act(async () => first.focus())
  await key('{ArrowDown}')
  expect(open(host)).toBe(false)
  expect(first).toHaveFocus()
  expect(changes).toHaveBeenCalledExactlyOnceWith('learn')
})
test('direction changes physical trigger navigation while text inputs retain their own arrow keys', async () => {
  const { host } = await mount(<Sample dir="rtl" />),
    first = trigger(host),
    last = trigger(host, 'about')
  await act(async () => first.focus())
  await key('{ArrowLeft}')
  expect(last).toHaveFocus()
  await key('{Home}')
  await key('{ArrowDown}')
  const input = content(host).querySelector('input')!
  await act(async () => input.focus())
  await key('{ArrowLeft}')
  expect(input).toHaveFocus()
  expect(first.getAttribute('aria-expanded')).toBe('true')
  await click(host.querySelector<HTMLButtonElement>('[data-nav-outside]')!)
  expect(open(host)).toBe(false)
})
test('the shared native ScrollArea follows content and owner width changes and respects independently typed theme metrics', async () => {
  const { host, render } = await mount(
    <ThemeScope
      theme={defineTheme({
        id: 'nav-test',
        name: 'Nav test',
        components: {
          navigationMenu: { gap: '13px', padding: '17px', radius: '11px', borderWidth: '3px' }
        }
      })}
    >
      <Sample initial="learn" />
    </ThemeScope>
  )
  const v = viewport(host)
  expect(getComputedStyle(v).borderTopWidth).toBe('3px')
  expect(getComputedStyle(v).borderRadius).toBe('11px')
  expect(getComputedStyle(content(host)).paddingTop).toBe('17px')
  const before = JSON.parse(v.getAttribute('data-rad-indicator-target')!)
  await render(
    <ThemeScope
      theme={defineTheme({
        id: 'nav-test',
        name: 'Nav test',
        components: {
          navigationMenu: { gap: '13px', padding: '17px', radius: '11px', borderWidth: '3px' }
        }
      })}
    >
      <Sample
        initial="learn"
        extra
        style={{ width: '200px' }}
      />
    </ThemeScope>
  )
  await pause(80)
  const after = JSON.parse(v.getAttribute('data-rad-indicator-target')!)
  expect(after[2]).toBeLessThanOrEqual(200)
  expect(after[3]).toBeGreaterThan(before[3])
  expect(v.tabIndex).toBe(0)
})
test('viewport spring movement stays opt-in, follows panel changes, and reduced motion reaches the exact rectangle immediately', async () => {
  const { host } = await mount(
      <MotionProvider>
        <Sample initial="learn" />
      </MotionProvider>
    ),
    v = viewport(host)
  await pause(60)
  await click(trigger(host, 'about'))
  await pause(30)
  const target = JSON.parse(v.getAttribute('data-rad-indicator-target')!),
    position = parseFloat(v.style.getPropertyValue('--_rad-indicator-width'))
  expect(position).not.toBe(target[2])
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  await pause(50)
  expect(parseFloat(v.style.getPropertyValue('--_rad-indicator-width'))).toBe(target[2])
  await click(trigger(host))
  await pause(40)
  expect(parseFloat(v.style.getPropertyValue('--_rad-indicator-width'))).toBe(
    JSON.parse(v.getAttribute('data-rad-indicator-target')!)[2]
  )
})
test('consumer cancellation wins; pending keeps a native focusable trigger and disabled roots prevent hover and click requests', async () => {
  const changes = vi.fn(),
    { host, render } = await mount(
      <Sample
        onValueChange={changes}
        trigger={{ onClick: event => event.preventDefault() }}
      />
    )
  await click(trigger(host))
  expect(open(host)).toBe(false)
  expect(changes).not.toHaveBeenCalled()
  await render(
    <Sample
      onValueChange={changes}
      trigger={{ pending: true }}
    />
  )
  expect(trigger(host).disabled).toBe(false)
  await click(trigger(host))
  expect(open(host)).toBe(false)
  await render(
    <Sample
      disabled
      onValueChange={changes}
      openDelay={0}
    />
  )
  await act(async () => userEvent.hover(trigger(host)))
  await pause(30)
  expect(trigger(host).disabled).toBe(true)
  expect(open(host)).toBe(false)
  expect(changes).not.toHaveBeenCalled()
})
test('trusted touch toggles the disclosure once without hover activation', async () => {
  const { host } = await mount(<Sample openDelay={0} />)
  await act(async () => commands.touchButton('[data-testid="nav-touch"]', false))
  expect(open(host)).toBe(true)
  await act(async () => commands.touchButton('[data-testid="nav-touch"]', false))
  expect(open(host)).toBe(false)
})
test('hook requests are bounded by the registry and return null outside the root', async () => {
  function Outside() {
    expect(useNavigationMenu()).toBeNull()
    return null
  }
  function Actions() {
    const menu = useNavigationMenu()
    return <button onClick={() => menu?.setValue('learn')}>Open from hook</button>
  }
  const { host } = await mount(
    <>
      <Outside />
      <NavigationMenu
        aria-label="Hook"
        items={items}
      >
        <Actions />
        <NavigationMenuTrigger value="learn">Learn</NavigationMenuTrigger>
        <NavigationMenuViewport>
          <NavigationMenuContent value="learn">Material</NavigationMenuContent>
        </NavigationMenuViewport>
      </NavigationMenu>
    </>
  )
  await click(host.querySelector('button')!)
  expect(open(host)).toBe(true)
})
for (const [name, Example, button, link, title] of [
  ['research', NavigateResearchLibrary, 'Studies', 'Navigation study', 'Navigation study'],
  ['help', FindHelpResources, 'Support', 'Recording and privacy', 'Recording and privacy'],
  ['workspace', SwitchResearchWorkspace, 'Projects', 'Harbor reading', 'Harbor reading']
] as const)
  test(`${name} canonical application hydrates, navigates to actual content and focuses its destination`, async () => {
    const { host } = await mount(<Example />, true)
    const opener = Array.from(host.querySelectorAll('button')).find(
      node => node.textContent === button
    )!
    await click(opener)
    const destination = Array.from(host.querySelectorAll('a')).find(
      node => node.textContent === link
    )!
    await click(destination)
    await pause(40)
    expect(host.querySelector('[aria-label$=" destination"] h3')?.textContent).toBe(title)
    expect(host.querySelector('[aria-label$=" destination"]')).toHaveFocus()
    expect(open(host)).toBe(false)
  })

test('narrow forced colors retain a named reachable native viewport and bounded panel geometry', async () => {
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  const { host } = await mount(
      <MotionProvider>
        <Sample
          initial="learn"
          dir="rtl"
          style={{ width: '240px' }}
        />
      </MotionProvider>
    ),
    v = viewport(host)
  await pause(40)
  const target = JSON.parse(v.getAttribute('data-rad-indicator-target')!)
  expect(target[2]).toBeLessThanOrEqual(240)
  expect(getComputedStyle(v).forcedColorAdjust).not.toBe('none')
  expect(v).toHaveAccessibleName('Learn')
  await act(async () => v.focus())
  await key('{Escape}')
  expect(trigger(host)).toHaveFocus()
  expect(open(host)).toBe(false)
})
test('foreign document keyboard dismissal uses the actual owner and pending hover work is cancelled on unmount', async () => {
  const frame = document.createElement('iframe')
  document.body.append(frame)
  try {
    const doc = frame.contentDocument!,
      view = doc.defaultView!
    await mount(createPortal(<Sample initial="learn" />, doc.body))
    const first = doc.querySelector<HTMLButtonElement>('[data-slot~="navigation-menu-trigger"]')!,
      v = doc.querySelector<HTMLDivElement>('[data-slot~="navigation-menu-viewport"]')!
    await act(async () => {
      first.focus()
      first.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(v.hidden).toBe(true)
    expect(doc.activeElement).toBe(first)
  } finally {
    await act(async () => frame.remove())
  }
  const changes = vi.fn(),
    { host, render } = await mount(
      <Sample
        openDelay={80}
        onValueChange={changes}
      />
    )
  await act(async () => userEvent.hover(trigger(host)))
  await render(<></>)
  await pause(110)
  expect(changes).not.toHaveBeenCalled()
})

test('fresh pointer navigation reopens earlier sections after actual routed link activation and still closes on pointer leave', async () => {
  const { host } = await mount(
      <NavigateResearchLibrary
        openDelay={20}
        closeDelay={20}
      />
    ),
    nav = host.querySelector('nav')!,
    buttons = nav.querySelectorAll('button')
  await click(buttons[0]!)
  await click(
    Array.from(nav.querySelectorAll('a')).find(node => node.textContent === 'Navigation study')!
  )
  await pause(30)
  await act(async () => userEvent.hover(buttons[1]!))
  await pause(60)
  expect(buttons[1]?.getAttribute('aria-expanded')).toBe('true')
  await click(
    Array.from(nav.querySelectorAll('a')).find(node => node.textContent === 'Participant consent')!
  )
  await pause(30)
  await act(async () => userEvent.hover(buttons[0]!))
  await pause(60)
  expect(buttons[0]?.getAttribute('aria-expanded')).toBe('true')
  await act(async () => userEvent.hover(host.querySelector('output')!))
  await pause(60)
  expect(buttons[0]?.getAttribute('aria-expanded')).toBe('false')
})
