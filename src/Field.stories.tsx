import { useState, type CSSProperties, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Field, useField } from './Field'
import { radiantTheme, themes } from './themes/index.js'

const controlChrome = `
  [data-slot="field"] input:not([type='checkbox']):not([type='radio']) {
    box-sizing: border-box;
    width: 100%;
    height: 2.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-control);
    padding-inline: 0.75rem;
    background: var(--color-background);
    color: var(--color-foreground);
  }
  [data-slot="field"][data-invalid] input:not([type='checkbox']):not([type='radio']) {
    border-color: var(--field-error-color, var(--color-destructive));
  }
`

function ToneInput(props: ComponentProps<'input'>) {
  const field = useField()
  return (
    <input
      {...field?.controlProps}
      {...props}
    />
  )
}

function FormExample() {
  const [error, setError] = useState<string | undefined>()
  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        const email = new FormData(event.currentTarget).get('email')
        setError(typeof email === 'string' && email.trim() ? undefined : 'Enter an email.')
      }}
      style={{ display: 'grid', gap: '0.75rem', maxWidth: '20rem' }}
    >
      <Field
        description="Work address"
        error={error}
        label="Email"
        required
      >
        <input
          autoComplete="email"
          name="email"
          type="email"
        />
      </Field>
      <Button type="submit">Save</Button>
    </form>
  )
}

const meta = {
  title: 'Components/Field',
  component: Field,
  args: {
    label: 'Email',
    description: 'Work address',
    required: true,
    disabled: false
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    layout: { control: 'inline-radio', options: ['control', 'group'] }
  },
  parameters: {
    docs: {
      description: {
        component:
          'Label, description, and error relationships for one control or a group. Field does not validate; the consumer owns the error message.'
      }
    }
  },
  decorators: [
    (Story, { id }) =>
      id.endsWith('--themes') ? (
        <Story />
      ) : (
        <div style={{ ...radiantTheme, maxWidth: '20rem' }}>
          <style>{controlChrome}</style>
          <Story />
        </div>
      )
  ]
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: args => (
    <Field {...args}>
      <input
        autoComplete="email"
        name="email"
        type="email"
      />
    </Field>
  )
}

export const Invalid: Story = {
  args: { error: 'Enter an email.' },
  render: args => (
    <Field {...args}>
      <input
        autoComplete="email"
        name="email"
        type="email"
      />
    </Field>
  )
}

export const Group: Story = {
  args: {
    layout: 'group',
    label: 'Notifications',
    description: 'Choose any',
    error: 'Pick at least one.',
    required: true
  },
  render: args => (
    <Field {...args}>
      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          name="channels"
          type="checkbox"
          value="email"
        />{' '}
        Email
      </label>
      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          name="channels"
          type="checkbox"
          value="sms"
        />{' '}
        SMS
      </label>
    </Field>
  )
}

export const Disabled: Story = {
  args: { disabled: true, required: false, description: 'Locked by an admin' },
  render: args => (
    <Field {...args}>
      <input
        name="email"
        type="email"
        value="ada@example.com"
        readOnly
      />
    </Field>
  )
}

export const NativeForm: Story = {
  render: () => <FormExample />
}

export const CustomControl: Story = {
  render: args => (
    <Field {...args}>
      <ToneInput
        autoComplete="email"
        name="email"
        type="email"
      />
    </Field>
  )
}

const themeFrame = (surface: string | undefined): CSSProperties => ({
  display: 'grid',
  gap: '0.75rem',
  padding: '1.5rem',
  borderRadius: '1.25rem',
  background: surface ?? 'oklch(0.985 0.003 250)'
})

export const Themes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <style>{controlChrome}</style>
      {themes.map(theme => (
        <div
          key={theme.name}
          style={{ ...theme.style, ...themeFrame(theme.surface) }}
        >
          <span style={{ font: '500 0.8125rem system-ui', opacity: 0.7 }}>{theme.name}</span>
          <Field
            description="Work address"
            error="Enter an email."
            label="Email"
            required
          >
            <input
              name="email"
              type="email"
            />
          </Field>
        </div>
      ))}
    </div>
  )
}
