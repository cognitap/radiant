import { radiantCatalog } from '../catalog/index.js'
import { A2UI_BASIC_CATALOG_ID, generateA2uiCatalogs } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'
import * as profileFixtures from './fixtures.js'
import * as inputFixtures from './inputFixtures.js'
import * as layoutFixtures from './layoutFixtures.js'
import * as mediaFixtures from './mediaFixtures.js'

/**
 * How strictly a fixture is gated: `accessible` fixtures must render without error or fallback
 * diagnostics and pass `validateA2uiAccessibility` and axe; the others only have to render.
 */
export type A2uiConformanceGate = 'accessible' | 'inaccessible' | 'malformed'

export type A2uiConformanceFixture = {
  /** Export name without the `FixtureMessages` or `Messages` suffix, such as `tripRequest`. */
  readonly name: string
  readonly surfaceId: string
  readonly messages: readonly A2uiMessage[]
  /** Basic-catalog component names the messages create or update. */
  readonly components: readonly string[]
  readonly gate: A2uiConformanceGate
}

// Fixtures that break the rules on purpose; every other fixture is held to the accessible gate.
const EXEMPT: Readonly<Record<string, Exclude<A2uiConformanceGate, 'accessible'>>> = {
  inaccessible: 'inaccessible',
  inaccessibleMedia: 'inaccessible',
  malformedProfile: 'malformed'
}

const FIXTURE_MODULES: readonly Readonly<Record<string, unknown>>[] = [
  profileFixtures,
  inputFixtures,
  layoutFixtures,
  mediaFixtures
]

/** Component names of the generated A2UI basic catalog, in catalog order. */
export const A2UI_BASIC_CATALOG_COMPONENTS: readonly string[] = Object.freeze(
  Object.keys(generateA2uiCatalogs(radiantCatalog).basic.components)
)

type Envelope = {
  readonly createSurface?: {
    readonly surfaceId?: string
    readonly catalogId?: string
    readonly components?: readonly { readonly component?: unknown }[]
  }
  readonly updateComponents?: {
    readonly surfaceId?: string
    readonly components?: readonly { readonly component?: unknown }[]
  }
  readonly updateDataModel?: { readonly surfaceId?: string }
}

function isMessageList(value: unknown): value is readonly A2uiMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(message => message && typeof message === 'object' && 'version' in message)
  )
}

/** Every component name the messages create or update, in first-seen order. */
export function componentsInMessages(messages: readonly A2uiMessage[]): readonly string[] {
  const names = new Set<string>()
  for (const message of messages as readonly Envelope[]) {
    const components = [
      ...(message.createSurface?.components ?? []),
      ...(message.updateComponents?.components ?? [])
    ]
    for (const { component } of components) {
      if (typeof component === 'string') names.add(component)
    }
  }
  return [...names]
}

function surfaceOf(messages: readonly A2uiMessage[]): string | undefined {
  const first = messages[0] as Envelope | undefined
  return (
    first?.createSurface?.surfaceId ??
    first?.updateComponents?.surfaceId ??
    first?.updateDataModel?.surfaceId
  )
}

function collectFixtures(): readonly A2uiConformanceFixture[] {
  const fixtures: A2uiConformanceFixture[] = []
  for (const module of FIXTURE_MODULES) {
    const lists = Object.entries(module).filter(
      (entry): entry is [string, readonly A2uiMessage[]] => isMessageList(entry[1])
    )
    const opens = (messages: readonly A2uiMessage[]) =>
      (messages[0] as Envelope).createSurface?.catalogId === A2UI_BASIC_CATALOG_ID
    for (const [exportName, own] of lists) {
      const surfaceId = surfaceOf(own)
      if (!surfaceId) throw new Error(`A2UI fixture ${exportName} names no surface.`)
      let messages = own
      if (!(own[0] as Envelope).createSurface) {
        // A patch replays after the one fixture in its module that creates its surface.
        const bases = lists.filter(([, base]) => opens(base) && surfaceOf(base) === surfaceId)
        if (bases.length !== 1) {
          throw new Error(`A2UI patch fixture ${exportName} needs exactly one base surface.`)
        }
        messages = [...bases[0]![1], ...own]
      } else if (!opens(own)) {
        continue
      }
      const name = exportName.replace(/(Fixture)?Messages$/, '').replace('Fixture', '')
      fixtures.push(
        Object.freeze({
          name,
          surfaceId,
          messages,
          components: componentsInMessages(messages).filter(component =>
            A2UI_BASIC_CATALOG_COMPONENTS.includes(component)
          ),
          gate: EXEMPT[name] ?? 'accessible'
        })
      )
    }
  }
  return Object.freeze(fixtures)
}

/** Every recorded basic-catalog fixture, each replayed to completion by the conformance stories. */
export const a2uiConformanceFixtures: readonly A2uiConformanceFixture[] = collectFixtures()

/** Looks up a conformance fixture by name, throwing when it does not exist. */
export function getA2uiConformanceFixture(name: string): A2uiConformanceFixture {
  const fixture = a2uiConformanceFixtures.find(candidate => candidate.name === name)
  if (!fixture) throw new Error(`Unknown A2UI conformance fixture "${name}".`)
  return fixture
}
