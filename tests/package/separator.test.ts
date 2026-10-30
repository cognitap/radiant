import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Separator } from '@cognitap/radiant'
test('Separator preserves native static semantics and explicit decorative treatment on the server', () => {
  const html = renderToStaticMarkup(
    h(Separator, {
      orientation: 'vertical',
      'data-slot': 'custom',
      ...JSON.parse(
        '{"role":"slider","tabIndex":0,"aria-hidden":true,"aria-orientation":"horizontal"}'
      )
    })
  )
  assert.match(html, /<hr/)
  assert.match(html, /aria-orientation="vertical"/)
  assert.match(html, /data-slot="separator custom"/)
  assert.doesNotMatch(html, /role=|tabindex=|aria-hidden=/)
  const decorative = renderToStaticMarkup(h(Separator, { decorative: true }))
  assert.match(decorative, /aria-hidden="true"/)
  assert.doesNotMatch(decorative, /aria-orientation=/)
})
