import { act } from 'react'
import { renderToString } from 'react-dom/server'
import { expect, test } from 'vitest'
import { commands, page } from 'vitest/browser'
import { AnnotatedText, type AnnotatedTextProps } from '../../src/index.js'
import { key, mount } from './familyHarness.js'

const parts = (host: ParentNode, slot: string) =>
  Array.from(host.querySelectorAll<HTMLElement>(`[data-slot~="${slot}"]`))
const box = (node: Element) => node.getBoundingClientRect()
const frames = () =>
  new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )
const frame = () => act(frames)
/** Changes the page outside React and waits for the arcs to redraw, all inside act. */
const change = (update: () => void) =>
  act(async () => {
    update()
    await frames()
    await frames()
  })

const sentence: AnnotatedTextProps = {
  'aria-label': 'Review',
  tokens: [
    { text: 'The', labels: ['determiner'] },
    { text: 'committee', labels: ['noun', 'subject head'] },
    { text: 'approved', labels: ['verb'] },
    { text: 'the', labels: ['determiner'] },
    { text: 'revised', labels: ['adjective'] },
    { text: 'budget', labels: ['noun'] },
    { text: 'on', labels: ['preposition'] },
    { text: 'Friday', labels: ['noun'] }
  ],
  spans: [
    { start: 0, end: 1, label: 'Organization', series: 1 },
    { start: 3, end: 5, label: 'Document', series: 3 },
    { start: 4, end: 5, label: 'Changed item', series: 4 },
    { start: 5, end: 7, label: 'Overlap', series: 7 }
  ],
  arcs: [
    { from: 2, to: 1, label: 'agent' },
    { from: 2, to: 5, label: 'theme' },
    { from: 2, to: 7, label: 'time' }
  ]
}

/** Path start and end points in the arc layer, read from the drawn geometry. */
function ends(path: SVGPathElement) {
  const length = path.getTotalLength()
  const a = path.getPointAtLength(0),
    b = path.getPointAtLength(length)
  return { start: { x: a.x, y: a.y }, end: { x: b.x, y: b.y } }
}

/** A token's text box in the arc layer's coordinates. */
function textBox(host: HTMLElement, index: number) {
  const layer = box(parts(host, 'annotated-text-arcs')[0]!)
  const text = box(parts(host, 'annotated-text-token-text')[index]!)
  return {
    left: text.left - layer.left,
    right: text.right - layer.left,
    top: text.top - layer.top
  }
}

test('one token is in the tab order and arrow keys, Home and End move between tokens', async () => {
  const { host } = await mount(
    <>
      <button type="button">Before</button>
      <AnnotatedText {...sentence} />
    </>
  )
  const tokens = parts(host, 'annotated-text-token')
  expect(tokens.map(token => token.tabIndex)).toEqual([0, -1, -1, -1, -1, -1, -1, -1])
  await act(async () => host.querySelector('button')!.focus())
  await key('{Tab}')
  expect(document.activeElement).toBe(tokens[0])
  await key('{ArrowRight}{ArrowRight}')
  expect(document.activeElement).toBe(tokens[2])
  expect(tokens[2]!.tabIndex).toBe(0)
  await key('{End}')
  expect(document.activeElement).toBe(tokens[7])
  await key('{ArrowRight}')
  expect(document.activeElement).toBe(tokens[7])
  await key('{Home}')
  expect(document.activeElement).toBe(tokens[0])
  await key('{ArrowLeft}')
  expect(document.activeElement).toBe(tokens[0])
})

test('a caller keydown handler that prevents default keeps focus on the token', async () => {
  const { host } = await mount(
    <AnnotatedText
      {...sentence}
      onKeyDown={event => event.preventDefault()}
    />
  )
  const tokens = parts(host, 'annotated-text-token')
  await act(async () => tokens[0]!.focus())
  await key('{ArrowRight}')
  expect(document.activeElement).toBe(tokens[0])
})

