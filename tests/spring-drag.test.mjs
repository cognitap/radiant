import assert from 'node:assert/strict'
import test from 'node:test'
import { createSpringDrag } from '../dist/library/motion/index.js'
test('drag uses bounded samples, signed fresh velocity and deterministic projected snap', () => {
  const drag = createSpringDrag(0, { min: 0, max: 160, snapPoints: [0, 80, 160], enabled: false })
  drag.begin()
  drag.move(20, 10)
  drag.move(60, 30)
  assert.deepEqual(drag.release(30), { target: 80, velocity: 0 })
  assert.equal(drag.get(), 80)
  drag.configure({ enabled: true })
  drag.begin()
  drag.move(60, 100)
  drag.move(40, 120)
  assert.deepEqual(drag.release(120), { target: 0, velocity: -1000 })
  drag.configure({ enabled: false })
  assert.equal(drag.get(), 0)
  drag.begin()
  drag.move(999, 200)
  assert.equal(drag.get(), 160)
  drag.cancel()
  assert.equal(drag.get(), 0)
  drag.begin()
  drag.move(40, 300)
  drag.move(60, 320)
  assert.equal(drag.release(500).velocity, 0)
  drag.step('last')
  assert.equal(drag.get(), 160)
  drag.step(-1)
  assert.equal(drag.get(), 80)
  assert.throws(() => drag.configure({ snapPoints: [200] }), /Snap/)
  assert.equal(drag.get(), 80)
  drag.destroy()
  drag.to(0)
  assert.equal(drag.get(), 80)
})
test('drag constraints reject malformed bounds and unsupported neutral policies', () => {
  for (const options of [
    { min: 1, max: 1 },
    { min: NaN, max: 100 },
    { min: 0, max: 100, snapPoints: [] },
    { min: 0, max: 100, reducedValue: 1 }
  ])
    assert.throws(() => createSpringDrag(0, options))
  assert.throws(() => createSpringDrag(200, { min: 0, max: 100 }), /Initial/)
})
