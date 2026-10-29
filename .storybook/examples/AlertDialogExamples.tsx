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
