import { peekValue } from '@a2ui/web_core/reactivity'
import { isComponentNode, ResolvedBinding, type ComponentNode } from '@a2ui/web_core/resolution'
import {
  coerceSchemaProps,
  coerceSchemaValue,
  createDiagnosticLogger,
  extractFallbackText,
  humanizeNodeId,
  isPlainRecord,
  synthesizeSchemaFallback,
  type CatalogDiagnostic,
  type CatalogDiagnosticKind,
  type DiagnosticLogger
} from '../catalog/coerce.js'
import type { CatalogJsonSchema } from '../catalog/types.js'
import type { A2uiRegistry, A2uiRegistryEntry } from './registry.js'
import { sanitizeA2uiMessages, type A2uiMessage } from './sanitize.js'

/** Internal action name used when a required A2UI action was missing and coerced to a no-op. */
export const COERCED_NOOP_ACTION_NAME = '__radiant_coerced_noop__'

export type CoerceA2uiMessagesResult = {
  readonly messages: readonly A2uiMessage[]
  readonly diagnostics: readonly CatalogDiagnostic[]
}

const ENVELOPE_KEYS = new Set(['id', 'catalogId', 'checks', 'metadata', 'accessibility'])

export const getRegistryEntry = (r: A2uiRegistry, name: string): A2uiRegistryEntry | undefined =>
  Object.hasOwn(r.entries, name) ? r.entries[name] : undefined

const isDynamicExpression = (v: unknown): v is Record<string, unknown> =>
  isPlainRecord(v) && ('@path' in v || 'path' in v || '@call' in v || 'call' in v)

const refDefName = (s: CatalogJsonSchema): string =>
  typeof s.$ref === 'string' ? s.$ref.slice(s.$ref.lastIndexOf('/') + 1) : ''

type RefCoerceContext = {
  readonly nodeId: string
  readonly prop: string
  readonly required: boolean
  readonly rawProps: Readonly<Record<string, unknown>>
  readonly log: DiagnosticLogger
  readonly synthesized: Record<string, unknown>[]
  readonly usedIds: Set<string>
  readonly catalogId: string | undefined
}

type RefCoerceOutcome = {
  readonly handled: true
  readonly value?: unknown
  readonly omit?: boolean
}

function reportRef(
  ctx: RefCoerceContext,
  kind: CatalogDiagnosticKind,
  received: unknown,
  used: unknown,
  reason: string
): RefCoerceOutcome {
  ctx.log(kind, ctx.prop, received, used, reason)
  return used === undefined ? { handled: true, omit: true } : { handled: true, value: used }
}

function failRef(
  ctx: RefCoerceContext,
  value: unknown,
  fallback: unknown,
  label: string
): RefCoerceOutcome {
  if (!ctx.required) {
    return value === undefined
      ? { handled: true, omit: true }
      : reportRef(ctx, 'stripped', value, undefined, `Invalid ${label}.`)
  }
  return reportRef(
    ctx,
    value === undefined ? 'defaulted' : 'coerced',
    value,
    fallback,
    value === undefined ? `Missing ${label}.` : `Invalid ${label}.`
  )
}

function coercePrimitiveRef(
  value: unknown,
  ctx: RefCoerceContext,
  schema: CatalogJsonSchema,
  allowExpression: boolean,
  canCoerce: (v: unknown) => boolean,
  label: string
): RefCoerceOutcome {
  if (allowExpression && isDynamicExpression(value)) return { handled: true, value }
  if (canCoerce(value)) {
    return { handled: true, value: coerceSchemaValue(value, ctx.prop, schema, ctx) }
  }
  return failRef(ctx, value, synthesizeSchemaFallback(ctx.prop, schema, ctx), label)
}

const isCoercibleNumber = (v: unknown) =>
  (typeof v === 'number' && Number.isFinite(v)) ||
  (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)))

const A2UI_REF_COERCERS: Record<
  string,
  (value: unknown, ctx: RefCoerceContext) => RefCoerceOutcome
