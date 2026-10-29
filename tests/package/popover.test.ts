import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverPortal,
  defineTheme
} from '@cognitap/radiant'

test('installed Popover renders nonmodal, caller-owned semantics and protected relationships on the server', () => {
  const html = renderToStaticMarkup(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, { 'aria-controls': 'wrong', 'aria-expanded': false }, 'Details'),
      h(
        PopoverContent,
        { role: 'dialog', 'aria-label': 'Preferences', style: { '--rad-popover-width': '24rem' } },
        h(PopoverClose, null, 'Close')
      )
    )
  )
  assert.match(html, /popover="manual"/)
  assert.match(html, /role="dialog"/)
  assert.match(html, /aria-label="Preferences"/)
  assert.match(html, /--rad-popover-width:24rem/)
  assert.match(html, /data-slot="button popover-trigger"/)
  assert.match(html, /data-slot="button popover-close"/)
  assert.match(html, /aria-expanded="true"/)
  assert.doesNotMatch(html, /aria-haspopup|aria-modal|wrong/)
  const id = html.match(/aria-controls="([^"]+)"/)?.[1]
  assert.ok(id && html.includes(`id="${id}"`))
  const generic = renderToStaticMarkup(h(Popover, null, h(PopoverContent, null, 'Plain content')))
  assert.doesNotMatch(generic, /role=|aria-label/)
})
test('installed Popover local portal is deferred and misplaced parts reject missing owners', () => {
  assert.equal(
    renderToStaticMarkup(h(Popover, null, h(PopoverPortal, null, h(PopoverContent)))),
    ''
  )
  assert.throws(() => renderToStaticMarkup(h(PopoverTrigger)), /inside Popover/)
  assert.throws(() => renderToStaticMarkup(h(PopoverContent)), /inside Popover/)
  const theme = defineTheme({
    id: 'overlay',
    name: 'Overlay',
    components: { popover: { width: '18rem' }, dialog: { width: '24rem' } }
  })
  assert.equal(theme.modes.light['--rad-popover-width'], '18rem')
  assert.equal(theme.modes.light['--rad-dialog-width'], '24rem')
})
