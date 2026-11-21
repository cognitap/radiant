import { isPlainRecord } from '../catalog/coerce.js'
import type { MotionProfile } from '../motion/config.js'
import type { A2uiMessage } from './sanitize.js'

const MAX_COMPARE_DEPTH = 64

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

/**
 * Returns true when `previous` is a structurally equal prefix of `next`.
 * Structural matching avoids tearing down the live surface when callers recreate
 * message arrays or objects across React renders.
 */
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

const FOCUSABLE_SELECTOR =
  'a[href],area[href],button,input,select,textarea,summary,[tabindex],[contenteditable]:not([contenteditable="false"])'

function isHtmlElement(node: Element | null): node is HTMLElement {
  const win = node?.ownerDocument.defaultView
  return Boolean(node && win && node instanceof win.HTMLElement)
}

/**
 * Checks whether `element` is a currently reachable, focusable control inside `root`.
 */
export function isFocusableWithin(element: HTMLElement, root: HTMLElement): boolean {
  if (!element.isConnected || !root.contains(element) || element === root) return false
  if (element.tabIndex < 0) return false
  if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'hidden') return false
  if (element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true') return false
  if (element.closest('[hidden],[inert]')) return false
  if (element.getClientRects().length === 0) return false
  const win = element.ownerDocument.defaultView
  if (win && win.getComputedStyle(element).visibility === 'hidden') return false
  return true
}

export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(element =>
    isFocusableWithin(element, root)
  )
}

export type FocusSnapshot = {
  readonly active: HTMLElement
  readonly after: readonly HTMLElement[]
  readonly before: readonly HTMLElement[]
  readonly selectionStart: number | null
  readonly selectionEnd: number | null
}

/**
 * Captures the currently focused element inside `root` along with its surrounding
 * focusable controls in DOM order so focus can recover if a patch removes it.
 */
export function captureFocusSnapshot(root: HTMLElement | null): FocusSnapshot | null {
  if (!root || !root.isConnected) return null
  const active = root.ownerDocument.activeElement
  if (!isHtmlElement(active) || !root.contains(active) || active === root) return null

  const focusables = getFocusableElements(root)
  const index = focusables.indexOf(active)
  const after = index >= 0 ? focusables.slice(index + 1) : []
  const before = index >= 0 ? focusables.slice(0, index).reverse() : []

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

  return { active, after, before, selectionStart, selectionEnd }
}

/**
 * Restores focus if a patch caused focus to fall back to `document.body` (or null / root).
 * Fallback order:
 * 1. The previously focused element if it survived (e.g. after a DOM reorder blurred it).
 * 2. The next surviving focusable control in DOM order.
 * 3. The previous surviving focusable control in DOM order.
 * 4. The first focusable control currently in the surface.
 * 5. The surface root container itself (`tabIndex={-1}`).
 */
export function restoreFocusFallback(root: HTMLElement | null, snapshot: FocusSnapshot): void {
  if (!root || !root.isConnected) return
  const doc = root.ownerDocument
  const current = doc.activeElement
  if (current && current !== doc.body && current !== doc.documentElement) {
    return
  }

  if (isFocusableWithin(snapshot.active, root)) {
    snapshot.active.focus({ preventScroll: true })
    if (snapshot.selectionStart !== null && snapshot.selectionEnd !== null) {
      try {
        const input = snapshot.active as HTMLInputElement | HTMLTextAreaElement
        input.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd)
      } catch {
        // Ignore inputs that disallow setting a selection range.
      }
    }
    return
  }

  const target =
    snapshot.after.find(element => isFocusableWithin(element, root)) ??
    snapshot.before.find(element => isFocusableWithin(element, root)) ??
    getFocusableElements(root)[0] ??
    root

  target.focus({ preventScroll: true })
}

export const A2UI_NODE_ENTRY_ANIMATION_ID = 'radiant-a2ui-entry'

const LEAF_CONTROL_SLOTS = new Set([
  'field',
  'button',
  'a2ui-text',
  'a2ui-fallback',
  'a2ui-choice-picker',
  'checkbox',
  'radio',
  'slider',
  'input',
  'textarea',
  'toggle-group'
])

function hasSlotToken(slotValue: string, target: string): boolean {
  if (!slotValue) return false
  return slotValue.split(/\s+/).includes(target)
}

function hasLeafControlSlot(slotValue: string): boolean {
  if (!slotValue) return false
  return slotValue.split(/\s+/).some(token => LEAF_CONTROL_SLOTS.has(token))
}

/**
 * Collects top-level newly inserted node host elements inside `container` that have
 * never been seen before, descending through `a2ui-column` containers so each child
 * node animates individually while existing elements are never re-animated.
 */
export function collectEntryTargets(
  container: HTMLElement,
  seenElements: WeakSet<Element>,
  targets: HTMLElement[] = []
): HTMLElement[] {
  for (const child of Array.from(container.children)) {
    if (!isHtmlElement(child)) continue
    const slot = child.getAttribute('data-slot') ?? ''
    const isColumn = hasSlotToken(slot, 'a2ui-column')
    if (seenElements.has(child)) {
      if (isColumn || !hasLeafControlSlot(slot)) {
        collectEntryTargets(child, seenElements, targets)
      }
      continue
    }
    if (isColumn) {
      collectEntryTargets(child, seenElements, targets)
      continue
    }
    targets.push(child)
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

/**
 * Runs entry motion once on a newly mounted A2UI node host element using the active
 * Radiant motion profile and CSS motion tokens, skipping when motion is off or reduced.
 */
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
  const easing =
    styles.getPropertyValue('--rad-motion-release-ease').trim() || 'cubic-bezier(0.2, 0.8, 0.2, 1)'

  return element.animate([{ transform: 'translateY(6px)' }, { transform: 'translateY(0px)' }], {
    id: A2UI_NODE_ENTRY_ANIMATION_ID,
    duration,
    easing,
    fill: 'none'
  })
}
