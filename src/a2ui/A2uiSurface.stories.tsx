import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { A2uiSurface, type A2uiActionPayload } from './A2uiSurface.js'
import { PROFILE_SURFACE_ID, profileFixtureMessages } from './fixtures.js'

function ProfileSurfaceDemo() {
  const [lastAction, setLastAction] = useState<A2uiActionPayload | null>(null)
  return (
    <div className="grid max-w-md gap-4">
      <A2uiSurface
        surfaceId={PROFILE_SURFACE_ID}
        messages={profileFixtureMessages}
        onAction={setLastAction}
      />
      <output
        data-testid="a2ui-action-log"
        className="text-sm"
      >
        {lastAction
          ? `${lastAction.name}: ${String(lastAction.context.displayName ?? '')}`
          : 'No action emitted yet.'}
      </output>
    </div>
  )
}

const meta = {
  title: 'A2UI/Surface',
  component: A2uiSurface
} satisfies Meta<typeof A2uiSurface>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    surfaceId: PROFILE_SURFACE_ID,
    messages: profileFixtureMessages
  },
  render: () => <ProfileSurfaceDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Display name' })
    await expect(input).toHaveValue('Ada Lovelace')
    await userEvent.clear(input)
    await userEvent.type(input, 'Grace Hopper')
    await userEvent.click(canvas.getByRole('button', { name: 'Save profile' }))
    await expect(canvas.getByTestId('a2ui-action-log')).toHaveTextContent(
      'save_profile: Grace Hopper'
    )
  }
}
