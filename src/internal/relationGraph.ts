import { isSeriesNumber as isSeries, type SeriesNumber } from './series.js'

/** How nodes are placed: a tidy tree, layers along edge direction, or a circle in data order. */
export type RelationGraphLayout = 'tree' | 'layered' | 'circular'

/** `highlighted` draws a node or edge stronger and `muted` fainter; neither is announced. */
export type RelationGraphEmphasis = 'highlighted' | 'muted'

export type RelationGraphNode = {
  /** Unique id that edges and the selection refer to. */
  id: string
  label: string
  series?: SeriesNumber
  emphasis?: RelationGraphEmphasis
  /** Text announced after the node's connections, such as a state the emphasis shows. */
  description?: string
}

/** A directed edge drawn with an arrowhead at `to`. An edge from a node to itself is a loop. */
export type RelationGraphEdge = {
  from: string
  to: string
  label?: string
  series?: SeriesNumber
  emphasis?: RelationGraphEmphasis
  /** Text both of its nodes announce right after this connection, such as a state the emphasis shows. */
  description?: string
}

/** One connection a node announces: the edge and the node at its other end. */
export type RelationGraphConnection = {
  direction: 'outgoing' | 'incoming'
  /** The node at the other end; a loop names the node itself. */
  node: RelationGraphNode
  edge: RelationGraphEdge
}

export type RelationGraphConnectionText = (connection: RelationGraphConnection) => string

/**
 * Default connection text: a `→` symbol before a node an edge leads to, `←` before one it comes
 * from, then `: ` and the edge label. Screen readers read the symbols in the user's language.
 */
export const defaultConnectionText: RelationGraphConnectionText = ({ direction, node, edge }) => {
  const label = edge.label?.trim()
  return `${direction === 'outgoing' ? '→' : '←'} ${node.label.trim()}${label ? `: ${label}` : ''}`
}

const LAYOUTS = new Set(['tree', 'layered', 'circular'])
const EMPHASES = new Set(['highlighted', 'muted'])
const nonEmpty = (value: unknown) => typeof value === 'string' && value.trim().length > 0

/** Throws a TypeError naming the first node or edge outside the contract. */
export function validateRelationGraph(
  layout: unknown,
  nodes: readonly RelationGraphNode[],
  edges: readonly RelationGraphEdge[]
) {
  if (!LAYOUTS.has(layout as string))
    throw new TypeError('RelationGraph layout must be tree, layered or circular.')
  if (!Array.isArray(nodes) || !nodes.length)
    throw new TypeError('RelationGraph needs at least one node.')
  if (!Array.isArray(edges)) throw new TypeError('RelationGraph edges must be an array.')
  const ids = new Set<string>()
  nodes.forEach((node, index) => {
    if (!nonEmpty(node?.id)) throw new TypeError(`RelationGraph node ${index} needs a nonempty id.`)
    if (ids.has(node.id)) throw new TypeError(`RelationGraph node id "${node.id}" is not unique.`)
    ids.add(node.id)
    if (!nonEmpty(node.label))
      throw new TypeError(`RelationGraph node "${node.id}" needs a nonempty label.`)
    if (node.series !== undefined && !isSeries(node.series))
      throw new TypeError(`RelationGraph node "${node.id}" series must be from 1 to 8.`)
    if (node.emphasis !== undefined && !EMPHASES.has(node.emphasis))
      throw new TypeError(`RelationGraph node "${node.id}" emphasis must be highlighted or muted.`)
    if (node.description !== undefined && typeof node.description !== 'string')
      throw new TypeError(`RelationGraph node "${node.id}" description must be a string.`)
  })
  edges.forEach((edge, index) => {
    if (!ids.has(edge?.from) || !ids.has(edge.to))
      throw new TypeError(`RelationGraph edge ${index} must connect node ids.`)
    if (edge.label !== undefined && typeof edge.label !== 'string')
      throw new TypeError(`RelationGraph edge ${index} label must be a string.`)
    if (edge.series !== undefined && !isSeries(edge.series))
      throw new TypeError(`RelationGraph edge ${index} series must be from 1 to 8.`)
    if (edge.emphasis !== undefined && !EMPHASES.has(edge.emphasis))
      throw new TypeError(`RelationGraph edge ${index} emphasis must be highlighted or muted.`)
    if (edge.description !== undefined && typeof edge.description !== 'string')
      throw new TypeError(`RelationGraph edge ${index} description must be a string.`)
  })
}

/**
 * What every node announces, in node order: each connection in edge order, outgoing and
 * incoming alike, each followed by its edge's description, then the node's own description, all
 * joined by `. `. A loop is announced once, as outgoing.
 */
