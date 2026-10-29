import assert from 'node:assert/strict'
import test from 'node:test'
import { createToastTimer } from '../dist/library/internal/toast.js'
function setup(duration) {
  let now = 0,
    id = 0,
    calls = 0
  const jobs = new Map()
  const timer = createToastTimer(
    duration,
    {
      now: () => now,
      set: (fn, delay) => {
        jobs.set(++id, { fn, at: now + delay })
        return id
      },
      clear: key => jobs.delete(key)
    },
    () => calls++
  )
  const advance = ms => {
    now += ms
    for (const [key, job] of jobs)
      if (job.at <= now) {
        jobs.delete(key)
        job.fn()
      }
  }
  return { timer, advance, calls: () => calls, pending: () => jobs.size }
}
test('a paused toast retains only its remaining time and emits one elapsed request', () => {
  const t = setup(1000)
  t.timer.resume()
  t.advance(400)
  t.timer.pause()
  t.advance(2000)
  assert.equal(t.calls(), 0)
  t.timer.resume()
  t.advance(599)
  assert.equal(t.calls(), 0)
  t.advance(1)
  assert.equal(t.calls(), 1)
  t.timer.resume()
  t.advance(2000)
  assert.equal(t.calls(), 1)
})
test('persistence and cleanup schedule no future work; invalid timeouts are rejected', () => {
  const persistent = setup(0)
  persistent.timer.resume()
  assert.equal(persistent.pending(), 0)
  const timed = setup(100)
  timed.timer.resume()
  timed.timer.destroy()
  timed.advance(500)
  assert.equal(timed.calls(), 0)
  for (const value of [-1, Infinity, NaN, 2 ** 31])
    assert.throws(() => setup(value), /Toast duration/)
})
