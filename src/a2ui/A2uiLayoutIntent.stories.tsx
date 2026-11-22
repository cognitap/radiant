import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { A2uiSurface } from './A2uiSurface.js'
import {
  COMPARE_SURFACE_ID,
  compareFixtureMessages,
  GRID_SURFACE_ID,
  gridFixtureMessages,
  REVEAL_SURFACE_ID,
  revealFixtureMessages,
  SPLIT_SURFACE_ID,
  splitFixtureMessages
} from './layoutIntentFixtures.js'

const meta = {
  title: 'A2UI/Layout intent',
  component: A2uiSurface,
  args: {
    surfaceId: SPLIT_SURFACE_ID,
    messages: splitFixtureMessages,
    labels: {
      revealPrevious: 'Previous',
      revealNext: 'Next',
      revealPosition: (index: number, count: number) => `Step ${index + 1} of ${count}`
    }
  },
  render: args => (
    <div style={{ width: '720px', maxWidth: '100%' }}>
      <A2uiSurface {...args} />
    </div>
  )
} satisfies Meta<typeof A2uiSurface>

export default meta
type Story = StoryObj<typeof meta>

export const Split: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Itinerary')).toBeVisible()
  }
}

export const Grid: Story = {
  args: { surfaceId: GRID_SURFACE_ID, messages: gridFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Drawing')).toBeVisible()
  }
}

export const Compare: Story = {
  args: { surfaceId: COMPARE_SURFACE_ID, messages: compareFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findAllByRole('listitem')).toHaveLength(3)
  }
}

export const Reveal: Story = {
  args: { surfaceId: REVEAL_SURFACE_ID, messages: revealFixtureMessages },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Next' }))
    await expect(canvas.getByText('Step 2 of 3')).toBeVisible()
    await expect(canvas.getByText('Rest the dough for an hour.')).toBeVisible()
  }
}
