import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  HoverCardPortal,
  defineTheme,
  ThemeScope,
  useHoverCard
} from '@cognitap/radiant'
test('HoverCard preserves real Link navigation, native surface hosts and composed identities without browser globals', () => {
  const html = renderToStaticMarkup(
    h(
      HoverCard,
      { defaultOpen: true },
      h(
        HoverCardTrigger,
        {
          href: '/people/lee',
          external: true,
          'data-slot': 'profile',
          ref: () => {
            throw new Error('Server ref')
          }
        },
        'Lee Chen'
      ),
      h(
        HoverCardContent,
        { 'data-slot': 'preview', side: 'right', align: 'end', motion: 'off' },
        h('p', null, 'A supplementary profile.')
      )
    )
  )
  assert.match(html, /<a[^>]*href="\/people\/lee"/)
  assert.match(html, /target="_blank"/)
  assert.match(html, /rel="noopener noreferrer"/)
  assert.match(html, /data-slot="link hover-card-trigger profile"/)
  assert.match(html, /data-slot="popover-content hover-card-content preview"/)
  assert.match(html, /popover="manual"/)
  assert.match(html, /data-side="right"/)
  assert.match(html, /data-align="end"/)
  assert.match(html, /data-motion="off"/)
  assert.doesNotMatch(html, /role="(?:button|tooltip|dialog)"|aria-describedby=/)
  const id = html.match(/aria-controls="([^"]+)"/)?.[1]
  assert.ok(id && html.includes(`id="${id}"`))
  const portal = renderToStaticMarkup(
    h(
      HoverCard,
      null,
      h(HoverCardTrigger, { href: '/people/lee' }, 'Lee Chen'),
      h(HoverCardPortal, null, h(HoverCardContent, null, 'Preview'))
    )
  )
  assert.match(portal, /href="\/people\/lee"/)
  assert.doesNotMatch(portal, /Preview/)
})
test('HoverCard validates timing and owners while keeping its theme and private composition seams bounded', () => {
  for (const value of [-1, NaN, Infinity])
    assert.throws(
      () => renderToStaticMarkup(h(HoverCard, { openDelay: value })),
      /finite, nonnegative/
    )
  for (const Part of [HoverCardTrigger, HoverCardContent, HoverCardPortal])
    assert.throws(() => {
      // @ts-expect-error Runtime owner and navigation guards also apply to untyped callers.
      return renderToStaticMarkup(h(Part))
    }, /inside HoverCard|requires a navigation href/)
  const theme = defineTheme({
    id: 'preview',
    name: 'Preview',
    components: { hoverCard: { width: '17rem' } }
  })
  assert.match(
    renderToStaticMarkup(
      h(
        ThemeScope,
        { theme },
        h(HoverCard, null, h(HoverCardTrigger, { href: '#profile' }, 'Profile'))
      )
    ),
    /--rad-hover-card-width:17rem/
  )
  function Outside() {
    assert.equal(useHoverCard(), null)
    return null
  }
  renderToStaticMarkup(h(Outside))
})