export function describeNodes(
  nodes: readonly RelationGraphNode[],
  edges: readonly RelationGraphEdge[],
  connectionText: RelationGraphConnectionText = defaultConnectionText
) {
  const byId = new Map(nodes.map(node => [node.id, node]))
  const parts: string[][] = nodes.map(() => [])
  const index = new Map(nodes.map((node, at) => [node.id, at]))
  for (const edge of edges) {
    const own = edge.description?.trim()
    const ends =
      edge.from === edge.to
        ? ([['outgoing', edge.from, edge.to]] as const)
        : ([
            ['outgoing', edge.from, edge.to],
            ['incoming', edge.to, edge.from]
          ] as const)
    for (const [direction, self, other] of ends) {
      const list = parts[index.get(self)!]!
      list.push(connectionText({ direction, node: byId.get(other)!, edge }))
      if (own) list.push(own)
    }
  }
  return nodes.map((node, at) => {
    const own = node.description?.trim()
    return [...parts[at]!, ...(own ? [own] : [])].filter(part => part.trim()).join('. ')
  })
}

type Point = { x: number; y: number }

/** A node's box in layout units from the canvas's inline start and top. */
export type RelationGraphBox = { x: number; y: number; width: number; height: number }

export type RelationGraphEdgeGeometry = {
  /** The edge line, ending at the base of its arrowhead. */
  path: string
  arrow: string
  /** Center of the edge label. */
  label: Point
}

export type RelationGraphGeometry = {
  width: number
  height: number
  nodes: RelationGraphBox[]
  edges: RelationGraphEdgeGeometry[]
  /**
   * Node indexes in rows from top to bottom, each from the inline start; for `circular`, one
   * row in ring order.
   */
  rows: number[][]
  ring: boolean
}

/**
 * Layout units per em. Geometry is computed for 14px text and drawn in em, so it scales with the
 * graph's font size.
 */
export const RELATION_GRAPH_UNIT = 14

// Node boxes are sized from the label before any measuring, so server markup matches the client.
const CHAR = 8.25
const WIDE_CHAR = 15
const PADDING = 30
const MIN_WIDTH = 56
const MAX_WIDTH = 176
const LINE_HEIGHT = 40
const TWO_LINE_HEIGHT = 60
const GAP_X = 32
const GAP_Y = 64
const MARGIN = 16
const DUMMY_WIDTH = 16
const ARROW_LENGTH = 8
const ARROW_HALF = 4
const BOW = 28
const LOOP = 32
// Edge labels are smaller text with a little padding.
const LABEL_CHAR = 7
const LABEL_WIDE_CHAR = 12.5
const LABEL_PADDING = 12
const LABEL_HEIGHT = 18
// Separate trees fill a row up to this width before the next tree starts a new row.
const TARGET_WIDTH = 640

const textWidth = (text: string, narrow: number, wide: number) => {
  let width = 0
  for (const char of text.trim()) width += (char.codePointAt(0) ?? 0) >= 0x2e80 ? wide : narrow
  return width
}

/** Estimated box for a label: one line up to the widest node, then two lines. */
export function nodeSize(label: string) {
  const wanted = textWidth(label, CHAR, WIDE_CHAR) + PADDING
  return wanted > MAX_WIDTH
    ? { width: MAX_WIDTH, height: TWO_LINE_HEIGHT }
    : { width: Math.max(MIN_WIDTH, Math.ceil(wanted)), height: LINE_HEIGHT }
}

/** Estimated width of an edge label; zero without one. */
const labelWidth = (label: string | undefined) =>
  label?.trim() ? textWidth(label, LABEL_CHAR, LABEL_WIDE_CHAR) + LABEL_PADDING : 0

// A label sits three quarters along its edge, so a slot four thirds as wide keeps neighbours apart.
const labelSlot = (label: string | undefined) => Math.ceil((labelWidth(label) * 4) / 3)

type Size = { width: number; height: number }

type Graph = {
  count: number
  /** Edge endpoints as node indexes. */
  ends: { from: number; to: number }[]
  out: number[][]
}

function toGraph(nodes: readonly RelationGraphNode[], edges: readonly RelationGraphEdge[]): Graph {
  const index = new Map(nodes.map((node, at) => [node.id, at]))
  const ends = edges.map(edge => ({ from: index.get(edge.from)!, to: index.get(edge.to)! }))
  const out: number[][] = nodes.map(() => [])
  ends.forEach(({ from, to }) => {
    if (from !== to && !out[from]!.includes(to)) out[from]!.push(to)
  })
  return { count: nodes.length, ends, out }
}

type Placed = {
  centers: Point[]
  /** Edges drawn as curves that must find a side clear of other nodes. */
  curved?: Set<number>
  chains?: Map<number, Point[]>
}

/**
 * A tidy tree for each root: nodes without incoming edges in data order, then the first node
 * not yet placed, so a cycle still gets a root. Breadth-first search picks each node's parent;
 * every other edge is drawn as a curve. Each subtree takes the width of its children, and a
 * parent sits centered over them. Trees sit side by side, wrapping to a new row past a target
 * width.
 */
