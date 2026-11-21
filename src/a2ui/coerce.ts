import { peekValue } from '@a2ui/web_core/reactivity'
import { isComponentNode, ResolvedBinding, type ComponentNode } from '@a2ui/web_core/resolution'
import {
  isValidUax31Identifier,
  PayloadValidator,
  STRICT_VALIDATION
} from '@a2ui/web_core/validation'
import {
  coerceSchemaProps,
  extractFallbackText,
  flattenObjectSchema,
  humanizeNodeId,
  isPlainRecord,
  type CatalogDiagnostic,
  type PropCoercer
} from '../catalog/coerce.js'
import type { A2uiRegistry, A2uiRegistryEntry } from './registry.js'
import { sanitizeA2uiMessages, type A2uiMessage } from './sanitize.js'

/** Internal action name used when a required A2UI action was missing and coerced to a no-op. */
export const COERCED_NOOP_ACTION_NAME = '__radiant_coerced_noop__'

export type CoerceA2uiMessagesResult = {
  readonly messages: readonly A2uiMessage[]
  readonly diagnostics: readonly CatalogDiagnostic[]
}

export type A2uiCoerceState = {
  readonly usedIds: Set<string>
}

export function createA2uiCoerceState(): A2uiCoerceState {
  return { usedIds: new Set<string>() }
}

const A2UI_ENVELOPE_KEYS = new Set([
  'id',
  'component',
  'catalogId',
  'checks',
  'metadata',
  'accessibility'
])

const ACTION_EVENT_KEYS = new Set(['name', 'userMessage', 'context'])

export function getRegistryEntry(
  registry: A2uiRegistry,
  name: string
): A2uiRegistryEntry | undefined {
  return Object.hasOwn(registry.entries, name) ? registry.entries[name] : undefined
}

function isDataBinding(value: unknown): boolean {
  if (!isPlainRecord(value)) return false
  const hasAtPath = typeof value['@path'] === 'string'
  const hasPath = typeof value.path === 'string'
  if (!hasAtPath && !hasPath) return false
  for (const key of Object.keys(value)) {
    if (key !== '@path' && key !== 'path') return false
  }
  return true
}

function isFunctionCall(value: unknown): boolean {
  if (!isPlainRecord(value)) return false
  const name =
    typeof value['@call'] === 'string'
      ? value['@call']
      : typeof value.call === 'string'
        ? value.call
        : undefined
  if (!name || name.length === 0) return false
  if (value.catalogId !== undefined && typeof value.catalogId !== 'string') return false
  if (name.startsWith('@') && value.catalogId !== undefined) return false
  if (value.args !== undefined && !isPlainRecord(value.args)) return false
  return true
}

function isDynamicExpression(value: unknown): boolean {
  return isDataBinding(value) || isFunctionCall(value)
}

function isDynamicValue(value: unknown): boolean {
  if (
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    typeof value === 'boolean' ||
    Array.isArray(value)
  ) {
    return true
  }
  if (!isPlainRecord(value)) return false
  if ('@path' in value || 'path' in value || '@call' in value || 'call' in value) {
    return isDynamicExpression(value)
  }
  return true
}

function isValidChildTemplate(value: unknown): boolean {
  if (!isPlainRecord(value)) return false
  if (typeof value.componentId !== 'string' || value.componentId.length === 0) return false
  if (typeof value.path !== 'string') return false
  for (const key of Object.keys(value)) {
    if (key !== 'componentId' && key !== 'path') return false
  }
  return true
}

