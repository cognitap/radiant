import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SortableList, SortableListItem } from '@cognitap/radiant'

const position = (item: string, index: number, count: number) => `${item} ${index + 1}/${count}`
const text = {
  instructionsText: 'Space picks up.',
  pickUpText: position,
  moveText: position,
  dropText: position,
  cancelText: position
}

test('SortableList renders its order, handles and form values on the server', () => {
  const html = renderToStaticMarkup(
    h(
      SortableList,
      { 'aria-label': 'Order', name: 'order', defaultValue: ['b'], ...text },
      h(SortableListItem, { value: 'a' }, 'Alpha'),
      h(SortableListItem, { value: 'b' }, 'Beta')
    )
  )
  assert.match(html, /<ol aria-label="Order" data-slot="sortable-list"/)
  assert.ok(html.indexOf('Beta') < html.indexOf('Alpha'))
  assert.equal(html.match(/data-slot="button sortable-list-handle"/g)?.length, 2)
  assert.match(html, /aria-pressed="false"/)
  assert.match(html, /data-rad-layout-slot=""/)
  const values = [...html.matchAll(/<input[^>]*data-slot="sortable-list-value"[^>]*>/g)].map(
    ([input]) => input.match(/value="([^"]*)"/)?.[1]
  )
  assert.deepEqual(values, ['b', 'a'])
  assert.throws(
    () => renderToStaticMarkup(h(SortableList, { ...text } as never)),
    /aria-label or aria-labelledby/
  )
})
