import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
  DragAndDrop,
  DragAndDropContainer,
  DragAndDropItem,
  Field,
  Stack,
  type DragAndDropMove,
  type DragAndDropValue
} from '../../index.js'
import { MotionProvider } from '../../motion/react.js'

const tasks = [
  { value: 'invoice', label: 'Send the March invoice' },
  { value: 'review', label: 'Review the design proposal' },
  { value: 'backup', label: 'Check last night’s backup' },
  { value: 'call', label: 'Call the venue about catering' }
]
const start: DragAndDropValue = {
  todo: ['invoice', 'review'],
  doing: ['backup'],
  done: ['call']
}

const meta = {
  title: 'Components/DragAndDrop',
  component: DragAndDrop,
  args: {
    'aria-label': 'Task board',
    defaultValue: start,
    instructionsText:
      'Press Space or Enter to pick up. Left and Right move to another list, Up and Down within it. Space or Enter drops, Escape cancels.',
    pickUpText: (move: DragAndDropMove) => `Picked up ${move.item} in ${move.from}.`,
    moveText: (move: DragAndDropMove) =>
      `${move.item}, ${move.to}, position ${move.index + 1} of ${move.count}.`,
    dropText: (move: DragAndDropMove) =>
      `Moved ${move.item} from ${move.from} to ${move.to}, position ${move.index + 1} of ${move.count}.`,
    cancelText: (move: DragAndDropMove) => `Cancelled. ${move.item} is back in ${move.to}.`,
    fullText: (move: DragAndDropMove) => `${move.to} holds two tasks at most.`,
    gap: 'normal',
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
          'Named containers whose items move by dragging a handle, by tapping a handle and then a container, or with the keyboard: Space or Enter picks up and drops, Left and Right change container in container order, even when stacked (mirrored in right-to-left text), Up, Down, Home and End move within one, and Escape cancels. A container with `capacity` refuses more items and says why. The app writes every announcement. The value maps each container to its items and submits as one JSON value.'
      }
    }
  }
} satisfies Meta<typeof DragAndDrop>

export default meta
type Story = StoryObj<typeof meta>

const board = [
  <DragAndDropContainer
    key="todo"
    value="todo"
    label="To do"
  />,
  <DragAndDropContainer
    key="doing"
    value="doing"
    label="Doing"
    capacity={2}
  />,
  <DragAndDropContainer
    key="done"
    value="done"
    label="Done"
  />,
  ...tasks.map(task => (
    <DragAndDropItem
      key={task.value}
      value={task.value}
    >
      {task.label}
    </DragAndDropItem>
  ))
]

export const Default: Story = {
  render: args => (
    <div style={{ width: '720px', maxWidth: '100%' }}>
      <DragAndDrop {...args}>{board}</DragAndDrop>
    </div>
  )
}

export const WithField: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Inside a group `Field`, the legend names the board and the description stays on it.'
      }
    }
  },
  render: ({ 'aria-label': _label, ...args }) => (
    <div style={{ width: '720px', maxWidth: '100%' }}>
      <Field
        layout="group"
        label="This week"
        description="Doing holds two tasks at most."
      >
        <DragAndDrop {...args}>{board}</DragAndDrop>
      </Field>
    </div>
  )
}

export const Widths: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Containers stack in a 360px column and sit side by side as the container widens.'
      }
    }
  },
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {['360px', '720px'].map(width => (
        <div
          key={width}
          style={{ width, maxWidth: '100%' }}
        >
          <DragAndDrop
            {...args}
            aria-label={`Task board at ${width}`}
          >
            {board}
          </DragAndDrop>
        </div>
      ))}
    </div>
  )
}

export const SharedControlSizes: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem', width: '360px', maxWidth: '100%' }}>
      {(['small', 'medium', 'large'] as const).map(size => (
        <DragAndDrop
          key={size}
          {...(args as typeof meta.args)}
          aria-label={`Folders, ${size}`}
          defaultValue={{ inbox: ['notes'], archive: [] }}
          controlSize={size}
        >
          <DragAndDropContainer
            value="inbox"
            label="Inbox"
          />
          <DragAndDropContainer
            value="archive"
            label="Archive"
          />
          <DragAndDropItem value="notes">Notes.txt</DragAndDropItem>
        </DragAndDrop>
      ))}
    </div>
  )
}

function ControlledBoard(args: Story['args']) {
  const [value, setValue] = useState(start)
  return (
    <Stack gap="tight">
      <DragAndDrop
        {...(args as typeof meta.args)}
        defaultValue={undefined}
        value={value}
        onValueChange={setValue}
      >
        {board}
      </DragAndDrop>
      <p style={{ margin: 0 }}>
        {Object.entries(value)
          .map(([list, items]) => `${list}: ${items.join(', ') || 'empty'}`)
          .join('; ')}
      </p>
    </Stack>
  )
}

export const Controlled: Story = {
  render: args => (
    <div style={{ width: '720px', maxWidth: '100%' }}>
      <ControlledBoard {...args} />
    </div>
  )
}

export const WithMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Inside `MotionProvider`, items spring to their new places and a dropped item glides from the pointer. Reduced motion and a theme with motion off snap them.'
      }
    }
  },
  render: args => (
    <MotionProvider>
      <div style={{ width: '720px', maxWidth: '100%' }}>
        <DragAndDrop {...args}>{board}</DragAndDrop>
      </div>
    </MotionProvider>
  )
}

function FormBoard(args: Story['args']) {
  const [submitted, setSubmitted] = useState('')
  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        setSubmitted(String(new FormData(event.currentTarget).get('folders')))
      }}
    >
      <Stack gap="tight">
        <DragAndDrop
          {...(args as typeof meta.args)}
          aria-label="Sort files into folders"
          name="folders"
          defaultValue={{ unsorted: ['invoice', 'photo', 'notes'], work: [], home: [] }}
        >
          <DragAndDropContainer
            value="unsorted"
            label="Unsorted"
          />
          <DragAndDropContainer
            value="work"
            label="Work"
          />
          <DragAndDropContainer
            value="home"
            label="Home"
          />
          <DragAndDropItem value="invoice">Invoice.pdf</DragAndDropItem>
          <DragAndDropItem value="photo">Beach.jpg</DragAndDropItem>
          <DragAndDropItem value="notes">Notes.txt</DragAndDropItem>
        </DragAndDrop>
        <Button type="submit">Save folders</Button>
        <output>{submitted}</output>
      </Stack>
    </form>
  )
}

export const InForm: Story = {
  parameters: {
    docs: { description: { story: 'Submits `folders` as one JSON object of folder contents.' } }
  },
  render: args => (
    <div style={{ width: '720px', maxWidth: '100%' }}>
      <FormBoard {...args} />
    </div>
  )
}

export const RightToLeft: Story = {
  parameters: {
    docs: {
      description: {
        story: 'In right-to-left text, containers run from the right and Left moves on.'
      }
    }
  },
  render: args => (
    <div
      dir="rtl"
      style={{ width: '720px', maxWidth: '100%' }}
    >
      <DragAndDrop {...args}>{board}</DragAndDrop>
    </div>
  )
}

export const Disabled: Story = {
  args: { disabled: true },
  render: args => (
    <div style={{ width: '720px', maxWidth: '100%' }}>
      <DragAndDrop {...args}>{board}</DragAndDrop>
    </div>
  )
}
