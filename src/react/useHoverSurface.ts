'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { readAnchor, type PopoverAnchor } from '../internal/popover.js'

/** Shared hover/focus timing, dismissal suppression and a bridge across the placement gap. */
export function useHoverSurface({
  trigger,
  content,
  open,
  request,
  openDelay,
  focusDelay = 0,
  closeDelay,
  anchor
}: {
  anchor?: PopoverAnchor | null
  trigger: HTMLElement | null
  content: RefObject<HTMLElement | null>
  open: boolean
  request: (open: boolean) => void
  openDelay: number
  focusDelay?: number
  closeDelay: number
}) {
  const timer = useRef<{ view: Window; id: number } | null>(null)
  const activity = useRef({ focused: false, hovered: false, suppressed: false, touch: false })
  const latest = useRef(request)
  const clear = () => {
    if (timer.current) timer.current.view.clearTimeout(timer.current.id)
    timer.current = null
  }
  useEffect(() => {
    latest.current = request
  })
  useEffect(() => () => clear(), [])
  const previousOpen = useRef(open)
  useEffect(() => {
    if (!open) {
      clear()
      if (previousOpen.current)
        activity.current.suppressed = activity.current.focused || activity.current.hovered
    }
    previousOpen.current = open
  }, [open])
  const schedule = useCallback(
    (next: boolean, delay: number) => {
      clear()
      const view = (trigger ?? content.current)?.ownerDocument.defaultView
      if (!view) return
      timer.current = {
        view,
        id: view.setTimeout(() => {
          timer.current = null
          latest.current(next)
        }, delay)
      }
    },
    [trigger, content]
  )
  const setOpen = (next: boolean) => {
    clear()
    activity.current.suppressed = !next
    request(next)
  }
  const dismiss = () => setOpen(false)
  const enter = (focus = false) => {
    const wasFocused = activity.current.focused
    if (focus && !wasFocused) activity.current.suppressed = false
    if (focus) activity.current.focused = true
    else activity.current.hovered = true
    clear()
    if (activity.current.suppressed || activity.current.touch || open || (focus && wasFocused))
      return
    if (focus && focusDelay === 0) request(true)
    else schedule(true, focus ? focusDelay : openDelay)
  }
  const leave = (focus = false) => {
    if (focus) {
      activity.current.focused = false
      activity.current.touch = false
    } else activity.current.hovered = false
    if (activity.current.focused || activity.current.hovered) return
    activity.current.suppressed = false
    schedule(false, closeDelay)
  }
  useEffect(() => {
    const doc = (trigger ?? content.current)?.ownerDocument
    if (!doc || !open || (!trigger && !anchor)) return
    const move = (event: PointerEvent) => {
      if (
        event.pointerType === 'touch' ||
        activity.current.focused ||
        activity.current.hovered ||
        activity.current.suppressed
      )
        return
      const panel = content.current
      if (!panel) return
      // The bridge spans the anchor (or trigger) and the panel, so the pointer can cross the gap.
      const a = readAnchor(anchor ?? trigger),
        b = panel.getBoundingClientRect()
      if (!a) return
      const within =
        event.clientX >= Math.min(a.x, b.left) &&
        event.clientX <= Math.max(a.x + a.width, b.right) &&
        event.clientY >= Math.min(a.y, b.top) &&
        event.clientY <= Math.max(a.y + a.height, b.bottom)
      if (within) clear()
      else if (!timer.current) schedule(false, closeDelay)
    }
    doc.addEventListener('pointermove', move)
    return () => doc.removeEventListener('pointermove', move)
  }, [trigger, anchor, content, open, closeDelay, schedule])
  return {
    cancel: (reset = false) => {
      clear()
      if (reset)
        activity.current = { focused: false, hovered: false, suppressed: false, touch: false }
    },
    setOpen,
    enter,
    leave,
    dismiss,
    touch: () => {
      activity.current.touch = true
      dismiss()
    }
  }
}
