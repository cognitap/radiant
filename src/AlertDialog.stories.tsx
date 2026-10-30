import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  AsyncActionExample,
  ControlledExample,
  DeleteProjectExample
} from '../.storybook/examples/AlertDialogExamples.js'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger
} from './index.js'

const meta = {
  title: 'Components/AlertDialog',
  component: AlertDialog,
  parameters: {
    docs: {
      description: {
        component:
          'An urgent modal decision using Dialog’s native lifecycle, surface tokens and optional motion. Content protects role=alertdialog and aria-modal=true; Title names the dialog and Description supplies the alert message. Backdrop clicks leave it open. Escape cancels by default; closeOnEscape=false or Content onCancel.preventDefault() requires an explicit choice. Cancel receives native autofocus on every open, even after Action in DOM order; autoFocus=false allows another initial target. Action and Cancel compose Button, run caller handlers before requesting close, and honor preventDefault, disabled, pending, render and ref. Controlled owners may refuse close. The browser restores focus to the opener; when it disappears, the application chooses the next focus target. Consumers own consequences, async work, errors and pending dismissal policy. Use one Title and Description, or supply an aria-label with the Description. Keep names, modal behavior, visible focus, bounded scrolling and closed-content hiding when customizing.'
      }
    }
  }
} satisfies Meta<typeof AlertDialog>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (_, { viewMode }) => (
    <AlertDialog defaultOpen={viewMode !== 'docs'}>
      <AlertDialogTrigger>Review discard</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
        <AlertDialogDescription>Your latest edits will be lost.</AlertDialogDescription>
        <div className="flex flex-wrap justify-end gap-3">
          <AlertDialogCancel
            tone="neutral"
            variant="outline"
          >
            Keep editing
          </AlertDialogCancel>
          <AlertDialogAction tone="danger">Discard changes</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const Customisation: Story = {
  render: (_, { viewMode }) => (
    <AlertDialog
      defaultOpen={viewMode !== 'docs'}
      closeOnEscape={false}
    >
      <AlertDialogTrigger variant="outline">Review session</AlertDialogTrigger>
      <AlertDialogContent
        motion="off"
        style={{ '--rad-dialog-width': '24rem', '--rad-dialog-radius': '1.5rem' }}
      >
        <AlertDialogTitle style={{ '--rad-dialog-title-size': '1.25rem' }}>
          Session expired
        </AlertDialogTitle>
        <AlertDialogDescription className="italic">
          Sign in again to continue working.
        </AlertDialogDescription>
        <AlertDialogAction
          render={props => (
            <button
              {...props}
              data-adapter=""
            />
          )}
        >
          Understood
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const ConfirmingDeletion: Story = { render: () => <DeleteProjectExample /> }

export const AsyncAction: Story = {
  render: (_, { viewMode }) => <AsyncActionExample defaultOpen={viewMode !== 'docs'} />
}

export const Controlled: Story = {
  render: (_, { viewMode }) => <ControlledExample defaultOpen={viewMode !== 'docs'} />
}
