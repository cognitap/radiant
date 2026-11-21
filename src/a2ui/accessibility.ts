import { isPlainRecord } from '../catalog/coerce.js'
import type { A2uiComponentRecord } from './accessibilityRules.js'
import { getRegistryEntry } from './coerce.js'
import { radiantA2uiRegistry } from './entries.js'
import type { A2uiRegistry } from './registry.js'
import type { A2uiMessage } from './sanitize.js'

export type A2uiAccessibilityError = {
  readonly surfaceId: string
  readonly nodeId: string
  readonly component: string
  readonly rule: string
  readonly prop: string
  readonly message: string
  /** True when a safe fix exists; `fix: true` applies it to the returned messages. */
  readonly fixable: boolean
}

export type ValidateA2uiAccessibilityOptions = {
  /** Registry whose entry rules apply. Defaults to `radiantA2uiRegistry`. */
  readonly registry?: A2uiRegistry
  /** Apply safe fixes to a copy of the messages. */
  readonly fix?: boolean
}

export type ValidateA2uiAccessibilityResult = {
  readonly errors: readonly A2uiAccessibilityError[]
  /** The input messages, or a fixed copy when `fix` is set. Input is never mutated. */
  readonly messages: readonly A2uiMessage[]
}

type Located = {
  readonly component: A2uiComponentRecord
  readonly message: number
  readonly key: 'createSurface' | 'updateComponents'
  readonly index: number
}

const COMPONENT_KEYS = ['createSurface', 'updateComponents'] as const

function collectSurfaces(messages: readonly A2uiMessage[]): Map<string, Map<string, Located>> {
  const surfaces = new Map<string, Map<string, Located>>()
  messages.forEach((message, messageIndex) => {
    if (!isPlainRecord(message)) return
    const deleted = message.deleteSurface
    if (isPlainRecord(deleted) && typeof deleted.surfaceId === 'string') {
      surfaces.delete(deleted.surfaceId)
    }
    for (const key of COMPONENT_KEYS) {
      const body = message[key]
      if (!isPlainRecord(body) || !Array.isArray(body.components)) continue
      const surfaceId = typeof body.surfaceId === 'string' ? body.surfaceId : ''
      if (key === 'createSurface' || !surfaces.has(surfaceId)) surfaces.set(surfaceId, new Map())
      const nodes = surfaces.get(surfaceId)!
      body.components.forEach((component: unknown, index) => {
        if (isPlainRecord(component) && typeof component.id === 'string' && component.id) {
          nodes.set(component.id, { component, message: messageIndex, key, index })
        }
      })
    }
  })
  return surfaces
}

/**
 * Checks A2UI surface messages against the accessibility rules declared on each registry
 * entry. Pure: needs no DOM or React render, so servers can run it before storing a surface.
 */
export function validateA2uiAccessibility(
  messages: readonly A2uiMessage[],
  options: ValidateA2uiAccessibilityOptions = {}
): ValidateA2uiAccessibilityResult {
  const registry = options.registry ?? radiantA2uiRegistry
  const errors: A2uiAccessibilityError[] = []
  const fixes: { readonly at: Located; readonly props: Readonly<Record<string, unknown>> }[] = []

  for (const [surfaceId, nodes] of collectSurfaces(messages)) {
    const context = { getComponent: (id: string) => nodes.get(id)?.component }
    for (const [nodeId, at] of nodes) {
      const name = typeof at.component.component === 'string' ? at.component.component : ''
      const entry = getRegistryEntry(registry, name)
      if (!entry) continue
      for (const rule of entry.accessibility) {
        const finding = rule.check(at.component, context)
        if (!finding) continue
        errors.push({
          surfaceId,
          nodeId,
          component: name,
          rule: rule.id,
          prop: finding.prop,
          message: finding.message,
          fixable: finding.fix !== undefined
        })
        if (finding.fix) fixes.push({ at, props: finding.fix })
      }
    }
  }

  if (!options.fix || fixes.length === 0) return { errors, messages }
  const fixed = structuredClone(messages) as A2uiMessage[]
  for (const { at, props } of fixes) {
    const body = fixed[at.message]![at.key] as { components: Record<string, unknown>[] }
    Object.assign(body.components[at.index]!, props)
  }
  return { errors, messages: fixed }
}

// Bundlers replace `process.env.NODE_ENV`; without one, a missing `process` means production.
declare const process: { readonly env: Readonly<Record<string, string | undefined>> }

function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== 'production'
  } catch {
    return false
  }
}

const warnedByRegistry = new WeakMap<A2uiRegistry, Set<string>>()

/** Warns once per surface, node, and rule in development; silent in production. */
export function warnA2uiAccessibility(
  messages: readonly A2uiMessage[],
  registry: A2uiRegistry
): void {
  if (!isDevelopment()) return
  let warned = warnedByRegistry.get(registry)
  if (!warned) warnedByRegistry.set(registry, (warned = new Set()))
  let errors: readonly A2uiAccessibilityError[]
  try {
    errors = validateA2uiAccessibility(messages, { registry }).errors
  } catch (error) {
    console.warn('A2UI accessibility check failed.', error)
    return
  }
  const fresh = errors.filter(error => {
    const key = `${error.surfaceId}\u0000${error.nodeId}\u0000${error.rule}`
    if (warned.has(key)) return false
    warned.add(key)
    return true
  })
  if (fresh.length === 0) return
  console.warn(`A2UI accessibility:\n${fresh.map(e => `- ${e.message} (${e.rule})`).join('\n')}`)
}
