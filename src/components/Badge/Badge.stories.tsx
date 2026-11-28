import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge, Stack } from '../../index.js'

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Draft', tone: 'neutral' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'accent', 'warning', 'danger'] },
    children: { control: 'text' },
    decorative: { control: false }
  }
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Tones: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack
      orientation="horizontal"
      gap="tight"
      wrap
    >
      <Badge>Draft</Badge>
      <Badge tone="accent">Published</Badge>
      <Badge tone="warning">Needs review</Badge>
      <Badge tone="danger">Blocked</Badge>
    </Stack>
  )
}
