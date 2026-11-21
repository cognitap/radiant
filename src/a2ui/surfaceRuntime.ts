import { isPlainRecord } from '../catalog/coerce.js'
import type { MotionProfile } from '../motion/config.js'
import type { A2uiMessage } from './sanitize.js'

const FOCUSABLE_SELECTOR =
  'a[href],area[href],button,input,select,textarea,summary,[tabindex],[contenteditable]:not([contenteditable="false"])'
const DEFAULT_ENTRY_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

export const A2UI_NODE_ENTRY_ANIMATION_ID = 'radiant-a2ui-entry'

function cloneFallback<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (!value || typeof value !== 'object') return value
  if (seen.has(value)) return seen.get(value) as T
  if (Array.isArray(value)) {
    const next: unknown[] = []
    seen.set(value, next)
    for (let i = 0; i < value.length; i++) next[i] = cloneFallback(value[i], seen)
    return next as unknown as T
  }
  if (!isPlainRecord(value)) return value
  const next: Record<string, unknown> = {}
  seen.set(value, next)
  for (const key of Object.keys(value)) {
    Object.defineProperty(next, key, {
      value: cloneFallback(value[key], seen),
      enumerable: true,
      writable: true,
      configurable: true
    })
  }
  return next as T
}

/** Deep-clones wire messages so live state cannot mutate caller or stored history. */
export function cloneMessageValue<T>(value: T): T {
  if (!value || typeof value !== 'object') return value
  try {
    return structuredClone(value)
  } catch {
    return cloneFallback(value)
  }
}

function sameMessageValue(a: unknown, b: unknown): boolean {
  const seen = new WeakMap<object, WeakSet<object>>()
  const stack: [unknown, unknown][] = [[a, b]]
  while (stack.length > 0) {
    const [left, right] = stack.pop()!
    if (Object.is(left, right)) continue
    if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false
    let rightSeen = seen.get(left)
    if (rightSeen?.has(right)) continue
    if (!rightSeen) seen.set(left, (rightSeen = new WeakSet()))
    rightSeen.add(right)
    if (Array.isArray(left) || Array.isArray(right)) {
      if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
        return false
      }
      for (let i = 0; i < left.length; i++) stack.push([left[i], right[i]])
      continue
    }
    if (!isPlainRecord(left) || !isPlainRecord(right)) return false
    const keys = Object.keys(left)
    if (keys.length !== Object.keys(right).length) return false
    for (const key of keys) {
      if (!Object.hasOwn(right, key)) return false
      stack.push([left[key], right[key]])
    }
  }
  return true
}

/** Returns true when `previous` is a structurally equal prefix of `next`. */
export function isMessagePrefix(
  previous: readonly A2uiMessage[],
  next: readonly A2uiMessage[]
): boolean {
  if (previous.length > next.length) return false
  for (let i = 0; i < previous.length; i++) {
    if (!sameMessageValue(previous[i], next[i])) return false
  }
  return true
}

/** Coalesces repeated calls within the same turn into a single microtask invocation. */
export function createMicrotaskCoalescer(run: () => void): () => void {
  let scheduled = false
  return () => {
    if (scheduled) return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      run()
    })
  }
}

export function isHtmlElement(node: unknown): node is HTMLElement {
  if (typeof node !== 'object' || node === null || !('ownerDocument' in node)) return false
  const win = (node as Element).ownerDocument?.defaultView
  return Boolean(win && node instanceof win.HTMLElement)
}

export type NodeHost = {
  readonly nodeId: string
  readonly instanceId: string
  readonly element: HTMLElement
  readonly isContainer: boolean
}

function isFocusableWithin(
  element: HTMLElement,
  root: HTMLElement,
  allowProgrammatic = false
): boolean {
  if (!element.isConnected || !root.contains(element) || element === root) return false
  if (element.tabIndex < 0 && !(allowProgrammatic && element.hasAttribute('tabindex'))) return false
  if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'hidden') return false
  if (element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true') return false
  if (element.closest('[hidden],[inert]') || element.getClientRects().length === 0) return false
  const win = element.ownerDocument.defaultView
  return !win || win.getComputedStyle(element).visibility !== 'hidden'
}

function queryFocusable(
  scope: HTMLElement,
  root: HTMLElement,
  allowProgrammatic = false
): HTMLElement[] {
  const results = scope !== root && isFocusableWithin(scope, root, allowProgrammatic) ? [scope] : []
  for (const element of scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) {
    if (isFocusableWithin(element, root, allowProgrammatic)) results.push(element)
  }
  return results
}

function findOwningHost(
  active: HTMLElement,
  hosts: ReadonlyMap<string, NodeHost>
): NodeHost | null {
  let owner: NodeHost | null = null
  for (const host of hosts.values()) {
    if (host.isContainer || !host.element.isConnected || !host.element.contains(active)) continue
    if (!owner || owner.element.contains(host.element)) owner = host
  }
  return owner
}

function findUniqueHostByInstance(
  hosts: ReadonlyMap<string, NodeHost>,
  instanceId: string
): NodeHost | null {
  let match: NodeHost | null = null
  for (const host of hosts.values()) {
    if (host.instanceId !== instanceId || !host.element.isConnected) continue
    if (match) return null
    match = host
  }
  return match
}

