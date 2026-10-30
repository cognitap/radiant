import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Fieldset, Field, Input } from '@cognitap/radiant'
test('Fieldset composes Field with a native legend and group-owned descriptions while nested Fields retain their labels', () => {
  const html = renderToStaticMarkup(
    h(
      Fieldset,
      {
        legend: 'Shipping address',
        name: 'shipping',
        disabled: true,
        description: 'Destination details',
        error: 'Check the address',
        'aria-describedby': 'external',
        'data-slot': 'custom',
        parts: { legend: { className: 'italic' }, description: { style: { color: 'navy' } } }
      },
      h(
        Field,
        { label: 'Street', description: 'Street help' },
        h(Input, { name: 'street', defaultValue: '10 Main St' })
      )
    )
  )
  assert.match(html, /<fieldset[^>]*name="shipping"/)
  assert.match(html, /data-slot="field fieldset custom"/)
  assert.match(html, /<legend[^>]*class="[^"]*italic/)
  assert.match(html, />Shipping address<\/legend>/)
  assert.match(html, /aria-describedby="[^"]*-description [^"]*-error external"/)
  assert.match(html, /aria-invalid="true"/)
  assert.match(html, /role="alert"/)
  assert.match(html, /<label[^>]*for="[^"]+"[^>]*>Street<\/label>/)
  assert.match(html, /<input[^>]*disabled=""/)
  assert.match(html, /data-disabled=""/)
  assert.match(html, /Destination details/)
  assert.match(html, /Street help/)
})
