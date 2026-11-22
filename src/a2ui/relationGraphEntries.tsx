'use client'

import { useEffect, useMemo } from 'react'
import {
  RelationGraph,
  type RelationGraphConnectionText,
  type RelationGraphEdge,
  type RelationGraphEmphasis,
  type RelationGraphLayout,
  type RelationGraphNode,
  type RelationGraphSeries
} from '../components/RelationGraph/RelationGraph.js'
import { radiantCatalog } from '../catalog/index.js'
import { isPlainRecord } from '../catalog/coerce.js'
import { generateA2uiCatalogs, type A2uiJsonSchema } from './catalogGenerator.js'
import { createA2uiRegistryEntry, type A2uiAdapterContext } from './registry.js'
import { hasText, type A2uiAccessibilityRule } from './accessibilityRules.js'
import { readA2uiValue } from './adapterValues.js'
import { useA2uiLabels, type A2uiSurfaceLabels } from './surfaceContext.js'

const schema = generateA2uiCatalogs(radiantCatalog).extension.components.RelationGraph as
  | (A2uiJsonSchema & { readonly description: string })
  | undefined
if (!schema || typeof schema.description !== 'string')
  throw new TypeError('A2UI extension catalog generator did not emit "RelationGraph".')

type Props = Readonly<Record<string, unknown>>

const text = (value: unknown) => {
  const raw = readA2uiValue(value)
  return typeof raw === 'string' ? raw.trim() : ''
}
const list = (value: unknown): unknown[] => {
  const raw = readA2uiValue(value)
  return Array.isArray(raw) ? raw : []
}
const series = (value: unknown): RelationGraphSeries | undefined =>
  Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 8
    ? (value as RelationGraphSeries)
    : undefined
const emphasis = (value: unknown): RelationGraphEmphasis | undefined =>
  value === 'highlighted' || value === 'muted' ? value : undefined
const LAYOUTS: readonly RelationGraphLayout[] = ['tree', 'layered', 'circular']

/**
 * Keeps the nodes with a fresh id and a label, and the edges between kept nodes. Optional node
 * and edge fields outside the contract are left out.
 */
export function readRelationGraph(props: Props) {
  const nodes: RelationGraphNode[] = []
  const ids = new Set<string>()
  for (const raw of list(props.nodes)) {
    if (!isPlainRecord(raw)) continue
    const id = text(raw.id),
      label = text(raw.label)
    if (!id || !label || ids.has(id)) continue
    ids.add(id)
    const color = series(raw.series),
      state = emphasis(raw.emphasis),
      description = text(raw.description)
    nodes.push({
      id,
      label,
      ...(color ? { series: color } : {}),
      ...(state ? { emphasis: state } : {}),
      ...(description ? { description } : {})
    })
  }
  const edges: RelationGraphEdge[] = []
  for (const raw of list(props.edges)) {
    if (!isPlainRecord(raw)) continue
    const from = text(raw.from),
      to = text(raw.to)
    if (!ids.has(from) || !ids.has(to)) continue
    const label = text(raw.label),
      color = series(raw.series),
      state = emphasis(raw.emphasis),
      description = text(raw.description)
    edges.push({
      from,
      to,
      ...(label ? { label } : {}),
      ...(description ? { description } : {}),
      ...(color ? { series: color } : {}),
      ...(state ? { emphasis: state } : {})
    })
  }
  // The catalog already coerces an unknown layout; this guards direct adapter calls.
  const rawLayout = readA2uiValue(props.layout)
  const layout = LAYOUTS.includes(rawLayout as RelationGraphLayout)
    ? (rawLayout as RelationGraphLayout)
    : 'tree'
  const dropped = {
    nodes: list(props.nodes).length - nodes.length,
    edges: list(props.edges).length - edges.length
  }
  return { layout, nodes, edges, dropped }
}

const REASONS: Record<string, string> = {
  nodes: 'Nodes without an id or label, or repeating an id, are dropped; their edges go too.',
  edges: 'Edges whose ends are not kept node ids are dropped.'
}

