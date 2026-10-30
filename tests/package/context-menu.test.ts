import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToString, renderToStaticMarkup } from 'react-dom/server'
import * as radiant from '@cognitap/radiant'
const {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ThemeScope,
  defineTheme
} = radiant
const ref = () => {
  throw new Error('SSR attached ref')
}
test('ContextMenu server markup has a named native div target, real Menu parts and stable protected relationships', () => {
  const wider: Record<string, unknown> = {
    role: 'button',
    id: 'foreign',
    'aria-haspopup': 'dialog',
    'aria-expanded': true,
    'aria-controls': 'foreign'
  }
  const html = renderToString(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'context',
          name: 'Context',
          components: { contextMenu: { width: '17rem' } }
        })
      },
      h(
        ContextMenu,
        null,
        h(
          ContextMenuTrigger,
          {
            ...wider,
            'aria-label': 'Project file',
            ref,
            'data-slot': 'file',
            style: { padding: 12 }
          },
          'Project brief'
        ),
        h(
          ContextMenuContent,
          { ref },
          h(
            ContextMenuGroup,
            { 'aria-label': 'File' },
            h(ContextMenuLabel, null, 'Commands'),
            h(ContextMenuItem, null, 'Rename'),
            h(ContextMenuSeparator),
            h(ContextMenuCheckboxItem, { defaultChecked: true }, 'Shared')
          ),
          h(
            ContextMenuRadioGroup,
            { defaultValue: 'list' },
            h(ContextMenuRadioItem, { value: 'list' }, 'List')
          ),
          h(
            ContextMenuSub,
            null,
            h(ContextMenuSubTrigger, null, 'Move'),
            h(ContextMenuSubContent, null, h(ContextMenuItem, null, 'Archive'))
          )
        )
      )
    )
  )
  assert.match(html, /<div[^>]*role="group"[^>]*tabindex="0"/)
  assert.match(html, /aria-haspopup="menu"/)
  assert.match(html, /data-state="closed"/)
  assert.doesNotMatch(html, /id="foreign"|aria-controls="foreign"|role="button"/)
  for (const slot of [
    'context-menu-trigger file',
    'popover-content menu-content context-menu-content',
    'button popover-close menu-item context-menu-item',
    'menu-group context-menu-group',
    'menu-label context-menu-label',
    'separator menu-separator context-menu-separator',
    'menu-checkbox-item context-menu-checkbox-item',
    'menu-radio-group context-menu-radio-group',
    'menu-radio-item context-menu-radio-item',
    'menu-sub-trigger context-menu-sub-trigger',
    'menu-sub-content context-menu-sub-content'
  ])
    assert.ok(html.includes(slot), slot)
  assert.match(html, /--rad-context-menu-width:17rem/)
  assert.equal('PopoverRoot' in radiant, false)
  assert.equal('useMenuFamily' in radiant, false)
})
test('ContextMenu requires its owner and an accessible native target name', () => {
  for (const part of [
    () => h(ContextMenuTrigger, { 'aria-label': 'File' }),
    () => h(ContextMenuContent),
    () => h(ContextMenuItem),
    () => h(ContextMenuGroup),
    () => h(ContextMenuCheckboxItem),
    () => h(ContextMenuSub)
  ])
    assert.throws(() => renderToStaticMarkup(part()), /inside ContextMenu/)
  assert.throws(
    () => renderToStaticMarkup(h(ContextMenu, null, h(ContextMenuTrigger, { 'aria-label': '' }))),
    /requires aria-label or aria-labelledby/
  )
  const conflicting: Record<string, unknown> = { open: false, defaultOpen: true }
  assert.throws(() => renderToStaticMarkup(h(ContextMenu, conflicting)), /not both/)
  const html = renderToString(
    h(
      ContextMenu,
      null,
      h(
        ContextMenuTrigger,
        { 'aria-labelledby': 'name' },
        h('strong', { id: 'name' }, 'Project brief')
      )
    )
  )
  assert.match(html, /aria-labelledby="name"/)
})
