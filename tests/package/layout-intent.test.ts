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
    h(
      Split,
      { id: 'trip', side: 'start' },
      h(SplitMain, null, 'Main'),
      h(SplitSecondary, null, 'Aside')
    )
  )
  assert.match(split, /^<div id="trip" data-slot="split"/)
  assert.match(split, /@container\/split/)
  assert.match(split, /data-slot="split-main"/)
  assert.match(split, /data-slot="split-secondary"/)
  assert.doesNotMatch(split, / side=| ratio=| gap=/)

  const grid = renderToStaticMarkup(h(Grid, { maxColumns: 4 }, h('div', null, 'Item')))
  assert.match(grid, /data-slot="grid"/)
  assert.match(grid, /--_grid-max:4/)
  assert.throws(() => renderToStaticMarkup(h(Grid, { maxColumns: 8 as never })), TypeError)

  const compare = renderToStaticMarkup(
    h(
      Compare,
      null,
      h(
        CompareItem,
        null,
        h(CompareItemHeader, null, 'Basic'),
        h(CompareItemBody, null, 'One'),
        h(CompareItemFooter, null, 'Choose')
      )
    )
  )
  assert.match(compare, /^<ul[^>]+data-slot="compare"/)
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
  assert.match(reveal, /<output[^>]+aria-live="polite"[^>]*>1 of 2<\/output>/)
})
