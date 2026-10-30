import { useRef, useState } from 'react'
import {
  Button,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose
} from '../../src/index.js'

const inline = { position: 'relative', inset: 'auto', marginTop: '1rem' } as const

export function ToastSuccessExample() {
  const [open, setOpen] = useState(false)
  return (
    <ToastProvider duration={5000}>
      <Button onClick={() => setOpen(true)}>Save draft</Button>
      <ToastViewport style={inline}>
        <Toast
          open={open}
          onOpenChange={setOpen}
        >
          <ToastTitle>Draft saved</ToastTitle>
          <ToastDescription>Your latest edits are stored.</ToastDescription>
        </Toast>
      </ToastViewport>
    </ToastProvider>
  )
}

const reports = ['Quarterly report', 'Hiring plan', 'Launch checklist']

export function ToastUndoExample({ initialOpen = false }: { initialOpen?: boolean }) {
  const [items, setItems] = useState(initialOpen ? reports.slice(1) : reports)
  const [deleted, setDeleted] = useState<string | null>(initialOpen ? reports[0] : null)
  const [open, setOpen] = useState(initialOpen)
  return (
    <ToastProvider>
      <ul className="m-0 grid gap-2 p-0 list-none">
        {items.map(item => (
          <li
            key={item}
            className="flex items-center justify-between gap-4"
          >
            {item}
            <Button
              variant="outline"
              tone="danger"
              aria-label={`Delete ${item}`}
              onClick={() => {
                setItems(values => values.filter(value => value !== item))
                setDeleted(item)
                setOpen(true)
              }}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
      <ToastViewport style={inline}>
        <Toast
          open={open}
          onOpenChange={setOpen}
        >
          <ToastTitle>{deleted} deleted</ToastTitle>
          <div className="flex gap-2">
            <ToastAction
              altText="Undo is available in Notifications, reached with F8."
              variant="outline"
              onClick={() => {
                if (deleted) setItems(values => [...values, deleted])
                setDeleted(null)
              }}
            >
              Undo
            </ToastAction>
            <ToastClose
              variant="ghost"
              tone="neutral"
            >
              Dismiss
            </ToastClose>
          </div>
        </Toast>
      </ToastViewport>
    </ToastProvider>
  )
}

export function ToastErrorExample({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen)
  return (
    <ToastProvider>
      <Button onClick={() => setOpen(true)}>Upload invoice</Button>
      <ToastViewport style={inline}>
        <Toast
          open={open}
          onOpenChange={setOpen}
          tone="danger"
          announce="assertive"
        >
          <ToastTitle>Upload failed</ToastTitle>
          <ToastDescription>The connection dropped before invoice.pdf finished.</ToastDescription>
          <div className="flex gap-2">
            <ToastAction
              altText="Retry the upload from Notifications, reached with F8."
              tone="danger"
            >
              Retry
            </ToastAction>
            <ToastClose
              variant="ghost"
              tone="neutral"
            >
              Dismiss
            </ToastClose>
          </div>
        </Toast>
      </ToastViewport>
    </ToastProvider>
  )
}

export function ToastControlledExample() {
  const [open, setOpen] = useState(false)
  return (
    <ToastProvider>
      <div className="flex items-center gap-4">
        <Button onClick={() => setOpen(value => !value)}>
          {open ? 'Hide' : 'Show'} sync status
        </Button>
        <output>Toast is {open ? 'open' : 'closed'}.</output>
      </div>
      <ToastViewport style={inline}>
        <Toast
          open={open}
          onOpenChange={setOpen}
        >
          <ToastTitle>Sync paused</ToastTitle>
          <ToastDescription>Changes will upload when you reconnect.</ToastDescription>
          <ToastClose
            variant="ghost"
            tone="neutral"
          >
            Dismiss
          </ToastClose>
        </Toast>
      </ToastViewport>
    </ToastProvider>
  )
}

export function ToastQueueExample() {
  const [messages, setMessages] = useState<number[]>([])
  const next = useRef(0)
  return (
    <ToastProvider>
      <Button onClick={() => setMessages(values => [...values, ++next.current])}>
        Export a report
      </Button>
      <ToastViewport style={inline}>
        {messages.map(id => (
          <Toast
            key={id}
            defaultOpen
            onOpenChange={open => {
              if (!open) setMessages(values => values.filter(value => value !== id))
            }}
          >
            <ToastTitle>Export {id} ready</ToastTitle>
            <ToastDescription>The file is in your downloads.</ToastDescription>
            <ToastClose
              variant="ghost"
              tone="neutral"
            >
              Dismiss
            </ToastClose>
          </Toast>
        ))}
      </ToastViewport>
    </ToastProvider>
  )
}
