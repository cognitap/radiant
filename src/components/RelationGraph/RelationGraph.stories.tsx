import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { RelationGraph, type RelationGraphProps } from '../../index.js'

const meta = {
  title: 'Components/RelationGraph',
  component: RelationGraph,
  parameters: {
    docs: {
      description: {
        component:
          'Nodes and directed, labelled edges, laid out from the data: `tree` puts each node under its first parent, `layered` places nodes in layers along edge direction, and `circular` keeps data order around a circle. Cycles and loops are drawn in every layout. One node is in the tab order; Left and Right move along a row (around the ring in `circular`), Up and Down to the nearest node in the next row, preferring a linked one, and each node announces its connections through `connectionText`. Large graphs keep their size, scroll inside the host and can be dragged.'
      }
    }
  }
} satisfies Meta<typeof RelationGraph>

export default meta
type Story = StoryObj<typeof meta>

const connectionText: RelationGraphProps['connectionText'] = ({ direction, node, edge }) =>
  `${direction === 'outgoing' ? 'to' : 'from'} ${node.label}${edge.label ? `, ${edge.label}` : ''}`

const org = {
  'aria-label': 'Product organization',
  layout: 'tree',
  connectionText,
  nodes: [
    { id: 'head', label: 'Head of product', series: 1, emphasis: 'highlighted' },
    { id: 'design', label: 'Design', series: 2 },
    { id: 'eng', label: 'Engineering', series: 3 },
    { id: 'research', label: 'Research', series: 2 },
    { id: 'web', label: 'Web', series: 3 },
    { id: 'platform', label: 'Platform', series: 3 },
    { id: 'vacant', label: 'Data (open role)', emphasis: 'muted', description: 'Open role' }
  ],
  edges: [
    { from: 'head', to: 'design', label: 'leads' },
    { from: 'head', to: 'eng', label: 'leads' },
    { from: 'design', to: 'research' },
    { from: 'eng', to: 'web' },
    { from: 'eng', to: 'platform' },
    { from: 'eng', to: 'vacant' }
  ]
} satisfies RelationGraphProps

const pipeline = {
  'aria-label': 'Release pipeline',
  layout: 'layered',
  connectionText,
  nodes: [
    { id: 'commit', label: 'Commit' },
    { id: 'build', label: 'Build', series: 1 },
    { id: 'lint', label: 'Lint', series: 1 },
    { id: 'test', label: 'Test', series: 1 },
    { id: 'review', label: 'Review', series: 4 },
    { id: 'deploy', label: 'Deploy', series: 3 }
  ],
  edges: [
    { from: 'commit', to: 'build' },
    { from: 'commit', to: 'lint' },
    { from: 'build', to: 'test', label: 'artifacts' },
    { from: 'lint', to: 'review' },
    { from: 'test', to: 'review' },
    { from: 'review', to: 'deploy', label: 'approved' },
    { from: 'commit', to: 'deploy', label: 'hotfix', emphasis: 'muted' },
    { from: 'test', to: 'build', label: 'retry', series: 8 }
  ]
} satisfies RelationGraphProps

const states = {
  'aria-label': 'Order states',
  layout: 'circular',
  connectionText,
  nodes: [
    { id: 'placed', label: 'Placed', series: 1 },
    { id: 'paid', label: 'Paid', series: 1 },
    { id: 'packed', label: 'Packed', series: 3 },
    { id: 'shipped', label: 'Shipped', series: 3 },
    { id: 'delivered', label: 'Delivered', series: 3, emphasis: 'highlighted' },
    { id: 'returned', label: 'Returned', series: 8 }
  ],
  edges: [
    { from: 'placed', to: 'paid', label: 'pay' },
    { from: 'paid', to: 'packed' },
    { from: 'packed', to: 'shipped' },
    { from: 'shipped', to: 'delivered' },
    { from: 'delivered', to: 'returned', label: 'return' },
    { from: 'returned', to: 'paid', label: 'refund' },
    { from: 'placed', to: 'placed', label: 'remind' }
  ]
} satisfies RelationGraphProps

export const Default: Story = {
  args: org,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const head = canvas.getByRole('listitem', { name: 'Head of product' })
    await userEvent.tab()
    await expect(head).toHaveFocus()
    await expect(head).toHaveAccessibleDescription('to Design, leads. to Engineering, leads')
    await userEvent.keyboard('{ArrowDown}{ArrowRight}')
    await expect(canvas.getByRole('listitem', { name: 'Engineering' })).toHaveFocus()
  }
}

function Widths(props: RelationGraphProps) {
  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {['360px', '720px'].map(width => (
        <div
          key={width}
          style={{ width, maxWidth: '100%' }}
        >
          <RelationGraph
            {...props}
            aria-label={`${props['aria-label']} at ${width}`}
          />
        </div>
      ))}
    </div>
  )
}

export const Layered: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Layers follow edge direction. An edge that closes a cycle, such as retry, points back up; an edge that skips layers bends around the layers between. The same graph at 360px, where it scrolls, and 720px.'
      }
    }
  },
  args: pipeline,
  render: args => <Widths {...args} />
}

export const Circular: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Nodes sit on a circle in data order, clockwise from the top. A loop returns to its node.'
      }
    }
  },
  args: states,
  render: args => <Widths {...args} />
}

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'With `type`, the graph is a listbox: Enter, Space or a click selects a node, and `value` and `onValueChange` hold the selection.'
      }
    }
  },
  args: { ...states, 'aria-label': 'Order states to filter' },
  render: function Render() {
    const [value, setValue] = useState<string[]>(['shipped'])
    return (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <RelationGraph
          {...states}
          aria-label="Order states to filter"
          type="multiple"
          value={value}
          onValueChange={setValue}
        />
        <output>{value.join(', ')}</output>
      </div>
    )
  }
}

export const RightToLeft: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The layout mirrors horizontally in right-to-left text, and so do the arrow keys.'
      }
    }
  },
  args: {
    ...org,
    'aria-label': 'מבנה הצוות',
    connectionText: ({ direction, node }) =>
      `${direction === 'outgoing' ? 'אל' : 'מאת'} ${node.label}`,
    nodes: [
      { id: 'head', label: 'ראש המוצר', series: 1 },
      { id: 'design', label: 'עיצוב', series: 2 },
      { id: 'eng', label: 'הנדסה', series: 3 },
      { id: 'research', label: 'מחקר', series: 2 },
      { id: 'web', label: 'אתר', series: 3 },
      { id: 'platform', label: 'פלטפורמה', series: 3 },
      { id: 'vacant', label: 'נתונים', emphasis: 'muted' }
    ],
    edges: org.edges!.map(({ from, to }) => ({ from, to }))
  },
  render: args => (
    <div
      dir="rtl"
      lang="he"
    >
      <Widths {...args} />
    </div>
  )
}

const modules = Array.from({ length: 18 }, (_, index) => ({
  id: `m${index}`,
  label: `Module ${index + 1}`,
  series: ((index % 4) + 1) as 1 | 2 | 3 | 4
}))

export const LargeGraph: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A graph larger than its host keeps its size and scrolls; drag the empty canvas to pan. Focusing a node scrolls it into view.'
      }
    }
  },
  args: {
    'aria-label': 'Module dependencies',
    layout: 'layered',
    connectionText,
    nodes: modules,
    edges: modules.slice(1).map((module, index) => ({
      from: modules[Math.floor(index / 2)]!.id,
      to: module.id
    }))
  }
}
