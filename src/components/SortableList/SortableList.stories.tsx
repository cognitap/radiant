import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Field, SortableList, SortableListItem, Stack } from '../../index.js'
import { MotionProvider } from '../../motion/react.js'

const tasks = [
  { value: 'invoice', label: 'Send the March invoice' },
  { value: 'review', label: 'Review the design proposal' },
  { value: 'backup', label: 'Check last night’s backup' },
  { value: 'call', label: 'Call the venue about catering' }
]

const meta = {
  title: 'Components/SortableList',
  component: SortableList,
  args: {
    'aria-label': 'Priorities',
    instructionsText:
      'Press Space or Enter to pick up. Use the arrow keys to move, Space or Enter to drop, Escape to cancel.',
    pickUpText: (item: string, index: number, count: number) =>
      `Picked up ${item}. Position ${index + 1} of ${count}.`,
    moveText: (item: string, index: number, count: number) =>
      `${item}, position ${index + 1} of ${count}.`,
    dropText: (item: string, index: number, count: number) =>
      `Dropped ${item} at position ${index + 1} of ${count}.`,
    cancelText: (item: string, index: number, count: number) =>
      `Cancelled. ${item} is back at position ${index + 1} of ${count}.`,
    gap: 'tight',
    controlSize: 'medium'
  },
  argTypes: {
    gap: { control: 'inline-radio', options: ['tight', 'normal', 'airy'] },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] }
  },
  parameters: {
    docs: {
      description: {
        component:
          'An ordered list reordered by dragging a handle or with the keyboard: Space or Enter picks an item up and drops it, the arrow keys, Home and End move it, and Escape cancels. The app writes every announcement. The value is the item values in order and submits as one named value per item.'
      }
    }
  }
} satisfies Meta<typeof SortableList>

export default meta
type Story = StoryObj<typeof meta>

const items = tasks.map(task => (
  <SortableListItem
    key={task.value}
    value={task.value}
  >
    {task.label}
  </SortableListItem>
))

export const Default: Story = {
  render: args => (
    <div style={{ width: '360px', maxWidth: '100%' }}>
      <SortableList {...args}>{items}</SortableList>
    </div>
  )
}

export const WithField: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Inside a group `Field`, the legend names the list and the description stays on it.'
      }
    }
  },
  render: ({ 'aria-label': _label, ...args }) => (
    <div style={{ width: '360px', maxWidth: '100%' }}>
      <Field
        layout="group"
        label="Weekly priorities"
        description="Most important first."
      >
        <SortableList {...args}>{items}</SortableList>
      </Field>
    </div>
  )
}

export const Widths: Story = {
  parameters: {
    docs: { description: { story: 'The same list in a 360px and a 720px column.' } }
  },
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {['360px', '720px'].map(width => (
        <div
          key={width}
          style={{ width, maxWidth: '100%' }}
        >
          <SortableList
            {...args}
            aria-label={`Priorities at ${width}`}
          >
            {items}
          </SortableList>
        </div>
      ))}
    </div>
  )
}

export const SharedControlSizes: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem', width: '360px', maxWidth: '100%' }}>
      {(['small', 'medium', 'large'] as const).map(size => (
        <SortableList
          key={size}
          {...args}
          aria-label={`Playlist, ${size}`}
          controlSize={size}
        >
          <SortableListItem value="intro">Intro</SortableListItem>
          <SortableListItem value="theme">Main theme</SortableListItem>
        </SortableList>
      ))}
    </div>
  )
}

function ControlledList(args: Story['args']) {
  const [value, setValue] = useState(['backup', 'call', 'invoice', 'review'])
  return (
    <Stack gap="tight">
      <SortableList
        {...(args as typeof meta.args)}
        value={value}
        onValueChange={setValue}
      >
        {items}
      </SortableList>
      <p style={{ margin: 0 }}>Order: {value.join(', ')}</p>
    </Stack>
  )
}

export const Controlled: Story = {
  render: args => (
    <div style={{ width: '360px', maxWidth: '100%' }}>
      <ControlledList {...args} />
    </div>
  )
}

export const WithMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Inside `MotionProvider`, items spring to their new places. Reduced motion and a theme with motion off snap them.'
      }
    }
  },
  render: args => (
    <MotionProvider>
      <div style={{ width: '360px', maxWidth: '100%' }}>
        <SortableList {...args}>{items}</SortableList>
      </div>
    </MotionProvider>
  )
}

function FormList(args: Story['args']) {
  const [submitted, setSubmitted] = useState<string[]>([])
  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        setSubmitted(new FormData(event.currentTarget).getAll('settings').map(String))
      }}
    >
      <Stack gap="tight">
        <SortableList
          {...(args as typeof meta.args)}
          aria-label="Search sources, first is searched first"
          name="settings"
        >
          <SortableListItem value="local">This device</SortableListItem>
          <SortableListItem value="team">Team drive</SortableListItem>
          <SortableListItem value="web">The web</SortableListItem>
        </SortableList>
        <Button type="submit">Save order</Button>
        <output>{submitted.join(', ')}</output>
      </Stack>
    </form>
  )
}

export const InForm: Story = {
  parameters: {
    docs: { description: { story: 'Submits one `settings` value per item, in order.' } }
  },
  render: args => (
    <div style={{ width: '360px', maxWidth: '100%' }}>
      <FormList {...args} />
    </div>
  )
}

export const Disabled: Story = {
  args: { disabled: true },
  render: args => (
    <div style={{ width: '360px', maxWidth: '100%' }}>
      <SortableList {...args}>{items}</SortableList>
    </div>
  )
}
