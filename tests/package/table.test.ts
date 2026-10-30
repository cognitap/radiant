import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Table,
  TableCaption,
  TableHead,
  TableBody,
  TableFoot,
  TableRow,
  TableHeader,
  TableCell,
  TableContainer,
  Link,
  Button
} from '@cognitap/radiant'
test('Table retains native caption, header relationships and ordinary interactive cell content', () => {
  const html = renderToStaticMarkup(
    h(
      TableContainer,
      { 'aria-label': 'Scrollable members' },
      h(
        Table,
        { 'data-slot': 'custom' },
        h(TableCaption, {}, 'Team members'),
        h(
          TableHead,
          {},
          h(
            TableRow,
            {},
            h(TableHeader, { id: 'member' }, 'Name'),
            h(TableHeader, { id: 'action' }, 'Action')
          )
        ),
        h(
          TableBody,
          {},
          h(
            TableRow,
            {},
            h(TableHeader, { scope: 'row', id: 'jordan' }, 'Jordan'),
            h(
              TableCell,
              { headers: 'action jordan' },
              h(Link, { href: '/jordan' }, 'Profile'),
              h(Button, {}, 'Select Jordan')
            )
          )
        ),
        h(TableFoot, {}, h(TableRow, {}, h(TableCell, { colSpan: 2 }, 'One member')))
      )
    )
  )
  assert.match(html, /<section[^>]*tabindex="0"/)
  assert.match(html, /<table[^>]*data-slot="table custom"/)
  assert.match(html, /<caption/)
  assert.match(html, /<thead/)
  assert.match(html, /<tbody/)
  assert.match(html, /<tfoot/)
  assert.match(html, /scope="col"/)
  assert.match(html, /scope="row"/)
  assert.match(html, /headers="action jordan"/)
  assert.match(html, /href="\/jordan"/)
  assert.match(html, /type="button"/)
  assert.doesNotMatch(html, /role="grid"|aria-selected/)
  const named = renderToStaticMarkup(h(TableContainer, { 'aria-labelledby': 'heading' }))
  assert.match(named, /aria-labelledby="heading"/)
  assert.doesNotMatch(named, /aria-label=/)
  assert.throws(
    () => renderToStaticMarkup(h(TableContainer, { 'aria-label': ' ' })),
    /accessible name/
  )
})