function repairAction(value: unknown): {
  readonly valid: boolean
  readonly repaired?: Record<string, unknown>
} {
  if (!isPlainRecord(value)) return { valid: false }
  const keys = Object.keys(value)

  if ('event' in value && isPlainRecord(value.event)) {
    const ev = value.event
    if (typeof ev.name !== 'string' || ev.name.length === 0) return { valid: false }
    let clean = keys.length === 1
    const nextEvent: Record<string, unknown> = { name: ev.name }

    for (const key of Object.keys(ev)) {
      if (!ACTION_EVENT_KEYS.has(key)) clean = false
    }
    if (ev.userMessage !== undefined) {
      if (typeof ev.userMessage === 'string' || isDynamicExpression(ev.userMessage)) {
        nextEvent.userMessage = ev.userMessage
      } else {
        clean = false
      }
    }
    if (ev.context !== undefined) {
      if (isPlainRecord(ev.context)) {
        const nextContext: Record<string, unknown> = {}
        for (const [ctxKey, ctxVal] of Object.entries(ev.context)) {
          if (isDynamicValue(ctxVal)) {
            nextContext[ctxKey] = ctxVal
          } else {
            clean = false
          }
        }
        nextEvent.context = nextContext
      } else {
        clean = false
      }
    }
    return clean ? { valid: true } : { valid: false, repaired: { event: nextEvent } }
  }

  if ('functionCall' in value && isFunctionCall(value.functionCall)) {
    if (keys.length === 1) return { valid: true }
    return { valid: false, repaired: { functionCall: value.functionCall } }
  }

  return { valid: false }
}

function makeUniqueId(prefix: string, base: string, usedIds: Set<string>): string {
  const safeBase = base.replace(/[^A-Za-z0-9_]/g, '_') || 'node'
  let candidate = `${prefix}${safeBase}`
  let counter = 2
  while (usedIds.has(candidate)) {
    candidate = `${prefix}${safeBase}_${counter}`
    counter++
  }
  usedIds.add(candidate)
  return candidate
}

function fallbackLabelForNode(nodeId: string, rawProps: Readonly<Record<string, unknown>>): string {
  const placeholder = rawProps.placeholder
  if (typeof placeholder === 'string' && placeholder.trim().length > 0) {
    return placeholder.trim()
  }
  return humanizeNodeId(nodeId)
}

function findCompatibleContainer(
  registry: A2uiRegistry,
  preferMulti: boolean
):
  | { readonly entry: A2uiRegistryEntry; readonly slotProp: string; readonly isList: boolean }
  | undefined {
  let singleCandidate:
    | { readonly entry: A2uiRegistryEntry; readonly slotProp: string; readonly isList: boolean }
    | undefined

  for (const name of Object.keys(registry.entries)) {
    const entry = getRegistryEntry(registry, name)
    if (!entry) continue
    const { properties, required } = flattenObjectSchema(entry.schema as Record<string, unknown>)
    let listProp: string | undefined
    let childProp: string | undefined
    let hasOtherRequired = false

    for (const [key, propSchema] of Object.entries(properties)) {
      if (key === 'component') continue
      const ref = propSchema.$ref
      if (typeof ref === 'string' && ref.endsWith('/ChildList')) listProp = key
      else if (typeof ref === 'string' && ref.endsWith('/Child')) childProp = key
      else if (
        required.has(key) &&
        propSchema.default === undefined &&
        propSchema.const === undefined
      ) {
        hasOtherRequired = true
      }
    }
    if (hasOtherRequired) continue
    if (listProp && preferMulti) return { entry, slotProp: listProp, isList: true }
    if (listProp && !singleCandidate) singleCandidate = { entry, slotProp: listProp, isList: true }
    if (childProp && !preferMulti) return { entry, slotProp: childProp, isList: false }
    if (childProp && !singleCandidate)
      singleCandidate = { entry, slotProp: childProp, isList: false }
  }
  return singleCandidate
}

function collectRawDescendantText(
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
  const parts: string[] = own ? [own] : []
  const refs: string[] = []
  if (typeof raw.child === 'string' && raw.child.length > 0) refs.push(raw.child)
  if (Array.isArray(raw.children)) {
    for (const item of raw.children) {
      if (typeof item === 'string' && item.length > 0) refs.push(item)
    }
  }
  for (const refId of refs) {
    const childRaw = rawById.get(refId)
    if (!childRaw) continue
    const childText = collectRawDescendantText(childRaw, rawById, visited)
    if (childText) parts.push(childText)
  }
  return parts.join(' ').trim()
}

