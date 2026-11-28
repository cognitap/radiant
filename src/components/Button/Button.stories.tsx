import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bookmark } from 'lucide-react'
import { fn } from 'storybook/test'
import { Button, type ButtonProps } from './Button.js'
import { MotionProvider } from '../../motion/react.js'

type StoryArgs = Pick<
  ButtonProps,
  | 'children'
  | 'controlSize'
  | 'disabled'
  | 'fullWidth'
  | 'motion'
  | 'onClick'
  | 'pending'
  | 'tone'
  | 'variant'
>

const controls = {
  include: [
    'children',
    'variant',
    'tone',
    'controlSize',
    'fullWidth',
    'disabled',
    'pending',
    'motion'
  ]
}

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Continue', disabled: false, fullWidth: false, pending: false },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'inline-radio', options: ['solid', 'soft', 'outline', 'ghost'] },
    tone: { control: 'inline-radio', options: ['accent', 'neutral', 'warning', 'danger'] },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    fullWidth: { control: 'boolean' },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] }
  },
  parameters: { controls, docs: { controls } },
  decorators: [
    Story => (
      <MotionProvider>
        <Story />
      </MotionProvider>
    )
  ]
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {
  args: { onClick: fn() },
  render: args => (
    <div
      style={{
        width: 'min(20rem, calc(100vw - 2rem))',
        maxWidth: '100%',
        display: 'grid',
        justifyItems: 'center'
      }}
    >
      <Button {...args} />
    </div>
  )
}

export const Pressed: Story = {
  args: { variant: 'outline', fullWidth: false },
  parameters: { controls: { exclude: ['children', 'fullWidth'] } },
  render: args => (
    <Button
      {...args}
      iconOnly
      aria-label="Bookmark"
      defaultPressed={false}
    >
      <Bookmark aria-hidden="true" />
    </Button>
  )
}

function SubmitButton({ pending, ...args }: StoryArgs) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  useEffect(() => {
    if (status !== 'saving') return
    const timer = setTimeout(() => setStatus('saved'), 900)
    return () => clearTimeout(timer)
  }, [status])
  return (
    <form
      style={{ display: 'grid', justifyItems: 'start', gap: '0.5rem', maxWidth: '100%' }}
      onSubmit={event => {
        event.preventDefault()
        setStatus('saving')
      }}
    >
      <Button
        {...args}
        type="submit"
        pending={pending || status === 'saving'}
      />
      <output style={{ minBlockSize: '1lh' }}>
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved.' : ''}
      </output>
    </form>
  )
}

export const SavingWorkspace: Story = {
  name: 'Submit and pending',
  args: { children: 'Save changes' },
  parameters: { controls: { exclude: ['fullWidth'] } },
  render: args => <SubmitButton {...args} />
}
