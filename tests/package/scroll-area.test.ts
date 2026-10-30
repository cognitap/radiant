import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ScrollArea, defineTheme } from '@cognitap/radiant'
test('ScrollArea renders a named native keyboard viewport with a server-side scrollbar fallback', () => {
  const config = {
    'aria-label': 'Messages',
    role: 'button',
    contentEditable: true,
    'data-slot': 'inbox'
  }
  const html = renderToStaticMarkup(
    h(
      ScrollArea,
      {
        ...config,
        orientation: 'both',
        visibility: 'always',
        style: { height: 180 },
        parts: { content: { style: { padding: '1rem' } } }
      },
      h('button', null, 'Open message')
    )
  )
  assert.match(html, /role="group"/)
  assert.match(html, /aria-label="Messages"/)
  assert.match(html, /tabindex="0"/)
  assert.match(html, /data-slot="scroll-area inbox"/)
  assert.match(html, /data-orientation="both"/)
  assert.match(html, /data-visibility="always"/)
  assert.match(html, /height:180px/)
  assert.match(html, /data-slot="scroll-area-content"/)
  assert.match(html, /<button>Open message<\/button>/)
  assert.doesNotMatch(
    html,
    /role="button"|contenteditable=|data-enhanced=|data-scroll-area-hit=|NaN/
  )
  assert.throws(
    () => renderToStaticMarkup(h(ScrollArea, { 'aria-label': '' })),
    /requires aria-label or aria-labelledby/
  )
  const theme = defineTheme({
    id: 'scroll-proof',
    name: 'Scroll proof',
    components: {
      scrollArea: { size: '9px', radius: '3px', thumbColor: 'rebeccapurple', trackColor: 'white' }
    }
  })
  assert.equal(theme.modes.light['--rad-scroll-area-size'], '9px')
  assert.equal(theme.modes.dark['--rad-scroll-area-thumb-color'], 'rebeccapurple')
})