test('a token announces its text, labels, spans and arcs', async () => {
  const { host } = await mount(<AnnotatedText {...sentence} />)
  const group = page.getByRole('group', { name: 'Review' })
  await expect.element(group).toBeInTheDocument()
  await expect.element(page.getByRole('list')).toBeInTheDocument()
  const committee = page.getByRole('listitem', { name: 'committee' })
  await expect
    .element(committee)
    .toHaveAccessibleDescription('noun, subject head. Organization. approved → committee: agent')
  await expect
    .element(page.getByRole('listitem', { name: 'approved' }))
    .toHaveAccessibleDescription(
      'verb. approved → committee: agent. approved → budget: theme. approved → Friday: time'
    )
  await expect
    .element(page.getByRole('listitem', { name: 'budget' }))
    .toHaveAccessibleDescription('noun. Document. Changed item. Overlap. approved → budget: theme')
  expect(parts(host, 'annotated-text-arcs')[0]!.getAttribute('aria-hidden')).toBe('true')
  // Browse mode reads the description once: it is visually hidden text inside the token, and
  // the visible labels and span tags it repeats are hidden from assistive technology.
  const token = parts(host, 'annotated-text-token')[1]!
  const description = parts(token, 'annotated-text-description')[0]!
  expect(token.getAttribute('aria-describedby')).toBe(description.id)
  expect(description.hidden).toBe(false)
  expect(description.closest('[aria-hidden]')).toBeNull()
  expect(box(description).width).toBeLessThanOrEqual(1)
  for (const visible of [
    ...parts(token, 'annotated-text-label'),
    ...parts(token, 'annotated-text-span')
  ])
    expect(visible.getAttribute('aria-hidden')).toBe('true')
})

test('arcText words what each arc announces', async () => {
  await mount(
    <AnnotatedText
      {...sentence}
      arcText={({ from, to, label }) => `${label ?? 'link'} from ${from} to ${to}`}
    />
  )
  await expect
    .element(page.getByRole('listitem', { name: 'committee' }))
    .toHaveAccessibleDescription(
      'noun, subject head. Organization. agent from approved to committee'
    )
})

test('arcs that meet one token never rise through a lower arc', async () => {
  const { host } = await mount(
    <div style={{ width: '720px' }}>
      <AnnotatedText {...sentence} />
    </div>
  )
  await frame()
  // At "approved": agent goes left (level 1); theme (level 1) and time (level 2) go right.
  const start = (index: number) =>
    ends(parts(host, 'annotated-text-arc')[index]!.querySelector('path')!).start
  const agent = start(0),
    theme = start(1),
    time = start(2)
  expect(agent.x).toBeLessThan(time.x)
  expect(time.x).toBeLessThan(theme.x)
  // The taller arc rises left of the lower arc's top, which runs rightward from its own start.
  const themeEnd = ends(parts(host, 'annotated-text-arc')[1]!.querySelector('path')!).end
  expect(time.x < Math.min(theme.x, themeEnd.x) || time.x > Math.max(theme.x, themeEnd.x)).toBe(
    true
  )
})

test('overlapping and nested spans take separate lanes with series colors', async () => {
  const { host } = await mount(
    <div style={{ width: '720px' }}>
      <AnnotatedText {...sentence} />
    </div>
  )
  const spans = parts(host, 'annotated-text-span')
  const segments = (index: number) => spans.filter(span => span.dataset.span === String(index))
  // Document covers 3 to 5, Changed item 4 to 5 inside it, Overlap 5 to 7 across both.
  expect(segments(1)).toHaveLength(3)
  expect(segments(2)).toHaveLength(2)
  expect(segments(3)).toHaveLength(3)
  const lane = (index: number) => box(segments(index)[0]!).top
  const budget = (index: number) =>
    box(segments(index).find(span => span.closest('li')!.dataset.index === '5')!)
  // The nested span sits nearer the text than the span around it; overlapping spans never share a lane.
  expect(lane(2)).toBeLessThan(lane(1))
  const atBudget = [1, 2, 3].map(budget).map(rect => rect.top)
  expect(new Set(atBudget).size).toBe(3)
  // Only the first token of a span shows its label, and a span is one band across its tokens.
  expect(segments(1).map(span => span.textContent)).toEqual(['Document', '', ''])
  expect(segments(1)[0]!.hasAttribute('data-start')).toBe(true)
  expect(segments(1)[2]!.hasAttribute('data-end')).toBe(true)
  expect(box(segments(1)[0]!).right).toBeCloseTo(box(segments(1)[1]!).left, 0)
  const style = getComputedStyle(segments(1)[0]!)
  const probe = document.createElement('span')
  probe.style.color = 'var(--rad-series-3-text)'
  host.append(probe)
  expect(style.color).toBe(getComputedStyle(probe).color)
  probe.remove()
})

