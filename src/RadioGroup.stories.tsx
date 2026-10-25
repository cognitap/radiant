import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { checkDisabledIndicators } from '../.storybook/checkIndicators.js'
import { Button, Radio, RadioGroup, type ThemeStyle } from './index.js'

function NativeForm() {
  const [summary, setSummary] = useState('pro')
  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        const selected = new FormData(event.currentTarget).get('plan')
        setSummary(typeof selected === 'string' ? selected : 'None selected')
      }}
      style={{ display: 'grid', justifyItems: 'start', gap: '0.75rem' }}
    >
      <RadioGroup
        defaultValue="pro"
        description="Billed monthly"
        label="Plan"
        name="plan"
      >
        <Radio
          label="Free"
          value="free"
        />
        <Radio
          label="Pro"
          value="pro"
        />
        <Radio
          disabled
          label="Retired"
          value="retired"
        />
        <Radio
          label="Team"
          value="team"
        />
      </RadioGroup>
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
  title: 'Components/RadioGroup',
  component: RadioGroup,
  args: {
    label: 'Plan',
    name: 'plan',
    controlSize: 'medium'
  },
  argTypes: { controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] } },
  parameters: {
    docs: {
      description: {
        component:
          'A Field fieldset of native radios. The group owns name and selection: choose an initial defaultValue or controlled value, with null for no selection and an empty string for a real empty-valued option. Conflicting option ownership is rejected. controlSize supplies shared option metrics. Group className/style/native props/ref reach the fieldset (data-slot="field radio-group"); parts.options styles radio-group-options. Radio props/ref reach its input; parts.wrapper, parts.label and parts.indicator style its surrounding label or control span, label text and decorative dot.'
      }
    }
  }
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultValue: 'pro' },
  render: args => (
    <form onSubmit={event => event.preventDefault()}>
      <RadioGroup {...args}>
        <Radio
          label="Free"
          value="free"
        />
        <Radio
          label="Pro"
          value="pro"
        />
        <Radio
          label="Team"
          value="team"
        />
      </RadioGroup>
    </form>
  )
}

export const States: Story = {
  play: async ({ canvasElement }) => checkDisabledIndicators(canvasElement, 'radio'),
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <RadioGroup
        label="One unavailable option"
        name="disabled-choice"
        defaultValue="free"
      >
        <Radio
          label="Free"
          value="free"
        />
        <Radio
          label="Retired"
          value="retired"
          disabled
        />
        <Radio
          label="Team"
          value="team"
        />
      </RadioGroup>
      <RadioGroup
        label="Unavailable group"
        name="disabled-group"
        defaultValue="pro"
        disabled
      >
        <Radio
          label="Free"
          value="free"
        />
        <Radio
          label="Pro"
          value="pro"
        />
      </RadioGroup>
      <RadioGroup
        label="Required plan"
        name="invalid-plan"
        error="Pick a plan."
        required
      >
        <Radio
          label="Free"
          value="free"
        />
        <Radio
          label="Pro"
          value="pro"
        />
      </RadioGroup>
    </div>
  )
}

export const Composition: Story = {
  render: () => <NativeForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const pro = canvas.getByRole('radio', { name: 'Pro' })
    const team = canvas.getByRole('radio', { name: 'Team' })
    const retired = canvas.getByRole('radio', { name: 'Retired' })
    await expect(pro).toBeChecked()
    await expect(retired).toBeDisabled()
    await userEvent.click(pro)
    await userEvent.keyboard('{ArrowDown}')
    await expect(team).toBeChecked()
    await expect(team).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(canvas.getByText('team', { exact: true })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }))
    await expect(pro).toBeChecked()
    await expect(team).not.toBeChecked()
  }
}

export const Customisation: Story = {
  args: { name: 'custom-plan', defaultValue: 'pro' },
  render: args => {
    const local: ThemeStyle = { '--rad-radio-group-gap': '1rem', '--rad-radio-size': '1.5rem' }
    return (
      <div style={{ display: 'grid', justifyItems: 'start', gap: '1rem' }}>
        <RadioGroup
          {...args}
          style={local}
          parts={{
            label: { style: { fontStyle: 'italic' } },
            options: { className: 'flex gap-4' }
          }}
        >
          <Radio
            label="Free"
            value="free"
          />
          <Radio
            label="Pro"
            value="pro"
            parts={{
              label: { style: { fontWeight: 700 } },
              indicator: { style: { inset: '25%' } }
            }}
          />
        </RadioGroup>
        <Radio
          label="Unchanged neighbour"
          name="neighbour"
          value="unchanged"
        />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const group = canvas.getByRole('group', { name: 'Plan' })
    await expect(group).toHaveAttribute('data-slot', 'field radio-group')
    await expect(group.querySelector('[data-slot~="radio-group-options"]')).toHaveStyle({
      display: 'flex',
      gap: '16px'
    })
    await expect(group.querySelector('legend')).toHaveStyle({ fontStyle: 'italic' })
    await expect(canvas.getByText('Pro')).toHaveStyle({ fontWeight: '700' })
    const indicator = group.querySelector<HTMLElement>(
      'input:checked + [data-slot~="radio-indicator"]'
    )!
    await expect(indicator.getBoundingClientRect().width).toBeGreaterThan(0)
    await expect(canvas.getByText('Unchanged neighbour')).toHaveStyle({ fontStyle: 'normal' })
  }
}
