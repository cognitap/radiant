import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
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
          'The same profile fields and actions with native or optional TanStack ownership (DEV-43). Choose Standalone, Card or Dialog with the placement control. Email validates on blur, after change once touched, and on submit. Reset restores defaults and clears errors. Each form has its own native form owner and inherits the global theme and mode. The live recipes are in .storybook/examples/ProfileForm.tsx; TanStack stays outside the shipped library.'
      }
    }
  }
} satisfies Meta<typeof ProfileExample>

export default meta
type Story = StoryObj<typeof meta>

const exercise: NonNullable<Story['play']> = async ({ canvasElement, args }) => {
  const canvas = within(canvasElement)
  if (args.placement === 'dialog')
    await userEvent.click(canvas.getByRole('button', { name: 'Edit profile' }))
  const email = canvas.getByRole('textbox', { name: 'Email' })
  const updates = canvas.getByRole('checkbox', { name: 'Send product updates' })
  const free = canvas.getByRole('radio', { name: 'Free' })
  const pro = canvas.getByRole('radio', { name: 'Pro' })
  const save = canvas.getByRole('button', { name: 'Save profile' })
  const reset = canvas.getByRole('button', { name: 'Reset' })
  await expect(email).toBeRequired()
  await expect(email).toHaveAccessibleDescription('We send account updates here.')
  await expect(canvas.getByRole('textbox', { name: 'Workspace' })).toBeDisabled()
  await expect(canvas.getByRole('radio', { name: 'Retired' })).toBeDisabled()
  await expect(updates).toBeChecked()
  await expect(free).toBeChecked()
  await userEvent.click(email)
  await userEvent.tab()
  await expect(canvas.getByRole('alert')).toHaveTextContent('Enter an email.')
  await userEvent.click(reset)
  await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  await expect(email).not.toHaveAttribute('aria-invalid')
  await userEvent.click(save)
  await expect(canvas.getByRole('alert')).toHaveTextContent('Enter an email.')
  await expect(email).toHaveFocus()
  await userEvent.type(email, 'invalid')
  await userEvent.tab()
  await expect(canvas.getByRole('alert')).toHaveTextContent('Enter a valid email.')
  await userEvent.clear(email)
  await userEvent.type(email, 'ada@example.com')
  await waitFor(() => expect(canvas.queryByRole('alert')).not.toBeInTheDocument())
  await userEvent.click(updates)
  await userEvent.click(free)
  await userEvent.keyboard('{ArrowDown}')
  await expect(pro).toBeChecked()
  await userEvent.keyboard('{ArrowDown}')
  await expect(free).toBeChecked()
  await userEvent.click(pro)
  const form = canvas.getByRole('form', { name: args.label ?? 'Profile' }) as HTMLFormElement
  const data = new FormData(form)
  await expect(data.get('email')).toBe('ada@example.com')
  await expect(data.get('plan')).toBe('pro')
  await expect(data.has('updates')).toBe(false)
  await expect(data.has('workspace')).toBe(false)
  await userEvent.click(reset)
  await expect(email).toHaveValue('')
  await expect(updates).toBeChecked()
  await expect(free).toBeChecked()
  await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  await expect(canvas.getByRole('status')).toHaveTextContent('No changes saved.')
  await userEvent.clear(email)
  await userEvent.type(email, 'ada@example.com')
  await userEvent.click(updates)
  await userEvent.click(pro)
  await userEvent.click(save)
  await waitFor(() =>
    expect(canvas.getByRole('status')).toHaveTextContent(
      'Saved ada@example.com · pro · Updates off'
    )
  )
  if (args.placement === 'dialog')
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
}

export const Native: Story = {
  args: { owner: 'native' },
  play: exercise
}

export const TanStack: Story = {
  name: 'TanStack',
  args: { owner: 'tanstack' },
  play: exercise
}
