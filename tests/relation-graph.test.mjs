import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defaultConnectionText,
  describeNodes,
  layoutRelationGraph,
  neighbourInDirection,
  nodeSize,
  relationGraphStep
} from '../dist/library/internal/relationGraph.js'

const LAYOUTS = ['tree', 'layered', 'circular']
const nodes = ids => ids.map(id => ({ id, label: id }))
const intersect = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
const overlaps = boxes => boxes.some((a, i) => boxes.some((b, j) => j > i && intersect(a, b)))
// Edge label boxes, estimated as layout does: 7 units a character plus padding, 18 high.
const labelBox = (geometry, edges, at) => {
  const width = edges[at].label.length * 7 + 12
  const { x, y } = geometry.edges[at].label
  return { x: x - width / 2, y: y - 9, width, height: 18 }
}

/** A deterministic random graph. */
function random(seed, count) {
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const list = Array.from({ length: count }, (_, i) => ({
    id: `n${i}`,
    label: 'L'.repeat(1 + Math.floor(next() * 20))
  }))
  const edges = Array.from({ length: Math.floor(next() * count * 1.5) }, () => ({
    from: `n${Math.floor(next() * count)}`,
    to: `n${Math.floor(next() * count)}`
  }))
  return { nodes: list, edges }
}

test('every layout keeps nodes apart and inside the canvas, cycles and loops included', () => {
  const ids = nodes(['a', 'b', 'c', 'd', 'e'])
  const edges = [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
    { from: 'c', to: 'a' },
    { from: 'c', to: 'd' },
    { from: 'a', to: 'e' },
    { from: 'e', to: 'e' },
    { from: 'b', to: 'a' }
  ]
  for (const layout of LAYOUTS) {
    const geometry = layoutRelationGraph(layout, ids, edges)
    assert.equal(overlaps(geometry.nodes), false, layout)
    for (const box of geometry.nodes) {
      assert.ok(box.x >= 0 && box.y >= 0, layout)
      assert.ok(
        box.x + box.width <= geometry.width && box.y + box.height <= geometry.height,
        layout
      )
    }
    assert.equal(geometry.edges.length, edges.length)
    for (const edge of geometry.edges) assert.doesNotMatch(edge.path + edge.arrow, /NaN|Infinity/)
  }
})

test('every node is reachable from the first with arrow keys, in every layout and direction', () => {
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
  for (const layout of LAYOUTS)
    for (let trial = 0; trial < 300; trial++) {
      const { nodes: list, edges } = random(trial + 7, 1 + (trial % 28))
      const geometry = layoutRelationGraph(layout, list, edges)
      assert.equal(overlaps(geometry.nodes), false, `${layout} ${trial} overlaps`)
      const linked = list.map(() => [])
      for (const { from, to } of edges) {
        const a = +from.slice(1),
          b = +to.slice(1)
        if (a !== b) {
          linked[a].push(b)
          linked[b].push(a)
        }
      }
      for (const rtl of [false, true]) {
        const seen = new Set([0])
        const queue = [0]
        while (queue.length) {
          const current = queue.pop()
          for (const key of keys) {
            const next = relationGraphStep(geometry, current, key, rtl, linked[current])
            if (next >= 0 && !seen.has(next)) {
              seen.add(next)
              queue.push(next)
            }
          }
        }
        assert.equal(seen.size, list.length, `${layout} ${trial} rtl=${rtl}`)
      }
    }
})

