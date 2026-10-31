import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Field, TagsInput } from './index.js'
import {
  LabelResearchNotes,
  InviteWorkshopGuests,
  ProtectReleaseLabels,
  TagsInputSizeComparison,
  type TagsTaskOptions
} from '../.storybook/examples/TagsInputExamples.js'
const meta = {
  title: 'Components/TagsInput',
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
  render: ({ dir, initialValues, ...args }) => (
    <div
      dir={dir}
      style={{ width: 'min(32rem,100%)' }}
    >
      <TagsInput
        key={JSON.stringify(initialValues)}
        {...args}
        aria-label="Topics"
        name="topics"
        defaultValue={initialValues}
      />
    </div>
  )
} satisfies Meta<TagsTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const WithField: Story = {
  args: { initialValues: [] },
  render: ({ dir, initialValues, ...args }) => (
    <div
      dir={dir}
      style={{ width: 'min(32rem,100%)' }}
    >
      <Field
        label="Research topics"
        description="Press Enter or type a comma to add a topic."
        error="Add at least one topic."
        required
      >
        <TagsInput
          key={JSON.stringify(initialValues)}
          {...args}
          name="topics"
          defaultValue={initialValues}
        />
      </Field>
    </div>
  )
}
export const Controlled: Story = {
  args: { initialValues: ['release'] },
  render: args => (
    <ProtectReleaseLabels
      key={JSON.stringify(args.initialValues)}
      {...args}
    />
  )
}
export const SharedControlSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => <TagsInputSizeComparison />
}
export const LabelingResearchNotes: Story = {
  render: args => (
    <LabelResearchNotes
      key={JSON.stringify(args.initialValues)}
      {...args}
    />
  )
}
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
