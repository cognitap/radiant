import { act, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { expect, test } from 'vitest'
import { commands, page } from 'vitest/browser'
import {
  RelationGraph,
  type RelationGraphLayout,
  type RelationGraphProps
} from '../../src/index.js'
import { click, key, mount } from './familyHarness.js'

const parts = (host: ParentNode, slot: string) =>
  Array.from(host.querySelectorAll<HTMLElement>(`[data-slot~="${slot}"]`))
const box = (node: Element) => node.getBoundingClientRect()
const connectionText: RelationGraphProps['connectionText'] = ({ direction, node, edge }) =>
  `${direction === 'outgoing' ? 'to' : 'from'} ${node.label}${edge.label ? ` (${edge.label})` : ''}`

const org = {
  'aria-label': 'Organization',
  layout: 'tree',
  connectionText,
  nodes: [
    { id: 'head', label: 'Head' },
    { id: 'design', label: 'Design', series: 2 },
    { id: 'eng', label: 'Engineering', series: 3 },
    { id: 'research', label: 'Research' },
    { id: 'web', label: 'Web' },
    { id: 'platform', label: 'Platform' }
  ],
  edges: [
    { from: 'head', to: 'design', label: 'leads' },
    { from: 'head', to: 'eng', label: 'leads' },
    { from: 'design', to: 'research' },
    { from: 'eng', to: 'web' },
    { from: 'eng', to: 'platform' }
  ]
} satisfies RelationGraphProps

// Twelve nodes in a ring with a cycle back to the start, a chord and a loop.
const ring = Array.from({ length: 12 }, (_, index) => ({
  id: `n${index}`,
  label: `Node ${index + 1}`
}))
const cyclic = {
  'aria-label': 'Cycle',
  layout: 'circular',
  connectionText,
  nodes: ring,
  edges: [
    ...ring.map((node, index) => ({ from: node.id, to: ring[(index + 1) % ring.length]!.id })),
    { from: 'n0', to: 'n6', label: 'skip', description: 'Fastest' },
    { from: 'n3', to: 'n3', label: 'wait' }
  ]
} satisfies RelationGraphProps

const overlapping = (boxes: DOMRect[]) => {
  let count = 0
  for (let a = 0; a < boxes.length; a++)
    for (let b = a + 1; b < boxes.length; b++) {
      const p = boxes[a]!,
        q = boxes[b]!
      if (
        p.left < q.right - 0.5 &&
        q.left < p.right - 0.5 &&
        p.top < q.bottom - 0.5 &&
        q.top < p.bottom - 0.5
      )
        count++
    }
  return count
}

for (const layout of ['tree', 'layered', 'circular'] as RelationGraphLayout[])
  for (const width of [360, 720])
    test(`${layout} layout keeps nodes apart and edges on their nodes at ${width}px`, async () => {
      const { host } = await mount(
        <div style={{ width }}>
          <RelationGraph
            {...cyclic}
            layout={layout}
          />
        </div>
      )
      const nodes = parts(host, 'relation-graph-node')
      expect(overlapping(nodes.map(box))).toBe(0)
      const viewport = parts(host, 'relation-graph-viewport')[0]!
      expect(box(viewport).width).toBeLessThanOrEqual(width + 0.5)
      const canvas = box(parts(host, 'relation-graph-canvas')[0]!)
      for (const node of nodes) {
        expect(box(node).left).toBeGreaterThanOrEqual(canvas.left - 0.5)
        expect(box(node).right).toBeLessThanOrEqual(canvas.right + 0.5)
      }
      // Each arrowhead tip touches its target node's box.
      const byId = new Map(nodes.map(node => [node.dataset.id, box(node)]))
      for (const edge of parts(host, 'relation-graph-edge')) {
        const arrow = edge.querySelectorAll('path')[1]!.getBoundingClientRect()
        const target = byId.get(edge.dataset.to)!
        expect(arrow.right).toBeGreaterThanOrEqual(target.left - 1)
        expect(arrow.left).toBeLessThanOrEqual(target.right + 1)
        expect(arrow.bottom).toBeGreaterThanOrEqual(target.top - 1)
        expect(arrow.top).toBeLessThanOrEqual(target.bottom + 1)
      }
    })

// Two parents each send a labelled edge into one child, beside unlabelled edges into another.
const services = {
  'aria-label': 'Services',
  layout: 'layered',
  connectionText,
  nodes: [
    { id: 'web', label: 'Web app' },
    { id: 'legacy', label: 'Legacy export' },
    { id: 'gateway', label: 'API gateway' },
    { id: 'orders', label: 'Orders' },
    { id: 'billing', label: 'Billing' },
    { id: 'queue', label: 'Queue' },
    { id: 'database', label: 'Database' }
  ],
  edges: [
    { from: 'web', to: 'gateway', label: 'calls' },
    { from: 'gateway', to: 'orders' },
    { from: 'gateway', to: 'billing' },
    { from: 'orders', to: 'queue', label: 'enqueues' },
    { from: 'billing', to: 'queue', label: 'publishes' },
    { from: 'orders', to: 'database' },
    { from: 'billing', to: 'database' },
    { from: 'legacy', to: 'database' }
  ]
} satisfies RelationGraphProps
const converging = {
  'aria-label': 'Converging',
  layout: 'layered',
  connectionText,
  nodes: [
    { id: 'a', label: 'API' },
    { id: 'b', label: 'Jobs' },
    { id: 'c', label: 'Queue' }
  ],
  edges: [
    { from: 'a', to: 'c', label: 'publishes' },
    { from: 'b', to: 'c', label: 'enqueues' }
  ]
} satisfies RelationGraphProps

for (const graph of [converging, services])
  for (const width of [360, 720])
    test(`labels of edges into one node from different parents stay apart (${graph['aria-label']}, ${width}px)`, async () => {
      const { host } = await mount(
        <div style={{ width }}>
          <RelationGraph {...graph} />
        </div>
      )
      const labels = parts(host, 'relation-graph-edge-label').map(box)
      expect(labels).toHaveLength(graph.edges.filter(edge => edge.label).length)
      expect(overlapping(labels)).toBe(0)
      for (const node of parts(host, 'relation-graph-node'))
        expect(overlapping([...labels, box(node)])).toBe(0)
    })

test('layered layout puts each edge target below its source except edges closing a cycle', async () => {
  const { host } = await mount(
    <RelationGraph
      {...cyclic}
      layout="layered"
    />
  )
  const nodes = new Map(
    parts(host, 'relation-graph-node').map(node => [node.dataset.id, box(node)])
  )
  let upward = 0
  for (const edge of cyclic.edges!) {
    if (edge.from === edge.to) continue
    if (nodes.get(edge.to)!.top <= nodes.get(edge.from)!.top) upward++
  }
  // One edge closes the ring and is drawn back up.
  expect(upward).toBe(1)
})

test('tree layout puts children below their parent, centered over their row', async () => {
  const { host } = await mount(<RelationGraph {...org} />)
  const nodes = new Map(
    parts(host, 'relation-graph-node').map(node => [node.dataset.id, box(node)])
  )
  const center = (rect: DOMRect) => rect.left + rect.width / 2
  for (const edge of org.edges!)
    expect(nodes.get(edge.to)!.top).toBeGreaterThan(nodes.get(edge.from)!.bottom)
  const eng = nodes.get('eng')!
  expect(center(eng)).toBeCloseTo((nodes.get('web')!.left + nodes.get('platform')!.right) / 2, 0)
})

test('circular layout keeps data order clockwise from the top', async () => {
  const { host } = await mount(<RelationGraph {...cyclic} />)
  const centers = parts(host, 'relation-graph-node').map(node => {
    const rect = box(node)
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  })
  const mid = {
    x: centers.reduce((sum, c) => sum + c.x, 0) / centers.length,
    y: centers.reduce((sum, c) => sum + c.y, 0) / centers.length
  }
  const angles = centers.map(
    c => (Math.atan2(c.y - mid.y, c.x - mid.x) + 2.5 * Math.PI) % (2 * Math.PI)
  )
  if (angles[0]! > Math.PI) angles[0] = angles[0]! - 2 * Math.PI
  expect(angles[0]).toBeCloseTo(0, 1)
  for (let index = 1; index < angles.length; index++)
    expect(angles[index]!).toBeGreaterThan(angles[index - 1]!)
})

test('one node is in the tab order; arrow keys move along rows and to linked rows', async () => {
  const { host } = await mount(
    <>
      <button type="button">Before</button>
      <RelationGraph {...org} />
    </>
  )
  const node = (id: string) => host.querySelector<HTMLElement>(`[data-id="${id}"]`)!
  expect(parts(host, 'relation-graph-node').map(n => n.tabIndex)).toEqual([0, -1, -1, -1, -1, -1])
  await act(async () => host.querySelector('button')!.focus())
  await key('{Tab}')
  expect(document.activeElement).toBe(node('head'))
  await key('{ArrowDown}')
  const first = document.activeElement as HTMLElement
  expect(['design', 'eng']).toContain(first.dataset.id)
  await act(async () => node('eng').focus())
  await key('{ArrowLeft}')
  // Left and Right move along the row, linked or not.
  expect(document.activeElement).toBe(node('design'))
  await act(async () => node('research').focus())
  await key('{ArrowRight}')
  expect(document.activeElement).toBe(node('web'))
  await act(async () => node('eng').focus())
  await key('{ArrowUp}')
  expect(document.activeElement).toBe(node('head'))
  await act(async () => node('eng').focus())
  await key('{ArrowDown}{ArrowRight}')
  expect(document.activeElement).toBe(node('platform'))
  expect(node('platform').tabIndex).toBe(0)
  expect(node('head').tabIndex).toBe(-1)
  await key('{Home}')
  expect(document.activeElement).toBe(node('head'))
  await key('{End}')
  expect(document.activeElement).toBe(node('platform'))
  await key('{ArrowDown}')
  expect(document.activeElement).toBe(node('platform'))
})

test('in right-to-left text the layout mirrors and so do the arrow keys', async () => {
  const { host } = await mount(
    <div dir="rtl">
      <RelationGraph {...org} />
    </div>
  )
  const node = (id: string) => host.querySelector<HTMLElement>(`[data-id="${id}"]`)!
  expect(box(node('eng')).right).toBeLessThan(box(node('design')).left)
  expect(box(node('platform')).right).toBeLessThan(box(node('web')).left)
  await act(async () => node('web').focus())
  await key('{ArrowLeft}')
  expect(document.activeElement).toBe(node('platform'))
  // The edge layer mirrors with the nodes: the arrow into Platform still lands on it.
  const edge = host.querySelector('[data-slot="relation-graph-edge"][data-to="platform"]')!
  const arrow = edge.querySelectorAll('path')[1]!.getBoundingClientRect()
  const target = box(node('platform'))
  expect(arrow.left).toBeGreaterThanOrEqual(target.left - 1)
  expect(arrow.right).toBeLessThanOrEqual(target.right + 1)
  const label = parts(host, 'relation-graph-edge-label')[0]!
  const head = box(node('head')),
    design = box(node('design'))
  // The label of Head to Design sits between the two, which are mirrored too.
  const center = (rect: DOMRect) => rect.left + rect.width / 2
  expect(center(design)).toBeGreaterThan(center(head))
  expect(center(box(label))).toBeGreaterThan(center(head))
  expect(center(box(label))).toBeLessThan(center(design))
})

test('each node announces its connections and description in caller text', async () => {
  const { host } = await mount(
    <RelationGraph
      {...cyclic}
      nodes={cyclic.nodes.map(node =>
        node.id === 'n3' ? { ...node, description: 'Current', emphasis: 'highlighted' } : node
      )}
    />
  )
  await expect.element(page.getByRole('group', { name: 'Cycle' })).toBeInTheDocument()
  await expect
    .element(page.getByRole('listitem', { name: 'Node 1' }))
    .toHaveAccessibleDescription('to Node 2. from Node 12. to Node 7 (skip). Fastest')
  await expect
    .element(page.getByRole('listitem', { name: 'Node 4' }))
    .toHaveAccessibleDescription('from Node 3. to Node 5. to Node 4 (wait). Current')
  expect(parts(host, 'relation-graph-edges')[0]!.getAttribute('aria-hidden')).toBe('true')
  for (const label of parts(host, 'relation-graph-edge-label'))
    expect(label.closest('[aria-hidden]')).not.toBeNull()
})

test('without connectionText connections use arrow symbols', async () => {
  const { connectionText: _, ...rest } = org
  await mount(<RelationGraph {...rest} />)
  await expect
    .element(page.getByRole('listitem', { name: 'Engineering' }))
    .toHaveAccessibleDescription('← Head: leads. → Web. → Platform')
})

test('focusing a node marks its edges active', async () => {
  const { host } = await mount(<RelationGraph {...org} />)
  await act(async () => host.querySelector<HTMLElement>('[data-id="eng"]')!.focus())
  expect(parts(host, 'relation-graph-edge').map(edge => edge.hasAttribute('data-active'))).toEqual([
    false,
    true,
    false,
    true,
    true
  ])
})

test('single selection follows Enter, Space and clicks, and the controlled value', async () => {
  const changes: (string | null)[] = []
  function Controlled() {
    const [value, setValue] = useState<string | null>('web')
    return (
      <RelationGraph
        {...org}
        type="single"
        value={value}
        onValueChange={next => {
          changes.push(next)
          setValue(next)
        }}
      />
    )
  }
  const { host } = await mount(<Controlled />)
  await expect.element(page.getByRole('listbox', { name: 'Organization' })).toBeInTheDocument()
  const option = (id: string) => host.querySelector<HTMLElement>(`[data-id="${id}"]`)!
  expect(option('web').getAttribute('aria-selected')).toBe('true')
  // The selected node is the tab stop.
  expect(option('web').tabIndex).toBe(0)
  await act(async () => option('web').focus())
  await key('{ArrowUp}')
  await key('{Enter}')
  expect(option('eng').getAttribute('aria-selected')).toBe('true')
  expect(option('web').getAttribute('aria-selected')).toBe('false')
  await key(' ')
  expect(option('eng').getAttribute('aria-selected')).toBe('false')
  await click(option('design'))
  expect(changes).toEqual(['eng', null, 'design'])
  expect(option('design').hasAttribute('data-selected')).toBe(true)
})

test('multiple selection toggles each node', async () => {
  const changes: string[][] = []
  const { host } = await mount(
    <RelationGraph
      {...org}
      type="multiple"
      defaultValue={['head']}
      onValueChange={next => changes.push(next)}
    />
  )
  const listbox = page.getByRole('listbox', { name: 'Organization' })
  await expect.element(listbox).toHaveAttribute('aria-multiselectable', 'true')
  await click(host.querySelector<HTMLElement>('[data-id="web"]')!)
  await click(host.querySelector<HTMLElement>('[data-id="head"]')!)
  expect(changes).toEqual([['head', 'web'], ['web']])
})

test('a large graph scrolls inside its host, follows focus and pans by dragging', async () => {
  const modules = Array.from({ length: 24 }, (_, index) => ({
    id: `m${index}`,
    label: `Module ${index + 1}`
  }))
  const { host } = await mount(
    <div style={{ width: 360 }}>
      <RelationGraph
        aria-label="Modules"
        layout="layered"
        nodes={modules}
        edges={modules
          .slice(1)
          .map((module, index) => ({ from: modules[Math.floor(index / 3)]!.id, to: module.id }))}
      />
    </div>
  )
  const viewport = parts(host, 'relation-graph-viewport')[0]!
  expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth)
  expect(box(viewport).width).toBeLessThanOrEqual(360)
  await act(async () => host.querySelector<HTMLElement>('[data-id="m23"]')!.focus())
  const last = box(host.querySelector('[data-id="m23"]')!)
  expect(last.right).toBeLessThanOrEqual(box(viewport).right + 1)
  expect(last.bottom).toBeLessThanOrEqual(box(viewport).bottom + 1)
  const before = viewport.scrollLeft
  const canvas = parts(host, 'relation-graph-canvas')[0]!
  const rect = box(viewport)
  const start = {
    clientX: rect.left + 8,
    clientY: rect.top + 4,
    button: 0,
    pointerId: 1,
    pointerType: 'mouse',
    bubbles: true
  }
  await act(async () => {
    canvas.dispatchEvent(new PointerEvent('pointerdown', start))
    canvas.dispatchEvent(new PointerEvent('pointermove', { ...start, clientX: start.clientX + 60 }))
    canvas.dispatchEvent(new PointerEvent('pointerup', { ...start, clientX: start.clientX + 60 }))
  })
  expect(viewport.scrollLeft).toBeCloseTo(Math.max(0, before - 60), 0)
})