function layoutTree(
  graph: Graph,
  sizes: Size[],
  edges: readonly RelationGraphEdge[],
  gapY: number
): Placed {
  const parent: number[] = Array.from({ length: graph.count }, () => -1)
  const depth: number[] = Array.from({ length: graph.count }, () => 0)
  const rootOf: number[] = Array.from({ length: graph.count }, () => -1)
  const children: number[][] = sizes.map(() => [])
  const visited = Array.from({ length: graph.count }, () => false)
  const order: number[] = []
  const roots: number[] = []
  const incoming = Array.from({ length: graph.count }, () => 0)
  graph.ends.forEach(({ from, to }) => {
    if (from !== to) incoming[to]!++
  })
  const candidates = [
    ...incoming.flatMap((count, at) => (count === 0 ? [at] : [])),
    ...incoming.map((_, at) => at)
  ]
  for (const root of candidates) {
    if (visited[root]) continue
    visited[root] = true
    roots.push(root)
    rootOf[root] = root
    const queue = [root]
    for (let head = 0; head < queue.length; head++) {
      const node = queue[head]!
      order.push(node)
      for (const next of graph.out[node]!) {
        if (visited[next]) continue
        visited[next] = true
        parent[next] = node
        rootOf[next] = root
        depth[next] = depth[node]! + 1
        children[node]!.push(next)
        queue.push(next)
      }
    }
  }
  const curved = new Set<number>()
  const claimed = new Set<number>()
  const slot = sizes.map(size => size.width)
  graph.ends.forEach(({ from, to }, at) => {
    if (from === to) return
    if (parent[to] === from && !claimed.has(to)) {
      claimed.add(to)
      slot[to] = Math.max(slot[to]!, labelSlot(edges[at]!.label))
    } else curved.add(at)
  })
  const span = [...slot]
  const block = (kids: number[]) =>
    kids.reduce((sum, kid) => sum + span[kid]!, 0) + GAP_X * (kids.length - 1)
  for (const node of [...order].reverse())
    if (children[node]!.length) span[node] = Math.max(span[node]!, block(children[node]!))
  // Pack trees into bands of rows.
  const bands: number[][] = []
  let width = 0
  for (const root of roots) {
    const band = bands[bands.length - 1]
    if (!band || width + GAP_X + span[root]! > TARGET_WIDTH) {
      bands.push([root])
      width = span[root]!
    } else {
      band.push(root)
      width += GAP_X + span[root]!
    }
  }
  const left: number[] = Array.from({ length: graph.count }, () => 0)
  const centers: Point[] = sizes.map(() => ({ x: 0, y: 0 }))
  let top = 0
  for (const band of bands) {
    const members = new Set(band)
    const inBand = order.filter(node => members.has(rootOf[node]!))
    const rows: number[] = []
    for (const node of inBand)
      rows[depth[node]!] = Math.max(rows[depth[node]!] ?? 0, sizes[node]!.height)
    const rowTop: number[] = []
    let y = top
    rows.forEach((height, row) => {
      rowTop[row] = y
      y += height + gapY
    })
    let cursor = 0
    for (const root of band) {
      left[root] = cursor
      cursor += span[root]! + GAP_X
    }
    for (const node of inBand) {
      centers[node] = {
        x: left[node]! + span[node]! / 2,
        y: rowTop[depth[node]!]! + rows[depth[node]!]! / 2
      }
      let next = left[node]! + (span[node]! - block(children[node]!)) / 2
      for (const kid of children[node]!) {
        left[kid] = next
        next += span[kid]! + GAP_X
      }
    }
    top = y
  }
  return { centers, curved }
}

/** Pairs of edges between two adjacent layers that cross, given each vertex's position. */
function crossings(layers: number[][], down: number[][], position: number[]) {
  let total = 0
  for (const layer of layers) {
    const pairs = layer.flatMap(v => down[v]!.map(w => [position[v]!, position[w]!] as const))
    for (let a = 0; a < pairs.length; a++)
      for (let b = a + 1; b < pairs.length; b++) {
        const [a1, a2] = pairs[a]!,
          [b1, b2] = pairs[b]!
        if ((a1 - b1) * (a2 - b2) < 0) total++
      }
  }
  return total
}

/**
 * Layers along edge direction. Depth-first search in data order reverses the edges that close a
 * cycle; each node then sits one layer below its lowest predecessor (longest path). Each edge
 * that skips layers passes through its own placeholder in each layer between, and barycentric
 * sweeps order each layer, keeping the order with the fewest crossings.
 */
