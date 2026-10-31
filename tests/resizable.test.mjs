import assert from 'node:assert/strict'
import test from 'node:test'
import {
  checkResizableItems,
  checkResizableValue,
  resizableRanges,
  resizePanel,
  resizableIndex
} from '../dist/library/internal/resizable.js'
const items = [
  { value: 'navigation', min: 15, max: 40, collapsible: true },
  { value: 'records', min: 30, max: 70 },
  { value: 'inspector', min: 15, max: 40 }
]
const initial = [20, 50, 30]
test('Resizable validates the complete declarative registry and one percentage per panel', () => {
  checkResizableItems(items)
  checkResizableValue(items, initial)
  for (const entries of [
    [],
    [{ value: 'one' }],
    [{ value: 'a' }, { value: 'a' }],
    [{ value: ' ' }, { value: 'b' }],
    [{ value: 'a', min: -1 }, { value: 'b' }],
    [{ value: 'a', max: 101 }, { value: 'b' }],
    [{ value: 'a', min: 80, max: 20 }, { value: 'b' }]
  ])
    assert.throws(() => checkResizableItems(entries), TypeError)
  for (const value of [
    null,
    [],
    [20, 80],
    [20, 40, 30],
    [10, 60, 30],
    [20, NaN, 30],
    [20, Infinity, 30],
    [20, '50', 30]
  ])
    assert.throws(() => checkResizableValue(items, value), TypeError)
  assert.throws(() => resizableIndex(items, 'absent'), TypeError)
})
test('each separator bounds its adjacent pair and preserves every other panel', () => {
  assert.deepEqual(resizableRanges(items, initial, 0), [
    [0, 0],
    [15, 40]
  ])
  assert.deepEqual(resizableRanges(items, initial, 1), [[40, 65]])
  assert.deepEqual(resizePanel(items, initial, 1, 90), [20, 65, 15])
  assert.deepEqual(resizePanel(items, initial, 2, 90), [20, 40, 40])
  assert.deepEqual(initial, [20, 50, 30])
  assert.equal(resizePanel(items, initial, 0, 20), initial)
})
test('collapsible gaps have directional keyboard steps and nearest pointer positions', () => {
  const config = [
    { value: 'a', min: 20, max: 80, collapsible: true },
    { value: 'b', min: 20, max: 100 }
  ]
  assert.deepEqual(resizePanel(config, [20, 80], 0, 19), [0, 100])
  assert.deepEqual(resizePanel(config, [0, 100], 0, 1), [20, 80])
  assert.deepEqual(resizePanel(config, [20, 80], 0, 19, false), [20, 80])
  assert.deepEqual(resizePanel(config, [20, 80], 0, 9, false), [0, 100])
  const closed = [
    { value: 'a', min: 20, max: 80, collapsible: true },
    { value: 'b', min: 20, max: 80 }
  ]
  assert.deepEqual(resizableRanges(closed, [40, 60], 0), [[20, 80]])
})
test('decimal percentages retain exact configured edges rather than acquiring binary addition tails', () => {
  const config = [
    { value: 'a', min: 0.1, max: 0.3 },
    { value: 'b', min: 0.2, max: 0.4 },
    { value: 'c', min: 99.3, max: 99.7 }
  ]
  const value = [0.1, 0.2, 99.7]
  checkResizableValue(config, value)
  assert.deepEqual(resizableRanges(config, value, 0), [[0.1, 0.1]])
  assert.equal(resizePanel(config, value, 0, 0.1), value)
})
test('a broad sequence of bounded changes remains finite, conserved and valid', () => {
  let value = [...initial]
  for (let index = 0; index < 3; index++)
    for (let size = -50; size <= 150; size += 0.25) {
      const before = [...value],
        next = resizePanel(items, value, index, size)
      checkResizableValue(items, next)
      assert.deepEqual(value, before)
      assert.equal(
        next.reduce((a, b) => a + b, 0),
        100
      )
      const neighbor = index === 2 ? 1 : index + 1
      for (let other = 0; other < 3; other++)
        if (other !== index && other !== neighbor) assert.equal(next[other], value[other])
      value = next
    }
})

test('pointer fractions do not erase a feasible collapsed boundary through floating-point roundoff', () => {
  const config = [
    { value: 'files', min: 20, max: 50, collapsible: true },
    { value: 'preview', min: 40, max: 100 }
  ]
  const value = [35.73831775700935, 64.26168224299066]
  checkResizableValue(config, value)
  assert.deepEqual(resizableRanges(config, value, 0), [
    [0, 0],
    [20, 50]
  ])
  assert.deepEqual(resizePanel(config, value, 0, 0), [0, 100])
})
