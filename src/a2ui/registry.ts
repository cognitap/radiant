import type { ComponentType, ReactNode } from 'react'
import {
  Catalog as WebCoreCatalog,
  type ComponentApi,
  type FunctionImplementation
} from '@a2ui/web_core/catalog'
import type { ComponentNode } from '@a2ui/web_core/resolution'
import {
  findForbiddenPropsInSchema,
  type CatalogDiagnostic,
  type CatalogJsonSchema
} from '../catalog/index.js'
import { renameEntryReferences } from '../catalog/guidance.js'
import {
  A2UI_GENERATED_COMPONENT_NAMES,
  A2UI_PROTOCOL_VERSION,
  type A2uiCatalogDocument,
  type A2uiJsonSchema
} from './catalogGenerator.js'
import type { A2uiAccessibilityRule } from './accessibilityRules.js'

const ENTRY_NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/

export type A2uiRenderOptions = {
  readonly inline?: boolean
}

export type A2uiAdapterContext = {
  readonly node: ComponentNode
  readonly inline: boolean
  readonly renderNode: (child: ComponentNode, options?: A2uiRenderOptions) => ReactNode
  /** Reports a diagnostic to the surface's `onDiagnostic`. Call it from an effect, not during render. */
  readonly reportDiagnostic?: (diagnostic: CatalogDiagnostic) => void
}

export type A2uiComponentAdapter = (
  props: Readonly<Record<string, unknown>>,
  context: A2uiAdapterContext
) => ReactNode

export type A2uiComponentReference =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | readonly ComponentType<any>[]
  | string

export type A2uiRegistryEntryInput = {
  readonly name: string
  readonly component: A2uiComponentReference
  readonly schema: A2uiJsonSchema
  readonly description: string
  readonly adapter: A2uiComponentAdapter
  /** Accessibility rules checked by `validateA2uiAccessibility`; `[]` declares none. */
  readonly accessibility: readonly A2uiAccessibilityRule[]
}

export type A2uiRegistryEntry = {
  readonly name: string
  readonly component: A2uiComponentReference
  readonly schema: A2uiJsonSchema
  readonly description: string
  readonly adapter: A2uiComponentAdapter
  /** Accessibility rules checked by `validateA2uiAccessibility`; `[]` declares none. */
  readonly accessibility: readonly A2uiAccessibilityRule[]
}

export type A2uiRegistryInput = {
  readonly catalogId: string
  readonly title: string
  readonly description: string
  /** Catalog-wide design rules, such as `renderCatalogInstructions()`. */
  readonly instructions?: string
  readonly entries: readonly A2uiRegistryEntry[]
}

export type A2uiRegistry = {
  readonly catalogId: string
  readonly title: string
  readonly description: string
  readonly instructions?: string
  readonly entries: Readonly<Record<string, A2uiRegistryEntry>>
  toCatalogJson(): A2uiCatalogDocument
  toWebCoreCatalog(): WebCoreCatalog<ComponentApi, FunctionImplementation>
}

function findForbiddenInA2uiSchema(schema: A2uiJsonSchema, path: string): readonly string[] {
  const violations: string[] = [...findForbiddenPropsInSchema(schema as CatalogJsonSchema, path)]
  if (Array.isArray(schema.allOf)) {
    for (let i = 0; i < schema.allOf.length; i++) {
      const branch = schema.allOf[i]
      if (branch && typeof branch === 'object') {
        violations.push(
          ...findForbiddenInA2uiSchema(branch as A2uiJsonSchema, `${path}.allOf[${i}]`)
        )
      }
    }
  }
  return violations
}

/**
 * Defines a single validated A2UI registry entry pairing a Radiant component,
 * its curated JSON Schema, its agent-facing description, and its prop adapter.
 */
