import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose
} from './index.js'
import {
  ToastSuccessExample,
  ToastUndoExample,
  ToastErrorExample,
  ToastControlledExample,
  ToastQueueExample
} from '../.storybook/examples/ToastExamples.js'
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
const inline = { position: 'relative', inset: 'auto' } as const
export const Default: Story = {
  render: (_, { viewMode }) => (
    <ToastProvider>
      <ToastViewport style={inline}>
        <Toast defaultOpen={viewMode !== 'docs'}>
          <ToastTitle>Draft saved</ToastTitle>
          <ToastDescription>Your latest edits are stored.</ToastDescription>
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
export const SuccessNotice: Story = { render: () => <ToastSuccessExample /> }
export const UndoAction: Story = {
  render: (_, { viewMode }) => <ToastUndoExample initialOpen={viewMode !== 'docs'} />
}
export const PersistentError: Story = {
  render: (_, { viewMode }) => <ToastErrorExample initialOpen={viewMode !== 'docs'} />
}
export const Controlled: Story = { render: () => <ToastControlledExample /> }
export const Queue: Story = { render: () => <ToastQueueExample /> }
export const Customisation: Story = {
  render: (_, { viewMode }) => (
    <ToastProvider>
      <ToastViewport
        hotkey={false}
        style={inline}
      >
        <Toast
          defaultOpen={viewMode !== 'docs'}
          tone="accent"
          motion="off"
          style={{
            '--rad-toast-radius': '1.5rem',
            '--rad-toast-padding': '2rem',
            '--rad-toast-title-size': '1.5rem'
          }}
        >
          <ToastTitle level={3}>Draft saved</ToastTitle>
          <ToastDescription>Your latest edits are stored.</ToastDescription>
        </Toast>
      </ToastViewport>
    </ToastProvider>
  )
}
