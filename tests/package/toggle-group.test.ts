import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  ToggleGroup,
  ToggleGroupItem,
  useToggleGroup,
  defineTheme,
  ThemeScope
} from '@cognitap/radiant'
const options = [
  h(ToggleGroupItem, { key: 'a', value: 'a', 'data-slot': 'custom' }, 'Alpha'),
  h(ToggleGroupItem, { key: 'b', value: 'b' }, 'Beta')
]
test('ToggleGroup server rendering composes real pressed Buttons, isolates hosts and resets its theme slots', () => {
  let calls = 0
  const single = renderToStaticMarkup(
    h(
      ToggleGroup,
      {
        'aria-label': 'View',
        defaultValue: 'b',
        appearance: 'segmented',
        onValueChange: () => calls++
      },
      options
    )
  )
  assert.match(single, /<div[^>]*role="group"/)
  assert.match(single, /data-slot="toggle-group"/)
  assert.match(single, /data-slot="button toggle-group-item custom"/)
  assert.match(single, /<button[^>]*value="a"[^>]*aria-pressed="false"/)
  assert.match(single, /<button[^>]*value="b"[^>]*aria-pressed="true"/)
  assert.match(single, /data-slot="toggle-group-indicator"/)
  assert.doesNotMatch(single, /onValueChange|defaultValue|contenteditable=/)
  const multi = renderToStaticMarkup(
    h(
      ToggleGroup,
      { 'aria-label': 'Formatting', type: 'multiple', defaultValue: ['a', 'b'], disabled: true },
      options
    )
  )
  assert.equal((multi.match(/aria-pressed="true"/g) ?? []).length, 2)
  assert.equal((multi.match(/\sdisabled=""/g) ?? []).length, 2)
  assert.equal(calls, 0)
  const theme = defineTheme({
    id: 'toggle-proof',
    name: 'Toggle proof',
    components: { toggleGroup: { gap: '0.75rem', indicatorColor: 'navy', indicatorRadius: '7px' } }
  })
  const themed = renderToStaticMarkup(
    h(ThemeScope, { theme }, h(ToggleGroup, { 'aria-label': 'View' }, options))
  )
  assert.match(themed, /--rad-toggle-group-gap:0.75rem/)
  assert.match(themed, /--rad-toggle-group-indicator-color:navy/)
  const outside = renderToStaticMarkup(
    h(function Probe() {
      assert.equal(useToggleGroup(), null)
      return h('span', null, 'outside')
    })
  )
  assert.equal(outside, '<span>outside</span>')
})
test('ToggleGroup rejects missing names, contradictory owners and multiple segmented indicators', () => {
  const invalid: Record<string, unknown>[] = [
    {},
    { 'aria-label': ' ' },
    { 'aria-label': 'View', value: 'a', defaultValue: 'b' },
    { 'aria-label': 'View', type: 'multiple', value: 'a' },
    { 'aria-label': 'View', type: 'multiple', value: ['a', 'a'] },
    { 'aria-label': 'View', type: 'multiple', value: ['a'], appearance: 'segmented' }
  ]
  for (const props of invalid) {
    // @ts-expect-error JavaScript callers also receive contract validation.
    assert.throws(() => renderToStaticMarkup(h(ToggleGroup, props, options)), TypeError)
  }
  assert.throws(
    () => renderToStaticMarkup(h(ToggleGroupItem, { value: 'a' }, 'Alpha')),
    /inside ToggleGroup/
  )
})
