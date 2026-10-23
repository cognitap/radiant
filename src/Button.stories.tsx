import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Button } from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Continue',
    disabled: false,
    onClick: fn()
  },
  argTypes: {
    children: { control: 'text' },
    disabled: { control: 'boolean' },
    pending: { control: 'boolean' }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native button with a press and a pending wait. It adds pending, and nothing else.'
      }
    }
  }
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Disabled: Story = {
  args: { disabled: true }
}

export const Pending: Story = {
  args: { pending: true }
}

export const CustomClasses: Story = {
  args: { className: 'rounded-full px-8 hover:bg-red-500' }
}

export const IconOnly: Story = {
  args: { 'aria-label': 'Close' },
  render: args => (
    <Button {...args}>
      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </Button>
  )
}

export const ThemedSubtree: Story = {
  render: args => (
    <div
      style={
        {
          '--color-primary': '#1d4ed8',
          '--color-primary-hover': '#1e40af',
          '--color-primary-active': '#1e3a8a',
          '--color-primary-foreground': '#fff'
        } as CSSProperties
      }
    >
      <Button {...args} />
    </div>
  )
}

export const LongLabel: Story = {
  args: {
    children: 'Save the current draft and continue to the next step',
    style: { width: '9rem' }
  }
}
