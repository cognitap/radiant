import { useCallback, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, within } from 'storybook/test'
import type { CatalogActionEvent, CatalogDiagnostic } from '../catalog/index.js'
import { A2uiSurface, type A2uiActionPayload } from './A2uiSurface.js'
import {
  interactivePreferencesFixtureMessages,
  malformedProfileFixtureMessages,
  PREFERENCES_SURFACE_ID,
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

function LocalStateActionDemo() {
  const [actions, setActions] = useState<readonly CatalogActionEvent[]>([])
  const handleAction = useCallback((event: CatalogActionEvent) => {
    setActions(previous => [...previous, event])
  }, [])
  const lastAction = actions.at(-1) ?? null

  return (
    <div className="grid max-w-md gap-4">
      <A2uiSurface
        surfaceId={PREFERENCES_SURFACE_ID}
        messages={interactivePreferencesFixtureMessages}
        onAction={handleAction}
      />
      <output
        data-testid="a2ui-action-count"
        className="text-sm"
      >
        {`Host actions: ${actions.length}`}
      </output>
      {lastAction ? (
        <output
          data-testid="a2ui-action-event"
          className="text-sm"
        >
          {JSON.stringify({
            action: lastAction.action,
            surfaceId: lastAction.surfaceId,
            nodeId: lastAction.nodeId,
            state: lastAction.state
          })}
        </output>
      ) : null}
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

export const LocalStateThenAction: Story = {
  args: {
    surfaceId: PREFERENCES_SURFACE_ID,
    messages: interactivePreferencesFixtureMessages
  },
  render: () => <LocalStateActionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const note = canvas.getByRole('textbox', { name: 'Summary note' })
    const weekly = canvas.getByRole('radio', { name: 'Weekly' })
    const inApp = canvas.getByRole('checkbox', { name: 'In-app' })
    const volume = canvas.getByRole('slider', { name: 'Alert volume' })
    const quietHours = canvas.getByRole('checkbox', { name: 'Enable quiet hours' })

    // Local interactions update client state without contacting the host
    await userEvent.type(note, 'Keep evenings quiet')
    await userEvent.click(weekly)
    await userEvent.click(inApp)
    fireEvent.change(volume, { target: { value: '60' } })
    await userEvent.click(quietHours)

    await expect(canvas.getByTestId('a2ui-action-count')).toHaveTextContent('Host actions: 0')

    // One named action delivers { action, surfaceId, nodeId, state } to the host
    await userEvent.click(canvas.getByRole('button', { name: 'Apply preferences' }))
    await expect(canvas.getByTestId('a2ui-action-count')).toHaveTextContent('Host actions: 1')
    const delivered = JSON.parse(canvas.getByTestId('a2ui-action-event').textContent ?? '{}')
    await expect(delivered).toEqual({
      action: 'apply_preferences',
      surfaceId: PREFERENCES_SURFACE_ID,
      nodeId: 'apply_button',
      state: {
        note: 'Keep evenings quiet',
        cadence: ['weekly'],
        channels: ['email', 'in_app'],
        volume: 60,
        notify: true
      }
    })
  }
}
