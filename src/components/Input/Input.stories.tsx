import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Input } from '../../index.js'

function ControlledDisplayName() {
  const [value, setValue] = useState('Hello')
  return (
    <Field
      description={`${value.length} characters`}
      label="Display name"
    >
      <Input
        value={value}
        onChange={event => setValue(event.target.value)}
      />
    </Field>
  )
}

const meta = {
  title: 'Components/Input',
  component: Input,
  args: {
    name: 'email',
    type: 'email',
    placeholder: 'you@example.com',
    autoComplete: 'email',
    disabled: false,
    controlSize: 'medium',
    'aria-label': 'Email'
  },
  argTypes: {
    name: { control: 'text' },
    type: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] }
  }
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithField: Story = {
  render: args => (
    <Field
      description="Work address"
      label="Work email"
      required
    >
      <Input
        {...args}
        aria-label={undefined}
      />
    </Field>
  )
}

export const Controlled: Story = {
  render: () => <ControlledDisplayName />
}

export const States: Story = {
  render: args => {
    const { value: _value, defaultValue: _defaultValue, ...lockedProps } = args
    return (
      <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '24rem' }}>
        <Field
          label="Email with error"
          error="Enter an email."
          required
        >
          <Input
            {...args}
            aria-label={undefined}
          />
        </Field>
        <Field label="Locked email">
          <Input
            {...lockedProps}
            aria-label={undefined}
            disabled
            defaultValue="ada@example.com"
          />
        </Field>
        <Field
          label="Read-only email"
          description="Focusable and submitted with the form, but not editable."
        >
          <Input
            {...lockedProps}
            aria-label={undefined}
            readOnly
            defaultValue="ada@example.com"
          />
        </Field>
      </div>
    )
  }
}
