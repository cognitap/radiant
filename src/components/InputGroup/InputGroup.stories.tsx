import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
  Field,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
  type InputGroupProps
} from '../../index.js'

type Args = Pick<InputGroupProps, 'controlSize' | 'dir'> & {
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
}

function ClearableAmount({ disabled, readOnly, invalid, ...group }: Args) {
  const [amount, setAmount] = useState('250')
  const actionInset = 3

  return (
    <Field
      label="Amount (USD)"
      disabled={disabled}
      error={invalid ? 'Enter an amount.' : undefined}
    >
      <InputGroup
        {...group}
        style={{ paddingInlineEnd: actionInset }}
      >
        <InputGroupAddon aria-hidden>$</InputGroupAddon>
        <InputGroupInput
          name="amount"
          value={amount}
          inputMode="decimal"
          readOnly={readOnly}
          onChange={event => setAmount(event.currentTarget.value)}
        />
        <InputGroupAddon style={{ alignSelf: 'stretch', marginBlock: actionInset }}>
          <Button
            variant="ghost"
            tone="neutral"
            controlSize="small"
            style={{ alignSelf: 'stretch', minHeight: 0 }}
            disabled={disabled || readOnly}
            onClick={() => setAmount('')}
          >
            Clear
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

function NotesWithCount({ disabled, readOnly, invalid, ...group }: Args) {
  const [notes, setNotes] = useState('')
  const maxLength = 120
  const gripSpace = '0.75rem'

  return (
    <Field
      label="Notes"
      description="Up to 120 characters."
      disabled={disabled}
      error={invalid ? 'Add a note.' : undefined}
    >
      <InputGroup
        {...group}
        style={{ position: 'relative' }}
      >
        <InputGroupTextarea
          value={notes}
          readOnly={readOnly}
          maxLength={maxLength}
          onChange={event => setNotes(event.currentTarget.value)}
          style={{
            marginInlineEnd: 'calc(-1 * var(--rad-input-group-padding-inline, 0.75rem))',
            paddingInlineEnd: `calc(${gripSpace} + 8ch)`
          }}
        />
        <InputGroupAddon
          aria-hidden
          style={{
            position: 'absolute',
            insetInlineEnd: gripSpace,
            insetBlockEnd: '1px',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            pointerEvents: 'none'
          }}
        >
          {notes.length}/{maxLength}
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

const meta = {
  title: 'Components/InputGroup',
  component: InputGroup,
  decorators: [
    Story => (
      <div style={{ width: 'min(24rem, calc(100vw - 3rem))', maxWidth: '100%' }}>
        <Story />
      </div>
    )
  ],
  args: {
    controlSize: 'medium',
    dir: 'ltr',
    disabled: false,
    readOnly: false,
    invalid: false
  },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    invalid: { control: 'boolean' }
  }
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  render: args => <ClearableAmount {...args} />
}

export const WithField: Story = {
  render: ({ disabled, readOnly, invalid, ...group }) => (
    <Field
      label="Amount (USD)"
      required
      disabled={disabled}
      error={invalid ? 'Enter an amount.' : undefined}
    >
      <InputGroup {...group}>
        <InputGroupAddon aria-hidden>$</InputGroupAddon>
        <InputGroupInput
          name="amount"
          inputMode="decimal"
          readOnly={readOnly}
          defaultValue="250"
        />
      </InputGroup>
    </Field>
  )
}

export const Textarea: Story = {
  render: args => <NotesWithCount {...args} />
}
