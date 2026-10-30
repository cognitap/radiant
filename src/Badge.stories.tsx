import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './index.js'
const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          'Compact passive status/category text. Keep meaningful visible text so color never carries the message alone. Tone is visual, not announcement urgency. Decorative badges are hidden only when adjacent text already conveys the same meaning. Use actual Button or Link for actions; put meaningful live updates in an application-owned Alert. Native span refs and theme/caller styles remain available.'
      }
    }
  }
} satisfies Meta<typeof Badge>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { args: { children: 'Draft' } }
export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
      <Badge tone="neutral">Draft</Badge>
      <Badge tone="accent">Approved</Badge>
      <Badge tone="warning">Needs attention</Badge>
      <Badge tone="danger">Blocked</Badge>
    </div>
  )
}
export const Customisation: Story = {
  args: {
    children: 'Long category names wrap within their available space',
    style: {
      width: '11rem',
      '--rad-badge-radius': '9999px',
      '--rad-badge-border-width': '2px',
      '--rad-badge-font-size': '1rem'
    }
  }
}
export const Decorative: Story = {
  render: () => (
    <p>
      Release approved.{' '}
      <Badge
        decorative
        tone="accent"
      >
        Approved
      </Badge>
    </p>
  )
}
