import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Field } from './Field'
import { Input } from './Input'
import { ThemeScope } from './ThemeScope'
import { radiant, themes } from './themes/index.js'

function NativeForm() {
  const [error, setError] = useState<string | undefined>()
  return (
    <form
      onReset={() => setError(undefined)}
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
        <Input
          autoComplete="email"
          defaultValue="ada@example.com"
          name="email"
          type="email"
        />
      </Field>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button type="submit">Save</Button>
        <Button
          type="reset"
          variant="outline"
        >
          Reset
        </Button>
      </div>
    </form>
  )
}

function Controlled() {
  const [value, setValue] = useState('Hello')
  return (
    <Field
      description={`${value.length} characters`}
      label="Display name"
    >
      <Input
        value={value}
        onChange={event => setValue(event.target.value)}
      />
    </Field>
  )
}

const meta = {
  title: 'Components/Input',
  component: Input,
  args: {
    name: 'email',
    type: 'email',
    placeholder: 'you@example.com',
    autoComplete: 'email',
    disabled: false
  },
  argTypes: {
    name: { control: 'text' },
    type: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native text input. Omit value for an uncontrolled field; pass value and onChange to control it. Field supplies the label, description, and error.'
      }
    }
  },
  decorators: [
    (Story, { id }) =>
      id.endsWith('--themes') ? (
        <Story />
      ) : (
        <ThemeScope
          theme={radiant}
          style={{ maxWidth: '20rem' }}
        >
          <Story />
        </ThemeScope>
      )
  ]
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithField: Story = {
  render: args => (
    <Field
      description="Work address"
      label="Email"
      required
    >
      <Input {...args} />
    </Field>
  )
}

export const Invalid: Story = {
  render: args => (
    <Field
      description="Work address"
      error="Enter an email."
      label="Email"
      required
    >
      <Input {...args} />
    </Field>
  )
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'ada@example.com' }
}

export const NativeFormStory: Story = {
  name: 'Native form',
  render: () => <NativeForm />
}

export const ControlledStory: Story = {
  name: 'Controlled',
  render: () => <Controlled />
}

const themeFrame = (): CSSProperties => ({
  display: 'grid',
  gap: '0.75rem',
  padding: '1.5rem',
  borderRadius: '1.25rem'
})

export const Themes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {themes.map(theme => (
        <ThemeScope
          key={theme.id}
          theme={theme}
          style={{ ...themeFrame() }}
        >
          <span style={{ font: '500 0.8125rem system-ui', opacity: 0.7 }}>{theme.name}</span>
          <Field
            description="Work address"
            error="Enter an email."
            label="Email"
            required
          >
            <Input
              name="email"
              placeholder="you@example.com"
              type="email"
            />
          </Field>
        </ThemeScope>
      ))}
    </div>
  )
}
