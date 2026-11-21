import { isPlainRecord } from '../catalog/coerce.js'
import type { MotionProfile } from '../motion/config.js'
import type { A2uiMessage } from './sanitize.js'

const MAX_COMPARE_DEPTH = 64

export const A2UI_NODE_ATTR = 'data-a2ui-node'

/** Deep-clones wire message objects and arrays so live state cannot mutate stored history. */
export function cloneMessageValue<T>(value: T, depth = 0): T {
  if (depth >= MAX_COMPARE_DEPTH || !value || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    return value.map(item => cloneMessageValue(item, depth + 1)) as unknown as T
  }
  if (!isPlainRecord(value)) return value
  const next: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    next[key] = cloneMessageValue(entry, depth + 1)
  }
  return next as T
}

function sameMessageValue(a: unknown, b: unknown, depth = 0): boolean {
  if (Object.is(a, b)) return true
  if (depth >= MAX_COMPARE_DEPTH || !a || !b || typeof a !== 'object' || typeof b !== 'object') {
    return false
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!sameMessageValue(a[i], b[i], depth + 1)) return false
    }
    return true
  }
  if (!isPlainRecord(a) || !isPlainRecord(b)) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (!Object.hasOwn(b, key) || !sameMessageValue(a[key], b[key], depth + 1)) return false
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

const FOCUSABLE_SELECTOR =
  'a[href],area[href],button,input,select,textarea,summary,[tabindex],[contenteditable]:not([contenteditable="false"])'

function isHtmlElement(node: Element | null): node is HTMLElement {
  const win = node?.ownerDocument.defaultView
  return Boolean(node && win && node instanceof win.HTMLElement)
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
  if (element.closest('[hidden],[inert]')) return false
  if (element.getClientRects().length === 0) return false
  const win = element.ownerDocument.defaultView
  if (win && win.getComputedStyle(element).visibility === 'hidden') return false
  return true
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(element =>
    isFocusableWithin(element, root)
  )
}

function findNodeHost(root: HTMLElement, instanceId: string): HTMLElement | null {
  for (const element of root.querySelectorAll<HTMLElement>(`[${A2UI_NODE_ATTR}]`)) {
    if (element.getAttribute(A2UI_NODE_ATTR) === instanceId) return element
  }
  return null
}

function getHostControls(host: HTMLElement, root: HTMLElement): HTMLElement[] {
  const controls: HTMLElement[] = []
  if (isFocusableWithin(host, root, true)) controls.push(host)
  for (const element of host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) {
    if (isFocusableWithin(element, root, true)) controls.push(element)
  }
  return controls
}

export type FocusSnapshot = {
  readonly active: HTMLElement
  readonly instanceId: string | null
  readonly controlIndex: number
  readonly after: readonly HTMLElement[]
  readonly before: readonly HTMLElement[]
  readonly selectionStart: number | null
  readonly selectionEnd: number | null
  readonly scrollTop: number
  readonly scrollLeft: number
}

/** Captures the active control, its owning rendered instance, and surrounding tabbable order. */
export function captureFocusSnapshot(root: HTMLElement | null): FocusSnapshot | null {
  if (!root || !root.isConnected) return null
  const active = root.ownerDocument.activeElement
  if (!isHtmlElement(active) || !root.contains(active) || active === root) return null

  const after: HTMLElement[] = []
  const before: HTMLElement[] = []
  for (const candidate of getFocusableElements(root)) {
    if (candidate === active) continue
    const position = active.compareDocumentPosition(candidate)
    if (position & active.DOCUMENT_POSITION_FOLLOWING) after.push(candidate)
    else if (position & active.DOCUMENT_POSITION_PRECEDING) before.push(candidate)
  }
  before.reverse()

  const owner = active.closest<HTMLElement>(`[${A2UI_NODE_ATTR}]`)
  const ownedInSurface = owner && root.contains(owner) ? owner : null
  const instanceId = ownedInSurface?.getAttribute(A2UI_NODE_ATTR) ?? null
  const controlIndex = ownedInSurface
    ? Math.max(0, getHostControls(ownedInSurface, root).indexOf(active))
    : 0

  let selectionStart: number | null = null
  let selectionEnd: number | null = null
  if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') {
    try {
      const input = active as HTMLInputElement | HTMLTextAreaElement
      selectionStart = input.selectionStart
      selectionEnd = input.selectionEnd
    } catch {
      // Non-text input types (such as range, checkbox, or radio) do not expose selection ranges.
    }
  }

  return {
    active,
    instanceId,
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
      const input = target as HTMLInputElement | HTMLTextAreaElement
      input.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd)
    } catch {
      // Ignore inputs that disallow setting a selection range.
    }
  }
  if (snapshot.scrollTop > 0) target.scrollTop = snapshot.scrollTop
  if (snapshot.scrollLeft > 0) target.scrollLeft = snapshot.scrollLeft
}

