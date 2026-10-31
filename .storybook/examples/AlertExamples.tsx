import { useState } from 'react'
import { Alert, AlertTitle, AlertDescription, Button } from '../../src/index.js'

export function AlertTonesExample() {
  return (
    <div className="grid gap-4">
      <Alert>
        <AlertTitle>Scheduled maintenance</AlertTitle>
        <AlertDescription>Publishing pauses on Sunday from 02:00 to 03:00 UTC.</AlertDescription>
      </Alert>
      <Alert tone="accent">
        <AlertTitle>Draft saved</AlertTitle>
        <AlertDescription>Your latest changes are stored.</AlertDescription>
      </Alert>
      <Alert tone="warning">
        <AlertTitle>Connection interrupted</AlertTitle>
        <AlertDescription>Your changes remain on this device until you reconnect.</AlertDescription>
      </Alert>
      <Alert tone="danger">
        <AlertTitle>Save failed</AlertTitle>
        <AlertDescription>Try again when your connection returns.</AlertDescription>
      </Alert>
    </div>
  )
}

export function AlertActionExample() {
  const [renewed, setRenewed] = useState(false)
  return (
    <Alert
      tone="warning"
      aria-labelledby="alert-action-title"
    >
      <AlertTitle id="alert-action-title">Your plan ends in 3 days</AlertTitle>
      <AlertDescription>
        {renewed
          ? 'Your plan renews on the next billing date.'
          : 'Renew now to keep access to shared workspaces.'}
      </AlertDescription>
      <div className="flex flex-wrap gap-2">
        <Button
          tone="warning"
          disabled={renewed}
          onClick={() => setRenewed(true)}
        >
          Renew plan
        </Button>
        <Button
          variant="ghost"
          tone="neutral"
        >
          Compare plans
        </Button>
      </div>
    </Alert>
  )
}

export function AlertAnnouncementsExample() {
  const [saved, setSaved] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setSaved(true)}>Save draft</Button>
        <Button
          variant="outline"
          tone="danger"
          onClick={() => setFailed(true)}
        >
          Publish offline
        </Button>
      </div>
      <Alert
        announce="polite"
        tone="accent"
        aria-label="Save result"
      >
        {saved && <AlertDescription>Draft saved. You can keep editing.</AlertDescription>}
      </Alert>
      <Alert
        announce="assertive"
        tone="danger"
        aria-label="Publish result"
      >
        {failed && (
          <AlertDescription>Publish failed. Reconnect, then publish again.</AlertDescription>
        )}
      </Alert>
    </div>
  )
}
