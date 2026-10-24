import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion'
import { Button } from './Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './Collapsible'
import { Field } from './Field'
import { Input } from './Input'
import { ThemeScope } from './ThemeScope'
import { radiant, themes } from './themes/index.js'

function ShippingSections({ multiple = false }: { multiple?: boolean }) {
  const sections = (
    <>
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>
          <p style={{ margin: 0 }}>Ships in two days.</p>
          <button
            style={{ marginTop: '0.75rem' }}
            type="button"
          >
            Track
          </button>
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
          'Labeled sections built from Collapsible. Single mode keeps one section open. Multiple mode toggles each section on its own. The summary remains the trigger.'
      }
    }
  },
  decorators: [
    (Story, { id }) =>
      id.endsWith('--themes') ? (
        <Story />
      ) : (
        <ThemeScope
          theme={radiant}
          style={{ width: '24rem' }}
        >
          <Story />
        </ThemeScope>
      )
  ]
} satisfies Meta<{
  type?: 'single'
  value?: string | null
  defaultValue?: string | null
  disabled?: boolean
  onValueChange?: (value: string | null) => void
}>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <ShippingSections />
}

export const Multiple: Story = {
  render: () => <ShippingSections multiple />
}

export const Disabled: Story = {
  render: () => <DisabledSection />
}

export const Controlled: Story = {
  render: () => <HeldValue />
}

export const Form: Story = {
  render: () => <InsideForm />
}

export const Nested: Story = {
  render: () => <NestedSection />
}

const themeFrame = (): CSSProperties => ({
  display: 'grid',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: '1.25rem'
})

export const Themes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {themes.map(theme => (
        <ThemeScope
          key={theme.id}
          theme={theme}
          style={{ ...themeFrame() }}
        >
          <Accordion defaultValue="one">
            <AccordionItem value="one">
              <AccordionTrigger>{theme.name}</AccordionTrigger>
              <AccordionContent>Panel surface, radius, and corner from the theme.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="two">
              <AccordionTrigger>Second</AccordionTrigger>
              <AccordionContent>Another section in the same group.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </ThemeScope>
      ))}
    </div>
  )
}
