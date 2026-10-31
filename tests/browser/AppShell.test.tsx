import { ReviewResearchSessions } from '../../.storybook/examples/AppShellExamples.js'
import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { expect, test, vi } from 'vitest'
import { commands } from 'vitest/browser'
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellSkipLink,
  Sidebar,
  SidebarContent,
  SidebarLabel,
  SidebarTrigger,
  NavLink,
  ThemeScope,
  defineTheme,
  useAppShell,
  useSidebar,
  type AppShellProps
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { mount, click, key, pause } from './familyHarness.js'
type Options = Omit<
  Partial<AppShellProps>,
  'collapsed' | 'defaultCollapsed' | 'open' | 'defaultOpen' | 'children'
> & {
  collapsed?: boolean
  open?: boolean
  initialCollapsed?: boolean
  initialOpen?: boolean
  extra?: ReactNode
}
function Sample({
  collapsed,
  open,
  initialCollapsed = false,
  initialOpen = false,
  extra,
  ...props
}: Options) {
  const collapseOwner =
      collapsed === undefined ? { defaultCollapsed: initialCollapsed } : { collapsed },
    openOwner = open === undefined ? { defaultOpen: initialOpen } : { open }
  return (
    <AppShell
      {...props}
      {...collapseOwner}
      {...openOwner}
      style={{ height: '400px', width: '600px', maxWidth: '100%', ...props.style }}
    >
      <AppShellSkipLink>Skip to workspace</AppShellSkipLink>
      <AppShellHeader>
        <strong>Research workspace</strong>
        <SidebarTrigger>Toggle navigation</SidebarTrigger>
      </AppShellHeader>
      <Sidebar label="Projects">
        <SidebarContent expandedOnly>
          <label>
            Find projects
            <input
              aria-label="Find projects"
              defaultValue="Atlas"
            />
          </label>
        </SidebarContent>
        <NavLink
          href="#atlas"
          icon={<span aria-hidden="true">A</span>}
        >
          <SidebarLabel>Atlas project</SidebarLabel>
        </NavLink>
        {extra}
      </Sidebar>
      <AppShellMain>
        <h1>Study overview</h1>
        <label>
          Study notes
          <input
            aria-label="Study notes"
            defaultValue="Retain this note"
          />
        </label>
      </AppShellMain>
    </AppShell>
  )
}
const nav = (host: ParentNode) => host.querySelector<HTMLElement>('[data-slot~="sidebar"]')!
const toggle = (host: ParentNode) =>
  host.querySelector<HTMLButtonElement>('[data-slot~="sidebar-trigger"]')!
