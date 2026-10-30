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
  Slider
} from '../../src/index.js'

export function SliderControlledExample() {
  const [brightness, setBrightness] = useState(70)
  return (
    <div style={{ display: 'grid', gap: '.75rem', maxWidth: '32rem', minWidth: 0 }}>
      <Field label="Screen brightness">
        <Slider
          value={brightness}
          min={0}
          max={100}
          step={10}
          aria-valuetext={`${brightness} percent`}
          onChange={event => setBrightness(event.target.valueAsNumber)}
        />
      </Field>
      <p style={{ margin: 0 }}>Brightness: {brightness}%</p>
      <div>
        <Button
          variant="outline"
          tone="neutral"
          onClick={() => setBrightness(70)}
        >
          Restore default
        </Button>
      </div>
    </div>
  )
}

export function SliderStepsExample() {
  return (
    <Field
      label="Playback speed"
      description="Quarter-speed steps, from half to double speed."
      style={{ maxWidth: '32rem' }}
    >
      <Slider
        name="speed"
        min={0.5}
        max={2}
        step={0.25}
        defaultValue={1}
      />
      <div
        aria-hidden="true"
        style={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <span>0.5×</span>
        <span>1×</span>
        <span>1.5×</span>
        <span>2×</span>
      </div>
    </Field>
  )
}

export function SliderSettingsExample() {
  const [volume, setVolume] = useState(50)
  const [feedback, setFeedback] = useState('No changes saved')
  return (
    <Card style={{ maxWidth: '36rem', minWidth: 0 }}>
      <CardHeader>
        <CardTitle>Find your balance</CardTitle>
        <CardDescription>Make your workspace sound right for you.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          aria-label="Listening preferences"
          style={{ display: 'grid', gap: '1.5rem', minWidth: 0 }}
          onSubmit={event => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            setFeedback(
              `Saved locally: volume ${data.get('volume')}%; chime ${data.get('chime')}%.`
            )
          }}
          onReset={() => {
            setVolume(50)
            setFeedback('Preferences reset')
          }}
        >
          <Field
            label="Workspace volume"
            description="Set the volume for workspace audio."
          >
            <Slider
              name="volume"
              value={volume}
              min={0}
              max={100}
              step={5}
              aria-valuetext={`${volume} percent`}
              onChange={event => setVolume(event.target.valueAsNumber)}
            />
            <span aria-hidden="true">{volume}%</span>
          </Field>
          <Field
            label="Notification chime"
            description="Choose how loudly new notifications arrive."
          >
            <Slider
              name="chime"
              defaultValue={30}
              min={0}
              max={100}
              step={5}
            />
          </Field>
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

export function SliderSizeComparison() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '32rem', minWidth: 0 }}>
      {(['small', 'medium', 'large'] as const).map(controlSize => (
        <div
          key={controlSize}
          style={{ display: 'grid', gap: '.75rem' }}
        >
          <Field label={`${controlSize} volume`}>
            <Slider
              defaultValue={40}
              controlSize={controlSize}
            />
          </Field>
          <Field label={`${controlSize} title`}>
            <Input
              defaultValue="Workspace audio"
              controlSize={controlSize}
            />
          </Field>
        </div>
      ))}
    </div>
  )
}
