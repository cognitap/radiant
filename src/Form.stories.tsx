import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProfileExample } from '../.storybook/examples/ProfileForm.js'

const meta = {
  title: 'Recipes/Forms',
  component: ProfileExample,
  args: { placement: 'standalone' },
  argTypes: {
    owner: { control: false, table: { disable: true } },
    placement: { control: 'inline-radio', options: ['standalone', 'card', 'dialog'] }
  },
  parameters: {
    docs: {
      description: {
        component:
          'The same profile fields and actions with native or optional TanStack ownership. Choose Standalone, Card or Dialog with the placement control. Email validates on blur, after change once touched, and on submit. Reset restores defaults and clears errors. Each form has its own native form owner and inherits the global theme and mode. The live recipes are in .storybook/examples/ProfileForm.tsx; TanStack stays outside the shipped library.'
      }
    }
  }
} satisfies Meta<typeof ProfileExample>

export default meta
type Story = StoryObj<typeof meta>

export const Native: Story = {
  args: { owner: 'native' }
}

export const TanStack: Story = {
  name: 'TanStack',
  args: { owner: 'tanstack' }
}
