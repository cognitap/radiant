import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Switch } from '../../index.js'

const controls = { include: ['label', 'controlSize', 'disabled'] }
const meta = {
  title: 'Components/Switch',
  component: Switch,
  parameters: { controls, docs: { controls } },
  args: {
    label: 'Desktop notifications',
    defaultChecked: true,
    controlSize: 'medium',
    disabled: false
  },
  argTypes: {
    label: { control: 'text' },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] }
  }
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithField: Story = {
  args: { label: 'Automatic backups', defaultChecked: false, 'aria-invalid': false },
  argTypes: { 'aria-invalid': { control: 'boolean', name: 'Show error' } },
  parameters: { controls: { include: [...controls.include, 'aria-invalid'] } },
  render: ({ label, disabled, 'aria-invalid': invalid, ...args }) => (
    <Field
      label={label}
      disabled={disabled}
      description="Keep a copy of your workspace."
      error={invalid ? 'Enable backups to continue.' : undefined}
      required
    >
      <Switch
        {...args}
        name="backups"
      />
    </Field>
  )
}
