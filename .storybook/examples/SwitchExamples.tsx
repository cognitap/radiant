import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Switch,
  type ControlSize
} from '../../src/index.js'

export function SwitchSettingsExample() {
  const [quiet, setQuiet] = useState(false)
  const [feedback, setFeedback] = useState('No changes saved')
  return (
    <Card style={{ maxWidth: '36rem', minWidth: 0 }}>
      <CardHeader>
        <CardTitle>Make room for focus</CardTitle>
        <CardDescription>Choose how your workspace gets your attention.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          aria-label="Workspace preferences"
          style={{ display: 'grid', gap: '1.5rem', minWidth: 0 }}
          onReset={() => {
            setQuiet(false)
            setFeedback('Preferences reset')
          }}
          onSubmit={event => {
            event.preventDefault()
            const values = new FormData(event.currentTarget)
            setFeedback(
              `Saved locally: do not disturb ${values.has('quiet') ? 'on' : 'off'}; desktop notifications ${values.has('desktop') ? 'on' : 'off'}.`
            )
          }}
        >
          <Field
            label="Do not disturb"
            description="Silence workspace notifications while you focus."
            style={{ gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center' }}
            parts={{ description: { style: { gridColumn: '1 / -1' } } }}
          >
            <Switch
              name="quiet"
              value="enabled"
              checked={quiet}
              onChange={event => setQuiet(event.target.checked)}
            />
          </Field>
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
          <output>
            {quiet ? 'Your workspace is quiet.' : 'Workspace notifications are active.'}
          </output>
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

export function SwitchSizeComparison() {
  const sizes: ControlSize[] = ['small', 'medium', 'large']
  return (
    <div style={{ display: 'grid', gap: '1.5rem', minWidth: 0 }}>
      {sizes.map(controlSize => (
        <div
          key={controlSize}
          style={{ display: 'grid', gap: '.75rem', minWidth: 0 }}
        >
          <Switch
            label={`${controlSize} notifications`}
            controlSize={controlSize}
            defaultChecked
          />
          <Checkbox
            label={`${controlSize} include a summary in the next export`}
            controlSize={controlSize}
            defaultChecked
          />
        </div>
      ))}
    </div>
  )
}
