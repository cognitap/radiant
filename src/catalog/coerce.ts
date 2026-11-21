import type { CatalogJsonPrimitive, CatalogJsonSchema } from './types.js'
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

export type DiagnosticLogger = (
  kind: CatalogDiagnosticKind,
  prop: string,
  received: unknown,
  used: unknown,
  reason: string
) => void

export type CoerceSchemaPropsOptions = {
  readonly nodeId: string
  readonly component: string
  readonly customPropCoercer?: (
    value: unknown,
    context: {
      readonly nodeId: string
      readonly prop: string
      readonly propSchema: CatalogJsonSchema
      readonly required: boolean
      readonly rawProps: Readonly<Record<string, unknown>>
      readonly log: DiagnosticLogger
    }
  ) => { readonly handled: boolean; readonly value?: unknown; readonly omit?: boolean }
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

// Drop the uncontrolled default prop when paired with its controlled counterpart.
const STATE_OWNERSHIP_PAIRS = [
  ['value', 'defaultValue'],
  ['checked', 'defaultChecked'],
  ['open', 'defaultOpen']
] as const

export const isPlainRecord = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === 'object' && !Array.isArray(v)

/** Creates a diagnostic logger bound to one node and component, shared by catalog and A2UI coercion. */
export function createDiagnosticLogger(
  target: CatalogDiagnostic[],
  nodeId: string,
  component: string
): DiagnosticLogger {
  return (kind, prop, received, used, reason) => {
    target.push({ kind, nodeId, component, prop, received, used, reason })
  }
}

/** Turns a component ID (such as `display_name` or `emailField`) into a readable fallback label. */
export function humanizeNodeId(nodeId: string): string {
  const spaced = nodeId
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return spaced && /[A-Za-z0-9]/.test(spaced)
    ? spaced[0]!.toUpperCase() + spaced.slice(1).toLowerCase()
    : 'Field'
}

/** Extracts readable fallback text from raw component props when a node must degrade gracefully. */
export function extractFallbackText(rawProps: Readonly<Record<string, unknown>>): string {
  for (const key of FALLBACK_TEXT_KEYS) {
    const v = rawProps[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  }
  return ''
}

/** Summarizes diagnostics into counts for host telemetry and per-run harness reports. */
export function summarizeCatalogDiagnostics(
  diagnostics: readonly CatalogDiagnostic[]
): CatalogDiagnosticSummary {
  const counts = { coerced: 0, defaulted: 0, stripped: 0, fallback: 0 }
  const byComponent: Record<string, number> = {}
  const byProp: Record<string, number> = {}
  const increment = (map: Record<string, number>, key: string) => {
    map[key] = (Object.hasOwn(map, key) ? map[key]! : 0) + 1
  }
  for (const d of diagnostics) {
    counts[d.kind]++
    increment(byComponent, d.component)
    increment(byProp, `${d.component}.${d.prop}`)
  }
  return Object.freeze({
    total: diagnostics.length,
    coercions: counts.coerced,
    defaults: counts.defaulted,
    stripped: counts.stripped,
    fallbacks: counts.fallback,
    byComponent: Object.freeze(byComponent),
    byProp: Object.freeze(byProp)
  })
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
  const visit = (node: Record<string, unknown>) => {
    if (isPlainRecord(node.properties)) {
      for (const [k, s] of Object.entries(node.properties)) {
        if (isPlainRecord(s)) properties[k] = s as CatalogJsonSchema
      }
    }
    if (Array.isArray(node.required)) {
      for (const k of node.required) if (typeof k === 'string') required.add(k)
    }
    if (
      typeof node.additionalProperties === 'boolean' ||
      isPlainRecord(node.additionalProperties)
    ) {
      additionalProperties = node.additionalProperties as boolean | CatalogJsonSchema
    }
    if (Array.isArray(node.allOf)) for (const b of node.allOf) if (isPlainRecord(b)) visit(b)
  }
  visit(schema)
  return { properties, required, additionalProperties }
}

type ValueContext = {
  readonly nodeId: string
  readonly rawProps: Readonly<Record<string, unknown>>
  readonly log: DiagnosticLogger
}

const cloneDefault = <T>(v: T): T => (typeof v === 'object' && v !== null ? structuredClone(v) : v)
const nextAboveExclusiveMinimum = (min: number, isInteger: boolean) =>
  isInteger ? Math.floor(min) + 1 : min + 1

function primaryType(s: CatalogJsonSchema): string | undefined {
  if (typeof s.type === 'string') return s.type
  if (Array.isArray(s.type)) return s.type.find(t => t !== 'null') ?? s.type[0]
  if (s.const !== undefined) return typeof s.const
  if (s.enum?.length) return typeof s.enum[0]
  return s.properties ? 'object' : s.items ? 'array' : undefined
}

export function synthesizeSchemaFallback(
  prop: string,
  s: CatalogJsonSchema,
  ctx: ValueContext,
  idx?: number
): unknown {
  if (s.default !== undefined) return cloneDefault(s.default)
  if (s.const !== undefined) return s.const
  if (s.enum?.length) return s.enum[0]

  const type = primaryType(s)
  if (type === 'string') {
    if (prop === 'label' && idx === undefined) {
      const placeholder = ctx.rawProps.placeholder
      return typeof placeholder === 'string' && placeholder.trim()
        ? placeholder.trim()
        : humanizeNodeId(ctx.nodeId)
    }
    if (typeof s.minLength === 'number' && s.minLength > 0) {
      return idx !== undefined
        ? prop === 'label'
          ? `Option ${idx + 1}`
          : `${prop}_${idx + 1}`
        : humanizeNodeId(prop || ctx.nodeId)
    }
    return ''
  }
  if (type === 'number' || type === 'integer') {
    if (typeof s.minimum === 'number') return s.minimum
    return typeof s.exclusiveMinimum === 'number'
      ? nextAboveExclusiveMinimum(s.exclusiveMinimum, type === 'integer')
      : 0
  }
  if (type === 'boolean') return false
  if (type === 'array') {
    const count = typeof s.minItems === 'number' && s.minItems > 0 ? s.minItems : 0
    return count > 0 && s.items
      ? Array.from({ length: count }, (_, i) => synthesizeSchemaFallback(prop, s.items!, ctx, i))
      : []
  }
  if (type === 'object') {
    const { properties, required } = flattenObjectSchema(s as Record<string, unknown>)
    const obj: Record<string, unknown> = {}
    for (const k of required) {
      const ps = Object.hasOwn(properties, k) ? properties[k] : undefined
      const v = ps ? synthesizeSchemaFallback(k, ps, ctx, idx) : undefined
      if (v !== undefined) obj[k] = v
    }
    return obj
  }
  return undefined
}

export function coerceSchemaValue(
  received: unknown,
  prop: string,
  s: CatalogJsonSchema,
  ctx: ValueContext,
  idx?: number
): unknown {
  const report = (used: unknown, reason: string) => {
    ctx.log('coerced', prop, received, used, reason)
    return used
  }
  const fallback = () => synthesizeSchemaFallback(prop, s, ctx, idx)

  if (s.const !== undefined) {
    return received === s.const ? received : report(s.const, `Expected ${JSON.stringify(s.const)}.`)
  }
  if (s.enum?.length) {
    if (s.enum.includes(received as CatalogJsonPrimitive)) return received
    if (typeof received === 'string') {
      const hit = s.enum.find(
        c => typeof c === 'string' && c.toLowerCase() === received.trim().toLowerCase()
      )
      if (hit !== undefined) return report(hit, `Normalized enum to "${hit}".`)
    }
    return report(
      s.default !== undefined ? cloneDefault(s.default) : s.enum[0],
      'Unknown enum value.'
    )
  }

  const types = Array.isArray(s.type) ? s.type : s.type ? [s.type] : []
  if (received === null && types.includes('null')) return null
  const type = primaryType(s)

  if (type === 'string') {
    const next =
      typeof received === 'string'
        ? received
        : typeof received === 'number' || typeof received === 'boolean'
          ? (report(String(received), `Converted ${typeof received} to string.`) as string)
          : undefined
    if (next === undefined) return report(String(fallback() ?? ''), 'Expected string.')
    return typeof s.minLength === 'number' && next.length < s.minLength
      ? report(String(fallback() ?? ''), `Shorter than minLength ${s.minLength}.`)
      : next
  }

  if (type === 'number' || type === 'integer') {
    const fromStr =
      typeof received === 'string' && received.trim() !== '' && Number.isFinite(Number(received))
    const num =
      typeof received === 'number' && Number.isFinite(received)
        ? received
        : fromStr
          ? Number(received)
          : undefined
    if (num === undefined) return report(Number(fallback() ?? 0), `Expected ${type}.`)
    let v = type === 'integer' ? Math.round(num) : num
    if (typeof s.minimum === 'number' && v < s.minimum) v = s.minimum
    if (typeof s.exclusiveMinimum === 'number' && v <= s.exclusiveMinimum) {
      v = nextAboveExclusiveMinimum(s.exclusiveMinimum, type === 'integer')
    }
    if (typeof s.maximum === 'number' && v > s.maximum) v = s.maximum
    return fromStr || v !== received
      ? report(v, fromStr ? `Converted string to ${type}.` : `Clamped ${type}.`)
      : v
  }

  if (type === 'boolean') {
    if (typeof received === 'boolean') return received
    return received === 'true' || received === 'false'
      ? report(received === 'true', 'Parsed boolean.')
      : report(Boolean(fallback()), 'Expected boolean.')
  }

  if (type === 'array') {
    if (!Array.isArray(received)) return report(fallback(), 'Expected array.')
    const next = s.items
      ? received.map((item, i) => coerceSchemaValue(item, `${prop}[${i}]`, s.items!, ctx, i))
      : [...received]
    if (typeof s.minItems === 'number' && next.length < s.minItems && s.items) {
      for (let i = next.length; i < s.minItems; i++) {
        next.push(synthesizeSchemaFallback(prop, s.items, ctx, i))
      }
      return report(next, `Shorter than minItems ${s.minItems}.`)
    }
    return next
  }

  if (type === 'object') {
    if (!isPlainRecord(received)) return report(fallback() ?? {}, 'Expected object.')
    const nested = coerceObjectRecord(s, received, {
      nodeId: ctx.nodeId,
      component: prop,
      checkMixedState: false,
      strictAdditionalProperties: false
    })
    for (const d of nested.diagnostics)
      ctx.log(d.kind, `${prop}.${d.prop}`, d.received, d.used, d.reason)
    return nested.props
  }

  return received
}

function coerceObjectRecord(
  schema: CatalogJsonSchema | Record<string, unknown>,
  rawProps: Readonly<Record<string, unknown>>,
  options: CoerceSchemaPropsOptions & {
    readonly checkMixedState: boolean
    readonly strictAdditionalProperties: boolean
  }
): CoercePropsResult {
  const { nodeId, component, customPropCoercer } = options
  const diagnostics: CatalogDiagnostic[] = []
  const log = createDiagnosticLogger(diagnostics, nodeId, component)
  const valueCtx: ValueContext = { nodeId, rawProps, log }
  const { properties, required, additionalProperties } = flattenObjectSchema(
    schema as Record<string, unknown>
  )

  const droppedMixed = new Set<string>()
  if (options.checkMixedState) {
    for (const [controlled, uncontrolled] of STATE_OWNERSHIP_PAIRS) {
      if (rawProps[controlled] !== undefined && rawProps[uncontrolled] !== undefined) {
        droppedMixed.add(uncontrolled)
        log(
          'coerced',
          uncontrolled,
          rawProps[uncontrolled],
          undefined,
          `Mixed "${controlled}" and "${uncontrolled}".`
        )
      }
    }
  }

  const coerced: Record<string, unknown> = {}
  const applyCustom = (
    prop: string,
    val: unknown,
    propSchema: CatalogJsonSchema,
    isReq: boolean
  ) => {
    const hit = customPropCoercer?.(val, {
      nodeId,
      prop,
      propSchema,
      required: isReq,
      rawProps,
      log
    })
    if (!hit?.handled) return false
    if (!hit.omit && hit.value !== undefined) coerced[prop] = hit.value
    return true
  }

  for (const [k, v] of Object.entries(rawProps)) {
    if (v === undefined || droppedMixed.has(k)) continue
    if (isForbiddenCatalogProp(k)) {
      log('stripped', k, v, undefined, 'Forbidden host prop.')
      continue
    }
    const ps = Object.hasOwn(properties, k) ? properties[k] : undefined
    if (!ps) {
      if (
        additionalProperties === true ||
        (additionalProperties === undefined && !options.strictAdditionalProperties)
      ) {
        coerced[k] = v
      } else if (isPlainRecord(additionalProperties)) {
        coerced[k] = coerceSchemaValue(v, k, additionalProperties as CatalogJsonSchema, valueCtx)
      } else {
        log('stripped', k, v, undefined, 'Unknown prop.')
      }
      continue
    }
    if (!applyCustom(k, v, ps, required.has(k))) {
      coerced[k] = coerceSchemaValue(v, k, ps, valueCtx)
    }
  }

  for (const k of required) {
    if (Object.hasOwn(coerced, k) && coerced[k] !== undefined) continue
    const ps = Object.hasOwn(properties, k) ? properties[k] : undefined
    if (!ps || applyCustom(k, undefined, ps, true)) continue
    const fallback = synthesizeSchemaFallback(k, ps, valueCtx)
    if (fallback !== undefined) {
      coerced[k] = fallback
      log('defaulted', k, rawProps[k], fallback, 'Missing required prop.')
    }
  }

  return { props: coerced, diagnostics }
}

/** Validates and coerces raw model props against a JSON Schema object at the catalog boundary. */
export const coerceSchemaProps = (
  schema: CatalogJsonSchema | Record<string, unknown>,
  rawProps: Readonly<Record<string, unknown>>,
  options: CoerceSchemaPropsOptions
): CoercePropsResult =>
  coerceObjectRecord(schema, rawProps, {
    ...options,
    checkMixedState: true,
    strictAdditionalProperties: true
  })
