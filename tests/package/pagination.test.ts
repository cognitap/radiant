import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Pagination,
  PaginationList,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationButton,
  PaginationUnavailable,
  PaginationEllipsis
} from '@cognitap/radiant'
test('Pagination preserves native URLs, current-page semantics and explicit unavailable boundaries', () => {
  const html = renderToStaticMarkup(
    h(
      Pagination,
      {},
      h(
        PaginationList,
        {},
        h(PaginationItem, {}, h(PaginationUnavailable, {}, 'Previous')),
        h(
          PaginationItem,
          {},
          h(
            PaginationLink,
            {
              href: '/results?page=1',
              current: true,
              'aria-label': 'Page 1',
              'data-slot': 'custom',
              render: p => h('a', { ...p, 'data-adapter': 'yes' })
            },
            '1'
          )
        ),
        h(PaginationItem, {}, h(PaginationEllipsis)),
        h(PaginationItem, {}, h(PaginationNext, { href: '/results?page=2' }))
      )
    )
  )
  assert.match(html, /<nav[^>]*aria-label="Pagination"/)
  assert.match(html, /<ol/)
  assert.equal((html.match(/<li /g) || []).length, 4)
  assert.equal((html.match(/aria-current="page"/g) || []).length, 1)
  assert.match(html, /href="\/results\?page=1"/)
  assert.match(html, /data-slot="link pagination-link custom"/)
  assert.match(html, /rel="next"/)
  assert.match(html, /aria-disabled="true"/)
  assert.match(html, /aria-hidden="true"/)
  assert.doesNotMatch(html, /tabindex|role="button"/)
  const action = renderToStaticMarkup(
    h(PaginationButton, { current: true, disabled: true }, 'Page 2')
  )
  assert.match(action, /<button/)
  assert.match(action, /type="button"/)
  assert.match(action, /disabled=""/)
  assert.match(action, /data-slot="button pagination-button"/)
  assert.match(action, /aria-current="page"/)
  const previous = renderToStaticMarkup(
    h(PaginationPrevious, { href: '/one', 'aria-label': 'Earlier results' }, 'Back')
  )
  assert.match(previous, /rel="prev"/)
  assert.match(previous, /Earlier results/)
  assert.doesNotMatch(
    renderToStaticMarkup(h(Pagination, { 'aria-labelledby': 'pages' })),
    /aria-label=/
  )
  assert.throws(() => renderToStaticMarkup(h(Pagination, { 'aria-label': ' ' })), /navigation name/)
  assert.throws(
    () =>
      renderToStaticMarkup(
        h(PaginationLink, { href: '/x', render: () => h('button', {}, 'Wrong') })
      ),
    /anchor/
  )
})
