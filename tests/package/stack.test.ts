import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Stack } from '@cognitap/radiant'
test('Stack renders a flex div spaced by the theme spacing scale on the server', () => {
  const html = renderToStaticMarkup(
    h(Stack, { id: 'actions', 'data-slot': 'toolbar', style: { width: 320 } }, h('span', null, 'A'))
  )
  assert.match(html, /^<div id="actions"/)
  assert.match(html, /data-slot="stack toolbar"/)
  assert.match(html, /flex-col/)
  assert.match(html, /gap-\[var\(--rad-spacing-normal,1rem\)\]/)
  assert.match(html, /items-stretch/)
  assert.match(html, /style="width:320px"/)
  assert.doesNotMatch(html, /role=|tabindex=| direction=| gap=| align=| justify=| wrap=/)
  const row = renderToStaticMarkup(
    h(Stack, {
      direction: 'horizontal',
      gap: 'airy',
      align: 'center',
      justify: 'between',
      wrap: true
    })
  )
  for (const name of [
    'flex-row',
    'rad-spacing-airy',
    'items-center',
    'justify-between',
    'flex-wrap'
  ])
    assert.ok(row.includes(name), name)
  for (const [prop, value] of [
    ['direction', 'diagonal'],
    ['gap', 'large'],
    ['align', 'baseline'],
    ['justify', 'space-between']
  ])
    assert.throws(
      () => renderToStaticMarkup(h(Stack, { [prop]: value })),
      new RegExp(`Stack ${prop} must be one of`)
    )
})
