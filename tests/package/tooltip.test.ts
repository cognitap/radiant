import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipPortal } from '@cognitap/radiant'
test('Tooltip retains a server description in its local portal without disclosure semantics', () => {
  const html = renderToStaticMarkup(
    h(
      Tooltip,
      null,
      h(TooltipTrigger, { 'aria-describedby': 'help help' }, 'Export'),
      h(TooltipPortal, null, h(TooltipContent, null, 'CSV format'))
    )
  )
  assert.match(html, /role="tooltip"/)
  assert.match(html, /popover="manual"/)
  assert.doesNotMatch(html, /aria-expanded|aria-haspopup/)
  const id = html.match(/aria-describedby="([^ ]+) help"/)?.[1]
  assert.ok(id && html.includes(`id="${id}"`))
  assert.throws(() => renderToStaticMarkup(h(TooltipContent)), /inside Tooltip/)
})
