import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Checkbox, Field, Input } from './index.js'

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
