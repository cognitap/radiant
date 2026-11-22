import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RelationGraph } from '@cognitap/radiant'
test('RelationGraph renders a laid-out group of focusable nodes on the server', () => {
  const html = renderToStaticMarkup(
    h(RelationGraph, {
      'aria-label': 'Pipeline',
      'data-slot': 'pipeline',
      layout: 'layered',
      nodes: [
        { id: 'build', label: 'Build', series: 1 },
        { id: 'test', label: 'Test' }
      ],
      edges: [{ from: 'build', to: 'test', label: 'artifacts' }]
    })
  )
  assert.match(
    html,
    /^<div aria-label="Pipeline" data-slot="relation-graph pipeline" role="group" data-layout="layered"/
  )
  assert.match(html, /<svg aria-hidden="true" focusable="false" data-slot="relation-graph-edges"/)
  assert.match(
    html,
    /data-slot="relation-graph-edge" data-from="build" data-to="test"[^>]*><path d="M/
  )
  assert.match(html, /data-slot="relation-graph-edge-label"[^>]*>artifacts<\/span>/)
  assert.match(html, /<ul role="list" data-slot="relation-graph-nodes"/)
  assert.match(
    html,
    /data-id="build" data-index="0" data-series="1"[^>]*tabindex="0" aria-label="Build"/
  )
  assert.match(html, /data-id="test" data-index="1"[^>]*tabindex="-1" aria-label="Test"/)
  assert.match(html, /class="sr-only">→ Test: artifacts<\/span>/)
  const selectable = renderToStaticMarkup(
    h(RelationGraph, {
      'aria-label': 'Pick',
      layout: 'circular',
      type: 'multiple',
      defaultValue: ['b'],
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' }
      ]
    })
  )
  assert.match(selectable, /role="listbox" aria-multiselectable="true"/)
  assert.match(
    selectable,
    /role="option" aria-selected="true" data-slot="relation-graph-node" data-id="b"/
  )
  assert.throws(
    () => renderToStaticMarkup(h(RelationGraph, { 'aria-label': 'x', layout: 'tree', nodes: [] })),
    /at least one node/
  )
})
