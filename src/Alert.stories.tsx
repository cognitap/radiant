import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert, AlertTitle, AlertDescription, Button } from './index.js'
const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    docs: {
      description: {
        component:
          'Inline feedback with independent tone and urgency. Static content is ordinary content by default (announce=off). Polite feedback uses role=status; assertive feedback uses role=alert, relying on their implicit live/atomic semantics. Keep a live region mounted before updating its message. Alert never steals focus, dismisses itself or replays unchanged text. Applications own meaningful messages, optional names, recovery actions and announcement frequency. Use explicit text for success/warning/error meaning; color is supplementary. Named static content becomes a group. Choose AlertTitle level for the surrounding outline; parts forward native props, styles and refs.'
      }
    }
  }
} satisfies Meta<typeof Alert>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Scheduled maintenance</AlertTitle>
      <AlertDescription>
        Editing is available. Publishing pauses while maintenance runs.
      </AlertDescription>
    </Alert>
  )
}
export const StatusAndErrors: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Alert tone="accent">
        <AlertTitle>Draft saved</AlertTitle>
        <AlertDescription>Your latest changes are stored.</AlertDescription>
      </Alert>
      <Alert tone="warning">
        <AlertTitle>Connection interrupted</AlertTitle>
        <AlertDescription>Your changes remain on this device.</AlertDescription>
      </Alert>
      <Alert tone="danger">
        <AlertTitle>Save failed</AlertTitle>
        <AlertDescription>Try again when your connection returns.</AlertDescription>
      </Alert>
    </div>
  )
}
export const Customisation: Story = {
  render: () => (
    <Alert
      style={{
        '--rad-alert-radius': '1.5rem',
        '--rad-alert-padding': '2rem',
        '--rad-alert-title-size': '1.5rem'
      }}
    >
      <AlertTitle level={3}>A quieter notice</AlertTitle>
      <AlertDescription>A local treatment with the same content semantics.</AlertDescription>
    </Alert>
  )
}
function Feedback() {
  const [saved, setSaved] = useState(false)
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Button onClick={() => setSaved(true)}>Save draft</Button>
      <Alert
        announce="polite"
        tone="accent"
        aria-label="Save result"
      >
        {saved && <AlertDescription>Draft saved. You can keep editing.</AlertDescription>}
      </Alert>
    </div>
  )
}
export const DynamicFeedback: Story = { render: () => <Feedback /> }
