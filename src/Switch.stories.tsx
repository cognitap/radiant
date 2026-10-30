import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Switch, type ThemeStyle } from './index.js'
import {
  SwitchSettingsExample,
  SwitchSizeComparison
} from '../.storybook/examples/SwitchExamples.js'

function ControlledSwitch() {
  const [checked, setChecked] = useState(false)
  return (
    <div style={{ display: 'grid', justifyItems: 'start', gap: '0.75rem' }}>
      <Switch
        label="Do not disturb"
        name="quiet"
        checked={checked}
        onChange={event => setChecked(event.target.checked)}
      />
      <output>{checked ? 'Notifications are silenced.' : 'Notifications are on.'}</output>
    </div>
  )
}

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: {
    label: 'Desktop notifications',
    name: 'notifications',
    disabled: false,
    controlSize: 'medium'
  },
  argTypes: { controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] } },
  parameters: {
    docs: {
      description: {
        component:
          'An on/off setting with a stable label. It uses a native checkbox with a fixed switch role: Space, checked state, change/blur, forms, required validation and reset stay native. Choose defaultChecked or checked/onChange and keep one owner per mount. Use Checkbox for checklist choices or mixed selection. className/style/native props/ref target the input; parts.wrapper, parts.label and parts.indicator style the surrounding row, label and decorative thumb. Field supplies its protected ID, help, error and required/disabled relationships. There is no mixed state or readOnly prop.'
      }
    }
  }
} satisfies Meta<typeof Switch>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Switch label="Notifications off" />
      <Switch
        label="Notifications on"
        defaultChecked
      />
      <Switch
        label="Unavailable, off"
        disabled
      />
      <Switch
        label="Unavailable, on"
        defaultChecked
        disabled
      />
      <Switch
        label="Invalid setting"
        aria-invalid
      />
    </div>
  )
}
export const WithField: Story = {
  render: () => (
    <Field
      label="Automatic backups"
      description="Keep a copy of your workspace."
      required
      error="Enable backups to continue."
    >
      <Switch
        name="backups"
        value="enabled"
      />
    </Field>
  )
}
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ControlledSwitch />
}
export const FormSubmission: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SwitchSettingsExample />
}
export const Group: Story = {
  render: () => (
    <Field
      layout="group"
      label="Notifications"
      description="Turn each notification channel on or off."
    >
      <Switch
        label="Email notifications"
        name="email"
        defaultChecked
      />
      <Switch
        label="Desktop notifications"
        name="desktop"
      />
    </Field>
  )
}
export const SharedControlSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SwitchSizeComparison />
}
export const Customisation: Story = {
  render: args => {
    const local: ThemeStyle = {
      '--rad-switch-width': '3.5rem',
      '--rad-switch-height': '1.75rem',
      '--rad-switch-radius': '999px'
    }
    return (
      <Switch
        {...args}
        style={local}
        parts={{
          wrapper: { className: 'gap-4' },
          label: { style: { fontStyle: 'italic' } },
          indicator: { className: 'rounded-full', style: { boxShadow: '0 1px 3px #0004' } }
        }}
      />
    )
  }
}
export const RightToLeft: Story = {
  render: () => (
    <div
      dir="rtl"
      style={{ display: 'grid', gap: '1rem', width: '18rem', maxWidth: '100%' }}
    >
      <Switch label="الإشعارات" />
      <Switch
        label="النسخ الاحتياطي"
        defaultChecked
      />
    </div>
  )
}
