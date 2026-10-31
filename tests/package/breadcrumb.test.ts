import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@cognitap/radiant'
test('Breadcrumb keeps ordered native hierarchy, one current page and decorative separators on the server', () => {
  const html = renderToStaticMarkup(
    h(
      Breadcrumb,
      {},
      h(
        BreadcrumbList,
        {},
        h(
          BreadcrumbItem,
          {},
          h(
            BreadcrumbLink,
            {
              href: '/projects',
              external: true,
              'data-slot': 'custom',
              render: props => h('a', { ...props, 'data-adapter': 'yes' })
            },
            'Projects'
          ),
          h(BreadcrumbSeparator)
        ),
        h(BreadcrumbItem, {}, h(BreadcrumbPage, {}, 'Current'))
      )
    )
  )
  assert.match(html, /<nav[^>]*aria-label="Breadcrumb"/)
  assert.match(html, /<ol/)
  assert.equal((html.match(/<li /g) || []).length, 2)
  assert.equal((html.match(/aria-current="page"/g) || []).length, 1)
  assert.match(html, /data-slot="link breadcrumb-link custom"/)
  assert.match(html, /href="\/projects"/)
  assert.match(html, /target="_blank"/)
  assert.match(html, /rel="noopener noreferrer"/)
  assert.match(html, /aria-hidden="true"/)
  const named = renderToStaticMarkup(h(Breadcrumb, { 'aria-labelledby': 'location' }))
  assert.match(named, /aria-labelledby="location"/)
  assert.doesNotMatch(named, /aria-label=/)
  assert.throws(
    () => renderToStaticMarkup(h(Breadcrumb, { 'aria-label': ' ' })),
    /Breadcrumb requires aria-label or aria-labelledby/
  )
  assert.throws(
    () =>
      renderToStaticMarkup(
        h(BreadcrumbLink, { href: '/x', render: () => h('button', {}, 'Wrong') }, 'X')
      ),
    /anchor/
  )
})
