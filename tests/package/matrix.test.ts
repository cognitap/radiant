import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Matrix,
  MatrixCell,
  MatrixColumnHeader,
  MatrixRow,
  MatrixRowHeader
} from '@cognitap/radiant'

test('Matrix renders grid semantics with the selected cell as its one tab stop on the server', () => {
  const markup = renderToStaticMarkup(
    h(
      Matrix,
      { 'aria-label': 'Seats', columns: 2, type: 'multiple', defaultValue: ['a'] },
      h(MatrixRow, null, h(MatrixColumnHeader, null, '1'), h(MatrixColumnHeader, null, '2')),
      h(
        MatrixRow,
        null,
        h(MatrixRowHeader, null, 'A'),
        h(MatrixCell, { value: 'a' }, 'A1'),
        h(MatrixCell, { value: 'b' }, 'A2')
      )
    )
  )
  assert.match(markup, /^<div aria-label="Seats" role="grid" aria-multiselectable="true"/)
  assert.match(markup, /--_matrix-columns:2/)
  assert.match(markup, /role="columnheader"/)
  assert.match(markup, /role="rowheader"/)
  assert.match(
    markup,
    /role="gridcell" tabindex="0" aria-selected="true"[^>]*data-slot="matrix-cell"/
  )
  assert.equal(markup.match(/tabindex="0"/g)?.length, 1)
  assert.match(markup, /role="gridcell" tabindex="-1" aria-selected="false"/)
  assert.throws(
    () => renderToStaticMarkup(h(Matrix, { 'aria-label': 'Seats', columns: 1.5 })),
    TypeError
  )
})