> = {
  DynamicString: (value, ctx) =>
    coercePrimitiveRef(
      value,
      ctx,
      ctx.required && ctx.prop === 'label' ? { type: 'string', minLength: 1 } : { type: 'string' },
      true,
      v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean',
      'DynamicString'
    ),
  DynamicNumber: (value, ctx) =>
    coercePrimitiveRef(value, ctx, { type: 'number' }, true, isCoercibleNumber, 'DynamicNumber'),
  Weight: (value, ctx) =>
    coercePrimitiveRef(value, ctx, { type: 'number' }, false, isCoercibleNumber, 'Weight'),
  DynamicBoolean: (value, ctx) =>
    coercePrimitiveRef(
      value,
      ctx,
      { type: 'boolean' },
      true,
      v => typeof v === 'boolean' || v === 'true' || v === 'false',
      'DynamicBoolean'
    ),
  DynamicStringList(value, ctx) {
    if (
      (Array.isArray(value) && value.every(i => typeof i === 'string')) ||
      isDynamicExpression(value)
    ) {
      return { handled: true, value }
    }
    if (typeof value === 'string')
      return reportRef(ctx, 'coerced', value, [value], 'Wrapped string.')
    if (Array.isArray(value)) {
      const list = value
        .filter(i => typeof i === 'string' || typeof i === 'number' || typeof i === 'boolean')
        .map(String)
      return reportRef(ctx, 'coerced', value, list, 'Filtered DynamicStringList.')
    }
    return failRef(ctx, value, [], 'DynamicStringList')
  },
  Child(value, ctx) {
    if (typeof value === 'string' && value) return { handled: true, value }
    if (!ctx.required) return failRef(ctx, value, undefined, 'Child')
    const base = `__coerced_child_${ctx.nodeId.replace(/[^A-Za-z0-9_]/g, '_') || 'node'}`
    let synthId = base
    for (let n = 2; ctx.usedIds.has(synthId); n++) synthId = `${base}_${n}`
    ctx.usedIds.add(synthId)
    ctx.synthesized.push({
      id: synthId,
      component: 'Text',
      ...(ctx.catalogId ? { catalogId: ctx.catalogId } : {}),
      text: extractFallbackText(ctx.rawProps) || humanizeNodeId(ctx.nodeId)
    })
    return failRef(ctx, value, synthId, 'Child')
  },
  ChildList(value, ctx) {
    if (Array.isArray(value) && value.every(i => typeof i === 'string' && Boolean(i))) {
      return { handled: true, value }
    }
    if (
      isPlainRecord(value) &&
      typeof value.componentId === 'string' &&
      typeof value.path === 'string'
    ) {
      return { handled: true, value }
    }
    if (typeof value === 'string' && value) {
      return reportRef(ctx, 'coerced', value, [value], 'Wrapped child ID.')
    }
    if (Array.isArray(value)) {
      const ids = value.filter((i): i is string => typeof i === 'string' && Boolean(i))
      return reportRef(ctx, 'coerced', value, ids, 'Filtered ChildList.')
    }
    return failRef(ctx, value, [], 'ChildList')
  },
  Action: (value, ctx) =>
    isPlainRecord(value) && ('event' in value || 'functionCall' in value)
      ? { handled: true, value }
      : failRef(ctx, value, { event: { name: COERCED_NOOP_ACTION_NAME } }, 'Action')
}

function coerceUnknownComponent(
  raw: Readonly<Record<string, unknown>>,
  id: string,
  componentName: string,
  diagnostics: CatalogDiagnostic[]
): Record<string, unknown> {
  diagnostics.push({
    kind: 'error',
    code: 'UNKNOWN_COMPONENT_TYPE',
    nodeId: id,
    component: componentName || 'unknown',
    prop: 'component',
    received: raw.component,
    used: 'Text',
    reason: 'Unknown component; degraded to Text.'
  })
  return {
    id,
    component: 'Text',
    ...(typeof raw.catalogId === 'string' ? { catalogId: raw.catalogId } : {}),
    text: extractFallbackText(raw)
  }
}

const ACCESSIBLE_NAME_COMPONENTS = new Set(['ChoicePicker', 'Slider'])