function layoutLayered(
  graph: Graph,
  sizes: Size[],
  edges: readonly RelationGraphEdge[],
  gapY: number
): Placed {
  const state = Array.from({ length: graph.count }, () => 0)
  const reversed = new Set<string>()
  for (let root = 0; root < graph.count; root++) {
    if (state[root]) continue
    const stack: [number, number][] = [[root, 0]]
    state[root] = 1
    while (stack.length) {
      const top = stack[stack.length - 1]!
      const [node, at] = top
      const next = graph.out[node]![at]
      if (next === undefined) {
        state[node] = 2
        stack.pop()
        continue
      }
      top[1]++
      if (state[next] === 1) reversed.add(`${node}>${next}`)
      else if (!state[next]) {
        state[next] = 1
        stack.push([next, 0])
      }
    }
  }
  // Each edge, pointing down the acyclic graph.
  const forward = graph.ends.map(({ from, to }) =>
    from === to
      ? null
      : reversed.has(`${from}>${to}`)
        ? ([to, from] as const)
        : ([from, to] as const)
  )
  const layer = Array.from({ length: graph.count }, () => 0)
  const indegree = Array.from({ length: graph.count }, () => 0)
  const succ: number[][] = sizes.map(() => [])
  for (const pair of forward) {
    if (!pair) continue
    succ[pair[0]]!.push(pair[1])
    indegree[pair[1]]!++
  }
  const queue = indegree.flatMap((count, at) => (count === 0 ? [at] : []))
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head]!
    for (const v of succ[u]!) {
      layer[v] = Math.max(layer[v]!, layer[u]! + 1)
      if (--indegree[v]! === 0) queue.push(v)
    }
  }
  // Vertices: real nodes, then placeholders for edges that skip layers.
  const vertexLayer = [...layer]
  const widths = sizes.map(size => size.width)
  const down: number[][] = sizes.map(() => [])
  const up: number[][] = sizes.map(() => [])
  const chainOf = new Map<number, number[]>()
  forward.forEach((pair, at) => {
    if (!pair) return
    const [u, v] = pair
    const chain = [u]
    for (let l = layer[u]! + 1; l < layer[v]!; l++) {
      chain.push(vertexLayer.length)
      vertexLayer.push(l)
      widths.push(DUMMY_WIDTH)
      down.push([])
      up.push([])
    }
    chain.push(v)
    // The label sits on the placeholder nearest the arrowhead, or along a one-layer edge.
    const flipped = chain[0] !== graph.ends[at]!.from
    const host = chain.length > 2 ? chain[flipped ? 1 : chain.length - 2]! : graph.ends[at]!.to
    widths[host] = Math.max(widths[host]!, labelSlot(edges[at]!.label))
    for (let step = 0; step < chain.length - 1; step++) {
      down[chain[step]!]!.push(chain[step + 1]!)
      up[chain[step + 1]!]!.push(chain[step]!)
    }
    chainOf.set(at, chain)
  })
  const layers: number[][] = []
  vertexLayer.forEach((l, vertex) => (layers[l] ??= []).push(vertex))
  const position: number[] = []
  layers.forEach(row => row.forEach((vertex, at) => (position[vertex] = at)))
  let best = layers.map(row => [...row])
  let fewest = crossings(layers, down, position)
  const sweep = (rows: number[][], neighbours: number[][]) => {
    for (const row of rows) {
      const key = new Map(
        row.map(vertex => {
          const near = neighbours[vertex]!
          return [
            vertex,
            near.length
              ? near.reduce((sum, other) => sum + position[other]!, 0) / near.length
              : position[vertex]!
          ]
        })
      )
      row.sort((a, b) => key.get(a)! - key.get(b)! || position[a]! - position[b]!)
      row.forEach((vertex, at) => (position[vertex] = at))
    }
  }
  for (let pass = 0; pass < 8 && fewest > 0; pass++) {
    if (pass % 2 === 0) sweep(layers.slice(1), up)
    else sweep(layers.slice(0, -1).reverse(), down)
    const count = crossings(layers, down, position)
    if (count < fewest) {
      fewest = count
      best = layers.map(row => [...row])
    }
  }
  const rowHeight = best.map(row =>
    Math.max(LINE_HEIGHT, ...row.filter(v => v < graph.count).map(v => sizes[v]!.height))
  )
  const rowWidth = best.map(
    row => row.reduce((sum, v) => sum + widths[v]!, 0) + GAP_X * (row.length - 1)
  )
  const widest = Math.max(...rowWidth)
  const centers: Point[] = vertexLayer.map(() => ({ x: 0, y: 0 }))
  let top = 0
  best.forEach((row, l) => {
    let x = (widest - rowWidth[l]!) / 2
    for (const vertex of row) {
      centers[vertex] = { x: x + widths[vertex]! / 2, y: top + rowHeight[l]! / 2 }
      x += widths[vertex]! + GAP_X
    }
    top += rowHeight[l]! + gapY
  })
  const chains = new Map<number, Point[]>()
  chainOf.forEach((chain, at) => {
    const points = chain.map(vertex => centers[vertex]!)
    chains.set(at, chain[0] === graph.ends[at]!.from ? points : points.reverse())
  })
  return { centers: centers.slice(0, graph.count), chains }
}

