import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AspectRatio } from '@cognitap/radiant'
test('AspectRatio reserves a native CSS box on the server without adding semantics', () => {
  const html = renderToStaticMarkup(
    h(
      AspectRatio,
      {
        ratio: 16 / 9,
        id: 'media',
        'data-slot': 'product',
        style: { width: 320, borderRadius: '8px' }
      },
      h('img', { src: 'data:image/svg+xml,test', alt: 'Mountains' })
    )
  )
  assert.match(html, /<div id="media"/)
  assert.match(html, /data-slot="aspect-ratio product"/)
  assert.match(html, /aspect-ratio:1\.777/)
  assert.match(html, /width:320px;border-radius:8px/)
  assert.match(html, /<img[^>]+alt="Mountains"/)
  assert.doesNotMatch(html, /role=|tabindex=|aria-hidden=| ratio=/)
  assert.match(renderToStaticMarkup(h(AspectRatio)), /aspect-ratio:1/)
  assert.match(
    renderToStaticMarkup(h(AspectRatio, { ratio: 2, style: { aspectRatio: '3 / 2' } })),
    /aspect-ratio:3 \/ 2/
  )
  for (const ratio of [0, -1, NaN, Infinity])
    assert.throws(
      () => renderToStaticMarkup(h(AspectRatio, { ratio })),
      /finite number greater than zero/
    )
})
