import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CSSProperties, ReactNode } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  InlineCode,
  Input,
  Kbd,
  KbdGroup,
  Link,
  Meter,
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  Progress,
  Radio,
  RadioGroup,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tag,
  Textarea,
  ToggleGroup,
  ToggleGroupItem
} from './index.js'
import { SelectSettingsExample } from '../.storybook/examples/SelectExamples.js'
import { TabsExample } from '../.storybook/examples/TabsExamples.js'
import { TeamTable } from '../.storybook/examples/TableExamples.js'

const meta = {
  title: 'Recipes/Theme showcase',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'One of almost every family on one page. Switch the theme toolbar to compare how each preset carries its shape, depth, type and motion through the whole library.'
      }
    }
  }
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(22rem, 100%), 1fr))',
  gap: '1.5rem',
  padding: '1.5rem',
  alignItems: 'start'
}
const stack = { display: 'grid', gap: '1rem', gridTemplateColumns: 'minmax(0, 1fr)' } as const
const row: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  alignItems: 'center'
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={2}>{title}</CardTitle>
      </CardHeader>
      <CardContent style={stack}>{children}</CardContent>
    </Card>
  )
}

export const Default: Story = {
  render: () => (
    <div style={grid}>
      <Panel title="Actions">
        <div style={row}>
          <Button>Publish</Button>
          <Button variant="soft">Preview</Button>
          <Button variant="outline">Share</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
        <div style={row}>
          <Button tone="neutral">Archive</Button>
          <Button
            tone="danger"
            variant="soft"
          >
            Delete
          </Button>
          <Button
            tone="warning"
            controlSize="small"
          >
            Retry
          </Button>
          <Button pending>Saving</Button>
        </div>
        <ToggleGroup
          aria-label="View"
          defaultValue="board"
        >
          <ToggleGroupItem value="list">List</ToggleGroupItem>
          <ToggleGroupItem value="board">Board</ToggleGroupItem>
          <ToggleGroupItem value="calendar">Calendar</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          aria-label="Density"
          defaultValue="cozy"
          variant="segmented"
        >
          <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
          <ToggleGroupItem value="cozy">Cozy</ToggleGroupItem>
          <ToggleGroupItem value="roomy">Roomy</ToggleGroupItem>
        </ToggleGroup>
      </Panel>

      <Panel title="Fields">
        <Field
          label="Project name"
          description="Shown on invoices."
        >
          <Input defaultValue="Northwind refresh" />
        </Field>
        <Field
          label="Contact email"
          error="Enter an address with an @."
        >
          <Input
            defaultValue="studio.example.com"
            aria-invalid
          />
        </Field>
        <Field label="Notes">
          <Textarea defaultValue="Kick-off on Monday." />
        </Field>
        <SelectSettingsExample />
      </Panel>

      <Panel title="Choices">
        <Checkbox
          label="Email me about replies"
          defaultChecked
        />
        <Checkbox label="Weekly digest" />
        <Switch
          label="Auto-save drafts"
          defaultChecked
        />
        <Switch label="Show line numbers" />
        <RadioGroup
          label="Plan"
          defaultValue="pro"
        >
          <Radio
            label="Free"
            value="free"
          />
          <Radio
            label="Pro"
            value="pro"
          />
        </RadioGroup>
        <Slider
          aria-label="Volume"
          defaultValue={60}
        />
      </Panel>

      <Panel title="Navigation">
        <TabsExample />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#home">Home</BreadcrumbLink>
              <BreadcrumbSeparator />
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Pagination>
          <PaginationList>
            <PaginationItem>
              <PaginationPrevious href="#page-1" />
            </PaginationItem>
            {[1, 2, 3].map(page => (
              <PaginationItem key={page}>
                <PaginationLink
                  href={`#page-${page}`}
                  current={page === 2}
                  aria-label={`Page ${page}`}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#page-3" />
            </PaginationItem>
          </PaginationList>
        </Pagination>
        <p>
          Read the <Link href="#guide">setup guide</Link> or press{' '}
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>{' '}
          to search for <InlineCode>theme</InlineCode>.
        </p>
      </Panel>

      <Panel title="Status">
        <div style={row}>
          <Badge>Draft</Badge>
          <Badge tone="accent">Live</Badge>
          <Badge tone="warning">Review</Badge>
          <Badge tone="danger">Failed</Badge>
          <Tag
            removeLabel="Remove Design"
            onRemove={() => {}}
          >
            Design
          </Tag>
        </div>
        <div style={row}>
          <Avatar
            alt="Jordan Rivera"
            fallback="JR"
          />
          <Avatar
            alt="Sam Lee"
            fallback="SL"
          />
          <Spinner aria-label="Loading" />
          <Skeleton style={{ width: '8rem' }} />
        </div>
        <Progress
          value={64}
          aria-label="Upload"
        />
        <Meter
          value={0.82}
          low={0.25}
          high={0.75}
          optimum={0.2}
          aria-label="Storage used"
        />
        <Alert tone="accent">
          <AlertTitle>Deploy finished</AlertTitle>
          <AlertDescription>Your changes are live on the preview site.</AlertDescription>
        </Alert>
        <Alert tone="danger">
          <AlertTitle>Payment failed</AlertTitle>
          <AlertDescription>Update the card on file to keep publishing.</AlertDescription>
        </Alert>
      </Panel>

      <Panel title="Content">
        <Accordion
          type="single"
          defaultValue="billing"
        >
          <AccordionItem value="billing">
            <AccordionTrigger>Billing</AccordionTrigger>
            <AccordionContent>Invoices go out on the first of the month.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="access">
            <AccordionTrigger>Access</AccordionTrigger>
            <AccordionContent>Owners can invite new members.</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Separator />
        <TeamTable />
      </Panel>

      <Card>
        <CardHeader>
          <CardTitle level={2}>Upgrade to Team</CardTitle>
          <CardDescription>Shared libraries, roles and audit history.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Everything in Pro, for up to twenty members.</p>
        </CardContent>
        <CardFooter>
          <Button>Start trial</Button>
          <Button variant="ghost">Compare plans</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
