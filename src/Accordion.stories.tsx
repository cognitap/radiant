import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
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
  themes,
  type ThemeStyle
} from './index.js'

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

function DisabledSection() {
  return (
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
          'Accordion renders a div with single or multiple value/defaultValue and onValueChange. AccordionItem builds on Collapsible; triggers remain summaries, with heading level 3 by default. Root className/style/ref target the accordion div (data-slot="accordion"). Item/trigger/content expose accordion-item, accordion-trigger and accordion-content alongside the underlying Collapsible identities. Use token selectors ([data-slot~=...]); styles and refs target the actual details/summary/div hosts. disabled suppresses item activation.'
      }
    }
  }
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <ShippingSections />,
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector<HTMLElement>('[data-slot~="accordion-item"]')!
    const trigger = item.querySelector('summary')!
    const content = item.querySelector('[data-slot~="accordion-content"]')!
    await expect(item).toHaveAttribute('data-slot', 'collapsible accordion-item')
    await expect(trigger).toHaveAttribute('data-slot', 'collapsible-trigger accordion-trigger')
    await expect(trigger.querySelector('button')).toBeNull()
    await userEvent.click(within(item).getByRole('button', { name: 'Track' }))
    await expect(within(item).getByRole('status')).toHaveTextContent('Tracking update:')
    await expect(content).toHaveAttribute('data-state', 'open')
    await userEvent.click(trigger)
    await expect(item).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveAttribute('data-state', 'closed')
    await userEvent.click(trigger)
    await expect(content).toBeVisible()
  }
}

export const States: Story = { render: () => <DisabledSection /> }

export const Composition: Story = { render: () => <InsideForm /> }

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

export const Multiple: Story = {
  render: () => <ShippingSections multiple />
}

export const Controlled: Story = {
  render: () => <HeldValue />
}

export const Nested: Story = {
  render: () => <NestedSection />
}

export const FieldGuide: Story = {
  render: (_, { globals }) => (
    <AccordionGuideExample
      theme={themes.find(theme => theme.id === globals.theme)}
      mode={globals.mode === 'light' || globals.mode === 'dark' ? globals.mode : 'system'}
    />
  ),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const name = canvas.getByRole('textbox', { name: 'Workspace name' })
    await expect(name.closest('[data-rad-theme]')).toHaveAttribute('data-rad-theme', globals.theme)
    await userEvent.clear(name)
    await userEvent.type(name, 'Our studio')
    const habits = canvas.getByText('02 · How do I keep it useful?', { exact: true })
    await userEvent.click(habits)
    await userEvent.click(canvas.getByRole('button', { name: 'One more tip' }))
    await expect(canvas.getByText('Habit 2.', { exact: true })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Got it' }))
    await expect(habits.closest('summary')).toHaveFocus()
    await userEvent.click(canvas.getByText('01 · Where should I begin?', { exact: true }))
    await expect(name).toHaveValue('Our studio')
  }
}

export const SelectionPlayground: Story = {
  render: (_, { globals }) => (
    <AccordionSelectionExample
      theme={themes.find(theme => theme.id === globals.theme)}
      mode={globals.mode === 'light' || globals.mode === 'dark' ? globals.mode : 'system'}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Add detail' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Quick switch' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'A retained note' })).toBeVisible()
    })
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Allow multiple sections' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Open both' }))
    await expect(canvas.getByText('Rhythm', { exact: true }).closest('details')).toHaveAttribute(
      'open'
    )
    await expect(canvas.getByRole('textbox', { name: 'A retained note' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Close all' }))
    await expect(
      canvas.getByRole('textbox', { name: 'A retained note', hidden: true })
    ).not.toBeVisible()
  }
}
