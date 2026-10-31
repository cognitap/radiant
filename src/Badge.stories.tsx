import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './index.js'
import {
  ReleaseStatusTable,
  RepeatedStatus,
  SectionCounts
} from '../.storybook/examples/BadgeExamples.js'
const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          'Compact passive status, count or category text. Tone defaults to neutral and is visual only, so keep meaningful visible text and never let color carry the message alone. Decorative badges are hidden only when adjacent text already says the same thing. Use Tag when people can remove the item, Kbd for keys, Button or Link for actions, and an application-owned Alert for live updates.'
      }
    }
  },
  args: { children: 'Draft', tone: 'neutral', decorative: false },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'accent', 'warning', 'danger'] },
    decorative: { control: 'boolean' },
    children: { control: 'text' },
    className: { control: 'text' },
    style: { control: 'object' }
  }
} satisfies Meta<typeof Badge>
export default meta
type Story = StoryObj<typeof meta>
const taskControls = {
  children: { control: false, table: { disable: true } },
  tone: { control: false, table: { disable: true } },
  decorative: { control: false, table: { disable: true } }
} as const
export const Default: Story = {}
export const ShowingStatus: Story = {
  argTypes: taskControls,
  render: ({ className, style }) => (
    <ReleaseStatusTable
      className={className}
      style={style}
    />
  )
}
export const CountingItems: Story = {
  argTypes: taskControls,
  render: ({ className, style }) => (
    <SectionCounts
      className={className}
      style={style}
    />
  )
}
export const HidingRepeatedText: Story = {
  argTypes: taskControls,
  render: ({ className, style }) => (
    <RepeatedStatus
      className={className}
      style={style}
    />
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