function createA2uiPropCoercer(
  registry: A2uiRegistry,
  usedIds: Set<string>,
  synthesized: Record<string, unknown>[],
  componentCatalogId: string | undefined,
  onUnrenderable: () => void
): PropCoercer {
  return (value, ctx) => {
    const ref = ctx.propSchema.$ref
    if (typeof ref !== 'string') return { handled: false }

    if (ref.endsWith('/DynamicString')) {
      if (typeof value === 'string') {
        if (ctx.required && ctx.prop === 'label' && value.trim().length === 0) {
          const fallback = fallbackLabelForNode(ctx.nodeId, ctx.rawProps)
          ctx.emit({
            kind: 'coerced',
            prop: ctx.prop,
            received: value,
            used: fallback,
            reason: 'Empty required label; supplied accessible fallback.'
          })
          return { handled: true, value: fallback }
        }
        return { handled: true, value }
      }
      if (isDynamicExpression(value)) return { handled: true, value }
      if (typeof value === 'number' || typeof value === 'boolean') {
        const coerced = String(value)
        ctx.emit({
          kind: 'coerced',
          prop: ctx.prop,
          received: value,
          used: coerced,
          reason: `Expected DynamicString; converted ${typeof value} to string.`
        })
        return { handled: true, value: coerced }
      }
      if (!ctx.required && value === undefined) return { handled: true, omit: true }
      if (!ctx.required) {
        ctx.emit({
          kind: 'stripped',
          prop: ctx.prop,
          received: value,
          used: undefined,
          reason: 'Invalid optional DynamicString; omitted.'
        })
        return { handled: true, omit: true }
      }
      const fallback = ctx.prop === 'label' ? fallbackLabelForNode(ctx.nodeId, ctx.rawProps) : ''
      ctx.emit({
        kind: value === undefined ? 'defaulted' : 'coerced',
        prop: ctx.prop,
        received: value,
        used: fallback,
        reason:
          value === undefined
            ? 'Missing required DynamicString; supplied safe default.'
            : 'Invalid DynamicString; fell back to safe default.'
      })
      return { handled: true, value: fallback }
    }

    if (ref.endsWith('/DynamicNumber')) {
      if (typeof value === 'number' && Number.isFinite(value)) return { handled: true, value }
      if (isDynamicExpression(value)) return { handled: true, value }
      if (typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))) {
        const coerced = Number(value)
        ctx.emit({
          kind: 'coerced',
          prop: ctx.prop,
          received: value,
          used: coerced,
          reason: 'Expected DynamicNumber; converted numeric string to number.'
        })
        return { handled: true, value: coerced }
      }
      if (!ctx.required) {
        if (value !== undefined) {
          ctx.emit({
            kind: 'stripped',
            prop: ctx.prop,
            received: value,
            used: undefined,
            reason: 'Invalid optional DynamicNumber; omitted.'
          })
        }
        return { handled: true, omit: true }
      }
      ctx.emit({
        kind: value === undefined ? 'defaulted' : 'coerced',
        prop: ctx.prop,
        received: value,
        used: 0,
        reason:
          value === undefined
            ? 'Missing required DynamicNumber; supplied 0.'
            : 'Invalid DynamicNumber; fell back to 0.'
      })
      return { handled: true, value: 0 }
    }

    if (ref.endsWith('/DynamicBoolean')) {
      if (typeof value === 'boolean') return { handled: true, value }
      if (isDynamicExpression(value)) return { handled: true, value }
      if (value === 'true' || value === 'false') {
        const coerced = value === 'true'
        ctx.emit({
          kind: 'coerced',
          prop: ctx.prop,
          received: value,
          used: coerced,
          reason: 'Expected DynamicBoolean; converted string to boolean.'
        })
        return { handled: true, value: coerced }
      }
      if (!ctx.required) {
        if (value !== undefined) {
          ctx.emit({
            kind: 'stripped',
            prop: ctx.prop,
            received: value,
            used: undefined,
            reason: 'Invalid optional DynamicBoolean; omitted.'
          })
        }
        return { handled: true, omit: true }
      }
      ctx.emit({
        kind: value === undefined ? 'defaulted' : 'coerced',
        prop: ctx.prop,
        received: value,
        used: false,
        reason:
          value === undefined
            ? 'Missing required DynamicBoolean; supplied false.'
            : 'Invalid DynamicBoolean; fell back to false.'
      })
      return { handled: true, value: false }
    }

    if (ref.endsWith('/DynamicStringList')) {
      if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
        return { handled: true, value }
      }
      if (isDynamicExpression(value)) return { handled: true, value }
      if (typeof value === 'string') {
        const wrapped = [value]
        ctx.emit({
          kind: 'coerced',
          prop: ctx.prop,
          received: value,
          used: wrapped,
          reason: 'Expected DynamicStringList; wrapped single string.'
        })
        return { handled: true, value: wrapped }
      }
      if (Array.isArray(value)) {
        const filtered = value
          .filter(
            item =>
              typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
          )
          .map(String)
        ctx.emit({
          kind: 'coerced',
          prop: ctx.prop,
          received: value,
          used: filtered,
          reason: 'Coerced DynamicStringList items to strings.'
        })
        return { handled: true, value: filtered }
      }
      if (!ctx.required) {
        if (value !== undefined) {
          ctx.emit({
            kind: 'stripped',
            prop: ctx.prop,
            received: value,
            used: undefined,
            reason: 'Invalid optional DynamicStringList; omitted.'
          })
        }
        return { handled: true, omit: true }
      }
      ctx.emit({
        kind: value === undefined ? 'defaulted' : 'coerced',
        prop: ctx.prop,
        received: value,
        used: [],
        reason:
          value === undefined
            ? 'Missing required DynamicStringList; supplied empty array.'
            : 'Invalid DynamicStringList; fell back to empty array.'
      })
      return { handled: true, value: [] }
    }

    if (ref.endsWith('/Child')) {
      if (typeof value === 'string' && value.length > 0) return { handled: true, value }
      if (!ctx.required) {
        if (value !== undefined) {
          ctx.emit({
            kind: 'stripped',
            prop: ctx.prop,
            received: value,
            used: undefined,
            reason: 'Invalid optional Child reference; omitted.'
          })
        }
        return { handled: true, omit: true }
      }
      if (!getRegistryEntry(registry, 'Text')) {
        onUnrenderable()
        ctx.emit({
          kind: 'fallback',
          prop: ctx.prop,
          received: value,
          used: undefined,
          reason: 'Missing required Child reference and no Text entry is registered; omitted node.'
        })
        return { handled: true, omit: true }
      }
      const fallbackText = extractFallbackText(ctx.rawProps) || humanizeNodeId(ctx.nodeId)
      const synthId = makeUniqueId('__coerced_child_', ctx.nodeId, usedIds)
      synthesized.push({
        id: synthId,
        component: 'Text',
        ...(componentCatalogId ? { catalogId: componentCatalogId } : {}),
        text: fallbackText
      })
      ctx.emit({
        kind: value === undefined ? 'defaulted' : 'coerced',
        prop: ctx.prop,
        received: value,
        used: synthId,
        reason:
          value === undefined
            ? 'Missing required Child reference; synthesized fallback Text child.'
            : 'Invalid Child reference; synthesized fallback Text child.'
      })
      return { handled: true, value: synthId }
    }

    if (ref.endsWith('/ChildList')) {
      if (
        Array.isArray(value) &&
        value.every(item => typeof item === 'string' && item.length > 0)
      ) {
        return { handled: true, value }
      }
      if (isValidChildTemplate(value)) return { handled: true, value }
      if (typeof value === 'string' && value.length > 0) {
        const wrapped = [value]
        ctx.emit({
          kind: 'coerced',
          prop: ctx.prop,
          received: value,
          used: wrapped,
          reason: 'Expected ChildList; wrapped single child ID.'
        })
        return { handled: true, value: wrapped }
      }
      if (Array.isArray(value)) {
        const validIds = value.filter(
          (item): item is string => typeof item === 'string' && item.length > 0
        )
        ctx.emit({
          kind: 'coerced',
          prop: ctx.prop,
          received: value,
          used: validIds,
          reason: 'Removed invalid entries from ChildList.'
        })
        return { handled: true, value: validIds }
      }
      ctx.emit({
        kind: value === undefined ? 'defaulted' : 'coerced',
        prop: ctx.prop,
        received: value,
        used: [],
        reason:
          value === undefined
            ? 'Missing required ChildList; supplied empty array.'
            : 'Invalid ChildList; fell back to empty array.'
      })
      return { handled: true, value: [] }
    }

    if (ref.endsWith('/Action')) {
      const checked = repairAction(value)
      if (checked.valid) return { handled: true, value }
      if (checked.repaired) {
        ctx.emit({
          kind: 'coerced',
          prop: ctx.prop,
          received: value,
          used: checked.repaired,
          reason: 'Repaired malformed Action payload.'
        })
        return { handled: true, value: checked.repaired }
      }
      if (!ctx.required) {
        if (value !== undefined) {
          ctx.emit({
            kind: 'stripped',
            prop: ctx.prop,
            received: value,
            used: undefined,
            reason: 'Invalid optional Action; omitted.'
          })
        }
        return { handled: true, omit: true }
      }
      const noop = { event: { name: COERCED_NOOP_ACTION_NAME } }
      ctx.emit({
        kind: value === undefined ? 'defaulted' : 'coerced',
        prop: ctx.prop,
        received: value,
        used: noop,
        reason:
          value === undefined
            ? 'Missing required Action; supplied safe no-op action.'
            : 'Invalid Action; fell back to safe no-op action.'
      })
      return { handled: true, value: noop }
    }

    if (ref.endsWith('/Weight')) {
      if (typeof value === 'number' && Number.isFinite(value)) return { handled: true, value }
      if (typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))) {
        const num = Number(value)
        ctx.emit({
          kind: 'coerced',
          prop: ctx.prop,
          received: value,
          used: num,
          reason: 'Converted Weight string to number.'
        })
        return { handled: true, value: num }
      }
      if (value !== undefined) {
        ctx.emit({
          kind: 'stripped',
          prop: ctx.prop,
          received: value,
          used: undefined,
          reason: 'Invalid Weight; omitted.'
        })
      }
      return { handled: true, omit: true }
    }

    return { handled: false }
  }
}

