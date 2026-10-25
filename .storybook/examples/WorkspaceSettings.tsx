import { useId } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Link
} from '../../src/index.js'
import { ProfileExample, type FormOwner } from './ProfileForm.js'

/** One product composition; its fields/actions reuse the canonical form. */
export function WorkspaceSettings({ owner = 'native' }: { owner?: FormOwner }) {
  const privacyId = useId()
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--rad-spacing-group-gap)',
        width: 'min(36rem, calc(100vw - 2rem))',
        maxWidth: '100%'
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Workspace settings</CardTitle>
          <CardDescription>
            Manage your profile and learn how your preferences are used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion defaultValue="profile">
            <AccordionItem value="profile">
              <AccordionTrigger>Profile</AccordionTrigger>
              <AccordionContent>
                <ProfileExample
                  owner={owner}
                  placement="dialog"
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="privacy">
              <AccordionTrigger>Privacy</AccordionTrigger>
              <AccordionContent>
                <Collapsible>
                  <CollapsibleTrigger>Data retention</CollapsibleTrigger>
                  <CollapsibleContent>
                    Profile preferences stay until you change or reset them.
                  </CollapsibleContent>
                </Collapsible>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter>
          <Link href={`#${privacyId}`}>Read the privacy note</Link>
        </CardFooter>
      </Card>
      <section
        id={privacyId}
        tabIndex={-1}
        aria-label="Privacy note"
        className="target:[outline:var(--rad-focus-width)_var(--rad-focus-style)_var(--rad-color-focus)] target:[outline-offset:var(--rad-focus-offset)]"
      >
        Privacy note: product updates are optional. Your selected plan and email are included when
        you save.
      </section>
    </div>
  )
}
