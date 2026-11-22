import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Compare,
  CompareItem,
  CompareItemBody,
  CompareItemFooter,
  CompareItemHeader,
  Grid,
  Reveal,
  Split,
  SplitMain,
  SplitSecondary
} from '@cognitap/radiant'
test('intent layouts render size containers and parts on the server', () => {
  const split = renderToStaticMarkup(
    h(Split, { id: 'trip' }, h(SplitMain, null, 'Main'), h(SplitSecondary, null, 'Aside'))
  )
  assert.match(split, /^<div id="trip" data-slot="split"/)
  assert.match(split, /@container\/split/)
  assert.match(split, /data-slot="split-main"/)
  assert.match(split, /data-slot="split-secondary"/)
  assert.doesNotMatch(split, / ratio=| gap=/)

  const grid = renderToStaticMarkup(h(Grid, { maxColumns: 4 }, h('div', null, 'Item')))
  assert.match(grid, /data-slot="grid"/)
  assert.match(grid, /--_grid-max:4/)
  assert.throws(() => renderToStaticMarkup(h(Grid, { maxColumns: 8 as never })), TypeError)

  const item = (name: string) =>
    h(
      CompareItem,
      { key: name },
      h(CompareItemHeader, null, name),
      h(CompareItemBody, null, 'One'),
      h(CompareItemFooter, null, 'Choose')
    )
  const compare = renderToStaticMarkup(h(Compare, null, item('Basic'), item('Plus')))
  assert.match(compare, /^<ul role="list"[^>]+data-slot="compare"/)
  assert.throws(() => renderToStaticMarkup(h(Compare, null, item('Basic'))), TypeError)
  assert.match(compare, /<li[^>]+data-slot="compare-item"/)
  assert.match(compare, /grid-template-rows:subgrid/)

  const reveal = renderToStaticMarkup(
    h(Reveal, {
      items: [
        { value: 'a', children: 'First' },
        { value: 'b', children: 'Second' }
      ],
      previousLabel: 'Back',
      nextLabel: 'Next',
      positionLabel: (index: number, count: number) => `${index + 1} of ${count}`
    })
  )
  assert.match(reveal, /data-slot="reveal-step" data-selected=""[^>]*>First/)
  assert.match(reveal, /data-slot="reveal-step" hidden=""[^>]*>Second/)
  assert.match(reveal, /data-slot="reveal-steps" aria-live="polite"/)
  assert.match(reveal, /role="group" aria-label="2 of 2"/)
  assert.match(reveal, /<output[^>]*>1 of 2<\/output>/)
})
