import { useEffect, useId, useRef, useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Checkbox,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  Field,
  Input,
  type ButtonProps
} from '../../src/index.js'
import { MotionProvider, MotionLink } from '../../src/motion/react.js'

export function ButtonPlayground(args: ButtonProps) {
  const [activations, setActivations] = useState(0)
  const [motionOff, setMotionOff] = useState(false)
  const id = useId()
  return (
    <MotionProvider>
      <Card style={{ width: 'min(42rem, calc(100vw - 2rem))', maxWidth: '100%' }}>
        <CardHeader>
          <CardDescription>THE ACTION LAB</CardDescription>
          <CardTitle>Small action. Satisfying feedback.</CardTitle>
          <CardDescription>
            Press and hold, release, then press again before the spring settles. Try Enter or Space.
          </CardDescription>
        </CardHeader>
        <CardContent style={{ display: 'grid', gap: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              minHeight: '12rem',
              padding: '1.5rem',
              border: '1px dashed var(--rad-color-border)',
              borderRadius: 'var(--rad-control-radius)',
              background: 'color-mix(in oklab, var(--rad-color-accent) 5%, transparent)'
            }}
          >
            <Button
              {...args}
              motion={motionOff ? 'off' : args.motion}
              onClick={event => {
                args.onClick?.(event)
                if (!event.defaultPrevented) setActivations(count => count + 1)
              }}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <Checkbox
              label="Turn off spatial motion"
              checked={motionOff}
              onChange={event => setMotionOff(event.target.checked)}
            />
            <output aria-live="polite">
              {activations} {activations === 1 ? 'action' : 'actions'} completed
            </output>
          </div>
          <CardDescription>
            Use Controls for treatment, tone, size, pending and disabled states. Theme and Mode live
            in the toolbar. Your system’s reduced-motion preference always takes priority.
          </CardDescription>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            tone="neutral"
            motion="off"
            onClick={() => setActivations(0)}
          >
            Reset count · motion off
          </Button>
          <MotionLink
            href={`#${id}`}
            variant="soft"
            tone="neutral"
            motion={motionOff ? 'off' : args.motion}
          >
            Same spring, native link
          </MotionLink>
          <span id={id}>Actions and navigation share one design language.</span>
        </CardFooter>
      </Card>
    </MotionProvider>
  )
}

export function SaveChanges(args: ButtonProps) {
  const form = useRef<HTMLFormElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saving, setSaving] = useState(false)
  const [fail, setFail] = useState(false)
  const [message, setMessage] = useState('Your workspace is ready for a fresh name.')
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    []
  )

  return (
    <MotionProvider>
      <Card style={{ width: 'min(32rem, calc(100vw - 2rem))', maxWidth: '100%' }}>
        <CardHeader>
          <CardDescription>WORKSPACE / GENERAL</CardDescription>
          <CardTitle>Make it yours.</CardTitle>
          <CardDescription>
            Save a change or discard a draft. Pending keeps the action focused and named.
          </CardDescription>
        </CardHeader>
        <form
          ref={form}
          style={{ display: 'grid', gap: '1.5rem' }}
          onReset={() => setMessage('Draft discarded. Your original workspace name is restored.')}
          onSubmit={event => {
            event.preventDefault()
            if (timer.current !== null) return
            const name = String(new FormData(event.currentTarget).get('workspace'))
            setSaving(true)
            setMessage('Saving workspace…')
            // Replace this simulated request with your application's persistence call.
            timer.current = setTimeout(() => {
              timer.current = null
              setSaving(false)
              setMessage(
                fail
                  ? 'Could not save. Turn off the failure option and try again.'
                  : `Saved “${name}”.`
              )
            }, 900)
          }}
        >
          <CardContent style={{ display: 'grid', gap: '1rem' }}>
            <Field
              label="Workspace name"
              description="This name appears in your team's dashboard."
              required
            >
              <Input
                name="workspace"
                defaultValue="Orbit Studio"
                autoComplete="organization"
                disabled={saving}
              />
            </Field>
            <Checkbox
              label="Simulate a failed request"
              checked={fail}
              onChange={event => setFail(event.target.checked)}
              disabled={saving}
            />
            <output
              aria-live="polite"
              style={{ margin: 0, minHeight: '3em' }}
            >
              {message}
            </output>
          </CardContent>
          <CardFooter>
            <Button
              {...args}
              type="submit"
              pending={saving || args.pending}
            >
              Save changes
            </Button>
            <Dialog>
              <DialogTrigger
                variant="ghost"
                tone="neutral"
                disabled={saving}
              >
                Discard draft
              </DialogTrigger>
              <DialogContent style={{ width: 'min(26rem, calc(100vw - 2rem))' }}>
                <DialogTitle>Discard your draft?</DialogTitle>
                <DialogDescription>
                  The workspace name will return to Orbit Studio.
                </DialogDescription>
                <div
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', marginTop: '1.5rem' }}
                >
                  <DialogClose
                    variant="outline"
                    tone="neutral"
                  >
                    Keep editing
                  </DialogClose>
                  <DialogClose
                    tone="danger"
                    onClick={() => form.current?.reset()}
                  >
                    Discard changes
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </form>
      </Card>
    </MotionProvider>
  )
}
