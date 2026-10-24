import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
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
    name: 'plan'
  },
  parameters: {
    docs: {
      description: {
        component:
          'A Field fieldset of native radios: the group owns name and selection, and Radio supplies value and label. The disk stays circular. Group className/style reach the outer Field; data-slot="radio-group" identifies the inner options container. Radio className/style/ref target its input (data-slot="radio"); radio-label identifies its text.'
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

export const Composition: Story = { render: () => <NativeForm /> }

export const Customisation: Story = {
  args: { name: 'custom-plan' },
  render: args => {
    const local: ThemeStyle = { '--rad-radio-group-gap': '1rem', '--rad-radio-size': '1.5rem' }
    return (
      <RadioGroup
        {...args}
        style={local}
        defaultValue="pro"
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
    )
  }
}
