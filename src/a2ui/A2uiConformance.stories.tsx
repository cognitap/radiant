import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import type { CatalogDiagnostic } from '../catalog/index.js'
import { validateA2uiAccessibility } from './accessibility.js'
import { A2uiSurface } from './A2uiSurface.js'
import { getA2uiConformanceFixture } from './conformance.js'
import { radiantA2uiRegistry } from './entries.js'
import { lucideA2uiIcons } from './lucide.js'
import { A2uiMediaProvider } from './media.js'
import type { A2uiJsonSchema } from './catalogGenerator.js'
import { createA2uiRegistry } from './registry.js'

type ConformanceArgs = { readonly fixture: string }

// What a mounted replay reported: diagnostics with the message count they arrived at, and the
// component types whose adapters rendered.
type ReplayRecord = {
  readonly diagnostics: { readonly step: number; readonly diagnostic: CatalogDiagnostic }[]
  readonly rendered: Set<string>
}

const replays = new Map<string, ReplayRecord>()

// The default registry, recording each component type it renders.
function recordingRegistry(record: ReplayRecord) {
  return createA2uiRegistry({
    ...radiantA2uiRegistry,
    entries: Object.values(radiantA2uiRegistry.entries).map(entry => ({
      ...entry,
      adapter: (props, context) => {
        record.rendered.add(context.node.type)
        return entry.adapter(props, context)
      }
    }))
  })
}

function requiredProps(name: string): readonly string[] {
  const schema = radiantA2uiRegistry.entries[name]?.schema
  if (!schema) return []
  const parts = [schema, ...((schema.allOf as readonly A2uiJsonSchema[] | undefined) ?? [])]
  return parts.flatMap(part => (part.required as readonly string[] | undefined) ?? [])
}

// Replays a fixture one message at a time, as an agent stream would. The wrapper is marked
// settled from this component's effect, which runs after the surface has applied the last message.
function ConformanceReplay({ fixture: name }: ConformanceArgs) {
  const fixture = getA2uiConformanceFixture(name)
  const wrapper = useRef<HTMLDivElement>(null)
  const step = useRef(0)
  const [record] = useState<ReplayRecord>(() => ({ diagnostics: [], rendered: new Set() }))
  const [registry] = useState(() => recordingRegistry(record))
  const [count, setCount] = useState(1)
  const done = count >= fixture.messages.length

  // Layout effects run before the surface's passive effect applies this message.
  useLayoutEffect(() => {
    step.current = count
    replays.set(name, record)
  }, [count, name, record])

  useEffect(() => {
    if (done) {
      wrapper.current?.setAttribute('data-conformance', 'settled')
      return
    }
    const timer = setTimeout(() => setCount(current => current + 1))
    return () => clearTimeout(timer)
  }, [done, count])

  return (
    <div
      ref={wrapper}
      className="grid max-w-md gap-4"
      data-conformance="replaying"
    >
      <A2uiMediaProvider icons={lucideA2uiIcons}>
        <A2uiSurface
          surfaceId={fixture.surfaceId}
          messages={fixture.messages.slice(0, count)}
          registry={registry}
          labels={{ modalClose: 'Close' }}
          onDiagnostic={diagnostic => record.diagnostics.push({ step: step.current, diagnostic })}
        />
      </A2uiMediaProvider>
    </div>
  )
}

const meta = {
  title: 'A2UI/Conformance',
  component: ConformanceReplay,
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    const fixture = getA2uiConformanceFixture(args.fixture)
    await waitFor(
      () => {
        expect(canvasElement.querySelector('[data-conformance="settled"]')).not.toBeNull()
        const surface = canvasElement.querySelector('[data-slot="a2ui-surface"]')
        expect(surface).not.toBeNull()
        expect(surface).not.toHaveAttribute('aria-busy')
        expect(surface!.childElementCount).toBeGreaterThan(0)
      },
      { timeout: 5000 }
    )
    if (fixture.gate !== 'accessible') return
    // Streams may default props they have not sent yet, but not once the last message is in.
    const last = fixture.messages.length
    const replay = replays.get(args.fixture)!
    const failures = replay.diagnostics
      .filter(
        ({ step, diagnostic }) =>
          diagnostic.kind === 'error' ||
          diagnostic.kind === 'fallback' ||
          (step === last &&
            diagnostic.kind === 'defaulted' &&
            requiredProps(diagnostic.component).includes(diagnostic.prop))
      )
      .map(({ diagnostic }) => diagnostic)
    await expect(failures).toEqual([])
    await expect(canvasElement.querySelector('[data-slot="a2ui-fallback"]')).toBeNull()
    await expect([...fixture.components].filter(type => !replay.rendered.has(type))).toEqual([])
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
