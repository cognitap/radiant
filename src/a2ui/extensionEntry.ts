import { radiantCatalog, type Catalog } from '../catalog/index.js'
import type { A2uiAccessibilityRule } from './accessibilityRules.js'
import {
  A2UI_GENERATED_COMPONENT_NAMES,
  generateA2uiCatalogs,
  type A2uiJsonSchema
} from './catalogGenerator.js'
import {
  createA2uiRegistryEntry,
  type A2uiComponentAdapter,
  type A2uiComponentReference,
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
