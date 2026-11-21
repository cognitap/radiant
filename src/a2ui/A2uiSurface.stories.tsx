import { useCallback, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import type { CatalogDiagnostic } from '../catalog/index.js'
import { A2uiSurface, type A2uiActionPayload } from './A2uiSurface.js'
import {
  malformedProfileFixtureMessages,
  PROFILE_SURFACE_ID,
  profileFixtureMessages
} from './fixtures.js'

function ProfileSurfaceDemo() {
  const [lastAction, setLastAction] = useState<A2uiActionPayload | null>(null)

  return (
    <div className="grid max-w-md gap-4">
      <A2uiSurface
        surfaceId={PROFILE_SURFACE_ID}
        messages={profileFixtureMessages}
        onAction={setLastAction}
      />
      {lastAction ? (
        <output
          data-testid="a2ui-last-action"
          className="text-sm"
        >
          {`${lastAction.name}: ${JSON.stringify(lastAction.context)}`}
        </output>
      ) : null}
    </div>
  )
}

function CoercedSurfaceDemo() {
  const [diagnostics, setDiagnostics] = useState<readonly CatalogDiagnostic[]>([])
  const handleDiagnostic = useCallback((diagnostic: CatalogDiagnostic) => {
    setDiagnostics(previous => [...previous, diagnostic])
  }, [])

  return (
    <div className="grid max-w-md gap-4">
      <A2uiSurface
        surfaceId={PROFILE_SURFACE_ID}
        messages={malformedProfileFixtureMessages}
        onDiagnostic={handleDiagnostic}
      />
      <output
        data-testid="a2ui-diagnostic-summary"
        className="text-sm"
      >
        {`Diagnostics: ${diagnostics.length}`}
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
    await expect(canvas.getByTestId('a2ui-last-action')).toHaveTextContent(
      'save_profile: {"displayName":"Grace Hopper"}'
    )
  }
}

export const CoercedInvalidProps: Story = {
  args: {
    surfaceId: PROFILE_SURFACE_ID,
    messages: malformedProfileFixtureMessages
  },
  render: () => <CoercedSurfaceDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('42')).toBeVisible()
    await expect(canvas.getByText('Workspace settings remain available.')).toBeVisible()
    const input = canvas.getByRole('textbox', { name: 'Name field' })
    await expect(input).toHaveValue('Ada Lovelace')
    await expect(canvas.getByTestId('a2ui-diagnostic-summary')).toHaveTextContent(
      /Diagnostics: \d+/
    )
  }
}