const main = (host: ParentNode) => host.querySelector<HTMLElement>('[data-slot~="app-shell-main"]')!
async function frame() {
  const node = document.createElement('iframe')
  node.style.cssText = 'width:320px;height:500px;border:0'
  document.body.append(node)
  const doc = node.contentDocument!
  doc.body.style.margin = '0'
  for (const css of document.querySelectorAll('style,link[rel="stylesheet"]'))
    doc.head.append(css.cloneNode(true))
  return { node, doc }
}
test('hydration retains native landmarks, actual host refs, skip relationships and one navigation subtree', async () => {
  const root = createRef<HTMLDivElement>(),
    header = createRef<HTMLElement>(),
    navigation = createRef<HTMLElement>(),
    content = createRef<HTMLElement>()
  const { host } = await mount(
    <StrictMode>
      <AppShell ref={root}>
        <AppShellSkipLink>Skip to content</AppShellSkipLink>
        <AppShellHeader ref={header}>
          <SidebarTrigger>Navigation</SidebarTrigger>
        </AppShellHeader>
        <Sidebar
          label="Workspace"
          ref={navigation}
        >
          <NavLink href="#project">Project</NavLink>
        </Sidebar>
        <AppShellMain ref={content}>
          <h1>Workspace content</h1>
        </AppShellMain>
      </AppShell>
    </StrictMode>,
    true
  )
  expect(root.current?.tagName).toBe('DIV')
  expect(header.current?.tagName).toBe('HEADER')
  expect(navigation.current?.tagName).toBe('NAV')
  expect(content.current?.tagName).toBe('MAIN')
  expect(host.querySelectorAll('nav').length).toBe(1)
  expect(navigation.current).toHaveAccessibleName('Workspace')
  expect(host.querySelector('a')?.getAttribute('href')).toBe('#' + content.current?.id)
  expect(toggle(host).getAttribute('aria-controls')).toBe(navigation.current?.id)
})
test('desktop collapse keeps real links named and native state mounted while expanded-only content becomes hidden and inert', async () => {
  const { host } = await mount(<Sample />),
    before = nav(host),
    input = host.querySelector<HTMLInputElement>('[aria-label="Find projects"]')!
  await act(async () => {
    input.value = 'Saved search'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await click(toggle(host))
  expect(nav(host)).toBe(before)
  expect(toggle(host).getAttribute('aria-expanded')).toBe('false')
  expect(host.querySelector('[data-slot~="sidebar-content"]')?.hasAttribute('inert')).toBe(true)
  expect(before.querySelector('a')).toHaveAccessibleName('Atlas project')
  expect(before.getBoundingClientRect().width).toBeCloseTo(80)
  await click(toggle(host))
  expect(input.value).toBe('Saved search')
  expect(input.getClientRects().length).toBeGreaterThan(0)
})
test('controlled collapse may be refused, prop sync emits nothing, and hidden focused content moves to its controlling trigger', async () => {
  const changes = vi.fn(),
    { host, render } = await mount(
      <Sample
        collapsed={false}
        onCollapsedChange={changes}
      />
    ),
    input = host.querySelector<HTMLInputElement>('[aria-label="Find projects"]')!
  await click(toggle(host))
  expect(toggle(host).getAttribute('aria-expanded')).toBe('true')
  expect(changes).toHaveBeenCalledExactlyOnceWith(true)
  changes.mockClear()
  await act(async () => input.focus())
  await render(
    <Sample
      collapsed
      onCollapsedChange={changes}
    />
  )
  expect(toggle(host)).toHaveFocus()
  expect(changes).not.toHaveBeenCalled()
})
test('collapse observation does not steal focus from an outside application control', async () => {
  const { host, render } = await mount(
      <>
        <Sample collapsed={false} />
        <button data-outside>Outside</button>
      </>
    ),
    input = host.querySelector<HTMLInputElement>('[aria-label="Find projects"]')!,
    outside = host.querySelector<HTMLButtonElement>('[data-outside]')!
  await act(async () => input.focus())
  await click(outside)
  await render(
    <>
      <Sample collapsed />
      <button data-outside>Outside</button>
    </>
  )
  expect(outside).toHaveFocus()
})
test('visually hidden content scrolls with Main and Sidebar instead of escaping their scroll boxes', async () => {
  const hidden = (label: string) => (
    <>
      <div style={{ height: '2000px', flexShrink: 0 }} />
      <span className="sr-only">{label}</span>
    </>
  )
  const { host } = await mount(
    <AppShell style={{ height: '400px', width: '600px' }}>
      <AppShellHeader>Workspace</AppShellHeader>
      <Sidebar label="Projects">{hidden('Sidebar status')}</Sidebar>
      <AppShellMain>{hidden('Main status')}</AppShellMain>
    </AppShell>
  )
  for (const [box, label] of [
    [main(host), 'Main status'],
    [nav(host), 'Sidebar status']
  ] as const) {
    const text = [...box.querySelectorAll('span')].find(node => node.textContent === label)!
    const before = text.getBoundingClientRect().top
    await act(async () => box.scrollTo({ top: 1000 }))
    expect(box.scrollTop).toBe(1000)
    expect(text.getBoundingClientRect().top).toBeCloseTo(before - 1000, 0)
  }
})
test('the actual skip Link moves native focus to Main without adding Main to ordinary Tab order', async () => {
  const original = location.href,
    { host } = await mount(<Sample />)
  try {
    await act(async () => host.querySelector('a')!.focus())
    await key('{Enter}')
    expect(main(host)).toHaveFocus()
    expect(main(host).tabIndex).toBe(-1)
  } finally {
    history.replaceState(null, '', original)
  }
})
test('mobile uses the real modal Drawer, preserves input and node identity across breakpoint changes, and closes back to the trigger', async () => {
  const f = await frame()
  try {
    await mount(createPortal(<Sample />, f.doc.body))
    await pause(60)
    const node = nav(f.doc),
      input = f.doc.querySelector<HTMLInputElement>('[aria-label="Find projects"]')!,
      button = toggle(f.doc)
    expect(button.getAttribute('aria-haspopup')).toBe('dialog')
    expect(node.closest('dialog')?.open).toBe(false)
    await act(async () => {
      button.focus()
      button.click()
    })
    await pause(50)
    const dialog = node.closest('dialog')!
    expect(dialog.open).toBe(true)
    expect(dialog.getAttribute('data-slot')).toContain('drawer')
    await act(async () => {
      input.value = 'Mobile search'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      dialog.close()
    })
    await pause(50)
    expect(dialog.open).toBe(false)
    expect(f.doc.activeElement).toBe(button)
    await act(async () => {
      f.node.style.width = '650px'
    })
    await pause(100)
    expect(nav(f.doc)).toBe(node)
    expect(node.closest('dialog')).toBeNull()
    expect(input.value).toBe('Mobile search')
    expect(button.getAttribute('aria-haspopup')).toBeNull()
    expect(button.getAttribute('aria-expanded')).toBe('true')
  } finally {
    await act(async () => f.node.remove())
  }
})
test('narrow controlled owners can refuse closing the native Drawer without visual or callback state forks', async () => {
  const f = await frame(),
    changes = vi.fn()
  try {
    await mount(
      createPortal(
        <Sample
          open
          onOpenChange={changes}
        />,
        f.doc.body
      )
    )
    await pause(60)
    const dialog = nav(f.doc).closest('dialog')!
    expect(dialog.open).toBe(true)
    await act(async () => dialog.close())
    await pause(60)
    expect(dialog.open).toBe(true)
    expect(changes).toHaveBeenCalledExactlyOnceWith(false)
  } finally {
    await act(async () => f.node.remove())
  }
})
test('layout springs animate dedicated private parts and reduced motion reaches the native collapsed geometry immediately', async () => {
  const { host } = await mount(
      <MotionProvider>
        <Sample />
      </MotionProvider>
    ),
    root = host.querySelector<HTMLElement>('[data-slot~="app-shell"]')!,
    slot = host.querySelector<HTMLElement>('[data-slot~="sidebar-slot"]')!
  await pause(60)
  await click(toggle(host))
  await pause(25)
  const part = slot.firstElementChild!
  expect(part.getBoundingClientRect().width).toBeGreaterThan(80)
  expect(slot.getBoundingClientRect().width).toBeCloseTo(80)
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  await pause(50)
  expect(nav(host).getBoundingClientRect().width).toBeCloseTo(80)
  expect(main(host).getBoundingClientRect().right).toBeCloseTo(root.getBoundingClientRect().right)
})
test('themes target actual hosts and caller classes replace their default metric utilities', async () => {
  const { host } = await mount(
    <ThemeScope
      theme={defineTheme({
        id: 'shell-test',
        name: 'Shell test',
        components: {
          appShell: { headerPadding: '19px', headerMinHeight: '70px', mainPadding: '23px' },
          sidebar: { width: '220px', padding: '11px', labelSize: '18px' }
        }
      })}
    >
      <Sample />
    </ThemeScope>
  )
  expect(getComputedStyle(host.querySelector('header')!).paddingTop).toBe('19px')
  expect(getComputedStyle(main(host)).paddingTop).toBe('23px')
  expect(nav(host).getBoundingClientRect().width).toBeCloseTo(220)
  expect(getComputedStyle(nav(host)).paddingTop).toBe('11px')
})
test('hooks are absent outside roots, consumer cancellation wins, and read-only layout observations emit no state requests', async () => {
  function Outside() {
    expect(useSidebar()).toBeNull()
    expect(useAppShell()).toBeNull()
    return null
  }
  const changes = vi.fn(),
    { host } = await mount(
      <>
        <Outside />
        <AppShell onCollapsedChange={changes}>
          <AppShellHeader>
            <SidebarTrigger onClick={event => event.preventDefault()}>Keep layout</SidebarTrigger>
          </AppShellHeader>
          <Sidebar label="Project" />
          <AppShellMain>Content</AppShellMain>
        </AppShell>
      </>
    )
  await click(toggle(host))
  expect(toggle(host).getAttribute('aria-expanded')).toBe('true')
  expect(changes).not.toHaveBeenCalled()
})

test('removing the owning iframe before React unmount safely releases layout, Drawer and Button motion bindings', async () => {
  const f = await frame()
  const mounted = await mount(
    createPortal(
      <MotionProvider>
        <Sample initialOpen />
      </MotionProvider>,
      f.doc.body
    )
  )
  await pause(60)
  await act(async () => f.node.remove())
  await mounted.render(<></>)
})

test('physical RTL placement and mobile logical-start Drawer remain usable in forced colors', async () => {
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  const { host } = await mount(<Sample dir="rtl" />)
  const root = host.querySelector<HTMLElement>('[data-slot~="app-shell"]')!
  expect(nav(host).getBoundingClientRect().right).toBeCloseTo(root.getBoundingClientRect().right)
  expect(main(host).getBoundingClientRect().left).toBeCloseTo(root.getBoundingClientRect().left)
  const f = await frame()
  try {
    await mount(createPortal(<Sample dir="rtl" />, f.doc.body))
    await pause(60)
    await act(async () => {
      toggle(f.doc).focus()
      toggle(f.doc).click()
    })
    await pause(60)
    const dialog = nav(f.doc).closest('dialog')!
    expect(dialog.open).toBe(true)
    expect(dialog.getAttribute('data-physical-side')).toBe('right')
    expect(f.doc.defaultView!.getComputedStyle(nav(f.doc)).forcedColorAdjust).not.toBe('none')
  } finally {
    await act(async () => f.node.remove())
  }
})
test('a focused sidebar input moves to its persistent header trigger when entering a closed mobile drawer', async () => {
  const f = await frame()
  f.node.style.width = '650px'
  try {
    await mount(createPortal(<Sample />, f.doc.body))
    await pause(60)
    const button = toggle(f.doc),
      input = f.doc.querySelector<HTMLInputElement>('[aria-label="Find projects"]')!
    await act(async () => input.focus())
    await act(async () => {
      f.node.style.width = '320px'
    })
    await pause(100)
    expect(toggle(f.doc)).toBe(button)
    expect(f.doc.activeElement).toBe(button)
    expect(nav(f.doc).closest('dialog')?.open).toBe(false)
  } finally {
    await act(async () => f.node.remove())
  }
})
test('local motion off keeps collapsed geometry immediate without reserving projection styles', async () => {
  const { host } = await mount(
    <MotionProvider>
      <Sample motion="off" />
    </MotionProvider>
  )
  await click(toggle(host))
  expect(nav(host).getBoundingClientRect().width).toBeCloseTo(80)
  expect(host.querySelector<HTMLElement>('[data-slot~="sidebar-slot"] > div')?.style.position).toBe(
    ''
  )
})

test('the complete application preview keeps native skip-link fragments in its own document', async () => {
  const { host } = await mount(<ReviewResearchSessions />, true),
    frame = host.querySelector('iframe')!
  await expect.poll(() => frame.contentDocument?.querySelector('main')).toBeTruthy()
  const doc = frame.contentDocument!,
    target = main(doc),
    skip = doc.querySelector<HTMLAnchorElement>('[data-slot~="app-shell-skip-link"]')!
  await act(async () => {
    skip.focus()
    skip.click()
  })
  await pause(70)
  expect(frame.contentDocument).toBe(doc)
  expect(doc.activeElement).toBe(target)
})
