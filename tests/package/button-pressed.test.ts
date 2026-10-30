import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button } from '@cognitap/radiant'

test('Button only owns aria-pressed when its pressed API is present and forwards resolved native props', () => {
  const plain = renderToStaticMarkup(h(Button, null, 'Continue'))
  assert.doesNotMatch(plain, /aria-pressed=/)
  const legacy = renderToStaticMarkup(h(Button, { 'aria-pressed': 'mixed' }, 'Mixed'))
  assert.match(legacy, /aria-pressed="mixed"/)
  let requests = 0
  for (const props of [
    { pressed: true },
    { defaultPressed: true },
    { defaultPressed: false },
    { onPressedChange: () => requests++ }
  ]) {
    const html = renderToStaticMarkup(
      h(
        Button,
        { ...props, name: 'format', value: 'bold', render: resolved => h('button', resolved) },
        'Bold'
      )
    )
    assert.match(
      html,
      new RegExp(`aria-pressed="${'pressed' in props || props.defaultPressed === true}"`)
    )
    assert.match(html, /type="button"/)
    assert.match(html, /name="format"/)
    assert.match(html, /value="bold"/)
    assert.doesNotMatch(html, /defaultPressed|onPressedChange/)
  }
  assert.equal(requests, 0)
  const collision = { pressed: true, defaultPressed: false }
  // @ts-expect-error Runtime callers still receive the ownership guard.
  assert.throws(() => renderToStaticMarkup(h(Button, collision)), /controlled value or a default/)
})
