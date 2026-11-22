import { act } from 'react'
import { renderToString } from 'react-dom/server'
import { expect, test, vi } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import {
  RegionStage,
  RegionStageControls,
  RegionStagePin,
  RegionStageRegion,
  RegionStageViewport,
  type RegionStageProps
} from '../../src/index.js'
import { key, mount, shown } from './familyHarness.js'

const click = (node: Element) => act(async () => userEvent.click(node))

const frames = (count = 3) =>
  act(
    () =>
      new Promise<void>(resolve => {
        const step = (left: number) =>
          left ? requestAnimationFrame(() => step(left - 1)) : resolve()
        step(count)
      })
  )
/** Changes a preference and lets observers that react to it run inside act. */
const prefer = (preferences: Parameters<typeof commands.emulatePreferences>[0]) =>
  act(async () => {
    await commands.emulatePreferences(preferences)
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })
const settle = () => act(() => new Promise<void>(resolve => setTimeout(resolve, 300)))

type Extra = Partial<Pick<RegionStageProps, 'type' | 'onValueChange' | 'dir'>> & {
  value?: string | null | string[]
  defaultValue?: string | null | string[]
  controls?: boolean
  pins?: boolean
  maxZoom?: number
}

function Plan({ controls = true, pins = false, ...props }: Extra) {
  return (
    <RegionStage
      aria-label="Floor plan"
      {...(props as object)}
    >
      {controls ? (
        <RegionStageControls
          zoomInLabel="Zoom in"
          zoomOutLabel="Zoom out"
          zoomResetLabel="Reset view"
        />
      ) : null}
      <RegionStageViewport viewBox="0 0 400 200">
        <RegionStageRegion
          value="a"
          aria-label="Lobby"
          series={1}
          d="M0 0h200v100H0z"
        />
        <RegionStageRegion
          value="b"
          aria-label="Kitchen"
          d="M200 0h200v100H200z"
        />
        <RegionStageRegion
          value="c"
          aria-label="Storage"
        >
          <rect
            x="0"
            y="100"
            width="400"
            height="100"
          />
        </RegionStageRegion>
        {pins ? (
          <RegionStagePin
            x={300}
            y={150}
            aria-label="Fire exit"
          >
            <p>North stairwell</p>
          </RegionStagePin>
        ) : null}
      </RegionStageViewport>
    </RegionStage>
  )
}

const parts = (host: ParentNode, slot: string) =>
  Array.from(host.querySelectorAll<SVGElement>(`[data-slot~="${slot}"]`))
const content = (host: ParentNode) => parts(host, 'region-stage-content')[0]!
const view = (host: ParentNode) => {
  const matrix = (content(host) as SVGGElement).transform.baseVal.consolidate()!.matrix
  return { zoom: matrix.a, x: matrix.e, y: matrix.f }
}
const svgOf = (host: ParentNode) => parts(host, 'region-stage-viewport')[0] as SVGSVGElement
const region = (name: string) => page.getByRole('button', { name }).element() as SVGGElement

function pointer(
  target: Element,
  type: string,
  id: number,
  x: number,
  y: number,
  pointerType = 'mouse'
) {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerId: id,
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
      pointerType,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      isPrimary: id === 1
    })
  )
}

test('regions take one tab stop, move in document order and toggle single selection', async () => {
  const onValueChange = vi.fn()
  await mount(
    <>
      <button type="button">Before</button>
      <Plan
        controls={false}
        onValueChange={onValueChange}
      />
    </>
  )
  await act(async () => page.getByRole('button', { name: 'Before' }).element().focus())
  await key('{Tab}')
  expect(document.activeElement).toBe(region('Lobby'))
  expect(region('Lobby')).toHaveAccessibleName('Lobby')
  await key('{ArrowRight}')
  expect(document.activeElement).toBe(region('Kitchen'))
  await key('{End}')
  expect(document.activeElement).toBe(region('Storage'))
  await key('{ArrowUp}')
  expect(document.activeElement).toBe(region('Kitchen'))
  await key('{Enter}')
  expect(onValueChange).toHaveBeenLastCalledWith('b')
  expect(region('Kitchen')).toHaveAttribute('aria-pressed', 'true')
  await key('{Home}')
  await key(' ')
  expect(onValueChange).toHaveBeenLastCalledWith('a')
  expect(region('Kitchen')).toHaveAttribute('aria-pressed', 'false')
  // The tab stop stays on the last focused item.
  await key('{Shift>}{Tab}{/Shift}')
  await key('{Tab}')
  expect(document.activeElement).toBe(region('Lobby'))
  await click(region('Lobby'))
  expect(onValueChange).toHaveBeenLastCalledWith(null)
})

