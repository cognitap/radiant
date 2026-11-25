import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox, Field, Input, type FieldProps } from '../../index.js'
import { themes } from '../../examples/index.js'
import { FieldValidationExample } from '../../../.storybook/examples/FieldExamples.js'

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

function exampleProps({
  label,
  description,
  error,
  required,
  disabled,
  requiredIndicator
}: FieldProps) {
  return { label, description, error, required, disabled, requiredIndicator }
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
    requiredIndicator: { control: 'text' },
    disabled: { control: 'boolean' },
    controlId: { control: 'text' },
    layout: { control: false }
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
    <Field
      {...exampleProps(args)}
      controlId={args.controlId}
    >
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
        {...exampleProps(args)}
        controlId={args.controlId}
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
  name: 'Native control adapter',
  args: { controlId: 'work-email', requiredIndicator: '(required)' },
  parameters: {
    docs: {
      description: {
        story:
          "A native adapter forwards children(controlProps) to its input, and controlId sets that input's ID. requiredIndicator replaces the asterisk; it stays hidden from assistive technology because aria-required already announces the state. parts.label and parts.required restyle those parts without changing their relationships. The underline and surface use shared semantic roles; focus stays native."
      }
    }
  },
  render: args => (
    <Field
      {...exampleProps(args)}
      controlId={args.controlId}
      parts={{ label: { className: 'italic' }, required: { className: 'font-normal' } }}
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
    label: 'Notifications',
    description: 'Choose any',
    error: 'Pick at least one.',
    required: true
  },
  argTypes: { controlId: { control: false } },
  render: args => (
    <Field
      {...exampleProps(args)}
      layout="group"
    >
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

export const LiveValidation: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Copyable public APIs: useSpringLayout moves dedicated wrappers around Fields. Help and error relationships update immediately, without scaling native controls. Validation belongs to the form. Try motion off or change your system reduced-motion preference.'
      }
    }
  },
  render: (_args, context) => (
    <FieldValidationExample
      theme={themes.find(theme => theme.id === context.globals.theme)}
      mode={context.globals.mode === 'dark' ? 'dark' : 'light'}
    />
  )
}
