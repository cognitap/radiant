import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spoiler } from './Spoiler.js'

const meta = {
  title: 'Components/Spoiler',
  component: Spoiler,
  args: { className: 'max-w-lg', maxHeight: 92 }
} satisfies Meta<typeof Spoiler>
export default meta
type Story = StoryObj<typeof meta>

const notes = (
  <div className="grid gap-3">
    <p>Workspace members can subscribe to a weekly summary of their open projects.</p>
    <p>Reports show the assigned owner, upcoming milestones, and changes since the last review.</p>
    <p>Project owners can add a short update before the next report goes out.</p>
  </div>
)
export const Default: Story = { args: { children: notes } }

export const ReadShippingDetails: Story = {
  args: {
    children: 'Dispatches in two business days.',
    showMoreLabel: 'More shipping details',
    showLessLabel: 'Fewer shipping details'
  }
}

export const ReadInstallationNotes: Story = {
  args: {
    defaultOpen: true,
    children: (
      <ol className="grid list-decimal gap-3 ps-5">
        <li>Save a copy of your workspace settings.</li>
        <li>Install the update and reopen the application.</li>
        <li>Check that your workspace loads and that your team still has access.</li>
      </ol>
    )
  }
}
