import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { checkDisabledIndicators } from '../.storybook/checkIndicators.js'
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
          tone="neutral"
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
  play: async ({ canvasElement }) => checkDisabledIndicators(canvasElement, 'checkbox'),
  parameters: {
    docs: {
      description: {
        story:
          'Checked, mixed, disabled, and explicitly invalid checkbox states. aria-invalid reflects consumer-owned validation; Group shows Field descriptions, errors, and required relationships.'
      }
    }
  },
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
      <Checkbox
        label="Invalid"
        name="invalid"
        aria-invalid
      />
    </div>
  )
}

export const Composition: Story = {
  render: () => <NativeForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const email = canvas.getByRole('checkbox', { name: 'Email' })
    const sms = canvas.getByRole('checkbox', { name: 'SMS' })
    await expect(email).toBeChecked()
    await expect(sms).not.toBeChecked()
    await userEvent.click(email)
    await userEvent.tab()
    await expect(sms).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(sms).toBeChecked()
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(canvas.getByText('sms', { exact: true })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }))
    await expect(email).toBeChecked()
    await expect(sms).not.toBeChecked()
  }
}

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