const overlaps = (a: Point, b: Point, sa: Size, sb: Size, gap: number) =>
  Math.abs(a.x - b.x) < (sa.width + sb.width) / 2 + gap &&
  Math.abs(a.y - b.y) < (sa.height + sb.height) / 2 + gap

/** Nodes evenly on a circle in data order, clockwise from the top, on the smallest radius that keeps them apart. */
function layoutCircular(graph: Graph, sizes: Size[]): Placed {
  const at = (radius: number) =>
    sizes.map((_, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / graph.count
      return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
    })
  if (graph.count === 1) return { centers: at(0) }
  // Neighbours stay at least a node width plus room for an edge and its label apart.
  const widest = Math.max(...sizes.map(size => size.width))
  let radius = (widest + GAP_Y) / (2 * Math.sin(Math.PI / graph.count))
  for (;;) {
    const centers = at(radius)
    let clear = true
    for (let a = 0; a < centers.length && clear; a++)
      for (let b = a + 1; b < centers.length; b++)
        if (overlaps(centers[a]!, centers[b]!, sizes[a]!, sizes[b]!, GAP_X)) {
          clear = false
          break
        }
    if (clear) return { centers }
    radius += 4
  }
}

/** Where the ray from a box's center toward `toward` leaves the box. */
function exit(center: Point, size: Size, toward: Point): Point {
  const dx = toward.x - center.x,
    dy = toward.y - center.y
  if (!dx && !dy) return center
  const t = Math.min(
    dx ? size.width / 2 / Math.abs(dx) : Infinity,
    dy ? size.height / 2 / Math.abs(dy) : Infinity
  )
  return { x: center.x + dx * t, y: center.y + dy * t }
}

type Command =
  | { type: 'L'; p: Point }
  | { type: 'Q'; c: Point; p: Point }
  | { type: 'C'; c1: Point; c2: Point; p: Point }
type Route = {
  start: Point
  commands: Command[]
  label: Point
  tip: Point
  from: Point
  /** The label's center at a fraction of the way along the edge. */
  along: (t: number) => Point
  /** The fraction where the label sits first. */
  t: number
}

/** Ends a route at the base of its arrowhead and returns the head pointing from `from` to `tip`. */
function arrowhead(route: Route) {
  const dx = route.tip.x - route.from.x,
    dy = route.tip.y - route.from.y
  const length = Math.hypot(dx, dy) || 1
  const ux = dx / length,
    uy = dy / length
  const base = { x: route.tip.x - ux * ARROW_LENGTH, y: route.tip.y - uy * ARROW_LENGTH }
  const left = { x: base.x - uy * ARROW_HALF, y: base.y + ux * ARROW_HALF }
  const right = { x: base.x + uy * ARROW_HALF, y: base.y - ux * ARROW_HALF }
  return { base, points: [route.tip, left, right] }
}

const round = (value: number) => Math.round(value * 10) / 10
const pt = (p: Point) => `${round(p.x)} ${round(p.y)}`
const lerp = (a: Point, b: Point, t: number) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t
})
const quad = (a: Point, c: Point, b: Point, t: number) => lerp(lerp(a, c, t), lerp(c, b, t), t)
const cubic = (a: Point, c1: Point, c2: Point, b: Point, t: number) =>
  lerp(quad(a, c1, c2, t), quad(c1, c2, b, t), t)

const segments = (points: readonly Point[]) =>
  points.slice(1).map((p, at) => Math.hypot(p.x - points[at]!.x, p.y - points[at]!.y))
const polylineLength = (points: readonly Point[]) =>
  segments(points).reduce((sum, length) => sum + length, 0)

/** The point a fraction of the way along a polyline, by length. */
function polyline(points: readonly Point[], t: number) {
  const lengths = segments(points)
  let left = t * polylineLength(points)
  for (let at = 0; at < lengths.length; at++) {
    if (left <= lengths[at]! || at === lengths.length - 1)
      return lerp(points[at]!, points[at + 1]!, lengths[at] ? Math.min(1, left / lengths[at]!) : 0)
    left -= lengths[at]!
  }
  return points[0]!
}

const LABEL_GAP = 2
// Labels slide along their edge in these steps, staying this far from either end.
const SLIDE_STEP = 0.05
const SLIDE_RANGE = [0.15, 0.85] as const
const NUDGE_STEP = 6
const NUDGES = 60

