import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from './Dialog'
import { Field } from './Field'
import { Input } from './Input'
import { radiantTheme, themes } from './themes/index.js'

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
          'A native dialog. showModal() provides the modal layer, focus containment, and focus restoration. The element stays in its document, so an ancestor form still owns its fields.'
      }
    }
  },
  decorators: [
    (Story, { id }) =>
      id.endsWith('--themes') ? (
        <Story />
      ) : (
        <div style={radiantTheme}>
          <Story />
        </div>
      )
  ]
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger>Edit profile</DialogTrigger>
      <DialogContent>
        <DialogClose className="justify-self-end">Close</DialogClose>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>This name is visible to your team.</DialogDescription>
        <button type="button">Continue</button>
        <form method="dialog">
          <button type="submit">Done</button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const Form: Story = {
  render: () => <ProfileForm />
}

export const Nested: Story = {
  render: () => <NestedDialogs />
}

export const AbsentTrigger: Story = {
  name: 'Absent trigger',
  render: () => <OutsideControl />
}

export const Dismissal: Story = {
  render: () => <HeldOpen />
}

const themeFrame = (surface: string | undefined): CSSProperties => ({
  display: 'grid',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: '1.25rem',
  background: surface ?? 'oklch(0.985 0.003 250)'
})

export const Themes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {themes.map(theme => (
        <div
          key={theme.name}
          style={{ ...theme.style, ...themeFrame(theme.surface) }}
        >
          <Dialog
            defaultOpen
            modal={false}
          >
            <DialogContent style={{ position: 'static', margin: 0, width: '100%' }}>
              <DialogTitle>{theme.name}</DialogTitle>
              <DialogDescription>
                Panel surface, radius, and corner from the theme.
              </DialogDescription>
              <DialogClose>Close</DialogClose>
            </DialogContent>
          </Dialog>
        </div>
      ))}
    </div>
  )
}
