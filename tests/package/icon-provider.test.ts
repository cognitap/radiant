import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Checkbox, IconProvider, Spinner } from '@cognitap/radiant'

const Mark = ({ className }: { className?: string }) => h('svg', { className, 'data-mark': '' })

test('server markup draws supplied icons and keeps built-in drawings without them', () => {
  const plain = renderToStaticMarkup(h(Checkbox, { 'aria-label': 'Agree' }))
  const empty = renderToStaticMarkup(
    h(IconProvider, { icons: {} }, h(Checkbox, { 'aria-label': 'Agree' }))
  )
  assert.equal(empty, plain)
  assert.doesNotMatch(plain, /data-mark/)
  const supplied = renderToStaticMarkup(
    h(
      IconProvider,
      { icons: { check: Mark, spinner: Mark } },
      h(Checkbox, { 'aria-label': 'Agree' }),
      h(Spinner)
    )
  )
  assert.equal(supplied.match(/data-mark/g)?.length, 2)
  assert.match(supplied, /<foreignObject/)
  assert.throws(
    () => renderToStaticMarkup(h(IconProvider, { icons: { star: Mark } as never }, 'x')),
    /no icon named "star"/
  )
})
