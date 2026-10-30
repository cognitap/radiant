import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteClear,
  Combobox,
  Field
} from '@cognitap/radiant'
const items = [
  { value: 'Budapest', label: 'Budapest' },
  { value: 'maya@example.com', label: 'Maya Chen' }
]
test('Autocomplete submits one native text input and preserves Field relationships without a selection carrier', () => {
  const html = render(
    h(
      'form',
      {},
      h(
        Field,
        {
          label: 'Destination',
          controlId: 'city',
          required: true,
          description: 'Choose or write a city'
        },
        h(Autocomplete, { items, name: 'city', defaultValue: 'Custom city', form: 'travel' })
      )
    )
  )
  assert.equal((html.match(/<input /g) ?? []).length, 1)
  assert.match(html, /data-slot="combobox-input autocomplete-input"/)
  assert.match(html, /data-slot="button combobox-trigger autocomplete-trigger"/)
  assert.match(html, /name="city"/)
  assert.match(html, /form="travel"/)
  assert.match(html, /value="Custom city"/)
  assert.match(html, /required=""/)
  assert.match(html, /for="city"/)
  assert.match(html, /id="city"/)
  assert.doesNotMatch(html, /combobox-native|type="hidden"/)
})
test('Autocomplete owns text only and retains native host customization and clearing on the server', () => {
  const html = render(
    h(
      Autocomplete,
      { items, value: 'Off list', onValueChange: () => {} },
      h(AutocompleteInput, {
        'aria-label': 'Topic',
        style: { color: 'red' },
        className: 'custom',
        ref: () => {
          throw Error('SSR ref')
        }
      }),
      h(AutocompleteClear)
    )
  )
  assert.match(html, /value="Off list"/)
  assert.match(html, /style="color:red"/)
  assert.match(html, /class="[^"]*custom/)
  assert.match(html, /data-slot="button combobox-clear autocomplete-clear"/)
  assert.match(html, /Clear text/)
})
test('Autocomplete rejects conflicting text or open owners, nonstrings, duplicate completions and misplaced parts', () => {
  for (const props of [
    { value: 'one', defaultValue: 'two' },
    { value: null },
    { value: 42 },
    { defaultValue: 42 },
    { open: true, defaultOpen: false }
  ])
    assert.throws(() => render(h(Autocomplete, { ...JSON.parse(JSON.stringify(props)), items })))
  assert.throws(() => render(h(Autocomplete, { items: [items[0]!, items[0]!] })), /distinct/)
  assert.throws(() => render(h(AutocompleteInput)), /inside Autocomplete/)
  assert.throws(() => render(h(Combobox, { items }, h(AutocompleteInput))), /inside Autocomplete/)
})
