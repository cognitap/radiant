import assert from 'node:assert/strict'
import test from 'node:test'
import {
  arcLevels,
  defaultArcText,
  describeToken,
  layoutArcs,
  spanLanes
} from '../dist/library/internal/annotatedText.js'

test('touching spans take different lanes; nested spans sit inside; apart spans share one', () => {
  // 0-2 and 2-4 touch at token 2, 1-1 nests in 0-2, 6-7 is apart from all.
  assert.deepEqual(
    spanLanes([
      { start: 0, end: 2, label: 'a', series: 1 },
      { start: 2, end: 4, label: 'b', series: 2 },
      { start: 1, end: 1, label: 'c', series: 3 },
      { start: 6, end: 7, label: 'd', series: 4 }
    ]),
    [1, 0, 0, 0]
  )
})

test('arc levels clear enclosed and crossing arcs; arcs sharing only an end share a level', () => {
  // 2→1 and 2→5 share token 2 only; 2→7 encloses 2→5; 4→6 crosses 2→5 and sits in 2→7.
  assert.deepEqual(
    arcLevels([
      { from: 2, to: 1 },
      { from: 2, to: 5 },
      { from: 2, to: 7 },
      { from: 4, to: 6 }
    ]),
    [1, 2, 3, 1]
  )
  // Nested arcs that share an endpoint stack.
  assert.deepEqual(
    arcLevels([
      { from: 0, to: 3 },
      { from: 0, to: 1 },
      { from: 0, to: 2 }
    ]),
    [3, 1, 2]
  )
})

test('describeToken lists labels, spans and arcs, with a caller arc text', () => {
  const tokens = [{ text: 'delay', labels: ['binding', ' '] }, { text: 'retry' }]
  const spans = [{ start: 0, end: 1, label: 'Statement', series: 1 }]
  const arcs = [{ from: 0, to: 1, label: 'assigned from' }]
  assert.equal(
    describeToken(0, tokens, spans, arcs),
    'binding. Statement. delay → retry: assigned from'
  )
  assert.equal(defaultArcText({ from: 'a', to: 'b' }), 'a → b')
  assert.equal(
    describeToken(
      1,
      tokens,
      spans,
      arcs,
      ({ from, to, label }) => `${label} from ${from} to ${to}`
    ),
    'Statement. assigned from from delay to retry'
  )
})

const numbers = path => path.match(/-?\d+(\.\d+)?/g).map(Number)

/**
 * The x where each arc meets each of its tokens, and the x range of the arc's top on that
 * token's line.
 */
function endsOf(arcs, geometry) {
  return arcs.flatMap((arc, index) => {
    const { paths, arrow } = geometry[index]
    const toX = numbers(arrow).at(-2)
    if (paths.length === 1) {
      const fromX = numbers(paths[0])[0]
      const range = [Math.min(fromX, toX), Math.max(fromX, toX)]
      return [
        { arc: index, token: arc.from, x: fromX, range },
        { arc: index, token: arc.to, x: toX, range }
      ]
    }
    return paths.map((path, piece) => {
      const values = numbers(path)
      const x = values[0],
        edge = values.at(-1)
      return {
        arc: index,
        token: piece === 0 ? arc.from : arc.to,
        x,
        range: [Math.min(x, edge), Math.max(x, edge)]
      }
    })
  })
}

function assertNoCrossing(arcs, geometry) {
  const levels = arcLevels(arcs)
  const ends = endsOf(arcs, geometry)
  for (const high of ends)
    for (const low of ends) {
      if (high.token !== low.token || levels[high.arc] <= levels[low.arc]) continue
      assert.ok(
        high.x <= low.range[0] || high.x >= low.range[1],
        `arc ${high.arc} rises through arc ${low.arc} at token ${high.token}`
      )
    }
}

// Eight 40px tokens 10px apart on one line from x = 0, or wrapped after the fourth token.
const box = (index, perLine = 8) => ({
  left: (index % perLine) * 50,
  top: 30 + Math.floor(index / perLine) * 80,
  width: 40
})
const frame = { start: 0, end: 400, step: 20 }
const fan = [
  { from: 2, to: 1, label: 'agent' },
  { from: 2, to: 5, label: 'theme' },
  { from: 2, to: 7, label: 'time' },
  { from: 2, to: 0 },
  { from: 5, to: 4 },
  { from: 6, to: 5 }
]

test('arcs meeting one token never rise through a lower arc on one line', () => {
  const boxes = Array.from({ length: 8 }, (_, index) => box(index))
  const geometry = layoutArcs(fan, boxes, frame)
  assertNoCrossing(fan, geometry)
  // The token's ends run from left-going arcs (lowest leftmost) to right-going arcs (lowest rightmost).
  const atTwo = endsOf(fan, geometry)
    .filter(end => end.token === 2)
    .sort((a, b) => a.x - b.x)
    .map(end => end.arc)
  assert.deepEqual(atTwo, [0, 3, 2, 1])
})

test('arcs meeting one token never rise through a lower arc across a wrap or in right-to-left text', () => {
  const wrapped = Array.from({ length: 8 }, (_, index) => box(index, 4))
  assertNoCrossing(fan, layoutArcs(fan, wrapped, frame))
  const mirrored = wrapped.map(item => ({ ...item, left: 360 - item.left }))
  assertNoCrossing(fan, layoutArcs(fan, mirrored, { ...frame, start: 400, end: 0 }))
})

test('an arc whose ends are three lines apart draws one piece at each end', () => {
  const boxes = Array.from({ length: 9 }, (_, index) => box(index, 3))
  const [geometry] = layoutArcs([{ from: 1, to: 7, label: 'far' }], boxes, frame)
  assert.equal(geometry.paths.length, 2)
  const [first, second] = geometry.paths.map(numbers)
  // From token 1 on the first line toward the line end; into token 7 on the third line from its start.
  assert.equal(first[1], boxes[1].top - 1)
  assert.equal(first.at(-1), frame.end)
  assert.equal(second[1], boxes[7].top - 1)
  assert.equal(second.at(-1), frame.start)
  assert.ok(second[0] > boxes[7].left && second[0] < boxes[7].left + boxes[7].width)
})
