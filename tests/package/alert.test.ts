import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Alert, AlertTitle, AlertDescription } from '@cognitap/radiant'
test('Alert server output keeps static content quiet and makes live urgency explicit', () => {
  const content = [
    h(AlertTitle, { level: 3, key: 'title' }, 'Save failed'),
    h(AlertDescription, { key: 'description' }, 'Your draft is safe. Try again.')
  ]
  const html = renderToStaticMarkup(h(Alert, { tone: 'danger' }, ...content))
  assert.doesNotMatch(html, /role=|aria-live=|tabindex=/)
  assert.match(html, /<h3/)
  assert.match(html, /Save failed/)
  for (const [announce, role] of [
    ['polite', 'status'],
    ['assertive', 'alert']
  ]) {
    const live = renderToStaticMarkup(
      h(
        Alert,
        {
          ...JSON.parse(
            `{"announce":"${announce}","role":"dialog","aria-live":"off","aria-atomic":false}`
          )
        },
        ...content
      )
    )
    assert.match(live, new RegExp(`role="${role}"`))
    assert.doesNotMatch(live, /aria-live|aria-atomic/)
  }
  assert.match(
    renderToStaticMarkup(h(Alert, { 'aria-label': 'Draft notice' }, 'Saved')),
    /role="group"/
  )
  assert.throws(
    () => renderToStaticMarkup(h(Alert, JSON.parse('{"announce":"always"}'))),
    /Alert announce/
  )
})