test('multiple selection adds and removes values; RTL swaps left and right', async () => {
  const onValueChange = vi.fn()
  await mount(
    <Plan
      type="multiple"
      defaultValue={['c']}
      onValueChange={onValueChange}
      dir="rtl"
    />
  )
  expect(region('Storage').tabIndex).toBe(0)
  await click(region('Lobby'))
  expect(onValueChange).toHaveBeenLastCalledWith(['c', 'a'])
  await key('{ArrowLeft}')
  expect(document.activeElement).toBe(region('Kitchen'))
  await key('{Enter}')
  expect(onValueChange).toHaveBeenLastCalledWith(['c', 'a', 'b'])
  await click(region('Storage'))
  expect(onValueChange).toHaveBeenLastCalledWith(['a', 'b'])
})

test('keys and buttons zoom, pan and reset; buttons report their limits', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const { host } = await mount(<Plan maxZoom={2.25} />)
  const zoomIn = page.getByRole('button', { name: 'Zoom in' }).element()
  const zoomOut = page.getByRole('button', { name: 'Zoom out' }).element()
  const reset = page.getByRole('button', { name: 'Reset view' }).element()
  expect(zoomOut).toHaveAttribute('aria-disabled', 'true')
  expect(reset).toHaveAttribute('aria-disabled', 'true')
  await click(zoomIn)
  expect(view(host).zoom).toBeCloseTo(1.5)
  // Zooming at the center keeps it centered.
  expect(view(host).x).toBeCloseTo(-100)
  await act(async () => region('Lobby').focus())
  await key('+')
  expect(view(host).zoom).toBeCloseTo(2.25)
  expect(zoomIn).toHaveAttribute('aria-disabled', 'true')
  await act(async () => (zoomIn as HTMLElement).click())
  expect(view(host).zoom).toBeCloseTo(2.25)
  await act(async () => region('Lobby').focus())
  const before = view(host)
  await key('{Shift>}{ArrowLeft}{/Shift}')
  expect(view(host).x).toBeCloseTo(before.x + 40)
  // Plain arrows move between regions; the next one pans into view.
  await key('{ArrowRight}')
  expect(document.activeElement).toBe(region('Kitchen'))
  expect(view(host).x).toBeCloseTo(200 - 300 * 2.25)
  await key('-')
  expect(view(host).zoom).toBeCloseTo(1.5)
  await key('0')
  expect(view(host)).toEqual({ zoom: 1, x: 0, y: 0 })
  await click(zoomIn)
  await click(reset)
  expect(view(host)).toEqual({ zoom: 1, x: 0, y: 0 })
  expect(document.activeElement).toBe(reset)
})

test('animated view changes ease over frames unless motion is reduced', async () => {
  const { host } = await mount(<Plan />)
  await click(page.getByRole('button', { name: 'Zoom in' }).element())
  expect(view(host).zoom).toBeLessThan(1.5)
  await settle()
  expect(view(host).zoom).toBeCloseTo(1.5)
})

function wheelOn(svg: SVGSVGElement, init: WheelEventInit) {
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init })
  act(() => {
    svg.dispatchEvent(event)
  })
  return event
}

test('Ctrl or Meta with the wheel zooms around the pointer; a plain wheel pans once zoomed', async () => {
  const { host } = await mount(<Plan />)
  const svg = svgOf(host)
  const rect = svg.getBoundingClientRect()
  const at = { clientX: rect.left + 1, clientY: rect.top + 1 }
  // At zoom 1 a plain wheel scrolls the page.
  expect(wheelOn(svg, { ...at, deltaY: 100 }).defaultPrevented).toBe(false)
  expect(view(host).zoom).toBe(1)
  // Ctrl never zooms the page, even at a limit.
  expect(wheelOn(svg, { ...at, deltaY: 100, ctrlKey: true }).defaultPrevented).toBe(true)
  expect(wheelOn(svg, { ...at, deltaY: -40, ctrlKey: true }).defaultPrevented).toBe(true)
  const zoomed = view(host)
  expect(zoomed.zoom).toBeCloseTo(Math.exp(0.4))
  // The point under the pointer stays put.
  const scale = svg.getScreenCTM()!.a / zoomed.zoom
  expect(zoomed.x).toBeCloseTo(0, 0)
  expect(zoomed.y).toBeCloseTo(0, 0)
  expect(scale).toBeGreaterThan(0)
  expect(wheelOn(svg, { ...at, deltaY: -40, metaKey: true }).defaultPrevented).toBe(true)
  expect(view(host).zoom).toBeCloseTo(Math.exp(0.8))
  // Once zoomed, a plain wheel pans; at the edge it lets the page scroll.
  const before = view(host)
  expect(wheelOn(svg, { ...at, deltaX: 20, deltaY: 10 }).defaultPrevented).toBe(true)
  const ctm = svg.getScreenCTM()!
  expect(view(host).x).toBeCloseTo(before.x - 20 / ctm.a)
  expect(view(host).y).toBeCloseTo(before.y - 10 / ctm.d)
  expect(wheelOn(svg, { ...at, deltaY: -10000 }).defaultPrevented).toBe(true)
  expect(wheelOn(svg, { ...at, deltaY: -10 }).defaultPrevented).toBe(false)
  wheelOn(svg, { ...at, deltaY: 1000, ctrlKey: true })
  expect(view(host).zoom).toBe(1)
})

