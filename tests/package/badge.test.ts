import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Badge } from '@cognitap/radiant'
test('Badge keeps visible consumer text passive and makes decoration explicit in server markup', () => {
  const html = renderToStaticMarkup(
    h(
      Badge,
      {
        tone: 'warning',
        'data-slot': 'custom',
        ...JSON.parse(
          '{"role":"status","tabIndex":0,"aria-live":"assertive","aria-label":"Wrong","aria-hidden":true}'
        )
      },
      'Needs attention'
    )
  )
  assert.match(html, /Needs attention/)
  assert.match(html, /data-tone="warning"/)
  assert.match(html, /data-slot="badge custom"/)
  assert.doesNotMatch(html, /role=|tabindex=|aria-live=|aria-label=|aria-hidden=/)
  assert.match(
    renderToStaticMarkup(h(Badge, { decorative: true }, 'Approved')),
    /aria-hidden="true"/
  )
})
