import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Link,
  Radio,
  RadioGroup
} from '../../src/index.js'

/** One production-component specimen, shared with the packed consumer gate. */
export function TypographyComponents() {
  return (
    <section
      data-testid="type-components"
      style={{ maxWidth: '40rem', display: 'grid', gap: '1rem' }}
    >
      <Card>
        <CardHeader>
          <CardTitle data-testid="component-title">
            A longer workspace title that can wrap
          </CardTitle>
          <CardDescription data-testid="component-supporting">
            Supporting information stays connected to its title.
          </CardDescription>
        </CardHeader>
        <CardContent data-testid="component-body">
          Shared interface copy with an{' '}
          <Link
            href="#component-footer"
            data-testid="component-inline"
          >
            inline link
          </Link>
          .
        </CardContent>
      </Card>
      <Field
        label="Workspace name"
        description="Visible to the whole team."
        error="Choose a different name."
      >
        <Input defaultValue="Studio" />
      </Field>
      {(['small', 'medium', 'large'] as const).map(controlSize => (
        <div
          key={controlSize}
          data-testid={`component-${controlSize}`}
          style={{ display: 'grid', minWidth: 0, gap: '0.5rem' }}
        >
          <Button controlSize={controlSize}>Save changes</Button>
          <Link
            href="#component-footer"
            variant="outline"
            controlSize={controlSize}
          >
            Visit workspace
          </Link>
          <Input
            controlSize={controlSize}
            aria-label={`${controlSize} input`}
            defaultValue="A useful value"
          />
          <Checkbox
            controlSize={controlSize}
            label="A longer notification preference that wraps when the container gets narrow"
          />
          <RadioGroup
            controlSize={controlSize}
            name={`type-${controlSize}`}
            label={`${controlSize} plan`}
            defaultValue="studio"
          >
            <Radio
              value="studio"
              label="Studio plan with room for the whole team"
            />
          </RadioGroup>
        </div>
      ))}
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Disclosure label</CollapsibleTrigger>
        <CollapsibleContent>Disclosure content uses the interface body rhythm.</CollapsibleContent>
      </Collapsible>
      <Accordion defaultValue="typography">
        <AccordionItem value="typography">
          <AccordionTrigger>Typography section</AccordionTrigger>
          <AccordionContent>Accordion reuses the disclosure roles.</AccordionContent>
        </AccordionItem>
      </Accordion>
      <Dialog
        defaultOpen
        modal={false}
      >
        <DialogContent style={{ position: 'relative', margin: 0 }}>
          <DialogTitle>Review the workspace</DialogTitle>
          <DialogDescription>Dialog supporting information.</DialogDescription>
          <p>Dialog body copy.</p>
        </DialogContent>
      </Dialog>
      <CardTitle
        className="type-app-override text-3xl leading-loose font-mono font-bold tracking-wide"
        data-testid="component-caller"
      >
        Caller typography wins
      </CardTitle>
      <CardTitle
        style={{ '--rad-card-title-size': '27px', '--rad-card-title-weight': 725 }}
        data-testid="component-exception"
      >
        A deliberate local exception
      </CardTitle>
      <footer id="component-footer">Component specimen</footer>
    </section>
  )
}