test('server markup hydrates with the same layout', async () => {
  const markup = renderToString(<RelationGraph {...org} />)
  expect(markup).toContain('<path')
  const { host } = await mount(<RelationGraph {...org} />, true)
  expect(parts(host, 'relation-graph-edge')).toHaveLength(5)
})

test('forced colors keep nodes, edges and selection visible in system colors', async () => {
  await commands.emulatePreferences({ forcedColors: 'active' })
  try {
    const { host } = await mount(
      <RelationGraph
        {...org}
        type="single"
        defaultValue="eng"
      />
    )
    const probe = document.createElement('span')
    host.append(probe)
    probe.style.color = 'CanvasText'
    const canvasText = getComputedStyle(probe).color
    probe.style.color = 'Highlight'
    const highlight = getComputedStyle(probe).color
    probe.remove()
    const design = host.querySelector<HTMLElement>('[data-id="design"]')!
    expect(getComputedStyle(design).borderTopColor).toBe(canvasText)
    expect(getComputedStyle(host.querySelector('[data-id="eng"]')!).backgroundColor).toBe(highlight)
    const path = parts(host, 'relation-graph-edge')[0]!.querySelector('path')!
    expect(getComputedStyle(path).stroke).toBe(canvasText)
  } finally {
    await commands.emulatePreferences({ forcedColors: 'none' })
  }
})

