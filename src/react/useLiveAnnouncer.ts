'use client'

import { useEffect, useRef } from 'react'

/** Lets the focus re-announcement settle before a move is read. */
const ANNOUNCE_DELAY = 500

/**
 * A polite live region: each message clears the region, then fills it after a short delay so
 * repeated text is read again. Attach `ref` to an `aria-live="polite"` element.
 */
export function useLiveAnnouncer() {
  const ref = useRef<HTMLSpanElement>(null)
  const stop = useRef<(() => void) | undefined>(undefined)
  useEffect(() => () => stop.current?.(), [])
  const announce = (message: string) => {
    const node = ref.current
    if (!node) return
    const view = node.ownerDocument.defaultView!
    stop.current?.()
    node.textContent = ''
    const timer = view.setTimeout(() => {
      node.textContent = message
    }, ANNOUNCE_DELAY)
    stop.current = () => view.clearTimeout(timer)
  }
  return { ref, announce }
}
