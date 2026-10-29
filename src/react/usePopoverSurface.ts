'use client'

import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { positionPopover, type PopoverAlign, type PopoverSide } from '../internal/popover.js'

// Each document owns its layers; imports never inspect a browser global.
const layers = new WeakMap<Document, HTMLElement[]>()

export function usePopoverSurface<Node extends HTMLElement>(
  nodeRef: RefObject<Node | null>,
  trigger: HTMLButtonElement | null,
  open: boolean,
  close: (restore: boolean) => void,
  restoreFocus: RefObject<boolean>,
  options: {
    initialFocusRef?: RefObject<HTMLElement | null>
    side: PopoverSide
    align: PopoverAlign
    sideOffset: number
    collisionPadding: number
  }
) {
  const latest = useRef({ ...options, open, close })
  const reposition = useRef(() => {})
  const ancestorClosing = useRef(false)
  const [generation, setGeneration] = useState(0)
  useLayoutEffect(() => {
    latest.current = { ...options, open, close }
  })
  const { side, align, sideOffset, collisionPadding } = options

  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node || !trigger) return
    const ancestors: HTMLElement[] = []
    for (let parent = trigger.parentElement; parent; parent = parent.parentElement) {
      if (parent.matches('dialog, [popover]')) ancestors.push(parent)
    }
    const reconcile = () => {
      if (!latest.current.open) return
      const visible = trigger.checkVisibility()
      if (!visible && node.matches(':popover-open')) {
        ancestorClosing.current = true
        latest.current.close(false)
        node.hidePopover()
        setGeneration(value => value + 1)
      } else if (visible && !node.matches(':popover-open')) setGeneration(value => value + 1)
    }
    const observer = new node.ownerDocument.defaultView!.MutationObserver(reconcile)
    for (const ancestor of ancestors) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['open', 'data-state'] })
      ancestor.addEventListener('toggle', reconcile)
    }
    return () => {
      observer.disconnect()
      for (const ancestor of ancestors) ancestor.removeEventListener('toggle', reconcile)
    }
  }, [nodeRef, trigger])

  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node || !trigger || !open || !trigger.checkVisibility() || generation < 0) return
    const doc = node.ownerDocument
    const win = doc.defaultView!
    const shouldRestore = () => restoreFocus.current
    const place = () => {
      if (!node.isConnected || !node.matches(':popover-open')) return
      const { side, align, sideOffset, collisionPadding } = latest.current
      const viewport = win.visualViewport
      const view = {
        top: viewport?.offsetTop ?? 0,
        left: viewport?.offsetLeft ?? 0,
        width: viewport?.width ?? win.innerWidth,
        height: viewport?.height ?? win.innerHeight
      }
      node.style.setProperty(
        '--_rad-popover-max-width',
        `${Math.max(0, view.width - 2 * collisionPadding)}px`
      )
      node.style.setProperty(
        '--_rad-popover-max-height',
        `${Math.max(0, view.height - 2 * collisionPadding)}px`
      )
      const css = win.getComputedStyle(node)
      const next = positionPopover({
        anchor: trigger.getBoundingClientRect(),
        width: node.offsetWidth,
        height:
          node.scrollHeight + parseFloat(css.borderTopWidth) + parseFloat(css.borderBottomWidth),
        viewport: view,
        side,
        align,
        offset: sideOffset,
        padding: collisionPadding,
        rtl: win.getComputedStyle(trigger).direction === 'rtl'
      })
      for (const key of ['left', 'top', 'maxWidth', 'maxHeight'] as const) {
        const property = key === 'maxWidth' ? 'max-width' : key === 'maxHeight' ? 'max-height' : key
        node.style.setProperty(`--_rad-popover-${property}`, `${next[key]}px`)
      }
      node.dataset.side = next.side
      node.dataset.align = next.align
    }
    // A manual native popover keeps controlled owners authoritative and avoids auto-stack reopen loops.
    // The source preserves the browser's logical Tab order without assigning content semantics.
    node.showPopover({ source: trigger })
    ancestorClosing.current = false
    reposition.current = place
    place()
    const target = latest.current.initialFocusRef?.current
    if (target && node.contains(target)) target.focus({ preventScroll: true })
    const stack = layers.get(doc) ?? []
    layers.set(doc, stack)
    const descendant = stack.findIndex(layer => node.contains(layer))
    if (descendant < 0) stack.push(node)
    else stack.splice(descendant, 0, node)
    let frame = 0
    const schedule = () => {
      if (!frame)
        frame = win.requestAnimationFrame(() => {
          frame = 0
          place()
        })
    }
    const inside = (target: EventTarget | null) =>
      target instanceof win.Node && (node.contains(target) || trigger.contains(target))
    let pointerDismissed = false
    const pointerEnd = () => {
      pointerDismissed = false
    }
    const outside = (event: PointerEvent | FocusEvent) => {
      if (
        event.type === 'focusin' &&
        (event.target === doc.body || event.target === doc.documentElement)
      )
        return
      if (event.type === 'focusin' && pointerDismissed) return
      if (event.type === 'pointerdown') pointerDismissed = !inside(event.target)
      if (!inside(event.target)) latest.current.close(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        stack.filter(layer => layer.matches(':popover-open')).at(-1) !== node
      )
        return
      const modal = Array.from(doc.querySelectorAll('dialog:modal')).at(-1)
      if (modal && !modal.contains(node)) return
      const nested =
        event.target instanceof win.Element ? event.target.closest('[popover]:popover-open') : null
      if (
        nested &&
        nested !== node &&
        node.contains(nested) &&
        nested.getAttribute('popover') !== 'manual'
      )
        return
      event.preventDefault()
      event.stopPropagation()
      latest.current.close(true)
    }
    const toggle = () => {
      if (ancestorClosing.current || node.matches(':popover-open') || !latest.current.open) return
      latest.current.close(true)
      // Native hide is an observation; a controlled owner may refuse the request.
      setGeneration(value => value + 1)
    }
    const observer = new win.ResizeObserver(schedule)
    const mutations = new win.MutationObserver(schedule)
    observer.observe(trigger)
    observer.observe(node)
    mutations.observe(node, { childList: true, subtree: true, characterData: true })
    node.addEventListener('toggle', toggle)
    doc.addEventListener('pointerdown', outside, true)
    doc.addEventListener('pointerup', pointerEnd, true)
    doc.addEventListener('pointercancel', pointerEnd, true)
    doc.addEventListener('focusin', outside)
    doc.addEventListener('keydown', escape)
    doc.addEventListener('scroll', schedule, true)
    win.addEventListener('resize', schedule)
    win.visualViewport?.addEventListener('resize', schedule)
    win.visualViewport?.addEventListener('scroll', schedule)
    return () => {
      observer.disconnect()
      mutations.disconnect()
      win.cancelAnimationFrame(frame)
      node.removeEventListener('toggle', toggle)
      doc.removeEventListener('pointerdown', outside, true)
      doc.removeEventListener('pointerup', pointerEnd, true)
      doc.removeEventListener('pointercancel', pointerEnd, true)
      doc.removeEventListener('focusin', outside)
      doc.removeEventListener('keydown', escape)
      doc.removeEventListener('scroll', schedule, true)
      win.removeEventListener('resize', schedule)
      win.visualViewport?.removeEventListener('resize', schedule)
      win.visualViewport?.removeEventListener('scroll', schedule)
      stack.splice(stack.indexOf(node), 1)
      if (!stack.length) layers.delete(doc)
      if (shouldRestore() && node.contains(doc.activeElement) && trigger.isConnected)
        trigger.focus({ preventScroll: true })
      if (node.matches(':popover-open')) node.hidePopover()
      reposition.current = () => {}
    }
  }, [nodeRef, trigger, open, generation, restoreFocus])
  useLayoutEffect(() => reposition.current(), [side, align, sideOffset, collisionPadding])
}