function extractOffendingProp(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const record = error as { readonly path?: unknown; readonly details?: unknown }
  const rawPath =
    Array.isArray(record.details) &&
    record.details.length > 0 &&
    isPlainRecord(record.details[0]) &&
    typeof record.details[0].path === 'string'
      ? record.details[0].path
      : typeof record.path === 'string'
        ? record.path
        : undefined
  if (!rawPath || rawPath === '/') return undefined
  const firstSegment = rawPath.replace(/^\/+/, '').split('/')[0]
  return firstSegment || undefined
}

function fallbackForInvalidValidatedProp(
  prop: string,
  entry: A2uiRegistryEntry,
  nodeId: string,
  rawProps: Readonly<Record<string, unknown>>
): { readonly omit: boolean; readonly value?: unknown } {
  const { properties, required } = flattenObjectSchema(entry.schema as Record<string, unknown>)
  const propSchema = Object.hasOwn(properties, prop) ? properties[prop] : undefined
  if (!propSchema || !required.has(prop)) return { omit: true }

  const ref = propSchema.$ref
  if (typeof ref === 'string') {
    if (ref.endsWith('/DynamicString')) {
      return { omit: false, value: prop === 'label' ? fallbackLabelForNode(nodeId, rawProps) : '' }
    }
    if (ref.endsWith('/DynamicNumber')) return { omit: false, value: 0 }
    if (ref.endsWith('/DynamicBoolean')) return { omit: false, value: false }
    if (ref.endsWith('/DynamicStringList') || ref.endsWith('/ChildList')) {
      return { omit: false, value: [] }
    }
    if (ref.endsWith('/Action')) {
      return { omit: false, value: { event: { name: COERCED_NOOP_ACTION_NAME } } }
    }
  }
  if (propSchema.default !== undefined) return { omit: false, value: propSchema.default }
  if (propSchema.enum && propSchema.enum.length > 0) {
    return { omit: false, value: propSchema.enum[0] }
  }
  return { omit: true }
}

