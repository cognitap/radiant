import { peekValue } from '@a2ui/web_core/reactivity'
import { isComponentNode, ResolvedBinding, type ComponentNode } from '@a2ui/web_core/resolution'
import {
  isValidUax31Identifier,
  PayloadValidator,
  STRICT_VALIDATION
} from '@a2ui/web_core/validation'
import {
  coerceSchemaProps,
  coerceSchemaValue,
  extractFallbackText,
  fallbackLabelForNode,
  flattenObjectSchema,
  humanizeNodeId,
  isPlainRecord,
  type CatalogDiagnostic,
  type CatalogDiagnosticKind,
  type PropCoercer
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

type SyntheticChildRecord = {
  readonly node: Record<string, unknown>
  readonly ownerId: string
  ownerSnapshot: Record<string, unknown>
  readonly prop: string
}

export type A2uiCoerceState = {
  readonly usedIds: Set<string>
  readonly syntheticById: Map<string, SyntheticChildRecord>
  readonly surfaceHasDefaultCatalog: Map<string, boolean>
}

export const createA2uiCoerceState = (): A2uiCoerceState => ({
  usedIds: new Set<string>(),
  syntheticById: new Map<string, SyntheticChildRecord>(),
  surfaceHasDefaultCatalog: new Map<string, boolean>()
})

const ENVELOPE_KEYS = new Set([
  'id',
  'component',
  'catalogId',
  'checks',
  'metadata',
  'accessibility'
])
const PRIM_TYPE: Record<string, 'string' | 'number' | 'boolean'> = {
  DynamicString: 'string',
  DynamicNumber: 'number',
  DynamicBoolean: 'boolean',
  Weight: 'number'
}

export const getRegistryEntry = (r: A2uiRegistry, name: string): A2uiRegistryEntry | undefined =>
  Object.hasOwn(r.entries, name) ? r.entries[name] : undefined

const unwrapBinding = (v: unknown) => (v instanceof ResolvedBinding ? v.value : v)
const isExpr = (v: unknown): v is Record<string, unknown> =>
  isPlainRecord(v) && ('@path' in v || 'path' in v || '@call' in v || 'call' in v)
const refDef = (s: CatalogJsonSchema | undefined) =>
  typeof s?.$ref === 'string' ? s.$ref.slice(s.$ref.lastIndexOf('/') + 1) : ''

function refFallback(
  def: string,
  id: string,
  raw: Readonly<Record<string, unknown>>,
  prop: string
) {
  if (def === 'DynamicString') return prop === 'label' ? fallbackLabelForNode(id, raw) : ''
  if (def === 'DynamicNumber') return 0
  if (def === 'DynamicBoolean') return false
  if (def === 'DynamicStringList' || def === 'ChildList') return []
  if (def === 'Action') return { event: { name: COERCED_NOOP_ACTION_NAME } }
  return undefined
}

const nonEmptyStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((i): i is string => typeof i === 'string' && Boolean(i)) : []

function normalizeTemplate(v: unknown): Record<string, unknown> | undefined {
  if (!isPlainRecord(v) || typeof v.componentId !== 'string' || !v.componentId) return
  if (typeof v.path !== 'string' || Object.keys(v).some(k => k !== 'componentId' && k !== 'path'))
    return
  // Web Core's GenericBinder treats "" as falsy on structural templates; "/" reads the root array.
  return v.path === '' ? { componentId: v.componentId, path: '/' } : v
}

function makeUniqueId(prefix: string, base: string, usedIds: Set<string>): string {
  const safe = base.replace(/[^A-Za-z0-9_]/g, '_') || 'node'
  let id = `${prefix}${safe}`
  for (let n = 2; usedIds.has(id); n++) id = `${prefix}${safe}_${n}`
  usedIds.add(id)
  return id
}

function findContainer(registry: A2uiRegistry, requireList: boolean) {
  let fallback: { entry: A2uiRegistryEntry; slotProp: string; isList: boolean } | undefined
  for (const name of Object.keys(registry.entries)) {
    const entry = getRegistryEntry(registry, name)
    if (!entry) continue
    const { properties, required } = flattenObjectSchema(entry.schema as Record<string, unknown>)
    let listProp: string | undefined
    let childProp: string | undefined
    let blocked = false
    for (const [k, s] of Object.entries(properties)) {
      if (k === 'component') continue
      const def = refDef(s)
      if (def === 'ChildList') listProp = k
      else if (def === 'Child') childProp = k
      else if (required.has(k) && s.default === undefined && s.const === undefined) blocked = true
    }
    if (blocked) continue
    if (listProp) {
      if (requireList) return { entry, slotProp: listProp, isList: true }
      fallback ??= { entry, slotProp: listProp, isList: true }
    }
    if (childProp && !requireList) return { entry, slotProp: childProp, isList: false }
  }
  return fallback
}

function collectDescendantText(
  raw: Readonly<Record<string, unknown>>,
  rawById: ReadonlyMap<string, Readonly<Record<string, unknown>>>,
  visited = new Set<string>()
): string {
  const id = typeof raw.id === 'string' ? raw.id : ''
  if (id) {
    if (visited.has(id)) return ''
    visited.add(id)
  }
  const own = extractFallbackText(raw)
  const parts = own ? [own] : []
  const refs = [
    ...(typeof raw.child === 'string' && raw.child ? [raw.child] : []),
    ...nonEmptyStrings(raw.children)
  ]
  for (const refId of refs) {
    const child = rawById.get(refId)
    const text = child ? collectDescendantText(child, rawById, visited) : ''
    if (text) parts.push(text)
  }
  return parts.join(' ').trim()
}

function errorSegments(error: unknown): string[] {
  if (!error || typeof error !== 'object') return []
  const { path, details } = error as { readonly path?: unknown; readonly details?: unknown }
  const dp =
    Array.isArray(details) && isPlainRecord(details[0]) && typeof details[0].path === 'string'
      ? details[0].path
      : undefined
  const raw = typeof path === 'string' && path && path !== '/' ? path : dp
  return raw && raw !== '/'
    ? raw
        .replace(/^\/+/, '')
        .split('/')
        .map(s => s.replace(/~1/g, '/').replace(/~0/g, '~'))
        .filter(Boolean)
    : []
}

function findInvalidCall(
  value: unknown,
  path: readonly string[],
  catalogId: string,
  hasDefault: boolean
): { readonly segs: readonly string[]; readonly reason: string } | undefined {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = findInvalidCall(value[i], [...path, String(i)], catalogId, hasDefault)
      if (hit) return hit
    }
    return
  }
  if (!isPlainRecord(value)) return
  const fn = typeof value['@call'] === 'string' ? value['@call'] : undefined
  if (fn && !fn.startsWith('@')) {
    if (value.catalogId !== undefined && value.catalogId !== catalogId)
      return { segs: path, reason: `Unregistered catalogId on '${fn}'.` }
    if (value.catalogId === undefined && !hasDefault)
      return { segs: path, reason: `Missing catalogId on '${fn}'.` }
  }
  for (const [k, v] of Object.entries(value)) {
    const hit = findInvalidCall(v, [...path, k], catalogId, hasDefault)
    if (hit) return hit
  }
}

