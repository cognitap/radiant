import { radiantCatalog, type Catalog } from '../catalog/index.js'
import type { A2uiAccessibilityRule } from './accessibilityRules.js'
import {
  A2UI_GENERATED_COMPONENT_NAMES,
  a2uiExtensionInstructions,
  generateA2uiCatalogs,
  type A2uiJsonSchema
} from './catalogGenerator.js'
import { radiantA2uiExtensionRegistry } from './extensionEntries.js'
import {
  createA2uiRegistry,
  createA2uiRegistryEntry,
  type A2uiComponentAdapter,
  type A2uiComponentReference,
  type A2uiRegistry,
  type A2uiRegistryEntry
} from './registry.js'

export type A2uiExtensionEntryInput = {
  /** Name of an entry added to `catalog` with `extendCatalog`. */
  readonly name: string
  readonly component: A2uiComponentReference
  readonly adapter: A2uiComponentAdapter
  /** Accessibility rules checked by `validateA2uiAccessibility`; `[]` declares none. */
  readonly accessibility: readonly A2uiAccessibilityRule[]
}

const generatedComponents = new WeakMap<Catalog, Readonly<Record<string, A2uiJsonSchema>>>()

function extensionComponents(catalog: Catalog): Readonly<Record<string, A2uiJsonSchema>> {
  let components = generatedComponents.get(catalog)
  if (!components) {
    components = generateA2uiCatalogs(catalog).extension.components
    generatedComponents.set(catalog, components)
  }
  return components
}

/**
 * Builds the A2UI registry entry for an application entry of a catalog made with
 * `extendCatalog`. Its schema and agent-facing description come from the generated
 * extension catalog, so they match the canonical entry and its guidance.
 */
export function createA2uiExtensionEntry(
  catalog: Catalog,
  input: A2uiExtensionEntryInput
): A2uiRegistryEntry {
  if (!input || typeof input !== 'object') {
    throw new TypeError('createA2uiExtensionEntry requires an entry input object.')
  }
  const name = input.name
  if (typeof name !== 'string' || !name) {
    throw new TypeError('createA2uiExtensionEntry requires the name of a catalog entry.')
  }
  if (
    Object.hasOwn(radiantCatalog.entries, name) ||
    A2UI_GENERATED_COMPONENT_NAMES.includes(name)
  ) {
    throw new TypeError(
      `"${name}" is a Radiant entry; give the application entry a name Radiant does not use.`
    )
  }
  if (!catalog || typeof catalog !== 'object' || !Object.hasOwn(catalog.entries ?? {}, name)) {
    throw new TypeError(
      `Catalog has no entry "${name}"; add it with extendCatalog(radiantCatalog, ...) first.`
    )
  }
  const { description, ...schema } = extensionComponents(catalog)[name] ?? {}
  if (typeof description !== 'string') {
    throw new TypeError(`Catalog entry "${name}" did not generate an A2UI component.`)
  }
  return createA2uiRegistryEntry({
    name,
    component: input.component,
    adapter: input.adapter,
    accessibility: input.accessibility,
    schema,
    description
  })
}

export type A2uiExtensionRegistryInput = {
  /** Registry the host extends. Defaults to `radiantA2uiExtensionRegistry`. */
  readonly base?: A2uiRegistry
  /** The host's own catalog ID; surfaces may still name any catalog in the base chain. */
  readonly catalogId: string
  /** Defaults to the catalog's `id`. */
  readonly title?: string
  /** Defaults to the catalog's `description`. */
  readonly description?: string
  /** Entries made with `createA2uiExtensionEntry` from the same catalog. */
  readonly entries: readonly A2uiRegistryEntry[]
}

function mergeInstructions(...blocks: readonly (string | undefined)[]): string | undefined {
  const lines: string[] = []
  for (const block of blocks) {
    for (const line of block?.split('\n') ?? []) {
      if (line.trim() && !lines.includes(line)) lines.push(line)
    }
  }
  return lines.length > 0 ? lines.join('\n') : undefined
}

/**
 * Builds a host registry that extends Radiant's A2UI registries with application entries.
 * Its instructions add the rules the app entries' props need, such as `tone`, to the base's.
 */
export function createA2uiExtensionRegistry(
  catalog: Catalog,
  input: A2uiExtensionRegistryInput
): A2uiRegistry {
  if (!input || typeof input !== 'object' || !Array.isArray(input.entries)) {
    throw new TypeError('createA2uiExtensionRegistry requires an input with an entries array.')
  }
  const missing = input.entries
    .map(entry => entry?.name)
    .filter(name => !Object.hasOwn(catalog?.entries ?? {}, name))
  if (missing.length > 0) {
    throw new TypeError(
      `Catalog has no entry for ${missing.map(name => `"${String(name)}"`).join(', ')}; create entries with createA2uiExtensionEntry from the same catalog.`
    )
  }
  const base = input.base ?? radiantA2uiExtensionRegistry
  return createA2uiRegistry({
    catalogId: input.catalogId,
    title: input.title ?? catalog.id,
    description: input.description ?? catalog.description,
    instructions: mergeInstructions(
      base.instructions,
      a2uiExtensionInstructions(
        Object.fromEntries(input.entries.map(entry => [entry.name, entry.schema]))
      )
    ),
    extends: base,
    entries: input.entries
  })
}
