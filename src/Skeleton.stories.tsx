import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  CardPlaceholderExample,
  ReplacingWithContentExample,
  TextBlockExample
} from '../.storybook/examples/SkeletonExamples.js'
import { Skeleton } from './index.js'
const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component:
          'An empty decorative placeholder shape, always hidden from assistive technology. The application owns the loading region’s aria-busy state, the loading and completion status text, and replacing shapes with real content. Width, height, radius, color and pulse duration follow theme tokens, style and className. Reduced motion, theme motion off and motion="off" keep a static shape.'
      }
    }
  },
  decorators: [
    Story => (
      <div style={{ width: '20rem', maxWidth: '100%' }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Skeleton>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const TextBlock: Story = { render: () => <TextBlockExample /> }
export const CardPlaceholder: Story = { render: () => <CardPlaceholderExample /> }
export const ReplacingWithContent: Story = { render: () => <ReplacingWithContentExample /> }
export const Customisation: Story = {
  args: {
    style: {
      '--rad-skeleton-width': '4rem',
      '--rad-skeleton-height': '4rem',
      '--rad-skeleton-radius': '50%',
      '--rad-skeleton-color': 'var(--rad-color-accent)',
      '--rad-skeleton-duration': '3s'
    }
  }
}
export const MotionOff: Story = { args: { motion: 'off' } }
