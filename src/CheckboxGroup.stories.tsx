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
  args: { label: 'Notifications', items, controlSize: 'medium' },
  argTypes: { controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] } },
  parameters: {
    docs: {
      description: {
        component:
          'A Field fieldset of native checkboxes. Values are string arrays; controlled owners receive requests, while uncontrolled inputs retain native reset and pre-hydration edits. required blocks native form submission until at least one enabled option is checked. The optional parent checkbox reports mixed state and toggles available options. Set name for native repeated form entries. Native refs, item attributes and checkbox presentation remain customizable.'
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
export const WithField: Story = {
  args: {
    label: 'Channels',
    description: 'Choose at least one channel.',
    error: 'Pick a channel.',
    required: true
  }
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
        label="Saved preferences"
        name="channels"
        items={items}
        value={value}
        onValueChange={setValue}
        selectAll={{ label: 'All channels' }}
        disabled={locked}
        required
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
export const Controlled: Story = { render: () => <Preferences /> }
export const SharedControlSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {(['small', 'medium', 'large'] as const).map(size => (
        <CheckboxGroup
          key={size}
          label={`${size} channels`}
          items={items}
          controlSize={size}
          defaultValue={['email']}
          selectAll={{ label: 'All channels' }}
        />
      ))}
    </div>
  )
}
export const SelectingAvailableChannels: Story = {
  render: () => (
    <CheckboxGroup
      label="Available channels"
      name="channels"
      items={[
        ...items,
        { value: 'managed', label: 'Managed by your organization', disabled: true }
      ]}
      defaultValue={['email', 'managed']}
      selectAll={{ label: 'Select all available' }}
      controlSize="small"
      style={{ width: '24rem', '--rad-checkbox-group-gap': '1rem' }}
      parts={{ label: { className: 'italic' } }}
    />
  )
}
