import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  RegionStage,
  RegionStageControls,
  RegionStagePin,
  RegionStageRegion,
  RegionStageViewport
} from '@cognitap/radiant'
test('RegionStage renders a named group with toggle regions and pins on the server', () => {
  const html = renderToStaticMarkup(
    h(
      RegionStage,
      { 'aria-label': 'Plan', defaultValue: 'a' },
      h(RegionStageControls, { zoomInLabel: 'In', zoomOutLabel: 'Out', zoomResetLabel: 'Reset' }),
      h(
        RegionStageViewport,
        { viewBox: '0 0 100 50' },
        h(RegionStageRegion, { value: 'a', 'aria-label': 'Lobby', series: 2, d: 'M0 0h50v50H0z' }),
        h(RegionStagePin, { x: 75, y: 25, 'aria-label': 'Exit' }, 'Stairs')
      )
    )
  )
  assert.match(
    html,
    /^<div aria-label="Plan" role="group" data-slot="region-stage" data-type="single"/
  )
  assert.match(html, /aria-label="In"[^>]*data-slot="button region-stage-zoom-in"/)
  assert.match(html, /<svg viewBox="0 0 100 50"[^>]*data-slot="region-stage-viewport"/)
  assert.match(html, /<g data-slot="region-stage-content" transform="translate\(0 0\) scale\(1\)">/)
  assert.match(
    html,
    /<g aria-label="Lobby" role="button" tabindex="-1" aria-pressed="true" data-slot="region-stage-region" data-value="a" data-series="2" data-selected=""/
  )
  assert.match(html, /<path d="M0 0h50v50H0z"><\/path>/)
  assert.match(html, /aria-label="Exit"[^>]*role="button" tabindex="-1" aria-expanded="false"/)
  assert.throws(
    () => renderToStaticMarkup(h(RegionStage, { 'aria-label': 'Plan', maxZoom: 0 })),
    /maxZoom/
  )
})