function validateAndIsolateComponent(
  candidate: Record<string, unknown>,
  entry: A2uiRegistryEntry,
  registry: A2uiRegistry,
  validator: PayloadValidator,
  rawProps: Readonly<Record<string, unknown>>,
  diagnostics: CatalogDiagnostic[]
): Record<string, unknown> | undefined {
  const nodeId = String(candidate.id ?? '')
  const current: Record<string, unknown> = { ...candidate }
  const repairedProps = new Set<string>()
  const maxAttempts = Object.keys(current).length + 2

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      validator.validateComponent(current)
      return current
    } catch (error) {
      const offending = extractOffendingProp(error)
      const reason =
        error instanceof Error ? error.message : 'Component failed protocol validation.'
      if (
        offending &&
        offending !== 'id' &&
        offending !== 'component' &&
        !repairedProps.has(offending) &&
        Object.hasOwn(current, offending)
      ) {
        repairedProps.add(offending)
        const received = current[offending]
        const repair = fallbackForInvalidValidatedProp(offending, entry, nodeId, rawProps)
        if (repair.omit) {
          delete current[offending]
          diagnostics.push({
            kind: 'stripped',
            nodeId,
            component: entry.name,
            prop: offending,
            received,
            used: undefined,
            reason
          })
        } else {
          current[offending] = repair.value
          diagnostics.push({
            kind: 'coerced',
            nodeId,
            component: entry.name,
            prop: offending,
            received,
            used: repair.value,
            reason
          })
        }
        continue
      }

      // Unrepairable at prop level: fall back to a valid Text node if possible, else omit
      const canFallbackToText =
        Boolean(getRegistryEntry(registry, 'Text')) && isValidUax31Identifier(nodeId)
      if (canFallbackToText) {
        const text = extractFallbackText(rawProps)
        const fallbackNode: Record<string, unknown> = {
          id: nodeId,
          component: 'Text',
          ...(typeof current.catalogId === 'string' ? { catalogId: current.catalogId } : {}),
          text
        }
        diagnostics.push({
          kind: 'fallback',
          nodeId,
          component: entry.name,
          prop: offending ?? '$node',
          received: offending ? current[offending] : rawProps,
          used: 'Text',
          reason
        })
        return fallbackNode
      }

      diagnostics.push({
        kind: 'fallback',
        nodeId,
        component: entry.name,
        prop: offending ?? '$node',
        received: offending ? current[offending] : rawProps,
        used: undefined,
        reason
      })
      return undefined
    }
  }

  return undefined
}

