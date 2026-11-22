import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { A2uiSurface } from './A2uiSurface.js'
import {
  accordionFixtureMessages,
  alertFixtureMessages,
  badgeFixtureMessages,
  FEEDBACK_SURFACE_ID,
  progressFixtureMessages,
  tableFixtureMessages,
  TOAST_SURFACE_ID,
  toastFixtureMessages,
  toastRaisedFixtureMessages
} from './feedbackFixtures.js'

const meta = {
  title: 'A2UI/Feedback',
  component: A2uiSurface,
  args: {
    surfaceId: FEEDBACK_SURFACE_ID,
    messages: alertFixtureMessages,
    labels: { notifications: 'Notifications', toastClose: 'Dismiss' }
  },
  render: args => (
    <div className="grid max-w-md gap-4">
      <A2uiSurface {...args} />
    </div>
  )
} satisfies Meta<typeof A2uiSurface>

export default meta

type Story = StoryObj<typeof meta>

export const Alert: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = await canvas.findByRole('heading', { name: 'Payment is late' })
    await expect(title.closest('[data-slot~="alert"]')).toHaveAttribute('role', 'status')
  }
}

export const Badge: Story = {
  args: { messages: badgeFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Shipped')).toBeVisible()
  }
}

export const Progress: Story = {
  args: { messages: progressFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('progressbar', { name: 'Uploading invoice' })).toHaveValue(
      40
    )
  }
}

export const Accordion: Story = {
  args: { messages: accordionFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Ships within two days.')).toBeVisible()
  }
}

export const Table: Story = {
  args: { messages: tableFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const table = await canvas.findByRole('table', { name: 'Invoices' })
    await expect(within(table).getAllByRole('row')).toHaveLength(3)
  }
}

export const Toast: Story = {
  args: {
    surfaceId: TOAST_SURFACE_ID,
    messages: [...toastFixtureMessages, ...toastRaisedFixtureMessages]
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot~="toast"]')).toHaveAttribute(
        'data-state',
        'open'
      )
    )
  }
}
