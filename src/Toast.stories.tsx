import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  Button
} from './index.js'
const meta = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    docs: {
      description: {
        component:
          'One visible notification per Provider, in FIFO registration order. Defaults to persistent duration=0. Optional timeouts start on visibility and pause while hovered, focused or the document is hidden; queued time never consumes the timer. Opening never moves focus. F8 reaches the notification (hotkey=false disables it); Escape inside dismisses it and focus returns to its opener when appropriate. Action and Close compose Button, including guards, cancellation, native props and refs. Announcements use persistent provider status/alert hosts and derive text from Title, Description and Action altText, excluding Close. Use Alert for durable feedback and AlertDialog for urgent decisions. Actual assistive-technology behavior requires manual verification.'
      }
    }
  }
} satisfies Meta<typeof Toast>
export default meta
type Story = StoryObj<typeof meta>
function Content() {
  return (
    <>
      <ToastTitle>Draft saved</ToastTitle>
      <ToastDescription>Your latest edits are stored.</ToastDescription>
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <ToastAction
          altText="Undo is available in Notifications, reached with F8."
          variant="outline"
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
    </>
  )
}
export const Default: Story = {
  render: (_, { viewMode }) => (
    <ToastProvider>
      <ToastViewport style={{ position: 'relative', inset: 'auto' }}>
        <Toast defaultOpen={viewMode !== 'docs'}>
          <Content />
        </Toast>
      </ToastViewport>
    </ToastProvider>
  )
}
export const Customisation: Story = {
  render: (_, { viewMode }) => (
    <ToastProvider>
      <ToastViewport style={{ position: 'relative', inset: 'auto' }}>
        <Toast
          defaultOpen={viewMode !== 'docs'}
          tone="accent"
          style={{
            '--rad-toast-radius': '1.5rem',
            '--rad-toast-padding': '2rem',
            '--rad-toast-title-size': '1.5rem'
          }}
        >
          <Content />
        </Toast>
      </ToastViewport>
    </ToastProvider>
  )
}
function QueueExample() {
  const [messages, setMessages] = useState<number[]>([])
  const next = useRef(0)
  return (
    <ToastProvider>
      <Button
        onClick={() => {
          const id = ++next.current
          setMessages(values => [...values, id])
        }}
      >
        Save another draft
      </Button>
      <ToastViewport style={{ position: 'relative', inset: 'auto', marginTop: '1rem' }}>
        {messages.map(id => (
          <Toast
            key={id}
            defaultOpen
            onOpenChange={open => {
              if (!open) setMessages(values => values.filter(value => value !== id))
            }}
          >
            <Content />
          </Toast>
        ))}
      </ToastViewport>
    </ToastProvider>
  )
}
export const Queue: Story = { render: () => <QueueExample /> }
