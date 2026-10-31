import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Button, Field, PasswordInput } from './index.js'
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
  render: ({ invalid, required, ...props }) => (
    <div style={{ width: 'min(26rem,calc(100vw - 2rem))', maxWidth: '100%', minWidth: 0 }}>
      <PasswordInput
        {...props}
        aria-label="Workspace password"
        aria-invalid={invalid || undefined}
        required={required}
        name="password"
        defaultValue=""
      />
    </div>
  )
}
export const PreparingWorkspaceSignIn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText(/^Password/, { selector: 'input' }), 'demo-password')
    await userEvent.click(canvas.getByRole('button', { name: 'Show password' }))
    await expect(canvas.getByRole('button', { name: 'Hide password' })).toBeVisible()
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
function ChooseRecoveryPassword({ invalid, required, ...props }: PasswordInputTaskOptions) {
  const [password, setPassword] = useState('')
  return (
    <div style={{ display: 'grid', gap: '1rem', width: 'min(26rem,calc(100vw - 2rem))' }}>
      <Field
        label="Recovery password"
        description="Use at least 12 characters."
        disabled={props.disabled}
        required={required}
        error={invalid ? 'Choose a longer password.' : undefined}
      >
        <PasswordInput
          {...props}
          autoComplete="new-password"
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
      </Field>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
        <Button
          variant="outline"
          disabled={props.disabled || password === ''}
          onClick={() => setPassword('')}
        >
          Clear password
        </Button>
      </div>
      <output aria-live="polite">
        {password.length >= 12 ? 'Long enough.' : `${12 - password.length} more characters needed.`}
      </output>
    </div>
  )
}
export const Controlled: Story = {
  render: args => <ChooseRecoveryPassword {...args} />,
  play: async ({ canvasElement, args }) => {
    if (args.disabled || args.readOnly) return
    const c = within(canvasElement),
      input = c.getByLabelText(/^Recovery password/, { selector: 'input' })
    await userEvent.type(input, 'demo-recovery')
    await expect(c.getByRole('status')).toHaveTextContent('Long enough.')
    await userEvent.click(c.getByRole('button', { name: 'Clear password' }))
    await expect(input).toHaveValue('')
    await expect(c.getByRole('status')).toHaveTextContent('12 more characters needed.')
  }
}
export const WithField: Story = {
  render: ({ disabled, invalid, required, ...props }) => (
    <div style={{ width: 'min(26rem,calc(100vw - 2rem))', maxWidth: '100%', minWidth: 0 }}>
      <Field
        label="Workspace password"
        description="Use your current workspace password."
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
export const SharedControlSizes: Story = {
  argTypes: { controlSize: { control: false, table: { disable: true } } },
  render: ({ invalid: _invalid, required: _required, controlSize: _size, ...props }) => (
    <div style={{ display: 'grid', gap: '1rem', width: 'min(28rem,calc(100vw - 2rem))' }}>
      {(['small', 'medium', 'large'] as const).map(size => (
        <div
          key={size}
          style={{ display: 'flex', alignItems: 'end', gap: '.5rem' }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Field label={`${size} password`}>
              <PasswordInput
                {...props}
                controlSize={size}
                defaultValue=""
              />
            </Field>
          </div>
          <Button controlSize={size}>Unlock</Button>
        </div>
      ))}
    </div>
  )
}
