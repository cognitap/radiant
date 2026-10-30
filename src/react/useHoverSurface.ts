'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'

/** Shared hover/focus timing, dismissal suppression and a bridge across the placement gap. */
export function useHoverSurface({
  trigger,
  content,
  open,
  request,
  openDelay,
  focusDelay = 0,
  closeDelay
}: {
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
      const view = trigger?.ownerDocument.defaultView
      if (!view) return
      timer.current = {
        view,
        id: view.setTimeout(() => {
          timer.current = null
          latest.current(next)
        }, delay)
      }
    },
    [trigger]
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
    if (!trigger || !open) return
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
      const a = trigger.getBoundingClientRect(),
        b = panel.getBoundingClientRect()
      const within =
        event.clientX >= Math.min(a.left, b.left) &&
        event.clientX <= Math.max(a.right, b.right) &&
        event.clientY >= Math.min(a.top, b.top) &&
        event.clientY <= Math.max(a.bottom, b.bottom)
      if (within) clear()
      else if (!timer.current) schedule(false, closeDelay)
    }
    trigger.ownerDocument.addEventListener('pointermove', move)
    return () => trigger.ownerDocument.removeEventListener('pointermove', move)
  }, [trigger, content, open, closeDelay, schedule])
  return {
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
