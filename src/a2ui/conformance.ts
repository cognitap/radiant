import { radiantCatalog } from '../catalog/index.js'
import { A2UI_BASIC_CATALOG_ID, generateA2uiCatalogs } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'
import * as extensionFixtures from './extensionFixtures.js'
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
  /** Basic-catalog component names the final surface renders from `root`. */
  readonly components: readonly string[]
  readonly gate: A2uiConformanceGate
}

// Fixtures that break the rules on purpose; every other fixture is held to the accessible gate.
const EXEMPT: Readonly<Record<string, Exclude<A2uiConformanceGate, 'accessible'>>> = {
  inaccessible: 'inaccessible',
  inaccessibleMedia: 'inaccessible',
  malformedProfile: 'malformed'
}

// Every fixture module, by file name; a Node test fails when a fixture file is missing here.
const FIXTURE_MODULES: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  'fixtures.ts': profileFixtures,
  'inputFixtures.ts': inputFixtures,
  'layoutFixtures.ts': layoutFixtures,
  'mediaFixtures.ts': mediaFixtures,
  'extensionFixtures.ts': extensionFixtures
}

/** Fixture files in `src/a2ui/` that the conformance suite reads. */
export const A2UI_CONFORMANCE_FIXTURE_FILES: readonly string[] = Object.freeze(
  Object.keys(FIXTURE_MODULES)
)

/** Component names of the generated A2UI basic catalog, in catalog order. */
export const A2UI_BASIC_CATALOG_COMPONENTS: readonly string[] = Object.freeze(
  Object.keys(generateA2uiCatalogs(radiantCatalog).basic.components)
)

type Component = { readonly id?: unknown; readonly component?: unknown; [prop: string]: unknown }

type Envelope = {
  readonly createSurface?: {
    readonly surfaceId?: string
    readonly catalogId?: string
    readonly dataModel?: unknown
    readonly components?: readonly Component[]
  }
  readonly updateComponents?: {
    readonly surfaceId?: string
    readonly components?: readonly Component[]
  }
  readonly updateDataModel?: {
    readonly surfaceId?: string
    readonly path?: string
    readonly value?: unknown
  }
}

/** The components and data model a fixture leaves behind once every message is applied. */
export type A2uiFinalSurface = {
  readonly components: ReadonlyMap<string, Component>
  readonly dataModel: unknown
}

function isMessageList(value: unknown): value is readonly A2uiMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(message => message && typeof message === 'object' && 'version' in message)
  )
}

function pointer(path: string): string[] {
  return path
    .split('/')
    .filter(Boolean)
    .map(part => part.replaceAll('~1', '/').replaceAll('~0', '~'))
}

function readPath(model: unknown, path: string): unknown {
  let value = model
  for (const key of pointer(path)) {
    if (!value || typeof value !== 'object') return undefined
    value = (value as Record<string, unknown>)[key]
  }
  return value
}

function writePath(model: unknown, path: string, value: unknown): unknown {
  const keys = pointer(path)
  if (keys.length === 0) return structuredClone(value)
  const next = (model && typeof model === 'object' ? structuredClone(model) : {}) as Record<
    string,
    unknown
  >
  let target = next
  for (const key of keys.slice(0, -1)) {
    const child = target[key]
    target[key] = child && typeof child === 'object' ? child : {}
    target = target[key] as Record<string, unknown>
  }
  target[keys.at(-1)!] = structuredClone(value)
  return next
}

/** Applies every message to one surface: later definitions replace earlier ones by id. */
export function finalA2uiSurface(messages: readonly A2uiMessage[]): A2uiFinalSurface {
  const components = new Map<string, Component>()
  let dataModel: unknown = {}
  for (const message of messages as readonly Envelope[]) {
    if (message.createSurface?.dataModel !== undefined) {
      dataModel = structuredClone(message.createSurface.dataModel)
    }
    const update = message.updateDataModel
    if (update) dataModel = writePath(dataModel, update.path ?? '/', update.value)
    for (const component of [
      ...(message.createSurface?.components ?? []),
      ...(message.updateComponents?.components ?? [])
    ]) {
      if (typeof component.id === 'string') components.set(component.id, component)
    }
  }
  return { components, dataModel }
}

function childIds(component: Component, dataModel: unknown): string[] {
  const ids: string[] = []
  for (const key of ['child', 'trigger', 'content']) {
    if (typeof component[key] === 'string') ids.push(component[key])
  }
  const children = component.children
  if (Array.isArray(children)) {
    ids.push(...children.filter((id): id is string => typeof id === 'string'))
  } else if (children && typeof children === 'object') {
    // A template renders only over a non-empty array it can resolve.
    const { componentId, path } = children as { componentId?: unknown; path?: unknown }
    const items = typeof path === 'string' && path.startsWith('/') ? readPath(dataModel, path) : []
    if (typeof componentId === 'string' && Array.isArray(items) && items.length > 0) {
      ids.push(componentId)
    }
  }
  if (Array.isArray(component.tabs)) {
    for (const tab of component.tabs as readonly { child?: unknown }[]) {
      if (typeof tab?.child === 'string') ids.push(tab.child)
    }
  }
  return ids
}

/**
 * Basic-catalog component names reachable from `root` through `child`, `children` (including
 * templates over a non-empty bound array), `trigger`, `content`, and `tabs`, in visit order.
 * Components tagged with another `catalogId` are skipped.
 */
export function renderedBasicComponents(messages: readonly A2uiMessage[]): readonly string[] {
  const { components, dataModel } = finalA2uiSurface(messages)
  const names = new Set<string>()
  const seen = new Set<string>()
  const visit = (id: string) => {
    const component = components.get(id)
    if (seen.has(id) || !component) return
    seen.add(id)
    const tagged = typeof component.catalogId === 'string' ? component.catalogId : undefined
    if (tagged !== undefined && tagged !== A2UI_BASIC_CATALOG_ID) return
    const name = component.component
    if (typeof name === 'string' && A2UI_BASIC_CATALOG_COMPONENTS.includes(name)) names.add(name)
    for (const child of childIds(component, dataModel)) visit(child)
  }
  visit('root')
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
  for (const module of Object.values(FIXTURE_MODULES)) {
    const lists = Object.entries(module).filter(
      (entry): entry is [string, readonly A2uiMessage[]] => isMessageList(entry[1])
    )
    const created = (messages: readonly A2uiMessage[]) => (messages[0] as Envelope).createSurface
    const isBasic = (messages: readonly A2uiMessage[]) =>
      created(messages)?.catalogId === A2UI_BASIC_CATALOG_ID
    for (const [exportName, own] of lists) {
      const surfaceId = surfaceOf(own)
      if (!surfaceId) throw new Error(`A2UI fixture ${exportName} names no surface.`)
      let messages = own
      if (!created(own)) {
        // A patch replays after the one fixture in its module that creates its surface.
        const bases = lists.filter(([, base]) => created(base) && surfaceOf(base) === surfaceId)
        if (bases.length !== 1) {
          throw new Error(`A2UI patch fixture ${exportName} needs exactly one base surface.`)
        }
        if (!isBasic(bases[0]![1])) continue
        messages = [...bases[0]![1], ...own]
      } else if (!isBasic(own)) {
        continue
      }
      const name = exportName.replace(/(Fixture)?Messages$/, '').replace('Fixture', '')
      fixtures.push(
        Object.freeze({
          name,
          surfaceId,
          messages,
          components: renderedBasicComponents(messages),
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
