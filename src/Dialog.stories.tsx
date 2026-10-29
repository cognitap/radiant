import { useState } from 'react'
import {
  DialogProfileExample,
  DialogTransitionExample
} from '../.storybook/examples/DialogExamples.js'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  type DialogRenderProps,
  Field,
  Input
} from './index.js'
import { themes } from './examples/index.js'

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
              variant="outline"
              tone="neutral"
            >
              Cancel
            </DialogClose>
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
          'Dialog is a non-DOM state owner: choose open or defaultOpen. DialogContent is the native dialog and owns its className/style/native props/ref, dialog identity and open/closed data-state. Title (h2) and Description (p) own their own styling/ref targets and protected IDs. DialogTrigger/Close compose Button. The panel uses shared surface/typography/border/focus roles and reduced-motion-aware color transitions. Native showModal supplies the modal layer; the bounded panel scrolls its content.'
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

export const Composition: Story = {
  name: 'Ancestor form interoperability',
  parameters: {
    docs: {
      description: {
        story:
          'A focused native interoperability example: the dialog remains inside its ancestor form, and its submit button submits that form. Recipes → Workspace and Recipes → Forms show the canonical product composition.'
      }
    }
  },
  render: () => <ProfileForm />
}

// Consumer-owned adapter; the resolved ref, handler and children reach this one host.
function ProfileAction({ children, ...props }: DialogRenderProps) {
  return <button {...props}>{children}</button>
}

export const Customisation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A local Dialog width variable preserves the viewport bound; title and description overrides target their own hosts. Color transitions follow shared motion settings and reduced-motion preference. Choose Button presentation on actions and forward resolved props/ref/children to one compatible button host.'
      }
    }
  },
  render: () => (
    <Dialog>
      <DialogTrigger
        variant="outline"
        tone="neutral"
        render={props => <ProfileAction {...props} />}
      >
        Open narrow panel
      </DialogTrigger>
      <DialogContent style={{ '--rad-dialog-width': '24rem' }}>
        <DialogTitle style={{ '--rad-dialog-title-size': '1.25rem' }}>Narrow panel</DialogTitle>
        <DialogDescription style={{ fontStyle: 'italic' }}>
          Custom hosts inherit Button presentation.
        </DialogDescription>
        <DialogClose
          variant="outline"
          tone="neutral"
          render={props => <button {...props}>{props.children}</button>}
        >
          Close panel
        </DialogClose>
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

export const ProfileEditor: Story = {
  render: (_, { globals }) => (
    <DialogProfileExample
      theme={themes.find(theme => theme.id === globals.theme)}
      mode={globals.mode === 'light' || globals.mode === 'dark' ? globals.mode : 'system'}
    />
  )
}

export const TransitionPlayground: Story = {
  render: (_, { globals }) => (
    <DialogTransitionExample
      theme={themes.find(theme => theme.id === globals.theme)}
      mode={globals.mode === 'light' || globals.mode === 'dark' ? globals.mode : 'system'}
    />
  )
}
