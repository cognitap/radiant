import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { checkDisabledIndicators } from '../.storybook/checkIndicators.js'
import { Button, Checkbox, Field, type ThemeStyle } from './index.js'

function NativeForm() {
  const [summary, setSummary] = useState('No changes saved.')
  return (
    <form
      onReset={() => setSummary('No changes saved.')}
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
      <output>{summary}</output>
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
    controlSize: 'medium',
    indeterminate: false
  },
  argTypes: {
    label: { control: 'text' },
    name: { control: 'text' },
    disabled: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native checkbox: choose defaultChecked or checked/onChange and keep one owner per mount. indeterminate is a visual DOM state, not a third submitted value. controlSize selects shared indicator/label metrics. className/style/native props/ref target the input (data-slot="checkbox"). parts.wrapper, parts.label and parts.indicator style the surrounding label or control span, label text and decorative marks. Field may supply the name and protected required/error relationships instead.'
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
    await expect(canvas.getByRole('status')).toHaveTextContent('sms')
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }))
    await expect(email).toBeChecked()
    await expect(sms).not.toBeChecked()
    await expect(canvas.getByRole('status')).toHaveTextContent('No changes saved.')
  }
}

export const Customisation: Story = {
  args: { defaultChecked: true },
  render: args => {
    const local: ThemeStyle = {
      '--rad-checkbox-size': '1.5rem',
      '--rad-checkbox-radius': '0.25rem'
    }
    return (
      <div style={{ display: 'grid', justifyItems: 'start', gap: '1rem' }}>
        <Checkbox
          {...args}
          style={local}
          parts={{
            wrapper: { className: 'gap-4' },
            label: { style: { fontStyle: 'italic' } },
            indicator: { className: 'scale-75' }
          }}
        />
        <Checkbox label="Unchanged neighbour" />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const customised = canvas.getByRole('checkbox', { name: 'Email me product updates' })
    const neighbour = canvas.getByRole('checkbox', { name: 'Unchanged neighbour' })
    await expect(customised.closest('label')).toHaveStyle({ gap: '16px' })
    await expect(canvas.getByText('Email me product updates')).toHaveStyle({ fontStyle: 'italic' })
    await expect(canvas.getByText('Unchanged neighbour')).toHaveStyle({ fontStyle: 'normal' })
    await expect(neighbour.style.getPropertyValue('--rad-checkbox-size')).toBe('')
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
