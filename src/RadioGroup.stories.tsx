import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Radio, RadioGroup } from './RadioGroup'
import { radiantTheme, themes } from './themes/index.js'

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
          'A fieldset of native radios. The group owns the shared name and the selected value. Arrow keys move the selection. The disk stays a circle.'
      }
    }
  },
  decorators: [
    (Story, { id }) =>
      id.endsWith('--themes') ? (
        <Story />
      ) : (
        <div style={radiantTheme}>
          <Story />
        </div>
      )
  ]
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultValue: 'pro' },
  render: args => (
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
  )
}

export const DisabledChoice: Story = {
  args: { defaultValue: 'free' },
  render: args => (
    <RadioGroup {...args}>
      <Radio
        label="Free"
        value="free"
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
  )
}

export const DisabledGroup: Story = {
  args: { defaultValue: 'pro', disabled: true },
  render: args => (
    <RadioGroup {...args}>
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

export const Invalid: Story = {
  args: { error: 'Pick a plan.', required: true },
  render: args => (
    <RadioGroup {...args}>
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

export const NativeFormStory: Story = {
  name: 'Native form',
  args: { label: 'Plan', name: 'plan' },
  render: () => <NativeForm />
}

const themeFrame = (surface: string | undefined): CSSProperties => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: '1.25rem',
  background: surface ?? 'oklch(0.985 0.003 250)'
})

export const Themes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {themes.map(theme => (
        <div
          key={theme.name}
          style={{ ...theme.style, ...themeFrame(theme.surface) }}
        >
          <RadioGroup
            defaultValue="on"
            label={theme.name}
            name={theme.name}
          >
            <Radio
              label="Off"
              value="off"
            />
            <Radio
              label="On"
              value="on"
            />
          </RadioGroup>
        </div>
      ))}
    </div>
  )
}