const isCoerciblePrim = (def: string, v: unknown) =>
  def === 'DynamicString'
    ? typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
    : def === 'DynamicBoolean'
      ? typeof v === 'boolean' || v === 'true' || v === 'false'
      : (typeof v === 'number' && Number.isFinite(v)) ||
        (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)))

/** Sanitizes and coerces incoming A2UI 1.0 messages against the active registry using Web Core's validator. */
export function coerceA2uiMessages(
  messages: readonly A2uiMessage[],
  registry: A2uiRegistry,
  state?: A2uiCoerceState
): CoerceA2uiMessagesResult {
  const sanitized = sanitizeA2uiMessages(messages)
  const diagnostics: CatalogDiagnostic[] = []
  const { usedIds, syntheticById, surfaceHasDefaultCatalog } = state ?? createA2uiCoerceState()
  const validator = new PayloadValidator(registry.toWebCoreCatalog(), STRICT_VALIDATION)

  const makeLog =
    (nodeId: string, component: string) =>
    (kind: CatalogDiagnosticKind, prop: string, received: unknown, used: unknown, reason: string) =>
      diagnostics.push({ kind, nodeId, component, prop, received, used, reason })

  const buildTextFallback = (id: string, text: string, catId: string | undefined) => {
    const textEntry = getRegistryEntry(registry, 'Text')
    if (!textEntry || !isValidUax31Identifier(id)) return undefined
    const env = { id, component: 'Text', ...(catId ? { catalogId: catId } : {}) }
    const { props } = coerceSchemaProps(
      textEntry.schema,
      { ...env, text },
      { nodeId: id, component: 'Text', passthroughKeys: ENVELOPE_KEYS }
    )
    const node = { ...props, ...env }
    try {
      validator.validateComponent(node)
      return node
    } catch {
      return undefined
    }
  }

  const validateAndIsolate = (
    candidate: Record<string, unknown>,
    entry: A2uiRegistryEntry,
    hasDefault: boolean,
    rawProps: Readonly<Record<string, unknown>>
  ): Record<string, unknown> | undefined => {
    const id = String(candidate.id ?? '')
    const cur: Record<string, unknown> = { ...candidate }
    const repaired = new Set<string>()
    const { properties, required } = flattenObjectSchema(entry.schema as Record<string, unknown>)
    const log = makeLog(id, entry.name)

    for (let i = 0; i < Object.keys(cur).length + 6; i++) {
      let segs: readonly string[] = []
      let reason = ''
      try {
        validator.validateComponent(cur)
        const badCall = Object.entries(cur)
          .filter(([k]) => !ENVELOPE_KEYS.has(k) || k === 'checks' || k === 'accessibility')
          .map(([k, v]) => findInvalidCall(v, [k], registry.catalogId, hasDefault))
          .find(Boolean)
        if (!badCall) return cur
        ;({ segs, reason } = badCall)
      } catch (err) {
        segs = errorSegments(err)
        reason = err instanceof Error ? err.message : 'Validation failed.'
      }

      const top = segs[0]
      if (top && top !== 'id' && top !== 'component' && Object.hasOwn(cur, top)) {
        const stripNested = (parent: Record<string, unknown>, k: string, key: string) => {
          if (repaired.has(key) || !Object.hasOwn(parent, k)) return undefined
          repaired.add(key)
          const { [k]: received, ...rest } = parent
          log('stripped', key, received, undefined, reason)
          return rest
        }
        if (top === 'accessibility' && segs[1] && isPlainRecord(cur.accessibility)) {
          const rest = stripNested(cur.accessibility, segs[1], `accessibility.${segs[1]}`)
          if (rest) {
            if (Object.keys(rest).length) cur.accessibility = rest
            else delete cur.accessibility
            continue
          }
        }
        if (top === 'action' && isPlainRecord(cur.action)) {
          const ev = isPlainRecord(cur.action.event) ? cur.action.event : undefined
          if (
            segs[1] === 'event' &&
            segs[2] === 'context' &&
            segs[3] &&
            ev &&
            isPlainRecord(ev.context)
          ) {
            const rest = stripNested(ev.context, segs[3], `action.event.context.${segs[3]}`)
            if (rest) {
              cur.action = { event: { ...ev, context: rest } }
              continue
            }
          }
          if (!repaired.has('action:event') && ev && typeof ev.name === 'string' && ev.name) {
            repaired.add('action:event')
            const nextEv: Record<string, unknown> = { name: ev.name }
            if (typeof ev.userMessage === 'string' || isExpr(ev.userMessage))
              nextEv.userMessage = ev.userMessage
            if (isPlainRecord(ev.context)) nextEv.context = ev.context
            const extra = Object.keys(ev).length !== Object.keys(nextEv).length
            if (extra || Object.keys(cur.action).length !== 1) {
              const received = cur.action
              cur.action = { event: nextEv }
              log('coerced', 'action', received, cur.action, reason)
              continue
            }
          }
        }
        if (!repaired.has(top)) {
          repaired.add(top)
          const received = cur[top]
          const ps = Object.hasOwn(properties, top) ? properties[top] : undefined
          const used =
            ps && required.has(top)
              ? (refFallback(refDef(ps), id, rawProps, top) ?? ps.default ?? ps.enum?.[0])
              : undefined
          if (used === undefined) delete cur[top]
          else cur[top] = used
          log(used === undefined ? 'stripped' : 'coerced', top, received, used, reason)
          continue
        }
      }

      const catId = typeof cur.catalogId === 'string' ? cur.catalogId : undefined
      const fallback = buildTextFallback(id, extractFallbackText(rawProps), catId)
      const received = top && Object.hasOwn(cur, top) ? cur[top] : rawProps
      log(
        'fallback',
        segs.length ? segs.join('.') : '$node',
        received,
        fallback ? 'Text' : undefined,
        reason
      )
      return fallback
    }
    return undefined
  }

  const coerceList = (rawComponents: readonly unknown[], hasDefault: boolean) => {
    const rawById = new Map<string, Readonly<Record<string, unknown>>>()
    const incomingRealIds = new Set<string>()
    for (const item of rawComponents) {
      if (isPlainRecord(item) && typeof item.id === 'string' && item.id) {
        usedIds.add(item.id)
        incomingRealIds.add(item.id)
        if (!rawById.has(item.id)) rawById.set(item.id, item)
      }
    }

    const output: Record<string, unknown>[] = []
    const synthesized: Record<string, unknown>[] = []

    // Relocate any previously synthesized child whose ID collides with an incoming real component.
    for (const realId of incomingRealIds) {
      const col = syntheticById.get(realId)
      if (!col) continue
      syntheticById.delete(realId)
      if (incomingRealIds.has(col.ownerId)) continue
      const nextId = makeUniqueId('__coerced_child_', col.ownerId, usedIds)
      const relocatedNode = { ...col.node, id: nextId }
      const relocatedOwner = { ...col.ownerSnapshot, [col.prop]: nextId }
      syntheticById.set(nextId, { ...col, node: relocatedNode, ownerSnapshot: relocatedOwner })
      output.push(relocatedOwner)
      synthesized.push(relocatedNode)
    }

    const seenInBatch = new Set<string>()
    for (let index = 0; index < rawComponents.length; index++) {
      const raw = rawComponents[index]
      if (!isPlainRecord(raw)) {
        makeLog(makeUniqueId('component_', String(index), usedIds), 'unknown')(
          'fallback',
          '$node',
          raw,
          undefined,
          'Non-object.'
        )
        continue
      }

      const id =
        typeof raw.id === 'string' && raw.id
          ? raw.id
          : makeUniqueId('component_', String(index), usedIds)
      const compName = typeof raw.component === 'string' ? raw.component : ''
      const entry = getRegistryEntry(registry, compName)
      const label = entry ? entry.name : compName || 'unknown'
      const log = makeLog(id, label)

      if (seenInBatch.has(id)) {
        log('stripped', 'id', raw, undefined, 'Duplicate ID.')
        continue
      }
      seenInBatch.add(id)
      for (const [sid, rec] of syntheticById) if (rec.ownerId === id) syntheticById.delete(sid)

      let catId: string | undefined
      if (raw.catalogId !== undefined) {
        if (raw.catalogId === registry.catalogId) catId = registry.catalogId
        else {
          catId = hasDefault ? undefined : registry.catalogId
          log(
            hasDefault ? 'stripped' : 'coerced',
            'catalogId',
            raw.catalogId,
            catId,
            'Bad catalogId.'
          )
        }
      } else if (!hasDefault) {
        catId = registry.catalogId
        log('defaulted', 'catalogId', undefined, catId, 'Missing catalogId.')
      }

      if (!entry) {
        const childIds = nonEmptyStrings(raw.children)
        const tpl = normalizeTemplate(raw.children)
        const single = typeof raw.child === 'string' && raw.child ? raw.child : undefined
        const isMulti = Boolean(tpl) || childIds.length > 1
        const match =
          isMulti || childIds.length === 1 || single ? findContainer(registry, isMulti) : undefined
        const descText = match ? '' : collectDescendantText(raw, rawById)
        const textNode = match ? undefined : buildTextFallback(id, descText, catId)
        const chosen =
          match ??
          ((!textNode || (isMulti && !descText)) && isMulti && childIds[0]
            ? findContainer(registry, false)
            : undefined)

        if (chosen) {
          const slotVal = chosen.isList
            ? (tpl ?? (childIds.length ? childIds : [single!]))
            : (single ?? childIds[0])
          log('fallback', 'component', raw.component, chosen.entry.name, 'Preserved children.')
          const valid = validateAndIsolate(
            {
              id,
              component: chosen.entry.name,
              ...(catId ? { catalogId: catId } : {}),
              [chosen.slotProp]: slotVal
            },
            chosen.entry,
            hasDefault,
            raw
          )
          if (valid) output.push(valid)
        } else if (textNode && (!isMulti || descText)) {
          log('fallback', 'component', raw.component, 'Text', 'Unknown component.')
          output.push(textNode)
        } else {
          log('fallback', 'component', raw.component, undefined, 'Unknown component.')
        }
        continue
      }

      let unrenderable = false
      const pendingSynth: Array<{ readonly prop: string; readonly node: Record<string, unknown> }> =
        []
      const propCoercer: PropCoercer = (value, ctx) => {
        const def = refDef(ctx.propSchema)
        if (!def) return { handled: false }
        const report = (kind: CatalogDiagnosticKind, used: unknown, reason: string) => {
          ctx.emit({ kind, prop: ctx.prop, received: value, used, reason })
          return used === undefined ? { handled: true, omit: true } : { handled: true, value: used }
        }
        const fail = (fb: unknown) =>
          ctx.required
            ? report(
                value === undefined ? 'defaulted' : 'coerced',
                fb,
                value === undefined ? `Missing ${def}.` : `Invalid ${def}.`
              )
            : value === undefined
              ? { handled: true, omit: true }
              : report('stripped', undefined, `Invalid ${def}.`)

        if (def in PRIM_TYPE) {
          if (def !== 'Weight' && isExpr(value)) return { handled: true, value }
          const schema: CatalogJsonSchema =
            def === 'DynamicString' && ctx.required && ctx.prop === 'label'
              ? { type: 'string', minLength: 1 }
              : { type: PRIM_TYPE[def]! }
          return isCoerciblePrim(def, value)
            ? { handled: true, value: coerceSchemaValue(value, ctx.prop, schema, ctx) }
            : fail(refFallback(def, ctx.nodeId, ctx.rawProps, ctx.prop))
        }
        if (def === 'DynamicStringList' || def === 'ChildList') {
          const isChildList = def === 'ChildList'
          if (
            Array.isArray(value) &&
            value.every(i => typeof i === 'string' && (!isChildList || Boolean(i)))
          )
            return { handled: true, value }
          if (!isChildList && isExpr(value)) return { handled: true, value }
          const tpl = isChildList ? normalizeTemplate(value) : undefined
          if (tpl) return { handled: true, value: tpl }
          if (typeof value === 'string' && (!isChildList || value))
            return report('coerced', [value], 'Wrapped value.')
          if (Array.isArray(value)) {
            const list = isChildList
              ? nonEmptyStrings(value)
              : value
                  .filter(
                    i => typeof i === 'string' || typeof i === 'number' || typeof i === 'boolean'
                  )
                  .map(String)
            return report('coerced', list, `Filtered ${def}.`)
          }
          return fail([])
        }
        if (def === 'Child') {
          if (typeof value === 'string' && value) return { handled: true, value }
          if (!ctx.required) return fail(undefined)
          const synthId = makeUniqueId('__coerced_child_', ctx.nodeId, usedIds)
          const synthNode = buildTextFallback(
            synthId,
            extractFallbackText(ctx.rawProps) || humanizeNodeId(ctx.nodeId),
            catId
          )
          if (!synthNode) {
            usedIds.delete(synthId)
            unrenderable = true
            return report('fallback', undefined, 'No compatible Text.')
          }
          pendingSynth.push({ prop: ctx.prop, node: synthNode })
          return fail(synthId)
        }
        if (def === 'Action') {
          return isPlainRecord(value) && ('event' in value || 'functionCall' in value)
            ? { handled: true, value }
            : fail({ event: { name: COERCED_NOOP_ACTION_NAME } })
        }
        return { handled: false }
      }

      const result = coerceSchemaProps(entry.schema, raw, {
        nodeId: id,
        component: entry.name,
        passthroughKeys: ENVELOPE_KEYS,
        customPropCoercer: propCoercer
      })
      diagnostics.push(...result.diagnostics)
      if (unrenderable) continue

      const assembled: Record<string, unknown> = { ...result.props, id, component: entry.name }
      if (catId) assembled.catalogId = catId
      else delete assembled.catalogId

      const validated = validateAndIsolate(assembled, entry, hasDefault, raw)
      if (validated) {
        output.push(validated)
        for (const synth of pendingSynth) {
          if (validated[synth.prop] === synth.node.id) {
            synthesized.push(synth.node)
            syntheticById.set(String(synth.node.id), {
              node: synth.node,
              ownerId: id,
              ownerSnapshot: validated,
              prop: synth.prop
            })
          }
        }
      }
    }

    output.push(...synthesized)
    return output
  }

  for (const m of sanitized) {
    const op = isPlainRecord(m)
      ? isPlainRecord(m.createSurface)
        ? m.createSurface
        : isPlainRecord(m.updateComponents)
          ? m.updateComponents
          : undefined
      : undefined
    if (op && Array.isArray(op.components)) {
      for (const item of op.components)
        if (isPlainRecord(item) && typeof item.id === 'string' && item.id) usedIds.add(item.id)
    }
  }

  const coerced = sanitized.map(m => {
    if (!isPlainRecord(m)) return m
    if (isPlainRecord(m.createSurface)) {
      const sid =
        typeof m.createSurface.surfaceId === 'string' ? m.createSurface.surfaceId : '$surface'
      const rawCat = m.createSurface.catalogId
      const next: Record<string, unknown> = { ...m.createSurface }
      let hasDefault = rawCat === registry.catalogId
      if (rawCat !== undefined && rawCat !== registry.catalogId) {
        next.catalogId = registry.catalogId
        hasDefault = true
        makeLog(sid, '$surface')(
          'coerced',
          'catalogId',
          rawCat,
          registry.catalogId,
          'Bad surface catalogId.'
        )
      }
      surfaceHasDefaultCatalog.set(sid, hasDefault)
      if (Array.isArray(m.createSurface.components))
        next.components = coerceList(m.createSurface.components, hasDefault)
      return { ...m, createSurface: next }
    }
    if (isPlainRecord(m.updateComponents) && Array.isArray(m.updateComponents.components)) {
      const sid =
        typeof m.updateComponents.surfaceId === 'string' ? m.updateComponents.surfaceId : '$surface'
      const hasDefault = surfaceHasDefaultCatalog.get(sid) ?? true
      return {
        ...m,
        updateComponents: {
          ...m.updateComponents,
          components: coerceList(m.updateComponents.components, hasDefault)
        }
      }
    }
    return m
  })

  return { messages: coerced, diagnostics }
}

