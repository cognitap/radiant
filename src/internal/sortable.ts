/**
 * Known items in the requested order: repeated values and values without an item drop, and
 * items missing from the order (such as ones that stream in later) follow in source order.
 */
export function arrangeOrder(order: readonly string[], known: readonly string[]): string[] {
  const present = new Set(known)
  const seen = new Set<string>()
  const placed: string[] = []
  for (const value of order)
    if (present.has(value) && !seen.has(value)) {
      seen.add(value)
      placed.push(value)
    }
  return [...placed, ...known.filter(value => !seen.has(value))]
}

/** The order with `value` moved to `index`, clamped to the list. */
export function moveItem(order: readonly string[], value: string, index: number): string[] {
  const rest = order.filter(item => item !== value)
  const at = Math.max(0, Math.min(rest.length, index))
  return [...rest.slice(0, at), value, ...rest.slice(at)]
}

/** The drop index among the other items: how many of their midpoints lie before the pointer. */
export function dropIndex(midpoints: readonly number[], pointer: number): number {
  return midpoints.filter(midpoint => midpoint < pointer).length
}

/** The nearest ancestor that scrolls vertically, or the document's scroller. */
export function scrollerOf(node: HTMLElement) {
  const view = node.ownerDocument.defaultView!
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const overflow = view.getComputedStyle(parent).overflowY
    if (/auto|scroll|overlay/.test(overflow) && parent.scrollHeight > parent.clientHeight)
      return parent
  }
  return node.ownerDocument.scrollingElement as HTMLElement | null
}

/** Autoscroll speed, in pixels per second, with the pointer one zone into an edge. */
const SCROLL_SPEED = 600

/**
 * Scrolls toward the pointer while it is within `size` (at most a third of the scroller) of a
 * top or bottom edge, faster the deeper it goes, for `elapsed` milliseconds.
 */
export function autoscroll(scroller: HTMLElement, pointerY: number, size: number, elapsed: number) {
  const doc = scroller.ownerDocument,
    view = doc.defaultView!
  const page = scroller === doc.scrollingElement
  const box = page ? { top: 0, bottom: view.innerHeight } : scroller.getBoundingClientRect()
  const zone = Math.min(size, (box.bottom - box.top) / 3)
  const into =
    pointerY < box.top + zone
      ? pointerY - box.top - zone
      : pointerY > box.bottom - zone
        ? pointerY - box.bottom + zone
        : 0
  const speed = Math.max(-2, Math.min(2, into / zone)) * SCROLL_SPEED
  if (speed) scroller.scrollTop += (speed * elapsed) / 1000
}

export type PointerSession = {
  /** Starts calling `frame` on every animation frame until cleanup. */
  frames(): void
  cleanup(): void
}

/**
 * Captures a pointer on `handle` and follows it through the document: moves, release, cancel or
 * lost capture, and Escape. A capture the browser refuses still sees the release.
 */
export function capturePointer(
  handle: HTMLElement,
  pointerId: number,
  on: {
    move(event: PointerEvent): void
    frame(elapsed: number): void
    release(commit: boolean): void
    escape(event: KeyboardEvent): void
  }
): PointerSession {
  const doc = handle.ownerDocument,
    view = doc.defaultView!
  let frame: number | undefined,
    last: number | undefined,
    active = true
  const loop = (time: number) => {
    if (!active) return
    const elapsed = Math.min(50, last === undefined ? 16 : time - last)
    last = time
    on.frame(elapsed)
    if (active) frame = view.requestAnimationFrame(loop)
  }
  const move = (next: PointerEvent) => {
    if (next.pointerId === pointerId) on.move(next)
  }
  const up = (next: PointerEvent) => {
    if (next.pointerId === pointerId) on.release(true)
  }
  const cancel = (next: PointerEvent) => {
    if (next.pointerId === pointerId) on.release(false)
  }
  const escape = (next: KeyboardEvent) => {
    if (next.key === 'Escape') on.escape(next)
  }
  try {
    handle.setPointerCapture(pointerId)
  } catch {
    /* Document listeners still see the release. */
  }
  doc.addEventListener('pointermove', move)
  doc.addEventListener('pointerup', up)
  doc.addEventListener('pointercancel', cancel)
  doc.addEventListener('keydown', escape)
  handle.addEventListener('lostpointercapture', cancel)
  return {
    frames() {
      if (active && frame === undefined) frame = view.requestAnimationFrame(loop)
    },
    cleanup() {
      active = false
      if (frame !== undefined) view.cancelAnimationFrame(frame)
      doc.removeEventListener('pointermove', move)
      doc.removeEventListener('pointerup', up)
      doc.removeEventListener('pointercancel', cancel)
      doc.removeEventListener('keydown', escape)
      handle.removeEventListener('lostpointercapture', cancel)
      if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId)
    }
  }
}

/**
 * Glides a released item from where the pointer left it (`from`, viewport coordinates of its
 * top-left corner) into its place, then calls `done`; snaps when `off`, under reduced motion, or
 * when it is already there. Returns a cleanup for an interrupted glide.
 */
export function glideHome(
  item: HTMLElement,
  from: { x?: number; y: number },
  transition: string,
  off: boolean,
  done: () => void
): (() => void) | undefined {
  const view = item.ownerDocument.defaultView!
  const clear = () => {
    item.style.removeProperty('transition')
    item.style.removeProperty('translate')
  }
  item.style.removeProperty('translate')
  const rect = item.getBoundingClientRect()
  const dx = from.x === undefined ? 0 : from.x - rect.left,
    dy = from.y - rect.top
  if (
    off ||
    (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) ||
    view.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    done()
    return
  }
  item.style.transition = 'none'
  item.style.translate = `${from.x === undefined ? 0 : dx}px ${dy}px`
  item.getBoundingClientRect()
  item.style.transition = transition
  item.style.translate = '0px 0px'
  let fallback = 0
  const end = () => {
    view.clearTimeout(fallback)
    item.removeEventListener('transitionend', end)
    clear()
    done()
  }
  item.addEventListener('transitionend', end)
  fallback = view.setTimeout(end, 1000)
  return () => {
    view.clearTimeout(fallback)
    item.removeEventListener('transitionend', end)
    clear()
  }
}
