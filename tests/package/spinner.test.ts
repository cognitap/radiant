import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Spinner, Button } from '@cognitap/radiant'
test('Spinner distinguishes decorative and named server markup without live announcements', () => {
  const decorative = renderToStaticMarkup(
    h(Spinner, {
      ...JSON.parse('{"role":"status","aria-label":"Wrong","aria-live":"assertive","tabIndex":0}')
    })
  )
  assert.match(decorative, /aria-hidden="true"/)
  assert.doesNotMatch(decorative, /role=|aria-label=|aria-live=|tabindex=/)
  const named = renderToStaticMarkup(h(Spinner, { label: 'Loading account' }))
  assert.match(named, /role="img"/)
  assert.match(named, /aria-label="Loading account"/)
  assert.doesNotMatch(named, /aria-hidden=|aria-live=/)
  assert.throws(() => renderToStaticMarkup(h(Spinner, { label: '  ' })), /Spinner label/)
  const pending = renderToStaticMarkup(h(Button, { pending: true }, 'Save'))
  assert.match(pending, /aria-busy="true"/)
  assert.match(pending, /data-slot="spinner"/)
  assert.doesNotMatch(pending, /role="status"|aria-live=/)
})
