import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './Collapsible'
import { Field } from './Field'
import { Input } from './Input'
import { radiantTheme, themes } from './themes/index.js'

function ExclusiveGroup() {
  return (
    <div style={{ display: 'grid', gap: '0.75rem', width: '24rem' }}>
      <Collapsible
        defaultOpen
        name="faq"
      >
        <CollapsibleTrigger>Shipping</CollapsibleTrigger>
        <CollapsibleContent>Ships in two days.</CollapsibleContent>
      </Collapsible>
      <Collapsible name="faq">
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
      style={{ display: 'grid', justifyItems: 'start', gap: '0.75rem', width: '24rem' }}
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
          'A native details element. The summary toggles it. Space and Enter stay with the platform, and a shared name makes a group exclusive.'
      }
    }
  },
  decorators: [
    (Story, { id }) =>
      id.endsWith('--themes') ? (
        <Story />
      ) : (
        <div style={{ ...radiantTheme, width: '24rem' }}>
          <Story />
        </div>
      )
  ]
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Collapsible>
      <CollapsibleTrigger>Shipping</CollapsibleTrigger>
      <CollapsibleContent>
        <p style={{ margin: 0 }}>Ships in two days.</p>
        <button
          style={{ marginTop: '0.75rem' }}
          type="button"
        >
          Track
        </button>
      </CollapsibleContent>
    </Collapsible>
  )
}

export const Open: Story = {
  render: () => (
    <Collapsible defaultOpen>
      <CollapsibleContent>The content can sit before the summary.</CollapsibleContent>
      <CollapsibleTrigger>Already open</CollapsibleTrigger>
    </Collapsible>
  )
}

export const Exclusive: Story = {
  render: () => <ExclusiveGroup />
}

export const Nested: Story = {
  render: () => <NestedSections />
}

export const Form: Story = {
  render: () => <InsideForm />
}

export const Controlled: Story = {
  render: () => <HeldOpen />
}

const themeFrame = (surface: string | undefined): CSSProperties => ({
  display: 'grid',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: '1.25rem',
  background: surface ?? 'oklch(0.985 0.003 250)'
})

export const Themes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {themes.map(theme => (
        <div
          key={theme.name}
          style={{ ...theme.style, ...themeFrame(theme.surface) }}
        >
          <Collapsible defaultOpen>
            <CollapsibleTrigger>{theme.name}</CollapsibleTrigger>
            <CollapsibleContent>
              Panel surface, radius, and corner from the theme.
            </CollapsibleContent>
          </Collapsible>
        </div>
      ))}
    </div>
  )
}
