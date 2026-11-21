import { useCallback, useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, within } from 'storybook/test'
import type { CatalogActionEvent, CatalogDiagnostic } from '../catalog/index.js'
import { Button } from '../components/Button/Button.js'
import { A2UI_PROTOCOL_VERSION } from './catalogGenerator.js'
import { A2uiSurface, type A2uiActionPayload } from './A2uiSurface.js'
import type { A2uiMessage } from './sanitize.js'
import {
  interactivePreferencesFixtureMessages,
  malformedProfileFixtureMessages,
  PREFERENCES_SURFACE_ID,
  PROFILE_SURFACE_ID,
  profileFixtureMessages,
  STREAMED_SURFACE_ID,
  streamedFixtureMessages
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

function LiveAgentPatchDemo() {
  const [patched, setPatched] = useState(false)
  const messages: readonly A2uiMessage[] = patched
    ? [
        ...profileFixtureMessages,
        {
          version: A2UI_PROTOCOL_VERSION,
          updateComponents: {
            surfaceId: PROFILE_SURFACE_ID,
            components: [
              {
                id: 'root',
                component: 'Column',
                children: ['intro_text', 'agent_note', 'caption_text', 'name_field', 'save_button']
              },
              {
                id: 'agent_note',
                component: 'Text',
                text: 'Live agent update applied without interrupting your edit.',
                variant: 'caption'
              }
            ]
          }
        }
      ]
    : profileFixtureMessages

  return (
    <div className="grid max-w-md gap-4">
      <A2uiSurface
        surfaceId={PROFILE_SURFACE_ID}
        messages={messages}
      />
      <div>
        <Button
          variant="outline"
          disabled={patched}
          onMouseDown={event => {
            event.preventDefault()
          }}
          onClick={() => setPatched(true)}
        >
          Apply agent patch
        </Button>
      </div>
    </div>
  )
}

const STREAM_STEP_MS = 250

function StreamedSurfaceDemo({
  surfaceId,
  messages
}: {
  readonly surfaceId: string
  readonly messages: readonly A2uiMessage[]
}) {
  const [run, setRun] = useState(0)
  const [count, setCount] = useState(1)
  const done = count >= messages.length

  useEffect(() => {
    if (done) return
    const timer = setTimeout(() => setCount(next => next + 1), STREAM_STEP_MS)
    return () => clearTimeout(timer)
  }, [count, done])

  return (
    <div className="grid max-w-md gap-4">
      <A2uiSurface
        key={run}
        surfaceId={surfaceId}
        messages={messages.slice(0, count)}
      />
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          disabled={!done}
          onClick={() => {
            setRun(next => next + 1)
            setCount(1)
          }}
        >
          Replay stream
        </Button>
        <output
          data-testid="a2ui-stream-progress"
          className="text-sm"
        >
          {`Messages: ${count} of ${messages.length}`}
        </output>
      </div>
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

    // One named action reaches the host after all local edits
    await userEvent.click(canvas.getByRole('button', { name: 'Apply preferences' }))
    await expect(canvas.getByTestId('a2ui-action-count')).toHaveTextContent('Host actions: 1')
    await expect(canvas.getByTestId('a2ui-action-event')).toHaveTextContent(
      '"action":"apply_preferences"'
    )
  }
}

export const LiveAgentPatch: Story = {
  args: {
    surfaceId: PROFILE_SURFACE_ID,
    messages: profileFixtureMessages
  },
  render: () => <LiveAgentPatchDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Display name' })
    await userEvent.clear(input)
    await userEvent.type(input, 'Margaret Hamilton')
    await expect(input).toHaveFocus()

    await userEvent.click(canvas.getByRole('button', { name: 'Apply agent patch' }))

    await expect(
      canvas.getByText('Live agent update applied without interrupting your edit.')
    ).toBeVisible()
    await expect(input).toHaveFocus()
    await expect(input).toHaveValue('Margaret Hamilton')
  }
}

export const StreamedSurface: Story = {
  args: {
    surfaceId: STREAMED_SURFACE_ID,
    messages: streamedFixtureMessages
  },
  render: args => (
    <StreamedSurfaceDemo
      surfaceId={args.surfaceId}
      messages={args.messages}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const surface = canvasElement.querySelector('[data-slot="a2ui-surface"]')!
    await expect(surface).toHaveAttribute('aria-busy', 'true')
    await expect(
      await canvas.findByRole('button', { name: 'Send check-in' }, { timeout: 5000 })
    ).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Your name' })).toHaveValue('Ada')
    await expect(canvas.getByText('Welcome back, Ada.')).toBeVisible()
    await expect(surface).not.toHaveAttribute('aria-busy')
  }
}
