import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  FilterProjectBoard,
  ReviewRecipients,
  type TagOptions
} from '../.storybook/examples/TagExamples.js'
const meta = {
  title: 'Components/Tag',
  component: FilterProjectBoard,
  args: { tone: 'neutral', disabled: false, pending: false, dir: 'ltr' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['accent', 'neutral', 'warning', 'danger'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    parts: { control: 'object' },
    style: { control: 'object' }
  },
  render: args => <FilterProjectBoard {...args} />
} satisfies Meta<TagOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const FilteringProjectBoard: Story = {}
export const ReviewingReportRecipients: Story = { render: args => <ReviewRecipients {...args} /> }
