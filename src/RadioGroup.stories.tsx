import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { RadioPlanExample, RadioStatePlayground } from '../.storybook/examples/RadioExamples.js'
import { Button, Radio, RadioGroup, type ThemeStyle } from './index.js'
import { themes } from './examples/index.js'

function NativeForm() {
  const [summary, setSummary] = useState('No changes saved.')
  return (
    <form
      onReset={() => setSummary('No changes saved.')}
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
      <output>{summary}</output>
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
  render: () => <NativeForm />
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
  }
}

export const PlanPicker: Story = {
  render: (args, { globals }) => (
    <RadioPlanExample
      controlSize={args.controlSize}
      theme={themes.find(theme => theme.id === globals.theme)}
      mode={globals.mode === 'light' || globals.mode === 'dark' ? globals.mode : 'system'}
    />
  )
}

export const IndicatorPlayground: Story = {
  render: args => <RadioStatePlayground controlSize={args.controlSize} />
}