type Template = A2uiSurfaceLabels['relationOutgoing']

function templateFrom(label: Template): ((node: string, label?: string) => string) | undefined {
  if (typeof label === 'function') return label
  if (typeof label !== 'string' || !label.trim()) return undefined
  return (node, edge) => `${label.replaceAll('{node}', node)}${edge ? `: ${edge}` : ''}`
}

/** Requires a RelationGraph to have a `label` that names it. */
const relationGraphLabelRule: A2uiAccessibilityRule = {
  id: 'relation-graph-label',
  check(component) {
    if (hasText(component.label)) return
    return {
      prop: 'label',
      message: `RelationGraph "${String(component.id)}" has no label to name its graph.`
    }
  }
}

function A2uiRelationGraph({ props, context }: { props: Props; context: A2uiAdapterContext }) {
  const { layout, nodes, edges, dropped } = readRelationGraph(props)
  const label = text(props.label)
  const labels = useA2uiLabels()
  const { relationOutgoing, relationIncoming } = labels
  const connectionText = useMemo<RelationGraphConnectionText | undefined>(() => {
    const outgoing = templateFrom(relationOutgoing),
      incoming = templateFrom(relationIncoming)
    if (!outgoing || !incoming) return undefined
    return ({ direction, node, edge }) =>
      (direction === 'outgoing' ? outgoing : incoming)(node.label, edge.label?.trim() || undefined)
  }, [relationOutgoing, relationIncoming])
  const nodeId = context.node.componentId
  const report = context.reportDiagnostic
  const kept: Record<string, number> = { nodes: nodes.length, edges: edges.length }
  const coercedKey = JSON.stringify(
    Object.entries(dropped)
      .filter(([, count]) => count > 0)
      .map(([prop, count]) => [prop, count + kept[prop]!, kept[prop]!])
  )
  useEffect(() => {
    for (const [prop, received, used] of JSON.parse(coercedKey) as [string, number, number][])
      report?.({
        kind: 'coerced',
        nodeId,
        component: 'RelationGraph',
        prop,
        received,
        used,
        reason: REASONS[prop]!
      })
  }, [coercedKey, nodeId, report])
  useEffect(() => {
    if (nodes.length) return
    report?.({
      kind: 'fallback',
      nodeId,
      component: 'RelationGraph',
      prop: 'nodes',
      received: props.nodes,
      used: null,
      reason: 'RelationGraph needs at least one node with an id and label; it renders nothing.'
    })
  }, [nodes.length, nodeId, report, props.nodes])
  useEffect(() => {
    if (label || !nodes.length) return
    report?.({
      kind: 'defaulted',
      nodeId,
      component: 'RelationGraph',
      prop: 'label',
      received: props.label,
      used: 'first node labels',
      reason: 'RelationGraph needs a label; its first three node labels name it instead.'
    })
  }, [label, nodeId, report, props.label, nodes.length])
  const connected = edges.length > 0
  useEffect(() => {
    if (connectionText || !connected) return
    report?.({
      kind: 'defaulted',
      nodeId,
      component: 'RelationGraph',
      prop: 'edges',
      received: null,
      used: 'arrow symbols',
      reason:
        'A2uiSurface labels lack relationOutgoing or relationIncoming; connections are announced with arrow symbols.'
    })
  }, [connectionText, connected, nodeId, report])
  if (!nodes.length) return null
  return (
    <RelationGraph
      data-slot="a2ui-relation-graph"
      aria-label={
        label ||
        nodes
          .slice(0, 3)
          .map(node => node.label)
          .join(', ')
      }
      layout={layout}
      nodes={nodes}
      edges={edges}
      {...(connectionText ? { connectionText } : {})}
    />
  )
}

const relationGraphEntry = createA2uiRegistryEntry({
  name: 'RelationGraph',
  accessibility: [relationGraphLabelRule],
  component: [RelationGraph],
  schema,
  description: schema.description,
  adapter(props, context) {
    return (
      <A2uiRelationGraph
        props={props}
        context={context}
      />
    )
  }
})

export const relationGraphEntries = [relationGraphEntry]
