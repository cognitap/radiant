import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import {
  LabelResearchNotes,
  InviteWorkshopGuests,
  ProtectReleaseLabels,
  type TagsTaskOptions
} from '../.storybook/examples/TagsInputExamples.js'
const meta = {
  title: 'Components/TagsInput',
  component: LabelResearchNotes,
  args: {
    controlSize: 'medium',
    disabled: false,
    readOnly: false,
    dir: 'ltr',
    maxCount: 4,
    separators: [','],
    initialValues: ['research']
  },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    maxCount: { control: { type: 'number', min: 0, max: 12, step: 1 } },
    separators: { control: 'object' },
    initialValues: { control: 'object' },
    parts: { control: 'object' },
    style: { control: 'object' }
  },
  render: args => (
    <LabelResearchNotes
      key={JSON.stringify(args.initialValues)}
      {...args}
    />
  )
} satisfies Meta<TagsTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const LabelingResearchNotes: Story = {}
export const InvitingWorkshopGuests: Story = {
  args: { initialValues: [], maxCount: 3, separators: [',', ';'] },
  play: async ({ canvasElement, args }) => {
    if (args.disabled || args.readOnly) return
    const input = within(canvasElement).getByRole('textbox', { name: 'Guest emails' })
    await userEvent.type(input, 'unfinished')
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'))
  },
  render: args => (
    <InviteWorkshopGuests
      key={JSON.stringify(args.initialValues)}
      {...args}
    />
  )
}
export const ProtectingReleaseLabels: Story = {
  args: { initialValues: ['release'] },
  render: args => (
    <ProtectReleaseLabels
      key={JSON.stringify(args.initialValues)}
      {...args}
    />
  )
}
