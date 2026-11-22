import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input, Reveal } from '../../index.js'

const steps = [
  { value: 'mix', children: 'Mix flour, water and salt.' },
  { value: 'rest', children: 'Rest the dough for an hour.' },
  { value: 'bake', children: 'Bake for 40 minutes.' }
]

const meta = {
  title: 'Components/Reveal',
  component: Reveal,
  args: {
    items: steps,
    previousLabel: 'Previous',
    nextLabel: 'Next',
    positionLabel: (index: number, count: number) => `Step ${index + 1} of ${count}`,
    gap: 'normal'
  },
  argTypes: { gap: { control: 'inline-radio', options: ['tight', 'normal', 'airy'] } },
  parameters: {
    docs: {
      description: {
        component:
          'A div that shows one of `items` at a time with previous and next buttons and a position text the app writes. Hidden steps stay mounted, so their state survives. The position is announced politely; when a button disables itself at either end, focus moves to the other one.'
      }
    }
  }
} satisfies Meta<typeof Reveal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: args => (
    <div style={{ width: '360px', maxWidth: '100%' }}>
      <Reveal {...args} />
    </div>
  )
}

export const Widths: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {['360px', '720px'].map(width => (
        <div
          key={width}
          style={{ width, maxWidth: '100%' }}
        >
          <Reveal {...args} />
        </div>
      ))}
    </div>
  )
}

export const AutoPlay: Story = {
  args: { playback: true, playLabel: 'Play steps', pauseLabel: 'Pause steps', interval: 4000 },
  parameters: {
    docs: {
      description: {
        story:
          'Play moves through the steps on a timer until the last one. Playback waits while the pointer or focus is inside, and is not offered under reduced motion.'
      }
    }
  },
  render: args => (
    <div style={{ width: '360px', maxWidth: '100%' }}>
      <Reveal {...args} />
    </div>
  )
}

function ControlledReveal() {
  const [value, setValue] = useState('name')
  return (
    <div style={{ width: '360px', maxWidth: '100%' }}>
      <Reveal
        value={value}
        onValueChange={setValue}
        previousLabel="Back"
        nextLabel="Continue"
        positionLabel={(index, count) => `${index + 1} / ${count}`}
        items={[
          { value: 'name', children: <Input aria-label="Name" /> },
          { value: 'city', children: <Input aria-label="City" /> }
        ]}
      />
    </div>
  )
}

export const Controlled: Story = {
  parameters: {
    docs: { description: { story: 'Typed text survives moving between steps.' } }
  },
  render: () => <ControlledReveal />
}
