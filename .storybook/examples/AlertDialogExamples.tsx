import { useEffect, useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button
} from '../../src/index.js'

export function DeleteProjectExample() {
  const [open, setOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const summary = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    // The invoking button disappears after deletion; the application chooses the next stop.
    if (deleted) summary.current?.focus()
  }, [deleted])

  return (
    <div className="grid max-w-md gap-4">
      <p
        ref={summary}
        tabIndex={-1}
      >
        {deleted ? 'Project deleted. Your other projects are unchanged.' : 'Project: Summer launch'}
      </p>
      {deleted ? (
        <Button
          variant="outline"
          tone="neutral"
          onClick={() => setDeleted(false)}
        >
          Restore example
        </Button>
      ) : (
        <AlertDialog
          open={open}
          onOpenChange={setOpen}
        >
          <AlertDialogTrigger
            tone="danger"
            variant="outline"
          >
            Delete project
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Delete Summer launch?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the project and its files for everyone. This cannot be
              undone.
            </AlertDialogDescription>
            <div className="flex flex-wrap justify-end gap-3">
              <AlertDialogCancel
                variant="outline"
                tone="neutral"
              >
                Keep project
              </AlertDialogCancel>
              <AlertDialogAction
                tone="danger"
                onClick={() => {
                  setOpen(false)
                  setDeleted(true)
                }}
              >
                Delete permanently
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export function AsyncActionExample({
  defaultOpen = false,
  revoke = () => wait(1500)
}: {
  defaultOpen?: boolean
  revoke?: () => Promise<void>
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [pending, setPending] = useState(false)
  const [revoked, setRevoked] = useState(false)

  return (
    <div className="grid max-w-md justify-items-start gap-4">
      <p>{revoked ? 'Access revoked for Ana Lopez.' : 'Ana Lopez can edit Summer launch.'}</p>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        closeOnEscape={!pending}
      >
        <AlertDialogTrigger
          tone="danger"
          variant="outline"
          disabled={revoked}
        >
          Revoke access
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Revoke Ana’s access?</AlertDialogTitle>
          <AlertDialogDescription>
            Ana loses access to Summer launch immediately. You can invite her again later.
          </AlertDialogDescription>
          <div className="flex flex-wrap justify-end gap-3">
            <AlertDialogCancel
              variant="outline"
              tone="neutral"
              disabled={pending}
            >
              Keep access
            </AlertDialogCancel>
            <AlertDialogAction
              tone="danger"
              pending={pending}
              onClick={async event => {
                event.preventDefault()
                setPending(true)
                await revoke()
                setPending(false)
                setRevoked(true)
                setOpen(false)
              }}
            >
              Revoke access
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function ControlledExample({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [signedOut, setSignedOut] = useState(false)

  return (
    <div className="grid max-w-md justify-items-start gap-4">
      <p>
        {signedOut ? 'Signed out of 2 other devices.' : 'Signed in on 3 devices.'} The dialog is{' '}
        {open ? 'open' : 'closed'}.
      </p>
      <Button
        variant="outline"
        tone="neutral"
        onClick={() => setOpen(true)}
      >
        Sign out other devices
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Sign out other devices?</AlertDialogTitle>
          <AlertDialogDescription>
            Your other sessions end now. This device stays signed in.
          </AlertDialogDescription>
          <div className="flex flex-wrap justify-end gap-3">
            <AlertDialogCancel
              variant="outline"
              tone="neutral"
            >
              Stay signed in
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => setSignedOut(true)}>Sign out</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