function coerceComponentList(
  rawComponents: readonly unknown[],
  registry: A2uiRegistry,
  validator: PayloadValidator,
  usedIds: Set<string>,
  diagnostics: CatalogDiagnostic[]
): Record<string, unknown>[] {
  const rawById = new Map<string, Readonly<Record<string, unknown>>>()
  for (const item of rawComponents) {
    if (isPlainRecord(item) && typeof item.id === 'string' && item.id.length > 0) {
      usedIds.add(item.id)
      rawById.set(item.id, item)
    }
  }

  const synthesized: Record<string, unknown>[] = []
  const output: Record<string, unknown>[] = []

  for (let index = 0; index < rawComponents.length; index++) {
    const raw = rawComponents[index]
    if (!isPlainRecord(raw)) {
      const fallbackId = makeUniqueId('component_', String(index), usedIds)
      diagnostics.push({
        kind: 'fallback',
        nodeId: fallbackId,
        component: 'unknown',
        prop: '$node',
        received: raw,
        used: undefined,
        reason: 'Component entry was not an object; skipped.'
      })
      continue
    }

    const id =
      typeof raw.id === 'string' && raw.id.length > 0
        ? raw.id
        : makeUniqueId('component_', String(index), usedIds)
    const componentName = typeof raw.component === 'string' ? raw.component : ''
    const rawCatalogId =
      typeof raw.catalogId === 'string' && raw.catalogId.length > 0 ? raw.catalogId : undefined
    const entry = getRegistryEntry(registry, componentName)

    if (!entry) {
      const hasChildrenList =
        (Array.isArray(raw.children) &&
          raw.children.some(c => typeof c === 'string' && c.length > 0)) ||
        isValidChildTemplate(raw.children)
      const hasSingleChild = typeof raw.child === 'string' && raw.child.length > 0

      if (hasChildrenList || hasSingleChild) {
        const container = findCompatibleContainer(registry, hasChildrenList)
        if (container) {
          let slotValue: unknown
          if (container.isList) {
            if (isValidChildTemplate(raw.children)) slotValue = raw.children
            else if (Array.isArray(raw.children)) {
              slotValue = raw.children.filter(
                (item): item is string => typeof item === 'string' && item.length > 0
              )
            } else {
              slotValue = [raw.child as string]
            }
          } else {
            slotValue = hasSingleChild
              ? raw.child
              : Array.isArray(raw.children)
                ? raw.children.find(
                    (item): item is string => typeof item === 'string' && item.length > 0
                  )
                : undefined
          }

          if (slotValue !== undefined) {
            const rewritten: Record<string, unknown> = {
              id,
              component: container.entry.name,
              ...(rawCatalogId ? { catalogId: rawCatalogId } : {}),
              [container.slotProp]: slotValue
            }
            diagnostics.push({
              kind: 'fallback',
              nodeId: id,
              component: componentName || 'unknown',
              prop: 'component',
              received: raw.component,
              used: container.entry.name,
              reason: `Unknown container "${componentName || 'unknown'}"; preserved children via "${container.entry.name}".`
            })
            const validated = validateAndIsolateComponent(
              rewritten,
              container.entry,
              registry,
              validator,
              raw,
              diagnostics
            )
            if (validated) output.push(validated)
            continue
          }
        }
      }

      const textEntry = getRegistryEntry(registry, 'Text')
      if (textEntry && isValidUax31Identifier(id)) {
        const fallbackText = collectRawDescendantText(raw, rawById)
        diagnostics.push({
          kind: 'fallback',
          nodeId: id,
          component: componentName || 'unknown',
          prop: 'component',
          received: raw.component,
          used: 'Text',
          reason: `Unknown component "${componentName || 'unknown'}"; fell back to text content.`
        })
        output.push({
          id,
          component: 'Text',
          ...(rawCatalogId ? { catalogId: rawCatalogId } : {}),
          text: fallbackText
        })
      } else {
        diagnostics.push({
          kind: 'fallback',
          nodeId: id,
          component: componentName || 'unknown',
          prop: 'component',
          received: raw.component,
          used: undefined,
          reason: `Unknown component "${componentName || 'unknown'}"; omitted.`
        })
      }
      continue
    }

    let unrenderable = false
    const customPropCoercer = createA2uiPropCoercer(
      registry,
      usedIds,
      synthesized,
      rawCatalogId,
      () => {
        unrenderable = true
      }
    )
    const result = coerceSchemaProps(entry.schema, raw, {
      nodeId: id,
      component: entry.name,
      passthroughKeys: A2UI_ENVELOPE_KEYS,
      customPropCoercer
    })
    diagnostics.push(...result.diagnostics)
    if (unrenderable) continue

    const assembled: Record<string, unknown> = {
      ...result.props,
      id,
      component: entry.name
    }
    if (
      'catalogId' in assembled &&
      (typeof assembled.catalogId !== 'string' || !assembled.catalogId)
    ) {
      const badCatalogId = assembled.catalogId
      delete assembled.catalogId
      diagnostics.push({
        kind: 'stripped',
        nodeId: id,
        component: entry.name,
        prop: 'catalogId',
        received: badCatalogId,
        used: undefined,
        reason: 'Invalid component catalogId; omitted.'
      })
    }

    const validated = validateAndIsolateComponent(
      assembled,
      entry,
      registry,
      validator,
      raw,
      diagnostics
    )
    if (validated) output.push(validated)
  }

  output.push(...synthesized)
  return output
}

