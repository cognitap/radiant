import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ButtonGroup, Button, ThemeScope, defineTheme } from '@cognitap/radiant'
test('ButtonGroup is a passive div group and preserves every real native Button', () => {
  const html = renderToStaticMarkup(
    h(
      ButtonGroup,
      {
        'aria-label': 'Save actions',
        dir: 'rtl',
        style: { color: 'red' },
        ref: () => {
          throw new Error('SSR attached ref')
        }
      },
      h(Button, { type: 'submit' }, 'Save'),
      h(Button, { type: 'reset' }, 'Restore')
    )
  )
  assert.match(html, /role="group"/)
  assert.match(html, /data-slot="button-group"/)
  assert.match(html, /dir="rtl"/)
  assert.match(html, /data-orientation="horizontal"/)
  assert.match(html, /color:red/)
  assert.equal((html.match(/<button/g) ?? []).length, 2)
  assert.match(html, /type="submit"/)
  assert.match(html, /type="reset"/)
  assert.doesNotMatch(html, /tabindex=|role="toolbar"|aria-orientation=/)
})
test('vertical grouping and radius tokens are typed without introducing a state owner', () => {
  const html = renderToStaticMarkup(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'group',
          name: 'Group',
          components: { buttonGroup: { radius: '9px' } }
        })
      },
      h(ButtonGroup, { orientation: 'vertical' }, h(Button, {}, 'Action'))
    )
  )
  assert.match(html, /--rad-button-group-radius:9px/)
  assert.match(html, /data-orientation="vertical"/)
  assert.throws(
    () => renderToStaticMarkup(h(ButtonGroup, JSON.parse('{"orientation":"grid"}'))),
    /orientation/
  )
  const protectedHTML = renderToStaticMarkup(
    h(
      ButtonGroup,
      JSON.parse('{"role":"toolbar","aria-orientation":"vertical","data-slot":"fake"}')
    )
  )
  assert.match(protectedHTML, /role="group"/)
  assert.match(protectedHTML, /data-slot="button-group"/)
  assert.doesNotMatch(protectedHTML, /role="toolbar"|aria-orientation=/)
})
