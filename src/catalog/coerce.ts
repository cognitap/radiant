import type { CatalogEntry, CatalogJsonPrimitive, CatalogJsonSchema } from './types.js'
import { isForbiddenCatalogProp } from './validate.js'

export type CatalogDiagnosticKind = 'coerced' | 'defaulted' | 'stripped' | 'fallback'

export type CatalogDiagnostic = {
  readonly kind: CatalogDiagnosticKind
  readonly nodeId: string
  readonly component: string
  readonly prop: string
  readonly received: unknown
  readonly used: unknown
  readonly reason: string
}

export type CatalogDiagnosticSummary = {
  readonly total: number
  readonly coercions: number
  readonly defaults: number
  readonly stripped: number
  readonly fallbacks: number
  readonly byComponent: Readonly<Record<string, number>>
  readonly byProp: Readonly<Record<string, number>>
}

export type PropCoercerContext = {
  readonly nodeId: string
  readonly component: string
  readonly prop: string
  readonly propSchema: CatalogJsonSchema
  readonly required: boolean
  readonly rawProps: Readonly<Record<string, unknown>>
  readonly emit: (diagnostic: Omit<CatalogDiagnostic, 'nodeId' | 'component'>) => void
}

export type PropCoercerResult = {
  readonly handled: boolean
  readonly value?: unknown
  readonly omit?: boolean
}

export type PropCoercer = (value: unknown, context: PropCoercerContext) => PropCoercerResult

export type CoerceSchemaPropsOptions = {
  readonly nodeId: string
  readonly component: string
  readonly passthroughKeys?: ReadonlySet<string>
  readonly customCoercers?: Readonly<Record<string, PropCoercer>>
  readonly customPropCoercer?: PropCoercer
  readonly normalizeStateOwnership?: boolean
}

export type CoerceCatalogPropsOptions = {
  readonly nodeId: string
}

export type CoercePropsResult = {
  readonly props: Record<string, unknown>
  readonly diagnostics: readonly CatalogDiagnostic[]
}

const FALLBACK_TEXT_KEYS = [
  'text',
  'label',
  'title',
  'heading',
  'description',
  'message',
  'placeholder',
  'value'
] as const

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Turns a component ID (such as `display_name` or `emailField`) into a readable fallback label.
 */
export function humanizeNodeId(nodeId: string): string {
  const spaced = nodeId
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!spaced || !/[A-Za-z0-9]/.test(spaced)) return 'Field'
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

/**
 * Extracts readable fallback text from raw component props when a node must degrade gracefully.
 */
export function extractFallbackText(rawProps: Readonly<Record<string, unknown>>): string {
  for (const key of FALLBACK_TEXT_KEYS) {
    const candidate = rawProps[key]
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
    if (typeof candidate === 'number' || typeof candidate === 'boolean') {
      return String(candidate)
    }
  }
  return ''
}

/**
 * Summarizes a list of diagnostics into counts for host telemetry and evaluation harness reports.
 */
export function summarizeCatalogDiagnostics(
  diagnostics: readonly CatalogDiagnostic[]
): CatalogDiagnosticSummary {
  let coercions = 0
  let defaults = 0
  let stripped = 0
  let fallbacks = 0
  const byComponent: Record<string, number> = {}
  const byProp: Record<string, number> = {}

  for (const diagnostic of diagnostics) {
    if (diagnostic.kind === 'coerced') coercions++
    else if (diagnostic.kind === 'defaulted') defaults++
    else if (diagnostic.kind === 'stripped') stripped++
    else if (diagnostic.kind === 'fallback') fallbacks++

    byComponent[diagnostic.component] = (byComponent[diagnostic.component] ?? 0) + 1
    const propKey = `${diagnostic.component}.${diagnostic.prop}`
    byProp[propKey] = (byProp[propKey] ?? 0) + 1
  }

  return Object.freeze({
    total: diagnostics.length,
    coercions,
    defaults,
    stripped,
    fallbacks,
    byComponent: Object.freeze(byComponent),
    byProp: Object.freeze(byProp)
  })
}