test('stacked labels sit below each token in aligned rows', async () => {
  const { host } = await mount(
    <div style={{ width: '720px' }}>
      <AnnotatedText
        aria-label="Log"
        tokens={[
          { text: 'GET', labels: ['method'] },
          { text: '/orders', labels: ['path', 'order list'] },
          { text: '200', labels: ['status', 'OK'] }
        ]}
      />
    </div>
  )
  const tokens = parts(host, 'annotated-text-token')
  const rows = tokens.map(token => parts(token, 'annotated-text-label'))
  // Every token has the same number of rows, so later rows line up across tokens.
  expect(rows.map(row => row.length)).toEqual([2, 2, 2])
  expect(rows.map(row => row.map(label => label.textContent))).toEqual([
    ['method', ''],
    ['path', 'order list'],
    ['status', 'OK']
  ])
  const text = parts(host, 'annotated-text-token-text')
  for (const [index, row] of rows.entries()) {
    expect(box(row[0]!).top).toBeGreaterThanOrEqual(box(text[index]!).bottom - 1)
    expect(box(row[1]!).top).toBeCloseTo(box(rows[0]![1]!).top, 0)
  }
  expect(rows[0]![1]!.getAttribute('aria-hidden')).toBe('true')
})

test('arcs land on their tokens and follow the wrap at 360px', async () => {
  const { host, render } = await mount(
    <div style={{ width: '720px' }}>
      <AnnotatedText {...sentence} />
    </div>
  )
  await frame()
  const arcs = () => parts(host, 'annotated-text-arc')
  expect(arcs()).toHaveLength(3)
  const tops = () => parts(host, 'annotated-text-token-text').map(text => box(text).top)
  expect(new Set(tops()).size).toBe(1)
  // At 720px every arc is one bracket from its token to its target, above the text.
  for (const arc of arcs()) {
    const paths = arc.querySelectorAll('path:not(:last-of-type)')
    expect(paths).toHaveLength(1)
    const { start, end } = ends(paths[0] as SVGPathElement)
    const from = textBox(host, Number(arc.dataset.from)),
      to = textBox(host, Number(arc.dataset.to))
    expect(start.x).toBeGreaterThan(from.left)
    expect(start.x).toBeLessThan(from.right)
    expect(end.x).toBeGreaterThan(to.left)
    expect(end.x).toBeLessThan(to.right)
    expect(start.y).toBeCloseTo(from.top - 1, 0)
  }
  // The arc that spans another is drawn higher.
  const apex = (arc: HTMLElement) => Number(arc.querySelector('text')!.getAttribute('y'))
  expect(apex(arcs()[2]!)).toBeLessThan(apex(arcs()[1]!))

  await render(
    <div style={{ width: '360px' }}>
      <AnnotatedText {...sentence} />
    </div>
  )
  await frame()
  const lines = [...new Set(tops())]
  expect(lines.length).toBeGreaterThan(1)
  // approved → Friday now crosses a wrap: it leaves toward the line end and enters from the next line start.
  const friday = arcs()[2]!
  const pieces = Array.from(friday.querySelectorAll<SVGPathElement>('path:not(:last-of-type)'))
  expect(pieces).toHaveLength(2)
  const list = box(parts(host, 'annotated-text-tokens')[0]!)
  const layer = box(parts(host, 'annotated-text-arcs')[0]!)
  const from = textBox(host, 2),
    to = textBox(host, 7)
  expect(to.top).toBeGreaterThan(from.top)
  const first = ends(pieces[0]!),
    second = ends(pieces[1]!)
  expect(first.start.y).toBeCloseTo(from.top - 1, 0)
  expect(first.end.x).toBeCloseTo(list.right - layer.left, 0)
  expect(second.start.y).toBeCloseTo(to.top - 1, 0)
  expect(second.end.x).toBeCloseTo(list.left - layer.left, 0)
  expect(second.start.x).toBeGreaterThan(to.left)
  expect(second.start.x).toBeLessThan(to.right)
})

test('arcs redraw when the host resizes without a rerender', async () => {
  const { host } = await mount(
    <div style={{ width: '720px' }}>
      <AnnotatedText {...sentence} />
    </div>
  )
  await frame()
  const path = () => parts(host, 'annotated-text-arc')[2]!.querySelectorAll('path').length
  expect(path()).toBe(2)
  await change(() => {
    ;(host.firstElementChild as HTMLElement).style.width = '360px'
  })
  expect(path()).toBe(3)
  const to = textBox(host, 7)
  const second = ends(parts(host, 'annotated-text-arc')[2]!.querySelectorAll('path')[1]!)
  expect(second.start.x).toBeGreaterThan(to.left)
  expect(second.start.x).toBeLessThan(to.right)
})