test('a viewBox away from the origin keeps the point under the wheel and the drag', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const { host } = await mount(
    <RegionStage aria-label="Offset plan">
      <RegionStageViewport
        viewBox="100 50 400 200"
        style={{ borderWidth: '6px' }}
      >
        <RegionStageRegion
          value="corner"
          aria-label="Corner"
          d="M100 50h40v40h-40z"
        />
        <RegionStageRegion
          value="far"
          aria-label="Far"
          d="M300 150h40v40h-40z"
        />
      </RegionStageViewport>
    </RegionStage>
  )
  const svg = svgOf(host)
  const far = region('Far')
  const start = far.getBoundingClientRect()
  wheelOn(svg, { clientX: start.left, clientY: start.top, deltaY: -60, ctrlKey: true })
  expect(view(host).zoom).toBeGreaterThan(1.5)
  const zoomed = far.getBoundingClientRect()
  expect(zoomed.left).toBeCloseTo(start.left, 0)
  expect(zoomed.top).toBeCloseTo(start.top, 0)
  await act(async () => {
    pointer(far, 'pointerdown', 1, zoomed.left + 5, zoomed.top + 5)
    pointer(far, 'pointermove', 1, zoomed.left + 25, zoomed.top + 15)
    pointer(far, 'pointerup', 1, zoomed.left + 25, zoomed.top + 15)
  })
  const dragged = far.getBoundingClientRect()
  expect(dragged.left - zoomed.left).toBeCloseTo(20, 0)
  expect(dragged.top - zoomed.top).toBeCloseTo(10, 0)
})

test('touch scrolls the page at zoom 1 and pans the drawing once zoomed', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const { host } = await mount(<Plan />)
  const svg = svgOf(host)
  expect(getComputedStyle(svg).touchAction).toBe('pan-x pan-y')
  expect(getComputedStyle(svg).cursor).not.toBe('grab')
  await click(page.getByRole('button', { name: 'Zoom in' }).element())
  expect(getComputedStyle(svg).touchAction).toBe('none')
  expect(getComputedStyle(svg).cursor).toBe('grab')
})

