import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fieldset, Field, Input, Checkbox, Button } from './index.js'
const meta = {
  title: 'Components/Fieldset',
  component: Fieldset,
  args: { legend: 'Shipping address', description: 'Where should we deliver your order?' },
  parameters: {
    docs: {
      description: {
        component:
          'A native fieldset and legend for related fields. Composes Field relationships and disabled context: group help and errors belong to the fieldset, while nested Fields own each control label, help and required state. Root native attributes, style, className and refs reach the fieldset. Legend, description and error part hooks retain Field identities. Applications own values, validation and submissions.'
      }
    }
  }
} satisfies Meta<typeof Fieldset>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: args => (
    <Fieldset
      {...args}
      style={{ width: '24rem', ...args.style }}
    >
      <Field label="Street">
        <Input
          name="street"
          autoComplete="shipping street-address"
          defaultValue="10 Main St"
        />
      </Field>
      <Field label="City">
        <Input
          name="city"
          autoComplete="shipping address-level2"
          defaultValue="Budapest"
        />
      </Field>
    </Fieldset>
  )
}
function Locked() {
  const [locked, setLocked] = useState(true)
  return (
    <div style={{ display: 'grid', gap: '1rem', width: '24rem', maxWidth: '100%' }}>
      <Button
        variant="outline"
        onClick={() => setLocked(!locked)}
      >
        {locked ? 'Unlock address' : 'Lock address'}
      </Button>
      <Fieldset
        legend="Saved address"
        disabled={locked}
        description="Unlock to edit the saved destination."
        parts={{ legend: { className: 'italic' } }}
        style={{ '--rad-fieldset-gap': '1rem' }}
      >
        <Field label="Street">
          <Input
            name="saved-street"
            defaultValue="10 Main St"
          />
        </Field>
        <Checkbox
          name="default-address"
          label="Use as default"
          defaultChecked
        />
        <Button variant="soft">Apply changes</Button>
      </Fieldset>
    </div>
  )
}
export const LockingASection: Story = { render: () => <Locked /> }
function Validation() {
  const [invalid, setInvalid] = useState(false)
  return (
    <form
      style={{ display: 'grid', gap: '1rem', width: '24rem', maxWidth: '100%' }}
      onSubmit={event => {
        event.preventDefault()
        setInvalid(true)
      }}
    >
      <Fieldset
        legend="Delivery details"
        description="Use a supported destination."
        error={
          invalid ? 'We cannot deliver to this combination of city and postal code.' : undefined
        }
      >
        <Field label="City">
          <Input
            name="city"
            defaultValue="Budapest"
          />
        </Field>
        <Field
          label="Postal code"
          required
          description="Four digits for domestic delivery."
        >
          <Input
            name="postal-code"
            defaultValue="1000"
          />
        </Field>
      </Fieldset>
      <Button type="submit">Check destination</Button>
    </form>
  )
}
export const ValidatingRelatedFields: Story = { render: () => <Validation /> }
