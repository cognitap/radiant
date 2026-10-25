import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
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
          'A native `<dialog>`: Dialog owns open/defaultOpen and onOpenChange; DialogTrigger and DialogClose compose Button by default and accept its presentation and pending props. DialogContent owns the dialog host/ref. DialogTitle and DialogDescription provide accessible relationships. Action slots include button plus dialog-trigger or dialog-close; other parts expose dialog, dialog-title and dialog-description. Native showModal supplies the modal layer; no portal or body scroll lock is added.'
      }
    }
  }
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(async () => {
      const view = canvasElement.ownerDocument.defaultView!
      const reference = canvasElement.querySelector<HTMLButtonElement>('[data-slot="button"]')
      await expect(reference).not.toBeNull()
      const expected = view.getComputedStyle(reference!)
      for (const slot of ['dialog-trigger', 'dialog-close']) {
        const action = canvasElement.querySelector<HTMLButtonElement>(`[data-slot~="${slot}"]`)
        await expect(action).not.toBeNull()
        const actual = view.getComputedStyle(action!)
        const properties = [
          'font-family',
          'font-size',
          'font-weight',
          'letter-spacing',
          'text-transform',
          'border-top-width',
          'border-top-style'
        ]
        if (
          !action!.matches(':hover, :active, :focus-visible') &&
          !reference!.matches(':hover, :active')
        ) {
          properties.push(
            'background-color',
            'background-image',
            'color',
            'box-shadow',
            'border-radius',
            'corner-shape',
            'backdrop-filter'
          )
        }
        for (const property of properties) {
          await expect(actual.getPropertyValue(property)).toBe(expected.getPropertyValue(property))
        }
      }
    })
  },
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

export const Composition: Story = {
  render: () => <ProfileForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit profile' }))
    const dialog = canvas.getByRole('dialog', { name: 'Edit profile' })
    const name = within(dialog).getByRole('textbox', { name: 'Name' })
    await expect(name).toHaveFocus()
    await userEvent.clear(name)
    await userEvent.type(name, 'Grace')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await expect(canvas.getByText('Grace', { exact: true })).toBeVisible()
    // Leave the panel open so the automatic accessibility scan includes its parts.
    await expect(dialog).toBeVisible()
  }
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
          'Choose Button presentation on the Dialog action, then forward resolved native props, ref and children to one button. The trigger uses a consumer component; the close action uses a native replacement. Both inherit Button styling and activation without a nested Button.'
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
      <DialogContent style={{ width: '24rem' }}>
        <DialogTitle>Narrow panel</DialogTitle>
        <DialogDescription>Custom hosts inherit Button presentation.</DialogDescription>
        <DialogClose
          variant="outline"
          tone="neutral"
          render={props => <button {...props}>{props.children}</button>}
        >
          Close panel
        </DialogClose>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Open narrow panel' }))
    await expect(canvas.getByRole('dialog', { name: 'Narrow panel' })).toBeVisible()
  }
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