/** Coerces invalid resolved dynamic labels while keeping the underlying binding reactive. */
export function coerceA2uiResolvedProps(
  entry: A2uiRegistryEntry,
  node: ComponentNode,
  resolvedProps: Readonly<Record<string, unknown>>
): {
  readonly props: Readonly<Record<string, unknown>>
  readonly diagnostics: readonly CatalogDiagnostic[]
} {
  const { properties, required } = flattenObjectSchema(entry.schema as Record<string, unknown>)
  const s = Object.hasOwn(properties, 'label') ? properties.label : undefined
  if (!s || !required.has('label') || refDef(s) !== 'DynamicString')
    return { props: resolvedProps, diagnostics: [] }

  const val = unwrapBinding(resolvedProps.label)
  if (typeof val === 'string' && val.trim()) return { props: resolvedProps, diagnostics: [] }

  const ph = unwrapBinding(resolvedProps.placeholder)
  const fallback =
    typeof ph === 'string' && ph.trim() ? ph.trim() : humanizeNodeId(node.componentId)
  return {
    props: { ...resolvedProps, label: fallback },
    diagnostics: [
      {
        kind: 'coerced',
        nodeId: node.componentId,
        component: entry.name,
        prop: 'label',
        received: val,
        used: fallback,
        reason: 'Invalid resolved label.'
      }
    ]
  }
}

/** Extracts readable fallback text from a resolved `ComponentNode` (and its children) for error boundaries. */
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
  for (const [k, v] of Object.entries(resolved)) unwrapped[k] = unwrapBinding(v)
  const own = extractFallbackText(unwrapped)
  if (own) return own
  if (isComponentNode(resolved.child))
    return extractA2uiNodeFallbackText(resolved.child, undefined, visited)
  if (Array.isArray(resolved.children)) {
    return resolved.children
      .filter(isComponentNode)
      .map(c => extractA2uiNodeFallbackText(c, undefined, visited))
      .filter(Boolean)
      .join(' ')
  }
  return ''
}
