// @ts-nocheck
import assert from 'node:assert/strict'
import test from 'node:test'
import { createSpring, bindSpringSource } from '@cognitap/radiant/motion'

test('a subscribed source owns targets until detached, while the spring keeps its lifecycle', () => {
  const source = createSpring(20, { enabled: false })
  const follower = createSpring(0, { enabled: false })
  assert.throws(() => bindSpringSource(follower, follower), /itself/)
  const off = bindSpringSource(follower, source)
  assert.equal(follower.get(), 20)
  source.to(80)
  assert.equal(follower.get(), 80)
  follower.stop()
  source.to(100)
  assert.equal(follower.get(), 100)
  off()
  off()
  source.to(200)
  assert.equal(follower.get(), 100)
  follower.to(30)
  assert.equal(follower.get(), 30)
  follower.destroy()
  source.destroy()
})

test('binding reads the latest snapshot after subscription and cleans up invalid initial sources', () => {
  const follower = createSpring(0, { enabled: false })
  let value = 10
  let removals = 0
  const source = {
    get: () => value,
    subscribe(listener) {
      value = 30
      listener(20)
      return () => removals++
    }
  }
  const off = bindSpringSource(follower, source)
  assert.equal(follower.get(), 30)
  off()
  assert.equal(removals, 1)
  assert.throws(() => bindSpringSource(follower, { ...source, get: () => NaN }), /finite/)
  assert.equal(removals, 2)
  assert.equal(follower.get(), 20)
  follower.destroy()
})
