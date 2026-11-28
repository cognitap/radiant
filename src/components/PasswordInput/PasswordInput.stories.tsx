import type { Meta, StoryObj } from '@storybook/react-vite'
import { Eye, EyeOff } from 'lucide-react'
import { Field, PasswordInput, type PasswordInputProps } from '../../index.js'

type StoryArgs = Pick<
  PasswordInputProps,
  | 'aria-label'
  | 'aria-invalid'
  | 'autoComplete'
  | 'controlSize'
  | 'defaultValue'
  | 'dir'
  | 'disabled'
  | 'hideLabel'
  | 'name'
  | 'readOnly'
  | 'required'
  | 'revealMode'
  | 'showLabel'
>

const controls = {
  include: [
    'revealMode',
    'controlSize',
    'dir',
    'disabled',
    'readOnly',
    'aria-invalid',
    'showLabel',
    'hideLabel'
  ]
}

const meta = {
  title: 'Components/PasswordInput',
  component: PasswordInput,
  parameters: { controls, docs: { controls } },
  args: {
    'aria-label': 'Password',
    name: 'password',
    defaultValue: 'demo-pass',
    controlSize: 'medium',
    disabled: false,
    readOnly: false,
    revealMode: 'toggle'
  },
  argTypes: {
    'aria-invalid': { control: 'boolean' },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    revealMode: { control: 'inline-radio', options: ['toggle', 'hold'] },
    showLabel: { control: 'text' },
    hideLabel: { control: 'text' }
  },
  decorators: [
    Story => (
      <div style={{ width: 'min(26rem, calc(100vw - 2rem))', maxWidth: '100%' }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {}

export const WithField: Story = {
  args: { defaultValue: '', required: true, 'aria-invalid': false },
  render: ({ 'aria-invalid': invalid, disabled, required, ...args }) => (
    <Field
      label="Password"
      disabled={disabled}
      required={required}
      error={invalid ? 'Enter the correct password.' : undefined}
    >
      <PasswordInput
        {...args}
        aria-label={undefined}
      />
    </Field>
  )
}

export const WithIcons: Story = {
  args: { revealMode: 'hold' },
  render: args => (
    <PasswordInput
      {...args}
      showIcon={<Eye />}
      hideIcon={<EyeOff />}
    />
  )
}

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Field label="Read-only password">
        <PasswordInput
          {...args}
          aria-label={undefined}
          readOnly
        />
      </Field>
      <Field
        label="Disabled password"
        disabled
      >
        <PasswordInput
          {...args}
          aria-label={undefined}
        />
      </Field>
    </div>
  )
}
