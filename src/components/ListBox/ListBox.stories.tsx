import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from '../Field/Field.js'
import { ListBox, type ListBoxOption } from './ListBox.js'

const templates: ListBoxOption[] = [
  {
    value: 'research',
    textValue: 'Research notes',
    label: (
      <>
        <strong>Research notes</strong>
        <div>Collect findings and links.</div>
      </>
    )
  },
  {
    value: 'launch',
    textValue: 'Product launch',
    label: (
      <>
        <strong>Product launch</strong>
        <div>Plan milestones and signoffs.</div>
      </>
    )
  },
  { value: 'archive', label: 'Archive', disabled: true }
]

const meta = {
  title: 'Components/ListBox',
  component: ListBox,
  args: { 'aria-label': 'Project template', items: templates }
} satisfies Meta<typeof ListBox>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ChooseTemplates: Story = {
  render: () => (
    <Field
      label="Project templates"
      className="max-w-sm"
      description="Select templates to add to your workspace."
    >
      <ListBox
        type="multiple"
        name="templates"
        items={templates}
        defaultValue={['research']}
      />
    </Field>
  )
}