/**
 * Moves each edge label, in edge order, to the nearest spot along its edge where its estimated
 * box clears every node and every label placed before it. A label with no clear spot on its edge
 * moves off it in growing steps. Returns how many edges other than loops had no clear spot.
 */
function separateLabels(
  routes: Route[],
  centers: readonly Point[],
  sizes: readonly Size[],
  edges: readonly RelationGraphEdge[],
  loops: ReadonlySet<number>
) {
  const placed: { at: Point; width: number }[] = []
  const clear = (at: Point, width: number) =>
    centers.every(
      (c, i) =>
        Math.abs(at.x - c.x) >= (width + sizes[i]!.width) / 2 + LABEL_GAP ||
        Math.abs(at.y - c.y) >= (LABEL_HEIGHT + sizes[i]!.height) / 2 + LABEL_GAP
    ) &&
    placed.every(
      other =>
        Math.abs(at.x - other.at.x) >= (width + other.width) / 2 + LABEL_GAP ||
        Math.abs(at.y - other.at.y) >= LABEL_HEIGHT + LABEL_GAP
    )
  let detached = 0
  routes.forEach((route, index) => {
    const width = labelWidth(edges[index]!.label)
    if (!width) return
    const slides = [route.label]
    for (let k = 1; k * SLIDE_STEP <= 1; k++)
      for (const t of [route.t - k * SLIDE_STEP, route.t + k * SLIDE_STEP])
        if (t >= SLIDE_RANGE[0] - 1e-9 && t <= SLIDE_RANGE[1] + 1e-9) slides.push(route.along(t))
    let at = slides.find(point => clear(point, width))
    if (!at) {
      if (!loops.has(index)) detached++
      for (let k = 1; k <= NUDGES && !at; k++)
        at = [
          { x: k * NUDGE_STEP, y: 0 },
          { x: -k * NUDGE_STEP, y: 0 },
          { x: 0, y: k * NUDGE_STEP },
          { x: 0, y: -k * NUDGE_STEP }
        ]
          .map(shift => ({ x: route.label.x + shift.x, y: route.label.y + shift.y }))
          .find(point => clear(point, width))
    }
    route.label = at ?? route.label
    placed.push({ at: route.label, width })
  })
  return detached
}

/** Rows of node indexes grouped by their centers' height, each sorted from the inline start. */
function rowsOf(centers: readonly Point[]) {
  const rows = new Map<number, number[]>()
  centers.forEach((center, at) => {
    const key = Math.round(center.y)
    rows.set(key, [...(rows.get(key) ?? []), at])
  })
  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row.sort((a, b) => centers[a]!.x - centers[b]!.x || a - b))
}

/** Lays out the nodes and routes every edge, in layout units with the origin at the top left. */
export function layoutRelationGraph(
  layout: RelationGraphLayout,
  nodes: readonly RelationGraphNode[],
  edges: readonly RelationGraphEdge[]
): RelationGraphGeometry {
  const graph = toGraph(nodes, edges)
  const sizes = nodes.map(node => nodeSize(node.label))
  const loops = new Set(graph.ends.flatMap(({ from, to }, at) => (from === to ? [at] : [])))
  // Rows move apart, up to twice as far, while some label finds no clear spot along its edge.
  for (let gapY = GAP_Y; ; gapY += GAP_Y / 2) {
    const { centers, routes } = routeEdges(layout, graph, sizes, edges, gapY)
    const detached = separateLabels(routes, centers, sizes, edges, loops)
    if (!detached || layout === 'circular' || gapY >= GAP_Y * 2)
      return fit(layout, nodes, edges, sizes, centers, routes)
  }
}