function cloneDefault<T>(value: T): T {
  return typeof value === 'object' && value !== null ? structuredClone(value) : value
}

export type FlattenedObjectSchema = {
  readonly properties: Record<string, CatalogJsonSchema>
  readonly required: Set<string>
  readonly additionalProperties: boolean | CatalogJsonSchema | undefined
}

export function flattenObjectSchema(schema: Record<string, unknown>): FlattenedObjectSchema {
  const properties: Record<string, CatalogJsonSchema> = {}
  const required = new Set<string>()
  let additionalProperties: boolean | CatalogJsonSchema | undefined

  function visit(node: Record<string, unknown>) {
    if (isPlainRecord(node.properties)) {
      for (const [key, propSchema] of Object.entries(node.properties)) {
        if (isPlainRecord(propSchema)) {
          properties[key] = propSchema as CatalogJsonSchema
        }
      }
    }
    if (Array.isArray(node.required)) {
      for (const key of node.required) {
        if (typeof key === 'string') required.add(key)
      }
    }
    if (typeof node.additionalProperties === 'boolean') {
      additionalProperties = node.additionalProperties
    } else if (isPlainRecord(node.additionalProperties)) {
      additionalProperties = node.additionalProperties as CatalogJsonSchema
    }
    if (Array.isArray(node.allOf)) {
      for (const branch of node.allOf) {
        if (isPlainRecord(branch)) visit(branch)
      }
    }
  }

  visit(schema)
  return { properties, required, additionalProperties }
}

function primarySchemaType(schema: CatalogJsonSchema): string | undefined {
  if (typeof schema.type === 'string') return schema.type
  if (Array.isArray(schema.type)) {
    return schema.type.find(t => t !== 'null') ?? schema.type[0]
  }
  if (schema.const !== undefined) return typeof schema.const
  if (schema.enum && schema.enum.length > 0) return typeof schema.enum[0]
  if (schema.properties) return 'object'
  if (schema.items) return 'array'
  return undefined
}

function synthesizeFallbackValue(
  prop: string,
  schema: CatalogJsonSchema,
  nodeId: string,
  rawProps: Readonly<Record<string, unknown>>,
  itemIndex?: number
): unknown {
  if (schema.default !== undefined) return cloneDefault(schema.default)
  if (schema.const !== undefined) return schema.const
  if (schema.enum && schema.enum.length > 0) return schema.enum[0]

  const type = primarySchemaType(schema)
  if (type === 'string') {
    if (prop === 'label' && itemIndex === undefined) {
      const placeholder = rawProps.placeholder
      if (typeof placeholder === 'string' && placeholder.trim().length > 0) {
        return placeholder.trim()
      }
      return humanizeNodeId(nodeId)
    }
    if (typeof schema.minLength === 'number' && schema.minLength > 0) {
      if (itemIndex !== undefined) {
        const suffix = itemIndex + 1
        return prop === 'label' ? `Option ${suffix}` : `${prop}_${suffix}`
      }
      return humanizeNodeId(prop || nodeId)
    }
    return ''
  }
  if (type === 'number' || type === 'integer') {
    if (typeof schema.minimum === 'number') return schema.minimum
    if (typeof schema.exclusiveMinimum === 'number') {
      return type === 'integer'
        ? Math.floor(schema.exclusiveMinimum) + 1
        : schema.exclusiveMinimum + 1
    }
    return 0
  }
  if (type === 'boolean') return false
  if (type === 'array') {
    const count = typeof schema.minItems === 'number' && schema.minItems > 0 ? schema.minItems : 0
    if (count === 0 || !schema.items) return []
    const items: unknown[] = []
    for (let i = 0; i < count; i++) {
      items.push(synthesizeFallbackValue(prop, schema.items, nodeId, rawProps, i))
    }
    return items
  }
  if (type === 'object') {
    const { properties, required } = flattenObjectSchema(schema as Record<string, unknown>)
    const obj: Record<string, unknown> = {}
    for (const reqKey of required) {
      const propSchema = Object.hasOwn(properties, reqKey) ? properties[reqKey] : undefined
      if (!propSchema) continue
      const val = synthesizeFallbackValue(reqKey, propSchema, nodeId, rawProps, itemIndex)
      if (val !== undefined) obj[reqKey] = val
    }
    return obj
  }
  return undefined
}

