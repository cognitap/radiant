import { peekValue } from '@a2ui/web_core/reactivity'
import { isComponentNode, ResolvedBinding, type ComponentNode } from '@a2ui/web_core/resolution'
import {
  coerceSchemaProps,
  extractFallbackText,
  humanizeNodeId,
  type CatalogDiagnostic,
  type PropCoercer
} from '../catalog/index.js'
import type { A2uiRegistry } from './registry.js'
import { sanitizeA2uiMessages, type A2uiMessage } from './sanitize.js'

/** Internal action name used when a required A2UI action was missing and coerced to a no-op. */
export const COERCED_NOOP_ACTION_NAME = '__radiant_coerced_noop__'

export type CoerceA2uiMessagesResult = {
  readonly messages: readonly A2uiMessage[]
  readonly diagnostics: readonly CatalogDiagnostic[]
}

const A2UI_ENVELOPE_KEYS = new Set(['id', 'component', 'checks', 'metadata'])

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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isDynamicExpression(value: unknown): boolean {
  if (!isPlainRecord(value)) return false
  if (typeof value['@path'] === 'string' && value['@path'].length > 0) return true
  if (typeof value.call === 'string' && value.call.length > 0) return true
  return false
}

function isValidAction(value: unknown): boolean {
  if (!isPlainRecord(value)) return false
  if (
    isPlainRecord(value.event) &&
    typeof value.event.name === 'string' &&
    value.event.name.length > 0
  ) {
    return true
  }
  if (
    isPlainRecord(value.functionCall) &&
    typeof value.functionCall.call === 'string' &&
    value.functionCall.call.length > 0
  ) {
    return true
  }
  return false
}

function isValidChildTemplate(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    typeof value.componentId === 'string' &&
    value.componentId.length > 0 &&
    typeof value.path === 'string' &&
    value.path.length > 0
  )
}

function makeSyntheticComponentId(baseId: string, usedIds: Set<string>): string {
  const safeBase = baseId.replace(/[^A-Za-z0-9_]/g, '_') || 'node'
  let candidate = `__coerced_child_${safeBase}`
  let counter = 2
  while (usedIds.has(candidate)) {
    candidate = `__coerced_child_${safeBase}_${counter}`
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

function createA2uiPropCoercer(
  registry: A2uiRegistry,
  usedIds: Set<string>,
  synthesized: Record<string, unknown>[]
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
      if (!ctx.required && value === undefined) {
        return { handled: true, omit: true }
      }
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
      const fallbackText = extractFallbackText(ctx.rawProps) || humanizeNodeId(ctx.nodeId)
      const synthId = makeSyntheticComponentId(ctx.nodeId, usedIds)
      if (registry.entries.Text) {
        synthesized.push({
          id: synthId,
          component: 'Text',
          text: fallbackText
        })
      }
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
      if (isValidAction(value)) return { handled: true, value }
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

function coerceComponentList(
  rawComponents: readonly unknown[],
  registry: A2uiRegistry,
  diagnostics: CatalogDiagnostic[]
): Record<string, unknown>[] {
  const usedIds = new Set<string>()
  for (const item of rawComponents) {
    if (isPlainRecord(item) && typeof item.id === 'string' && item.id.length > 0) {
      usedIds.add(item.id)
    }
  }

  const synthesized: Record<string, unknown>[] = []
  const customPropCoercer = createA2uiPropCoercer(registry, usedIds, synthesized)
  const output: Record<string, unknown>[] = []

  for (let index = 0; index < rawComponents.length; index++) {
    const raw = rawComponents[index]
    if (!isPlainRecord(raw)) {
      diagnostics.push({
        kind: 'fallback',
        nodeId: `component_${index}`,
        component: 'unknown',
        prop: '$node',
        received: raw,
        used: undefined,
        reason: 'Component entry was not an object; skipped.'
      })
      continue
    }

    const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : `component_${index}`
    const componentName = typeof raw.component === 'string' ? raw.component : ''
    const entry = registry.entries[componentName]

    if (!entry) {
      const fallbackText = extractFallbackText(raw)
      if (registry.entries.Text) {
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

    const result = coerceSchemaProps(entry.schema, raw, {
      nodeId: id,
      component: entry.name,
      passthroughKeys: A2UI_ENVELOPE_KEYS,
      customPropCoercer
    })
    diagnostics.push(...result.diagnostics)
    output.push({
      ...result.props,
      id,
      component: entry.name
    })
  }

  output.push(...synthesized)
  return output
}

/**
 * Sanitizes and coerces incoming A2UI 1.0 messages against the active registry before
 * `@a2ui/web_core` validates them. Invalid props, missing required props, forbidden host props,
 * mixed controlled/uncontrolled state, and unknown components are coerced into safe defaults
 * while emitting structured diagnostics.
 */
export function coerceA2uiMessages(
  messages: readonly A2uiMessage[],
  registry: A2uiRegistry
): CoerceA2uiMessagesResult {
  const sanitized = sanitizeA2uiMessages(messages)
  const diagnostics: CatalogDiagnostic[] = []

  const coerced = sanitized.map(message => {
    if (!isPlainRecord(message)) return message

    if (isPlainRecord(message.createSurface) && Array.isArray(message.createSurface.components)) {
      return {
        ...message,
        createSurface: {
          ...message.createSurface,
          components: coerceComponentList(message.createSurface.components, registry, diagnostics)
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
            diagnostics
          )
        }
      }
    }

    return message
  })

  return { messages: coerced, diagnostics }
}

function unwrapPrimitiveText(value: unknown): string | undefined {
  const raw = value instanceof ResolvedBinding ? value.value : value
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim()
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw)
  return undefined
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

  for (const key of FALLBACK_TEXT_KEYS) {
    const text = unwrapPrimitiveText(resolvedProps[key])
    if (text) return text
  }

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