test('pointer drag pans without selecting, and a pinch zooms', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const onValueChange = vi.fn()
  const { host } = await mount(<Plan onValueChange={onValueChange} />)
  await click(page.getByRole('button', { name: 'Zoom in' }).element())
  const svg = svgOf(host)
  const scale = svg.getScreenCTM()!.a
  const lobby = region('Lobby')
  const box = lobby.getBoundingClientRect()
  const start = { x: box.left + 20, y: box.top + 20 }
  await act(async () => {
    pointer(lobby, 'pointerdown', 1, start.x, start.y)
    pointer(lobby, 'pointermove', 1, start.x + 2, start.y)
    pointer(lobby, 'pointermove', 1, start.x + 30, start.y + 10)
    pointer(lobby, 'pointerup', 1, start.x + 30, start.y + 10)
    lobby.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
  expect(view(host).x).toBeCloseTo(-100 + 30 / scale, 1)
  expect(view(host).y).toBeCloseTo(-50 + 10 / scale, 1)
  expect(onValueChange).not.toHaveBeenCalled()
  // A click without movement still selects.
  await click(lobby)
  expect(onValueChange).toHaveBeenLastCalledWith('a')

  await click(page.getByRole('button', { name: 'Reset view' }).element())
  const middle = svg.getBoundingClientRect()
  const cy = middle.top + middle.height / 2,
    cx = middle.left + middle.width / 2
  await act(async () => {
    pointer(svg, 'pointerdown', 1, cx - 20, cy, 'touch')
    pointer(svg, 'pointerdown', 2, cx + 20, cy, 'touch')
    pointer(svg, 'pointermove', 2, cx + 60, cy, 'touch')
    pointer(svg, 'pointerup', 1, cx - 20, cy, 'touch')
    pointer(svg, 'pointerup', 2, cx + 60, cy, 'touch')
  })
  expect(view(host).zoom).toBeCloseTo(2, 1)
})

test('a pointer released outside the drawing or cancelled ends the gesture', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const onValueChange = vi.fn()
  const { host } = await mount(<Plan onValueChange={onValueChange} />)
  await click(page.getByRole('button', { name: 'Zoom in' }).element())
  const svg = svgOf(host)
  const lobby = region('Lobby')
  const box = lobby.getBoundingClientRect()
  const x = box.left + 20,
    y = box.top + 20
  // Released outside: the document sees the pointerup.
  await act(async () => {
    pointer(lobby, 'pointerdown', 1, x, y)
    pointer(lobby, 'pointermove', 1, x + 30, y)
    pointer(document.body, 'pointerup', 1, x + 300, y)
  })
  expect(svg).not.toHaveAttribute('data-panning')
  let still = view(host)
  await act(async () => pointer(lobby, 'pointermove', 1, x + 60, y))
  expect(view(host)).toEqual(still)
  // Released outside the window: the next move has no buttons.
  await act(async () => {
    pointer(lobby, 'pointerdown', 2, x, y)
    lobby.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: 2,
        clientX: x + 40,
        clientY: y,
        bubbles: true,
        pointerType: 'mouse',
        buttons: 0
      })
    )
  })
  still = view(host)
  await act(async () => pointer(lobby, 'pointermove', 2, x + 80, y))
  expect(view(host)).toEqual(still)
  await click(lobby)
  expect(onValueChange).toHaveBeenLastCalledWith('a')
  // Cancelled: the gesture ends and the next click is not swallowed.
  await act(async () => {
    pointer(lobby, 'pointerdown', 3, x, y)
    pointer(lobby, 'pointermove', 3, x + 30, y)
    pointer(lobby, 'pointercancel', 3, x + 30, y)
  })
  expect(svg).not.toHaveAttribute('data-panning')
  await click(lobby)
  expect(onValueChange).toHaveBeenLastCalledWith(null)
})

test('a second finger starts the drag at once', async () => {
  const { host } = await mount(<Plan />)
  const svg = svgOf(host)
  const rect = svg.getBoundingClientRect()
  const cy = rect.top + rect.height / 2,
    cx = rect.left + rect.width / 2
  await act(async () => {
    pointer(svg, 'pointerdown', 1, cx - 20, cy, 'touch')
    pointer(svg, 'pointerdown', 2, cx + 20, cy, 'touch')
  })
  expect(svg).toHaveAttribute('data-panning')
  await act(async () => {
    pointer(svg, 'pointerup', 1, cx - 20, cy, 'touch')
    pointer(svg, 'pointerup', 2, cx + 20, cy, 'touch')
  })
  expect(svg).not.toHaveAttribute('data-panning')
})

test('a focused region outside the view pans into it', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const { host } = await mount(<Plan />)
  await act(async () => region('Lobby').focus())
  await key('+')
  await key('+')
  await key('{End}')
  const svg = svgOf(host).getBoundingClientRect()
  const storage = region('Storage').getBoundingClientRect()
  expect(storage.bottom).toBeGreaterThan(svg.top)
  expect(storage.top).toBeLessThan(svg.bottom)
  // Storage's center, at content y 150, moves to the viewport's center.
  expect(view(host).y).toBeCloseTo(100 - 150 * 2.25)
})

