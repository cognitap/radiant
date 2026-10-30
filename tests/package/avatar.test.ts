import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Avatar } from '@cognitap/radiant'
test('Avatar has one stable graphic name and explicit decorative fallback in server markup', () => {
  const html = renderToStaticMarkup(
    h(Avatar, { alt: 'Jordan Rivera', src: '/person.png', fallback: 'JR', 'data-slot': 'custom' })
  )
  assert.match(html, /role="img"/)
  assert.equal((html.match(/aria-label="Jordan Rivera"/g) || []).length, 1)
  assert.match(html, /alt=""/)
  assert.match(html, /data-state="loading"/)
  assert.match(html, /data-slot="avatar custom"/)
  assert.match(html, />JR<\/span>/)
  const decorative = renderToStaticMarkup(h(Avatar, { alt: '', fallback: 'JR' }))
  assert.doesNotMatch(decorative, /role=|aria-label=/)
  assert.match(decorative, /aria-hidden="true"/)
  assert.match(decorative, /data-state="fallback"/)
  assert.throws(() => renderToStaticMarkup(h(Avatar, { alt: '   ' })), /Avatar alt/)
  assert.throws(
    () =>
      renderToStaticMarkup(
        h(Avatar, { alt: 'Jordan', ...JSON.parse('{"fallback":{"type":"button"}}') })
      ),
    /plain text/
  )
})
