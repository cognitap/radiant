'use client'

import {
  createContext,
  useLayoutEffect,
  type KeyboardEvent,
  type FocusEvent,
  type RefObject
} from 'react'

/** A surrounding composite may own all of its nested groups' tab stops. */
export const CompositeFocusContext = createContext<string | null>(null)

type Options<Node extends HTMLElement> = {
  host: RefObject<Node | null>
  selector: string
  scope: string
  preferred?: string | null
  orientation: 'horizontal' | 'vertical'
  loop: boolean
  active?: boolean
  deferTo?: string
  includeAriaDisabled?: boolean
}

/** Native hosts and DOM order stay authoritative, including dynamic disabled items. */
export function useRovingFocus<Node extends HTMLElement>({
  host,
  selector,
  scope,
  preferred,
  orientation,
  loop,
  active = true,
  deferTo,
  includeAriaDisabled = false
}: Options<Node>) {
  const ownsFocus = (node: Node) => {
    if (!active) return false
    const parent = deferTo ? node.parentElement?.closest(deferTo) : null
    const surface = node.closest('[popover], dialog')
    // React context crosses portals; native focus ownership stops at a new surface.
    return !parent || !!(surface && parent.contains(surface))
  }
  const items = (node: Node) =>
    Array.from(node.querySelectorAll<HTMLElement>(selector)).filter(item => {
      const surface = item.closest('[popover], dialog')
      return item.closest(scope) === node && (!surface || !node.contains(surface))
    })
  const enabled = (node: Node) => {
    const view = node.ownerDocument.defaultView!
    return items(node).filter(
      item =>
        !item.matches(':disabled') &&
        (includeAriaDisabled || item.getAttribute('aria-disabled') !== 'true') &&
        !item.closest('[inert], [hidden]') &&
        item.getClientRects().length > 0 &&
        !['hidden', 'collapse'].includes(view.getComputedStyle(item).visibility)
    )
  }
  const sync = (node: Node, preferFocus = true) => {
    const all = items(node),
      available = enabled(node)
    const focused = node.ownerDocument.activeElement
    const surface = focused?.closest('[popover], dialog')
    const nestedEntry =
      preferFocus &&
      surface &&
      node.contains(surface) &&
      available.find(item => item.tabIndex === 0)
    const entry =
      (preferFocus && available.find(item => item === focused)) ||
      nestedEntry ||
      available.find(item => item.dataset.value === preferred) ||
      available[0]
    for (const item of all) {
      const index = item === entry ? 0 : -1
      if (item.tabIndex !== index) item.tabIndex = index
    }
  }
  useLayoutEffect(() => {
    const node = host.current
    if (!node || !ownsFocus(node)) return
    const view = node.ownerDocument.defaultView!
    const reconcile = () => sync(node)
    reconcile()
    const observer = new view.MutationObserver(records => {
      if (
        records.some(
          record =>
            record.type === 'childList' ||
            record.target === node ||
            (record.target instanceof view.Element &&
              (record.target.matches(selector) || record.target.querySelector(selector)))
        )
      )
        reconcile()
    })
    observer.observe(node, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        'disabled',
        'aria-disabled',
        'hidden',
        'inert',
        'class',
        'style',
        'tabindex',
        'data-value'
      ]
    })
    // Native fieldsets can disable descendants without changing a button attribute.
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement)
      observer.observe(ancestor, {
        attributes: true,
        attributeFilter: ['disabled', 'hidden', 'inert', 'class', 'style']
      })
    const resize = new view.ResizeObserver(reconcile)
    resize.observe(node)
    return () => {
      observer.disconnect()
      resize.disconnect()
    }
  })
  return {
    items: enabled,
    onFocus(event: FocusEvent<Node>) {
      if (
        ownsFocus(event.currentTarget) &&
        enabled(event.currentTarget).some(
          item => item === event.currentTarget.ownerDocument.activeElement
        )
      )
        sync(event.currentTarget)
    },
    onBlur(event: FocusEvent<Node>) {
      if (ownsFocus(event.currentTarget) && !event.currentTarget.contains(event.relatedTarget))
        sync(event.currentTarget, false)
    },
    onKeyDown(event: KeyboardEvent<Node>) {
      if (
        !ownsFocus(event.currentTarget) ||
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.nativeEvent.isComposing
      )
        return
      const node = event.currentTarget,
        available = enabled(node),
        current = (event.target as Element).closest(selector),
        index = available.findIndex(item => item === current)
      if (index < 0) return
      const rtl = node.ownerDocument.defaultView!.getComputedStyle(node).direction === 'rtl'
      let next: number
      if (event.key === 'Home') next = 0
      else if (event.key === 'End') next = available.length - 1
      else {
        const forward = orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight',
          backward = orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
        if (event.key !== forward && event.key !== backward) return
        next = index + (event.key === forward ? 1 : -1)
        next = loop
          ? (next + available.length) % available.length
          : Math.max(0, Math.min(available.length - 1, next))
      }
      event.preventDefault()
      available[next]?.focus()
    }
  }
}
