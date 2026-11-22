import assert from 'node:assert/strict'
import test from 'node:test'
import {
  arrangeContainers,
  containerOf,
  hasRoom,
  moveToContainer,
  relocate,
  sameLayout
} from '../dist/library/internal/dragAndDrop.js'

test('placement keeps first places, drops unknowns and seats unplaced items first', () => {
  assert.deepEqual(
    arrangeContainers({ b: ['y', 'gone', 'x'], a: ['x'], c: ['z'] }, ['a', 'b'], ['x', 'y', 'w']),
    { a: ['x', 'w'], b: ['y'] }
  )
  assert.deepEqual(arrangeContainers(undefined, ['a', 'b'], ['x']), { a: ['x'], b: [] })
  assert.deepEqual(arrangeContainers({ a: 'x' }, ['a'], ['x']), { a: ['x'] })
})

test('moves clamp to the target, and room counts the item already there', () => {
  const layout = { a: ['x', 'y'], b: ['z'] }
  assert.deepEqual(moveToContainer(layout, 'x', 'b', 0), { a: ['y'], b: ['x', 'z'] })
  assert.deepEqual(moveToContainer(layout, 'x', 'b', Infinity), { a: ['y'], b: ['z', 'x'] })
  assert.deepEqual(moveToContainer(layout, 'y', 'a', -3), { a: ['y', 'x'], b: ['z'] })
  assert.equal(moveToContainer(layout, 'x', 'missing', 0), layout)
  assert.equal(containerOf(layout, 'z'), 'b')
  assert.equal(containerOf(layout, 'q'), undefined)
  assert.equal(hasRoom(layout, 'b', 'x', 1), false)
  assert.equal(hasRoom(layout, 'b', 'z', 1), true)
  assert.equal(hasRoom(layout, 'b', 'x', undefined), true)
  assert.equal(sameLayout(layout, { a: ['x', 'y'], b: ['z'] }), true)
  assert.equal(sameLayout(layout, { a: ['y', 'x'], b: ['z'] }), false)
  assert.equal(sameLayout(layout, { a: ['x', 'y'] }), false)
})

test('a reported move keeps unknown containers and items that have not rendered', () => {
  const raw = { todo: ['later', 'x'], done: ['y', 'gone'], archive: ['z'] }
  assert.deepEqual(relocate(raw, ['todo', 'done'], ['x', 'y'], 'x', 'done', 0), {
    todo: ['later'],
    done: ['x', 'y', 'gone'],
    archive: ['z']
  })
  assert.deepEqual(relocate(undefined, ['a', 'b'], ['x'], 'x', 'b', 0), { a: [], b: ['x'] })
})