test('Left and Right follow the row and mirror in right-to-left text; Up and Down prefer linked nodes', () => {
  const list = nodes(['root', 'a', 'b', 'c', 'a1', 'c1'])
  const edges = [
    { from: 'root', to: 'a' },
    { from: 'root', to: 'b' },
    { from: 'root', to: 'c' },
    { from: 'a', to: 'a1' },
    { from: 'c', to: 'c1' }
  ]
  const geometry = layoutRelationGraph('tree', list, edges)
  assert.deepEqual(geometry.rows, [[0], [1, 2, 3], [4, 5]])
  assert.equal(relationGraphStep(geometry, 1, 'ArrowRight', false, [0, 4]), 2)
  assert.equal(relationGraphStep(geometry, 1, 'ArrowRight', true, [0, 4]), -1)
  assert.equal(relationGraphStep(geometry, 2, 'ArrowLeft', true, [0]), 3)
  // Down from c reaches its own child, not the nearer-indexed a1.
  assert.equal(relationGraphStep(geometry, 3, 'ArrowDown', false, [0, 5]), 5)
  assert.equal(relationGraphStep(geometry, 0, 'ArrowUp', false, [1, 2, 3]), -1)
  const ring = layoutRelationGraph('circular', nodes(['a', 'b', 'c']), [])
  assert.equal(relationGraphStep(ring, 2, 'ArrowRight', false, []), 0)
  assert.equal(relationGraphStep(ring, 0, 'ArrowRight', true, []), 2)
})

test('opposite and repeated edges across several layers each take their own route', () => {
  const list = nodes(['a', 'b', 'c', 'd'])
  const edges = [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
    { from: 'c', to: 'd' },
    { from: 'a', to: 'd' },
    { from: 'd', to: 'a' },
    { from: 'a', to: 'd' }
  ]
  const geometry = layoutRelationGraph('layered', list, edges)
  const paths = geometry.edges.slice(3).map(edge => edge.path)
  assert.equal(new Set(paths).size, 3)
  const labels = geometry.edges.slice(3).map(edge => `${edge.label.x},${edge.label.y}`)
  assert.equal(new Set(labels).size, 3)
})

test('edge labels stay clear of each other and of nodes when edges fan out', () => {
  const list = nodes(['lead', 'design', 'engineering', 'research', 'support'])
  const edges = ['design', 'engineering', 'research', 'support'].map(to => ({
    from: 'lead',
    to,
    label: 'reports to'
  }))
  for (const layout of ['tree', 'layered']) {
    const geometry = layoutRelationGraph(layout, list, edges)
    const boxes = edges.map((_, at) => labelBox(geometry, edges, at))
    assert.equal(overlaps(boxes), false, layout)
    for (const label of boxes)
      for (const node of geometry.nodes) assert.equal(intersect(label, node), false, layout)
  }
})

test('edge labels in random layered graphs stay clear of each other and of nodes', () => {
  for (let trial = 0; trial < 300; trial++) {
    const { nodes: list, edges: plain } = random(trial + 11, 1 + (trial % 28))
    const edges = plain.map((edge, at) => ({ ...edge, label: 'e'.repeat(1 + ((at * 7) % 12)) }))
    const geometry = layoutRelationGraph('layered', list, edges)
    const boxes = edges.map((_, at) => labelBox(geometry, edges, at))
    assert.equal(overlaps(boxes), false, `${trial} labels overlap`)
    for (const label of boxes)
      for (const node of geometry.nodes) assert.equal(intersect(label, node), false, `${trial}`)
  }
})

test('labels of edges from different parents into one child stay apart', () => {
  const list = nodes([
    'Web app',
    'Legacy export',
    'API gateway',
    'Orders',
    'Billing',
    'Queue',
    'Database'
  ])
  const edges = [
    { from: 'Web app', to: 'API gateway', label: 'calls' },
    { from: 'API gateway', to: 'Orders' },
    { from: 'API gateway', to: 'Billing' },
    { from: 'Orders', to: 'Queue', label: 'enqueues' },
    { from: 'Billing', to: 'Queue', label: 'publishes' },
    { from: 'Orders', to: 'Database' },
    { from: 'Billing', to: 'Database' },
    { from: 'Legacy export', to: 'Database' }
  ]
  const geometry = layoutRelationGraph('layered', list, edges)
  const boxes = [0, 3, 4].map(at => labelBox(geometry, edges, at))
  assert.equal(overlaps(boxes), false)
  for (const label of boxes)
    for (const node of geometry.nodes) assert.equal(intersect(label, node), false)
  assert.deepEqual(geometry, layoutRelationGraph('layered', list, edges))
})

