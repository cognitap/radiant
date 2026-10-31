import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
import { NumberField, Field, ThemeScope, defineTheme } from '@cognitap/radiant'
test('NumberField SSR keeps a labeled actual text Input and one raw named native form value', () => {
  const html = render(
    h(
      Field,
      { controlId: 'budget', label: 'Budget', required: true, description: 'Euros' },
      h(NumberField, {
        name: 'budget',
        defaultValue: 1234.5,
        locale: 'de-DE',
        formatOptions: { style: 'currency', currency: 'EUR' },
        min: 0,
        max: 5000,
        step: 0.25
      })
    )
  )
  assert.match(html, /<label[^>]+for="budget"/)
  assert.match(html, /<input[^>]+role="spinbutton"[^>]+type="text"/)
  assert.match(html, /data-slot="input input-group-input number-field"/)
  assert.match(html, /data-slot="input-group number-field-wrapper"/)
  assert.match(html, /aria-valuenow="1234.5"/)
  assert.match(html, /aria-valuemin="0"/)
  assert.match(html, /aria-valuemax="5000"/)
  assert.match(html, /<input[^>]+type="hidden"[^>]+name="budget"[^>]+value="1234.5"/)
  assert.equal((html.match(/name="budget"/g) ?? []).length, 1)
  assert.equal((html.match(/tabindex="-1"/g) ?? []).length, 2)
  assert.equal((html.match(/type="button"/g) ?? []).length, 2)
  assert.doesNotMatch(html, / aria-pressed=/)
})
test('NumberField styles reach the actual input and named parts retain real InputGroup and Button hosts', () => {
  const html = render(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'number',
          name: 'Number',
          components: { numberField: { gap: '7px' } }
        })
      },
      h(NumberField, {
        defaultValue: null,
        style: { color: 'red' },
        className: 'native-number',
        parts: { wrapper: { style: { gap: '9px' } }, increment: { style: { color: 'blue' } } }
      })
    )
  )
  assert.match(html, /--rad-number-field-gap:7px/)
  assert.match(html, /<input[^>]*style="color:red"/)
  assert.match(html, /<input[^>]*class="[^"]*native-number/)
  assert.match(html, /<div[^>]*style="gap:9px"/)
  assert.match(html, /<button[^>]*style="color:blue"/)
})
test('NumberField rejects contradictory owners, nonfinite values, reversed bounds and unnamed actions', () => {
  for (const props of [
    { value: 1, defaultValue: 2 },

    { min: 2, max: 1 },
    { step: 0 },
    { largeStep: -1 },
    { incrementLabel: ' ' },
    { decrementLabel: '' },
    { value: '2' }
  ])
    assert.throws(() => render(h(NumberField, JSON.parse(JSON.stringify(props)))), TypeError)
})

test('NumberField rejects nonfinite numeric owners', () => {
  assert.throws(() => render(h(NumberField, { value: NaN })), TypeError)
  assert.throws(() => render(h(NumberField, { defaultValue: Infinity })), TypeError)
})
