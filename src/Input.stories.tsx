import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Field, Input, type ThemeStyle } from './index.js'

function NativeForm() {
  const [error, setError] = useState<string | undefined>()
  return (
    <form
      onReset={() => setError(undefined)}
      onSubmit={event => {
        event.preventDefault()
        const email = new FormData(event.currentTarget).get('email')
        setError(typeof email === 'string' && email.trim() ? undefined : 'Enter an email.')
      }}
      style={{ display: 'grid', gap: '0.75rem', maxWidth: '20rem' }}
    >
      <Field
        description="Work address"
        error={error}
        label="Email"
        required
      >
        <Input
          autoComplete="email"
          defaultValue="ada@example.com"
          name="email"
          type="email"
        />
      </Field>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button type="submit">Save</Button>
        <Button
          type="reset"
          variant="outline"
          tone="neutral"
        >
          Reset
        </Button>
      </div>
    </form>
  )
}

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
    'aria-label': 'Email'
  },
  argTypes: {
    name: { control: 'text' },
    type: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native `<input>` with native value/onChange, defaultValue, size (character width), form attributes and ref. Field supplies label, description, required and invalid relationships. className/style/ref target the input, identified by data-slot="input". Visual dimensions use shared control tokens rather than native size.'
      }
    }
  }
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: args => (
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
          {...args}
          aria-label={undefined}
          disabled
          defaultValue="ada@example.com"
        />
      </Field>
    </div>
  )
}

export const Composition: Story = { render: () => <NativeForm /> }

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