/** Restores focus synchronously in an active document using the order documented in architecture.md. */
export function restoreFocusFallback(root: HTMLElement | null, snapshot: FocusSnapshot): void {
  if (!root || !root.isConnected) return
  const doc = root.ownerDocument
  if (typeof doc.hasFocus === 'function' && !doc.hasFocus()) return
  const current = doc.activeElement
  if (current && current !== doc.body && current !== doc.documentElement) return

  if (isFocusableWithin(snapshot.active, root, true)) {
    restoreControlState(snapshot.active, snapshot)
    return
  }

  if (snapshot.instanceId) {
    const movedHost = findNodeHost(root, snapshot.instanceId)
    if (movedHost) {
      const controls = getHostControls(movedHost, root)
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
    getFocusableElements(root)[0] ??
    root

  target.focus({ preventScroll: true })
}

export const A2UI_NODE_ENTRY_ANIMATION_ID = 'radiant-a2ui-entry'

const DEFAULT_ENTRY_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

/** Resolves entry targets for newly added rendered model instances in a single surface pass. */
export function collectNewNodeEntryTargets(
  root: HTMLElement,
  pendingInstanceIds: ReadonlySet<string>,
  seenElements: WeakSet<Element>
): HTMLElement[] {
  if (pendingInstanceIds.size === 0) return []
  const targets: HTMLElement[] = []
  const matchedIds = new Set<string>()
  const containers: HTMLElement[] = [root]

  for (const element of root.querySelectorAll<HTMLElement>(`[${A2UI_NODE_ATTR}]`)) {
    const instanceId = element.getAttribute(A2UI_NODE_ATTR)
    if (!instanceId) continue
    if (element.getAttribute('data-slot') === 'a2ui-column') {
      containers.push(element)
      if (pendingInstanceIds.has(instanceId)) matchedIds.add(instanceId)
      continue
    }
    if (pendingInstanceIds.has(instanceId)) {
      matchedIds.add(instanceId)
      if (!seenElements.has(element)) targets.push(element)
    }
  }

  if (matchedIds.size < pendingInstanceIds.size) {
    for (const container of containers) {
      for (const child of Array.from(container.children)) {
        if (
          isHtmlElement(child) &&
          !child.hasAttribute(A2UI_NODE_ATTR) &&
          !seenElements.has(child)
        ) {
          targets.push(child)
        }
      }
    }
  }

  return targets
}

/** Marks `root` and every current descendant element as seen. */
export function markTreeSeen(root: Element, seenElements: WeakSet<Element>): void {
  seenElements.add(root)
  for (const descendant of root.querySelectorAll('*')) {
    seenElements.add(descendant)
  }
}

function parseDurationMs(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.endsWith('ms')) {
    const parsed = Number.parseFloat(trimmed.slice(0, -2))
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
  }
  if (trimmed.endsWith('s')) {
    const parsed = Number.parseFloat(trimmed.slice(0, -1))
    return Number.isFinite(parsed) && parsed >= 0 ? parsed * 1000 : undefined
  }
  return undefined
}

/** Runs entry motion once on a newly mounted node host, ignoring invalid easing values safely. */
export function animateNodeEntry(
  element: HTMLElement,
  profile: MotionProfile
): Animation | undefined {
  if (profile.mode === 'off') return undefined
  const win = element.ownerDocument.defaultView
  if (!win) return undefined
  if (win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
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
