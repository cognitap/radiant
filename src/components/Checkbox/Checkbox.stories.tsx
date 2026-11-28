import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox, Field, type CheckboxProps } from '../../index.js'

type Args = Pick<
  CheckboxProps,
  | 'aria-invalid'
  | 'controlSize'
  | 'defaultChecked'
  | 'disabled'
  | 'indeterminate'
  | 'label'
  | 'name'
>

const controls = { include: ['label', 'controlSize', 'disabled', 'indeterminate'] }
const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: { controls, docs: { controls } },
  args: {
    label: 'Email me product updates',
    name: 'updates',
    disabled: false,
    controlSize: 'medium',
    indeterminate: false
  },
  argTypes: {
    label: { control: 'text' },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] }
  }
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

export const Default: Story = {}

export const WithField: Story = {
  args: { label: 'Accept the terms', name: 'terms', 'aria-invalid': false },
  argTypes: { 'aria-invalid': { control: 'boolean' } },
  parameters: { controls: { include: [...controls.include, 'aria-invalid'] } },
  render: ({ label, disabled, 'aria-invalid': invalid, ...args }) => (
    <Field
      label={label}
      parts={{ label: { className: 'font-normal' } }}
      required
      disabled={disabled}
      error={invalid ? 'Accept the terms to continue.' : undefined}
    >
      <Checkbox {...args} />
    </Field>
  )
}

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', justifyItems: 'start', gap: '1rem' }}>
      <Checkbox
        label="Checked"
        defaultChecked
      />
      <Checkbox
        label="Mixed"
        indeterminate
      />
      <Checkbox
        label="Disabled"
        defaultChecked
        disabled
      />
    </div>
  )
}
