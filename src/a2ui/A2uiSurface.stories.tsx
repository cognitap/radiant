import { useCallback, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { summarizeCatalogDiagnostics, type CatalogDiagnostic } from '../catalog/index.js'
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

function CoercedSurfaceDemo() {
  const [diagnostics, setDiagnostics] = useState<readonly CatalogDiagnostic[]>([])
  const handleDiagnostic = useCallback((diagnostic: CatalogDiagnostic) => {
    setDiagnostics(previous => [...previous, diagnostic])
  }, [])
  const summary = summarizeCatalogDiagnostics(diagnostics)

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
        {`Diagnostics: ${summary.total} (coerced: ${summary.coercions}, defaulted: ${summary.defaults}, stripped: ${summary.stripped}, fallbacks: ${summary.fallbacks})`}
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
      /Diagnostics: \d+ \(coerced: \d+, defaulted: 1, stripped: 2, fallbacks: 1\)/
    )
  }
}
