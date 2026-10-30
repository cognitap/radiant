import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as radiant from '@cognitap/radiant'
const {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarGroup,
  MenubarLabel,
  MenubarSeparator,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  ThemeScope,
  defineTheme,
  useMenubar
} = radiant
const ref = () => {
  throw new Error('Server rendering attached a ref')
}
test('Menubar server markup preserves its named native root, real Menu parts, protected semantics and typed overrides', () => {
  const root: Record<string, unknown> = {
      role: 'toolbar',
      'aria-orientation': 'vertical',
      tabIndex: 5,
      'data-state': 'foreign'
    },
    trigger: Record<string, unknown> = {
      role: 'button',
      tabIndex: 5,
      pressed: true,
      'aria-pressed': true
    }
  const html = renderToStaticMarkup(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'bar',
          name: 'Bar',
          components: {
            menubar: { gap: '7px', padding: '4px', radius: '10px', background: '#fff' }
          }
        })
      },
      h(
        Menubar,
        { ...root, 'aria-label': 'Editor', defaultValue: 'file', ref, 'data-slot': 'custom' },
        h(
          MenubarMenu,
          { value: 'file' },
          h(MenubarTrigger, { ...trigger, ref, disabled: true }, 'File'),
          h(
            MenubarContent,
            { ref },
            h(
              MenubarGroup,
              { 'aria-labelledby': 'commands' },
              h(MenubarLabel, { id: 'commands' }, 'Document'),
              h(MenubarItem, { type: 'submit', name: 'intent', value: 'save' }, 'Save'),
              h(MenubarSeparator),
              h(MenubarCheckboxItem, { defaultChecked: true }, 'Comments')
            ),
            h(
              MenubarRadioGroup,
              { defaultValue: 'list', 'aria-label': 'Layout' },
              h(MenubarRadioItem, { value: 'list' }, 'List')
            ),
            h(
              MenubarSub,
              null,
              h(MenubarSubTrigger, null, 'Export'),
              h(MenubarSubContent, null, h(MenubarItem, null, 'PDF'))
            )
          )
        )
      )
    )
  )
  assert.match(html, /<div[^>]*role="menubar"[^>]*aria-orientation="horizontal"[^>]*tabindex="-1"/)
  assert.match(html, /data-slot="menubar custom"/)
  assert.match(html, /data-state="open"/)
  assert.match(html, /aria-disabled="true"/)
  assert.doesNotMatch(html, /role="toolbar"|tabindex="5"|aria-pressed=|disabled=""/)
  const submit = html.match(/<button\b[^>]*\bname="intent"[^>]*>/)?.[0]
  assert.ok(submit)
  assert.match(submit, /type="submit"/)
  assert.match(submit, /value="save"/)

  for (const slot of [
    'button popover-trigger menu-trigger menubar-trigger',
    'popover-content menu-content menubar-content',
    'button popover-close menu-item menubar-item',
    'menu-group menubar-group',
    'menu-label menubar-label',
    'separator menu-separator menubar-separator',
    'menu-checkbox-item menubar-checkbox-item',
    'menu-radio-group menubar-radio-group',
    'menu-radio-item menubar-radio-item',
    'menu-sub-trigger menubar-sub-trigger',
    'menu-sub-content menubar-sub-content'
  ])
    assert.ok(html.includes(slot), slot)
  for (const token of ['gap:7px', 'padding:4px', 'radius:10px', 'background:#fff'])
    assert.ok(html.includes('--rad-menubar-' + token))
  assert.equal('MenuContentRoot' in radiant, false)
})
test('Menubar ownership stays explicit and part guards reject missing or independent Menu owners', () => {
  function Outside() {
    assert.equal(useMenubar(), null)
    return null
  }
  renderToStaticMarkup(h(Outside))
  assert.throws(
    () => renderToStaticMarkup(h(Menubar, { 'aria-label': '' })),
    /requires aria-label or aria-labelledby/
  )
  const conflict: Record<string, unknown> = { value: 'file', defaultValue: 'edit' }
  assert.throws(
    () => renderToStaticMarkup(h(Menubar, { ...conflict, 'aria-label': 'Editor' })),
    /not both/
  )
  for (const part of [
    () => h(MenubarMenu, { value: 'file' }),
    () => h(MenubarTrigger),
    () => h(MenubarContent),
    () => h(MenubarItem),
    () => h(MenubarSub)
  ])
    assert.throws(() => renderToStaticMarkup(part()), /inside Menubar/)
  assert.throws(
    () => renderToStaticMarkup(h(Menubar, { 'aria-label': 'Editor' }, h(MenubarTrigger))),
    /inside MenubarMenu/
  )
  assert.throws(
    () =>
      renderToStaticMarkup(
        h(Menubar, { 'aria-label': 'Editor' }, h(radiant.Menu, null, h(MenubarItem)))
      ),
    /inside MenubarMenu/
  )
})
