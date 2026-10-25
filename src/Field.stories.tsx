import { useState, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button, Checkbox, Field, Input } from './index.js'

function ToneInput(props: ComponentProps<'input'>) {
  return (
    <input
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
        borderBottomColor: props['aria-invalid']
          ? 'var(--rad-color-invalid)'
          : 'var(--rad-color-accent)',
        ...props.style
      }}
    />
  )
}

function FormExample() {
  const [error, setError] = useState<string | undefined>()
  return (
    <form
      noValidate
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
          'Single-control Field renders a div; layout="group" renders a fieldset and legend. Native props and refs target that host. The consumer owns values and validation. Radiant controls read useField; native/custom controls explicitly forward children(controlProps). Set controlId on Field to name the control. parts.label/description/error/required accept className and style while Field keeps their IDs and relationships.'
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

export const Composition: Story = {
  render: () => <FormExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Email' })
    const id = input.id
    await expect(input).toBeRequired()
    await expect(input).toHaveAccessibleDescription('Work address')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('Enter an email.')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAccessibleDescription('Work address Enter an email.')
    await userEvent.type(input, 'ada@example.com')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
    await expect(input).not.toHaveAttribute('aria-invalid')
    await expect(input).toHaveAccessibleDescription('Work address')
    await expect(input.id).toBe(id)
  }
}

export const Customisation: Story = {
  argTypes: { layout: { control: false } },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('textbox')
    await waitFor(async () => {
      const styles = canvasElement.ownerDocument.defaultView!.getComputedStyle(input)
      await expect(input.getBoundingClientRect().height).toBeGreaterThanOrEqual(32)
      await expect(parseFloat(styles.borderBottomWidth)).toBeGreaterThan(0)
      await expect(styles.borderBottomStyle).not.toBe('none')
      await expect(input).toHaveAccessibleName()
      if (args.required) await expect(input).toBeRequired()
      const label = canvasElement.querySelector('label')!
      await expect(canvasElement.ownerDocument.defaultView!.getComputedStyle(label).fontStyle).toBe(
        'italic'
      )
    })
    if (!args.disabled) {
      await userEvent.click(canvasElement.querySelector('label')!)
      await expect(input).toHaveFocus()
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'A native adapter forwards children(controlProps) to its input. parts.label customises the label without changing its relationship to that input. The underline and surface use shared semantic roles; focus stays native.'
      }
    }
  },
  render: ({ label, description, error, required, disabled, requiredIndicator, controlId }) => (
    <Field
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      requiredIndicator={requiredIndicator}
      controlId={controlId}
      parts={{ label: { className: 'italic' } }}
    >
      {control => (
        <ToneInput
          {...control}
          autoComplete="email"
          name="email"
          type="email"
        />
      )}
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
