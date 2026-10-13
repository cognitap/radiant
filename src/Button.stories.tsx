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
    disabled: { control: 'boolean' }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native button with baseline styling. Defaults to type="button" and accepts native button props, including ref, disabled, and explicit submit/reset types.'
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

export const CustomClasses: Story = {
  args: { className: 'rounded-full px-8 hover:bg-red-500' }
}
