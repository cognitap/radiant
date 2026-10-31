import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Tag } from './index.js'
import {
  FilterProjectBoard,
  ReviewRecipients,
  type TagOptions
} from '../.storybook/examples/TagExamples.js'
const onRemove = fn()
const meta = {
  title: 'Components/Tag',
  args: { tone: 'neutral', disabled: false, pending: false, dir: 'ltr' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['accent', 'neutral', 'warning', 'danger'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    parts: { control: 'object' },
    style: { control: 'object' }
  },
  render: ({ dir, ...args }) => (
    <div dir={dir}>
      <Tag
        {...args}
        removeLabel="Remove Design filter"
        onRemove={onRemove}
      >
        Design
      </Tag>
    </div>
  )
} satisfies Meta<TagOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const FilteringProjectBoard: Story = { render: args => <FilterProjectBoard {...args} /> }
export const ReviewingReportRecipients: Story = { render: args => <ReviewRecipients {...args} /> }
