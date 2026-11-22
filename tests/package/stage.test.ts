import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Stage,
  StageActions,
  StageBody,
  StageDescription,
  StageFooter,
  StageHeader,
  StageTitle
} from '@cognitap/radiant'
test('Stage renders a size-container div with named parts on the server', () => {
  const html = renderToStaticMarkup(
    h(
      Stage,
      { id: 'widget', 'data-slot': 'map', padding: 'tight', style: { width: 320 } },
      h(
        StageHeader,
        null,
        h(StageTitle, { level: 3 }, 'Route'),
        h(StageDescription, null, 'Station to lake'),
        h(StageActions, null, h('button', { type: 'button' }, 'Zoom'))
      ),
      h(StageBody, { aspectRatio: 1.5 }, 'Tiles'),
      h(StageFooter, null, 'Footer')
    )
  )
  assert.match(html, /^<div id="widget"/)
  assert.match(html, /data-slot="stage map"/)
  assert.match(html, /@container\/stage/)
  assert.match(html, /style="width:320px"/)
  assert.match(html, /<h3[^>]+data-slot="stage-title"[^>]*>Route<\/h3>/)
  assert.match(html, /<p[^>]+data-slot="stage-description"/)
  assert.match(html, /data-slot="stage-header"/)
  assert.match(html, /data-slot="stage-actions"/)
  assert.match(html, /data-slot="aspect-ratio stage-body"[^>]*style="aspect-ratio:1.5"/)
  assert.match(html, /data-slot="stage-footer"/)
  assert.doesNotMatch(html, /role=|tabindex=| padding=| aspectRatio=| level=/)
  assert.match(
    renderToStaticMarkup(h(StageBody)),
    /^<div class="[^"]*" data-slot="stage-body"><\/div>$/
  )
  assert.match(renderToStaticMarkup(h(StageTitle, null, 'T')), /^<h2/)
  assert.throws(
    () => renderToStaticMarkup(h(StageBody, { aspectRatio: 0 })),
    /AspectRatio ratio must be a finite number greater than zero/
  )
})