test('invalid layouts, nodes and edges throw', () => {
  const render = (props: Partial<RelationGraphProps>) => () =>
    renderToString(
      <RelationGraph
        {...org}
        {...(props as object)}
      />
    )
  expect(render({ layout: 'grid' as never })).toThrow(/layout/)
  expect(render({ nodes: [] })).toThrow(/at least one node/)
  expect(
    render({
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'a', label: 'B' }
      ],
      edges: []
    })
  ).toThrow(/not unique/)
  expect(render({ nodes: [{ id: 'a', label: ' ' }], edges: [] })).toThrow(/label/)
  expect(render({ nodes: [{ id: 'a', label: 'A', series: 9 as never }], edges: [] })).toThrow(
    /series/
  )
  expect(render({ edges: [{ from: 'head', to: 'missing' }] })).toThrow(/node ids/)
  expect(() =>
    renderToString(
      <RelationGraph {...({ layout: 'tree', nodes: org.nodes } as unknown as RelationGraphProps)} />
    )
  ).toThrow(/aria-label or aria-labelledby/)
})

test('nodes and labels scale with the font size and labels still fit', async () => {
  document.documentElement.style.fontSize = '24px'
  try {
    const { host } = await mount(
      <RelationGraph
        {...cyclic}
        layout="layered"
      />
    )
    const nodes = parts(host, 'relation-graph-node')
    expect(overlapping(nodes.map(box))).toBe(0)
    for (const node of nodes) {
      const label = parts(node, 'relation-graph-node-label')[0]!
      expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth + 1)
      expect(box(label).height).toBeLessThan(box(node).height)
    }
    // The edge layer scales with the nodes: arrowheads still land on their targets.
    const byId = new Map(nodes.map(node => [node.dataset.id, box(node)]))
    for (const edge of parts(host, 'relation-graph-edge')) {
      const arrow = edge.querySelectorAll('path')[1]!.getBoundingClientRect()
      const target = byId.get(edge.dataset.to)!
      expect(arrow.bottom).toBeGreaterThanOrEqual(target.top - 1)
      expect(arrow.top).toBeLessThanOrEqual(target.bottom + 1)
    }
  } finally {
    document.documentElement.style.fontSize = ''
  }
})

