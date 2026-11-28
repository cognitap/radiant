import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckboxGroup, type CheckboxGroupItem } from '../../index.js'

const items: CheckboxGroupItem[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'Text messages' },
  { value: 'push', label: 'Push notifications', disabled: true }
]

const controls = { include: ['label', 'controlSize', 'disabled'] }
const meta = {
  title: 'Components/CheckboxGroup',
  component: CheckboxGroup,
  parameters: { controls, docs: { controls } },
  args: {
    label: 'Notifications',
    name: 'channels',
    items,
    defaultValue: ['email'],
    selectAll: { label: 'Select all' },
    controlSize: 'medium',
    disabled: false
  },
  argTypes: {
    label: { control: 'text' },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] }
  }
} satisfies Meta<typeof CheckboxGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithField: Story = {
  args: { defaultValue: [], selectAll: undefined, 'aria-invalid': false },
  argTypes: { 'aria-invalid': { control: 'boolean', name: 'Show error' } },
  parameters: { controls: { include: [...controls.include, 'aria-invalid'] } },
  render: ({ 'aria-invalid': invalid, ...args }) => (
    <CheckboxGroup
      {...args}
      required
      description="Choose at least one channel."
      error={invalid ? 'Select a channel to continue.' : undefined}
    />
  )
}