test('pins open callouts named by the pin that follow the view', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const { host } = await mount(<Plan pins />)
  const pin = page.getByRole('button', { name: 'Fire exit' }).element() as SVGGElement
  expect(pin).toHaveAttribute('aria-expanded', 'false')
  // The marker keeps its screen size while zooming.
  const size = pin.getBoundingClientRect().width
  await click(pin)
  const callout = page.getByRole('dialog', { name: 'Fire exit' }).element() as HTMLElement
  expect(shown(callout)).toBe(true)
  expect(pin).toHaveAttribute('aria-controls', callout.id)
  expect(callout).toHaveAttribute('data-slot', 'popover-content region-stage-callout')
  const before = callout.getBoundingClientRect()
  await act(async () => pin.focus())
  await key('{Shift>}{ArrowRight}{/Shift}')
  await frames()
  await key('+')
  await frames()
  expect(pin.getBoundingClientRect().width).toBeCloseTo(size, 0)
  const after = callout.getBoundingClientRect()
  expect(after.left).not.toBeCloseTo(before.left, 0)
  const marker = pin.getBoundingClientRect()
  expect(after.bottom).toBeLessThanOrEqual(marker.top)
  await key('{Escape}')
  expect(shown(callout)).toBe(false)
  expect(document.activeElement).toBe(pin)
  // Regions and pins share the roving order.
  await key('{Home}')
  await key('{End}')
  expect(document.activeElement).toBe(pin)
  expect(host.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
})

test('a callout closes when its pin leaves the view; a pin without one is an image', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  await mount(
    <RegionStage aria-label="Plan">
      <RegionStageViewport viewBox="0 0 400 200">
        <RegionStageRegion
          value="a"
          aria-label="Lobby"
          d="M0 0h400v200H0z"
        />
        <RegionStagePin
          x={380}
          y={20}
          aria-label="Exit"
        >
          Stairs
        </RegionStagePin>
        <RegionStagePin
          x={20}
          y={20}
          aria-label="Desk"
        />
      </RegionStageViewport>
    </RegionStage>
  )
  const desk = page.getByRole('img', { name: 'Desk' }).element()
  expect(desk).not.toHaveAttribute('aria-expanded')
  const exit = page.getByRole('button', { name: 'Exit' }).element()
  await click(exit)
  const callout = page.getByRole('dialog', { name: 'Exit' }).element() as HTMLElement
  expect(shown(callout)).toBe(true)
  await act(async () => region('Lobby').focus())
  // Zooming at the center pushes the corner pin out of the view.
  await key('+')
  await key('+')
  await frames()
  expect(shown(callout)).toBe(false)
  expect(exit).toHaveAttribute('aria-expanded', 'false')
})

test('without regions the viewport takes focus and plain arrows pan', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const { host } = await mount(
    <RegionStage aria-label="Photo">
      <RegionStageViewport viewBox="0 0 100 100">
        <rect
          width="100"
          height="100"
        />
      </RegionStageViewport>
    </RegionStage>
  )
  const svg = page.getByRole('img', { name: 'Photo' }).element() as SVGSVGElement
  expect(svg.tabIndex).toBe(0)
  // The image carries the name alone; the host is no longer a named group.
  const root = parts(host, 'region-stage')[0]!
  expect(root).not.toHaveAttribute('role')
  expect(root).not.toHaveAttribute('aria-label')
  await act(async () => svg.focus())
  await key('=')
  await key('{ArrowUp}')
  expect(view(host)).toMatchObject({ zoom: 1.5 })
  expect(view(host).y).toBeCloseTo(-25 + 10)
})

test('the drawing fits a narrow container', async () => {
  const { host } = await mount(
    <div style={{ width: '200px' }}>
      <Plan pins />
    </div>
  )
  const root = parts(host, 'region-stage')[0] as unknown as HTMLElement
  expect(root.scrollWidth).toBeLessThanOrEqual(200)
  expect(svgOf(host).getBoundingClientRect().width).toBeLessThanOrEqual(200)
  const controls = parts(host, 'region-stage-controls')[0] as unknown as HTMLElement
  expect(controls.getBoundingClientRect().right).toBeLessThanOrEqual(
    root.getBoundingClientRect().right + 0.5
  )
})

test('forced colors draw regions in system colors', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  await mount(<Plan defaultValue="a" />)
  const normal = getComputedStyle(region('Kitchen')).stroke
  await prefer({ forcedColors: 'active' })
  try {
    const probe = document.createElement('div')
    probe.style.color = 'CanvasText'
    probe.style.backgroundColor = 'Highlight'
    document.body.append(probe)
    const system = getComputedStyle(probe)
    expect(getComputedStyle(region('Kitchen')).stroke).toBe(system.color)
    expect(getComputedStyle(region('Kitchen')).stroke).not.toBe(normal)
    expect(getComputedStyle(region('Lobby')).fill).toBe(system.backgroundColor)
    probe.remove()
  } finally {
    await prefer({ forcedColors: 'none' })
  }
})