function findCaseInsensitiveEnumMatch(
  received: string,
  allowed: readonly CatalogJsonPrimitive[]
): CatalogJsonPrimitive | undefined {
  const needle = received.trim().toLowerCase()
  for (const candidate of allowed) {
    if (typeof candidate === 'string' && candidate.toLowerCase() === needle) {
      return candidate
    }
  }
  return undefined
}

function coerceValueToSchema(
  received: unknown,
  prop: string,
  schema: CatalogJsonSchema,
  nodeId: string,
  rawProps: Readonly<Record<string, unknown>>,
  emit: (diagnostic: Omit<CatalogDiagnostic, 'nodeId' | 'component'>) => void,
  itemIndex?: number
): unknown {
  if (schema.const !== undefined) {
    if (received === schema.const) return received
    emit({
      kind: 'coerced',
      prop,
      received,
      used: schema.const,
      reason: `Expected constant value ${JSON.stringify(schema.const)}.`
    })
    return schema.const
  }

  if (schema.enum && schema.enum.length > 0) {
    if (schema.enum.includes(received as CatalogJsonPrimitive)) return received
    if (typeof received === 'string') {
      const matched = findCaseInsensitiveEnumMatch(received, schema.enum)
      if (matched !== undefined) {
        emit({
          kind: 'coerced',
          prop,
          received,
          used: matched,
          reason: `Normalized enum value to "${String(matched)}".`
        })
        return matched
      }
    }
    const fallback = schema.default !== undefined ? cloneDefault(schema.default) : schema.enum[0]
    emit({
      kind: 'coerced',
      prop,
      received,
      used: fallback,
      reason: `Unknown enum value; expected one of ${schema.enum.map(v => JSON.stringify(v)).join(', ')}.`
    })
    return fallback
  }

  const allowedTypes = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : []

  if (received === null && allowedTypes.includes('null')) {
    return null
  }

  const type = primarySchemaType(schema)

  if (type === 'string') {
    let next: string
    if (typeof received === 'string') {
      next = received
    } else if (typeof received === 'number' || typeof received === 'boolean') {
      next = String(received)
      emit({
        kind: 'coerced',
        prop,
        received,
        used: next,
        reason: `Expected string; converted ${typeof received} to string.`
      })
    } else {
      next = String(synthesizeFallbackValue(prop, schema, nodeId, rawProps, itemIndex) ?? '')
      emit({
        kind: 'coerced',
        prop,
        received,
        used: next,
        reason: 'Expected string; fell back to safe default.'
      })
      return next
    }

    if (typeof schema.minLength === 'number' && next.length < schema.minLength) {
      const fallback = String(
        synthesizeFallbackValue(prop, schema, nodeId, rawProps, itemIndex) ?? ''
      )
      emit({
        kind: 'coerced',
        prop,
        received,
        used: fallback,
        reason: `String shorter than minLength ${schema.minLength}.`
      })
      return fallback
    }
    if (typeof schema.maxLength === 'number' && next.length > schema.maxLength) {
      const truncated = next.slice(0, schema.maxLength)
      emit({
        kind: 'coerced',
        prop,
        received,
        used: truncated,
        reason: `String exceeded maxLength ${schema.maxLength}; truncated.`
      })
      return truncated
    }
    return next
  }

  if (type === 'number' || type === 'integer') {
    let num: number
    let alreadyCoerced = false
    if (typeof received === 'number' && Number.isFinite(received)) {
      num = received
    } else if (
      typeof received === 'string' &&
      received.trim().length > 0 &&
      Number.isFinite(Number(received))
    ) {
      num = Number(received)
      alreadyCoerced = true
    } else {
      const fallback = Number(
        synthesizeFallbackValue(prop, schema, nodeId, rawProps, itemIndex) ?? 0
      )
      emit({
        kind: 'coerced',
        prop,
        received,
        used: fallback,
        reason: `Expected ${type}; fell back to safe default.`
      })
      return fallback
    }

    let clamped = type === 'integer' ? Math.round(num) : num
    const schemaWithExMax = schema as CatalogJsonSchema & { readonly exclusiveMaximum?: number }
    if (typeof schema.minimum === 'number' && clamped < schema.minimum) {
      clamped = schema.minimum
    }
    if (typeof schema.exclusiveMinimum === 'number' && clamped <= schema.exclusiveMinimum) {
      clamped =
        type === 'integer' ? Math.floor(schema.exclusiveMinimum) + 1 : schema.exclusiveMinimum + 1
    }
    if (typeof schema.maximum === 'number' && clamped > schema.maximum) {
      clamped = schema.maximum
    }
    if (
      typeof schemaWithExMax.exclusiveMaximum === 'number' &&
      clamped >= schemaWithExMax.exclusiveMaximum
    ) {
      clamped =
        type === 'integer'
          ? Math.ceil(schemaWithExMax.exclusiveMaximum) - 1
          : schemaWithExMax.exclusiveMaximum - 1
    }

    if (alreadyCoerced || clamped !== received) {
      emit({
        kind: 'coerced',
        prop,
        received,
        used: clamped,
        reason: alreadyCoerced
          ? `Converted string to ${type}.`
          : `Adjusted ${type} to satisfy schema bounds.`
      })
    }
    return clamped
  }

  if (type === 'boolean') {
    if (typeof received === 'boolean') return received
    if (received === 'true' || received === 'false') {
      const parsed = received === 'true'
      emit({
        kind: 'coerced',
        prop,
        received,
        used: parsed,
        reason: 'Converted string boolean to boolean.'
      })
      return parsed
    }
    const fallback = Boolean(synthesizeFallbackValue(prop, schema, nodeId, rawProps, itemIndex))
    emit({
      kind: 'coerced',
      prop,
      received,
      used: fallback,
      reason: 'Expected boolean; fell back to safe default.'
    })
    return fallback
  }

  if (type === 'array') {
    if (!Array.isArray(received)) {
      const fallback = synthesizeFallbackValue(prop, schema, nodeId, rawProps) as unknown[]
      emit({
        kind: 'coerced',
        prop,
        received,
        used: fallback,
        reason: 'Expected array; fell back to safe default.'
      })
      return fallback
    }
    let next = schema.items
      ? received.map((item, index) =>
          coerceValueToSchema(
            item,
            `${prop}[${index}]`,
            schema.items!,
            nodeId,
            rawProps,
            emit,
            index
          )
        )
      : [...received]

    if (typeof schema.maxItems === 'number' && next.length > schema.maxItems) {
      next = next.slice(0, schema.maxItems)
      emit({
        kind: 'coerced',
        prop,
        received,
        used: next,
        reason: `Array exceeded maxItems ${schema.maxItems}; truncated.`
      })
    }
    if (typeof schema.minItems === 'number' && next.length < schema.minItems && schema.items) {
      const padded = [...next]
      for (let i = padded.length; i < schema.minItems; i++) {
        padded.push(synthesizeFallbackValue(prop, schema.items, nodeId, rawProps, i))
      }
      emit({
        kind: 'coerced',
        prop,
        received,
        used: padded,
        reason: `Array shorter than minItems ${schema.minItems}; supplied fallback item(s).`
      })
      return padded
    }
    return next
  }

  if (type === 'object') {
    if (!isPlainRecord(received)) {
      const fallback = synthesizeFallbackValue(prop, schema, nodeId, rawProps, itemIndex) ?? {}
      emit({
        kind: 'coerced',
        prop,
        received,
        used: fallback,
        reason: 'Expected object; supplied schema-valid fallback.'
      })
      return fallback
    }
    if (!schema.properties && schema.additionalProperties === undefined) return received
    const nested = coerceObjectRecord(schema, received, {
      nodeId,
      component: prop,
      normalizeStateOwnership: false,
      strictDefaultAdditionalProperties: false
    })
    for (const diagnostic of nested.diagnostics) {
      emit({
        kind: diagnostic.kind,
        prop: `${prop}.${diagnostic.prop}`,
        received: diagnostic.received,
        used: diagnostic.used,
        reason: diagnostic.reason
      })
    }
    return nested.props
  }

  return received
}

