import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cn } from '../dist/library/cn.js'
import { typographyRoles } from '../dist/library/index.js'

test('registered non-color role utilities merge by property without removing other decisions', () => {
  for (const role of typographyRoles)
    for (const [prefix, leaf, caller] of [
      ['font', 'family', 'font-mono'],
      ['font', 'weight', 'font-bold'],
      ['text', 'size', 'text-xl'],
      ['text', 'fluid-size', 'text-xl'],
      ['leading', 'line-height', 'leading-loose'],
      ['tracking', 'letter-spacing', 'tracking-wide'],
      ['max-inline', 'measure', 'max-inline-none']
    ]) {
      const original = `${prefix}-(--rad-typography-roles-${role}-${leaf})`
      assert.equal(cn(original, caller), caller)
      assert.equal(cn(caller, original), original)
    }
  assert.equal(cn('mbs-(--rad-typography-flow-paragraph)', 'mbs-0'), 'mbs-0')
})