/** Places the nodes and routes every edge with its label at its first spot. */
function routeEdges(
  layout: RelationGraphLayout,
  graph: Graph,
  sizes: Size[],
  edges: readonly RelationGraphEdge[],
  gapY: number
) {
  const placed =
    layout === 'tree'
      ? layoutTree(graph, sizes, edges, gapY)
      : layout === 'layered'
        ? layoutLayered(graph, sizes, edges, gapY)
        : layoutCircular(graph, sizes)
  const { centers } = placed
  const inside = (p: Point, skip: readonly number[]) =>
    centers.some(
      (c, i) =>
        !skip.includes(i) &&
        Math.abs(p.x - c.x) < sizes[i]!.width / 2 + 4 &&
        Math.abs(p.y - c.y) < sizes[i]!.height / 2 + 4
    )
  // Edges sharing two nodes bow apart, measured from the lower node index toward the higher.
  const groups = new Map<string, number[]>()
  graph.ends.forEach(({ from, to }, at) => {
    if (from === to) return
    const key = `${Math.min(from, to)}:${Math.max(from, to)}`
    groups.set(key, [...(groups.get(key) ?? []), at])
  })
  const loops = new Map<number, number>()
  const routes: Route[] = graph.ends.map(({ from, to }, at) => {
    const a = centers[from]!,
      b = centers[to]!
    if (from === to) {
      const nth = loops.get(from) ?? 0
      loops.set(from, nth + 1)
      const size = sizes[from]!
      const reach = LOOP + nth * 16
      const right = a.x + size.width / 2
      const start = { x: right, y: a.y - size.height / 4 }
      const tip = { x: right, y: a.y + size.height / 4 }
      const c1 = { x: right + reach, y: a.y - size.height / 2 - nth * 8 }
      const c2 = { x: right + reach, y: a.y + size.height / 2 + nth * 8 }
      // The label sits beside the loop, outside it.
      const along = (t: number) => {
        const p = cubic(start, c1, c2, tip, t)
        return { x: p.x + labelWidth(edges[at]!.label) / 2, y: p.y }
      }
      return {
        start,
        commands: [{ type: 'C', c1, c2, p: tip }],
        tip,
        from: c2,
        label: along(0.5),
        along,
        t: 0.5
      }
    }
    const chain = placed.chains?.get(at)
    if (chain && chain.length > 2) {
      const start = exit(a, sizes[from]!, chain[1]!)
      const tip = exit(b, sizes[to]!, chain[chain.length - 2]!)
      const points = [start, ...chain.slice(1, -1), tip]
      const total = polylineLength(points)
      const host = chain[chain.length - 2]!
      return {
        start,
        commands: points.slice(1).map(p => ({ type: 'L', p })),
        tip,
        from: host,
        label: host,
        along: (t: number) => polyline(points, t),
        t: total ? 1 - Math.hypot(tip.x - host.x, tip.y - host.y) / total : 0.5
      }
    }
    const group = groups.get(`${Math.min(from, to)}:${Math.max(from, to)}`)!
    const low = centers[Math.min(from, to)]!,
      high = centers[Math.max(from, to)]!
    const length = Math.hypot(high.x - low.x, high.y - low.y) || 1
    const normal = { x: -(high.y - low.y) / length, y: (high.x - low.x) / length }
    const curve = (offset: number) => {
      const control = {
        x: (a.x + b.x) / 2 + normal.x * offset * 2,
        y: (a.y + b.y) / 2 + normal.y * offset * 2
      }
      const start = exit(a, sizes[from]!, control),
        tip = exit(b, sizes[to]!, control)
      return { start, control, tip }
    }
    let offset = (group.indexOf(at) - (group.length - 1) / 2) * BOW
    if (placed.curved?.has(at)) {
      // Try each side at growing distances; take the first whose curve misses other nodes.
      const tries = [1, -1, 2, -2, 3, -3].map(k => offset + k * BOW * 1.5)
      const hits = (o: number) => {
        const { start, control, tip } = curve(o)
        return [0.25, 0.5, 0.75].filter(t => inside(quad(start, control, tip, t), [from, to]))
          .length
      }
      offset = tries.reduce((best, o) => (hits(o) < hits(best) ? o : best), tries[0]!)
    }
    if (!offset) {
      const start = exit(a, sizes[from]!, b),
        tip = exit(b, sizes[to]!, a)
      // Three quarters along, so labels on edges that fan out stay apart.
      const t = layout === 'circular' ? 0.5 : 0.75
      return {
        start,
        commands: [{ type: 'L', p: tip }],
        tip,
        from: start,
        label: lerp(start, tip, t),
        along: (t: number) => lerp(start, tip, t),
        t
      }
    }
    const { start, control, tip } = curve(offset)
    return {
      start,
      commands: [{ type: 'Q', c: control, p: tip }],
      tip,
      from: control,
      label: quad(start, control, tip, 0.5),
      along: (t: number) => quad(start, control, tip, t),
      t: 0.5
    }
  })
  return { centers, routes }
}

