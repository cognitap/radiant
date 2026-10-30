import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Field, OTPField } from './index.js'
import {
  VerifyEmailCode,
  ApproveWorkspaceAccess,
  ReviewRecoveryCode,
  type OTPTaskOptions
} from '../.storybook/examples/OTPFieldExamples.js'
const meta = {
  title: 'Components/OTPField',
  component: VerifyEmailCode,
  args: {
    length: 6,
    mode: 'numeric',
    controlSize: 'medium',
    disabled: false,
    readOnly: false,
    dir: 'ltr',
    initialValue: ''
  },
  argTypes: {
    length: { control: { type: 'number', min: 1, max: 12, step: 1 } },
    mode: { control: 'inline-radio', options: ['numeric', 'alphanumeric'] },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    initialValue: { control: 'text' },
    style: { control: 'object' },
    parts: { control: 'object' }
  },
  render: args => (
    <VerifyEmailCode
      key={JSON.stringify([args.length, args.mode, args.initialValue])}
      {...args}
    />
  )
} satisfies Meta<OTPTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: ({ initialValue, ...args }) => (
    <Field
      label="One-time code"
      description="Enter the code from your message."
    >
      <OTPField
        key={JSON.stringify([args.length, args.mode, initialValue])}
        {...args}
        defaultValue={initialValue}
      />
    </Field>
  )
}
export const VerifyingEmail: Story = {
  play: async ({ canvasElement, args }) => {
    if (args.disabled || args.readOnly) return
    const canvas = within(canvasElement),
      input = canvas.getByRole('textbox', { name: 'Email verification code' })
    await userEvent.clear(input)
    await userEvent.type(input, '1234567890'.repeat(4).slice(0, args.length ?? 6))
    await userEvent.click(canvas.getByRole('button', { name: 'Verify email' }))
    await expect(canvas.getByText(/Email verified with code/)).toBeVisible()
  }
}
export const ApprovingWorkspaceAccess: Story = {
  args: { length: 8, mode: 'alphanumeric' },
  render: args => (
    <ApproveWorkspaceAccess
      key={JSON.stringify([args.length, args.mode, args.initialValue])}
      {...args}
    />
  )
}
export const ReviewingRecoveryCode: Story = {
  args: { initialValue: '12' },
  render: args => (
    <ReviewRecoveryCode
      key={JSON.stringify([args.length, args.mode, args.initialValue])}
      {...args}
    />
  )
}