const modules = Array.from({ length: 24 }, (_, index) => ({
  id: `m${index}`,
  label: `Module ${index + 1}`
}))
const moduleEdges = modules
  .slice(1)
  .map((module, index) => ({ from: modules[Math.floor(index / 3)]!.id, to: module.id }))

async function drag(target: Element, from: { x: number; y: number }, by: number) {
  const base = { button: 0, pointerId: 1, pointerType: 'mouse', bubbles: true }
  await act(async () => {
    target.dispatchEvent(
      new PointerEvent('pointerdown', { ...base, clientX: from.x, clientY: from.y })
    )
    target.dispatchEvent(
      new PointerEvent('pointermove', { ...base, clientX: from.x + by, clientY: from.y })
    )
    target.dispatchEvent(
      new PointerEvent('pointerup', { ...base, clientX: from.x + by, clientY: from.y })
    )
  })
}

test('pressing the scrollbar does not start a drag, and dragging pans in right-to-left text', async () => {
  const { host } = await mount(
    <div
      dir="rtl"
      style={{ width: 360 }}
    >
      <RelationGraph
        aria-label="Modules"
        layout="layered"
        nodes={modules}
        edges={moduleEdges}
      />
    </div>
  )
  const viewport = parts(host, 'relation-graph-viewport')[0]!
  const rect = box(viewport)
  expect(viewport.scrollLeft).toBe(0)
  // A press on the viewport itself is a press on its scrollbar.
  await drag(viewport, { x: rect.left + 20, y: rect.bottom - 4 }, 60)
  expect(viewport.scrollLeft).toBe(0)
  expect(viewport.hasAttribute('data-panning')).toBe(false)
  // Dragging the canvas rightward reveals what lies further toward the inline end, on the left.
  const canvas = parts(host, 'relation-graph-canvas')[0]!
  await drag(canvas, { x: rect.left + 20, y: rect.top + 4 }, 60)
  expect(viewport.scrollLeft).toBeCloseTo(-60, 0)
  // A mouse press on the empty canvas does not start a text selection.
  const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
  canvas.dispatchEvent(press)
  expect(press.defaultPrevented).toBe(true)
})
