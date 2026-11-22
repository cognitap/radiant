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
export function hasText(value: unknown): boolean {
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

/** Built-in components whose renderer announces `accessibility.label` as their name. */
const LABEL_RENDERING_COMPONENTS = new Set(['Icon', 'Image', 'Video', 'AudioPlayer'])

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
  // Children hidden from assistive technology contribute no name.
  if (readPath(node, 'accessibility.hidden') === true) return false
  if (hasText(node.text) || hasText(node.label)) return true
  if (
    typeof node.component === 'string' &&
    LABEL_RENDERING_COMPONENTS.has(node.component) &&
    hasText(readPath(node, 'accessibility.label'))
  ) {
    return true
  }
  if (node.component === 'Image' && hasText(node.description)) return true
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

/** True when `accessibility.hidden` is set or bound, marking the component decorative. */
const isMarkedDecorative = (component: A2uiComponentRecord): boolean => {
  const hidden = readPath(component, 'accessibility.hidden')
  return hidden === true || isDynamic(hidden)
}

/**
 * Requires an image to have alt text in `description` or `accessibility.label`, or an explicit
 * decorative marker: `description: ""` or `accessibility.hidden: true`.
 */
export function imageAltRule(): A2uiAccessibilityRule {
  return {
    id: 'image-alt',
    check(component) {
      if (component.description === '' || isMarkedDecorative(component)) return
      if (hasText(component.description) || hasText(readPath(component, 'accessibility.label'))) {
        return
      }
      return {
        prop: 'description',
        message: `${describe(component)} has no description or accessibility.label; mark decorative images with description "".`
      }
    }
  }
}

export type MediaNameRuleOptions = {
  /** Props the renderer announces as the media name, in priority order. */
  readonly names: readonly string[]
}

/** Requires a media player to have a non-empty name in one of `names`. */
export function mediaNameRule(options: MediaNameRuleOptions): A2uiAccessibilityRule {
  return {
    id: 'media-name',
    check(component) {
      if (options.names.some(path => hasText(readPath(component, path)))) return
      return {
        prop: options.names[0] ?? 'accessibility.label',
        message: `${describe(component)} has no ${options.names.join(' or ')}.`
      }
    }
  }
}

/** Requires every tab to have a non-empty `title`. */
export function tabTitlesRule(): A2uiAccessibilityRule {
  return {
    id: 'tab-titles',
    check(component) {
      const tabs = Array.isArray(component.tabs) ? component.tabs : []
      const missing = tabs.findIndex(tab => !isPlainRecord(tab) || !hasText(tab.title))
      if (missing < 0) return
      return {
        prop: 'tabs',
        message: `${describe(component)} tab ${missing + 1} has no title.`
      }
    }
  }
}

/** Requires a modal's `trigger` to be a Button whose text also names the dialog. */
export function modalTriggerRule(): A2uiAccessibilityRule {
  return {
    id: 'modal-trigger',
    check(component, context) {
      const trigger =
        typeof component.trigger === 'string' ? context.getComponent(component.trigger) : undefined
      if (trigger && trigger.component !== 'Button') {
        return {
          prop: 'trigger',
          message: `${describe(component)} needs a Button trigger so keyboard users can open it.`
        }
      }
      if (subtreeHasText(component.trigger, context, new Set())) return
      return {
        prop: 'trigger',
        message: `${describe(component)} has no trigger text to name the dialog.`
      }
    }
  }
}
