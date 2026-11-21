import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import type { CatalogDiagnostic } from '../catalog/index.js'
import { validateA2uiAccessibility } from './accessibility.js'
import { A2uiSurface } from './A2uiSurface.js'
import { getA2uiConformanceFixture } from './conformance.js'
import { lucideA2uiIcons } from './lucide.js'
import { A2uiMediaProvider } from './media.js'

type ConformanceArgs = { readonly fixture: string }

// Replays a fixture one message at a time, as an agent stream would, and records the errors and
// fallbacks it reports; streams may still default props they have not sent yet.
function ConformanceReplay({ fixture: name }: ConformanceArgs) {
  const fixture = getA2uiConformanceFixture(name)
  const [count, setCount] = useState(1)
  const [diagnostics, setDiagnostics] = useState<readonly CatalogDiagnostic[]>([])
  const done = count >= fixture.messages.length

  useEffect(() => {
    if (done) return
    const timer = setTimeout(() => setCount(current => current + 1))
    return () => clearTimeout(timer)
  }, [done, count])

  return (
    <div
      className="grid max-w-md gap-4"
      data-conformance={done ? 'replayed' : 'replaying'}
    >
      <A2uiMediaProvider icons={lucideA2uiIcons}>
        <A2uiSurface
          surfaceId={fixture.surfaceId}
          messages={fixture.messages.slice(0, count)}
          labels={{ modalClose: 'Close' }}
          onDiagnostic={diagnostic => {
            if (diagnostic.kind === 'error' || diagnostic.kind === 'fallback') {
              setDiagnostics(previous => [...previous, diagnostic])
            }
          }}
        />
      </A2uiMediaProvider>
      <output
        hidden
        data-testid="conformance-diagnostics"
      >
        {JSON.stringify(diagnostics)}
      </output>
    </div>
  )
}

const meta = {
  title: 'A2UI/Conformance',
  component: ConformanceReplay,
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    const fixture = getA2uiConformanceFixture(args.fixture)
    await waitFor(() => {
      expect(canvasElement.querySelector('[data-conformance="replayed"]')).not.toBeNull()
      const surface = canvasElement.querySelector('[data-slot="a2ui-surface"]')
      expect(surface).not.toBeNull()
      expect(surface).not.toHaveAttribute('aria-busy')
      expect(surface!.childElementCount).toBeGreaterThan(0)
    })
    if (fixture.gate !== 'accessible') return
    const output = canvasElement.querySelector('[data-testid="conformance-diagnostics"]')!
    await expect(JSON.parse(output.textContent || '[]')).toEqual([])
    await expect(canvasElement.querySelector('[data-slot="a2ui-fallback"]')).toBeNull()
    await expect(validateA2uiAccessibility(fixture.messages).errors).toEqual([])
  }
} satisfies Meta<typeof ConformanceReplay>

export default meta

type Story = StoryObj<typeof meta>

// These fixtures omit names on purpose, so axe reports their violations without failing.
const exemptFromAxe = { a11y: { test: 'todo' } } as const

export const Profile: Story = { args: { fixture: 'profile' } }
export const ProfileWithThemeHint: Story = { args: { fixture: 'profileWithThemeHint' } }
export const MalformedProfile: Story = { args: { fixture: 'malformedProfile' } }
export const InteractivePreferences: Story = { args: { fixture: 'interactivePreferences' } }
export const Inaccessible: Story = {
  args: { fixture: 'inaccessible' },
  parameters: exemptFromAxe
}
export const Streamed: Story = { args: { fixture: 'streamed' } }
export const PropStream: Story = { args: { fixture: 'propStream' } }
export const TripRequest: Story = { args: { fixture: 'tripRequest' } }
export const TripRequestRejection: Story = { args: { fixture: 'tripRequestRejection' } }
export const Row: Story = { args: { fixture: 'row' } }
export const Column: Story = { args: { fixture: 'column' } }
export const List: Story = { args: { fixture: 'list' } }
export const Card: Story = { args: { fixture: 'card' } }
export const Tabs: Story = { args: { fixture: 'tabs' } }
export const Modal: Story = { args: { fixture: 'modal' } }
export const Icon: Story = { args: { fixture: 'icon' } }
export const Image: Story = { args: { fixture: 'image' } }
export const Video: Story = { args: { fixture: 'video' } }
export const AudioPlayer: Story = { args: { fixture: 'audioPlayer' } }
export const InaccessibleMedia: Story = {
  args: { fixture: 'inaccessibleMedia' },
  parameters: exemptFromAxe
}
