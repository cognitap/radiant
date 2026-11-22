import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
import {
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  validateA2uiAccessibility,
  type A2uiMessage,
  type A2uiSurfaceLabels,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import {
  RELATION_GRAPH_SURFACE_ID,
  relationGraphFixtureMessages
} from '../../src/a2ui/relationGraphFixtures.js'
import { mount } from './familyHarness.js'

const graph = (props: Record<string, unknown>): A2uiMessage[] => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: RELATION_GRAPH_SURFACE_ID,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      components: [{ id: 'root', component: 'RelationGraph', ...props }]
    }
  }
]

async function render(messages: readonly A2uiMessage[], labels?: A2uiSurfaceLabels) {
  const diagnostics: CatalogDiagnostic[] = []
  const view = await mount(
    <A2uiSurface
      surfaceId={RELATION_GRAPH_SURFACE_ID}
      messages={messages}
      labels={labels}
      onDiagnostic={d => diagnostics.push(d)}
    />
  )
  return { ...view, diagnostics }
}

test('the fixture announces connections in the host labels', async () => {
  const { diagnostics } = await render(relationGraphFixtureMessages, {
    relationOutgoing: 'to {node}',
    relationIncoming: (node, label) => `from ${node}${label ? ` via ${label}` : ''}`
  })
  await expect.element(page.getByRole('group', { name: 'Release pipeline' })).toBeInTheDocument()
  await expect
    .element(page.getByRole('listitem', { name: 'Test' }))
    .toHaveAccessibleDescription('from Build via artifacts. to Deploy: passed. to Build: retry')
  await expect
    .element(page.getByRole('listitem', { name: 'Review' }))
    .toHaveAccessibleDescription('from Build. to Deploy. Optional')
  expect(diagnostics.filter(d => d.component === 'RelationGraph')).toEqual([])
})

test('without host labels connections use arrow symbols and report defaulted', async () => {
  const { diagnostics } = await render(relationGraphFixtureMessages)
  await expect
    .element(page.getByRole('listitem', { name: 'Deploy' }))
    .toHaveAccessibleDescription('← Test: passed. ← Review')
  expect(
    diagnostics.filter(d => d.component === 'RelationGraph').map(({ kind, prop }) => [kind, prop])
  ).toEqual([['defaulted', 'edges']])
})

test('invalid nodes and edges are dropped with one coerced report per prop', async () => {
  const { host, diagnostics } = await render(
    graph({
      label: 'Graph',
      layout: 'spiral',
      nodes: [
        { id: 'a', label: 'A', series: 12, emphasis: 'loud' },
        { id: 'a', label: 'Again' },
        { id: ' ', label: 'Blank' },
        { id: 'b', label: 'B' }
      ],
      edges: [
        { from: 'a', to: 'b', label: ' ' },
        { from: 'a', to: 'missing' }
      ]
    }),
    { relationOutgoing: 'to {node}', relationIncoming: 'from {node}' }
  )
  const nodes = Array.from(host.querySelectorAll<HTMLElement>('[data-slot~="relation-graph-node"]'))
  expect(nodes.map(node => node.getAttribute('aria-label'))).toEqual(['A', 'B'])
  // The catalog coerces enums and series before the adapter drops nodes and edges.
  expect(nodes[0]!.dataset.series).toBe('8')
  expect(host.querySelector('[data-slot~="relation-graph"]')!.getAttribute('data-layout')).toBe(
    'tree'
  )
  expect(
    diagnostics
      .filter(d => d.component === 'RelationGraph' && (d.prop === 'nodes' || d.prop === 'edges'))
      .map(({ kind, prop, received, used }) => ({ kind, prop, received, used }))
  ).toEqual([
    { kind: 'coerced', prop: 'nodes', received: 4, used: 2 },
    { kind: 'coerced', prop: 'edges', received: 2, used: 1 }
  ])
})

test('without nodes it reports a fallback and renders nothing', async () => {
  const { host, diagnostics } = await render(
    graph({ label: 'Graph', layout: 'tree', nodes: [{ id: 'a', label: ' ' }] })
  )
  expect(host.querySelector('[data-slot~="relation-graph"]')).toBeNull()
  expect(
    diagnostics.some(
      d => d.component === 'RelationGraph' && d.kind === 'fallback' && d.prop === 'nodes'
    )
  ).toBe(true)
})

test('the RelationGraph label rule accepts a bound label and flags a missing one', () => {
  const rules = (label: unknown) =>
    validateA2uiAccessibility(
      graph({ label, layout: 'tree', nodes: [{ id: 'a', label: 'A' }] })
    ).errors.map(error => error.rule)
  expect(rules({ path: '/title' })).not.toContain('relation-graph-label')
  expect(rules('Graph')).not.toContain('relation-graph-label')
  expect(rules(' ')).toContain('relation-graph-label')
})