function controlledKeyForDefaultProp(key: string): string | undefined {
  if (!key.startsWith('default') || key.length <= 7) return undefined
  const rest = key.slice(7)
  if (!/^[A-Z]/.test(rest)) return undefined
  return rest.charAt(0).toLowerCase() + rest.slice(1)
}

type InternalCoerceOptions = CoerceSchemaPropsOptions & {
  readonly strictDefaultAdditionalProperties: boolean
}

function coerceObjectRecord(
  schema: CatalogJsonSchema | Record<string, unknown>,
  rawProps: Readonly<Record<string, unknown>>,
  options: InternalCoerceOptions
): CoercePropsResult {
  const {
    nodeId,
    component,
    passthroughKeys,
    customCoercers,
    customPropCoercer,
    normalizeStateOwnership = true,
    strictDefaultAdditionalProperties
  } = options
  const diagnostics: CatalogDiagnostic[] = []
  const emit = (diagnostic: Omit<CatalogDiagnostic, 'nodeId' | 'component'>) => {
    diagnostics.push({
      ...diagnostic,
      nodeId,
      component
    })
  }

  const { properties, required, additionalProperties } = flattenObjectSchema(
    schema as Record<string, unknown>
  )
  const working: Record<string, unknown> = {}
  const skippedKeys = new Set<string>()

  // 1. Resolve mixed controlled + uncontrolled state pairs for component props only
  if (normalizeStateOwnership) {
    for (const [key, value] of Object.entries(rawProps)) {
      if (value === undefined) continue
      const controlledKey = controlledKeyForDefaultProp(key)
      if (!controlledKey) continue
      const hasControlledInInput = rawProps[controlledKey] !== undefined
      const hasControlledInSchema = Object.hasOwn(properties, controlledKey)
      const hasDefaultInSchema = Object.hasOwn(properties, key)

      if (hasControlledInInput) {
        skippedKeys.add(key)
        emit({
          kind: 'coerced',
          prop: key,
          received: value,
          used: undefined,
          reason: `Mixed controlled ("${controlledKey}") and uncontrolled ("${key}") state; kept "${controlledKey}".`
        })
      } else if (hasControlledInSchema && !hasDefaultInSchema) {
        skippedKeys.add(key)
        working[controlledKey] = value
        emit({
          kind: 'coerced',
          prop: key,
          received: value,
          used: value,
          reason: `Mapped uncontrolled "${key}" to "${controlledKey}".`
        })
      }
    }
  }

  // 2. Copy remaining raw props unless already resolved above
  for (const [key, value] of Object.entries(rawProps)) {
    if (skippedKeys.has(key) || value === undefined) continue
    if (!Object.hasOwn(working, key)) {
      working[key] = value
    }
  }

  // 3. Coerce declared props, apply additionalProperties, and strip forbidden/unknown props
  const coerced: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(working)) {
    if (passthroughKeys?.has(key)) {
      coerced[key] = value
      continue
    }

    if (isForbiddenCatalogProp(key)) {
      emit({
        kind: 'stripped',
        prop: key,
        received: value,
        used: undefined,
        reason: 'Forbidden host prop is not part of the model-facing contract.'
      })
      continue
    }

    const propSchema = Object.hasOwn(properties, key) ? properties[key] : undefined
    if (!propSchema) {
      if (additionalProperties === true) {
        coerced[key] = value
        continue
      }
      if (isPlainRecord(additionalProperties)) {
        coerced[key] = coerceValueToSchema(
          value,
          key,
          additionalProperties as CatalogJsonSchema,
          nodeId,
          rawProps,
          emit
        )
        continue
      }
      if (additionalProperties === undefined && !strictDefaultAdditionalProperties) {
        coerced[key] = value
        continue
      }
      emit({
        kind: 'stripped',
        prop: key,
        received: value,
        used: undefined,
        reason: 'Unknown prop is not declared in component schema.'
      })
      continue
    }

    const ctx: PropCoercerContext = {
      nodeId,
      component,
      prop: key,
      propSchema,
      required: required.has(key),
      rawProps,
      emit
    }

    const specific = customCoercers?.[key]?.(value, ctx)
    if (specific?.handled) {
      if (!specific.omit && specific.value !== undefined) {
        coerced[key] = specific.value
      }
      continue
    }

    const generic = customPropCoercer?.(value, ctx)
    if (generic?.handled) {
      if (!generic.omit && generic.value !== undefined) {
        coerced[key] = generic.value
      }
      continue
    }

    coerced[key] = coerceValueToSchema(value, key, propSchema, nodeId, rawProps, emit)
  }

  // 4. Fill missing required props with safe defaults
  for (const reqKey of required) {
    if (Object.hasOwn(coerced, reqKey) && coerced[reqKey] !== undefined) continue
    if (passthroughKeys?.has(reqKey)) continue
    const propSchema = Object.hasOwn(properties, reqKey) ? properties[reqKey] : undefined
    if (!propSchema) continue

    const ctx: PropCoercerContext = {
      nodeId,
      component,
      prop: reqKey,
      propSchema,
      required: true,
      rawProps,
      emit
    }

    const specific = customCoercers?.[reqKey]?.(undefined, ctx)
    if (specific?.handled) {
      if (!specific.omit && specific.value !== undefined) {
        coerced[reqKey] = specific.value
      }
      continue
    }

    const generic = customPropCoercer?.(undefined, ctx)
    if (generic?.handled) {
      if (!generic.omit && generic.value !== undefined) {
        coerced[reqKey] = generic.value
      }
      continue
    }

    const fallback = synthesizeFallbackValue(reqKey, propSchema, nodeId, rawProps)
    if (fallback !== undefined) {
      coerced[reqKey] = fallback
      emit({
        kind: 'defaulted',
        prop: reqKey,
        received: rawProps[reqKey],
        used: fallback,
        reason: 'Missing required prop; supplied safe default.'
      })
    }
  }

  return { props: coerced, diagnostics }
}

