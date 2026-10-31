import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Field, OTPField } from './index.js'
import {
  ControlSignInCode,
  OTPFieldSizeComparison,
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
    <OTPField
      key={JSON.stringify([args.length, args.mode, initialValue])}
      {...args}
      aria-label="One-time code"
      defaultValue={initialValue}
    />
  )
}
export const WithField: Story = {
  render: ({ initialValue, ...args }) => (
    <Field
      label="One-time code"
      description="Enter the code from your message."
      error="Enter every digit of the code."
      required
    >
      <OTPField
        key={JSON.stringify([args.length, args.mode, initialValue])}
        {...args}
        name="code"
        defaultValue={initialValue}
      />
    </Field>
  )
}
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ControlSignInCode />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      input = canvas.getByRole('textbox', { name: 'Sign-in code' })
    await userEvent.type(input, '123456')
    await expect(canvas.getByText('Code complete.')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Clear code' }))
    await expect(input).toHaveValue('')
  }
}
export const SharedControlSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => <OTPFieldSizeComparison />
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
