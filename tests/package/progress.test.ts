import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Progress } from '@cognitap/radiant'
test('Progress renders native determinate and indeterminate semantics without redundant ARIA values', () => {
  const html = renderToStaticMarkup(
    h(Progress, {
      value: 0,
      'aria-label': 'Export',
      ...JSON.parse('{"role":"slider","aria-valuenow":90,"aria-valuemin":5,"aria-valuemax":99}')
    })
  )
  assert.match(html, /<progress/)
  assert.match(html, /value="0"/)
  assert.match(html, /max="100"/)
  assert.doesNotMatch(html, /role=|aria-valuenow|aria-valuemin|aria-valuemax|aria-live/)
  for (const value of [undefined, null]) {
    const unknown = renderToStaticMarkup(h(Progress, { value, 'aria-label': 'Export' }))
    assert.doesNotMatch(unknown, / value=/)
    assert.match(unknown, /data-state="indeterminate"/)
  }
  for (const value of [-1, NaN, Infinity, 101])
    assert.throws(() => renderToStaticMarkup(h(Progress, { value })), /Progress value/)
  for (const max of [0, -1, Infinity, NaN])
    assert.throws(() => renderToStaticMarkup(h(Progress, { max })), /Progress max/)
})