/**
 * Validates and coerces raw model props against a JSON Schema object at the catalog boundary.
 * Never throws: invalid values, missing required props, forbidden host props, and mixed
 * controlled/uncontrolled state are coerced to safe defaults with structured diagnostics.
 */
export function coerceSchemaProps(
  schema: CatalogJsonSchema | Record<string, unknown>,
  rawProps: Readonly<Record<string, unknown>>,
  options: CoerceSchemaPropsOptions
): CoercePropsResult {
  return coerceObjectRecord(schema, rawProps, {
    ...options,
    strictDefaultAdditionalProperties: true
  })
}

function schemaForBindingValueType(
  valueType: CatalogEntry['bindings'][string]['valueType']
): CatalogJsonSchema {
  switch (valueType) {
    case 'string':
      return { type: 'string' }
    case 'number':
      return { type: 'number' }
    case 'boolean':
      return { type: 'boolean' }
    case 'string[]':
      return { type: 'array', items: { type: 'string' } }
    case 'object[]':
      return { type: 'array', items: { type: 'object' } }
  }
}

/**
 * Coerces raw model props against a canonical `CatalogEntry` at the catalog boundary,
 * including both `propsSchema` properties and `bindings`.
 */
export function coerceCatalogProps(
  entry: CatalogEntry,
  rawProps: Readonly<Record<string, unknown>>,
  options: CoerceCatalogPropsOptions
): CoercePropsResult {
  const properties: Record<string, CatalogJsonSchema> = { ...entry.propsSchema.properties }
  for (const [bindingKey, binding] of Object.entries(entry.bindings)) {
    if (!Object.hasOwn(properties, bindingKey)) {
      properties[bindingKey] = schemaForBindingValueType(binding.valueType)
    }
  }
  return coerceObjectRecord(
    {
      ...entry.propsSchema,
      properties
    },
    rawProps,
    {
      nodeId: options.nodeId,
      component: entry.name,
      normalizeStateOwnership: true,
      strictDefaultAdditionalProperties: true
    }
  )
}