/**
 * Sanitizes and coerces incoming A2UI 1.0 messages against the active registry before
 * `@a2ui/web_core` validates them. Invalid props, malformed nested expressions or actions,
 * missing required props, forbidden host props, mixed controlled/uncontrolled state, and
 * unknown components are coerced into safe defaults while emitting structured diagnostics.
 */
export function coerceA2uiMessages(
  messages: readonly A2uiMessage[],
  registry: A2uiRegistry,
  state?: A2uiCoerceState
): CoerceA2uiMessagesResult {
  const sanitized = sanitizeA2uiMessages(messages)
  const diagnostics: CatalogDiagnostic[] = []
  const usedIds = state?.usedIds ?? new Set<string>()
  const validator = new PayloadValidator(registry.toWebCoreCatalog(), STRICT_VALIDATION)

  // Pre-seed all real component IDs across the entire batch before allocating synthetic IDs
  for (const message of sanitized) {
    if (!isPlainRecord(message)) continue
    const list =
      isPlainRecord(message.createSurface) && Array.isArray(message.createSurface.components)
        ? message.createSurface.components
        : isPlainRecord(message.updateComponents) &&
            Array.isArray(message.updateComponents.components)
          ? message.updateComponents.components
          : undefined
    if (!list) continue
    for (const item of list) {
      if (isPlainRecord(item) && typeof item.id === 'string' && item.id.length > 0) {
        usedIds.add(item.id)
      }
    }
  }

  const coerced = sanitized.map(message => {
    if (!isPlainRecord(message)) return message

    if (isPlainRecord(message.createSurface) && Array.isArray(message.createSurface.components)) {
      return {
        ...message,
        createSurface: {
          ...message.createSurface,
          components: coerceComponentList(
            message.createSurface.components,
            registry,
            validator,
            usedIds,
            diagnostics
          )
        }
      }
    }

    if (
      isPlainRecord(message.updateComponents) &&
      Array.isArray(message.updateComponents.components)
    ) {
      return {
        ...message,
        updateComponents: {
          ...message.updateComponents,
          components: coerceComponentList(
            message.updateComponents.components,
            registry,
            validator,
            usedIds,
            diagnostics
          )
        }
      }
    }

    return message
  })

  return { messages: coerced, diagnostics }
}

