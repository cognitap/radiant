import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsProps
} from '../../src/index.js'

type ExampleProps = Partial<
  Pick<
    TabsProps,
    'activationMode' | 'orientation' | 'loop' | 'disabled' | 'controlSize' | 'style' | 'dir'
  >
> & { disabledActivity?: boolean }

const steps = ['account', 'billing', 'review']

export function TabsControlledExample() {
  const [step, setStep] = useState('account')
  const next = steps[steps.indexOf(step) + 1]
  return (
    <Tabs
      value={step}
      onValueChange={setStep}
      style={{ maxWidth: '40rem' }}
    >
      <TabsList aria-label="Checkout steps">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="review">Review</TabsTrigger>
      </TabsList>
      {steps.map(value => (
        <TabsContent
          key={value}
          value={value}
        >
          <p>Current step: {value}</p>
          {next ? <Button onClick={() => setStep(next)}>Continue to {next}</Button> : null}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export function TabsDisabledExample() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <TabsExample disabledActivity />
      <TabsExample disabled />
    </div>
  )
}

export function TabsOverflowExample() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August']
  return (
    <Tabs
      defaultValue="January"
      style={{ maxWidth: '20rem' }}
    >
      <TabsList aria-label="Monthly reports">
        {months.map(month => (
          <TabsTrigger
            key={month}
            value={month}
          >
            {month}
          </TabsTrigger>
        ))}
      </TabsList>
      {months.map(month => (
        <TabsContent
          key={month}
          value={month}
        >
          {month} report
        </TabsContent>
      ))}
    </Tabs>
  )
}

export function TabsExample({ disabledActivity = false, ...props }: ExampleProps) {
  return (
    <Tabs
      defaultValue="overview"
      {...props}
      style={{ maxWidth: '40rem', ...props.style }}
    >
      <TabsList aria-label="Project sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger
          value="activity"
          disabled={disabledActivity}
        >
          Activity
        </TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <h3>Make space for a good idea</h3>
        <p>Collect the notes, decisions and next steps that move your project forward.</p>
      </TabsContent>
      <TabsContent value="activity">
        <h3>A little progress, every day</h3>
        <p>Your team's latest changes and conversations appear here.</p>
      </TabsContent>
      <TabsContent value="files">
        <h3>Keep the useful things close</h3>
        <p>Bring your briefs, sketches and working files together.</p>
        <Button
          variant="outline"
          tone="neutral"
        >
          Browse files
        </Button>
      </TabsContent>
    </Tabs>
  )
}

export function TabsWorkspaceExample() {
  const [section, setSection] = useState('general')
  const [feedback, setFeedback] = useState('No changes saved')
  return (
    <Card style={{ maxWidth: '40rem', minWidth: 0 }}>
      <CardHeader>
        <CardTitle>Your workspace, your way</CardTitle>
        <CardDescription>A few details that make a place feel like yours.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          aria-label="Workspace settings"
          style={{ display: 'grid', gap: '1.5rem', minWidth: 0 }}
          onSubmit={event => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            setFeedback(
              `Saved locally: ${data.get('workspace')}; desktop notifications ${data.has('desktop') ? 'on' : 'off'}.`
            )
          }}
          onReset={() => setFeedback('Preferences reset')}
        >
          <Tabs
            value={section}
            onValueChange={setSection}
          >
            <TabsList aria-label="Workspace settings sections">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>
            <TabsContent
              value="general"
              keepMounted
            >
              <Field
                label="Workspace name"
                description="The name your team sees."
              >
                <Input
                  name="workspace"
                  defaultValue="Studio"
                />
              </Field>
            </TabsContent>
            <TabsContent
              value="notifications"
              keepMounted
            >
              <Field
                label="Desktop notifications"
                description="Show a notification when someone mentions you."
                style={{ gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center' }}
                parts={{ description: { style: { gridColumn: '1 / -1' } } }}
              >
                <Switch
                  name="desktop"
                  value="enabled"
                  defaultChecked
                />
              </Field>
            </TabsContent>
            <TabsContent
              value="members"
              keepMounted
            >
              <p>Good work is better together.</p>
              <Button
                variant="outline"
                tone="neutral"
                onClick={() => setFeedback('Invitation flow opened locally')}
              >
                Invite a teammate
              </Button>
            </TabsContent>
          </Tabs>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
            <Button type="submit">Save preferences</Button>
            <Button
              type="reset"
              variant="outline"
              tone="neutral"
            >
              Reset preferences
            </Button>
          </div>
          <output style={{ overflowWrap: 'anywhere' }}>{feedback}</output>
        </form>
      </CardContent>
    </Card>
  )
}

export function TabsSizeComparison() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {(['small', 'medium', 'large'] as const).map(controlSize => (
        <TabsExample
          key={controlSize}
          controlSize={controlSize}
        />
      ))}
    </div>
  )
}
