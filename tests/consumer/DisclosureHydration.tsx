import { useEffect, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  useAccordion,
  useCollapsible
} from '@cognitap/radiant'
import { MotionProvider } from '@cognitap/radiant/motion/react'

export const hydrationCases = [
  'local-closed',
  'local-open',
  'held-closed',
  'held-open',
  'local-roundtrip',
  'local-queued',
  'local-unchanged',
  'accordion-single-local',
  'accordion-multiple-local',
  'accordion-single-held',
  'accordion-multiple-held'
] as const
export type HydrationCase = (typeof hydrationCases)[number]
function Owned() {
  return <output data-owned={String(useCollapsible()?.open)} />
}
function Selected() {
  return <output data-selection={JSON.stringify(useAccordion()?.value)} />
}

export function DisclosureHydration({ scenario }: { scenario: HydrationCase }) {
  const [changes, setChanges] = useState<unknown[]>([])
  const notify = (value: unknown) => setChanges(current => [...current, value])
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true'
  }, [])
  const initial =
    scenario === 'local-open' || scenario === 'held-open' || scenario === 'local-unchanged'
  const held = scenario.startsWith('held-') || scenario.endsWith('-held')
  const multiple = scenario.includes('-multiple-')
  const items = (
    <>
      <AccordionItem value="a">
        <AccordionTrigger>A</AccordionTrigger>
        <AccordionContent>
          <input
            aria-label="Draft A"
            name="a"
            defaultValue="A"
          />
          <Owned />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>B</AccordionTrigger>
        <AccordionContent>
          <input
            aria-label="Draft B"
            name="b"
            defaultValue="B"
          />
          <Owned />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem
        value="disabled"
        disabled
      >
        <AccordionTrigger>Unavailable</AccordionTrigger>
        <AccordionContent>Disabled</AccordionContent>
      </AccordionItem>
      <Selected />
    </>
  )
  return (
    <MotionProvider>
      <main>
        <h1>Disclosure hydration</h1>
        <form
          aria-label="Retained drafts"
          onSubmit={event => event.preventDefault()}
        >
          {scenario.startsWith('accordion-') ? (
            multiple ? (
              <Accordion
                type="multiple"
                {...(held ? { value: ['a'] } : { defaultValue: ['a'] })}
                onValueChange={notify}
              >
                {items}
              </Accordion>
            ) : (
              <Accordion
                {...(held ? { value: 'a' } : { defaultValue: 'a' })}
                onValueChange={notify}
              >
                {items}
              </Accordion>
            )
          ) : (
            <Collapsible
              {...(held ? { open: initial } : { defaultOpen: initial })}
              onOpenChange={notify}
            >
              <CollapsibleTrigger>Details</CollapsibleTrigger>
              <CollapsibleContent>
                <input
                  aria-label="Draft"
                  name="draft"
                  defaultValue="Initial"
                />
                <Owned />
              </CollapsibleContent>
            </Collapsible>
          )}
          <button type="submit">Save</button>
        </form>
        <output data-changes={JSON.stringify(changes)} />
      </main>
    </MotionProvider>
  )
}
