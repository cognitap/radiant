import { isPlainRecord } from '../catalog/coerce.js'

/** One A2UI component definition as it appears in `createSurface` or `updateComponents`. */
export type A2uiComponentRecord = Readonly<Record<string, unknown>>

export type A2uiAccessibilityRuleContext = {
  /** Returns the latest definition of another component on the same surface. */
  readonly getComponent: (id: string) => A2uiComponentRecord | undefined
}

export type A2uiAccessibilityFinding = {
  readonly prop: string
  readonly message: string
  /** Props merged into the component when the caller asks for safe fixes. */
  readonly fix?: Readonly<Record<string, unknown>>
}

/** An accessibility rule declared on a registry entry. `check` must be pure. */
export type A2uiAccessibilityRule = {
  readonly id: string
  readonly check: (
    component: A2uiComponentRecord,
    context: A2uiAccessibilityRuleContext
  ) => A2uiAccessibilityFinding | undefined
}

const isDynamic = (v: unknown): boolean =>
  isPlainRecord(v) && ('@path' in v || 'path' in v || '@call' in v || 'call' in v)

/** True when a value renders as non-empty text or is bound to surface state. */
function hasText(value: unknown): boolean {
  if (isDynamic(value)) return true
  if (typeof value === 'string') return value.trim().length > 0
  return (typeof value === 'number' && Number.isFinite(value)) || typeof value === 'boolean'
}

function readPath(component: A2uiComponentRecord, path: string): unknown {
  let current: unknown = component
  for (const key of path.split('.')) {
    if (!isPlainRecord(current)) return undefined
    current = current[key]
  }
  return current
}

const describe = (component: A2uiComponentRecord) =>
  `${String(component.component)} "${String(component.id)}"`

export type ControlLabelRuleOptions = {
  /** Other props the renderer announces as the name, such as `accessibility.label`. */
  readonly alternatives?: readonly string[]
  /** Author-written props copied into `label` as a safe fix, in priority order. */
  readonly fixFrom?: readonly string[]
}

/** Requires a form control to have a non-empty `label` (or a declared alternative). */
export function controlLabelRule(options: ControlLabelRuleOptions = {}): A2uiAccessibilityRule {
  const alternatives = options.alternatives ?? []
  const fixFrom = options.fixFrom ?? []
  return {
    id: 'control-label',
    check(component) {
      if (['label', ...alternatives].some(path => hasText(readPath(component, path)))) return
      const source = fixFrom
        .map(path => readPath(component, path))
        .find((v): v is string => typeof v === 'string' && v.trim().length > 0)
      const names = ['label', ...alternatives].join(' or ')
      return {
        prop: 'label',
        message: `${describe(component)} has no ${names}.`,
        ...(source === undefined ? {} : { fix: { label: source.trim() } })
      }
    }
  }
}

function subtreeHasText(
  id: unknown,
  context: A2uiAccessibilityRuleContext,
  visited: Set<string>
): boolean {
  if (typeof id !== 'string' || !id || visited.has(id)) return false
  visited.add(id)
  const node = context.getComponent(id)
  // A child that has not arrived yet cannot be judged.
  if (!node) return true
  if (hasText(node.text) || hasText(node.label)) return true
  if (subtreeHasText(node.child, context, visited)) return true
  const children = node.children
  if (isPlainRecord(children)) return true
  return Array.isArray(children) && children.some(c => subtreeHasText(c, context, visited))
}

/** Requires a button's `child` subtree to render text that names it. */
export function buttonNameRule(): A2uiAccessibilityRule {
  return {
    id: 'button-name',
    check(component, context) {
      if (subtreeHasText(component.child, context, new Set())) return
      return {
        prop: 'child',
        message: `${describe(component)} has no text content to name it.`
      }
    }
  }
}