function hasUsableDynamicLabel(value: unknown): boolean {
  if (isDynamicExpression(value)) return true
  if (typeof value === 'string') return value.trim().length > 0
  return (typeof value === 'number' && Number.isFinite(value)) || typeof value === 'boolean'
}

function coerceKnownComponent(
  raw: Readonly<Record<string, unknown>>,
  id: string,
  entry: A2uiRegistryEntry,
  diagnostics: CatalogDiagnostic[],
  synthesized: Record<string, unknown>[],
  usedIds: Set<string>
): Record<string, unknown> {
  const envelope: Record<string, unknown> = {}
  const body: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (ENVELOPE_KEYS.has(k)) envelope[k] = v
    else body[k] = v
  }
  const catalogId = typeof raw.catalogId === 'string' ? raw.catalogId : undefined
  const result = coerceSchemaProps(entry.schema, body, {
    nodeId: id,
    component: entry.name,
    customPropCoercer(value, ctx) {
      const coercer = A2UI_REF_COERCERS[refDefName(ctx.propSchema)]
      return coercer
        ? coercer(value, { ...ctx, synthesized, usedIds, catalogId })
        : { handled: false }
    }
  })
  diagnostics.push(...result.diagnostics)
  const props: Record<string, unknown> = { ...result.props }
  const log = createDiagnosticLogger(diagnostics, id, entry.name)

  if (entry.name === 'ChoicePicker' && Array.isArray(props.options)) {
    const seen = new Set<string>()
    const deduped: unknown[] = []
    for (const option of props.options) {
      if (isPlainRecord(option) && typeof option.value === 'string') {
        if (seen.has(option.value)) continue
        seen.add(option.value)
      }
      deduped.push(option)
    }
    if (deduped.length !== props.options.length) {
      log('coerced', 'options', props.options, deduped, 'Removed duplicate option values.')
      props.options = deduped
    }
  }

  if (ACCESSIBLE_NAME_COMPONENTS.has(entry.name)) {
    const accessibility = isPlainRecord(envelope.accessibility) ? envelope.accessibility : undefined
    if (!hasUsableDynamicLabel(props.label) && !hasUsableDynamicLabel(accessibility?.label)) {
      const fallback = humanizeNodeId(id)
      log(
        raw.label === undefined ? 'defaulted' : 'coerced',
        'label',
        raw.label,
        fallback,
        'Missing accessible label.'
      )
      props.label = fallback
    }
  }

  // A name that fails the spec would make web_core reject the whole batch; an empty path renders nothing.
  const iconNames = entry.name === 'Icon' ? specIconNames(entry.schema) : undefined
  if (iconNames) {
    const name = props.name
    if (typeof name === 'string') {
      if (!iconNames.includes(name)) {
        diagnostics.push(unknownIconDiagnostic(id, name))
        props.name = { svgPath: '' }
      }
    } else {
      const valid = coerceIconObject(name)
      if (valid === undefined) {
        const kind = raw.name === undefined ? 'defaulted' : 'coerced'
        log(kind, 'name', raw.name, { svgPath: '' }, 'Missing or invalid icon name.')
        props.name = { svgPath: '' }
      } else if (valid !== name) {
        log('coerced', 'name', name, valid, 'Coerced svgPath to a string.')
        props.name = valid
      }
    }
  }

  return { ...envelope, ...props, id, component: entry.name }
}

/** The warning reported when an icon name has no icon; the icon renders nothing. */
export const unknownIconDiagnostic = (nodeId: string, name: unknown): CatalogDiagnostic => ({
  kind: 'fallback',
  nodeId,
  component: 'Icon',
  prop: 'name',
  received: name,
  used: null,
  reason:
    typeof name === 'string' ? 'No icon is provided for this name.' : 'Icon name is not a string.',
  code: 'UNKNOWN_ICON'
})

const isBinding = (v: unknown): boolean =>
  isPlainRecord(v) &&
  Object.keys(v).length === 1 &&
  (typeof v['@path'] === 'string' || typeof v.path === 'string')

