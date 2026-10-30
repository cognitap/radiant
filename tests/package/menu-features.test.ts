import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as radiant from '@cognitap/radiant'
const {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent
} = radiant
test('Menu checkable and section parts preserve native button semantics, owners and composed identities on the server', () => {
  const wider: Record<string, unknown> = {
    role: 'button',
    'aria-checked': false,
    tabIndex: 7,
    type: 'submit'
  }
  const html = renderToStaticMarkup(
    h(
      Menu,
      null,
      h(MenuTrigger, null, 'View'),
      h(
        MenuContent,
        null,
        h(
          MenuGroup,
          { 'aria-labelledby': 'display' },
          h(MenuLabel, { id: 'display' }, 'Display'),
          h(
            MenuCheckboxItem,
            {
              ...wider,
              defaultChecked: true,
              'data-slot': 'custom',
              parts: { indicator: { className: 'mark', style: { color: 'red' } } }
            },
            'Grid'
          ),
          h(MenuCheckboxItem, { indeterminate: true }, 'All layers'),
          h(MenuSeparator)
        ),
        h(
          MenuRadioGroup,
          { 'aria-label': 'Layout', defaultValue: 'list' },
          h(MenuRadioItem, { value: 'list' }, 'List'),
          h(MenuRadioItem, { value: 'grid' }, 'Grid')
        )
      )
    )
  )
  assert.match(html, /<div[^>]*role="group"[^>]*data-slot="menu-group"/)
  assert.match(html, /aria-labelledby="display"/)
  assert.match(html, /id="display"/)
  assert.match(html, /data-slot="separator menu-separator"/)
  assert.match(html, /role="menuitemcheckbox"/)
  assert.match(html, /aria-checked="true"/)
  assert.match(html, /aria-checked="mixed"/)
  assert.match(html, /role="menuitemradio"/)
  assert.match(html, /data-slot="button popover-close menu-item menu-checkbox-item custom"/)
  assert.match(html, /data-slot="menu-group menu-radio-group"/)
  assert.match(html, /data-slot="menu-item-indicator"/)
  assert.match(html, /aria-hidden="true"/)
  assert.match(html, /class="[^"]*mark/)
  assert.match(html, /color:red/)
  assert.doesNotMatch(html, /<input|aria-pressed=|tabindex="7"|type="submit"/)
  assert.equal('MenuRoot' in radiant, false)
  assert.equal('useMenuContext' in radiant, false)
})
test('submenu names and ids share the real menu surface while misplaced parts reject missing owners', () => {
  const html = renderToStaticMarkup(
    h(
      Menu,
      null,
      h(MenuTrigger, null, 'File'),
      h(
        MenuContent,
        null,
        h(
          MenuSub,
          null,
          h(MenuSubTrigger, null, 'Export'),
          h(MenuSubContent, null, h(MenuItem, null, 'PDF'))
        )
      )
    )
  )
  assert.match(html, /data-slot="button popover-close menu-item menu-sub-trigger"/)
  assert.match(html, /data-slot="popover-content menu-content menu-sub-content"/)
  assert.match(html, /aria-haspopup="menu"/)
  for (const part of [
    () => h(MenuGroup),
    () => h(MenuLabel),
    () => h(MenuSeparator),
    () => h(MenuSub),
    () => h(MenuSubTrigger),
    () => h(MenuSubContent)
  ])
    assert.throws(() => renderToStaticMarkup(part()), /inside Menu/)
  assert.throws(
    () => renderToStaticMarkup(h(Menu, null, h(MenuRadioItem, { value: 'list' }, 'List'))),
    /inside MenuRadioGroup/
  )
  assert.throws(() => renderToStaticMarkup(h(Menu, null, h(MenuSubContent))), /inside MenuSub/)
})