export type FocusSnapshot = {
  readonly active: HTMLElement
  readonly restoreInstanceId: string | null
  readonly controlIndex: number
  readonly after: readonly HTMLElement[]
  readonly before: readonly HTMLElement[]
  readonly selectionStart: number | null
  readonly selectionEnd: number | null
  readonly scrollTop: number
  readonly scrollLeft: number
}

/** Captures the active control, unambiguous owning instance, and surrounding tabbable order. */
export function captureFocusSnapshot(
  root: HTMLElement | null,
  hosts: ReadonlyMap<string, NodeHost>
): FocusSnapshot | null {
  if (!root?.isConnected) return null
  const active = root.ownerDocument.activeElement
  if (!isHtmlElement(active) || !root.contains(active) || active === root) return null

  const after: HTMLElement[] = []
  const before: HTMLElement[] = []
  for (const candidate of queryFocusable(root, root)) {
    if (candidate === active) continue
    const pos = active.compareDocumentPosition(candidate)
    if (pos & active.DOCUMENT_POSITION_FOLLOWING) after.push(candidate)
    else if (pos & active.DOCUMENT_POSITION_PRECEDING) before.push(candidate)
  }
  before.reverse()

  const owner = findOwningHost(active, hosts)
  const restoreInstanceId =
    owner && findUniqueHostByInstance(hosts, owner.instanceId) === owner ? owner.instanceId : null
  const controlIndex = owner
    ? Math.max(0, queryFocusable(owner.element, root, true).indexOf(active))
    : 0

  let selectionStart: number | null = null
  let selectionEnd: number | null = null
  if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') {
    try {
      const input = active as HTMLInputElement | HTMLTextAreaElement
      selectionStart = input.selectionStart
      selectionEnd = input.selectionEnd
    } catch {
      // Non-text inputs do not expose selection ranges.
    }
  }

  return {
    active,
    restoreInstanceId,
    controlIndex,
    after,
    before,
    selectionStart,
    selectionEnd,
    scrollTop: active.scrollTop,
    scrollLeft: active.scrollLeft
  }
}

function restoreControlState(target: HTMLElement, snapshot: FocusSnapshot): void {
  target.focus({ preventScroll: true })
  if (
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
    snapshot.selectionStart !== null &&
    snapshot.selectionEnd !== null
  ) {
    try {
      ;(target as HTMLInputElement | HTMLTextAreaElement).setSelectionRange(
        snapshot.selectionStart,
        snapshot.selectionEnd
      )
    } catch {
      // Ignore inputs that disallow setting a selection range.
    }
  }
  if (snapshot.scrollTop > 0) target.scrollTop = snapshot.scrollTop
  if (snapshot.scrollLeft > 0) target.scrollLeft = snapshot.scrollLeft
}

/** Restores focus synchronously in an active document using the order documented in architecture.md. */
export function restoreFocusFallback(
  root: HTMLElement | null,
  snapshot: FocusSnapshot,
  hosts: ReadonlyMap<string, NodeHost>
): void {
  if (!root?.isConnected) return
  const doc = root.ownerDocument
  if (typeof doc.hasFocus === 'function' && !doc.hasFocus()) return
  const current = doc.activeElement
  if (current && current !== doc.body && current !== doc.documentElement) return

  if (isFocusableWithin(snapshot.active, root, true)) {
    restoreControlState(snapshot.active, snapshot)
    return
  }

  if (snapshot.restoreInstanceId) {
    const movedHost = findUniqueHostByInstance(hosts, snapshot.restoreInstanceId)
    if (movedHost) {
      const controls = queryFocusable(movedHost.element, root, true)
      const movedTarget = controls[snapshot.controlIndex] ?? controls[0]
      if (movedTarget) {
        restoreControlState(movedTarget, snapshot)
        return
      }
    }
  }

  const target =
    snapshot.after.find(element => isFocusableWithin(element, root)) ??
    snapshot.before.find(element => isFocusableWithin(element, root)) ??
    queryFocusable(root, root)[0] ??
    root

  target.focus({ preventScroll: true })
}

function parseDurationMs(value: string): number | undefined {
  const match = /^(\d+(?:\.\d+)?|\.\d+)(ms|s)$/.exec(value.trim())
  if (!match) return undefined
  const num = Number.parseFloat(match[1]!)
  return Number.isFinite(num) ? (match[2] === 's' ? num * 1000 : num) : undefined
}

/** Runs entry motion once on a newly mounted node host, ignoring invalid easing values safely. */
export function animateNodeEntry(
  element: HTMLElement,
  profile: MotionProfile
): Animation | undefined {
  if (profile.mode === 'off') return undefined
  const win = element.ownerDocument.defaultView
  if (!win || win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
  if (typeof element.animate !== 'function') return undefined

  const styles = win.getComputedStyle(element)
  const duration = parseDurationMs(styles.getPropertyValue('--rad-motion-release-duration')) ?? 160
  if (duration <= 0) return undefined
  const easing = styles.getPropertyValue('--rad-motion-release-ease').trim() || DEFAULT_ENTRY_EASING
  const keyframes = [{ transform: 'translateY(6px)' }, { transform: 'translateY(0px)' }]
  const options = { id: A2UI_NODE_ENTRY_ANIMATION_ID, duration, easing, fill: 'none' as const }

  try {
    return element.animate(keyframes, options)
  } catch {
    if (easing === DEFAULT_ENTRY_EASING) return undefined
    try {
      return element.animate(keyframes, { ...options, easing: DEFAULT_ENTRY_EASING })
    } catch {
      return undefined
    }
  }
}
