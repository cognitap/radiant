import { createRef } from 'react'
import {
  RelationGraph,
  type RelationGraphConnectionText,
  type RelationGraphEdge,
  type RelationGraphLayout,
  type RelationGraphNode,
  type RelationGraphProps
} from '@cognitap/radiant'
const nodes: RelationGraphNode[] = [
  { id: 'a', label: 'A', series: 2, emphasis: 'highlighted', description: 'Start' },
  { id: 'b', label: 'B' }
]
const edges: RelationGraphEdge[] = [{ from: 'a', to: 'b', label: 'next', emphasis: 'muted' }]
const connectionText: RelationGraphConnectionText = ({ direction, node, edge }) =>
  `${direction} ${node.label} ${edge.label ?? ''} ${edge.description ?? ''}`
const props: RelationGraphProps = {
  'aria-label': 'Graph',
  layout: 'tree',
  nodes,
  edges,
  connectionText,
  ref: createRef<HTMLDivElement>(),
  style: { '--rad-relation-graph-node-radius': '1rem' }
}
;<RelationGraph {...props} />
;<RelationGraph
  aria-labelledby="heading"
  layout="circular"
  nodes={nodes}
  type="single"
  defaultValue="a"
  onValueChange={(value: string | null) => void value}
/>
;<RelationGraph
  aria-label="Graph"
  layout="layered"
  nodes={nodes}
  type="multiple"
  value={['a']}
  onValueChange={(value: string[]) => void value}
/>
// @ts-expect-error An accessible name is required.
;<RelationGraph
  layout="tree"
  nodes={nodes}
/>
// @ts-expect-error A value needs a selection type.
;<RelationGraph
  aria-label="Graph"
  layout="tree"
  nodes={nodes}
  value="a"
/>
// @ts-expect-error Multiple selection takes an array.
;<RelationGraph
  aria-label="Graph"
  layout="tree"
  nodes={nodes}
  type="multiple"
  value="a"
/>
// @ts-expect-error Layouts are tree, layered or circular.
const grid: RelationGraphLayout = 'grid'
// @ts-expect-error Series run from 1 to 8.
const outOfRange: RelationGraphNode = { id: 'x', label: 'x', series: 9 }
void [outOfRange, grid]