export function createA2uiRegistryEntry(input: A2uiRegistryEntryInput): A2uiRegistryEntry {
  if (typeof input.name !== 'string' || !ENTRY_NAME_PATTERN.test(input.name)) {
    throw new TypeError(`A2UI registry entry name must be PascalCase; received "${input.name}".`)
  }
  if (typeof input.description !== 'string' || !input.description.trim()) {
    throw new TypeError(`A2UI registry entry "${input.name}" requires a non-empty description.`)
  }
  if (!input.schema || typeof input.schema !== 'object' || Array.isArray(input.schema)) {
    throw new TypeError(`A2UI registry entry "${input.name}" requires a JSON Schema object.`)
  }
  if (typeof input.adapter !== 'function') {
    throw new TypeError(`A2UI registry entry "${input.name}" requires an adapter function.`)
  }
  if (!Array.isArray(input.accessibility)) {
    throw new TypeError(`A2UI registry entry "${input.name}" must declare accessibility rules.`)
  }
  if (
    !input.accessibility.every(
      rule => rule && typeof rule.id === 'string' && rule.id && typeof rule.check === 'function'
    )
  ) {
    throw new TypeError(
      `A2UI registry entry "${input.name}" has an accessibility rule without an id or check function.`
    )
  }
  const forbidden = findForbiddenInA2uiSchema(input.schema, `${input.name}.schema`)
  if (forbidden.length > 0) {
    throw new TypeError(
      `A2UI registry entry "${input.name}" exposes forbidden props: ${forbidden.join(', ')}.`
    )
  }
  return Object.freeze({
    name: input.name,
    component: input.component,
    schema: structuredClone(input.schema),
    description: input.description,
    adapter: input.adapter,
    accessibility: Object.freeze([...input.accessibility])
  })
}

/**
 * Builds an immutable A2UI 1.0 registry that generates both its JSON Schema catalog
 * document and its executable `@a2ui/web_core` catalog from the same entry list.
 */
export function createA2uiRegistry(input: A2uiRegistryInput): A2uiRegistry {
  if (typeof input.catalogId !== 'string' || !input.catalogId.trim()) {
    throw new TypeError('A2UI registry requires a non-empty catalogId.')
  }
  if (typeof input.title !== 'string' || !input.title.trim()) {
    throw new TypeError('A2UI registry requires a non-empty title.')
  }
  if (typeof input.description !== 'string' || !input.description.trim()) {
    throw new TypeError('A2UI registry requires a non-empty description.')
  }
  if (input.instructions !== undefined && typeof input.instructions !== 'string') {
    throw new TypeError('A2UI registry instructions must be a string.')
  }
  if (!Array.isArray(input.entries) || input.entries.length === 0) {
    throw new TypeError('A2UI registry requires at least one entry.')
  }

  const entryMap: Record<string, A2uiRegistryEntry> = {}
  for (const entry of input.entries) {
    if (Object.hasOwn(entryMap, entry.name)) {
      throw new TypeError(`Duplicate A2UI registry entry "${entry.name}".`)
    }
    const validated = createA2uiRegistryEntry(entry)
    entryMap[validated.name] = validated
  }
  const frozenEntries = Object.freeze(entryMap)

  const buildDocument = (): A2uiCatalogDocument => {
    // Pointers such as "(Alert)" to generated components this registry lacks are dropped.
    const names: Record<string, string | null> = {}
    for (const name of A2UI_GENERATED_COMPONENT_NAMES) {
      names[name] = Object.hasOwn(frozenEntries, name) ? name : null
    }
    const components: Record<string, A2uiJsonSchema> = {}
    for (const [name, entry] of Object.entries(frozenEntries)) {
      components[name] = {
        ...structuredClone(entry.schema),
        description: renameEntryReferences(entry.description, names)
      }
    }
    return {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: input.catalogId,
      catalogId: input.catalogId,
      protocolVersion: A2UI_PROTOCOL_VERSION,
      title: input.title,
      description: input.description,
      ...(input.instructions === undefined ? {} : { instructions: input.instructions }),
      components,
      functions: {},
      $defs: {
        anyComponent: {
          oneOf: Object.keys(components).map(name => ({ $ref: `#/components/${name}` })),
          discriminator: { propertyName: 'component' }
        },
        anyFunction: { not: {} },
        Weight: {
          type: 'number',
          description:
            'Relative flex growth of this component inside a Row or Column. Set it only on direct children of a Row or Column.'
        }
      }
    }
  }

  let cachedCatalog: WebCoreCatalog<ComponentApi, FunctionImplementation> | undefined

  return Object.freeze({
    catalogId: input.catalogId,
    title: input.title,
    description: input.description,
    ...(input.instructions === undefined ? {} : { instructions: input.instructions }),
    entries: frozenEntries,
    toCatalogJson(): A2uiCatalogDocument {
      return buildDocument()
    },
    toWebCoreCatalog(): WebCoreCatalog<ComponentApi, FunctionImplementation> {
      if (!cachedCatalog) {
        const parsed = WebCoreCatalog.fromJson(buildDocument(), A2UI_PROTOCOL_VERSION)
        cachedCatalog = new WebCoreCatalog<ComponentApi, FunctionImplementation>(
          parsed.id,
          A2UI_PROTOCOL_VERSION,
          [...parsed.components.values()],
          [],
          {
            defs: parsed.defs,
            title: parsed.title,
            description: parsed.description
          }
        )
      }
      return cachedCatalog
    }
  })
}
