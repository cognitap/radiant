import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Menu, MenuTrigger, MenuContent, MenuItem } from '@cognitap/radiant'
test('Menu SSR protects command roles, connected names and focusable disabled items', () => {
  const html = renderToStaticMarkup(
    h(
      Menu,
      null,
      h(MenuTrigger, null, 'Commands'),
      h(MenuContent, null, h(MenuItem, { disabled: true }, 'Archive'))
    )
  )
  assert.match(html, /aria-haspopup="menu"/)
  assert.match(html, /role="menu"/)
  assert.match(html, /role="menuitem"/)
  assert.match(html, /aria-disabled="true"/)
  assert.doesNotMatch(html, / disabled=""/)
  assert.match(html, /data-slot="popover-content menu-content"/)
  const id = html.match(/aria-labelledby="([^"]+)"/)?.[1]
  assert.ok(id && html.includes(`id="${id}"`))
  assert.throws(() => renderToStaticMarkup(h(MenuItem, null, 'Missing')), /inside Menu/)
})
