'use client'

import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { positionSelect } from '../internal/select.js'

/** Local top-layer popup: preserve theme/modal ancestry and place before its first paint. */
export function useComboboxPopup(
  nodeRef: RefObject<HTMLDivElement | null>,
  input: HTMLInputElement | null,
  open: boolean,
  dismiss: () => void,
  sideOffset: number,
  collisionPadding: number
) {
  const latest = useRef({ dismiss, open })
  const reposition = useRef<() => void>(() => {})
  const [generation, setGeneration] = useState(0)
  useLayoutEffect(() => {
    latest.current = { dismiss, open }
  })
  // A manual popup stays in the top layer after an ancestor dialog or popover closes.
  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node || !input) return
    const ancestors: HTMLElement[] = []
    for (let parent = input.parentElement; parent; parent = parent.parentElement) {
      if (parent.matches('dialog, [popover]')) ancestors.push(parent)
    }
    const reconcile = () => {
      if (!latest.current.open) return
      const visible = input.checkVisibility()
      if (!visible && node.matches(':popover-open')) {
        latest.current.dismiss()
        node.hidePopover()
        setGeneration(value => value + 1)
      } else if (visible && !node.matches(':popover-open')) setGeneration(value => value + 1)
    }
    const toggle = (event: Event) => {
      if (event.target === event.currentTarget) reconcile()
    }
    const view = input.ownerDocument.defaultView!
    const observer = new view.MutationObserver(reconcile)
    for (const ancestor of ancestors) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['open', 'data-state'] })
      ancestor.addEventListener('toggle', toggle)
    }
    return () => {
      observer.disconnect()
      for (const ancestor of ancestors) ancestor.removeEventListener('toggle', toggle)
    }
  }, [nodeRef, input])
  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node || !input) return
    if (!open || !input.checkVisibility()) {
      if (node.matches(':popover-open')) node.hidePopover()
      return
    }
    const doc = input.ownerDocument
    const win = doc.defaultView!
    const seedWidth = () => {
      const available =
        (win.visualViewport?.width ?? win.innerWidth) - 2 * Math.max(0, collisionPadding)
      node.style.setProperty(
        '--_rad-combobox-width',
        `${Math.min(input.getBoundingClientRect().width, Math.max(0, available))}px`
      )
    }
    seedWidth()
    node.showPopover()
    const place = () => {
      if (!node.isConnected || !node.matches(':popover-open')) return
      seedWidth()
      const viewport = win.visualViewport
      const css = win.getComputedStyle(node)
      const anchor = input.getBoundingClientRect()
      const padding = Math.max(0, collisionPadding)
      const list = node.querySelector<HTMLElement>('[data-slot~="combobox-listbox"]')
      const status = node.querySelector<HTMLElement>('[data-slot~="combobox-status"]')
      const naturalHeight =
        (list?.scrollHeight ?? node.scrollHeight) +
        (status?.offsetHeight ?? 0) +
        parseFloat(css.paddingTop) +
        parseFloat(css.paddingBottom) +
        parseFloat(css.borderTopWidth) +
        parseFloat(css.borderBottomWidth)
      const above = anchor.top - (viewport?.offsetTop ?? 0) - padding - sideOffset
      const below =
        (viewport?.offsetTop ?? 0) +
        (viewport?.height ?? win.innerHeight) -
        anchor.bottom -
        padding -
        sideOffset
      const next = positionSelect({
        trigger: anchor,
        width: node.getBoundingClientRect().width,
        height: Math.min(naturalHeight, Math.max(0, above, below)),
        selectedOffset: 0,
        viewport: {
          top: viewport?.offsetTop ?? 0,
          left: viewport?.offsetLeft ?? 0,
          width: viewport?.width ?? win.innerWidth,
          height: viewport?.height ?? win.innerHeight
        },
        padding: Math.max(0, collisionPadding),
        offset: sideOffset,
        aligned: false,
        rtl: win.getComputedStyle(input).direction === 'rtl'
      })
      for (const [key, value] of Object.entries({
        top: next.top,
        left: next.left,
        width: next.width,
        'max-height': next.maxHeight
      })) {
        const property = `--_rad-combobox-${key}`
        if (node.style.getPropertyValue(property) !== `${value}px`)
          node.style.setProperty(property, `${value}px`)
      }
    }
    reposition.current = place
    place()
    let frame = 0
    const schedule = () => {
      if (!frame)
        frame = win.requestAnimationFrame(() => {
          frame = 0
          place()
        })
    }
    const outside = (event: PointerEvent | FocusEvent) => {
      const target = event.target
      if (
        target instanceof win.Node &&
        !node.contains(target) &&
        !input.parentElement?.contains(target)
      )
        latest.current.dismiss()
    }
    const observer = new win.ResizeObserver(schedule)
    const mutations = new win.MutationObserver(schedule)
    observer.observe(input)
    observer.observe(node)
    mutations.observe(node, { childList: true, subtree: true, characterData: true })
    doc.addEventListener('pointerdown', outside, true)
    doc.addEventListener('focusin', outside)
    doc.addEventListener('scroll', schedule, true)
    win.addEventListener('resize', schedule)
    win.visualViewport?.addEventListener('resize', schedule)
    win.visualViewport?.addEventListener('scroll', schedule)
    return () => {
      reposition.current = () => {}
      observer.disconnect()
      mutations.disconnect()
      win.cancelAnimationFrame(frame)
      doc.removeEventListener('pointerdown', outside, true)
      doc.removeEventListener('focusin', outside)
      doc.removeEventListener('scroll', schedule, true)
      win.removeEventListener('resize', schedule)
      win.visualViewport?.removeEventListener('resize', schedule)
      win.visualViewport?.removeEventListener('scroll', schedule)
      if (node.matches(':popover-open')) node.hidePopover()
    }
  }, [nodeRef, input, open, sideOffset, collisionPadding, generation])
  // Selected tags can move an unchanged-size input without a resize event.
  useLayoutEffect(() => {
    reposition.current()
  })
}
