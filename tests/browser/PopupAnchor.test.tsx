/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Caller-supplied dialog semantics on PopoverContent's native div host. */
import { act, useRef, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  ThemeScope,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  defineTheme,
  type PopoverAnchor,
  type PopoverAnchorRect,
  type PopoverContentProps
} from '../../src/index.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: { host: HTMLDivElement; root: Root }[] = []
async function mount(tree: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  await act(async () => root.render(tree))
  mounted.push({ host, root })
  return { host, render: (next: ReactNode) => act(async () => root.render(next)) }
}
afterEach(async () => {
  for (const { host, root } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await commands.emulatePreferences({ reducedMotion: 'no-preference', forcedColors: 'none' })
  await userEvent.unhover(document.body)
})

const shown = (node: Element | null) => !!node?.matches(':popover-open')
const panelOf = (host: HTMLElement) =>
  host.querySelector<HTMLElement>('[data-slot~=popover-content], [role=tooltip]')!
const near = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThan(1)
const frame = () => act(() => new Promise(resolve => requestAnimationFrame(() => resolve(null))))

function Drawing({
  children,
  focusable = true,
  transform
}: {
  children: (anchor: SVGCircleElement | null) => ReactNode
  focusable?: boolean
  transform?: string
}) {
  const [anchor, setAnchor] = useState<SVGCircleElement | null>(null)
  return (
    <div data-testid="frame">
      <svg
        width={400}
        height={300}
        style={{ display: 'block', marginTop: 100, marginLeft: 100 }}
      >
        <g transform={transform}>
          <circle
            ref={setAnchor}
            cx={60}
            cy={60}
            r={20}
            tabIndex={focusable ? 0 : undefined}
            aria-label="Region"
          />
        </g>
      </svg>
      {children(anchor)}
    </div>
  )
}
function Panel(props: PopoverContentProps) {
  return (
    <PopoverPortal>
      <PopoverContent
        role="dialog"
        aria-label="Region details"
        motion="off"
        {...props}
      >
        <PopoverClose>Done</PopoverClose>
      </PopoverContent>
    </PopoverPortal>
  )
}

test('SVG anchors place the popup beside the shape in the theme subtree, never inside the drawing', async () => {
  const theme = defineTheme({
    id: 'anchor-proof',
    name: 'Anchor proof',
    components: { popover: { width: '18rem' } }
  })
  const { host } = await mount(
    <ThemeScope theme={theme}>
      <Drawing>
        {anchor => (
          <Popover
            defaultOpen
            anchor={anchor}
          >
            <Panel />
          </Popover>
        )}
      </Drawing>
    </ThemeScope>
  )
  const panel = panelOf(host)
  const circle = host.querySelector('circle')!
  expect(shown(panel)).toBe(true)
  expect(panel.closest('svg')).toBeNull()
  expect(panel.parentElement).toBe(host.querySelector('[data-testid=frame]'))
  expect(getComputedStyle(panel).width).toBe('288px')
  const a = circle.getBoundingClientRect(),
    b = panel.getBoundingClientRect()
  near(b.top, a.bottom + 8)
  near(b.left, a.left)
  expect(panel.dataset.side).toBe('bottom')
})

test('rect anchors flip near viewport edges and align logically in right-to-left subtrees', async () => {
  const low: PopoverAnchorRect = { x: 300, y: window.innerHeight - 20, width: 40, height: 10 }
  const { host, render } = await mount(
    <Popover
      defaultOpen
      anchor={low}
    >
      <Panel />
    </Popover>
  )
  const panel = panelOf(host)
  expect(shown(panel)).toBe(true)
  expect(panel.dataset.side).toBe('top')
  near(panel.getBoundingClientRect().bottom, low.y - 8)
  const rect = { x: 600, y: 100, width: 40, height: 20 }
  await render(
    <div dir="rtl">
      <Popover
        key="rtl"
        defaultOpen
        anchor={rect}
      >
        <Panel />
      </Popover>
    </div>
  )
  const rtl = panelOf(host)
  expect(rtl.getAttribute('dir')).toBe('rtl')
  expect(rtl.dataset.side).toBe('bottom')
  near(rtl.getBoundingClientRect().right, rect.x + rect.width)
  expect(() => Tooltip({ anchor: { x: 0, y: 0, width: -1, height: 0 } })).toThrow(TypeError)
})

test('rects, getters and SVG transforms reposition on change, scroll and resize', async () => {
  const { host, render } = await mount(
    <Popover
      defaultOpen
      anchor={{ x: 100, y: 100, width: 10, height: 10 }}
    >
      <Panel />
    </Popover>
  )
  const panel = panelOf(host)
  near(panel.getBoundingClientRect().left, 100)
  await render(
    <Popover
      defaultOpen
      anchor={{ x: 250, y: 160, width: 10, height: 10 }}
    >
      <Panel />
    </Popover>
  )
  near(panel.getBoundingClientRect().left, 250)
  near(panel.getBoundingClientRect().top, 178)

  let box = { x: 40, y: 40, width: 0, height: 0 }
  const getter: PopoverAnchor = () => box
  await render(
    <Popover
      key="getter"
      defaultOpen
      anchor={getter}
    >
      <Panel />
    </Popover>
  )
  const live = panelOf(host)
  near(live.getBoundingClientRect().left, 40)
  box = { x: 140, y: 40, width: 0, height: 0 }
  await act(async () => window.dispatchEvent(new Event('resize')))
  await frame()
  near(live.getBoundingClientRect().left, 140)

  const drawing = (transform?: string) => (
    <Drawing
      key="svg"
      transform={transform}
    >
      {anchor => (
        <Popover
          defaultOpen
          anchor={anchor}
        >
          <Panel />
        </Popover>
      )}
    </Drawing>
  )
  await render(drawing())
  const svgPanel = panelOf(host)
  const before = svgPanel.getBoundingClientRect().left
  // A pan applied outside React still moves the popup on the next frame.
  await act(async () => host.querySelector('g')!.setAttribute('transform', 'translate(120 0)'))
  await frame()
  await expect
    .poll(() => Math.abs(svgPanel.getBoundingClientRect().left - before - 120) < 1)
    .toBe(true)
})

test('focus returns to a focusable anchor, else to the prior focus, unless a return target is set', async () => {
  const { host, render } = await mount(
    <Drawing>
      {anchor => (
        <Popover
          defaultOpen
          anchor={anchor}
        >
          <Panel />
        </Popover>
      )}
    </Drawing>
  )
  const circle = host.querySelector('circle')!
  await act(async () => host.querySelector<HTMLElement>('[data-slot~=popover-close]')!.focus())
  await userEvent.keyboard('{Escape}')
  expect(shown(panelOf(host))).toBe(false)
  expect(document.activeElement).toBe(circle)

  function Prior({ returnTo }: { returnTo?: boolean }) {
    const [open, setOpen] = useState(false)
    const target = useRef<HTMLButtonElement>(null)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Before</Button>
        <Button ref={target}>Elsewhere</Button>
        <Drawing focusable={false}>
          {anchor => (
            <Popover
              open={open}
              onOpenChange={setOpen}
              anchor={anchor}
            >
              <Panel returnFocusRef={returnTo ? target : undefined} />
            </Popover>
          )}
        </Drawing>
      </>
    )
  }
  for (const returnTo of [false, true]) {
    await render(
      <Prior
        key={String(returnTo)}
        returnTo={returnTo}
      />
    )
    const before = host.querySelector<HTMLButtonElement>('button')!
    await userEvent.click(before)
    await act(async () => host.querySelector<HTMLElement>('[data-slot~=popover-close]')!.focus())
    await userEvent.keyboard('{Escape}')
    expect(document.activeElement?.textContent).toBe(returnTo ? 'Elsewhere' : 'Before')
  }
})

