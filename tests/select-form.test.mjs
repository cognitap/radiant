import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { Field, Select, SelectItem, SelectTrigger, SelectValue } from '../dist/library/index.js'

const items = [
  { value: '', label: 'No destination' },
  { value: 'rome', label: 'Rome' },
  { value: 'paris', label: 'Paris', disabled: true }
]
test('Select renders server-safe visible selection and a native form bridge before effects', () => {
  const html = renderToString(
    createElement(
      Field,
      { label: 'City', required: true, description: 'Destination' },
      createElement(Select, { items, name: 'city', form: 'profile', defaultValue: 'rome' })
    )
  )
  assert.match(html, /role="combobox"/)
  assert.match(html, /data-slot="select-value">Rome/)
  assert.match(html, /<select[^>]+name="city"[^>]+form="profile"/)
  assert.match(html, /aria-hidden="true"/)
  assert.match(html, /<option value="rome" selected="">Rome/)
  assert.match(html, /<option value="paris" disabled="">Paris/)
  assert.doesNotMatch(html, /role="listbox"/)
})
test('Select accepts a controlled empty string option distinct from null placeholder', () => {
  const empty = renderToString(createElement(Select, { items, value: '' }))
  const placeholder = renderToString(createElement(Select, { items, value: null }))
  assert.match(empty, /data-slot="select-value">No destination/)
  assert.match(placeholder, /data-slot="select-value">Select an option/)
})
test('Select rejects contradictory owners, duplicate values and unnamed rich labels', () => {
  for (const props of [
    { items, value: 'rome', defaultValue: '' },
    { items, open: true, defaultOpen: false },
    { items: [items[0], items[0]] },
    { items: [{ value: 'r', label: createElement('span', null, 'Rome') }] }
  ])
    assert.throws(() => renderToString(createElement(Select, props)), TypeError)
  assert.throws(() => renderToString(createElement(SelectTrigger)), /inside Select/)
  assert.throws(() => renderToString(createElement(SelectItem, { value: 'rome' })), /inside Select/)
  assert.throws(() => renderToString(createElement(SelectValue)), /inside Select/)
})
