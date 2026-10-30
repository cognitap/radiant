import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Toolbar,
  Button,
  Link,
  ToggleGroup,
  ToggleGroupItem,
  defineTheme,
  ThemeScope
} from '@cognitap/radiant'
test('Toolbar preserves native child actions and protects its composite host on the server', () => {
  const wider: Record<string, unknown> = {
    role: 'grid',
    'aria-orientation': 'vertical',
    tabIndex: 9,
    contentEditable: true
  }
  const html = renderToStaticMarkup(
    h(
      Toolbar,
      {
        ...wider,
        'aria-label': 'Editor',
        id: 'editor',
        'data-slot': 'custom',
        ref: () => {
          throw new Error('Server ref attached')
        }
      },
      h(Button, { type: 'submit', name: 'intent', value: 'save' }, 'Save'),
      h(
        ToggleGroup,
        { 'aria-label': 'Formatting', type: 'multiple', defaultValue: ['bold'] },
        h(ToggleGroupItem, { value: 'bold' }, 'Bold')
      ),
      h(Link, { href: '/guide' }, 'Guide')
    )
  )
  assert.match(html, /^<div[^>]*role="toolbar"/)
  assert.match(html, /aria-orientation="horizontal"/)
  assert.match(html, /tabindex="-1"/)
  assert.match(html, /data-slot="toolbar custom"/)
  assert.match(html, /id="editor"/)
  assert.doesNotMatch(html, /contenteditable=/)
  const nativeButton = html.match(/<button\b[^>]*>/)![0]
  assert.match(nativeButton, /type="submit"/)
  assert.match(nativeButton, /name="intent"/)
  assert.match(nativeButton, /value="save"/)
  assert.match(html, /data-slot="button toggle-group-item"/)
  assert.match(html, /aria-pressed="true"/)
  assert.match(html, /<a[^>]*href="\/guide"/)
})
test('Toolbar requires an explicit name and exposes its own typed theme overrides', () => {
  const missing: Record<string, unknown> = {}
  assert.throws(() => {
    // @ts-expect-error Runtime callers must also name a toolbar.
    return renderToStaticMarkup(h(Toolbar, missing))
  }, /requires aria-label or aria-labelledby/)
  assert.throws(() => renderToStaticMarkup(h(Toolbar, { 'aria-label': ' ' })), TypeError)
  const theme = defineTheme({
    id: 'toolbar-proof',
    name: 'Toolbar proof',
    components: { toolbar: { gap: '7px', padding: '9px', radius: '11px', background: 'navy' } }
  })
  const html = renderToStaticMarkup(
    h(
      ThemeScope,
      { theme },
      h(
        Toolbar,
        { 'aria-labelledby': 'title', orientation: 'vertical', loop: false },
        h(Button, null, 'Save')
      )
    )
  )
  for (const [variable, value] of [
    ['gap', '7px'],
    ['padding', '9px'],
    ['radius', '11px'],
    ['background', 'navy']
  ])
    assert.match(html, new RegExp(`--rad-toolbar-${variable}:${value}`))
  assert.match(html, /aria-labelledby="title"/)
  assert.match(html, /aria-orientation="vertical"/)
})
