import { act, StrictMode, createRef } from 'react'
import { renderToString } from 'react-dom/server'
import { expect, test, vi } from 'vitest'
import { userEvent, commands } from 'vitest/browser'
import {
  useHoverCard,
  Toolbar,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  HoverCardPortal,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  Link,
  Button,
  ThemeScope,
  defineTheme,
  type HoverCardProps,
  type HoverCardRenderProps
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { mount, key, click, pause, shown } from './familyHarness.js'
import type {} from './touchCommands.js'
function Fixture(props: HoverCardProps) {
  return (
    <p>
      <HoverCard {...props}>
        <HoverCardTrigger href="#hover-profile">Lee Chen</HoverCardTrigger>
        <HoverCardPortal>
          <HoverCardContent>
            <p>Design systems engineer.</p>
            <Link href="#hover-profile">Read full profile</Link>
          </HoverCardContent>
        </HoverCardPortal>
      </HoverCard>
    </p>
  )
}
function parts(host: HTMLElement) {
  return {
    trigger: host.querySelector<HTMLAnchorElement>('[data-slot~="hover-card-trigger"]')!,
    panel: host.querySelector<HTMLDivElement>('[data-slot~="hover-card-content"]')!
  }
}
test('hydration retains a real link and keyboard focus opens after the delay without moving focus; content Tab and Escape restore the link', async () => {
  const tree = (
    <StrictMode>
      <Fixture
        openDelay={40}
        closeDelay={20}
      />
      <button>Outside</button>
      <section id="hover-profile">Full profile</section>
    </StrictMode>
  )
  expect(renderToString(tree)).toContain('href="#hover-profile"')
  const { host } = await mount(tree, true),
    p = parts(host)
  expect(p.trigger).toBeInstanceOf(HTMLAnchorElement)
  expect(p.trigger.getAttribute('aria-controls')).toBe(p.panel.id)
  await act(async () => p.trigger.focus())
  expect(shown(p.panel)).toBe(false)
  await pause(80)
  expect(shown(p.panel)).toBe(true)
  expect(p.trigger).toHaveFocus()
  await key('{Tab}')
  expect(p.panel.querySelector('a')).toHaveFocus()
  await pause(60)
  expect(shown(p.panel)).toBe(true)
  await key('{Escape}')
  expect(shown(p.panel)).toBe(false)
  expect(p.trigger).toHaveFocus()
  await act(async () => userEvent.hover(p.trigger))
  await pause(80)
  expect(shown(p.panel)).toBe(false)
})
test('delayed pointer previews remain hoverable across the placement gap and close only after leaving both targets', async () => {
  const { host } = await mount(
      <>
        <Fixture
          openDelay={40}
          closeDelay={25}
        />
        <button style={{ position: 'fixed', right: 0, bottom: 0 }}>Outside</button>
      </>
    ),
    p = parts(host)
  await act(async () => userEvent.hover(p.trigger))
  expect(shown(p.panel)).toBe(false)
  await pause(80)
  expect(shown(p.panel)).toBe(true)
  const a = p.trigger.getBoundingClientRect(),
    b = p.panel.getBoundingClientRect()
  await act(async () => {
    p.trigger.dispatchEvent(
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
  await pause(60)
  expect(shown(p.panel)).toBe(true)
  await act(async () => userEvent.hover(p.panel))
  await pause(60)
  expect(shown(p.panel)).toBe(true)
  await act(async () => userEvent.hover(host.querySelector('button')!))
  await pause(60)
  expect(shown(p.panel)).toBe(false)
})
test('touch navigation stays native and never requires opening the supplementary preview', async () => {
  const original = location.href,
    action = vi.fn()
  const { host } = await mount(
      <>
        <HoverCard openDelay={20}>
          <HoverCardTrigger
            href="#hover-touch-destination"
            data-testid="hover-touch"
            onClick={action}
          >
            Read report
          </HoverCardTrigger>
          <HoverCardContent>Report summary.</HoverCardContent>
        </HoverCard>
        <section id="hover-touch-destination">Full report</section>
      </>
    ),
    p = parts(host)
  try {
    await act(async () => commands.touchButton('[data-testid="hover-touch"]', false))
    await pause(60)
    expect(action).toHaveBeenCalledOnce()
    expect(location.hash).toBe('#hover-touch-destination')
    expect(shown(p.panel)).toBe(false)
  } finally {
    history.replaceState(null, '', original)
  }
})
test('controlled owners may refuse close; prop sync and timer cleanup do not emit extra requests', async () => {
  const changes = vi.fn(),
    { host, render } = await mount(
      <Fixture
        open
        onOpenChange={changes}
      />
    ),
    p = parts(host)
  expect(shown(p.panel)).toBe(true)
  await key('{Escape}')
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
  expect(shown(p.panel)).toBe(true)
  changes.mockClear()
  await render(
    <Fixture
      open={false}
      onOpenChange={changes}
    />
  )
  expect(shown(p.panel)).toBe(false)
  expect(changes).not.toHaveBeenCalled()
  await render(
    <Fixture
      openDelay={60}
      onOpenChange={changes}
      key="uncontrolled"
    />
  )
  await act(async () => userEvent.hover(parts(host).trigger))
  await render(null)
  await pause(100)
  expect(changes).not.toHaveBeenCalled()
})
test('native anchor adapters, ref cleanup, caller styles and reduced/off motion preserve the shared Popover surface', async () => {
  const anchor = createRef<HTMLAnchorElement>(),
    surface = createRef<HTMLDivElement>(),
    cleanup = vi.fn()
  function Adapter(props: HoverCardRenderProps) {
    return <a {...props}>{props.children}</a>
  }
  const theme = defineTheme({
    id: 'hover-style',
    name: 'Hover style',
    components: { hoverCard: { width: '17rem' }, popover: { padding: '9px' } }
  })
  const tree = (off = false) => (
    <MotionProvider>
      <ThemeScope theme={theme}>
        <HoverCard defaultOpen>
          <HoverCardTrigger
            href="#hover-profile"
            ref={anchor}
            render={props => <Adapter {...props} />}
          >
            Profile
          </HoverCardTrigger>
          <HoverCardContent
            ref={node => {
              surface.current = node
              return cleanup
            }}
            motion={off ? 'off' : 'inherit'}
            className="gap-7 rounded-none"
            style={{ '--rad-hover-card-width': '19rem', borderWidth: '3px' }}
            data-slot="custom"
          >
            Preview
          </HoverCardContent>
        </HoverCard>
      </ThemeScope>
    </MotionProvider>
  )
  const { host, render } = await mount(tree()),
    p = parts(host)
  expect(anchor.current).toBe(p.trigger)
  expect(surface.current).toBe(p.panel)
  expect(shown(p.panel)).toBe(true)
  expect(p.panel.dataset.slot).toBe('popover-content hover-card-content custom')
  expect(getComputedStyle(p.panel).width).toBe('304px')
  expect(getComputedStyle(p.panel).padding).toBe('9px')
  expect(getComputedStyle(p.panel).borderTopWidth).toBe('3px')
  expect(getComputedStyle(p.panel).borderTopLeftRadius).toBe('0px')
  expect(getComputedStyle(p.panel).gap).toBe('28px')
  await commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
  await pause(60)
  expect(getComputedStyle(p.panel).opacity).toBe('1')
  expect(shown(p.panel)).toBe(true)
  await render(tree(true))
  expect(p.panel.dataset.motion).toBe('off')
  await render(null)
  expect(cleanup).toHaveBeenCalled()
  expect(p.panel.isConnected).toBe(false)
})
test('HoverCard inside actual Popover and Dialog uses the nearest Escape layer and preserves modal ancestry', async () => {
  const { host } = await mount(
    <Popover>
      <PopoverTrigger>Workspace</PopoverTrigger>
      <PopoverContent>
        <Fixture openDelay={0} />
      </PopoverContent>
    </Popover>
  )
  await click(host.querySelector('button')!)
  const p = parts(host)
  await act(async () => p.trigger.focus())
  await pause(30)
  expect(shown(p.panel)).toBe(true)
  await key('{Escape}')
  expect(shown(p.panel)).toBe(false)
  expect(shown(host.querySelector('[data-slot="popover-content"]')!)).toBe(true)
  await key('{Escape}')
  expect(shown(host.querySelector('[data-slot="popover-content"]')!)).toBe(false)
  const dialog = await mount(
    <Dialog>
      <DialogTrigger>Open profile</DialogTrigger>
      <DialogContent>
        <DialogTitle>Workspace members</DialogTitle>
        <Fixture openDelay={0} />
        <Button>Done</Button>
      </DialogContent>
    </Dialog>
  )
  await click(dialog.host.querySelector('button')!)
  const q = parts(dialog.host)
  await act(async () => q.trigger.focus())
  await pause(30)
  expect(shown(q.panel)).toBe(true)
  expect(dialog.host.querySelector('dialog')!.contains(q.panel)).toBe(true)
  await key('{Escape}')
  expect(shown(q.panel)).toBe(false)
  expect(dialog.host.querySelector('dialog')!.open).toBe(true)
})

test('inline link anchors flip at the viewport edge, honor RTL start and follow changing link text', async () => {
  const tree = (label: string) => (
    <div
      dir="rtl"
      style={{ position: 'fixed', left: 400, top: 8 }}
    >
      <HoverCard defaultOpen>
        <HoverCardTrigger href="#hover-profile">{label}</HoverCardTrigger>
        <HoverCardContent
          side="top"
          align="start"
          style={{ '--rad-hover-card-width': '200px' }}
        >
          Profile preview.
        </HoverCardContent>
      </HoverCard>
    </div>
  )
  const { host, render } = await mount(tree('Lee Chen')),
    p = parts(host)
  await pause(40)
  expect(p.panel.dataset.side).toBe('bottom')
  expect(
    Math.abs(p.panel.getBoundingClientRect().right - p.trigger.getBoundingClientRect().right)
  ).toBeLessThan(2)
  await render(tree('Lee Chen — Design systems engineer'))
  await expect
    .poll(
      () =>
        Math.abs(p.panel.getBoundingClientRect().right - p.trigger.getBoundingClientRect().right),
      { timeout: 1000 }
    )
    .toBeLessThan(2)
})
test('a Toolbar includes the preview link but leaves content actions in the native popup scope', async () => {
  const { host } = await mount(
      <Toolbar aria-label="References">
        <Button>Before</Button>
        <Fixture openDelay={20} />
        <Button>After</Button>
      </Toolbar>
    ),
    p = parts(host),
    buttons = Array.from(host.querySelectorAll('button'))
  await act(async () => buttons[0].focus())
  await key('{ArrowRight}')
  expect(p.trigger).toHaveFocus()
  await pause(60)
  expect(shown(p.panel)).toBe(true)
  await key('{Tab}')
  const contentLink = p.panel.querySelector('a')!
  expect(contentLink).toHaveFocus()
  await key('{ArrowRight}')
  expect(contentLink).toHaveFocus()
  await key('{Escape}')
  expect(p.trigger).toHaveFocus()
  expect(p.trigger.tabIndex).toBe(0)
  await key('{ArrowRight}')
  expect(buttons[1]).toHaveFocus()
})

function DismissPreview() {
  const card = useHoverCard()
  return <Button onClick={() => card?.setOpen(false)}>Cancel preview</Button>
}
test('explicit close cancels a pending focus preview before it opens', async () => {
  const { host } = await mount(
      <HoverCard openDelay={50}>
        <HoverCardTrigger href="#hover-profile">Profile</HoverCardTrigger>
        <HoverCardContent>Preview.</HoverCardContent>
        <DismissPreview />
      </HoverCard>
    ),
    p = parts(host)
  await act(async () => p.trigger.focus())
  await act(async () => host.querySelector('button')!.click())
  await pause(100)
  expect(p.trigger).toHaveFocus()
  expect(shown(p.panel)).toBe(false)
})

test('keyboard focus leaving both targets waits closeDelay and preserves the new focus', async () => {
  const { host } = await mount(
      <>
        <Fixture
          openDelay={20}
          closeDelay={70}
        />
        <button style={{ position: 'fixed', right: 0, bottom: 0 }}>Outside</button>
      </>
    ),
    p = parts(host),
    outside = host.querySelector('button')!
  await act(async () => userEvent.hover(outside))
  await act(async () => p.trigger.focus())
  await pause(50)
  expect(shown(p.panel)).toBe(true)
  await act(async () => outside.focus())
  expect(shown(p.panel)).toBe(true)
  await pause(110)
  expect(shown(p.panel)).toBe(false)
  expect(outside).toHaveFocus()
  await act(async () => p.trigger.focus())
  await pause(50)
  expect(shown(p.panel)).toBe(true)
  await click(outside)
  expect(shown(p.panel)).toBe(false)
  expect(outside).toHaveFocus()
})