/** Fits the canvas around the nodes and everything the edges reach, and writes the geometry. */
function fit(
  layout: RelationGraphLayout,
  nodes: readonly RelationGraphNode[],
  edges: readonly RelationGraphEdge[],
  sizes: readonly Size[],
  centers: readonly Point[],
  routes: readonly Route[]
): RelationGraphGeometry {
  const xs: number[] = [],
    ys: number[] = []
  centers.forEach((c, i) => {
    xs.push(c.x - sizes[i]!.width / 2, c.x + sizes[i]!.width / 2)
    ys.push(c.y - sizes[i]!.height / 2, c.y + sizes[i]!.height / 2)
  })
  routes.forEach((route, at) => {
    for (const command of route.commands) {
      for (const p of command.type === 'L'
        ? [command.p]
        : command.type === 'Q'
          ? [command.c, command.p]
          : [command.c1, command.c2, command.p]) {
        xs.push(p.x)
        ys.push(p.y)
      }
    }
    const half = labelWidth(edges[at]!.label) / 2
    xs.push(route.label.x - half, route.label.x + half)
    ys.push(route.label.y - LABEL_HEIGHT / 2, route.label.y + LABEL_HEIGHT / 2)
  })
  const dx = MARGIN - Math.min(...xs),
    dy = MARGIN - Math.min(...ys)
  const move = (p: Point) => ({ x: p.x + dx, y: p.y + dy })
  return {
    width: Math.ceil(Math.max(...xs) + dx + MARGIN),
    height: Math.ceil(Math.max(...ys) + dy + MARGIN),
    nodes: centers.map((c, i) => ({
      x: round(c.x + dx - sizes[i]!.width / 2),
      y: round(c.y + dy - sizes[i]!.height / 2),
      width: sizes[i]!.width,
      height: sizes[i]!.height
    })),
    edges: routes.map(route => {
      const head = arrowhead(route)
      const last = route.commands.length - 1
      const path = [
        `M${pt(move(route.start))}`,
        ...route.commands.map((command, at) => {
          const p = move(at === last ? head.base : command.p)
          if (command.type === 'L') return `L${pt(p)}`
          if (command.type === 'Q') return `Q${pt(move(command.c))} ${pt(p)}`
          return `C${pt(move(command.c1))} ${pt(move(command.c2))} ${pt(p)}`
        })
      ].join('')
      const [tip, left, right] = head.points.map(move)
      return {
        path,
        arrow: `M${pt(tip!)}L${pt(left!)}L${pt(right!)}Z`,
        label: { x: round(route.label.x + dx), y: round(route.label.y + dy) }
      }
    }),
    rows: layout === 'circular' ? [nodes.map((_, at) => at)] : rowsOf(centers),
    ring: layout === 'circular'
  }
}

/**
 * The nearest node within 45 degrees of a physical `direction`, preferring one in `linked`;
 * nodes straight ahead count as nearer than nodes off to the side. -1 when there is none.
 */
export function neighbourInDirection(
  current: number,
  direction: Point,
  boxes: readonly RelationGraphBox[],
  linked: readonly number[]
) {
  const center = (box: RelationGraphBox) => ({
    x: box.x + box.width / 2,
    y: box.y + box.height / 2
  })
  const from = center(boxes[current]!)
  const nearest = (candidates: readonly number[]) => {
    let best = -1,
      score = Infinity
    for (const other of candidates) {
      if (other === current) continue
      const to = center(boxes[other]!)
      const vx = to.x - from.x,
        vy = to.y - from.y
      const along = vx * direction.x + vy * direction.y
      const across = Math.abs(vx * direction.y - vy * direction.x)
      if (along <= 0.5 || across > along) continue
      const value = along + across * 2
      if (value < score) {
        score = value
        best = other
      }
    }
    return best
  }
  const near = nearest(linked)
  return near >= 0 ? near : nearest(boxes.map((_, at) => at))
}

export type RelationGraphKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'

/**
 * The node an arrow key moves to, or -1 to stay. Left and Right move to the previous and next
 * node in the row, mirrored in right-to-left text; in `circular`, the row is the ring and wraps.
 * Up and Down move to the nearest node in the row above or below, preferring one joined by an
 * edge; in `circular`, to the nearest node in that direction, preferring a joined one. Every node
 * can be reached from every other.
 */
export function relationGraphStep(
  geometry: RelationGraphGeometry,
  current: number,
  key: RelationGraphKey,
  rtl: boolean,
  linked: readonly number[]
) {
  const horizontal = key === 'ArrowLeft' || key === 'ArrowRight'
  if (geometry.ring) {
    const count = geometry.nodes.length
    if (horizontal) {
      if (count < 2) return -1
      const forward = (key === 'ArrowRight') !== rtl
      return (current + (forward ? 1 : count - 1)) % count
    }
    return neighbourInDirection(
      current,
      { x: 0, y: key === 'ArrowDown' ? 1 : -1 },
      geometry.nodes,
      linked
    )
  }
  const row = geometry.rows.findIndex(r => r.includes(current))
  if (horizontal) {
    const forward = (key === 'ArrowRight') !== rtl
    const at = geometry.rows[row]!.indexOf(current) + (forward ? 1 : -1)
    return geometry.rows[row]![at] ?? -1
  }
  const target = geometry.rows[row + (key === 'ArrowDown' ? 1 : -1)]
  if (!target) return -1
  const x = (i: number) => geometry.nodes[i]!.x + geometry.nodes[i]!.width / 2
  const nearest = (candidates: readonly number[]) =>
    candidates.reduce(
      (best, other) =>
        best < 0 || Math.abs(x(other) - x(current)) < Math.abs(x(best) - x(current)) ? other : best,
      -1
    )
  const near = nearest(target.filter(i => linked.includes(i)))
  return near >= 0 ? near : nearest(target)
}
