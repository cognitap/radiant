'use client'

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

/** Native reset can be cancelled and the form owner can live outside the subtree. */
export function useFormReset(inputRef: RefObject<HTMLInputElement | null>, onReset: () => void) {
  const latest = useRef(onReset)
  useLayoutEffect(() => {
    latest.current = onReset
  })
  useEffect(() => {
    const input = inputRef.current
    const view = input?.ownerDocument.defaultView
    if (!input || !view) return
    const root = input.getRootNode()
    let timer: number | undefined
    const reset = (event: Event) => {
      if (event.target !== inputRef.current?.form) return
      view.clearTimeout(timer)
      timer = view.setTimeout(() => {
        if (!event.defaultPrevented && inputRef.current?.isConnected) latest.current()
      }, 0)
    }
    root.addEventListener('reset', reset, true)
    return () => {
      root.removeEventListener('reset', reset, true)
      view.clearTimeout(timer)
    }
  }, [inputRef])
}
