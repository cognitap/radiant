import assert from 'node:assert/strict'
import { test } from 'node:test'
import { positionPopover } from '../dist/library/internal/popover.js'

const input = {
  anchor: { top: 200, bottom: 240, left: 300, right: 380, width: 80, height: 40 },
  viewport: { top: 0, left: 0, width: 800, height: 600 },
  width: 200,
  height: 120,
  side: 'bottom',
  align: 'start',
  offset: 8,
  padding: 8,
  rtl: false
}
test('anchored surfaces support physical sides, logical alignment and opposite-side collision flips', () => {
  for (const [side, left, top] of [
    ['bottom', 300, 248],
    ['top', 300, 72],
    ['left', 92, 200],
    ['right', 388, 200]
  ]) {
    assert.deepEqual(positionPopover({ ...input, side }), {
      left,
      top,
      maxWidth: side === 'left' ? 284 : side === 'right' ? 404 : 784,
      maxHeight: side === 'top' ? 184 : side === 'bottom' ? 344 : 584,
      side,
      align: 'start'
    })
  }
  assert.equal(positionPopover({ ...input, rtl: true }).left, 180)
  assert.equal(positionPopover({ ...input, align: 'end' }).left, 180)
  assert.equal(positionPopover({ ...input, align: 'center' }).left, 240)
  assert.equal(positionPopover({ ...input, height: 400, side: 'top' }).side, 'bottom')
})
test('oversize surfaces remain within scrolled and narrow visual viewports', () => {
  for (const side of ['top', 'right', 'bottom', 'left']) {
    const viewport = { top: 100, left: 50, width: 320, height: 250 }
    const p = positionPopover({ ...input, side, width: 1000, height: 1000, viewport })
    assert.ok(p.left >= 58 && p.left + p.maxWidth <= 362)
    assert.ok(p.top >= 108 && p.top + p.maxHeight <= 342)
  }
})
