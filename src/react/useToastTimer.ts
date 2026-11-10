'use client'
import { useLayoutEffect, useRef, type RefObject } from 'react'
import { createToastTimer } from '../internal/toast.js'

export function useToastTimer(
  ref: RefObject<HTMLElement | null>,
  visible: boolean,
  duration: number,
  elapsed: () => void
) {
  const latest = useRef(elapsed)
  useLayoutEffect(() => {
    latest.current = elapsed
  })
  useLayoutEffect(() => {
    const node = ref.current
    if (!node || !visible || !duration) return
    const doc = node.ownerDocument
    const win = doc.defaultView!
    const timer = createToastTimer(
      duration,
      {
        now: () => win.performance.now(),
        set: (fn, delay) => win.setTimeout(fn, delay),
        clear: id => win.clearTimeout(id)
      },
      () => latest.current()
    )
    let hovering = node.matches(':hover')
    let touching = false
    const sync = () => {
      const paused = hovering || touching || node.contains(doc.activeElement) || doc.hidden
      node.toggleAttribute('data-paused', paused)
      if (paused) timer.pause()
      else timer.resume()
    }
    const enter = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      hovering = true
      sync()
    }
    const leave = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      hovering = false
      sync()
    }
    const press = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      touching = true
      sync()
    }
    const release = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || !touching) return
      touching = false
      sync()
    }
    node.addEventListener('pointerenter', enter)
    node.addEventListener('pointerleave', leave)
    node.addEventListener('pointerdown', press)
    node.addEventListener('focusin', sync)
    node.addEventListener('focusout', sync)
    doc.addEventListener('pointerup', release)
    doc.addEventListener('pointercancel', release)
    doc.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      timer.destroy()
      node.removeEventListener('pointerenter', enter)
      node.removeEventListener('pointerleave', leave)
      node.removeEventListener('pointerdown', press)
      node.removeEventListener('focusin', sync)
      node.removeEventListener('focusout', sync)
      doc.removeEventListener('pointerup', release)
      doc.removeEventListener('pointercancel', release)
      doc.removeEventListener('visibilitychange', sync)
      delete node.dataset.paused
    }
  }, [ref, visible, duration])
}
