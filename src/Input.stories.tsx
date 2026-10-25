import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Input, type ThemeStyle } from './index.js'

function Controlled() {
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
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native input with value/onChange or defaultValue, form attributes and ref. Keep one owner per mount. size is native character width; controlSize selects shared small/medium/large visual metrics. Field owns its ID, required/error relationships and disabled inheritance. className/style/ref target the input, identified by data-slot="input".'
      }
    }
  }
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

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
      </div>
    )
  }
}

export const Customisation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A local component variable changes this input only; the selected global theme remains active.'
      }
    }
  },
  render: args => {
    const local: ThemeStyle = { '--rad-input-radius': '999px' }
    return (
      <Input
        {...args}
        style={local}
      />
    )
  }
}

export const WithField: Story = {
  render: args => (
    <Field
      description="Work address"
      label="Email"
      required
    >
      <Input {...args} />
    </Field>
  )
}

export const ControlledStory: Story = {
  name: 'Controlled',
  render: () => <Controlled />
}