test('Tooltip and HoverCard follow SVG and rect anchors with theme and direction inheritance', async () => {
  const theme = defineTheme({
    id: 'anchor-hover-proof',
    name: 'Anchor hover proof',
    components: { popover: { width: '15rem' } }
  })
  const { host } = await mount(
    <ThemeScope theme={theme}>
      <div dir="rtl">
        <Drawing>
          {anchor => (
            <Tooltip
              defaultOpen
              anchor={anchor}
            >
              <TooltipPortal>
                <TooltipContent motion="off">Region</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}
        </Drawing>
        <HoverCard
          defaultOpen
          anchor={{ x: 500, y: 300, width: 20, height: 20 }}
        >
          <HoverCardPortal>
            <HoverCardContent motion="off">Preview</HoverCardContent>
          </HoverCardPortal>
        </HoverCard>
      </div>
    </ThemeScope>
  )
  const tip = host.querySelector<HTMLElement>('[role=tooltip]')!
  const circle = host.querySelector('circle')!.getBoundingClientRect()
  expect(shown(tip)).toBe(true)
  expect(tip.closest('svg')).toBeNull()
  expect(tip.getAttribute('dir')).toBe('rtl')
  expect(tip.dataset.side).toBe('top')
  near(tip.getBoundingClientRect().bottom, circle.top - 8)
  const tipCenter = (tip.getBoundingClientRect().left + tip.getBoundingClientRect().right) / 2
  near(tipCenter, (circle.left + circle.right) / 2)
  const card = host.querySelector<HTMLElement>('[data-slot~=hover-card-content]')!
  expect(shown(card)).toBe(true)
  expect(getComputedStyle(card).width).toBe('240px')
  expect(card.getAttribute('dir')).toBe('rtl')
  near(card.getBoundingClientRect().right, 520)
  near(card.getBoundingClientRect().top, 328)
})
