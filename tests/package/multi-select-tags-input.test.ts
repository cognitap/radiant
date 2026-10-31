import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as radiant from '@cognitap/radiant'
const {
  MultiSelect,
  Combobox,
  MultiSelectTags,
  MultiSelectInput,
  TagsInput,
  Tag,
  Field,
  ThemeScope,
  defineTheme,
  useCombobox,
  useMultiSelect
} = radiant
const items = [
  { value: '', label: 'Anywhere' },
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' }
]
const ref = () => {
  throw new Error('Server rendering attached a ref')
}
test('multiple selection submits each original key, preserves real native families and never submits JSON or query', () => {
  const html = renderToStaticMarkup(
    h(
      Field,
      { label: 'Projects', controlId: 'projects' },
      h(
        MultiSelect,
        { items, defaultValue: ['', 'a'], name: 'projects' },
        h(MultiSelectTags, { ref }),
        h(MultiSelectInput, { ref, size: 20 })
      )
    )
  )
  assert.match(html, /for="projects"/)
  assert.match(html, /role="combobox"/)
  assert.match(html, /data-slot="combobox-input multi-select-input"/)
  assert.match(html, /data-slot="badge tag multi-select-tag"/)
  assert.match(html, /data-slot="button tag-remove"/)
  assert.match(html, /aria-label="Remove Anywhere"/)
  const values = [
    ...html.matchAll(/<input[^>]*type="hidden"[^>]*name="projects"[^>]*value="([^"]*)"/g)
  ].map(match => match[1])
  assert.deepEqual(values, ['', 'a'])
  const carrier =
    html.match(/<input[^>]*data-slot="combobox-native multi-select-native"[^>]*>/)?.[0] ?? ''
  assert.doesNotMatch(carrier, /\sname=/)
  assert.match(carrier, /aria-hidden="true"/)
  for (const key of ['InputRoot', 'ComboboxContext', 'useArrayFormBridge'])
    assert.equal(key in radiant, false)
})
test('TagsInput server host keeps Input, Field and array form semantics with typed presentation parts', () => {
  const html = renderToStaticMarkup(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'tags',
          name: 'Tags',
          components: {
            tag: { gap: '3px' },
            multiSelect: { gap: '7px' },
            tagsInput: { gap: '9px' }
          }
        })
      },
      h(
        Field,
        { label: 'Topics', required: true, controlId: 'topics' },
        h(TagsInput, {
          ref,
          name: 'topic',
          defaultValue: ['design', 'research'],
          form: 'project',
          style: { color: 'red' },
          parts: { wrapper: { style: { gap: 8 } } }
        })
      )
    )
  )
  const input = html.match(/<input[^>]*data-slot="input tags-input"[^>]*>/)?.[0] ?? ''
  assert.match(input, /id="topics"/)
  assert.match(input, /aria-required="true"/)
  assert.doesNotMatch(input, /\srequired(?:=|\s|>)/)
  assert.doesNotMatch(input, /\sname=/)
  assert.match(html, /--rad-tags-input-gap:9px/)
  assert.match(html, /--rad-multi-select-gap:7px/)
  const values = [
    ...html.matchAll(/<input[^>]*type="hidden"[^>]*name="topic"[^>]*value="([^"]*)"/g)
  ].map(match => match[1])
  assert.deepEqual(values, ['design', 'research'])
})
test('Tag is a passive span containing a named native removal Button, with unavailable state retained', () => {
  const html = renderToStaticMarkup(
    h(Tag, {
      ref,
      children: h('strong', null, 'Project'),
      removeLabel: 'Remove project',
      onRemove: () => {},
      pending: true,
      parts: { remove: { style: { padding: 0 } } }
    })
  )
  assert.match(html, /data-slot="badge tag"/)
  assert.match(html, /type="button"/)
  assert.match(html, /aria-label="Remove project"/)
  assert.match(html, /aria-busy="true"/)
  assert.match(html, /<strong>Project<\/strong>/)
  assert.throws(
    () =>
      renderToStaticMarkup(h(Tag, { children: 'Project', removeLabel: '', onRemove: () => {} })),
    /requires aria-label/
  )
})
test('multiple and tag owners reject contradictory state, duplicate strings and invalid parsing configuration', () => {
  const both: Record<string, unknown> = { value: [], defaultValue: [] }
  assert.throws(
    () => renderToStaticMarkup(h(MultiSelect, { items, ...both })),
    /controlled value or a default/
  )
  assert.throws(
    () => renderToStaticMarkup(h(Combobox, { items, type: 'multiple', defaultValue: ['a', 'a'] })),
    /distinct strings/
  )
  assert.throws(
    () => renderToStaticMarkup(h(TagsInput, { defaultValue: [''] })),
    /nonempty trimmed/
  )
  assert.throws(
    () => renderToStaticMarkup(h(TagsInput, { separators: ['many'] })),
    /single characters/
  )
  assert.throws(() => renderToStaticMarkup(h(TagsInput, { maxCount: -1 })), /nonnegative integer/)
  function Outside() {
    assert.equal(useMultiSelect(), null)
    assert.equal(useCombobox({ type: 'multiple' }), null)
    return null
  }
  renderToStaticMarkup(h(Outside))
})
