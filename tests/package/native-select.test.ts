import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NativeSelect, Field, ThemeScope, defineTheme } from '@cognitap/radiant'
test('NativeSelect keeps the real select, option groups and Field-owned relationships', () => {
  const html = renderToStaticMarkup(
    h(
      Field,
      {
        label: 'Study phase',
        controlId: 'phase',
        description: 'Choose a phase',
        error: 'Review the phase',
        required: true,
        disabled: true
      },
      h(
        NativeSelect,
        {
          name: 'phase',
          defaultValue: 'recruiting',
          'aria-describedby': 'external',
          controlSize: 'small',
          ref: () => {
            throw Error('SSR ref')
          },
          style: { color: 'red' }
        },
        h('option', { value: '', disabled: true }, 'Choose'),
        h(
          'optgroup',
          { label: 'Open phases' },
          h('option', { value: 'draft' }, 'Draft'),
          h('option', { value: 'recruiting' }, 'Recruiting')
        ),
        h(
          'optgroup',
          { label: 'Archived', disabled: true },
          h('option', { value: 'archived' }, 'Archived')
        )
      )
    )
  )
  assert.equal((html.match(/<select/g) ?? []).length, 1)
  assert.doesNotMatch(html, /<button|<input|role="listbox"|role="combobox"/)
  assert.match(html, /<label[^>]*for="phase"/)
  const select = html.match(/<select[^>]+>/)![0]
  for (const attr of [
    'id="phase"',
    'name="phase"',
    'required=""',
    'disabled=""',
    'aria-invalid="true"',
    'data-control-size="small"'
  ])
    assert.ok(select.includes(attr), attr)
  assert.match(select, /aria-describedby="[^"]+external"/)
  assert.match(select, /color:red/)
  assert.match(html, /<option value="recruiting" selected="">Recruiting/)
  assert.match(html, /<optgroup label="Archived" disabled="">/)
})
test('native multiple and size props retain selected options, identities and protected native roles', () => {
  const html = renderToStaticMarkup(
    h(
      NativeSelect,
      {
        multiple: true,
        size: 5,
        name: 'cohort',
        defaultValue: ['reader', 'component'],
        'data-slot': 'cohorts',
        dir: 'rtl'
      },
      h('option', { value: 'reader' }, 'Readers'),
      h('option', { value: 'component' }, 'Designers'),
      h('option', { value: 'release' }, 'Reviewers')
    )
  )
  assert.match(html, /multiple=""/)
  assert.match(html, /size="5"/)
  assert.equal((html.match(/selected=""/g) ?? []).length, 2)
  assert.match(html, /data-slot="native-select cohorts"/)
  assert.match(html, /dir="rtl"/)
  const guarded = renderToStaticMarkup(
    h(
      NativeSelect,
      JSON.parse('{"role":"button","aria-label":"Study"}'),
      h('option', { value: 'reader' }, 'Reader')
    )
  )
  assert.doesNotMatch(guarded, /role=/)
  assert.throws(
    () => renderToStaticMarkup(h(NativeSelect, JSON.parse('{"value":"a","defaultValue":"b"}'))),
    /controlled|both/
  )
  assert.throws(
    () => renderToStaticMarkup(h(NativeSelect, JSON.parse('{"value":null}'))),
    /cannot be null/
  )
})
test('native select boundary overrides are typed and remain independent from Select overrides', () => {
  const html = renderToStaticMarkup(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'native',
          name: 'Native',
          components: {
            nativeSelect: {
              height: '44px',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 600,
              color: 'black',
              background: 'white',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: 'gray',
              radius: '4px',
              cornerShape: 'round',
              shadow: 'none',
              focusColor: 'blue',
              focusWidth: '3px',
              focusOffset: '2px',
              invalidBorder: 'red',
              disabledBackground: 'silver'
            },
            select: { radius: '20px' }
          }
        })
      },
      h(NativeSelect, { 'aria-label': 'Study' }, h('option', { value: 'reader' }, 'Reader'))
    )
  )
  assert.match(html, /--rad-native-select-height:44px/)
  assert.match(html, /--rad-native-select-radius:4px/)
  assert.match(html, /--rad-select-radius:20px/)
  const select = html.match(/<select[^>]+>/)![0]
  assert.doesNotMatch(select, /var\(--rad-select-/)
  assert.match(select, /data-slot="native-select"/)
})
