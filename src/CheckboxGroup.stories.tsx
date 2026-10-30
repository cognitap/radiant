import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckboxGroup, Button, type CheckboxGroupItem } from './index.js'
const items: CheckboxGroupItem[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'Text messages' },
  { value: 'push', label: 'Push notifications' }
]
const meta = {
  title: 'Components/CheckboxGroup',
  component: CheckboxGroup,
  args: { legend: 'Notifications', items },
  parameters: {
    docs: {
      description: {
        component:
          'Native checkboxes grouped by a real Fieldset. Values are string arrays; controlled owners receive requests, while uncontrolled inputs retain native reset and pre-hydration edits. The optional parent checkbox reports mixed state and toggles available options. Set name for native repeated form entries; applications own validation and persistence. Native refs, item attributes and checkbox presentation remain customizable.'
      }
    }
  }
} satisfies Meta<typeof CheckboxGroup>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: ({ value: _value, defaultValue: _default, onValueChange: _change, ...args }) => (
    <CheckboxGroup
      {...args}
      defaultValue={['email']}
      style={{ width: '24rem' }}
      description="Choose how we contact you."
    />
  )
}
export const SelectingAvailableChannels: Story = {
  render: () => (
    <CheckboxGroup
      legend="Available channels"
      name="channels"
      items={[
        ...items,
        { value: 'managed', label: 'Managed by your organization', disabled: true }
      ]}
      defaultValue={['email', 'managed']}
      selectAll={{ label: 'Select all available' }}
      controlSize="small"
      style={{ width: '24rem', '--rad-checkbox-group-gap': '1rem' }}
      parts={{ legend: { className: 'italic' } }}
    />
  )
}
function Preferences() {
  const [value, setValue] = useState<string[]>(['email']),
    [locked, setLocked] = useState(false),
    [saved, setSaved] = useState('')
  return (
    <form
      style={{ display: 'grid', gap: '1rem', width: '24rem', maxWidth: '100%' }}
      onReset={() => {
        setValue(['email'])
        setSaved('')
      }}
      onSubmit={event => {
        event.preventDefault()
        setSaved(new FormData(event.currentTarget).getAll('channels').join(', '))
      }}
    >
      <CheckboxGroup
        legend="Saved preferences"
        name="channels"
        items={items}
        value={value}
        onValueChange={setValue}
        selectAll={{ label: 'All channels' }}
        disabled={locked}
        error={value.length === 0 ? 'Choose at least one channel.' : undefined}
      />
      <Button type="submit">Save preferences</Button>
      <Button
        type="reset"
        variant="ghost"
      >
        Reset
      </Button>
      <Button
        variant="outline"
        onClick={() => setLocked(!locked)}
      >
        {locked ? 'Unlock' : 'Lock'} preferences
      </Button>
      <output aria-label="Saved channels">{saved}</output>
    </form>
  )
}
export const SavingPreferences: Story = { render: () => <Preferences /> }
