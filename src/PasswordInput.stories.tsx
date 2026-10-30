import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Field, PasswordInput } from './index.js'
import { MotionProvider } from './motion/react.js'
import {
  PrepareWorkspaceSignIn,
  ChooseWorkspacePassword,
  ReviewConnectionPassword,
  type PasswordInputTaskOptions
} from '../.storybook/examples/PasswordInputExamples.js'
const meta = {
  title: 'Components/PasswordInput',
  component: PrepareWorkspaceSignIn,
  args: {
    controlSize: 'medium',
    dir: 'ltr',
    disabled: false,
    readOnly: false,
    required: true,
    invalid: false,
    showLabel: 'Show password',
    hideLabel: 'Hide password'
  },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
    showLabel: { control: 'text' },
    hideLabel: { control: 'text' },
    className: { control: 'text' },
    style: { control: 'object' }
  },
  render: args => (
    <MotionProvider>
      <PrepareWorkspaceSignIn {...args} />
    </MotionProvider>
  )
} satisfies Meta<PasswordInputTaskOptions>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: ({ disabled, invalid, required, ...props }) => (
    <div style={{ width: 'min(26rem,calc(100vw - 2rem))', maxWidth: '100%', minWidth: 0 }}>
      <Field
        label="Workspace password"
        disabled={disabled}
        required={required}
        error={invalid ? 'Review your password.' : undefined}
      >
        <PasswordInput
          {...props}
          name="password"
          defaultValue=""
        />
      </Field>
    </div>
  )
}
export const PreparingWorkspaceSignIn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText(/^Password/, { selector: 'input' }), 'demo-password')
    await userEvent.click(canvas.getByRole('button', { name: 'Show password' }))
    await expect(canvas.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Prepare sign in' }))
    await expect(canvas.getByLabelText(/^Password/, { selector: 'input' })).toHaveAttribute(
      'type',
      'password'
    )
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Sign-in request prepared for researcher@example.com.'
    )
  }
}
export const ChoosingNewPassword: Story = {
  render: args => (
    <MotionProvider>
      <ChooseWorkspacePassword {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.type(
      c.getByLabelText(/^New password/, { selector: 'input' }),
      'demo-new-password'
    )
    await userEvent.type(
      c.getByLabelText(/^Confirm new password/, { selector: 'input' }),
      'demo-new-password'
    )
    await userEvent.click(c.getByRole('button', { name: 'Prepare password change' }))
    await expect(c.getByRole('status')).toHaveTextContent('New password request prepared.')
  }
}
export const ReviewingConnectionPassword: Story = {
  argTypes: {
    readOnly: { control: false, table: { disable: true } },
    required: { control: false, table: { disable: true } }
  },
  render: args => <ReviewConnectionPassword {...args} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('button', { name: 'Show password' }))
    await expect(c.getByRole('textbox', { name: 'Connection password' })).toHaveValue(
      'reader-demo-password'
    )
    await userEvent.selectOptions(c.getByRole('combobox', { name: 'Demo connection' }), 'component')
    await expect(c.getByLabelText('Connection password', { selector: 'input' })).toHaveAttribute(
      'type',
      'password'
    )
    await expect(c.getByText('Account: component-demo')).toBeVisible()
  }
}
