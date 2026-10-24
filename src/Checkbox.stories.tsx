import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Checkbox, Field, type ThemeStyle } from './index.js'

function NativeForm() {
  const [summary, setSummary] = useState('None selected')
  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        const selected = new FormData(event.currentTarget).getAll('channels')
        setSummary(selected.length > 0 ? selected.join(', ') : 'None selected')
      }}
      style={{ display: 'grid', justifyItems: 'start', gap: '0.75rem' }}
    >
      <Checkbox
        defaultChecked
        label="Email"
        name="channels"
        value="email"
      />
      <Checkbox
        label="SMS"
        name="channels"
        value="sms"
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button type="submit">Save</Button>
        <Button
          type="reset"
          variant="outline"
        >
          Reset
        </Button>
      </div>
      <p style={{ margin: 0 }}>{summary}</p>
    </form>
  )
}

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: {
    label: 'Email me product updates',
    name: 'email',
    disabled: false,
    indeterminate: false
  },
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    disabled: { control: 'boolean' },
    indeterminate: { control: 'boolean' }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native checkbox: defaultChecked initializes uncontrolled state; checked/onChange controls it. indeterminate sets a visual mixed DOM state, not a third submitted value. className/style/ref target the input (data-slot="checkbox"); label wraps the control and checkbox-label identifies its text. Field can supply the accessible name instead.'
      }
    }
  }
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Checkbox
        label="Checked"
        defaultChecked
        name="checked"
      />
      <Checkbox
        label="Mixed selection"
        defaultChecked
        indeterminate
        name="mixed"
      />
      <Checkbox
        label="Unavailable"
        disabled
        defaultChecked
        name="disabled"
      />
      <Field
        label="Required agreement"
        error="Accept the agreement."
        required
      >
        <Checkbox name="agreement" />
      </Field>
    </div>
  )
}

export const Composition: Story = { render: () => <NativeForm /> }

export const Customisation: Story = {
  render: args => {
    const local: ThemeStyle = {
      '--rad-checkbox-size': '1.5rem',
      '--rad-checkbox-radius': '0.25rem'
    }
    return (
      <div style={local}>
        <Checkbox {...args} />
      </div>
    )
  }
}

export const Group: Story = {
  render: () => (
    <Field
      description="Choose any"
      error="Pick at least one."
      label="Notifications"
      layout="group"
      required
    >
      <Checkbox
        label="Email"
        name="channels"
        value="email"
      />
      <Checkbox
        label="SMS"
        name="channels"
        value="sms"
      />
    </Field>
  )
}
