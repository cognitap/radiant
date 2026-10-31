import { useState } from 'react'
import {
  AccordionGuideExample,
  AccordionSelectionExample
} from '../.storybook/examples/AccordionExamples.js'
import { ShipmentTracking } from '../.storybook/examples/ShipmentTracking.js'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Field,
  Input,
  type ThemeStyle
} from './index.js'
import { themes } from './examples/index.js'

function ShippingSections({ multiple = false }: { multiple?: boolean }) {
  const sections = (
    <>
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>
          <ShipmentTracking />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>Returns are free for 30 days.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="warranty">
        <AccordionTrigger>Warranty</AccordionTrigger>
        <AccordionContent>Every piece is covered for two years.</AccordionContent>
      </AccordionItem>
    </>
  )
  if (multiple) {
    return (
      <Accordion
        defaultValue={['shipping']}
        type="multiple"
      >
        {sections}
      </Accordion>
    )
  }
  return <Accordion defaultValue="shipping">{sections}</Accordion>
}

function DisabledSections() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Accordion defaultValue="shipping">
        <AccordionItem value="shipping">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>Ships in two days.</AccordionContent>
        </AccordionItem>
        <AccordionItem
          disabled
          value="returns"
        >
          <AccordionTrigger>Returns</AccordionTrigger>
          <AccordionContent>Returns are free for 30 days.</AccordionContent>
        </AccordionItem>
      </Accordion>
      <Accordion
        defaultValue="billing"
        disabled
      >
        <AccordionItem value="billing">
          <AccordionTrigger>Billing</AccordionTrigger>
          <AccordionContent>Invoices are locked while the order ships.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="address">
          <AccordionTrigger>Address</AccordionTrigger>
          <AccordionContent>The delivery address is locked.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

function HeldValue() {
  const [value, setValue] = useState<string | null>('shipping')
  return (
    <Accordion
      type="single"
      value={value}
      onValueChange={setValue}
    >
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>Ships in two days.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>Returns are free for 30 days.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function InsideForm() {
  const [summary, setSummary] = useState('No save yet')
  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        const note = new FormData(event.currentTarget).get('note')
        setSummary(typeof note === 'string' && note !== '' ? note : 'Empty')
      }}
      style={{ display: 'grid', justifyItems: 'start', gap: '0.75rem' }}
    >
      <Accordion defaultValue="note">
        <AccordionItem value="note">
          <AccordionTrigger>Note</AccordionTrigger>
          <AccordionContent>
            <Field label="Note">
              <Input
                defaultValue="Pack the blue set"
                name="note"
              />
            </Field>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Button type="submit">Save</Button>
      <p style={{ margin: 0 }}>{summary}</p>
    </form>
  )
}

function NestedSection() {
  return (
    <Accordion defaultValue="account">
      <AccordionItem value="account">
        <AccordionTrigger>Account</AccordionTrigger>
        <AccordionContent>
          <Collapsible>
            <CollapsibleTrigger>Password</CollapsibleTrigger>
            <CollapsibleContent>Use at least 10 characters.</CollapsibleContent>
          </Collapsible>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  parameters: {
    docs: {
      description: {
        component:
          'Accordion renders a div with single or multiple value/defaultValue and onValueChange. AccordionItem builds on Collapsible; triggers remain summaries, with heading level 3 by default. Root className/style/ref target the accordion div (data-slot="accordion"). Item/trigger/content expose accordion-item, accordion-trigger and accordion-content alongside the underlying Collapsible identities. Use token selectors ([data-slot~=...]); styles and refs target the actual details/summary/div hosts. Single mode lets the open item close again, leaving the value null. disabled on the root or an item suppresses activation.'
      }
    }
  }
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <ShippingSections />
}

export const Multiple: Story = {
  render: () => <ShippingSections multiple />
}

export const Controlled: Story = {
  render: () => <HeldValue />
}

export const Disabled: Story = { render: () => <DisabledSections /> }

export const InsideAForm: Story = { render: () => <InsideForm /> }

export const Nested: Story = {
  render: () => <NestedSection />
}

export const FieldGuide: Story = {
  render: (_, { globals }) => (
    <AccordionGuideExample
      theme={themes.find(theme => theme.id === globals.theme)}
      mode={globals.mode === 'light' || globals.mode === 'dark' ? globals.mode : 'system'}
    />
  )
}

export const Motion: Story = {
  render: (_, { globals }) => (
    <AccordionSelectionExample
      theme={themes.find(theme => theme.id === globals.theme)}
      mode={globals.mode === 'light' || globals.mode === 'dark' ? globals.mode : 'system'}
    />
  )
}

export const Customisation: Story = {
  render: () => {
    const local: ThemeStyle = { '--rad-accordion-gap': '1.5rem' }
    return (
      <Accordion
        defaultValue="shipping"
        style={local}
      >
        <AccordionItem value="shipping">
          <AccordionTrigger>Shipping</AccordionTrigger>
          <AccordionContent>Local spacing preserves the current theme.</AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  }
}