test('in right-to-left text tokens, spans, arrow keys and wrapped arcs follow the reading direction', async () => {
  const { host } = await mount(
    <div
      dir="rtl"
      style={{ width: '360px' }}
    >
      <AnnotatedText {...sentence} />
    </div>
  )
  await frame()
  const text = parts(host, 'annotated-text-token-text')
  expect(box(text[1]!).right).toBeLessThan(box(text[0]!).left)
  // Organization covers the first two tokens: its band runs leftward from its labelled start.
  const band = parts(host, 'annotated-text-span').filter(span => span.dataset.span === '0')
  expect(band[0]!.textContent).toBe('Organization')
  expect(box(band[0]!).left).toBeCloseTo(box(band[1]!).right, 0)
  const tokens = parts(host, 'annotated-text-token')
  await act(async () => tokens[0]!.focus())
  await key('{ArrowLeft}')
  expect(window.document.activeElement).toBe(tokens[1])
  await key('{ArrowRight}')
  expect(window.document.activeElement).toBe(tokens[0])

  const pieces = Array.from(
    parts(host, 'annotated-text-arc')[2]!.querySelectorAll<SVGPathElement>(
      'path:not(:last-of-type)'
    )
  )
  expect(pieces).toHaveLength(2)
  const list = box(parts(host, 'annotated-text-tokens')[0]!)
  const layer = box(parts(host, 'annotated-text-arcs')[0]!)
  // The line end is on the left in right-to-left text, and the next line starts on the right.
  expect(ends(pieces[0]!).end.x).toBeCloseTo(list.left - layer.left, 0)
  expect(ends(pieces[1]!).end.x).toBeCloseTo(list.right - layer.left, 0)
  const to = textBox(host, 7)
  expect(ends(pieces[1]!).start.x).toBeGreaterThan(to.left)
  expect(ends(pieces[1]!).start.x).toBeLessThan(to.right)

  // Switching direction after mount redraws the arcs.
  await change(() => {
    ;(host.firstElementChild as HTMLElement).dir = 'ltr'
  })
  const flipped = parts(host, 'annotated-text-arc')[2]!.querySelector('path')!
  expect(ends(flipped).end.x).toBeCloseTo(list.right - layer.left, 0)
})

test('focusing a token marks its arcs active', async () => {
  const { host } = await mount(<AnnotatedText {...sentence} />)
  await frame()
  await act(async () => parts(host, 'annotated-text-token')[1]!.focus())
  await frame()
  const active = parts(host, 'annotated-text-arc').map(arc => arc.hasAttribute('data-active'))
  expect(active).toEqual([true, false, false])
})

test('server markup hydrates without arcs, then draws them', async () => {
  const markup = renderToString(<AnnotatedText {...sentence} />)
  expect(markup).not.toContain('<path')
  const { host } = await mount(<AnnotatedText {...sentence} />, true)
  await frame()
  expect(parts(host, 'annotated-text-arc')).toHaveLength(3)
})

test('forced colors keep spans and arcs visible in system colors', async () => {
  await commands.emulatePreferences({ forcedColors: 'active' })
  try {
    const { host } = await mount(<AnnotatedText {...sentence} />)
    await frame()
    const span = parts(host, 'annotated-text-span')[0]!
    const probe = document.createElement('span')
    probe.style.color = 'CanvasText'
    host.append(probe)
    const canvasText = getComputedStyle(probe).color
    probe.remove()
    expect(getComputedStyle(span).borderTopColor).toBe(canvasText)
    const path = parts(host, 'annotated-text-arc')[0]!.querySelector('path')!
    expect(getComputedStyle(path).stroke).toBe(canvasText)
  } finally {
    await commands.emulatePreferences({ forcedColors: 'none' })
  }
})

test('invalid tokens, spans and arcs throw', () => {
  const tokens = [{ text: 'a' }, { text: 'b' }]
  const render = (props: Partial<AnnotatedTextProps>) => () =>
    renderToString(
      <AnnotatedText
        aria-label="x"
        tokens={tokens}
        {...props}
      />
    )
  expect(render({ tokens: [] })).toThrow(/at least one token/)
  expect(render({ spans: [{ start: 1, end: 0, label: 'x', series: 1 }] })).toThrow(/end before/)
  expect(render({ spans: [{ start: 0, end: 2, label: 'x', series: 1 }] })).toThrow(/token index/)
  expect(render({ spans: [{ start: 0, end: 1, label: ' ', series: 1 }] })).toThrow(/label/)
  expect(render({ spans: [{ start: 0, end: 1, label: 'x', series: 9 as never }] })).toThrow(
    /series/
  )
  expect(render({ arcs: [{ from: 0, to: 0 }] })).toThrow(/two different/)
  expect(render({ arcs: [{ from: 0, to: 3 }] })).toThrow(/token indexes/)
  expect(() =>
    renderToString(<AnnotatedText {...({ tokens } as unknown as AnnotatedTextProps)} />)
  ).toThrow(/aria-label or aria-labelledby/)
})
