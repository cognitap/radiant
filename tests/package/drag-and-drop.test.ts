import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DragAndDrop, DragAndDropContainer, DragAndDropItem } from '@cognitap/radiant'

const say = ({ item, to }: { item: string; to: string }) => `${item} in ${to}`
const text = {
  instructionsText: 'Space picks up.',
  pickUpText: say,
  moveText: say,
  dropText: say,
  cancelText: say
}

test('DragAndDrop renders containers, placed items and its form value on the server', () => {
  const html = renderToStaticMarkup(
    h(
      DragAndDrop,
      { 'aria-label': 'Board', name: 'board', defaultValue: { done: ['b'] }, ...text },
      h(DragAndDropContainer, { value: 'todo', label: 'To do' }),
      h(DragAndDropContainer, { value: 'done', label: 'Done' }),
      h(DragAndDropItem, { value: 'a' }, 'Alpha'),
      h(DragAndDropItem, { value: 'b' }, 'Beta')
    )
  )
  assert.match(html, /aria-label="Board" role="group" data-slot="drag-and-drop"/)
  assert.equal(html.match(/data-slot="drag-and-drop-container"/g)?.length, 2)
  assert.ok(html.indexOf('To do') < html.indexOf('Alpha'))
  assert.ok(html.indexOf('Done') < html.indexOf('Beta'))
  assert.equal(html.match(/data-slot="button drag-and-drop-handle"/g)?.length, 2)
  const input = html.match(/<input[^>]*data-slot="drag-and-drop-value"[^>]*>/)![0]
  assert.equal(
    input.match(/value="([^"]*)"/)?.[1]?.replaceAll('&quot;', '"'),
    JSON.stringify({ todo: ['a'], done: ['b'] })
  )
  assert.throws(
    () =>
      renderToStaticMarkup(
        h(
          DragAndDrop,
          { 'aria-label': 'Board', ...text },
          h(DragAndDropContainer, { value: 'todo', label: 'To do', capacity: 1 })
        )
      ),
    /fullText/
  )
})
