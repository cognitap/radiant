import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ComboboxProps } from '@cognitap/radiant'
import { Combobox, ComboboxInput, ComboboxPortal, ComboboxContent, Field } from '@cognitap/radiant'

const items = [
  { value: 'oslo', label: 'Oslo' },
  { value: '', label: 'Anywhere' }
]
test('Combobox renders stable native input relationships and a committed key on the server', () => {
  const html = renderToStaticMarkup(
    h(
      Field,
      { label: 'City', controlId: 'city', required: true },
      h(
        Combobox,
        { items, defaultValue: 'oslo', name: 'destination' },
        h(ComboboxInput),
        h(ComboboxPortal, null, h(ComboboxContent))
      )
    )
  )
  assert.match(html, /for="city"/)
  assert.match(html, /role="combobox"/)
  assert.match(html, /aria-expanded="false"/)
  assert.match(html, /aria-required="true"/)
  assert.match(html, /value="Oslo"/)
  assert.match(html, /name="destination"[^>]*value="oslo"/)
  assert.doesNotMatch(html, /popover=/)
})
const unchecked = (props: unknown) => renderToStaticMarkup(h(Combobox, props as ComboboxProps))

test('Combobox rejects contradictory state owners and unreadable or duplicate options', () => {
  for (const props of [
    { value: 'oslo', defaultValue: 'oslo' },
    { query: 'o', defaultQuery: 'r' },
    { open: true, defaultOpen: true }
  ])
    assert.throws(() => unchecked({ items, ...props }), /controlled value or a default/)
  assert.throws(() => unchecked({ items: [items[0], items[0]] }), /distinct/)
  assert.throws(
    () => unchecked({ items: [{ value: 'a', label: h('b', null, 'Alpha') }] }),
    /readable textValue/
  )
  assert.throws(() => renderToStaticMarkup(h(ComboboxInput)), /inside Combobox/)
})