test('server markup hydrates and then gives one item the tab stop', async () => {
  const tree = (
    <Plan
      pins
      defaultValue="b"
    />
  )
  const html = renderToString(tree)
  expect(html).toContain('data-slot="region-stage"')
  expect(html).toContain('transform="translate(0 0) scale(1)"')
  const { host } = await mount(tree, true)
  expect(region('Kitchen').tabIndex).toBe(0)
  expect(host.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
})

test('invalid props throw TypeErrors', async () => {
  const render = (node: React.ReactNode) => () => renderToString(node)
  expect(render(<RegionStage aria-label=" " />)).toThrow(TypeError)
  expect(
    render(
      <RegionStage aria-label="Plan">
        <RegionStageViewport viewBox="0 0 0 10" />
      </RegionStage>
    )
  ).toThrow(/viewBox/)
  expect(
    render(
      <RegionStage aria-label="Plan">
        <RegionStageControls
          zoomInLabel=""
          zoomOutLabel="Out"
          zoomResetLabel="Reset"
        />
      </RegionStage>
    )
  ).toThrow(/zoomInLabel/)
  expect(
    render(
      <RegionStage aria-label="Plan">
        <RegionStageViewport viewBox="0 0 10 10">
          <RegionStageRegion
            value="a"
            aria-label="A"
            d="M0 0h1v1z"
            series={9 as 1}
          />
        </RegionStageViewport>
      </RegionStage>
    )
  ).toThrow(/series/)
  expect(
    render(
      <RegionStage
        aria-label="Plan"
        maxZoom={0.5}
      />
    )
  ).toThrow(/maxZoom/)
})

test('focus and selection outlines draw above every shape', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const { host } = await mount(<Plan defaultValue="b" />)
  const outlines = parts(host, 'region-stage-outlines')[0]!
  expect(content(host).lastElementChild).toBe(outlines)
  const selected = parts(host, 'region-stage-selected-outline')
  expect(selected).toHaveLength(1)
  expect(selected[0]!.getAttribute('href')).toBe(`#${region('Kitchen').firstElementChild!.id}`)
  await click(region('Kitchen'))
  expect(parts(host, 'region-stage-selected-outline')).toHaveLength(0)
  await act(async () => region('Lobby').focus())
  await key('{ArrowRight}')
  const focus = parts(host, 'region-stage-focus-outline')
  expect(focus).toHaveLength(1)
  expect(focus[0]!.getAttribute('href')).toBe(`#${region('Kitchen').firstElementChild!.id}`)
  expect(getComputedStyle(focus[0]!).fill).toBe('none')
  const width = parseFloat(getComputedStyle(focus[0]!).strokeWidth)
  await prefer({ forcedColors: 'active' })
  try {
    const probe = document.createElement('div')
    probe.style.color = 'CanvasText'
    document.body.append(probe)
    expect(getComputedStyle(focus[0]!).stroke).toBe(getComputedStyle(probe).color)
    expect(parseFloat(getComputedStyle(focus[0]!).strokeWidth)).toBeGreaterThan(width)
    probe.remove()
  } finally {
    await prefer({ forcedColors: 'none' })
  }
  await key('{Tab}')
  expect(parts(host, 'region-stage-focus-outline')).toHaveLength(0)
})

test('a controlled owner may refuse a selection', async () => {
  const onValueChange = vi.fn()
  await mount(
    <Plan
      value="a"
      onValueChange={onValueChange}
    />
  )
  await click(region('Kitchen'))
  expect(onValueChange).toHaveBeenLastCalledWith('b')
  expect(region('Kitchen')).toHaveAttribute('aria-pressed', 'false')
  expect(region('Lobby')).toHaveAttribute('aria-pressed', 'true')
})

test('a lower maxZoom pulls the view back within it', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const { host, render } = await mount(<Plan maxZoom={4} />)
  await act(async () => region('Lobby').focus())
  await key('+')
  await key('+')
  await key('+')
  expect(view(host).zoom).toBeCloseTo(3.375)
  await render(<Plan maxZoom={2} />)
  expect(view(host).zoom).toBeCloseTo(2)
})

test('repeated region values throw', async () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    await expect(
      mount(
        <RegionStage aria-label="Plan">
          <RegionStageViewport viewBox="0 0 10 10">
            <RegionStageRegion
              value="a"
              aria-label="A"
              d="M0 0h5v5H0z"
            />
            <RegionStageRegion
              value="a"
              aria-label="Again"
              d="M5 0h5v5H5z"
            />
          </RegionStageViewport>
        </RegionStage>
      )
    ).rejects.toThrow(/unique/)
  } finally {
    errors.mockRestore()
  }
})
