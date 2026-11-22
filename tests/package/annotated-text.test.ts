import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AnnotatedText } from '@cognitap/radiant'
test('AnnotatedText renders a named group of focusable tokens on the server', () => {
  const html = renderToStaticMarkup(
    h(AnnotatedText, {
      'aria-label': 'Review',
      'data-slot': 'review',
      tokens: [{ text: 'retry', labels: ['call'] }, { text: 'attempts' }],
      spans: [{ start: 0, end: 1, label: 'Call', series: 2 }],
      arcs: [{ from: 1, to: 0, label: 'passed to' }]
    })
  )
  assert.match(html, /^<div aria-label="Review" data-slot="annotated-text review" role="group"/)
  assert.match(html, /<ol role="list" data-slot="annotated-text-tokens"/)
  assert.match(
    html,
    /<li data-slot="annotated-text-token" data-index="0" tabindex="0" aria-label="retry"/
  )
  assert.match(html, /data-index="1" tabindex="-1" aria-label="attempts"/)
  assert.match(html, /data-slot="annotated-text-label"[^>]*>call<\/span>/)
  assert.match(
    html,
    /data-slot="annotated-text-span"[^>]*data-series="2"[^>]*data-start=""[^>]*>Call<\/span>/
  )
  assert.match(
    html,
    /data-slot="annotated-text-description" class="sr-only">call\. Call\. attempts → retry: passed to<\/span>/
  )
  assert.match(
    html,
    /<svg aria-hidden="true" focusable="false" data-slot="annotated-text-arcs"[^>]*><\/svg>/
  )
  assert.throws(
    () => renderToStaticMarkup(h(AnnotatedText, { 'aria-label': 'x', tokens: [] })),
    /at least one token/
  )
})
