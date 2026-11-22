import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clampView,
  panBy,
  parseViewBox,
  revealBox,
  zoomAt
} from '../dist/library/internal/regionStage.js'

const box = { x: 10, y: 20, width: 400, height: 200 }

test('viewBox parsing accepts four numbers with a positive size', () => {
  assert.deepEqual(parseViewBox(' 10,20 400 200 '), box)
  for (const value of ['0 0 0 10', '0 0 10', '0 0 a 10', '0 0 10 -1'])
    assert.throws(() => parseViewBox(value), TypeError)
})

test('zoom keeps the point under it and stays within 1 and the maximum', () => {
  const view = zoomAt({ zoom: 1, x: 0, y: 0 }, 2, { x: 110, y: 70 }, box, 4)
  assert.equal(view.zoom, 2)
  // Content point 110, 70 maps to itself: 110 * 2 + x = 110.
  assert.equal(110 * view.zoom + view.x, 110)
  assert.equal(70 * view.zoom + view.y, 70)
  assert.equal(zoomAt(view, 10, { x: 0, y: 0 }, box, 4).zoom, 4)
  assert.deepEqual(zoomAt(view, 0.1, { x: 0, y: 0 }, box, 4), { zoom: 1, x: 0, y: 0 })
})

test('panning stops where the content would leave part of the viewBox empty', () => {
  const view = { zoom: 2, x: -10, y: -20 }
  assert.deepEqual(clampView(view, box, 4), view)
  assert.deepEqual(panBy(view, 1000, 1000, box, 4), { zoom: 2, x: -10, y: -20 })
  assert.deepEqual(panBy(view, -1000, -1000, box, 4), { zoom: 2, x: -410, y: -220 })
})

test('revealing a box keeps a visible one in place and centers a hidden one', () => {
  const view = { zoom: 2, x: -10, y: -20 }
  assert.equal(revealBox(view, { x: 20, y: 30, width: 10, height: 10 }, box, 4), view)
  const moved = revealBox(view, { x: 300, y: 150, width: 20, height: 20 }, box, 4)
  assert.equal(310 * moved.zoom + moved.x, 210)
  assert.equal(160 * moved.zoom + moved.y, 120)
})
