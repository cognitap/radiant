'use client'

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { sameSelection } from '../internal/selection.js'

type Options = {
  values: string[]
  controlled: boolean
  pending: RefObject<string[] | null>
  validity: string
  form?: string
  reset(): void
}
/** A nameless JSON carrier emits array changes; named hidden controls submit each original string. */
export function useArrayFormBridge({ pending: pendingRef, ...options }: Options) {
  const ref = useRef<HTMLInputElement>(null),
    latest = useRef(options)
  useLayoutEffect(() => {
    latest.current = options
    const node = ref.current
    if (!node) return
    const value = JSON.stringify(options.values)
    const user = pendingRef.current !== null && sameSelection(pendingRef.current, options.values)
    if (user) {
      Object.getOwnPropertyDescriptor(
        node.ownerDocument.defaultView!.HTMLInputElement.prototype,
        'value'
      )!.set!.call(node, value)
    } else node.value = value
    if (options.controlled) node.defaultValue = value
    node.setCustomValidity(options.validity)
    if (user) {
      pendingRef.current = null
      const EventType = node.ownerDocument.defaultView!.Event
      node.dispatchEvent(new EventType('input', { bubbles: true }))
      node.dispatchEvent(new EventType('change', { bubbles: true }))
    }
  })
  useEffect(() => {
    const node = ref.current,
      owner = node?.form
    if (!node || !owner) return
    const view = node.ownerDocument.defaultView!
    let timer: number | undefined
    const reset = (event: Event) => {
      view.clearTimeout(timer)
      timer = view.setTimeout(() => {
        if (event.defaultPrevented || !node.isConnected) return
        pendingRef.current = null
        latest.current.reset()
      }, 0)
    }
    owner.addEventListener('reset', reset)
    return () => {
      owner.removeEventListener('reset', reset)
      view.clearTimeout(timer)
    }
  }, [options.form, pendingRef])
  return ref
}
