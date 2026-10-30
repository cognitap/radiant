import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHandle,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  ThemeScope,
  defineTheme,
  useDrawer
} from '@cognitap/radiant'
test('Drawer keeps native Dialog and Button contracts with stable server markup', () => {
  const ref = () => {
    throw new Error('Server attached a ref')
  }
  const html = renderToString(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'drawer',
          name: 'Drawer',
          components: { drawer: { size: '30rem' } }
        })
      },
      h(
        Drawer,
        { defaultOpen: true, defaultSnapPoint: 0.5 },
        h(DrawerTrigger, { ref }, 'Open'),
        h(
          DrawerContent,
          {
            ref,
            side: 'start',
            style: { padding: 0 },
            parts: { viewport: { className: 'custom', style: { gap: 7 } } }
          },
          h(DrawerHandle, { 'aria-label': 'Resize', ref }),
          h(DrawerTitle, null, 'Settings'),
          h(DrawerDescription, null, 'Details'),
          h(DrawerClose, { type: 'submit', name: 'intent', value: 'save' }, 'Save')
        )
      )
    )
  )
  const dialog = html.match(/<dialog\b[^>]*>/)?.[0] ?? ''
  assert.doesNotMatch(dialog, /\sopen(?:=|\s|>)/)
  for (const slot of [
    'dialog drawer',
    'button dialog-trigger drawer-trigger',
    'button drawer-handle',
    'dialog-title drawer-title',
    'dialog-description drawer-description',
    'button dialog-close drawer-close',
    'drawer-viewport'
  ])
    assert.ok(html.includes(slot), slot)
  assert.match(html, /--rad-drawer-size:30rem/)
  assert.match(html, /data-side="start"/)
  assert.match(html, /aria-live="polite"[^>]*>50%/)
  assert.match(html, /name="intent"/)
  assert.match(html, /aria-haspopup="dialog"/)
})
test('Drawer validates snap points and guards part ownership', () => {
  for (const points of [[], [0], [NaN], [1.1]])
    assert.throws(() => renderToString(h(Drawer, { snapPoints: points })), /snap points/)
  assert.throws(() => renderToString(h(Drawer, { defaultSnapPoint: 0.2 })), /one of/)
  assert.throws(() => renderToString(h(DrawerContent)), /inside Drawer/)
  function Outside() {
    assert.equal(useDrawer(), null)
    return null
  }
  renderToString(h(Outside))
})
