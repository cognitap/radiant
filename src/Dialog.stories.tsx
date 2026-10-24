import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  Input
} from './index.js'

function ProfileForm() {
  const [summary, setSummary] = useState('No save yet')
  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        const name = new FormData(event.currentTarget).get('name')
        setSummary(typeof name === 'string' && name !== '' ? name : 'Empty')
      }}
      style={{ display: 'grid', justifyItems: 'start', gap: '0.75rem' }}
    >
      <Dialog>
        <DialogTrigger>Edit profile</DialogTrigger>
        <DialogContent>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>The name stays in the surrounding form.</DialogDescription>
          <Field label="Name">
            <Input
              // The story checks the platform autofocus delegate.
              // oxlint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              defaultValue="Ada"
              name="name"
            />
          </Field>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="submit">Save</Button>
            <DialogClose
              render={props => (
                <Button
                  {...props}
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
            />
          </div>
        </DialogContent>
      </Dialog>
      <p style={{ margin: 0 }}>{summary}</p>
    </form>
  )
}

function NestedDialogs() {
  return (
    <Dialog>
      <DialogTrigger>Open outer</DialogTrigger>
      <DialogContent>
        <DialogTitle>Outer</DialogTitle>
        <DialogDescription>The first layer stays up when the inner one closes.</DialogDescription>
        <Dialog>
          <DialogTrigger>Open inner</DialogTrigger>
          <DialogContent>
            <DialogTitle>Inner</DialogTitle>
            <DialogDescription>Escape closes this layer only.</DialogDescription>
            <DialogClose>Close inner</DialogClose>
          </DialogContent>
        </Dialog>
        <DialogClose>Close outer</DialogClose>
      </DialogContent>
    </Dialog>
  )
}

function OutsideControl() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <button type="button">Keep</button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onPointerDown={event => event.preventDefault()}
      >
        Open from outside
      </button>
      <Dialog
        onOpenChange={setOpen}
        open={open}
      >
        <DialogContent>
          <DialogTitle>Note</DialogTitle>
          <DialogDescription>Opened without a trigger inside the dialog.</DialogDescription>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HeldOpen() {
  return (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <Dialog closeOnBackdrop={false}>
        <DialogTrigger>No backdrop close</DialogTrigger>
        <DialogContent>
          <DialogTitle>Backdrop stays</DialogTitle>
          <DialogDescription>Clicking outside leaves this open.</DialogDescription>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>
      <Dialog closeOnEscape={false}>
        <DialogTrigger>No escape close</DialogTrigger>
        <DialogContent>
          <DialogDescription>Escape leaves this open. The title still names it.</DialogDescription>
          <DialogTitle>Escape stays</DialogTitle>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component:
          'A native `<dialog>`: Dialog owns open/defaultOpen and onOpenChange; DialogTrigger and DialogClose request changes, while DialogContent owns the dialog host/ref. DialogTitle and DialogDescription provide accessible relationships. Parts expose dialog-trigger, dialog-close, dialog, dialog-title and dialog-description slots. Native showModal supplies the modal layer; no portal or body scroll lock is added.'
      }
    }
  }
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger>Edit profile</DialogTrigger>
      <DialogContent>
        <DialogClose style={{ justifySelf: 'end' }}>Close</DialogClose>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>This name is visible to your team.</DialogDescription>
        <Button type="button">Continue</Button>
        <form method="dialog">
          <Button type="submit">Done</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const States: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'An initially open nonmodal dialog in Canvas. In Docs, open it with the trigger to keep the page at its starting position. It stays in normal document interaction; the default example demonstrates opening a modal dialog.'
      }
    }
  },
  render: (_, { viewMode }) => (
    <Dialog
      defaultOpen={viewMode !== 'docs'}
      modal={false}
    >
      {viewMode === 'docs' && <DialogTrigger>Open nonmodal dialog</DialogTrigger>}
      <DialogContent style={{ position: 'static', margin: 0 }}>
        <DialogTitle>Already open</DialogTitle>
        <DialogDescription>
          A nonmodal open state, without covering the documentation.
        </DialogDescription>
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </Dialog>
  )
}

export const Composition: Story = { render: () => <ProfileForm /> }

export const Customisation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The current render callback adapts Dialog action props to Button; default action composition is tracked separately.'
      }
    }
  },
  render: () => (
    <Dialog>
      <DialogTrigger
        render={props => (
          <Button
            {...props}
            variant="outline"
          >
            Open narrow panel
          </Button>
        )}
      />
      <DialogContent style={{ width: '24rem' }}>
        <DialogTitle>Narrow panel</DialogTitle>
        <DialogDescription>Local geometry and explicit action replacement.</DialogDescription>
        <DialogClose render={props => <Button {...props}>Close</Button>} />
      </DialogContent>
    </Dialog>
  )
}

export const Nested: Story = {
  render: () => <NestedDialogs />
}

export const AbsentTrigger: Story = {
  name: 'Native trigger interoperability',
  render: () => <OutsideControl />
}

export const Dismissal: Story = {
  render: () => <HeldOpen />
}
