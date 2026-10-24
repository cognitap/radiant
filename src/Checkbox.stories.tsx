import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Checkbox } from './Checkbox'
import { Field } from './Field'
import { ThemeScope } from './ThemeScope'
import { radiant, themes } from './themes/index.js'

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
          'A native checkbox. Omit checked for an uncontrolled box; pass checked and onChange to control it. indeterminate is a visual mixed state and is not a submitted value.'
      }
    }
  },
  decorators: [
    (Story, { id }) =>
      id.endsWith('--themes') ? (
        <Story />
      ) : (
        <ThemeScope theme={radiant}>
          <Story />
        </ThemeScope>
      )
  ]
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Checked: Story = {
  args: { defaultChecked: true }
}

export const Mixed: Story = {
  args: { defaultChecked: true, indeterminate: true, label: 'Select all' }
}

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true }
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

export const NativeFormStory: Story = {
  name: 'Native form',
  render: () => <NativeForm />
}

const themeFrame = (): CSSProperties => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: '1.25rem'
})

export const Themes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {themes.map(theme => (
        <ThemeScope
          key={theme.id}
          theme={theme}
          style={{ ...themeFrame() }}
        >
          <span style={{ width: '8rem', font: '500 0.8125rem system-ui', opacity: 0.7 }}>
            {theme.name}
          </span>
          <Checkbox
            label="Off"
            name={`${theme.name}-off`}
          />
          <Checkbox
            defaultChecked
            label="On"
            name={`${theme.name}-on`}
          />
          <Checkbox
            defaultChecked
            indeterminate
            label="Mixed"
            name={`${theme.name}-mixed`}
          />
        </ThemeScope>
      ))}
    </div>
  )
}
