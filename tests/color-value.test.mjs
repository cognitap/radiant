import assert from 'node:assert/strict'
import test from 'node:test'
import { formatColor, parseColor } from '../dist/library/color/colorValue.js'

test('normalizes hex, modern and legacy RGB, and OKLCH with alpha', () => {
  assert.equal(formatColor(parseColor('#aBc8'), 'hex'), '#AABBCC88')
  assert.equal(formatColor(parseColor('rgba(255, 0, 0, .5)'), 'hex'), '#FF000080')
  assert.equal(formatColor(parseColor('rgb(100% 0% 0% / 50%)'), 'rgb'), 'rgb(255 0 0 / 0.5)')
  assert.equal(
    formatColor(parseColor('oklch(.7 25% .5turn / 25%)'), 'oklch'),
    'oklch(70% 0.1 180 / 0.25)'
  )
  assert.equal(formatColor(parseColor('oklch(62% 0.15 -30deg)'), 'oklch'), 'oklch(62% 0.15 330)')
})

test('malformed colors and CSS expressions are declined', () => {
  for (const value of [
    '#12345',
    'rgb(1, 2 / 3)',
    'rgb(1 2 3 /)',
    'rgb(1 2 3 / 1e309)',
    'oklch(1 .2 3%)',
    'var(--accent)',
    'red'
  ]) {
    assert.equal(parseColor(value), null, value)
  }
})