/**
 * Coerces invalid resolved dynamic props (such as a required `label` bound to a missing
 * or non-string data model value) while preserving reactivity when the bound path updates.
 */
export function coerceA2uiResolvedProps(
  entry: A2uiRegistryEntry,
  node: ComponentNode,
  resolvedProps: Readonly<Record<string, unknown>>
): {
  readonly props: Readonly<Record<string, unknown>>
  readonly diagnostics: readonly CatalogDiagnostic[]
} {
  const { properties, required } = flattenObjectSchema(entry.schema as Record<string, unknown>)
  const labelSchema = Object.hasOwn(properties, 'label') ? properties.label : undefined
  if (
    !labelSchema ||
    !required.has('label') ||
    typeof labelSchema.$ref !== 'string' ||
    !labelSchema.$ref.endsWith('/DynamicString')
  ) {
    return { props: resolvedProps, diagnostics: [] }
  }

  const rawLabelProp = resolvedProps.label
  const unwrappedLabel = rawLabelProp instanceof ResolvedBinding ? rawLabelProp.value : rawLabelProp
  if (typeof unwrappedLabel === 'string' && unwrappedLabel.trim().length > 0) {
    return { props: resolvedProps, diagnostics: [] }
  }

  const rawPlaceholder = resolvedProps.placeholder
  const placeholder =
    rawPlaceholder instanceof ResolvedBinding ? rawPlaceholder.value : rawPlaceholder
  const fallback =
    typeof placeholder === 'string' && placeholder.trim().length > 0
      ? placeholder.trim()
      : humanizeNodeId(node.componentId)

  return {
    props: { ...resolvedProps, label: fallback },
    diagnostics: [
      {
        kind: 'coerced',
        nodeId: node.componentId,
        component: entry.name,
        prop: 'label',
        received: unwrappedLabel,
        used: fallback,
        reason: 'Resolved dynamic label was missing or invalid; supplied accessible fallback.'
      }
    ]
  }
}

/**
 * Extracts readable fallback text from a resolved `ComponentNode` (and its children)
 * when a node fails during render and falls back inside its error boundary.
 */
export function extractA2uiNodeFallbackText(
  node: ComponentNode,
  props?: Readonly<Record<string, unknown>>,
  visited: Set<ComponentNode> = new Set()
): string {
  if (visited.has(node)) return ''
  visited.add(node)

  let resolvedProps = props
  if (!resolvedProps) {
    try {
      resolvedProps = peekValue(node.props)
    } catch {
      resolvedProps = undefined
    }
  }
  if (!resolvedProps) return ''

  const unwrapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(resolvedProps)) {
    unwrapped[key] = value instanceof ResolvedBinding ? value.value : value
  }
  const ownText = extractFallbackText(unwrapped)
  if (ownText) return ownText

  if (isComponentNode(resolvedProps.child)) {
    const childText = extractA2uiNodeFallbackText(resolvedProps.child, undefined, visited)
    if (childText) return childText
  }

  if (Array.isArray(resolvedProps.children)) {
    const parts: string[] = []
    for (const child of resolvedProps.children) {
      if (isComponentNode(child)) {
        const part = extractA2uiNodeFallbackText(child, undefined, visited)
        if (part) parts.push(part)
      }
    }
    if (parts.length > 0) return parts.join(' ')
  }

  return ''
}
