import {
  isComponentNode,
  isWritable,
  ResolvedBinding,
  type ComponentNode,
  type NodeAction
} from '@a2ui/web_core/resolution'

/**
 * Returns the current value of an adapter prop: the surface state behind a binding,
 * or the literal value the agent sent.
 */
export function readA2uiValue(value: unknown): unknown {
  return value instanceof ResolvedBinding ? value.value : value
}

/**
 * Writes `next` to the surface state behind a two-way binding. Returns false, and writes
 * nothing, when the prop is a literal or a read-only binding.
 */
export function writeA2uiBinding(value: unknown, next: unknown): boolean {
  if (!(value instanceof ResolvedBinding) || !isWritable(value)) return false
  value.set(next)
  return true
}

/**
 * Runs an action prop, as Radiant's Button does: an event action reaches the surface's
 * `onAction`. Returns false when the prop holds no action.
 */
export async function runA2uiAction(value: unknown): Promise<boolean> {
  if (typeof value !== 'function') return false
  await (value as NodeAction)()
  return true
}

/** True when a slot prop holds a child to pass to the adapter context's `renderNode`. */
export function isA2uiChildNode(value: unknown): value is ComponentNode {
  return isComponentNode(value)
}
