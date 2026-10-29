import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Skeleton } from '@cognitap/radiant'
test('Skeleton server markup stays empty, decorative and quiet even with unsupported runtime semantics', () => {
  const html = renderToStaticMarkup(
    h(Skeleton, {
      ...JSON.parse(
        '{"role":"status","aria-label":"Wrong","aria-hidden":false,"aria-live":"assertive","aria-busy":true,"tabIndex":0,"contentEditable":true,"children":"Hidden control","dangerouslySetInnerHTML":{"__html":"<button>Wrong</button>"}}'
      ),
      'data-slot': 'custom-shape'
    })
  )
  assert.match(html, /<span/)
  assert.match(html, /aria-hidden="true"/)
  assert.match(html, /data-slot="skeleton custom-shape"/)
  assert.doesNotMatch(
    html,
    /role=|aria-label=|aria-live=|aria-busy=|tabindex=|contenteditable=|Wrong|Hidden control|button/
  )
  assert.match(html, /><\/span>/)
})
