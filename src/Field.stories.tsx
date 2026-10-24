import { useState, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { Button, Checkbox, Field, useField, Input } from './index.js'

function ToneInput(props: ComponentProps<'input'>) {
  const field = useField()
  return (
    <input
      {...field?.controlProps}
      {...props}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        minWidth: 0,
        height: 'var(--rad-control-medium-height)',
        paddingInline: 'var(--rad-control-medium-padding-inline)',
        fontFamily: 'var(--rad-typography-family)',
        fontSize: 'var(--rad-control-medium-font-size)',
        color: 'var(--rad-color-foreground)',
        background: 'var(--rad-color-surface)',
        borderBottom:
          'var(--rad-control-border-width) var(--rad-control-border-style) var(--rad-color-accent)',
        borderBottomColor: field?.invalid ? 'var(--rad-color-invalid)' : 'var(--rad-color-accent)',
        ...props.style
      }}
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
        <Input
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
          'Single-control Field renders a div with a label, description and error; layout="group" renders a fieldset and legend. The consumer owns validation. Root className/style target that container; data-slot values field-label, field-description, field-error and field-required identify its text parts. Host inputs receive relationships automatically; component controls call useField.'
      }
    }
  }
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: args => (
    <Field {...args}>
      <Input
        autoComplete="email"
        name="email"
        type="email"
      />
    </Field>
  )
}

export const States: Story = {
  render: args => (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '24rem' }}>
      <Field
        {...args}
        label="Email with error"
        error="Enter an email."
      >
        <Input
          name="invalid-email"
          type="email"
        />
      </Field>
      <Field
        label="Locked email"
        disabled
        description="Locked by an admin"
      >
        <Input
          name="locked-email"
          defaultValue="ada@example.com"
        />
      </Field>
    </div>
  )
}

export const Composition: Story = { render: () => <FormExample /> }

export const Customisation: Story = {
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('textbox')
    await waitFor(async () => {
      const styles = canvasElement.ownerDocument.defaultView!.getComputedStyle(input)
      await expect(input.getBoundingClientRect().height).toBeGreaterThanOrEqual(32)
      await expect(parseFloat(styles.borderBottomWidth)).toBeGreaterThan(0)
      await expect(styles.borderBottomStyle).not.toBe('none')
      if (args.layout !== 'group') {
        await expect(input).toHaveAccessibleName()
        if (args.required) await expect(input).toBeRequired()
      }
    })
  },
  parameters: {
    docs: {
      description: {
        story:
          'A consumer component reads useField and forwards controlProps to its native input. Its underline and surface use shared semantic roles; focus stays native. This is the explicit native interoperability example.'
      }
    }
  },
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
      <Checkbox
        label="Email"
        name="channels"
        value="email"
      />
      <Checkbox
        label="SMS"
        name="channels"
        value="sms"
      />
    </Field>
  )
}
