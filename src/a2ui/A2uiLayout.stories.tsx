import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { A2uiSurface } from './A2uiSurface.js'
import {
  cardFixtureMessages,
  columnFixtureMessages,
  LAYOUT_SURFACE_ID,
  listFixtureMessages,
  modalFixtureMessages,
  rowFixtureMessages,
  tabsFixtureMessages
} from './layoutFixtures.js'

const meta = {
  title: 'A2UI/Layout',
  component: A2uiSurface,
  args: { surfaceId: LAYOUT_SURFACE_ID, messages: rowFixtureMessages },
  render: args => (
    <div className="grid max-w-md gap-4">
      <A2uiSurface {...args} />
    </div>
  )
} satisfies Meta<typeof A2uiSurface>

export default meta

type Story = StoryObj<typeof meta>

export const Row: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('textbox', { name: 'Trail' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Search' })).toBeVisible()
  }
}

export const Column: Story = {
  args: { messages: columnFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Ridge loop')).toBeVisible()
  }
}

export const List: Story = {
  args: { messages: listFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getAllByRole('listitem')).toHaveLength(3))
    await expect(canvas.getByText('Pine valley')).toBeVisible()
  }
}

export const CardAndDivider: Story = {
  args: { messages: cardFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Moderate')).toBeVisible()
    await expect(canvas.getByRole('separator')).toBeVisible()
  }
}

export const Tabs: Story = {
  args: { messages: tabsFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('tab', { name: 'Gear' }))
    await expect(canvas.getByRole('textbox', { name: 'Gear notes' })).toBeVisible()
  }
}

export const Modal: Story = {
  args: { messages: modalFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('button', { name: 'Trail details' })).toBeVisible()
  }
}