/** Returns a spec-valid object icon name (a binding or exactly `{ svgPath }`), or undefined. */
function coerceIconObject(value: unknown): unknown {
  if (isBinding(value)) return value
  if (!isPlainRecord(value) || Object.keys(value).length !== 1 || !('svgPath' in value)) return
  const path = value.svgPath
  if (typeof path === 'string' || isDynamicExpression(path)) return value
  if (typeof path === 'number' || typeof path === 'boolean') return { svgPath: String(path) }
  return undefined
}

function specIconNames(schema: Readonly<Record<string, unknown>>): readonly unknown[] | undefined {
  const name = isPlainRecord(schema.properties) ? schema.properties.name : undefined
  const options = isPlainRecord(name) && Array.isArray(name.oneOf) ? name.oneOf : []
  const named = options.find(o => isPlainRecord(o) && Array.isArray(o.enum))
  return isPlainRecord(named) ? (named.enum as readonly unknown[]) : undefined
}

function coerceComponentList(
  rawComponents: readonly unknown[],
  registry: A2uiRegistry,
  diagnostics: CatalogDiagnostic[]
): Record<string, unknown>[] {
  const usedIds = new Set<string>()
  for (const item of rawComponents) {
    if (isPlainRecord(item) && typeof item.id === 'string' && item.id) usedIds.add(item.id)
  }
  const output: Record<string, unknown>[] = []
  const synthesized: Record<string, unknown>[] = []

  for (let i = 0; i < rawComponents.length; i++) {
    const raw = rawComponents[i]
    if (!isPlainRecord(raw)) continue
    const id = typeof raw.id === 'string' && raw.id ? raw.id : `component_${i}`
    const name = typeof raw.component === 'string' ? raw.component : ''
    const entry = getRegistryEntry(registry, name)
    output.push(
      entry
        ? coerceKnownComponent(raw, id, entry, diagnostics, synthesized, usedIds)
        : coerceUnknownComponent(raw, id, name, diagnostics)
    )
  }

  output.push(...synthesized)
  return output
}

/** Sanitizes and coerces incoming A2UI 1.0 messages against the active registry. */
export function coerceA2uiMessages(
  messages: readonly A2uiMessage[],
  registry: A2uiRegistry
): CoerceA2uiMessagesResult {
  const sanitized = sanitizeA2uiMessages(messages)
  const diagnostics: CatalogDiagnostic[] = []
  const coerced = sanitized.map(m => {
    if (!isPlainRecord(m)) return m
    if (isPlainRecord(m.createSurface) && Array.isArray(m.createSurface.components)) {
      return {
        ...m,
        createSurface: {
          ...m.createSurface,
          components: coerceComponentList(m.createSurface.components, registry, diagnostics)
        }
      }
    }
    if (isPlainRecord(m.updateComponents) && Array.isArray(m.updateComponents.components)) {
      return {
        ...m,
        updateComponents: {
          ...m.updateComponents,
          components: coerceComponentList(m.updateComponents.components, registry, diagnostics)
        }
      }
    }
    return m
  })
  return { messages: coerced, diagnostics }
}

/** Extracts readable fallback text from a resolved `ComponentNode` for error boundaries. */
export function extractA2uiNodeFallbackText(
  node: ComponentNode,
  props?: Readonly<Record<string, unknown>>,
  visited: Set<ComponentNode> = new Set()
): string {
  if (visited.has(node)) return ''
  visited.add(node)
  let resolved = props
  if (!resolved) {
    try {
      resolved = peekValue(node.props)
    } catch {
      return ''
    }
  }
  if (!resolved) return ''
  const unwrapped: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(resolved)) {
    unwrapped[k] = v instanceof ResolvedBinding ? v.value : v
  }
  const own = extractFallbackText(unwrapped)
  if (own) return own
  if (isComponentNode(resolved.child)) {
    return extractA2uiNodeFallbackText(resolved.child, undefined, visited)
  }
  if (Array.isArray(resolved.children)) {
    return resolved.children
      .filter(isComponentNode)
      .map(c => extractA2uiNodeFallbackText(c, undefined, visited))
      .filter(Boolean)
      .join(' ')
  }
  return ''
}