test('tree edges outside the tree curve around nodes in between', () => {
  const list = nodes(['root', 'a', 'b', 'c'])
  const edges = [
    { from: 'root', to: 'a' },
    { from: 'root', to: 'b' },
    { from: 'root', to: 'c' },
    { from: 'a', to: 'c' }
  ]
  const geometry = layoutRelationGraph('tree', list, edges)
  // The curve's middle point misses b, which sits between a and c.
  const [, , qx, qy, ex, ey] = geometry.edges[3].path.match(/[-\d.]+/g).map(Number)
  const [sx, sy] = geometry.edges[3].path.match(/[-\d.]+/g).map(Number)
  const mid = { x: 0.25 * sx + 0.5 * qx + 0.25 * ex, y: 0.25 * sy + 0.5 * qy + 0.25 * ey }
  const b = geometry.nodes[2]
  assert.equal(mid.x > b.x && mid.x < b.x + b.width && mid.y > b.y && mid.y < b.y + b.height, false)
})

test('separate trees wrap onto new rows past a target width', () => {
  const list = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, label: `Isolated ${i}` }))
  const geometry = layoutRelationGraph('tree', list, [])
  assert.ok(geometry.rows.length > 1)
  assert.ok(geometry.width < 720)
})

test('layout is deterministic and a single node still lays out', () => {
  const ids = nodes(['a', 'b', 'c'])
  const edges = [
    { from: 'a', to: 'b' },
    { from: 'a', to: 'c' }
  ]
  assert.deepEqual(layoutRelationGraph('tree', ids, edges), layoutRelationGraph('tree', ids, edges))
  for (const layout of LAYOUTS)
    assert.equal(layoutRelationGraph(layout, nodes(['solo']), []).nodes.length, 1)
})

test('layered layout orders a layer to avoid crossings', () => {
  const geometry = layoutRelationGraph('layered', nodes(['a', 'b', 'c', 'd']), [
    { from: 'a', to: 'd' },
    { from: 'b', to: 'c' }
  ])
  const [a, b, c, d] = geometry.nodes
  assert.equal(a.x < b.x, d.x < c.x)
})

test('node size grows with the label and wraps long labels to two lines', () => {
  assert.equal(nodeSize('A').width, 56)
  assert.ok(nodeSize('Engineering').width > nodeSize('Web').width)
  assert.equal(nodeSize('A label far too long for one line of a node').height, 60)
})

test('describeNodes lists connections with edge descriptions, then the node description', () => {
  const list = [
    { id: 'a', label: 'A', description: 'Start' },
    { id: 'b', label: 'B' }
  ]
  const edges = [
    { from: 'a', to: 'b', label: 'next', description: 'Preferred' },
    { from: 'b', to: 'a' },
    { from: 'a', to: 'a' }
  ]
  assert.deepEqual(describeNodes(list, edges), [
    '→ B: next. Preferred. ← B. → A. Start',
    '← A: next. Preferred. → A'
  ])
  assert.deepEqual(
    describeNodes(list, edges, ({ direction, node, edge }) => `${direction} ${node.id} ${edge.to}`),
    [
      'outgoing b b. Preferred. incoming b a. outgoing a a. Start',
      'incoming a b. Preferred. outgoing a a'
    ]
  )
  assert.equal(
    defaultConnectionText({
      direction: 'incoming',
      node: { id: 'x', label: 'X' },
      edge: { from: 'x', to: 'y' }
    }),
    '← X'
  )
})

test('vertical steps on a ring prefer linked nodes within a quarter turn', () => {
  const box = (x, y) => ({ x, y, width: 10, height: 10 })
  const boxes = [box(0, 0), box(100, 0), box(40, 0), box(0, 100), box(100, 90)]
  assert.equal(neighbourInDirection(0, { x: 1, y: 0 }, boxes, [1, 3]), 1)
  assert.equal(neighbourInDirection(0, { x: 0, y: 1 }, boxes, [1, 3]), 3)
  assert.equal(neighbourInDirection(0, { x: 0, y: -1 }, boxes, [1, 3]), -1)
  assert.equal(neighbourInDirection(0, { x: 1, y: 0 }, boxes, []), 2)
})
