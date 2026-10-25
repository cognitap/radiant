import { useId, useState } from 'react'
import { ShipmentTracking } from '../.storybook/examples/ShipmentTracking.js'
import { expect, userEvent, within } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Field,
  Input,
  type ThemeStyle
} from './index.js'

function ExclusiveGroup() {
  const name = useId()
  return (
    <div
      style={{
        display: 'grid',
        gap: '0.75rem',
        width: 'min(24rem, calc(100vw - 2rem))',
        maxWidth: '100%'
      }}
    >
      <Collapsible
        defaultOpen
        name={name}
      >
        <CollapsibleTrigger>Shipping</CollapsibleTrigger>
        <CollapsibleContent>Ships in two days.</CollapsibleContent>
      </Collapsible>
      <Collapsible name={name}>
        <CollapsibleTrigger>Returns</CollapsibleTrigger>
        <CollapsibleContent>Returns are free for 30 days.</CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function NestedSections() {
  return (
    <Collapsible>
      <CollapsibleTrigger>Account</CollapsibleTrigger>
      <CollapsibleContent>
        <Collapsible>
          <CollapsibleTrigger>Password</CollapsibleTrigger>
          <CollapsibleContent>Use at least 10 characters.</CollapsibleContent>
        </Collapsible>
      </CollapsibleContent>
    </Collapsible>
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
      style={{
        display: 'grid',
        justifyItems: 'start',
        gap: '0.75rem',
        width: 'min(24rem, calc(100vw - 2rem))',
        maxWidth: '100%'
      }}
    >
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Note</CollapsibleTrigger>
        <CollapsibleContent>
          <Field label="Note">
            <Input
              defaultValue="Pack the blue set"
              name="note"
            />
          </Field>
        </CollapsibleContent>
      </Collapsible>
      <Button type="submit">Save</Button>
      <p style={{ margin: 0 }}>{summary}</p>
    </form>
  )
}

function HeldOpen() {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible
      onOpenChange={setOpen}
      open={open}
    >
      <CollapsibleTrigger>Details</CollapsibleTrigger>
      <CollapsibleContent>Shown only while open is true.</CollapsibleContent>
    </Collapsible>
  )
}

const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
  parameters: {
    docs: {
      description: {
        component:
          'A native `<details>` root with CollapsibleTrigger as `<summary>` and CollapsibleContent as its panel. Root className/style/ref target details; part props target their host elements. Slots are collapsible, collapsible-trigger and collapsible-content. open/onOpenChange control state; defaultOpen initializes it, and name uses native exclusive grouping.'
      }
    }
  }
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Shipping', { exact: true }))
    await userEvent.click(canvas.getByRole('button', { name: 'Track' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Tracking update:')
  },
  render: () => (
    <Collapsible>
      <CollapsibleTrigger>Shipping</CollapsibleTrigger>
      <CollapsibleContent>
        <ShipmentTracking />
      </CollapsibleContent>
    </Collapsible>
  )
}

export const States: Story = {
  render: () => (
    <Collapsible defaultOpen>
      <CollapsibleContent>The content can sit before the summary.</CollapsibleContent>
      <CollapsibleTrigger>Already open</CollapsibleTrigger>
    </Collapsible>
  )
}

export const Composition: Story = { render: () => <InsideForm /> }

export const Customisation: Story = {
  render: () => {
    const local: ThemeStyle = { '--rad-collapsible-padding': '1.5rem' }
    return (
      <Collapsible
        defaultOpen
        style={local}
      >
        <CollapsibleTrigger>Roomier panel</CollapsibleTrigger>
        <CollapsibleContent>Local padding preserves the current theme.</CollapsibleContent>
      </Collapsible>
    )
  }
}

export const Exclusive: Story = {
  render: () => <ExclusiveGroup />
}

export const Nested: Story = {
  render: () => <NestedSections />
}

export const Controlled: Story = {
  render: () => <HeldOpen />
}
