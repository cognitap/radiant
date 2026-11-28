import type { Meta, StoryObj } from '@storybook/react-vite'
import { InlineCode, type InlineCodeProps } from './InlineCode.js'

const meta = {
  title: 'Components/InlineCode',
  parameters: { layout: 'padded' },
  component: InlineCode,
  args: { children: 'package.json' },
  argTypes: {
    children: { control: 'text' },
    className: { control: 'text' },
    style: { control: 'object' }
  }
} satisfies Meta<InlineCodeProps>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: args => (
    <p>
      Open <InlineCode {...args} /> to edit dependencies.
    </p>
  )
}
