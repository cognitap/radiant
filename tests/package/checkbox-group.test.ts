import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CheckboxGroup } from '@cognitap/radiant'
test('CheckboxGroup renders native named options, a mixed parent and group-owned feedback on the server', () => {
  const items = [
    { value: '', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'fixed', label: 'Managed', disabled: true }
  ]
  const html = renderToStaticMarkup(
    h(CheckboxGroup, {
      legend: 'Channels',
      name: 'channels',
      form: 'settings',
      items,
      selectAll: { label: 'All available' },
      defaultValue: ['', 'fixed'],
      description: 'Choose notifications',
      error: 'Review preferences'
    })
  )
  assert.match(html, /<fieldset/)
  assert.match(html, /data-slot="field fieldset checkbox-group"/)
  assert.match(html, />Channels<\/legend>/)
  assert.equal((html.match(/type="checkbox"/g) || []).length, 4)
  assert.equal((html.match(/name="channels"/g) || []).length, 3)
  assert.match(html, /aria-checked="mixed"/)
  assert.match(html, /aria-controls="[^"]+"/)
  assert.equal((html.match(/checked=""/g) || []).length, 2)
  assert.match(html, /value=""/)
  assert.match(html, /disabled=""/)
  assert.match(html, /form="settings"/)
  assert.match(html, /role="alert"/)
  assert.throws(
    () =>
      renderToStaticMarkup(
        h(CheckboxGroup, {
          legend: 'Bad',
          items: [
            { value: 'x', label: 'A' },
            { value: 'x', label: 'B' }
          ]
        })
      ),
    /unique/
  )
})

test('CheckboxGroup protects native ownership from structurally wider option configurations', () => {
  const item = {
    value: 'email',
    label: 'Email',
    checked: true,
    defaultChecked: true,
    indeterminate: true,
    required: true,
    role: 'switch',
    name: 'wrong'
  }
  const parent = { ...item, label: 'All available' }
  const html = renderToStaticMarkup(
    h(CheckboxGroup, {
      legend: 'Channels',
      name: 'channels',
      items: [item],
      selectAll: parent
    })
  )
  assert.doesNotMatch(html, /checked=""|required=""|role="switch"|name="wrong"/)
  assert.equal((html.match(/name="channels"/g) || []).length, 1)
})
